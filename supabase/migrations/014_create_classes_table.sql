-- Create classes table in Supabase
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Chờ mở', 'Đang học', 'Tạm dừng', 'Kết thúc', 'Pending', 'Active', 'Paused', 'Finished', 'STUDYING', 'FINISHED', 'PAUSED')),
  curriculum TEXT,
  course_id TEXT,
  course_name TEXT,
  age_group TEXT,
  progress TEXT,
  total_sessions INTEGER,
  teacher TEXT,
  teacher_id TEXT,
  teacher_duration INTEGER,
  assistant TEXT,
  assistant_duration INTEGER,
  foreign_teacher TEXT,
  foreign_teacher_duration INTEGER,
  students_count INTEGER NOT NULL DEFAULT 0,
  trial_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  debt_students INTEGER DEFAULT 0,
  reserved_students INTEGER DEFAULT 0,
  schedule TEXT,
  schedule_details JSONB,
  room TEXT,
  branch TEXT,
  color INTEGER,
  start_date DATE,
  end_date DATE,
  training_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_branch ON classes(branch) WHERE branch IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_classes_updated_at();

-- Create view with computed fields
DROP VIEW IF EXISTS classes_view;
CREATE VIEW classes_view AS
SELECT 
  c.*,
  CASE WHEN c.status IN ('Đang học', 'Active', 'STUDYING') THEN true ELSE false END as is_active,
  CASE WHEN c.status IN ('Kết thúc', 'Finished', 'FINISHED') THEN true ELSE false END as is_finished,
  CASE WHEN c.status IN ('Tạm dừng', 'Paused', 'PAUSED') THEN true ELSE false END as is_paused,
  CASE WHEN c.teacher IS NOT NULL AND c.teacher != '' THEN true ELSE false END as has_teacher,
  CASE WHEN c.course_id IS NOT NULL AND c.course_id != '' THEN true ELSE false END as has_course,
  CASE WHEN c.schedule_details IS NOT NULL THEN true ELSE false END as has_schedule_details
FROM classes c;

-- Enable RLS (Row Level Security)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON classes;
DROP POLICY IF EXISTS "Allow public read access" ON classes;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON classes
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access" ON classes
  FOR SELECT
  USING (true);
