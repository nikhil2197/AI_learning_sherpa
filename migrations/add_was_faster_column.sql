
-- Add wasFaster column without removing learnedNew
ALTER TABLE feedbacks ADD COLUMN was_faster BOOLEAN;

-- Set default values for existing records (optional)
-- UPDATE feedbacks SET was_faster = false WHERE was_faster IS NULL;
