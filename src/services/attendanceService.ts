/**
 * Attendance Service
 * Handle attendance CRUD operations with Supabase
 */

import { AttendanceRecord, StudentAttendance, AttendanceStatus, StudentStatus } from '../../types';
import * as attendanceRecordSupabaseService from './attendanceRecordSupabaseService';
import * as studentAttendanceSupabaseService from './studentAttendanceSupabaseService';
import { StudentService } from './studentService';

/**
 * Create attendance record for a class session
 */
export const createAttendanceRecord = async (
  data: Omit<AttendanceRecord, 'id'>
): Promise<string> => {
  try {
    // Generate UUID for id
    const id = crypto.randomUUID();
    
    const recordData: AttendanceRecord = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    await attendanceRecordSupabaseService.createAttendanceRecord(recordData);
    return id;
  } catch (error) {
    console.error('Error creating attendance record:', error);
    throw new Error('Không thể tạo bản ghi điểm danh');
  }
};

/**
 * Get attendance record by ID
 */
export const getAttendanceRecord = async (id: string): Promise<AttendanceRecord | null> => {
  try {
    return await attendanceRecordSupabaseService.getAttendanceRecordById(id);
  } catch (error) {
    console.error('Error getting attendance record:', error);
    throw new Error('Không thể tải bản ghi điểm danh');
  }
};

/**
 * Get attendance records with optional filters
 */
