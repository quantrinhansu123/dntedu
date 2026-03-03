/**
 * Student Supabase Service
 * Service để sync và quản lý dữ liệu học viên với Supabase
 */

import { supabase } from '../config/supabase';
import { Student, CareLog } from '../../types';

/**
 * Chuyển đổi Student từ format Supabase sang StudentModel
 */
const transformStudentFromSupabase = (data: any): Student => {
  return {
    id: data.id,
    code: data.code || '',
    fullName: data.full_name || '',
    dob: data.dob || '',
    gender: data.gender || 'Nam',
    phone: data.phone || '',
    password: data.password,
    parentId: data.parent_id,
    parentName: data.parent_name,
    parentPhone: data.parent_phone,
    status: data.status as any,
    careHistory: data.care_history ? (Array.isArray(data.care_history) ? data.care_history : JSON.parse(data.care_history)) : [],
    branch: data.branch,
    class: data.class,
    classId: data.class_id,
    classIds: data.class_ids ? (Array.isArray(data.class_ids) ? data.class_ids : JSON.parse(data.class_ids)) : [],
    registeredSessions: data.registered_sessions || 0,
    attendedSessions: data.attended_sessions || 0,
    remainingSessions: data.remaining_sessions || 0,
    startSessionNumber: data.start_session_number,
    enrollmentDate: data.enrollment_date,
    startDate: data.start_date,
    expectedEndDate: data.expected_end_date,
    reserveDate: data.reserve_date,
    reserveNote: data.reserve_note,
    reserveSessions: data.reserve_sessions,
    badDebt: data.bad_debt || false,
    badDebtSessions: data.bad_debt_sessions,
    badDebtAmount: data.bad_debt_amount ? parseFloat(data.bad_debt_amount) : undefined,
    badDebtDate: data.bad_debt_date,
    badDebtNote: data.bad_debt_note,
    contractDebt: data.contract_debt ? parseFloat(data.contract_debt) : undefined,
    nextPaymentDate: data.next_payment_date,
  };
};

/**
 * Chuyển đổi Student sang format Supabase
 */
const transformStudentForSupabase = (student: Student) => {
  return {
    id: student.id,
    code: student.code || '', // Ensure code is not null
    full_name: student.fullName,
    dob: student.dob || null,
    gender: student.gender || 'Nam',
    phone: student.phone || '',
    password: student.password || null,
    parent_id: student.parentId || null,
    parent_name: student.parentName || null,
    parent_phone: student.parentPhone || null,
    status: student.status,
    care_history: student.careHistory ? JSON.stringify(student.careHistory) : '[]',
    branch: student.branch || null,
    class: student.class || null,
    class_id: student.classId || null,
    class_ids: student.classIds ? JSON.stringify(student.classIds) : '[]',
    registered_sessions: student.registeredSessions || 0,
    attended_sessions: student.attendedSessions || 0,
    remaining_sessions: student.remainingSessions || 0,
    start_session_number: student.startSessionNumber || null,
    enrollment_date: student.enrollmentDate || null,
    start_date: student.startDate || null,
    expected_end_date: student.expectedEndDate || null,
    reserve_date: student.reserveDate || null,
    reserve_note: student.reserveNote || null,
    reserve_sessions: student.reserveSessions || null,
    bad_debt: student.badDebt || false,
    bad_debt_sessions: student.badDebtSessions || null,
    bad_debt_amount: student.badDebtAmount || null,
    bad_debt_date: student.badDebtDate || null,
    bad_debt_note: student.badDebtNote || null,
    contract_debt: student.contractDebt || 0,
    next_payment_date: student.nextPaymentDate || null,
  };
};

