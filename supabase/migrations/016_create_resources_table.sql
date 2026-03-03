-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'link', 'image', 'audio')),
  folder_id TEXT,
  url TEXT, -- For links, videos
  file_url TEXT, -- For uploaded files
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb, -- Array of tags
  thumbnail TEXT,
  duration INTEGER, -- For video/audio in seconds
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false, -- Visible to students
  allowed_roles JSONB DEFAULT '[]'::jsonb, -- Array of roles that can access
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resources_folder_id ON resources(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at 
  BEFORE UPDATE ON resources 
  FOR EACH ROW 
  EXECUTE FUNCTION update_resources_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS resources_view CASCADE;
CREATE VIEW resources_view AS
SELECT 
  id,
  name,
  type,
  folder_id,
  url,
  file_url,
  file_name,
  file_size,
  mime_type,
  description,
  tags,
  thumbnail,
  duration,
  view_count,
  download_count,
  is_public,
  allowed_roles,
  created_by,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN view_count > 0 THEN true 
    ELSE false 
  END AS has_views,
  CASE 
    WHEN download_count > 0 THEN true 
    ELSE false 
  END AS has_downloads,
  CASE 
    WHEN folder_id IS NOT NULL THEN true 
    ELSE false 
  END AS has_folder,
  CASE 
    WHEN tags IS NOT NULL AND jsonb_array_length(tags) > 0 THEN true 
    ELSE false 
  END AS has_tags
FROM resources;

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to resources" ON resources;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON resources;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON resources;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON resources;

-- Policies
CREATE POLICY "Allow read access to resources" ON resources
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON resources
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON resources
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON resources
  FOR DELETE
  USING (true);
