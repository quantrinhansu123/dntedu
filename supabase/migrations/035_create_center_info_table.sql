-- Create center_info table to store center information for forms (contracts, invoices, etc.)
CREATE TABLE IF NOT EXISTS center_info (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Basic Information
  name TEXT NOT NULL DEFAULT 'DNT EDU',
  code TEXT,
  logo_url TEXT, -- URL or path to logo image
  
  -- Contact Information
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Representative Information
  representative_name TEXT, -- Tên đại diện
  representative_position TEXT, -- Chức vụ đại diện
  
  -- Additional Information
  tax_code TEXT, -- Mã số thuế
  bank_account TEXT, -- Số tài khoản
  bank_name TEXT, -- Tên ngân hàng
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Create unique constraint to ensure only one record exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_center_info_single ON center_info((1));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_center_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_center_info_updated_at ON center_info;
CREATE TRIGGER update_center_info_updated_at 
  BEFORE UPDATE ON center_info 
  FOR EACH ROW 
  EXECUTE FUNCTION update_center_info_updated_at();

-- Enable RLS
ALTER TABLE center_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to center_info" ON center_info;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON center_info;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON center_info;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON center_info;

-- Create RLS policies
CREATE POLICY "Allow read access to center_info" ON center_info
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON center_info
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON center_info
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON center_info
  FOR DELETE
  USING (true);

-- Insert default record
INSERT INTO center_info (
  name, code, logo_url, address, phone, email, website,
  representative_name, representative_position,
  tax_code, bank_account, bank_name,
  created_by
) VALUES (
  'DNT EDU',
  'DNT',
  '/logo.jpg',
  'Tây Mỗ, Nam Từ Liêm, Hà Nội',
  '0912.345.678',
  'contact@dntedu.vn',
  '',
  'Nguyễn Văn A',
  'Giám đốc',
  '',
  '',
  '',
  'system'
)
ON CONFLICT DO NOTHING;
