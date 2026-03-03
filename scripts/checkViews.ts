/**
 * Script để kiểm tra các views đã được tạo trong Supabase
 * Chạy: npm run check:views
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

async function checkViews() {
  try {
    console.log('🔍 Đang kiểm tra các views trong Supabase...\n');

    const views = [
      'staff_view',
      'products_view',
      'centers_view',
      'centers_management_view',
      'curriculums_view',
      'parents_view',
      'students_view',
      'financial_transactions_view',
    ];

    for (const viewName of views) {
      try {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${viewName}: ${error.message}`);
        } else {
          console.log(`✅ ${viewName}: OK (có thể query được)`);
        }
      } catch (err: any) {
        console.log(`❌ ${viewName}: ${err.message}`);
      }
    }

    console.log('\n💡 Nếu view chưa tồn tại, hãy chạy migrations trong Supabase SQL Editor.');
    console.log('   Chạy: npm run migrate:all để xem tất cả migrations.\n');

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Chạy script
checkViews();
