-- Create role_permissions table to store permission configurations
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role_key TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  description TEXT,
  
  -- Permissions stored as JSONB for flexibility
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_key ON role_permissions(role_key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_created_at ON role_permissions(created_at);

-- Create GIN index for JSONB permissions field for efficient querying
CREATE INDEX IF NOT EXISTS idx_role_permissions_permissions ON role_permissions USING GIN (permissions);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER update_role_permissions_updated_at 
  BEFORE UPDATE ON role_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_role_permissions_updated_at();

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON role_permissions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON role_permissions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON role_permissions;

-- Create RLS policies
CREATE POLICY "Allow read access to role_permissions" ON role_permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON role_permissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON role_permissions
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON role_permissions
  FOR DELETE
  USING (true);

-- Insert default role permissions
INSERT INTO role_permissions (role_key, role_name, description, permissions, created_by) VALUES
('gv_viet', 'Nv Chuyên môn', 'Xem được lớp, thời khoá biểu của bản thân, thư viện tài nguyên và mục tiêu phòng ban Chuyên môn', 
 '{
   "classes": {"view": true, "create": false, "edit": false, "delete": false, "onlyOwnClasses": true},
   "schedule": {"view": true, "create": false, "edit": false, "delete": false, "onlyOwnClasses": true},
   "resources": {"view": true, "create": false, "edit": false, "delete": false},
   "department_goals": {"view": true, "create": false, "edit": false, "delete": false}
 }'::jsonb, 'system'),

('admin', 'Nv điều hành', 'Xem toàn bộ như admin',
 '{
   "dashboard": {"view": true, "create": true, "edit": true, "delete": true},
   "classes": {"view": true, "create": true, "edit": true, "delete": true},
   "schedule": {"view": true, "create": true, "edit": true, "delete": true},
   "students": {"view": true, "create": true, "edit": true, "delete": true},
   "staff": {"view": true, "create": true, "edit": true, "delete": true},
   "contracts": {"view": true, "create": true, "edit": true, "delete": true},
   "reports_finance": {"view": true, "create": true, "edit": true, "delete": true}
 }'::jsonb, 'system'),

('cskh', 'Nv kinh doanh', 'Xem được Khách hàng, Kinh doanh, Task và KPI bản thân, và mục tiêu phòng ban kinh doanh',
 '{
   "students": {"view": true, "create": true, "edit": true, "delete": false},
   "leads": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_tasks": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_kpi": {"view": true, "create": true, "edit": true, "delete": false},
   "department_goals": {"view": true, "create": false, "edit": false, "delete": false}
 }'::jsonb, 'system'),

('marketing', 'Nv marketing', 'Xem được Khách hàng, Kinh doanh, Task và KPI bản thân, và mục tiêu phòng ban Marketing',
 '{
   "students": {"view": true, "create": true, "edit": true, "delete": false},
   "leads": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_tasks": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_kpi": {"view": true, "create": true, "edit": true, "delete": false},
   "department_goals": {"view": true, "create": false, "edit": false, "delete": false}
 }'::jsonb, 'system'),

('ketoan', 'Nv kế toán', 'Xem được Nhân sự, Tài chính, Task và KPI bản thân, Báo cáo tài chính và mục tiêu phòng ban Kế toán',
 '{
   "staff": {"view": true, "create": false, "edit": false, "delete": false},
   "contracts": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_tasks": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_kpi": {"view": true, "create": true, "edit": true, "delete": false},
   "reports_finance": {"view": true, "create": false, "edit": false, "delete": false},
   "department_goals": {"view": true, "create": false, "edit": false, "delete": false}
 }'::jsonb, 'system'),

('hr', 'Nv nhân sự', 'Xem được Nhân sự, Tài chính, Task và KPI bản thân, và mục tiêu phòng ban Nhân sự',
 '{
   "staff": {"view": true, "create": true, "edit": true, "delete": false},
   "contracts": {"view": true, "create": false, "edit": false, "delete": false},
   "marketing_tasks": {"view": true, "create": true, "edit": true, "delete": false},
   "marketing_kpi": {"view": true, "create": true, "edit": true, "delete": false},
   "department_goals": {"view": true, "create": false, "edit": false, "delete": false}
 }'::jsonb, 'system')

ON CONFLICT (role_key) DO NOTHING;
