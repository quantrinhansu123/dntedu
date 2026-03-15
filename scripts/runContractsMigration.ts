/**
 * Helper script để hiển thị SQL migration cho contracts table
 * Chạy script này để xem SQL và hướng dẫn chạy migration trong Supabase
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.join(__dirname, '../supabase/migrations/032_create_contracts_table.sql');

console.log('='.repeat(80));
console.log('MIGRATION: Tạo bảng contracts trong Supabase');
console.log('='.repeat(80));
console.log('\n');

try {
  const sql = fs.readFileSync(migrationFile, 'utf-8');
  console.log('SQL Migration:');
  console.log('-'.repeat(80));
  console.log(sql);
  console.log('-'.repeat(80));
  console.log('\n');
  
  console.log('HƯỚNG DẪN CHẠY MIGRATION:');
  console.log('1. Mở Supabase Dashboard: https://app.supabase.com');
  console.log('2. Chọn project của bạn');
  console.log('3. Vào SQL Editor');
  console.log('4. Copy toàn bộ SQL ở trên và paste vào SQL Editor');
  console.log('5. Click "Run" để thực thi migration');
  console.log('\n');
  
  console.log('LƯU Ý:');
  console.log('- Migration này sẽ tạo bảng contracts với đầy đủ các cột cần thiết');
  console.log('- Bảng sẽ có RLS (Row Level Security) được bật');
  console.log('- Các policies cho phép authenticated users đọc/ghi/xóa');
  console.log('\n');
  
} catch (error) {
  console.error('Lỗi khi đọc file migration:', error);
  process.exit(1);
}
