-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT CHECK (gender IN ('Nam', 'Nữ')),
  phone TEXT,
  password TEXT, -- Mật khẩu đăng nhập portal
  parent_id TEXT, -- Reference to parents(id) - foreign key removed to avoid dependency
  parent_name TEXT, -- Denormalized for display
  parent_phone TEXT, -- Denormalized for display
  status TEXT NOT NULL DEFAULT 'Đang học' CHECK (status IN ('Đang học', 'Nợ phí', 'Nợ hợp đồng', 'Bảo lưu', 'Nghỉ học', 'Học thử', 'Đã học hết phí')),
  branch TEXT, -- Cơ sở học
  class TEXT, -- Current class name (legacy)
  class_id TEXT, -- Primary class ID
  class_ids JSONB DEFAULT '[]'::jsonb, -- Array of class IDs
  registered_sessions INTEGER DEFAULT 0,
  attended_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER DEFAULT 0,
  start_session_number INTEGER,
  enrollment_date DATE,
  start_date DATE,
  expected_end_date DATE,
  reserve_date DATE,
  reserve_note TEXT,
  reserve_sessions INTEGER,
  bad_debt BOOLEAN DEFAULT false,
  bad_debt_sessions INTEGER,
  bad_debt_amount NUMERIC(12,2),
  bad_debt_date DATE,
  bad_debt_note TEXT,
  contract_debt NUMERIC(12,2) DEFAULT 0,
  next_payment_date DATE,
  care_history JSONB DEFAULT '[]'::jsonb, -- Array of CareLog objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_code ON students(code);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch) WHERE branch IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id) WHERE class_id IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students 
  FOR EACH ROW 
  EXECUTE FUNCTION update_students_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS students_view CASCADE;
CREATE VIEW students_view AS
SELECT 
  id,
  code,
  full_name,
  dob,
  gender,
  phone,
  password,
  parent_id,
  parent_name,
  parent_phone,
  status,
  branch,
  class,
  class_id,
  class_ids,
  registered_sessions,
  attended_sessions,
  remaining_sessions,
  start_session_number,
  enrollment_date,
  start_date,
  expected_end_date,
  reserve_date,
  reserve_note,
  reserve_sessions,
  bad_debt,
  bad_debt_sessions,
  bad_debt_amount,
  bad_debt_date,
  bad_debt_note,
  contract_debt,
  next_payment_date,
  care_history,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN status = 'Đang học' THEN true 
    ELSE false 
  END AS is_active,
  CASE 
    WHEN remaining_sessions < 0 THEN true 
    ELSE false 
  END AS has_debt,
  CASE 
    WHEN dob IS NOT NULL THEN 
      EXTRACT(YEAR FROM AGE(dob))
    ELSE NULL
  END AS age,
  CASE 
    WHEN registered_sessions > 0 THEN 
      ROUND((attended_sessions::numeric / registered_sessions) * 100, 2)
    ELSE 0
  END AS attendance_rate
FROM students;

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to students" ON students;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON students;

-- Policies
CREATE POLICY "Allow read access to students" ON students
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON students
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON students
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON students
  FOR DELETE
  USING (true);
