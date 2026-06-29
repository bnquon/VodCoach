ALTER TABLE vods
ALTER COLUMN status SET DEFAULT 'uploaded';

ALTER TABLE vods
DROP CONSTRAINT vods_status_check;

ALTER TABLE vods
ADD CONSTRAINT vods_status_check
CHECK (status IN ('uploaded', 'processing', 'ready', 'failed'));

ALTER TABLE vods
DROP COLUMN content_type,
DROP COLUMN original_filename;
