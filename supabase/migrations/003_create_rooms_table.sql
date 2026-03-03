-- Create rooms table in Supabase
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Đào tạo', 'Văn phòng', 'Hội trường')),
  capacity INTEGER,
  status TEXT NOT NULL CHECK (status IN ('Hoạt động', 'Bảo trì')) DEFAULT 'Hoạt động',
  branch TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_branch ON rooms(branch);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_rooms_updated_at();

-- Create view with computed fields
DROP VIEW IF EXISTS rooms_view;
CREATE VIEW rooms_view AS
SELECT 
  r.*,
  CASE WHEN r.status = 'Hoạt động' THEN true ELSE false END as is_active,
  CASE WHEN r.capacity IS NOT NULL AND r.capacity > 0 THEN true ELSE false END as has_capacity
FROM rooms r;

-- Create management view with more detailed computed fields
DROP VIEW IF EXISTS rooms_management_view;
CREATE VIEW rooms_management_view AS
SELECT 
  r.*,
  CASE WHEN r.status = 'Hoạt động' THEN true ELSE false END as is_active,
  CASE WHEN r.capacity IS NOT NULL AND r.capacity > 0 THEN true ELSE false END as has_capacity,
  CASE 
    WHEN r.type = 'Đào tạo' THEN 'Training Room'
    WHEN r.type = 'Văn phòng' THEN 'Office'
    WHEN r.type = 'Hội trường' THEN 'Hall'
    ELSE r.type
  END as type_display,
  CASE 
    WHEN r.status = 'Hoạt động' THEN 'Active'
    WHEN r.status = 'Bảo trì' THEN 'Maintenance'
    ELSE r.status
  END as status_display
FROM rooms r;

-- Create comprehensive rooms view with all useful computed fields
DROP VIEW IF EXISTS rooms_comprehensive_view;
CREATE VIEW rooms_comprehensive_view AS
SELECT 
  r.id,
  r.name,
  r.type,
  r.capacity,
  r.status,
  r.branch,
  r.notes,
  r.created_at,
  r.updated_at,
  -- Status flags
  CASE WHEN r.status = 'Hoạt động' THEN true ELSE false END as is_active,
  CASE WHEN r.status = 'Bảo trì' THEN true ELSE false END as is_maintenance,
  -- Capacity info
  CASE WHEN r.capacity IS NOT NULL AND r.capacity > 0 THEN true ELSE false END as has_capacity,
  CASE WHEN r.capacity IS NULL THEN 'Chưa xác định' 
       WHEN r.capacity <= 10 THEN 'Nhỏ (≤10 người)'
       WHEN r.capacity <= 30 THEN 'Vừa (11-30 người)'
       WHEN r.capacity <= 50 THEN 'Lớn (31-50 người)'
       ELSE 'Rất lớn (>50 người)' 
  END as capacity_category,
  -- Type display
  CASE 
    WHEN r.type = 'Đào tạo' THEN 'Training Room'
    WHEN r.type = 'Văn phòng' THEN 'Office'
    WHEN r.type = 'Hội trường' THEN 'Hall'
    ELSE r.type
  END as type_display,
  -- Status display
  CASE 
    WHEN r.status = 'Hoạt động' THEN 'Active'
    WHEN r.status = 'Bảo trì' THEN 'Maintenance'
    ELSE r.status
  END as status_display,
  -- Branch info
  CASE WHEN r.branch IS NOT NULL AND r.branch != '' THEN true ELSE false END as has_branch,
  -- Notes info
  CASE WHEN r.notes IS NOT NULL AND r.notes != '' THEN true ELSE false END as has_notes,
  -- Time info
  EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 as days_since_creation,
  EXTRACT(EPOCH FROM (NOW() - r.updated_at)) / 86400 as days_since_update
FROM rooms r;

-- Enable RLS (Row Level Security)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rooms;
DROP POLICY IF EXISTS "Allow public read access" ON rooms;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access" ON rooms
  FOR SELECT
  USING (true);
