/**
 * Script test để kiểm tra việc insert dữ liệu vào bảng staff
 * Chạy: npm run test:staff-insert
 */

import { createStaff } from '../src/services/staffSupabaseService';
import { Staff } from '../types';

async function testStaffInsert() {
  try {
    console.log('🧪 Bắt đầu test insert nhân sự vào Supabase...\n');

    // Tạo dữ liệu test
    const testStaff: Staff = {
      id: 'test-staff-' + Date.now(),
      name: 'Nguyễn Văn Test',
      code: 'TEST001',
      role: 'Giáo viên',
      roles: ['Giáo viên'],
      department: 'Giảng dạy',
      position: 'Giáo viên Tiếng Anh',
      phone: '0123456789',
      email: 'test@example.com',
      status: 'Active',
      dob: '1990-01-01',
      startDate: '2024-01-01',
      branch: 'Cơ sở 1',
      gender: 'Nam',
      idNumber: '001234567890',
      idIssueDate: '2010-01-01',
      idIssuePlace: 'Công an TP.HCM',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      permanentAddress: '123 Đường ABC, Quận 1, TP.HCM',
      bankAccount: '1234567890',
      bankName: 'Vietcombank',
      taxCode: '123456789',
      insuranceNumber: '987654321',
      education: 'Đại học',
      degree: 'Cử nhân',
      major: 'Tiếng Anh',
      certificates: ['IELTS 7.0', 'TOEIC 850'],
      salaryGrade: 3,
      salaryCoefficient: 2.5,
      baseSalary: 10000000,
      allowance: 2000000,
      currentContractType: 'Chính thức',
      contractStartDate: '2024-01-01',
      contractEndDate: '2025-12-31',
      avatar: '',
      notes: 'Nhân viên test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('📝 Dữ liệu test:');
    console.log(JSON.stringify(testStaff, null, 2));
    console.log('\n');

    // Thử insert
    console.log('🔄 Đang insert vào Supabase...');
    const result = await createStaff(testStaff);

    console.log('✅ Insert thành công!');
    console.log('📊 Kết quả:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n🎉 Test hoàn thành!');

  } catch (error: any) {
    console.error('\n❌ Lỗi khi test:', error.message || error);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.details) {
      console.error(`   Details: ${error.details}`);
    }
    if (error.hint) {
      console.error(`   Hint: ${error.hint}`);
    }
    process.exit(1);
  }
}

// Chạy test
testStaffInsert();
