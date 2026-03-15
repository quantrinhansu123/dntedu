-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Phần mềm cho công tác giảng dạy', 'Chi phí phần mềm', 'Chi phí tài sản hữu hình')),
  purchase_date DATE NOT NULL,
  cost NUMERIC NOT NULL CHECK (cost >= 0),
  useful_life INTEGER NOT NULL CHECK (useful_life > 0),
  monthly_depreciation NUMERIC NOT NULL CHECK (monthly_depreciation >= 0),
  residual_value NUMERIC NOT NULL CHECK (residual_value >= 0),
  status TEXT NOT NULL DEFAULT 'Đang khấu hao' CHECK (status IN ('Đang khấu hao', 'Đã khấu hao xong', 'Thanh lý')),
  start_date DATE, -- Ngày bắt đầu khấu hao
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON assets(purchase_date);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_assets_updated_at();

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to assets" ON assets;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON assets;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON assets;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON assets;

-- Policies
CREATE POLICY "Allow read access to assets" ON assets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON assets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON assets
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON assets
  FOR DELETE
  USING (true);
