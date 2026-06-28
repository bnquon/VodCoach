ALTER TABLE drawings
ADD COLUMN color TEXT NOT NULL DEFAULT '#ff3333'
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
