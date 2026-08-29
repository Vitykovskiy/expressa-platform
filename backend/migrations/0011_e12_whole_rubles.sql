DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT price_minor AS amount FROM products WHERE price_minor IS NOT NULL
      UNION ALL
      SELECT price_minor FROM product_variants
      UNION ALL
      SELECT price_delta_minor FROM modifier_options
      UNION ALL
      SELECT total_minor FROM orders
      UNION ALL
      SELECT unit_total_minor FROM order_items
      UNION ALL
      SELECT line_total_minor FROM order_items
      UNION ALL
      SELECT price_delta_minor FROM order_item_modifiers
    ) AS monetary_values
    WHERE amount < 0 OR amount % 100 <> 0
  ) THEN
    RAISE EXCEPTION 'whole-ruble migration requires nonnegative amounts divisible by 100';
  END IF;
END $$;

UPDATE products SET price_minor = price_minor / 100 WHERE price_minor IS NOT NULL;
UPDATE product_variants SET price_minor = price_minor / 100;
UPDATE modifier_options SET price_delta_minor = price_delta_minor / 100;
UPDATE orders SET total_minor = total_minor / 100;
UPDATE order_items
SET unit_total_minor = unit_total_minor / 100,
    line_total_minor = line_total_minor / 100;
UPDATE order_item_modifiers SET price_delta_minor = price_delta_minor / 100;

ALTER TABLE products RENAME COLUMN price_minor TO price;
ALTER TABLE product_variants RENAME COLUMN price_minor TO price;
ALTER TABLE modifier_options RENAME COLUMN price_delta_minor TO price_delta;
ALTER TABLE orders RENAME COLUMN total_minor TO total;
ALTER TABLE order_items RENAME COLUMN unit_total_minor TO unit_total;
ALTER TABLE order_items RENAME COLUMN line_total_minor TO line_total;
ALTER TABLE order_item_modifiers RENAME COLUMN price_delta_minor TO price_delta;

ALTER TABLE products RENAME CONSTRAINT products_check TO products_type_price_check;
ALTER TABLE product_variants RENAME CONSTRAINT product_variants_price_minor_check TO product_variants_price_check;
ALTER TABLE orders RENAME CONSTRAINT orders_total_minor_check TO orders_total_check;
ALTER TABLE order_items RENAME CONSTRAINT order_items_unit_total_minor_check TO order_items_unit_total_check;
ALTER TABLE order_items RENAME CONSTRAINT order_items_line_total_minor_check TO order_items_line_total_check;
ALTER TABLE order_items RENAME CONSTRAINT order_items_check TO order_items_line_total_matches_unit_total_check;

ALTER TABLE modifier_options
  ADD CONSTRAINT modifier_options_price_delta_check CHECK (price_delta >= 0);

ALTER TABLE order_item_modifiers
  ADD CONSTRAINT order_item_modifiers_price_delta_check CHECK (price_delta >= 0);
