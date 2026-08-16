CREATE INDEX orders_customer_created_at_id_desc_idx
  ON orders (customer_id, created_at DESC, id DESC);
