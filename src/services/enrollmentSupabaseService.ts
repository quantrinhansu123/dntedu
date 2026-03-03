/**
 * Enrollment Supabase Service
 * Service để sync và quản lý dữ liệu ghi danh với Supabase
 */

import { supabase } from '../config/supabase';
import { EnrollmentRecord } from '../../types';

/**
 * Chuyển đổi EnrollmentRecord từ format Supabase sang EnrollmentRecordModel
 */
const transformEnrollmentFromSupabase = (data: any): EnrollmentRecord => {
  return {
    id: data.id,
    studentId: data.student_id,
    studentName: data.student_name || '',
    classId: data.class_id,
    className: data.class_name,
    sessions: data.sessions || 0,
    type: data.type as any,
    contractCode: data.contract_code,
    contractId: data.contract_id,
    originalAmount: data.original_amount ? parseFloat(data.original_amount) : undefined,
    finalAmount: data.final_amount ? parseFloat(data.final_amount) : undefined,
    createdDate: data.created_date,
    createdAt: data.created_at,
    createdBy: data.created_by || '',
    staff: data.staff || data.created_by,
    note: data.note || data.notes,
    notes: data.notes || data.note,
    reason: data.reason,
  };
};

/**
 * Chuyển đổi EnrollmentRecord sang format Supabase
 */
const transformEnrollmentForSupabase = (enrollment: EnrollmentRecord) => {
  return {
    id: enrollment.id,
    student_id: enrollment.studentId || null,
    student_name: enrollment.studentName || '',
    class_id: enrollment.classId || null,
    class_name: enrollment.className || null,
    sessions: enrollment.sessions || 0,
    type: enrollment.type,
    contract_code: enrollment.contractCode || null,
    contract_id: enrollment.contractId || null,
    original_amount: enrollment.originalAmount || null,
    final_amount: enrollment.finalAmount || null,
    created_date: enrollment.createdDate || null,
    created_by: enrollment.createdBy || '',
    staff: enrollment.staff || enrollment.createdBy || null,
    note: enrollment.note || enrollment.notes || null,
    notes: enrollment.notes || enrollment.note || null,
    reason: enrollment.reason || null,
  };
};

/**
 * Lấy tất cả ghi danh từ Supabase
 */
export const getAllEnrollments = async (): Promise<EnrollmentRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformEnrollmentFromSupabase);
  } catch (error) {
    console.error('Error fetching enrollments from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy ghi danh theo ID
 */
export const getEnrollmentById = async (id: string): Promise<EnrollmentRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformEnrollmentFromSupabase(data);
  } catch (error) {
    console.error('Error fetching enrollment from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo ghi danh mới trong Supabase
 */
export const createEnrollment = async (enrollment: EnrollmentRecord): Promise<EnrollmentRecord> => {
  try {
    const transformed = transformEnrollmentForSupabase(enrollment);
    
    const { data, error } = await supabase
      .from('enrollments')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformEnrollmentFromSupabase(data);
  } catch (error) {
    console.error('Error creating enrollment in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật ghi danh trong Supabase
 */
export const updateEnrollment = async (id: string, updates: Partial<EnrollmentRecord>): Promise<EnrollmentRecord> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.studentId !== undefined) transformed.student_id = updates.studentId || null;
    if (updates.studentName !== undefined) transformed.student_name = updates.studentName;
    if (updates.classId !== undefined) transformed.class_id = updates.classId || null;
    if (updates.className !== undefined) transformed.class_name = updates.className || null;
    if (updates.sessions !== undefined) transformed.sessions = updates.sessions;
    if (updates.type !== undefined) transformed.type = updates.type;
    if (updates.contractCode !== undefined) transformed.contract_code = updates.contractCode || null;
    if (updates.contractId !== undefined) transformed.contract_id = updates.contractId || null;
    if (updates.originalAmount !== undefined) transformed.original_amount = updates.originalAmount || null;
    if (updates.finalAmount !== undefined) transformed.final_amount = updates.finalAmount || null;
    if (updates.createdDate !== undefined) transformed.created_date = updates.createdDate || null;
    if (updates.createdBy !== undefined) transformed.created_by = updates.createdBy;
    if (updates.staff !== undefined) transformed.staff = updates.staff || null;
    if (updates.note !== undefined) transformed.note = updates.note || null;
    if (updates.notes !== undefined) transformed.notes = updates.notes || null;
    if (updates.reason !== undefined) transformed.reason = updates.reason || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('enrollments')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformEnrollmentFromSupabase(data);
  } catch (error) {
    console.error('Error updating enrollment in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa ghi danh trong Supabase
 */
export const deleteEnrollment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting enrollment from Supabase:', error);
    throw error;
  }
};

/**
 * Query ghi danh với filter
 */
export const queryEnrollments = async (filters: {
  type?: string;
  studentId?: string;
  contractCode?: string;
}): Promise<EnrollmentRecord[]> => {
  try {
    let query = supabase.from('enrollments').select('*');
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters.contractCode) {
      query = query.eq('contract_code', filters.contractCode);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformEnrollmentFromSupabase);
  } catch (error) {
    console.error('Error querying enrollments from Supabase:', error);
    throw error;
  }
};
