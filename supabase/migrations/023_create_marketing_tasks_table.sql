-- Create marketing_tasks table
CREATE TABLE IF NOT EXISTS marketing_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL, -- Tên task
  description TEXT DEFAULT '', -- Mô tả
  assigned_to JSONB DEFAULT '[]'::jsonb, -- Array of staff IDs (as strings, not UUIDs)
  assigned_to_names JSONB DEFAULT '[]'::jsonb, -- Array of staff names (denormalized)
  campaign_id TEXT, -- ID chiến dịch liên quan
  campaign_name TEXT, -- Tên chiến dịch (denormalized)
  status TEXT NOT NULL DEFAULT 'Chưa bắt đầu', -- Trạng thái: Chưa bắt đầu, Đang làm, Hoàn thành, Hủy
  priority TEXT NOT NULL DEFAULT 'Trung bình', -- Độ ưu tiên: Thấp, Trung bình, Cao
  due_date DATE NOT NULL, -- Deadline
  completed_date DATE, -- Ngày hoàn thành
  result TEXT, -- Kết quả chi tiết
  completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100), -- Tiến độ 0-100
  notes TEXT, -- Ghi chú
  created_by TEXT, -- Người tạo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_status ON marketing_tasks(status);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_priority ON marketing_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_due_date ON marketing_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_campaign_id ON marketing_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_created_at ON marketing_tasks(created_at);

-- Create GIN index for assigned_to array search
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_assigned_to ON marketing_tasks USING GIN (assigned_to);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_marketing_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_marketing_tasks_updated_at ON marketing_tasks;
CREATE TRIGGER update_marketing_tasks_updated_at 
  BEFORE UPDATE ON marketing_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_marketing_tasks_updated_at();

-- Enable RLS
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to marketing_tasks" ON marketing_tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON marketing_tasks;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON marketing_tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON marketing_tasks;

-- Policies
CREATE POLICY "Allow read access to marketing_tasks" ON marketing_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON marketing_tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON marketing_tasks
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON marketing_tasks
  FOR DELETE
  USING (true);
