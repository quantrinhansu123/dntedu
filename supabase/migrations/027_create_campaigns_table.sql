-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, -- Tên chiến dịch
  description TEXT, -- Mô tả
  start_date DATE NOT NULL, -- Ngày bắt đầu
  end_date DATE NOT NULL, -- Ngày kết thúc
  status TEXT NOT NULL DEFAULT 'Đang mở' CHECK (status IN ('Đang mở', 'Tạm dừng', 'Kết thúc')), -- Trạng thái
  target_count INTEGER NOT NULL DEFAULT 0, -- Số lượng mục tiêu
  registered_count INTEGER NOT NULL DEFAULT 0, -- Số lượng đã đăng ký
  conversion_rate NUMERIC(5,2) DEFAULT 0, -- Tỷ lệ chuyển đổi (%)
  script_url TEXT, -- URL script
  assigned_to JSONB DEFAULT '[]'::jsonb, -- Array of staff IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Create GIN index for assigned_to array search
CREATE INDEX IF NOT EXISTS idx_campaigns_assigned_to ON campaigns USING GIN (assigned_to);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_campaigns_updated_at();

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON campaigns;

-- Policies
CREATE POLICY "Allow read access to campaigns" ON campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON campaigns
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON campaigns
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON campaigns
  FOR DELETE
  USING (true);
