-- Create student_attendance table
CREATE TABLE IF NOT EXISTS student_attendance (
  id TEXT PRIMARY KEY,
  attendance_id TEXT NOT NULL,
  session_id TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_code TEXT NOT NULL,
  class_id TEXT,
  class_name TEXT,
  date DATE,
  session_number INTEGER,
  status TEXT NOT NULL CHECK (status IN ('Đúng giờ', 'Trễ giờ', 'Vắng', 'Bảo lưu', 'Đã bồi', 'Chưa điểm danh')),
  note TEXT,
  homework_completion INTEGER, -- % BTVN (0-100)
  test_name TEXT, -- Tên bài kiểm tra
  score NUMERIC(4,2), -- Điểm (0-10)
  bonus_points NUMERIC(4,2), -- Điểm thưởng
  punctuality TEXT CHECK (punctuality IN ('onTime', 'late', '')),
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_attendance_attendance_id ON student_attendance(attendance_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_session_id ON student_attendance(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date) WHERE date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_attendance_class_id ON student_attendance(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_attendance_status ON student_attendance(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_student_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_attendance_updated_at ON student_attendance;
CREATE TRIGGER update_student_attendance_updated_at 
  BEFORE UPDATE ON student_attendance 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_attendance_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS student_attendance_view CASCADE;
CREATE VIEW student_attendance_view AS
SELECT 
  id,
  attendance_id,
  session_id,
  student_id,
  student_name,
  student_code,
  class_id,
  class_name,
  date,
  session_number,
  status,
  note,
  homework_completion,
  test_name,
  score,
  bonus_points,
  punctuality,
  is_late,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN status IN ('Đúng giờ', 'Trễ giờ') THEN true 
    ELSE false 
  END AS is_present,
  CASE 
    WHEN status = 'Vắng' THEN true 
    ELSE false 
  END AS is_absent,
  CASE 
    WHEN status = 'Bảo lưu' THEN true 
    ELSE false 
  END AS is_reserved,
  CASE 
    WHEN status = 'Đã bồi' THEN true 
    ELSE false 
  END AS is_tutored
FROM student_attendance;

-- Enable RLS
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to student_attendance" ON student_attendance;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON student_attendance;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON student_attendance;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON student_attendance;

-- Policies
CREATE POLICY "Allow read access to student_attendance" ON student_attendance
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON student_attendance
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON student_attendance
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON student_attendance
  FOR DELETE
  USING (true);
