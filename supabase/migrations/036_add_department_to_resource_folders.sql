-- Add department column to resource_folders for per-department visibility
-- Root folders (parent_id IS NULL) with department set: only staff of that department can see them and their contents.
ALTER TABLE resource_folders ADD COLUMN IF NOT EXISTS department TEXT;

-- Index for filtering by department
CREATE INDEX IF NOT EXISTS idx_resource_folders_department ON resource_folders(department) WHERE department IS NOT NULL;

-- Backfill: set department from root folder name (Phòng X -> X) for existing rows
UPDATE resource_folders
SET department = TRIM(REGEXP_REPLACE(name, '^Phòng\s+', '', 'i'))
WHERE parent_id IS NULL AND (department IS NULL OR department = '');
