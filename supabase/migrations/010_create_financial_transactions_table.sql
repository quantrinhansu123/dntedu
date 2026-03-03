-- Create financial_transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM format
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK (category IN ('Học phí', 'Sách vở', 'Đồng phục', 'Khác')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  student_id TEXT,
  student_name TEXT,
  contract_id TEXT,
  invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_month ON financial_transactions(month);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_student_id ON financial_transactions(student_id) WHERE student_id IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at 
  BEFORE UPDATE ON financial_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_financial_transactions_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS financial_transactions_view CASCADE;
CREATE VIEW financial_transactions_view AS
SELECT 
  id,
  date,
  month,
  type,
  category,
  amount,
  description,
  student_id,
  student_name,
  contract_id,
  invoice_id,
  created_at,
  created_by,
  updated_at,
  -- Computed fields
  CASE 
    WHEN type = 'income' THEN true 
    ELSE false 
  END AS is_income,
  EXTRACT(YEAR FROM date) AS year,
  EXTRACT(MONTH FROM date) AS month_number
FROM financial_transactions;

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON financial_transactions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON financial_transactions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON financial_transactions;

-- Policies
CREATE POLICY "Allow read access to financial_transactions" ON financial_transactions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON financial_transactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON financial_transactions
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON financial_transactions
  FOR DELETE
  USING (true);
