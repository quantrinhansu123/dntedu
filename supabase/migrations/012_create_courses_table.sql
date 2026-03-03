-- Create courses table in Supabase
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced')),
  total_sessions INTEGER NOT NULL DEFAULT 24,
  teacher_ratio INTEGER NOT NULL DEFAULT 70 CHECK (teacher_ratio >= 0 AND teacher_ratio <= 100),
  assistant_ratio INTEGER NOT NULL DEFAULT 30 CHECK (assistant_ratio >= 0 AND assistant_ratio <= 100),
  curriculum TEXT,
  resource_folder_id TEXT,
  resource_folder_name TEXT,
  price_per_session NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
  tuition_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  tuition_per_session NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'draft')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_resource_folder_id ON courses(resource_folder_id) WHERE resource_folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

-- Create view with computed fields
DROP VIEW IF EXISTS courses_view;
CREATE VIEW courses_view AS
SELECT 
  c.*,
  CASE WHEN c.status = 'active' THEN true ELSE false END as is_active,
  CASE WHEN c.resource_folder_id IS NOT NULL AND c.resource_folder_id != '' THEN true ELSE false END as has_resource_folder,
  CASE 
    WHEN c.discount > 0 THEN true 
    ELSE false 
  END as has_discount,
  CASE 
    WHEN c.start_date IS NOT NULL AND c.end_date IS NOT NULL THEN true 
    ELSE false 
  END as has_dates,
  -- Calculate days until start (if future)
  CASE 
    WHEN c.start_date IS NOT NULL AND c.start_date > CURRENT_DATE 
    THEN EXTRACT(EPOCH FROM (c.start_date::timestamp - CURRENT_DATE::timestamp)) / 86400
    ELSE NULL
  END as days_until_start,
  -- Calculate days since start (if past)
  CASE 
    WHEN c.start_date IS NOT NULL AND c.start_date <= CURRENT_DATE 
    THEN EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - c.start_date::timestamp)) / 86400
    ELSE NULL
  END as days_since_start
FROM courses c;

-- Create management view with more detailed computed fields
DROP VIEW IF EXISTS courses_management_view;
CREATE VIEW courses_management_view AS
SELECT 
  c.*,
  CASE WHEN c.status = 'active' THEN true ELSE false END as is_active,
  CASE WHEN c.resource_folder_id IS NOT NULL AND c.resource_folder_id != '' THEN true ELSE false END as has_resource_folder,
  CASE 
    WHEN c.discount > 0 THEN true 
    ELSE false 
  END as has_discount,
  CASE 
    WHEN c.start_date IS NOT NULL AND c.end_date IS NOT NULL THEN true 
    ELSE false 
  END as has_dates,
  -- Level display
  c.level as level_display,
  -- Status display in Vietnamese
  CASE 
    WHEN c.status = 'active' THEN 'Hoạt động'
    WHEN c.status = 'inactive' THEN 'Tạm dừng'
    WHEN c.status = 'draft' THEN 'Nháp'
    ELSE c.status
  END as status_display,
  -- Price category
  CASE 
    WHEN c.price_per_session < 100000 THEN 'Thấp'
    WHEN c.price_per_session < 200000 THEN 'Trung bình'
    WHEN c.price_per_session < 300000 THEN 'Cao'
    ELSE 'Rất cao'
  END as price_category,
  -- Session category
  CASE 
    WHEN c.total_sessions < 12 THEN 'Ngắn hạn'
    WHEN c.total_sessions < 24 THEN 'Trung hạn'
    WHEN c.total_sessions < 36 THEN 'Dài hạn'
    ELSE 'Rất dài hạn'
  END as session_category,
  -- Calculate days until start (if future)
  CASE 
    WHEN c.start_date IS NOT NULL AND c.start_date > CURRENT_DATE 
    THEN EXTRACT(EPOCH FROM (c.start_date::timestamp - CURRENT_DATE::timestamp)) / 86400
    ELSE NULL
  END as days_until_start,
  -- Calculate days since start (if past)
  CASE 
    WHEN c.start_date IS NOT NULL AND c.start_date <= CURRENT_DATE 
    THEN EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - c.start_date::timestamp)) / 86400
    ELSE NULL
  END as days_since_start,
  -- Days since creation
  EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 AS days_since_creation,
  -- Days since last update
  EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 86400 AS days_since_update
FROM courses c;

-- Enable RLS (Row Level Security)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON courses;
DROP POLICY IF EXISTS "Allow public read access" ON courses;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON courses
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access" ON courses
  FOR SELECT
  USING (true);