export const getAttendanceRecords = async (filters?: {
  classId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> => {
  try {
    return await attendanceRecordSupabaseService.queryAttendanceRecords({
      classId: filters?.classId,
      date: filters?.date,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });
  } catch (error) {
    console.error('Error getting attendance records:', error);
    throw new Error('Không thể tải danh sách điểm danh');
  }
};

/**
 * Check if attendance already exists for class + date
 */
export const checkExistingAttendance = async (
  classId: string,
  date: string
): Promise<AttendanceRecord | null> => {
  try {
    return await attendanceRecordSupabaseService.checkExistingAttendance(classId, date);
  } catch (error) {
    console.error('Error checking existing attendance:', error);
    throw new Error('Lỗi kiểm tra điểm danh');
  }
};

/**
 * Save student attendance details
 */
export const saveStudentAttendance = async (
  attendanceId: string,
  students: Omit<StudentAttendance, 'id' | 'attendanceId'>[],
  classId?: string,
  className?: string,
  date?: string,
  sessionNumber?: number,
  sessionId?: string
): Promise<void> => {
  try {
    console.log('[saveStudentAttendance] Starting...', { attendanceId, studentsCount: students.length });
    
    if (students.length === 0) {
      console.warn('[saveStudentAttendance] No students to save!');
      return;
    }
    
    // Delete existing records for this attendance
    await studentAttendanceSupabaseService.deleteStudentAttendanceByAttendanceId(attendanceId);
    console.log('[saveStudentAttendance] Deleted existing records');
    
    // Add new records with extended fields
    console.log('[saveStudentAttendance] Adding', students.length, 'new records...');
    const studentAttendances: Omit<StudentAttendance, 'id'>[] = students.map(student => ({
      attendanceId,
      sessionId,
      studentId: student.studentId,
      studentName: student.studentName,
      studentCode: student.studentCode,
      classId,
      className,
      date,
      sessionNumber,
      status: student.status,
      note: student.note,
      homeworkCompletion: student.homeworkCompletion,
      testName: student.testName,
      score: student.score,
      bonusPoints: student.bonusPoints,
      punctuality: student.punctuality,
      isLate: student.isLate,
      createdAt: new Date().toISOString(),
    }));
    
    await studentAttendanceSupabaseService.createMultipleStudentAttendance(studentAttendances);
    console.log('[saveStudentAttendance] Saved', students.length, 'students');
  } catch (error) {
    console.error('[saveStudentAttendance] Error:', error);
    throw new Error('Không thể lưu điểm danh học sinh');
  }
};

/**
 * Get student attendance for a record
 */
export const getStudentAttendance = async (
  attendanceId: string
): Promise<StudentAttendance[]> => {
  try {
    return await studentAttendanceSupabaseService.getStudentAttendanceByAttendanceId(attendanceId);
  } catch (error) {
    console.error('Error getting student attendance:', error);
    throw new Error('Không thể tải điểm danh chi tiết');
  }
};

/**
 * Update attendance record summary
 */
export const updateAttendanceRecord = async (
  id: string,
  data: Partial<AttendanceRecord>
): Promise<void> => {
  try {
    await attendanceRecordSupabaseService.updateAttendanceRecord(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw new Error('Không thể cập nhật bản ghi điểm danh');
  }
};

/**
 * Delete attendance record and related student records
 */
export const deleteAttendanceRecord = async (id: string): Promise<void> => {
  try {
    // Delete related student attendance first
    await studentAttendanceSupabaseService.deleteStudentAttendanceByAttendanceId(id);
    
    // Delete main record
    await attendanceRecordSupabaseService.deleteAttendanceRecord(id);
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw new Error('Không thể xóa bản ghi điểm danh');
  }
};

/**
 * Create tutoring record for absent student (auto-create khi vắng)
 * TODO: Implement with Supabase when tutoring table is migrated
 */
export const createTutoringFromAbsent = async (data: {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  absentDate: string;
  type: 'Nghỉ học' | 'Học yếu';
}): Promise<string> => {
  try {
    // TODO: Implement with Supabase when tutoring table is migrated
    console.warn('createTutoringFromAbsent: Tutoring table chưa được migrate sang Supabase');
    // For now, just log and return a dummy ID
    console.log('Would create tutoring:', data);
    return crypto.randomUUID();
  } catch (error) {
    console.error('Error creating tutoring record:', error);
    throw new Error('Không thể tạo lịch bồi bài');
  }
};

/**
 * Count student's attended sessions for a specific class
 */
export const countStudentAttendedSessions = async (
  studentId: string,
  classId: string
): Promise<number> => {
  try {
    const allAttendance = await studentAttendanceSupabaseService.getAllStudentAttendance();
    const attended = allAttendance.filter(a => 
      a.studentId === studentId &&
      a.classId === classId &&
      (a.status === AttendanceStatus.ON_TIME || a.status === AttendanceStatus.LATE)
    );
    return attended.length;
  } catch (error) {
    console.error('Error counting attended sessions:', error);
    return 0;
  }
};

/**
 * Check and update student debt status
 * If attendedSessions > registeredSessions => status = "Nợ phí"
 */
export const checkAndUpdateStudentDebtStatus = async (
  studentId: string,
  classId: string
): Promise<void> => {
  try {
    // Get student data
    const student = await StudentService.getStudentById(studentId);
    if (!student) return;
    
    const registeredSessions = student.registeredSessions || 0;
    const currentStatus = student.status;
    
    // Skip if student is not "Đang học" or already "Nợ phí"
    if (currentStatus !== StudentStatus.ACTIVE) return;
    
    // Count attended sessions
    const attendedSessions = await countStudentAttendedSessions(studentId, classId);
    
    // Update attendedSessions field
    await StudentService.updateStudent(studentId, { attendedSessions });
    
    // Check if student has exceeded registered sessions
    if (registeredSessions > 0 && attendedSessions > registeredSessions) {
      // Update status to "Nợ phí"
      await StudentService.updateStudent(studentId, { 
        status: StudentStatus.DEBT,
      });
      console.log(`[checkDebtStatus] Student ${studentId} status changed to "Nợ phí" (attended: ${attendedSessions}, registered: ${registeredSessions})`);
    }
  } catch (error) {
    console.error('Error checking student debt status:', error);
  }
};

/**
 * Full attendance save with auto tutoring creation
 */
export const saveFullAttendance = async (
  attendanceData: Omit<AttendanceRecord, 'id'> & { sessionId?: string },
  students: Array<{
    studentId: string;
    studentName: string;
    studentCode: string;
    status: AttendanceStatus;
    note?: string;
    homeworkCompletion?: number;
    testName?: string;
    score?: number;
    bonusPoints?: number;
    punctuality?: 'onTime' | 'late' | '';
    isLate?: boolean;
  }>
): Promise<string> => {
  try {
    console.log('[saveFullAttendance] Input students:', students.length);
    console.log('[saveFullAttendance] Student statuses:', students.map(s => ({ name: s.studentName, status: s.status })));
    
    // Filter out students with PENDING status (not yet marked)
    const markedStudents = students.filter(s => s.status && s.status !== AttendanceStatus.PENDING && s.status !== '');
    console.log('[saveFullAttendance] Marked students after filter:', markedStudents.length);
    
    // Calculate summary from marked students only (ON_TIME + LATE = present)
    const present = markedStudents.filter(s => s.status === AttendanceStatus.ON_TIME || s.status === AttendanceStatus.LATE).length;
    const absent = markedStudents.filter(s => s.status === AttendanceStatus.ABSENT).length;
    const reserved = markedStudents.filter(s => s.status === AttendanceStatus.RESERVED).length;
    const tutored = markedStudents.filter(s => s.status === AttendanceStatus.TUTORED).length;
    
    // Check existing
    const existing = await checkExistingAttendance(attendanceData.classId, attendanceData.date);
    
    let attendanceId: string;
    
    if (existing) {
      // Update existing
      await updateAttendanceRecord(existing.id, {
        ...attendanceData,
        present,
        absent,
        reserved,
        tutored,
        status: 'Đã điểm danh',
      });
      attendanceId = existing.id;
    } else {
      // Create new
      attendanceId = await createAttendanceRecord({
        ...attendanceData,
        present,
        absent,
        reserved,
        tutored,
        status: 'Đã điểm danh',
      });
    }
    
    // Save student attendance with extended fields for monthly report (only marked students)
    console.log('[saveFullAttendance] Saving student attendance...');
    await saveStudentAttendance(
      attendanceId, 
      markedStudents, 
      attendanceData.classId,
      attendanceData.className,
      attendanceData.date,
      attendanceData.sessionNumber,
      attendanceData.sessionId
    );
    console.log('[saveFullAttendance] Student attendance saved!');
    
    // Auto create tutoring for absent students
    const absentStudents = markedStudents.filter(s => s.status === AttendanceStatus.ABSENT);
    console.log('[saveFullAttendance] Creating tutoring for', absentStudents.length, 'absent students...');
    for (const student of absentStudents) {
      await createTutoringFromAbsent({
        studentId: student.studentId,
        studentName: student.studentName,
        classId: attendanceData.classId,
        className: attendanceData.className,
        absentDate: attendanceData.date,
        type: 'Nghỉ học',
      });
    }
    console.log('[saveFullAttendance] Tutoring created!');
    
    // Check and update debt status for present students (ON_TIME or LATE)
    const presentStudents = markedStudents.filter(s => s.status === AttendanceStatus.ON_TIME || s.status === AttendanceStatus.LATE);
    console.log('[saveFullAttendance] Checking debt for', presentStudents.length, 'present students...');
    for (const student of presentStudents) {
      await checkAndUpdateStudentDebtStatus(student.studentId, attendanceData.classId);
    }
    
    console.log('[saveFullAttendance] All done! Returning attendanceId:', attendanceId);
    return attendanceId;
  } catch (error) {
    console.error('Error saving full attendance:', error);
    throw new Error('Không thể lưu điểm danh');
  }
};
