-- Fix contracts payment_method CHECK constraint
-- This migration ensures the CHECK constraint works correctly

-- First, drop the existing constraint
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_payment_method_check;

-- Update any invalid payment_method values to default
UPDATE contracts 
SET payment_method = 'Tiền mặt' 
WHERE payment_method IS NULL 
   OR payment_method NOT IN ('Tiền mặt', 'Toàn bộ', 'Trả góp', 'Chuyển khoản');

-- Recreate the constraint with explicit check
ALTER TABLE contracts 
ADD CONSTRAINT contracts_payment_method_check 
CHECK (payment_method IN ('Tiền mặt', 'Toàn bộ', 'Trả góp', 'Chuyển khoản'));

-- Ensure payment_method is NOT NULL
ALTER TABLE contracts 
ALTER COLUMN payment_method SET NOT NULL;

-- Set default value
ALTER TABLE contracts 
ALTER COLUMN payment_method SET DEFAULT 'Tiền mặt';
