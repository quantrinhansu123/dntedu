-- Create marketing_platforms table
CREATE TABLE IF NOT EXISTS marketing_platforms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE, -- Tên nền tảng (Facebook, Zalo, TikTok, ...)
  icon TEXT, -- Icon emoji hoặc URL
  color TEXT, -- Màu hiển thị (hex code)
  is_active BOOLEAN NOT NULL DEFAULT true, -- Trạng thái hoạt động
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_platforms_name ON marketing_platforms(name);
CREATE INDEX IF NOT EXISTS idx_marketing_platforms_is_active ON marketing_platforms(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_platforms_created_at ON marketing_platforms(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_marketing_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_marketing_platforms_updated_at ON marketing_platforms;
CREATE TRIGGER update_marketing_platforms_updated_at 
  BEFORE UPDATE ON marketing_platforms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_marketing_platforms_updated_at();

-- Enable RLS
ALTER TABLE marketing_platforms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to marketing_platforms" ON marketing_platforms;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON marketing_platforms;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON marketing_platforms;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON marketing_platforms;

-- Policies
CREATE POLICY "Allow read access to marketing_platforms" ON marketing_platforms
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON marketing_platforms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON marketing_platforms
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON marketing_platforms
  FOR DELETE
  USING (true);

-- Create platform_monthly_stats table
CREATE TABLE IF NOT EXISTS platform_monthly_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  platform_id TEXT NOT NULL, -- ID nền tảng
  platform_name TEXT NOT NULL, -- Tên nền tảng (denormalized)
  month TEXT NOT NULL, -- Tháng (format: "2024-12")
  new_followers INTEGER NOT NULL DEFAULT 0, -- Số người theo dõi mới
  interactions INTEGER NOT NULL DEFAULT 0, -- Số tương tác
  new_messages INTEGER NOT NULL DEFAULT 0, -- Số tin nhắn mới
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform_id, month) -- Mỗi platform chỉ có 1 record cho mỗi tháng
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platform_monthly_stats_platform_id ON platform_monthly_stats(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_monthly_stats_month ON platform_monthly_stats(month);
CREATE INDEX IF NOT EXISTS idx_platform_monthly_stats_platform_month ON platform_monthly_stats(platform_id, month);
CREATE INDEX IF NOT EXISTS idx_platform_monthly_stats_created_at ON platform_monthly_stats(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_platform_monthly_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_platform_monthly_stats_updated_at ON platform_monthly_stats;
CREATE TRIGGER update_platform_monthly_stats_updated_at 
  BEFORE UPDATE ON platform_monthly_stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_platform_monthly_stats_updated_at();

-- Enable RLS
ALTER TABLE platform_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to platform_monthly_stats" ON platform_monthly_stats;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON platform_monthly_stats;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON platform_monthly_stats;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON platform_monthly_stats;

-- Policies
CREATE POLICY "Allow read access to platform_monthly_stats" ON platform_monthly_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON platform_monthly_stats
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON platform_monthly_stats
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON platform_monthly_stats
  FOR DELETE
  USING (true);
