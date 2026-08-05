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

CREATE INDEX audit_events_actor_created_at_index
  ON audit_events (actor_id, created_at DESC);

CREATE INDEX audit_events_entity_created_at_index
  ON audit_events (entity_type, entity_id, created_at DESC);

ALTER TABLE product_variants
  DROP CONSTRAINT product_variants_product_id_size_key;

CREATE UNIQUE INDEX product_variants_current_product_size_unique
  ON product_variants (product_id, size)
  WHERE archived_at IS NULL;