/**
 * Lấy tất cả học viên từ Supabase
 */
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStudentFromSupabase);
  } catch (error) {
    console.error('Error fetching students from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy học viên theo ID
 */
export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformStudentFromSupabase(data);
  } catch (error) {
    console.error('Error fetching student from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo học viên mới trong Supabase
 */
export const createStudent = async (student: Student): Promise<Student> => {
  try {
    const transformed = transformStudentForSupabase(student);
    
    const { data, error } = await supabase
      .from('students')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformStudentFromSupabase(data);
  } catch (error) {
    console.error('Error creating student in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật học viên trong Supabase
 */
export const updateStudent = async (id: string, updates: Partial<Student>): Promise<Student> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.code !== undefined) transformed.code = updates.code;
    if (updates.fullName !== undefined) transformed.full_name = updates.fullName;
    if (updates.dob !== undefined) transformed.dob = updates.dob || null;
    if (updates.gender !== undefined) transformed.gender = updates.gender;
    if (updates.phone !== undefined) transformed.phone = updates.phone;
    if (updates.password !== undefined) transformed.password = updates.password;
    if (updates.parentId !== undefined) transformed.parent_id = updates.parentId || null;
    if (updates.parentName !== undefined) transformed.parent_name = updates.parentName || null;
    if (updates.parentPhone !== undefined) transformed.parent_phone = updates.parentPhone || null;
    if (updates.status !== undefined) transformed.status = updates.status;
    if (updates.careHistory !== undefined) transformed.care_history = JSON.stringify(updates.careHistory);
    if (updates.branch !== undefined) transformed.branch = updates.branch || null;
    if (updates.class !== undefined) transformed.class = updates.class || null;
    if (updates.classId !== undefined) transformed.class_id = updates.classId || null;
    if (updates.classIds !== undefined) transformed.class_ids = JSON.stringify(updates.classIds || []);
    if (updates.registeredSessions !== undefined) transformed.registered_sessions = updates.registeredSessions;
    if (updates.attendedSessions !== undefined) transformed.attended_sessions = updates.attendedSessions;
    if (updates.remainingSessions !== undefined) transformed.remaining_sessions = updates.remainingSessions;
    if (updates.startSessionNumber !== undefined) transformed.start_session_number = updates.startSessionNumber || null;
    if (updates.enrollmentDate !== undefined) transformed.enrollment_date = updates.enrollmentDate || null;
    if (updates.startDate !== undefined) transformed.start_date = updates.startDate || null;
    if (updates.expectedEndDate !== undefined) transformed.expected_end_date = updates.expectedEndDate || null;
    if (updates.reserveDate !== undefined) transformed.reserve_date = updates.reserveDate || null;
    if (updates.reserveNote !== undefined) transformed.reserve_note = updates.reserveNote || null;
    if (updates.reserveSessions !== undefined) transformed.reserve_sessions = updates.reserveSessions || null;
    if (updates.badDebt !== undefined) transformed.bad_debt = updates.badDebt;
    if (updates.badDebtSessions !== undefined) transformed.bad_debt_sessions = updates.badDebtSessions || null;
    if (updates.badDebtAmount !== undefined) transformed.bad_debt_amount = updates.badDebtAmount || null;
    if (updates.badDebtDate !== undefined) transformed.bad_debt_date = updates.badDebtDate || null;
    if (updates.badDebtNote !== undefined) transformed.bad_debt_note = updates.badDebtNote || null;
    if (updates.contractDebt !== undefined) transformed.contract_debt = updates.contractDebt || 0;
    if (updates.nextPaymentDate !== undefined) transformed.next_payment_date = updates.nextPaymentDate || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('students')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformStudentFromSupabase(data);
  } catch (error) {
    console.error('Error updating student in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa học viên trong Supabase
 */
export const deleteStudent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting student from Supabase:', error);
    throw error;
  }
};

/**
 * Query học viên với filter
 */
export const queryStudents = async (filters: {
  status?: string;
  classId?: string;
  parentId?: string;
  branch?: string;
}): Promise<Student[]> => {
  try {
    let query = supabase.from('students').select('*');
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters.parentId) {
      query = query.eq('parent_id', filters.parentId);
    }
    if (filters.branch) {
      query = query.eq('branch', filters.branch);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStudentFromSupabase);
  } catch (error) {
    console.error('Error querying students from Supabase:', error);
    throw error;
  }
};
