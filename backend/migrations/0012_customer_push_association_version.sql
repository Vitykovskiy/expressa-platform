ALTER TABLE push_subscriptions
  ADD COLUMN association_version uuid NOT NULL DEFAULT gen_random_uuid();
