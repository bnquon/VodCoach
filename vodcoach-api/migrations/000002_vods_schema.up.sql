CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  original_storage_key TEXT NOT NULL,
  preview_storage_key TEXT,
  thumbnail_storage_key TEXT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
  processing_progress INTEGER NOT NULL DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vods_user_id ON vods(user_id);
CREATE INDEX idx_vods_status ON vods(status);
