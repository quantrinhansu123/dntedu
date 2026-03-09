-- Create marketing_kpis table
CREATE TABLE IF NOT EXISTS marketing_kpis (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  staff_id TEXT NOT NULL, -- ID nhân viên
  staff_name TEXT NOT NULL, -- Tên nhân viên (denormalized)
  month TEXT NOT NULL, -- Tháng (format: "2024-12")
  target_name TEXT NOT NULL, -- Tên mục tiêu
  target_value NUMERIC NOT NULL DEFAULT 0, -- Giá trị mục tiêu
  actual_value NUMERIC NOT NULL DEFAULT 0, -- Giá trị thực tế
  weight INTEGER NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100), -- Tỷ trọng (%) 0-100
  unit TEXT, -- Đơn vị (leads, contracts, ...)
  notes TEXT, -- Ghi chú
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_staff_id ON marketing_kpis(staff_id);
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_month ON marketing_kpis(month);
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_staff_month ON marketing_kpis(staff_id, month);
CREATE INDEX IF NOT EXISTS idx_marketing_kpis_created_at ON marketing_kpis(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_marketing_kpis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_marketing_kpis_updated_at ON marketing_kpis;
CREATE TRIGGER update_marketing_kpis_updated_at 
  BEFORE UPDATE ON marketing_kpis 
  FOR EACH ROW 
  EXECUTE FUNCTION update_marketing_kpis_updated_at();

-- Enable RLS
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to marketing_kpis" ON marketing_kpis;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON marketing_kpis;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON marketing_kpis;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON marketing_kpis;

-- Policies
CREATE POLICY "Allow read access to marketing_kpis" ON marketing_kpis
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON marketing_kpis
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON marketing_kpis
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON marketing_kpis
  FOR DELETE
  USING (true);
