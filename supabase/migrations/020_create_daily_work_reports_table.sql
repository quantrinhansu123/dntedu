-- Create daily_work_reports table
CREATE TABLE IF NOT EXISTS daily_work_reports (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  work_description TEXT NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Cho xac nhan' CHECK (status IN ('Cho xac nhan', 'Dat', 'Chap nhan', 'Khong dat')),
  approval_status TEXT CHECK (approval_status IN ('Dat', 'Chap nhan', 'Khong dat')),
  approval_reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, report_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_staff_id ON daily_work_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_report_date ON daily_work_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_status ON daily_work_reports(status);
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_approval_status ON daily_work_reports(approval_status) WHERE approval_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_created_at ON daily_work_reports(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_daily_work_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_work_reports_updated_at ON daily_work_reports;
CREATE TRIGGER update_daily_work_reports_updated_at 
  BEFORE UPDATE ON daily_work_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_daily_work_reports_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS daily_work_reports_view CASCADE;
CREATE VIEW daily_work_reports_view AS
SELECT 
  id,
  staff_id,
  staff_name,
  report_date,
  work_description,
  completed_tasks,
  status,
  approval_status,
  approval_reason,
  approved_by,
  approved_at,
  note,
  created_at,
  updated_at,
  CASE 
    WHEN status = 'Cho xac nhan' THEN true 
    ELSE false 
  END AS is_pending,
  CASE 
    WHEN approval_status IN ('Dat', 'Chap nhan') THEN true 
    ELSE false 
  END AS is_approved,
  CASE 
    WHEN approval_status = 'Khong dat' THEN true 
    ELSE false 
  END AS is_rejected,
  CASE 
    WHEN completed_tasks IS NOT NULL AND jsonb_array_length(completed_tasks) > 0 THEN true 
    ELSE false 
  END AS has_tasks
FROM daily_work_reports;

-- Enable RLS
ALTER TABLE daily_work_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to daily_work_reports" ON daily_work_reports;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON daily_work_reports;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON daily_work_reports;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON daily_work_reports;

-- Policies
CREATE POLICY "Allow read access to daily_work_reports" ON daily_work_reports
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON daily_work_reports
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON daily_work_reports
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON daily_work_reports
  FOR DELETE
  USING (true);
