ALTER TABLE drawings
ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 3
CHECK (duration_seconds > 0);
