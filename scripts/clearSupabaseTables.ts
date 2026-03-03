/**
 * Script để xóa tất cả các bảng trong Supabase database
 * CẢNH BÁO: Script này sẽ xóa TẤT CẢ dữ liệu trong database!
 * Chạy: npm run clear:supabase
 */

import { supabaseAdmin } from '../src/config/supabase';

async function clearAllTables() {
  try {
    console.log('⚠️  CẢNH BÁO: Script này sẽ xóa TẤT CẢ các bảng trong Supabase!');
    console.log('📋 Bắt đầu xóa các bảng...\n');

    // Lấy danh sách tất cả các bảng trong database
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (tablesError) {
      // Nếu không query được từ information_schema, thử cách khác
      console.log('⚠️  Không thể lấy danh sách bảng từ information_schema');
      console.log('📝 Sử dụng cách xóa trực tiếp bằng SQL...\n');
      
      // Danh sách các bảng thường có trong Supabase
      const commonTables = [
        'classes',
        'students',
        'staff',
        'attendance',
        'contracts',
        'courses',
        'curriculums',
        'rooms',
        'branches',
        'centers',
        'enrollments',
        'class_sessions',
        'work_sessions',
        'tutoring',
        'leads',
        'campaigns',
        'invoices',
        'feedback',
        'feedbacks',
        'homework',
        'homework_records',
        'homework_statuses',
        'test_comments',
        'monthly_comments',
        'birthday_gifts',
        'staff_reward_penalty',
        'reward_penalty_config',
        'staff_attendance',
        'holidays',
        'products',
        'discounts',
        'financial_transactions',
        'staff_salaries',
        'salary_rules',
        'actual_salaries',
        'salary_ranges',
        'student_attendance',
        'attendance_audit_log',
        'parents',
        'feedback_campaigns',
      ];

      let deleted = 0;
      let errors = 0;

      for (const tableName of commonTables) {
        try {
          // Xóa bảng bằng cách drop table
          const { error } = await supabaseAdmin.rpc('exec_sql', {
            sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
          });

          // Xóa tất cả dữ liệu trong bảng
          const { error: deleteError } = await supabaseAdmin
            .from(tableName)
            .delete()
            .neq('id', 'nonexistent'); // Delete all rows

          if (deleteError) {
            if (deleteError.message.includes('does not exist') || deleteError.message.includes('relation')) {
              // Bảng không tồn tại, bỏ qua
              console.log(`   ⏭️  Bảng không tồn tại: ${tableName}`);
            } else {
              console.log(`   ⚠️  Không thể xóa dữ liệu trong ${tableName}: ${deleteError.message}`);
              errors++;
            }
          } else {
            console.log(`   ✅ Đã xóa dữ liệu trong bảng: ${tableName}`);
            deleted++;
          }
        } catch (err: any) {
          // Bảng có thể không tồn tại, bỏ qua
          if (!err.message?.includes('does not exist') && !err.message?.includes('relation')) {
            console.log(`   ⚠️  Lỗi khi xóa ${tableName}: ${err.message}`);
            errors++;
          }
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log('📈 TÓM TẮT:');
      console.log('='.repeat(50));
      console.log(`   ✅ Đã xóa: ${deleted} bảng/dữ liệu`);
      console.log(`   ⚠️  Lỗi: ${errors}`);
      console.log('\n💡 Lưu ý: Một số bảng có thể không tồn tại hoặc cần xóa thủ công bằng SQL');
      console.log('   Vui lòng kiểm tra Supabase Dashboard để xác nhận.\n');

    } else {
      // Xóa từng bảng
      const tableNames = tables?.map(t => t.table_name) || [];
      
      if (tableNames.length === 0) {
        console.log('✅ Không có bảng nào để xóa.');
        return;
      }

      console.log(`📊 Tìm thấy ${tableNames.length} bảng:\n`);
      tableNames.forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
      });
      console.log('');

      let deleted = 0;
      let errors = 0;

      for (const tableName of tableNames) {
        try {
          // Xóa tất cả dữ liệu trong bảng
          const { error } = await supabaseAdmin
            .from(tableName)
            .delete()
            .neq('id', 'nonexistent'); // Delete all rows

          if (error) {
            console.log(`   ❌ Lỗi khi xóa ${tableName}: ${error.message}`);
            errors++;
          } else {
            console.log(`   ✅ Đã xóa dữ liệu trong bảng: ${tableName}`);
            deleted++;
          }
        } catch (err: any) {
          console.log(`   ⚠️  Lỗi khi xóa ${tableName}: ${err.message}`);
          errors++;
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log('📈 TÓM TẮT:');
      console.log('='.repeat(50));
      console.log(`   ✅ Đã xóa dữ liệu trong: ${deleted} bảng`);
      console.log(`   ❌ Lỗi: ${errors} bảng`);
      console.log('\n💡 Lưu ý: Script này chỉ xóa dữ liệu, không xóa cấu trúc bảng.');
      console.log('   Để xóa hoàn toàn bảng, cần chạy SQL: DROP TABLE <table_name> CASCADE;\n');
    }

    console.log('🎉 Hoàn thành!');

  } catch (error: any) {
    console.error('\n❌ Lỗi khi xóa bảng:', error.message || error);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    console.error('\n💡 Gợi ý: Có thể cần xóa bảng thủ công bằng SQL trong Supabase Dashboard:');
    console.error('   1. Vào SQL Editor');
    console.error('   2. Chạy: DROP TABLE IF EXISTS <table_name> CASCADE;');
    process.exit(1);
  }
}

// Chạy script
clearAllTables();
