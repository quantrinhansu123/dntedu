-- Create work_tasks table
CREATE TABLE IF NOT EXISTS work_tasks (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- Hạng mục công việc
  task_name TEXT NOT NULL, -- Tên công việc
  staff_ids JSONB DEFAULT '[]'::jsonb, -- Array of staff IDs (nhân sự thực hiện)
  staff_names JSONB DEFAULT '[]'::jsonb, -- Array of staff names (denormalized)
  description TEXT, -- Mô tả công việc
  is_active BOOLEAN DEFAULT true, -- Công việc còn hoạt động
  created_by TEXT, -- Người tạo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_tasks_category ON work_tasks(category);
CREATE INDEX IF NOT EXISTS idx_work_tasks_is_active ON work_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_work_tasks_created_at ON work_tasks(created_at);

-- Create GIN index for staff_ids array search
CREATE INDEX IF NOT EXISTS idx_work_tasks_staff_ids ON work_tasks USING GIN (staff_ids);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_work_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_work_tasks_updated_at ON work_tasks;
CREATE TRIGGER update_work_tasks_updated_at 
  BEFORE UPDATE ON work_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_work_tasks_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS work_tasks_view CASCADE;
CREATE VIEW work_tasks_view AS
SELECT 
  id,
  category,
  task_name,
  staff_ids,
  staff_names,
  description,
  is_active,
  created_by,
  created_at,
  updated_at,
  CASE 
    WHEN jsonb_array_length(staff_ids) > 0 THEN true 
    ELSE false 
  END AS has_staff,
  jsonb_array_length(staff_ids) AS staff_count
FROM work_tasks;

-- Enable RLS
ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to work_tasks" ON work_tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON work_tasks;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON work_tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON work_tasks;

-- Policies
CREATE POLICY "Allow read access to work_tasks" ON work_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON work_tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON work_tasks
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON work_tasks
  FOR DELETE
  USING (true);
