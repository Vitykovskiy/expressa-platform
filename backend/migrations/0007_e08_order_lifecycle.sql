ALTER TYPE order_stage ADD VALUE 'ACCEPTED';
ALTER TYPE order_stage ADD VALUE 'PREPARING';
ALTER TYPE order_stage ADD VALUE 'READY';
ALTER TYPE order_stage ADD VALUE 'ISSUED';

CREATE TABLE order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  occurred_at timestamptz NOT NULL,
  from_stage order_stage NOT NULL,
  to_stage order_stage NOT NULL,
  CHECK (from_stage <> to_stage)
);

CREATE INDEX order_events_order_id_occurred_at_idx
  ON order_events (order_id, occurred_at, id);

CREATE INDEX orders_stage_created_at_idx
  ON orders (stage, created_at, id);
