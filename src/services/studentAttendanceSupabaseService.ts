/**
 * Student Attendance Supabase Service
 * Service để quản lý dữ liệu điểm danh học sinh với Supabase
 */

import { supabase } from '../config/supabase';
import { StudentAttendance, AttendanceStatus } from '../../types';

/**
 * Chuyển đổi StudentAttendance từ format Supabase sang StudentAttendanceModel
 */
const transformStudentAttendanceFromSupabase = (data: any): StudentAttendance => {
  return {
    id: data.id,
    attendanceId: data.attendance_id || '',
    sessionId: data.session_id || undefined,
    studentId: data.student_id || '',
    studentName: data.student_name || '',
    studentCode: data.student_code || '',
    classId: data.class_id || undefined,
    className: data.class_name || undefined,
    date: data.date || undefined,
    sessionNumber: data.session_number || undefined,
    status: data.status as AttendanceStatus,
    note: data.note || undefined,
    homeworkCompletion: data.homework_completion || undefined,
    testName: data.test_name || undefined,
    score: data.score ? parseFloat(data.score) : undefined,
    bonusPoints: data.bonus_points ? parseFloat(data.bonus_points) : undefined,
    punctuality: data.punctuality as 'onTime' | 'late' | '' || undefined,
    isLate: data.is_late || false,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Chuyển đổi StudentAttendance sang format Supabase
 */
const transformStudentAttendanceForSupabase = (attendance: StudentAttendance) => {
  return {
    id: attendance.id,
    attendance_id: attendance.attendanceId,
    session_id: attendance.sessionId || null,
    student_id: attendance.studentId,
    student_name: attendance.studentName,
    student_code: attendance.studentCode,
    class_id: attendance.classId || null,
    class_name: attendance.className || null,
    date: attendance.date || null,
    session_number: attendance.sessionNumber || null,
    status: attendance.status,
    note: attendance.note || null,
    homework_completion: attendance.homeworkCompletion || null,
    test_name: attendance.testName || null,
    score: attendance.score || null,
    bonus_points: attendance.bonusPoints || null,
    punctuality: attendance.punctuality || null,
    is_late: attendance.isLate || false,
  };
};

/**
 * Lấy tất cả điểm danh học sinh từ Supabase
 */
export const getAllStudentAttendance = async (): Promise<StudentAttendance[]> => {
  try {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStudentAttendanceFromSupabase);
  } catch (error) {
    console.error('Error fetching student attendance from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy điểm danh học sinh theo attendanceId
 */
export const getStudentAttendanceByAttendanceId = async (attendanceId: string): Promise<StudentAttendance[]> => {
  try {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('attendance_id', attendanceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStudentAttendanceFromSupabase);
  } catch (error) {
    console.error('Error fetching student attendance from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy điểm danh học sinh theo sessionId
 */
export const getStudentAttendanceBySessionId = async (sessionId: string): Promise<StudentAttendance[]> => {
  try {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStudentAttendanceFromSupabase);
  } catch (error) {
    console.error('Error fetching student attendance by session from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo điểm danh học sinh mới trong Supabase
 */
export const createStudentAttendance = async (attendance: StudentAttendance): Promise<StudentAttendance> => {
  try {
    const transformed = transformStudentAttendanceForSupabase(attendance);
    
    const { data, error } = await supabase
      .from('student_attendance')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformStudentAttendanceFromSupabase(data);
  } catch (error) {
    console.error('Error creating student attendance in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa tất cả điểm danh học sinh theo attendanceId
 */
export const deleteStudentAttendanceByAttendanceId = async (attendanceId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('student_attendance')
      .delete()
      .eq('attendance_id', attendanceId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting student attendance from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo nhiều điểm danh học sinh cùng lúc
 */
export const createMultipleStudentAttendance = async (
  attendances: Omit<StudentAttendance, 'id'>[]
): Promise<void> => {
  try {
    if (attendances.length === 0) return;
    
    const transformed = attendances.map(attendance => {
      const id = crypto.randomUUID();
      return transformStudentAttendanceForSupabase({
        ...attendance,
        id,
        createdAt: attendance.createdAt || new Date().toISOString(),
      });
    });
    
    const { error } = await supabase
      .from('student_attendance')
      .insert(transformed);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error creating multiple student attendance in Supabase:', error);
    throw error;
  }
};
