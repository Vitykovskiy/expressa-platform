CREATE TYPE user_role AS ENUM ('customer', 'barista', 'administrator');
CREATE TYPE modifier_selection_type AS ENUM ('single', 'multiple');
CREATE TYPE order_stage AS ENUM ('CREATED', 'ACCEPTED', 'PREPARING', 'READY', 'ISSUED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE CHECK (phone_e164 ~ '^\+7[0-9]{10}$'),
  role user_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^\+7[0-9]{10}$'),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  consumed_at timestamptz,
  sent_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (expires_at > sent_at),
  CHECK (consumed_at IS NULL OR consumed_at >= sent_at)
);
CREATE UNIQUE INDEX otp_challenges_one_open_per_phone ON otp_challenges (phone_e164) WHERE consumed_at IS NULL;
CREATE INDEX otp_challenges_open_expires_at ON otp_challenges (expires_at) WHERE consumed_at IS NULL;

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  refresh_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rotated_at timestamptz,
  CHECK (expires_at > created_at),
  CHECK (revoked_at IS NULL OR revoked_at >= created_at),
  CHECK (rotated_at IS NULL OR rotated_at >= created_at)
);
CREATE INDEX sessions_user_id ON sessions (user_id);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz
);
CREATE UNIQUE INDEX categories_active_sort_order_unique ON categories (sort_order) WHERE is_active AND archived_at IS NULL;

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  price integer CHECK (price IS NULL OR price >= 0),
  portion_label text CHECK (portion_label IS NULL OR btrim(portion_label) <> ''),
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz
);
CREATE UNIQUE INDEX products_active_category_sort_order_unique ON products (category_id, sort_order) WHERE is_active AND archived_at IS NULL;

CREATE TABLE product_price_choices (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  portion_label text NOT NULL CHECK (btrim(portion_label) <> ''),
  price integer NOT NULL CHECK (price >= 0),
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  UNIQUE (id, product_id)
);
CREATE UNIQUE INDEX product_price_choices_current_sort_unique ON product_price_choices (product_id, sort_order) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX product_price_choices_current_label_unique ON product_price_choices (product_id, lower(regexp_replace(btrim(portion_label), '[[:space:]]+', ' ', 'g'))) WHERE archived_at IS NULL;

CREATE TABLE modifier_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  selection_type modifier_selection_type NOT NULL,
  min_select integer NOT NULL CHECK (min_select >= 0),
  max_select integer NOT NULL CHECK (max_select >= min_select),
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  CHECK (selection_type <> 'single' OR max_select = 1)
);

CREATE TABLE modifier_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES modifier_groups (id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (btrim(name) <> ''),
  price_delta integer NOT NULL CHECK (price_delta >= 0),
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_default boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz
);
CREATE UNIQUE INDEX modifier_options_current_sort_order_unique ON modifier_options (group_id, sort_order) WHERE archived_at IS NULL;

CREATE TABLE category_modifier_groups (
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES modifier_groups (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  PRIMARY KEY (category_id, group_id),
  UNIQUE (category_id, sort_order)
);

CREATE TABLE product_modifier_groups (
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES modifier_groups (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  PRIMARY KEY (product_id, group_id),
  UNIQUE (product_id, sort_order)
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (btrim(entity_type) <> ''),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (btrim(action) <> ''),
  before_state jsonb NOT NULL,
  after_state jsonb NOT NULL,
  request_id text NOT NULL CHECK (btrim(request_id) <> ''),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX audit_events_actor_created_at_index ON audit_events (actor_id, created_at DESC);
CREATE INDEX audit_events_entity_created_at_index ON audit_events (entity_type, entity_id, created_at DESC);

CREATE TABLE service_settings (
  key text PRIMARY KEY CHECK (key = 'accepts_new_orders'),
  value boolean NOT NULL DEFAULT true,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_by uuid REFERENCES users (id) ON DELETE SET NULL,
  updated_at timestamptz,
  UNIQUE (id)
);
INSERT INTO service_settings (key, value) VALUES ('accepts_new_orders', true);

CREATE TABLE order_daily_counters (
  order_day date PRIMARY KEY,
  last_number smallint NOT NULL CHECK (last_number BETWEEN 1 AND 999)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  idempotency_key uuid NOT NULL,
  request_fingerprint text NOT NULL CHECK (btrim(request_fingerprint) <> ''),
  stage order_stage NOT NULL DEFAULT 'CREATED',
  total integer NOT NULL CHECK (total >= 0),
  order_day date NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date),
  daily_number smallint NOT NULL CHECK (daily_number BETWEEN 1 AND 999),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (number = to_char(order_day, 'YYYYMMDD') || '-' || lpad(daily_number::text, 3, '0')),
  UNIQUE (customer_id, idempotency_key),
  UNIQUE (order_day, daily_number)
);
CREATE INDEX orders_stage_created_at_idx ON orders (stage, created_at, id);
CREATE INDEX orders_customer_created_at_id_desc_idx ON orders (customer_id, created_at DESC, id DESC);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  price_choice_id uuid,
  product_name text NOT NULL CHECK (btrim(product_name) <> ''),
  portion_label text CHECK (portion_label IS NULL OR btrim(portion_label) <> ''),
  quantity smallint NOT NULL CHECK (quantity >= 1),
  unit_total integer NOT NULL CHECK (unit_total >= 0),
  line_total integer NOT NULL CHECK (line_total >= 0),
  CHECK (line_total = unit_total * quantity),
  FOREIGN KEY (price_choice_id, product_id) REFERENCES product_price_choices (id, product_id) ON DELETE RESTRICT,
  UNIQUE (order_id, sort_order)
);

CREATE TABLE order_item_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items (id) ON DELETE CASCADE,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  modifier_option_id uuid NOT NULL REFERENCES modifier_options (id) ON DELETE RESTRICT,
  modifier_name text NOT NULL CHECK (btrim(modifier_name) <> ''),
  price_delta integer NOT NULL CHECK (price_delta >= 0),
  UNIQUE (order_item_id, modifier_option_id),
  UNIQUE (order_item_id, sort_order)
);

CREATE TABLE order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  occurred_at timestamptz NOT NULL,
  from_stage order_stage NOT NULL,
  to_stage order_stage NOT NULL,
  CHECK (from_stage <> to_stage)
);
CREATE INDEX order_events_order_id_occurred_at_idx ON order_events (order_id, occurred_at, id);

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  endpoint text NOT NULL CHECK (btrim(endpoint) <> ''),
  p256dh text NOT NULL CHECK (btrim(p256dh) <> ''),
  auth text NOT NULL CHECK (btrim(auth) <> ''),
  association_version uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (endpoint)
);
CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions (user_id);

CREATE TABLE auth_otp_security_throttles (
  scope text NOT NULL CHECK (scope IN ('phone', 'source', 'provider')),
  throttle_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  PRIMARY KEY (scope, throttle_key)
);
