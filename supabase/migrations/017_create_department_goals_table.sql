-- Create department_goals table
CREATE TABLE IF NOT EXISTS department_goals (
  id TEXT PRIMARY KEY,
  department_code TEXT NOT NULL CHECK (department_code IN ('sales', 'training', 'marketing', 'accounting', 'hr')),
  department_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  kpi_target NUMERIC(12,2) NOT NULL,
  kpi_weight NUMERIC(5,2) NOT NULL,
  kpi_actual NUMERIC(12,2) DEFAULT 0,
  kpi_result NUMERIC(5,2) DEFAULT 0,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_department_goals_department_code ON department_goals(department_code);
CREATE INDEX IF NOT EXISTS idx_department_goals_month_year ON department_goals(month, year);
CREATE INDEX IF NOT EXISTS idx_department_goals_status ON department_goals(status);
CREATE INDEX IF NOT EXISTS idx_department_goals_created_at ON department_goals(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_department_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_department_goals_updated_at ON department_goals;
CREATE TRIGGER update_department_goals_updated_at 
  BEFORE UPDATE ON department_goals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_department_goals_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS department_goals_view CASCADE;
CREATE VIEW department_goals_view AS
SELECT 
  id,
  department_code,
  department_name,
  month,
  year,
  title,
  description,
  kpi_target,
  kpi_weight,
  kpi_actual,
  kpi_result,
  unit,
  status,
  created_by,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN kpi_result >= 100 THEN 'excellent'
    WHEN kpi_result >= 85 THEN 'good'
    WHEN kpi_result >= 70 THEN 'fair'
    ELSE 'poor'
  END AS performance_level
FROM department_goals;

-- Enable RLS
ALTER TABLE department_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to department_goals" ON department_goals;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON department_goals;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON department_goals;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON department_goals;

-- Policies
CREATE POLICY "Allow read access to department_goals" ON department_goals
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON department_goals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON department_goals
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON department_goals
  FOR DELETE
  USING (true);
