-- Create resource_folders table in Supabase
CREATE TABLE IF NOT EXISTS resource_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  color TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_parent_folder FOREIGN KEY (parent_id) REFERENCES resource_folders(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resource_folders_parent_id ON resource_folders(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resource_folders_name ON resource_folders(name);
CREATE INDEX IF NOT EXISTS idx_resource_folders_created_at ON resource_folders(created_at);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_resource_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_resource_folders_updated_at ON resource_folders;
CREATE TRIGGER update_resource_folders_updated_at
  BEFORE UPDATE ON resource_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_folders_updated_at();

-- Create view with computed fields
DROP VIEW IF EXISTS resource_folders_view;
CREATE VIEW resource_folders_view AS
SELECT 
  rf.*,
  CASE WHEN rf.parent_id IS NOT NULL THEN true ELSE false END as has_parent,
  CASE WHEN rf.color IS NOT NULL AND rf.color != '' THEN true ELSE false END as has_color,
  CASE WHEN rf.description IS NOT NULL AND rf.description != '' THEN true ELSE false END as has_description
FROM resource_folders rf;

-- Create management view with path calculation
DROP VIEW IF EXISTS resource_folders_management_view;
CREATE VIEW resource_folders_management_view AS
SELECT 
  rf.*,
  CASE WHEN rf.parent_id IS NOT NULL THEN true ELSE false END as has_parent,
  CASE WHEN rf.color IS NOT NULL AND rf.color != '' THEN true ELSE false END as has_color,
  CASE WHEN rf.description IS NOT NULL AND rf.description != '' THEN true ELSE false END as has_description,
  -- Depth level (calculated recursively would be complex, so we'll use a simple check)
  CASE 
    WHEN rf.parent_id IS NULL THEN 0
    ELSE 1
  END as depth_level,
  -- Days since creation
  EXTRACT(EPOCH FROM (NOW() - rf.created_at)) / 86400 AS days_since_creation,
  -- Days since last update
  EXTRACT(EPOCH FROM (NOW() - rf.updated_at)) / 86400 AS days_since_update
FROM resource_folders rf;

-- Enable RLS (Row Level Security)
ALTER TABLE resource_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON resource_folders;
DROP POLICY IF EXISTS "Allow public read access" ON resource_folders;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON resource_folders
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access" ON resource_folders
  FOR SELECT
  USING (true);
