# Supabase Sync cho Lớp học (Classes)

## Lưu ý

Bảng `classes` đã tồn tại trong Supabase. Script này chỉ đồng bộ dữ liệu từ Firestore sang Supabase, không tạo bảng mới.

## Mapping Fields

Service sẽ tự động map các field từ Firestore sang Supabase:
- `courseId` → `course_id`
- `courseName` → `course_name`
- `ageGroup` → `age_group`
- `totalSessions` → `total_sessions`
- `teacherId` → `teacher_id`
- `teacherDuration` → `teacher_duration`
- `assistantDuration` → `assistant_duration`
- `foreignTeacher` → `foreign_teacher`
- `foreignTeacherDuration` → `foreign_teacher_duration`
- `studentsCount` → `students_count`
- `trialStudents` → `trial_students`
- `activeStudents` → `active_students`
- `debtStudents` → `debt_students`
- `reservedStudents` → `reserved_students`
- `scheduleDetails` → `schedule_details` (JSON)
- `trainingHistory` → `training_history` (JSON)
- `startDate` → `start_date`
- `endDate` → `end_date`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

## Đồng bộ dữ liệu từ Firestore

Chạy script để đồng bộ dữ liệu:

```bash
npm run sync:classes
```

Script sẽ:
- Lấy tất cả lớp học từ Firestore
- Kiểm tra xem lớp học đã tồn tại trong Supabase chưa
- Tạo mới nếu chưa có
- Cập nhật nếu đã tồn tại

## Sử dụng Service

```typescript
import { 
  getAllClasses, 
  getClassById, 
  createClass, 
  updateClass,
  queryClasses 
} from '@/src/services/classSupabaseService';

// Lấy tất cả lớp học
const classes = await getAllClasses();

// Lấy lớp học theo ID
const classData = await getClassById('class-id');

// Tạo lớp học mới
await createClass(classModel);

// Cập nhật lớp học
await updateClass('class-id', { name: 'New Name' });

// Query với filter
const activeClasses = await queryClasses({ status: 'Đang học' });
```

## Row Level Security (RLS)

Hiện tại RLS đã được enable nhưng policies cho phép tất cả. Bạn nên customize policies theo yêu cầu bảo mật của mình.
