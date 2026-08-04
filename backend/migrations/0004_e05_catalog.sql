CREATE TYPE product_type AS ENUM ('DRINK', 'OTHER');

CREATE TYPE product_size AS ENUM ('S', 'M', 'L');

CREATE TYPE modifier_selection_type AS ENUM ('single', 'multiple');

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz
);

CREATE UNIQUE INDEX categories_active_sort_order_unique
  ON categories (sort_order)
  WHERE is_active AND archived_at IS NULL;

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  type product_type NOT NULL,
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  price_minor integer,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  CHECK (
    (type = 'DRINK' AND price_minor IS NULL)
    OR (type = 'OTHER' AND price_minor IS NOT NULL AND price_minor >= 0)
  ),
  UNIQUE (id, type)
);

CREATE UNIQUE INDEX products_active_category_sort_order_unique
  ON products (category_id, sort_order)
  WHERE is_active AND archived_at IS NULL;

CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_type product_type NOT NULL DEFAULT 'DRINK' CHECK (product_type = 'DRINK'),
  size product_size NOT NULL,
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  UNIQUE (product_id, size),
  FOREIGN KEY (product_id, product_type) REFERENCES products (id, type) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX product_variants_current_sort_order_unique
  ON product_variants (product_id, sort_order)
  WHERE archived_at IS NULL;

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
  price_delta_minor integer NOT NULL,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  is_default boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz
);

CREATE UNIQUE INDEX modifier_options_current_sort_order_unique
  ON modifier_options (group_id, sort_order)
  WHERE archived_at IS NULL;

CREATE TABLE category_modifier_groups (
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES modifier_groups (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  PRIMARY KEY (category_id, group_id),
  UNIQUE (category_id, sort_order)
);
