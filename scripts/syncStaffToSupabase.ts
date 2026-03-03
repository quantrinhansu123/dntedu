/**
 * Script để đồng bộ dữ liệu nhân sự từ Firestore sang Supabase
 * Chạy: npm run sync:staff
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { Staff } from '../types';
import { createStaff, updateStaff, getAllStaff } from '../src/services/staffSupabaseService';

async function syncStaffToSupabase() {
  try {
    console.log('🔄 Bắt đầu đồng bộ nhân sự từ Firestore sang Supabase...');
    console.log('📋 Bảng staff đã tồn tại trong Supabase, chỉ đồng bộ dữ liệu\n');
    
    // Lấy tất cả nhân sự từ Firestore
    console.log('📥 Đang lấy dữ liệu từ Firestore...');
    const staffSnapshot = await getDocs(collection(db, 'staff'));
    const firestoreStaff: Staff[] = [];
    
    staffSnapshot.forEach((doc) => {
      const data = doc.data();
      // Đảm bảo các field bắt buộc có giá trị
      const staffData: Staff = {
        id: doc.id,
        name: data.name || '',
        code: data.code || doc.id,
        role: data.role || 'Nhân viên',
        department: data.department || '',
        position: data.position || '',
        phone: data.phone || '',
        status: data.status || 'Active',
        ...data,
      } as Staff;
      firestoreStaff.push(staffData);
    });
    
    console.log(`✅ Tìm thấy ${firestoreStaff.length} nhân sự trong Firestore\n`);
    
    // Lấy tất cả nhân sự từ Supabase
    console.log('📥 Đang lấy dữ liệu từ Supabase...');
    let supabaseStaff: Staff[] = [];
    let supabaseStaffIds = new Set<string>();
    
    try {
      supabaseStaff = await getAllStaff();
      supabaseStaffIds = new Set(supabaseStaff.map(s => s.id));
      console.log(`✅ Đã có ${supabaseStaff.length} nhân sự trong Supabase\n`);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('❌ Lỗi: Bảng "staff" không tồn tại trong Supabase!');
        console.error('   Vui lòng chạy SQL migration để tạo bảng staff trước.\n');
        process.exit(1);
      }
      throw error;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ id: string; name: string; error: string }> = [];
    
    console.log('🔄 Bắt đầu đồng bộ từng nhân sự...\n');
    
    // Sync từng nhân sự
    for (let i = 0; i < firestoreStaff.length; i++) {
      const staffData = firestoreStaff[i];
      const progress = `[${i + 1}/${firestoreStaff.length}]`;
      
      try {
        if (supabaseStaffIds.has(staffData.id)) {
          // Cập nhật nếu đã tồn tại
          await updateStaff(staffData.id, staffData);
          updated++;
          console.log(`${progress} ✅ Đã cập nhật: ${staffData.name} (${staffData.code})`);
        } else {
          // Tạo mới nếu chưa có
          await createStaff(staffData);
          created++;
          console.log(`${progress} ✨ Đã tạo mới: ${staffData.name} (${staffData.code})`);
        }
      } catch (error: any) {
        skipped++;
        const errorMsg = error.message || String(error);
        errors.push({ id: staffData.id, name: staffData.name, error: errorMsg });
        console.error(`${progress} ❌ Lỗi: ${staffData.name} (${staffData.code}) - ${errorMsg}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 TÓM TẮT ĐỒNG BỘ:');
    console.log('='.repeat(50));
    console.log(`   ✨ Tạo mới:     ${created}`);
    console.log(`   ✅ Cập nhật:    ${updated}`);
    console.log(`   ⏭️  Bỏ qua:      ${skipped}`);
    console.log(`   📊 Tổng cộng:   ${firestoreStaff.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ CÁC LỖI ĐÃ XẢY RA:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.name} (${err.id}): ${err.error}`);
      });
    }
    
    console.log('\n🎉 Hoàn thành đồng bộ!');
    
  } catch (error: any) {
    console.error('\n❌ Lỗi khi đồng bộ:', error.message || error);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Chạy script
syncStaffToSupabase();
