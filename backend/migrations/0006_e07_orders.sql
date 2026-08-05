CREATE TYPE order_stage AS ENUM ('CREATED');

CREATE TABLE service_settings (
  key text PRIMARY KEY CHECK (key = 'accepts_new_orders'),
  value boolean NOT NULL DEFAULT true
);

INSERT INTO service_settings (key, value)
VALUES ('accepts_new_orders', true);

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
  total_minor integer NOT NULL CHECK (total_minor >= 0),
  order_day date NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date),
  daily_number smallint NOT NULL CHECK (daily_number BETWEEN 1 AND 999),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (number = to_char(order_day, 'YYYYMMDD') || '-' || lpad(daily_number::text, 3, '0')),
  UNIQUE (customer_id, idempotency_key),
  UNIQUE (order_day, daily_number)
);

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_id_product_id_size_key UNIQUE (id, product_id, size);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  variant_id uuid,
  product_name text NOT NULL CHECK (btrim(product_name) <> ''),
  size product_size,
  quantity smallint NOT NULL CHECK (quantity >= 1),
  unit_total_minor integer NOT NULL CHECK (unit_total_minor >= 0),
  line_total_minor integer NOT NULL CHECK (line_total_minor >= 0),
  CHECK (line_total_minor = unit_total_minor * quantity),
  CHECK (
    (variant_id IS NULL AND size IS NULL)
    OR (variant_id IS NOT NULL AND size IS NOT NULL)
  ),
  FOREIGN KEY (variant_id, product_id, size)
    REFERENCES product_variants (id, product_id, size) ON DELETE RESTRICT,
  UNIQUE (order_id, sort_order)
);

CREATE TABLE order_item_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items (id) ON DELETE CASCADE,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  modifier_option_id uuid NOT NULL REFERENCES modifier_options (id) ON DELETE RESTRICT,
  modifier_name text NOT NULL CHECK (btrim(modifier_name) <> ''),
  price_delta_minor integer NOT NULL,
  UNIQUE (order_item_id, modifier_option_id),
  UNIQUE (order_item_id, sort_order)
);
