-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Học viên', 'Học liệu')),
  category TEXT CHECK (category IN ('Hợp đồng mới', 'Hợp đồng tái phí', 'Hợp đồng liên kết')),
  
  -- Student Info
  student_id TEXT,
  student_name TEXT,
  student_dob DATE,
  parent_name TEXT,
  parent_phone TEXT,
  
  -- Items (JSONB array)
  items JSONB DEFAULT '[]'::jsonb,
  
  -- Financial
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount_in_words TEXT,
  
  -- Payment
  payment_method TEXT NOT NULL DEFAULT 'Tiền mặt' CHECK (payment_method IN ('Tiền mặt', 'Toàn bộ', 'Trả góp', 'Chuyển khoản')),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Dates
  contract_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  start_date DATE,
  payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date DATE,
  
  -- Class Info
  class_id TEXT,
  class_name TEXT,
  
  -- Session Info
  total_sessions INTEGER,
  price_per_session NUMERIC(12,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Lưu nháp' CHECK (status IN ('Lưu nháp', 'Chờ thanh toán', 'Đã thanh toán', 'Nợ hợp đồng', 'Đã hủy')),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_code ON contracts(code);
CREATE INDEX IF NOT EXISTS idx_contracts_student_id ON contracts(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_class_id ON contracts(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON contracts(contract_date);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_contracts_updated_at();

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to contracts" ON contracts;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON contracts;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON contracts;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON contracts;

-- Create RLS policies
CREATE POLICY "Allow read access to contracts" ON contracts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON contracts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON contracts
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON contracts
  FOR DELETE
  USING (true);
