/**
 * Script để kiểm tra bảng marketing_tasks trong Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMarketingTasks() {
  try {
    console.log('🔍 Đang kiểm tra bảng marketing_tasks trong Supabase...\n');

    // Thử query bảng
    const { data, error } = await supabase
      .from('marketing_tasks')
      .select('*')
      .limit(5);

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01') {
        console.log('❌ Bảng marketing_tasks CHƯA TỒN TẠI');
        console.log('\n📝 Cần chạy migration:');
        console.log('   1. Mở Supabase Dashboard → SQL Editor');
        console.log('   2. Copy nội dung file: supabase/migrations/023_create_marketing_tasks_table.sql');
        console.log('   3. Paste và chạy SQL\n');
      } else {
        console.log(`❌ Lỗi khi query bảng: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log('✅ Bảng marketing_tasks ĐÃ TỒN TẠI');
      console.log(`📊 Số lượng task hiện có: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('\n📋 Danh sách tasks:');
        data.forEach((task: any, index: number) => {
          console.log(`   ${index + 1}. ${task.title || 'N/A'} - ${task.status || 'N/A'}`);
        });
      } else {
        console.log('\n💡 Bảng đã tồn tại nhưng chưa có dữ liệu.');
        console.log('   Bạn có thể tạo task mới từ giao diện web.\n');
      }
    }

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Chạy script
checkMarketingTasks();
