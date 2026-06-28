CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vod_id UUID NOT NULL REFERENCES vods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_kind TEXT NOT NULL CHECK (note_kind IN ('general', 'timestamped')),
  timestamp_seconds INTEGER,
  note_text TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (note_kind = 'general' AND timestamp_seconds IS NULL)
    OR
    (note_kind = 'timestamped' AND timestamp_seconds IS NOT NULL AND timestamp_seconds >= 0)
  )
);

CREATE INDEX idx_notes_vod_id ON notes(vod_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_vod_timestamp ON notes(vod_id, timestamp_seconds);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
