-- Add password column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;

-- Create index for email lookup (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email) WHERE email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN staff.password IS 'Mật khẩu đăng nhập (plain text hoặc hashed)';
