-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  date DATE NOT NULL,
  session_number INTEGER,
  session_id TEXT,
  total_students INTEGER NOT NULL DEFAULT 0,
  present INTEGER NOT NULL DEFAULT 0,
  absent INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  tutored INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Chưa điểm danh' CHECK (status IN ('Đã điểm danh', 'Chưa điểm danh')),
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_id ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_created_at ON attendance_records(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_attendance_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at 
  BEFORE UPDATE ON attendance_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_attendance_records_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS attendance_records_view CASCADE;
CREATE VIEW attendance_records_view AS
SELECT 
  id,
  class_id,
  class_name,
  date,
  session_number,
  session_id,
  total_students,
  present,
  absent,
  reserved,
  tutored,
  status,
  created_by,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN present + absent + reserved + tutored = total_students THEN true 
    ELSE false 
  END AS is_complete,
  CASE 
    WHEN total_students > 0 THEN 
      ROUND((present::numeric / total_students) * 100, 2)
    ELSE 0
  END AS attendance_rate
FROM attendance_records;

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON attendance_records;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON attendance_records;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON attendance_records;

-- Policies
CREATE POLICY "Allow read access to attendance_records" ON attendance_records
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON attendance_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON attendance_records
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON attendance_records
  FOR DELETE
  USING (true);
