ALTER TABLE service_settings
  ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN updated_by uuid REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN updated_at timestamptz;

ALTER TABLE service_settings
  ADD CONSTRAINT service_settings_id_key UNIQUE (id);
