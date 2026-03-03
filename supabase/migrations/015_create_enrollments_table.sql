-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  student_name TEXT NOT NULL,
  class_id TEXT,
  class_name TEXT,
  sessions INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('Hợp đồng mới', 'Hợp đồng tái phí', 'Hợp đồng liên kết', 'Thanh toán thêm', 'Ghi danh thủ công', 'Tặng buổi', 'Nhận tặng buổi', 'Chuyển lớp', 'Xóa khỏi lớp')),
  contract_code TEXT,
  contract_id TEXT,
  original_amount NUMERIC(12,2),
  final_amount NUMERIC(12,2),
  created_date TEXT, -- Format: DD/MM/YYYY
  created_by TEXT NOT NULL,
  staff TEXT, -- Alias for created_by
  note TEXT,
  notes TEXT, -- Alias for note
  reason TEXT, -- Lý do thay đổi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_contract_code ON enrollments(contract_code) WHERE contract_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_type ON enrollments(type);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at 
  BEFORE UPDATE ON enrollments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_enrollments_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS enrollments_view CASCADE;
CREATE VIEW enrollments_view AS
SELECT 
  id,
  student_id,
  student_name,
  class_id,
  class_name,
  sessions,
  type,
  contract_code,
  contract_id,
  original_amount,
  final_amount,
  created_date,
  created_by,
  staff,
  note,
  notes,
  reason,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN sessions > 0 THEN true 
    ELSE false 
  END AS is_positive,
  CASE 
    WHEN type IN ('Hợp đồng mới', 'Hợp đồng tái phí', 'Hợp đồng liên kết') THEN true 
    ELSE false 
  END AS is_contract_based
FROM enrollments;

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON enrollments;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON enrollments;

-- Policies
CREATE POLICY "Allow read access to enrollments" ON enrollments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON enrollments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON enrollments
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON enrollments
  FOR DELETE
  USING (true);
