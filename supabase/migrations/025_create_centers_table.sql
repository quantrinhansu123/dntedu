-- Create centers table
CREATE TABLE IF NOT EXISTS centers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, -- Tên cơ sở
  code TEXT, -- Mã cơ sở (VD: CS01)
  address TEXT, -- Địa chỉ
  phone TEXT, -- Số điện thoại
  email TEXT, -- Email
  manager TEXT, -- Người quản lý
  status TEXT NOT NULL DEFAULT 'Hoạt động' CHECK (status IN ('Hoạt động', 'Tạm dừng')), -- Trạng thái
  notes TEXT, -- Ghi chú
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_centers_name ON centers(name);
CREATE INDEX IF NOT EXISTS idx_centers_code ON centers(code);
CREATE INDEX IF NOT EXISTS idx_centers_status ON centers(status);
CREATE INDEX IF NOT EXISTS idx_centers_created_at ON centers(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_centers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_centers_updated_at ON centers;
CREATE TRIGGER update_centers_updated_at 
  BEFORE UPDATE ON centers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_centers_updated_at();

-- Enable RLS
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to centers" ON centers;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON centers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON centers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON centers;

-- Policies
CREATE POLICY "Allow read access to centers" ON centers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON centers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON centers
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON centers
  FOR DELETE
  USING (true);
