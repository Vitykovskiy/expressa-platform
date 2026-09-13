CREATE TABLE auth_otp_security_throttles (
  scope text NOT NULL CHECK (scope IN ('phone', 'source', 'provider')),
  throttle_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  PRIMARY KEY (scope, throttle_key)
);
