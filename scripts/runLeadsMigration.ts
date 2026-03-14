/**
 * Script để chạy migration cho bảng leads
 * Chạy: npx tsx scripts/runLeadsMigration.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function showMigration() {
  try {
    console.log('📋 Đang đọc migration file...\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/028_create_leads_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 MIGRATION SQL CHO BẢNG LEADS\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('\n');

    console.log('📋 HƯỚNG DẪN CHẠY MIGRATION:\n');
    console.log('   1. Mở Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Chọn project của bạn');
    console.log('   3. Vào mục "SQL Editor" ở sidebar bên trái');
    console.log('   4. Copy toàn bộ SQL ở trên');
    console.log('   5. Paste vào SQL Editor và nhấn "Run" (hoặc Ctrl+Enter)\n');
    console.log('✅ Sau khi chạy migration, bảng leads sẽ được tạo.\n');
    console.log('💡 Sau đó bạn có thể thử tạo khách hàng tiềm năng lại trong ứng dụng.\n');

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Chạy script
showMigration();
