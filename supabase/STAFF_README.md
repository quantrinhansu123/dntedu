# Supabase Setup cho Nhân sự (Staff)

## Cách tạo bảng staff trong Supabase

### Chạy SQL Migration

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy nội dung file `supabase/migrations/002_create_staff_table.sql`
5. Paste và chạy SQL

## Cấu trúc Bảng

Bảng `staff` bao gồm:
- Tất cả các field từ `Staff` interface
- `roles` và `certificates` được lưu dưới dạng JSONB
- Indexes để tối ưu query: code, role, status, department, branch, email
- Trigger tự động cập nhật `updated_at`
- View `staff_view` với các computed fields: `is_active`, `is_contract_expired`, `age`, `days_since_creation`

## Mapping Fields

Service sẽ tự động map các field từ Firestore sang Supabase:
- `startDate` → `start_date`
- `idNumber` → `id_number`
- `idIssueDate` → `id_issue_date`
- `idIssuePlace` → `id_issue_place`
- `permanentAddress` → `permanent_address`
- `bankAccount` → `bank_account`
- `bankName` → `bank_name`
- `taxCode` → `tax_code`
- `insuranceNumber` → `insurance_number`
- `salaryGrade` → `salary_grade`
- `salaryCoefficient` → `salary_coefficient`
- `baseSalary` → `base_salary`
- `currentContractId` → `current_contract_id`
- `currentContractType` → `current_contract_type`
- `contractStartDate` → `contract_start_date`
- `contractEndDate` → `contract_end_date`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `roles` và `certificates` → JSON strings

## Đồng bộ dữ liệu từ Firestore

Sau khi tạo bảng, chạy script để đồng bộ dữ liệu:

```bash
npm run sync:staff
```

Script sẽ:
- Lấy tất cả nhân sự từ Firestore
- Kiểm tra xem nhân sự đã tồn tại trong Supabase chưa
- Tạo mới nếu chưa có
- Cập nhật nếu đã tồn tại

## Sử dụng Service

```typescript
import { 
  getAllStaff, 
  getStaffById, 
  createStaff, 
  updateStaff,
  queryStaff 
} from '@/src/services/staffSupabaseService';

// Lấy tất cả nhân sự
const staff = await getAllStaff();

// Lấy nhân sự theo ID
const staffMember = await getStaffById('staff-id');

// Tạo nhân sự mới
await createStaff(staffData);

// Cập nhật nhân sự
await updateStaff('staff-id', { name: 'New Name' });

// Query với filter
const activeStaff = await queryStaff({ status: 'Active' });
const teachers = await queryStaff({ role: 'Giáo viên' });
```

## Row Level Security (RLS)

Hiện tại RLS đã được enable nhưng policies cho phép tất cả. Bạn nên customize policies theo yêu cầu bảo mật của mình.
