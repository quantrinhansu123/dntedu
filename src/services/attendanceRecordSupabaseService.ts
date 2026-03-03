/**
 * Attendance Record Supabase Service
 * Service để quản lý dữ liệu bản ghi điểm danh với Supabase
 */

import { supabase } from '../config/supabase';
import { AttendanceRecord } from '../../types';

/**
 * Chuyển đổi AttendanceRecord từ format Supabase sang AttendanceRecordModel
 */
const transformAttendanceRecordFromSupabase = (data: any): AttendanceRecord => {
  return {
    id: data.id,
    classId: data.class_id || '',
    className: data.class_name || '',
    date: data.date || '',
    sessionNumber: data.session_number || null,
    sessionId: data.session_id || null,
    totalStudents: data.total_students || 0,
    present: data.present || 0,
    absent: data.absent || 0,
    reserved: data.reserved || 0,
    tutored: data.tutored || 0,
    status: data.status as 'Đã điểm danh' | 'Chưa điểm danh',
    createdBy: data.created_by || null,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Chuyển đổi AttendanceRecord sang format Supabase
 */
const transformAttendanceRecordForSupabase = (record: AttendanceRecord) => {
  return {
    id: record.id,
    class_id: record.classId,
    class_name: record.className,
    date: record.date,
    session_number: record.sessionNumber || null,
    session_id: record.sessionId || null,
    total_students: record.totalStudents || 0,
    present: record.present || 0,
    absent: record.absent || 0,
    reserved: record.reserved || 0,
    tutored: record.tutored || 0,
    status: record.status || 'Chưa điểm danh',
    created_by: record.createdBy || null,
  };
};

/**
 * Lấy tất cả bản ghi điểm danh từ Supabase
 */
export const getAllAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformAttendanceRecordFromSupabase);
  } catch (error) {
    console.error('Error fetching attendance records from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy bản ghi điểm danh theo ID
 */
export const getAttendanceRecordById = async (id: string): Promise<AttendanceRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformAttendanceRecordFromSupabase(data);
  } catch (error) {
    console.error('Error fetching attendance record from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo bản ghi điểm danh mới trong Supabase
 */
export const createAttendanceRecord = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  try {
    const transformed = transformAttendanceRecordForSupabase(record);
    
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformAttendanceRecordFromSupabase(data);
  } catch (error) {
    console.error('Error creating attendance record in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật bản ghi điểm danh trong Supabase
 */
export const updateAttendanceRecord = async (id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.classId !== undefined) transformed.class_id = updates.classId;
    if (updates.className !== undefined) transformed.class_name = updates.className;
    if (updates.date !== undefined) transformed.date = updates.date;
    if (updates.sessionNumber !== undefined) transformed.session_number = updates.sessionNumber || null;
    if (updates.sessionId !== undefined) transformed.session_id = updates.sessionId || null;
    if (updates.totalStudents !== undefined) transformed.total_students = updates.totalStudents;
    if (updates.present !== undefined) transformed.present = updates.present;
    if (updates.absent !== undefined) transformed.absent = updates.absent;
    if (updates.reserved !== undefined) transformed.reserved = updates.reserved;
    if (updates.tutored !== undefined) transformed.tutored = updates.tutored;
    if (updates.status !== undefined) transformed.status = updates.status;
    if (updates.createdBy !== undefined) transformed.created_by = updates.createdBy || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('attendance_records')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformAttendanceRecordFromSupabase(data);
  } catch (error) {
    console.error('Error updating attendance record in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa bản ghi điểm danh trong Supabase
 */
export const deleteAttendanceRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting attendance record from Supabase:', error);
    throw error;
  }
};

/**
 * Query bản ghi điểm danh với filter
 */
export const queryAttendanceRecords = async (filters: {
  classId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> => {
  try {
    let query = supabase.from('attendance_records').select('*');
    
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters.date) {
      query = query.eq('date', filters.date);
    }
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformAttendanceRecordFromSupabase);
  } catch (error) {
    console.error('Error querying attendance records from Supabase:', error);
    throw error;
  }
};

/**
 * Kiểm tra xem đã có bản ghi điểm danh cho class + date chưa
 */
export const checkExistingAttendance = async (
  classId: string,
  date: string
): Promise<AttendanceRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date)
      .maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data ? transformAttendanceRecordFromSupabase(data) : null;
  } catch (error) {
    console.error('Error checking existing attendance in Supabase:', error);
    throw error;
  }
};
