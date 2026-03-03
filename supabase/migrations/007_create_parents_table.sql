-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT, -- 'Bố', 'Mẹ', 'Người giám hộ'
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email) WHERE email IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_parents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;
CREATE TRIGGER update_parents_updated_at 
  BEFORE UPDATE ON parents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_parents_updated_at();

-- Create view for easier querying
DROP VIEW IF EXISTS parents_view CASCADE;
CREATE VIEW parents_view AS
SELECT 
  id,
  name,
  phone,
  email,
  relationship,
  address,
  notes,
  created_at,
  updated_at,
  -- Computed fields
  CASE 
    WHEN email IS NOT NULL AND email != '' THEN true 
    ELSE false 
  END AS has_email
FROM parents;

-- Enable RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Allow read access to parents" ON parents;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON parents;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON parents;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON parents;

-- Policies
CREATE POLICY "Allow read access to parents" ON parents
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON parents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON parents
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for authenticated users" ON parents
  FOR DELETE
  USING (true);
