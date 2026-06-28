CREATE TABLE IF NOT EXISTS drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vod_id UUID NOT NULL REFERENCES vods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL CHECK (timestamp_seconds >= 0),
  drawing_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(drawing_json) = 'array')
);

CREATE INDEX idx_drawings_vod_id ON drawings(vod_id);
CREATE INDEX idx_drawings_user_id ON drawings(user_id);
CREATE INDEX idx_drawings_vod_timestamp ON drawings(vod_id, timestamp_seconds);
