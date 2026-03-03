-- Tạo bảng staff (nhân sự) trong Supabase
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  
  -- Roles (hỗ trợ multiple roles)
  roles JSONB DEFAULT '[]'::jsonb, -- Array of roles: ['Giáo viên', 'Trợ giảng']
  role TEXT NOT NULL DEFAULT 'Nhân viên' CHECK (role IN ('Giáo viên', 'Trợ giảng', 'Nhân viên', 'Sale', 'Văn phòng', 'Quản lý', 'Quản trị viên')),
  
  department TEXT DEFAULT '',
  position TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  
  -- Thông tin cơ bản
  dob DATE,
  start_date DATE,
  branch TEXT, -- Cơ sở làm việc
  gender TEXT CHECK (gender IN ('Nam', 'Nữ')),
  
  -- Thông tin lý lịch
  id_number TEXT, -- CCCD/CMND
  id_issue_date DATE,
  id_issue_place TEXT,
  address TEXT,
  permanent_address TEXT,
  bank_account TEXT,
  bank_name TEXT,
  tax_code TEXT,
  insurance_number TEXT,
  
  -- Bằng cấp, trình độ
  education TEXT, -- Trình độ học vấn
  degree TEXT, -- Bằng cấp
  major TEXT, -- Chuyên ngành
  certificates JSONB, -- Array of certificates: ['IELTS 7.0', 'TOEIC 850']
  
  -- Thông tin lương
  salary_grade INTEGER, -- Bậc lương (1-8)
  salary_coefficient NUMERIC(10,2), -- Hệ số lương
  base_salary NUMERIC(12,2), -- Lương thực nhận
  allowance NUMERIC(12,2), -- Phụ cấp
  
  -- Thông tin hợp đồng hiện tại
  current_contract_id TEXT,
  current_contract_type TEXT CHECK (current_contract_type IN ('Thử việc', 'Chính thức', 'Cộng tác viên', 'Thời vụ')),
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Metadata
  avatar TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo indexes để tối ưu query
CREATE INDEX IF NOT EXISTS idx_staff_code ON staff(code);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email) WHERE email IS NOT NULL;

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Xóa trigger cũ nếu tồn tại trước khi tạo mới
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;

CREATE TRIGGER update_staff_updated_at 
  BEFORE UPDATE ON staff 
  FOR EACH ROW 
  EXECUTE FUNCTION update_staff_updated_at();

-- Tạo view để dễ query (hoặc thay thế nếu đã tồn tại)
DROP VIEW IF EXISTS staff_view CASCADE;
CREATE VIEW staff_view AS
SELECT 
  id,
  name,
  code,
  roles,
  role,
  department,
  position,
  phone,
  email,
  status,
  dob,
  start_date,
  branch,
  gender,
  id_number,
  id_issue_date,
  id_issue_place,
  address,
  permanent_address,
  bank_account,
  bank_name,
  tax_code,
  insurance_number,
  education,
  degree,
  major,
  certificates,
  salary_grade,
  salary_coefficient,
  base_salary,
  allowance,
  current_contract_id,
  current_contract_type,
  contract_start_date,
  contract_end_date,
  avatar,
  notes,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN status = 'Active' THEN true 
    ELSE false 
  END AS is_active,
  CASE 
    WHEN contract_end_date IS NOT NULL AND contract_end_date < CURRENT_DATE THEN true 
    ELSE false 
  END AS is_contract_expired,
  EXTRACT(YEAR FROM AGE(COALESCE(dob, CURRENT_DATE))) AS age,
  EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400 AS days_since_creation
FROM staff;

-- Enable Row Level Security (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Xóa policies cũ nếu tồn tại trước khi tạo mới
DROP POLICY IF EXISTS "Allow read access to staff" ON staff;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON staff;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON staff;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON staff;

-- Policy: Cho phép đọc tất cả (có thể thay đổi theo yêu cầu)
CREATE POLICY "Allow read access to staff" ON staff
  FOR SELECT
  USING (true);

-- Policy: Chỉ authenticated users mới có thể insert/update/delete
CREATE POLICY "Allow insert for authenticated users" ON staff
  FOR INSERT
  WITH CHECK (true); -- Thay đổi theo auth logic của bạn

CREATE POLICY "Allow update for authenticated users" ON staff
  FOR UPDATE
  USING (true); -- Thay đổi theo auth logic của bạn

CREATE POLICY "Allow delete for authenticated users" ON staff
  FOR DELETE
  USING (true); -- Thay đổi theo auth logic của bạn
