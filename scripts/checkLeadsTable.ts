/**
 * Script để kiểm tra xem bảng leads đã tồn tại chưa
 * Chạy: npx tsx scripts/checkLeadsTable.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLeadsTable() {
  try {
    console.log('🔍 Đang kiểm tra bảng leads...\n');

    // Try to query the table
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
        console.log('❌ Bảng leads CHƯA TỒN TẠI trong Supabase!\n');
        console.log('📋 Bạn cần chạy migration để tạo bảng:\n');
        console.log('   1. Mở Supabase Dashboard: https://supabase.com/dashboard');
        console.log('   2. Chọn project của bạn');
        console.log('   3. Vào mục "SQL Editor"');
        console.log('   4. Copy SQL từ file: supabase/migrations/028_create_leads_table.sql');
        console.log('   5. Hoặc chạy: npx tsx scripts/runLeadsMigration.ts để xem SQL');
        console.log('   6. Paste và chạy SQL trong SQL Editor\n');
        return;
      }
      throw error;
    }

    console.log('✅ Bảng leads ĐÃ TỒN TẠI trong Supabase!');
    console.log(`📊 Số lượng records: ${data ? data.length : 0}\n`);

  } catch (error: any) {
    console.error('❌ Lỗi khi kiểm tra:', error.message);
    if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
      console.log('\n📋 Bạn cần chạy migration để tạo bảng leads.\n');
    }
  }
}

checkLeadsTable();
