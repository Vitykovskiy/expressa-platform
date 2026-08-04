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

CREATE UNIQUE INDEX otp_challenges_one_open_per_phone
  ON otp_challenges (phone_e164)
  WHERE consumed_at IS NULL;

CREATE INDEX otp_challenges_open_expires_at
  ON otp_challenges (expires_at)
  WHERE consumed_at IS NULL;

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
