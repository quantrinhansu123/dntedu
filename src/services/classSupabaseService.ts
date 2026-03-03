/**
 * Class Supabase Service
 * Service để sync và quản lý dữ liệu lớp học với Supabase
 */

import { supabase } from '../config/supabase';
import { ClassModel, DayScheduleConfig, TrainingHistoryEntry } from '../../types';

/**
 * Chuyển đổi ClassModel từ Firestore sang format Supabase
 */
const transformClassForSupabase = (classData: ClassModel) => {
  return {
    id: classData.id,
    name: classData.name,
    status: classData.status,
    curriculum: classData.curriculum || null,
    course_id: classData.courseId || null,
    course_name: classData.courseName || null,
    age_group: classData.ageGroup || null,
    progress: classData.progress || null,
    total_sessions: classData.totalSessions || null,
    teacher: classData.teacher || null,
    teacher_id: classData.teacherId || null,
    teacher_duration: classData.teacherDuration || null,
    assistant: classData.assistant || null,
    assistant_duration: classData.assistantDuration || null,
    foreign_teacher: classData.foreignTeacher || null,
    foreign_teacher_duration: classData.foreignTeacherDuration || null,
    students_count: classData.studentsCount || 0,
    trial_students: classData.trialStudents || 0,
    active_students: classData.activeStudents || 0,
    debt_students: classData.debtStudents || 0,
    reserved_students: classData.reservedStudents || 0,
    schedule: classData.schedule || null,
    schedule_details: classData.scheduleDetails ? JSON.stringify(classData.scheduleDetails) : null,
    room: classData.room || null,
    branch: classData.branch || null,
    color: classData.color ?? null,
    start_date: classData.startDate || null,
    end_date: classData.endDate || null,
    training_history: classData.trainingHistory ? JSON.stringify(classData.trainingHistory) : null,
    created_at: classData.createdAt || new Date().toISOString(),
    updated_at: classData.updatedAt || new Date().toISOString(),
  };
};

/**
 * Chuyển đổi dữ liệu từ Supabase sang ClassModel
 */
const transformClassFromSupabase = (data: any): ClassModel => {
  return {
    id: data.id,
    name: data.name,
    status: data.status as any,
    curriculum: data.curriculum || '',
    courseId: data.course_id,
    courseName: data.course_name,
    ageGroup: data.age_group || '',
    progress: data.progress || '0/0',
    totalSessions: data.total_sessions,
    teacher: data.teacher || '',
    teacherId: data.teacher_id,
    teacherDuration: data.teacher_duration,
    assistant: data.assistant || '',
    assistantDuration: data.assistant_duration,
    foreignTeacher: data.foreign_teacher,
    foreignTeacherDuration: data.foreign_teacher_duration,
    studentsCount: data.students_count || 0,
    trialStudents: data.trial_students || 0,
    activeStudents: data.active_students || 0,
    debtStudents: data.debt_students || 0,
    reservedStudents: data.reserved_students || 0,
    schedule: data.schedule,
    scheduleDetails: data.schedule_details ? JSON.parse(data.schedule_details) as DayScheduleConfig[] : undefined,
    room: data.room,
    branch: data.branch,
    color: data.color,
    startDate: data.start_date,
    endDate: data.end_date,
    trainingHistory: data.training_history ? JSON.parse(data.training_history) as TrainingHistoryEntry[] : undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Lấy tất cả lớp học từ Supabase
 */
export const getAllClasses = async (): Promise<ClassModel[]> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformClassFromSupabase);
  } catch (error) {
    console.error('Error fetching classes from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy lớp học theo ID
 */
export const getClassById = async (id: string): Promise<ClassModel | null> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformClassFromSupabase(data);
  } catch (error) {
    console.error('Error fetching class from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo lớp học mới trong Supabase
 */
export const createClass = async (classData: ClassModel): Promise<ClassModel> => {
  try {
    const transformed = transformClassForSupabase(classData);
    
    const { data, error } = await supabase
      .from('classes')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformClassFromSupabase(data);
  } catch (error) {
    console.error('Error creating class in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật lớp học trong Supabase
 */
export const updateClass = async (id: string, updates: Partial<ClassModel>): Promise<ClassModel> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.name !== undefined) transformed.name = updates.name;
    if (updates.status !== undefined) transformed.status = updates.status;
    if (updates.curriculum !== undefined) transformed.curriculum = updates.curriculum;
    if (updates.courseId !== undefined) transformed.course_id = updates.courseId;
    if (updates.courseName !== undefined) transformed.course_name = updates.courseName;
    if (updates.ageGroup !== undefined) transformed.age_group = updates.ageGroup;
    if (updates.progress !== undefined) transformed.progress = updates.progress;
    if (updates.totalSessions !== undefined) transformed.total_sessions = updates.totalSessions;
    if (updates.teacher !== undefined) transformed.teacher = updates.teacher;
    if (updates.teacherId !== undefined) transformed.teacher_id = updates.teacherId;
    if (updates.teacherDuration !== undefined) transformed.teacher_duration = updates.teacherDuration;
    if (updates.assistant !== undefined) transformed.assistant = updates.assistant;
    if (updates.assistantDuration !== undefined) transformed.assistant_duration = updates.assistantDuration;
    if (updates.foreignTeacher !== undefined) transformed.foreign_teacher = updates.foreignTeacher;
    if (updates.foreignTeacherDuration !== undefined) transformed.foreign_teacher_duration = updates.foreignTeacherDuration;
    if (updates.studentsCount !== undefined) transformed.students_count = updates.studentsCount;
    if (updates.trialStudents !== undefined) transformed.trial_students = updates.trialStudents;
    if (updates.activeStudents !== undefined) transformed.active_students = updates.activeStudents;
    if (updates.debtStudents !== undefined) transformed.debt_students = updates.debtStudents;
    if (updates.reservedStudents !== undefined) transformed.reserved_students = updates.reservedStudents;
    if (updates.schedule !== undefined) transformed.schedule = updates.schedule;
    if (updates.scheduleDetails !== undefined) transformed.schedule_details = updates.scheduleDetails ? JSON.stringify(updates.scheduleDetails) : null;
    if (updates.room !== undefined) transformed.room = updates.room;
    if (updates.branch !== undefined) transformed.branch = updates.branch;
    if (updates.color !== undefined) transformed.color = updates.color;
    if (updates.startDate !== undefined) transformed.start_date = updates.startDate || null;
    if (updates.endDate !== undefined) transformed.end_date = updates.endDate || null;
    if (updates.trainingHistory !== undefined) transformed.training_history = updates.trainingHistory ? JSON.stringify(updates.trainingHistory) : null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('classes')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformClassFromSupabase(data);
  } catch (error) {
    console.error('Error updating class in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa lớp học trong Supabase
 */
export const deleteClass = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting class from Supabase:', error);
    throw error;
  }
};

/**
 * Query lớp học với filter
 */
export const queryClasses = async (filters: {
  status?: string;
  branch?: string;
  teacherId?: string;
  courseId?: string;
}): Promise<ClassModel[]> => {
  try {
    let query = supabase.from('classes').select('*');
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.branch) {
      query = query.eq('branch', filters.branch);
    }
    if (filters.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformClassFromSupabase);
  } catch (error) {
    console.error('Error querying classes from Supabase:', error);
    throw error;
  }
};

/**
 * Sử dụng view để query (nếu đã tạo view)
 */
export const getClassesFromView = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('classes_view')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching classes from view:', error);
    throw error;
  }
};
