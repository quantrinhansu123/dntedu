-- Create leads table (Customer Database)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, -- Tên phụ huynh/khách hàng
  phone TEXT NOT NULL, -- Số điện thoại
  email TEXT, -- Email
  child_name TEXT, -- Tên con (nếu có)
  child_age INTEGER, -- Tuổi con (nếu có)
  source TEXT NOT NULL CHECK (source IN ('Facebook', 'Zalo', 'Website', 'Giới thiệu', 'Walk-in', 'Khác')), -- Nguồn khách hàng
  status TEXT NOT NULL DEFAULT 'Mới' CHECK (status IN ('Mới', 'Đang liên hệ', 'Quan tâm', 'Hẹn test', 'Đã test', 'Đăng ký', 'Từ chối')), -- Trạng thái
  assigned_to TEXT, -- ID nhân viên được phân công
  assigned_to_name TEXT, -- Tên nhân viên (denormalized)
  campaign_ids JSONB DEFAULT '[]'::jsonb, -- Array of campaign IDs
  campaign_names JSONB DEFAULT '[]'::jsonb, -- Array of campaign names (denormalized)
  campaign_id TEXT, -- Legacy single campaign ID (for backward compatibility)
  campaign_name TEXT, -- Legacy single campaign name (for backward compatibility)
  note TEXT, -- Ghi chú
  last_contact_date DATE, -- Ngày liên hệ cuối cùng
  next_follow_up DATE, -- Ngày follow-up tiếp theo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_last_contact_date ON leads(last_contact_date) WHERE last_contact_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up) WHERE next_follow_up IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Create GIN indexes for JSONB arrays
CREATE INDEX IF NOT EXISTS idx_leads_campaign_ids ON leads USING GIN (campaign_ids);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_leads_updated_at();

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to leads" ON leads;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON leads;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON leads;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON leads;

-- Policies
CREATE POLICY "Allow read access to leads" ON leads
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON leads
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON leads
  FOR DELETE
  USING (true);
