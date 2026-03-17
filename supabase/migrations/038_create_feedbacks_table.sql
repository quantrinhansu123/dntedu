-- Parent feedback (gọi điện + form khảo sát)
CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Call', 'Form')),
  student_id TEXT,
  student_name TEXT NOT NULL DEFAULT '',
  class_id TEXT,
  class_name TEXT NOT NULL DEFAULT '',
  teacher TEXT,
  teacher_score NUMERIC,
  curriculum_score NUMERIC,
  care_score NUMERIC,
  facilities_score NUMERIC,
  average_score NUMERIC,
  caller TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'Cần gọi' CHECK (status IN ('Cần gọi', 'Đã gọi', 'Hoàn thành')),
  parent_id TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id ON feedbacks(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedbacks_type ON feedbacks(type);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

CREATE OR REPLACE FUNCTION update_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedbacks_updated_at();

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Allow insert feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Allow update feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Allow delete feedbacks" ON feedbacks;

CREATE POLICY "Allow read feedbacks" ON feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow insert feedbacks" ON feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update feedbacks" ON feedbacks FOR UPDATE USING (true);
CREATE POLICY "Allow delete feedbacks" ON feedbacks FOR DELETE USING (true);
