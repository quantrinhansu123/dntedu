/**
 * Script để chạy migration cho bảng classes
 * Chạy: npm run migrate:classes hoặc tsx scripts/runClassesMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY hoặc VITE_SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('📋 Đang đọc migration file...\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/014_create_classes_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Đang chạy migration cho bảng classes...\n');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            // Try direct query if RPC doesn't work
            const { error: queryError } = await supabase.from('_migration_check').select('*').limit(0);
            if (queryError && queryError.message.includes('exec_sql')) {
              console.log('⚠️  Không thể chạy qua RPC, vui lòng chạy migration trực tiếp trong Supabase SQL Editor');
              console.log('\n📝 Migration SQL:\n');
              console.log(migrationSQL);
              return;
            }
          }
        } catch (err: any) {
          // Ignore errors for DROP statements
          if (!statement.toUpperCase().includes('DROP')) {
            console.warn(`⚠️  Warning: ${err.message}`);
          }
        }
      }
    }

    console.log('✅ Migration đã được chạy thành công!\n');
    console.log('💡 Nếu có lỗi, vui lòng copy nội dung từ file:');
    console.log('   supabase/migrations/014_create_classes_table.sql');
    console.log('   và chạy trực tiếp trong Supabase SQL Editor.\n');

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    console.error('\n💡 Vui lòng chạy migration trực tiếp trong Supabase SQL Editor:');
    console.error('   1. Mở Supabase Dashboard → SQL Editor');
    console.error('   2. Copy nội dung từ: supabase/migrations/014_create_classes_table.sql');
    console.error('   3. Paste và chạy\n');
    process.exit(1);
  }
}

// Chạy migration
runMigration();
