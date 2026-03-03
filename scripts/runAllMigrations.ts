/**
 * Script để hiển thị tất cả SQL migrations
 * Chạy: npm run migrate:all
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function runAllMigrations() {
  try {
    console.log('🚀 Tất cả migrations cho Supabase\n');

    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== '009_create_all_tables.sql')
      .sort((a, b) => {
        // Sort by number prefix (002, 003, 010, etc.)
        const numA = parseInt(a.match(/^\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/^\d+/)?.[0] || '0');
        return numA - numB;
      });

    console.log(`📄 Tìm thấy ${files.length} migration files:\n`);
    files.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f}`);
    });
    console.log('\n');

    console.log('📋 HƯỚNG DẪN CHẠY MIGRATIONS:\n');
    console.log('   1. Mở Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Chọn project của bạn');
    console.log('   3. Vào mục "SQL Editor" ở sidebar bên trái');
    console.log('   4. Chạy từng migration file theo thứ tự:\n');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      console.log('─'.repeat(80));
      console.log(`📄 MIGRATION ${i + 1}/${files.length}: ${file}`);
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
      console.log('\n');
    }

    console.log('✅ Sau khi chạy tất cả migrations, các bảng sẽ được tạo trong Supabase.\n');
    console.log('💡 Lưu ý: Chạy migrations theo thứ tự số (002, 003, 004, ...)\n');

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Chạy script
runAllMigrations();
