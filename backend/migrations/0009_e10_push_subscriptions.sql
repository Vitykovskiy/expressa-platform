CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  endpoint text NOT NULL CHECK (btrim(endpoint) <> ''),
  p256dh text NOT NULL CHECK (btrim(p256dh) <> ''),
  auth text NOT NULL CHECK (btrim(auth) <> ''),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (endpoint)
);

CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions (user_id);
