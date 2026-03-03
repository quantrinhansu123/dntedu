/**
 * Script để đồng bộ dữ liệu lớp học từ Firestore sang Supabase
 * Bảng classes đã tồn tại trong Supabase, chỉ cần sync dữ liệu
 * Chạy: npm run sync:classes
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { ClassModel } from '../types';
import { createClass, updateClass, getAllClasses } from '../src/services/classSupabaseService';

async function syncClassesToSupabase() {
  try {
    console.log('🔄 Bắt đầu đồng bộ lớp học từ Firestore sang Supabase...');
    console.log('📋 Bảng classes đã tồn tại trong Supabase, chỉ đồng bộ dữ liệu\n');
    
    // Lấy tất cả lớp học từ Firestore
    console.log('📥 Đang lấy dữ liệu từ Firestore...');
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    const firestoreClasses: ClassModel[] = [];
    
    classesSnapshot.forEach((doc) => {
      const data = doc.data();
      firestoreClasses.push({
        id: doc.id,
        ...data,
      } as ClassModel);
    });
    
    console.log(`✅ Tìm thấy ${firestoreClasses.length} lớp học trong Firestore\n`);
    
    // Lấy tất cả lớp học từ Supabase
    console.log('📥 Đang lấy dữ liệu từ Supabase...');
    let supabaseClasses: ClassModel[] = [];
    let supabaseClassIds = new Set<string>();
    
    try {
      supabaseClasses = await getAllClasses();
      supabaseClassIds = new Set(supabaseClasses.map(c => c.id));
      console.log(`✅ Đã có ${supabaseClasses.length} lớp học trong Supabase\n`);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('❌ Lỗi: Bảng "classes" không tồn tại trong Supabase!');
        console.error('   Vui lòng tạo bảng classes trước khi chạy sync.\n');
        process.exit(1);
      }
      throw error;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ id: string; name: string; error: string }> = [];
    
    console.log('🔄 Bắt đầu đồng bộ từng lớp học...\n');
    
    // Sync từng lớp học
    for (let i = 0; i < firestoreClasses.length; i++) {
      const classData = firestoreClasses[i];
      const progress = `[${i + 1}/${firestoreClasses.length}]`;
      
      try {
        if (supabaseClassIds.has(classData.id)) {
          // Cập nhật nếu đã tồn tại
          await updateClass(classData.id, classData);
          updated++;
          console.log(`${progress} ✅ Đã cập nhật: ${classData.name} (${classData.id})`);
        } else {
          // Tạo mới nếu chưa có
          await createClass(classData);
          created++;
          console.log(`${progress} ✨ Đã tạo mới: ${classData.name} (${classData.id})`);
        }
      } catch (error: any) {
        skipped++;
        const errorMsg = error.message || String(error);
        errors.push({ id: classData.id, name: classData.name, error: errorMsg });
        console.error(`${progress} ❌ Lỗi: ${classData.name} (${classData.id}) - ${errorMsg}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 TÓM TẮT ĐỒNG BỘ:');
    console.log('='.repeat(50));
    console.log(`   ✨ Tạo mới:     ${created}`);
    console.log(`   ✅ Cập nhật:    ${updated}`);
    console.log(`   ⏭️  Bỏ qua:      ${skipped}`);
    console.log(`   📊 Tổng cộng:   ${firestoreClasses.length}`);
    
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
syncClassesToSupabase();
