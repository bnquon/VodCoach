ALTER TABLE vods
ADD COLUMN original_filename TEXT,
ADD COLUMN content_type TEXT;

ALTER TABLE vods
DROP CONSTRAINT vods_status_check;

ALTER TABLE vods
ADD CONSTRAINT vods_status_check
CHECK (status IN ('pending_upload', 'uploaded', 'processing', 'ready', 'failed'));

ALTER TABLE vods
ALTER COLUMN status SET DEFAULT 'pending_upload';
