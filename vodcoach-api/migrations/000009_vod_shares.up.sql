CREATE TABLE IF NOT EXISTS vod_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vod_id UUID NOT NULL REFERENCES vods(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment')),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vod_shares_vod_id ON vod_shares(vod_id);
CREATE INDEX idx_vod_shares_owner_user_id ON vod_shares(owner_user_id);
CREATE INDEX idx_vod_shares_token_hash ON vod_shares(token_hash);

ALTER TABLE notes
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_name TEXT;

ALTER TABLE drawings
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_name TEXT;
