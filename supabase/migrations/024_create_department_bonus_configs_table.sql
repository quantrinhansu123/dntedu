-- Create department_bonus_configs table
CREATE TABLE IF NOT EXISTS department_bonus_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  department_code TEXT NOT NULL, -- Mã phòng ban: sales, training, marketing, accounting, hr
  department_name TEXT NOT NULL, -- Tên phòng ban
  levels JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of KpiBonusLevel objects
  effective_date DATE NOT NULL, -- Ngày hiệu lực
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- Trạng thái
  created_by TEXT, -- Người tạo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_department_bonus_configs_department_code ON department_bonus_configs(department_code);
CREATE INDEX IF NOT EXISTS idx_department_bonus_configs_status ON department_bonus_configs(status);
CREATE INDEX IF NOT EXISTS idx_department_bonus_configs_effective_date ON department_bonus_configs(effective_date);
CREATE INDEX IF NOT EXISTS idx_department_bonus_configs_created_at ON department_bonus_configs(created_at);

-- Create composite index for active configs by department
CREATE INDEX IF NOT EXISTS idx_department_bonus_configs_dept_status ON department_bonus_configs(department_code, status) WHERE status = 'active';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_department_bonus_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_department_bonus_configs_updated_at ON department_bonus_configs;
CREATE TRIGGER update_department_bonus_configs_updated_at 
  BEFORE UPDATE ON department_bonus_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_department_bonus_configs_updated_at();

-- Enable RLS
ALTER TABLE department_bonus_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to department_bonus_configs" ON department_bonus_configs;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON department_bonus_configs;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON department_bonus_configs;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON department_bonus_configs;

-- Policies
CREATE POLICY "Allow read access to department_bonus_configs" ON department_bonus_configs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON department_bonus_configs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON department_bonus_configs
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON department_bonus_configs
  FOR DELETE
  USING (true);
