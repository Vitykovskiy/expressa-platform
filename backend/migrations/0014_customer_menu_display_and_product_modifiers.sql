ALTER TABLE products
  ADD COLUMN display_label text,
  ADD CONSTRAINT products_display_label_not_blank CHECK (display_label IS NULL OR btrim(display_label) <> '');

ALTER TABLE product_variants
  ADD COLUMN display_label text,
  ADD CONSTRAINT product_variants_display_label_not_blank CHECK (display_label IS NULL OR btrim(display_label) <> '');

CREATE TABLE product_modifier_groups (
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES modifier_groups (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  PRIMARY KEY (product_id, group_id),
  UNIQUE (product_id, sort_order)
);
