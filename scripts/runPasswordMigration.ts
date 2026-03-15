/**
 * Script helper để chạy migration thêm cột password vào bảng staff
 * 
 * HƯỚNG DẪN:
 * 1. Mở Supabase Dashboard: https://app.supabase.com
 * 2. Chọn project của bạn
 * 3. Vào SQL Editor
 * 4. Copy toàn bộ nội dung SQL bên dưới và paste vào SQL Editor
 * 5. Click "Run" để chạy migration
 */

const SQL_MIGRATION = `
-- Add password column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;

-- Create index for email lookup (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email) WHERE email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN staff.password IS 'Mật khẩu đăng nhập (plain text hoặc hashed)';
`;

console.log('='.repeat(80));
console.log('MIGRATION: Thêm cột password vào bảng staff');
console.log('='.repeat(80));
console.log('\n📋 HƯỚNG DẪN CHẠY MIGRATION:\n');
console.log('1. Mở Supabase Dashboard: https://app.supabase.com');
console.log('2. Chọn project của bạn');
console.log('3. Vào SQL Editor (menu bên trái)');
console.log('4. Copy toàn bộ SQL bên dưới và paste vào SQL Editor');
console.log('5. Click "Run" để chạy migration\n');
console.log('='.repeat(80));
console.log('SQL MIGRATION:');
console.log('='.repeat(80));
console.log(SQL_MIGRATION);
console.log('='.repeat(80));
console.log('\n✅ Sau khi chạy migration thành công, bạn có thể:');
console.log('   - Thêm/sửa password cho nhân viên trong form');
console.log('   - Đăng nhập bằng email và password từ bảng staff\n');
