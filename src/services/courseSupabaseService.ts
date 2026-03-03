/**
 * Course Supabase Service
 * Service để quản lý dữ liệu khóa học với Supabase
 */

import { supabase } from '../config/supabase';

export interface Course {
  id: string;
  name: string;
  code: string;
  level: string;
  totalSessions: number;
  teacherRatio: number;
  assistantRatio: number;
  curriculum: string;
  resourceFolderId?: string;
  resourceFolderName?: string;
  pricePerSession: number;
  originalPrice: number;
  discount: number;
  tuitionFee: number;
  tuitionPerSession: number;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Transform Course data from Supabase format to application format
 */
const transformCourseFromSupabase = (data: any): Course => {
  return {
    id: data.id,
    name: data.name,
    code: data.code,
    level: data.level,
    totalSessions: data.total_sessions || 0,
    teacherRatio: data.teacher_ratio || 0,
    assistantRatio: data.assistant_ratio || 0,
    curriculum: data.curriculum || '',
    resourceFolderId: data.resource_folder_id || undefined,
    resourceFolderName: data.resource_folder_name || undefined,
    pricePerSession: parseFloat(data.price_per_session || 0),
    originalPrice: parseFloat(data.original_price || 0),
    discount: parseFloat(data.discount || 0),
    tuitionFee: parseFloat(data.tuition_fee || 0),
    tuitionPerSession: parseFloat(data.tuition_per_session || 0),
    startDate: data.start_date || '',
    endDate: data.end_date || '',
    description: data.description || undefined,
    status: data.status as 'active' | 'inactive' | 'draft',
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Transform Course data from application format to Supabase format
 */
const transformCourseForSupabase = (course: Partial<Course>): any => {
  const data: any = {
    name: course.name,
    code: course.code,
    level: course.level,
    total_sessions: course.totalSessions,
    teacher_ratio: course.teacherRatio,
    assistant_ratio: course.assistantRatio,
    curriculum: course.curriculum || null,
    resource_folder_id: course.resourceFolderId || null,
    resource_folder_name: course.resourceFolderName || null,
    price_per_session: course.pricePerSession || 0,
    original_price: course.originalPrice || 0,
    discount: course.discount || 0,
    tuition_fee: course.tuitionFee || 0,
    tuition_per_session: course.tuitionPerSession || 0,
    start_date: course.startDate || null,
    end_date: course.endDate || null,
    description: course.description || null,
    status: course.status || 'active',
  };

  return data;
};

/**
 * Generate UUID for course ID
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Get all courses
 */
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw new Error(`Không thể tải danh sách khóa học: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformCourseFromSupabase);
  } catch (error: any) {
    console.error('Error in getAllCourses:', error);
    throw new Error(error.message || 'Không thể tải danh sách khóa học');
  }
};

/**
 * Get course by ID
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching course:', error);
      throw new Error(`Không thể tải thông tin khóa học: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return transformCourseFromSupabase(data);
  } catch (error: any) {
    console.error('Error in getCourseById:', error);
    throw new Error(error.message || 'Không thể tải thông tin khóa học');
  }
};

/**
 * Create a new course
 */
export const createCourse = async (course: Partial<Course>): Promise<Course> => {
  try {
    // Generate UUID if id is not provided
    const courseId = course.id || generateUUID();

    const supabaseData = {
      id: courseId,
      ...transformCourseForSupabase(course),
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw new Error(`Không thể tạo khóa học: ${error.message}`);
    }

    if (!data) {
      throw new Error('Không thể tạo khóa học: Không có dữ liệu trả về');
    }

    return transformCourseFromSupabase(data);
  } catch (error: any) {
    console.error('Error in createCourse:', error);
    throw new Error(error.message || 'Không thể tạo khóa học');
  }
};

/**
 * Update a course
 */
export const updateCourse = async (id: string, course: Partial<Course>): Promise<Course> => {
  try {
    const supabaseData = transformCourseForSupabase(course);

    const { data, error } = await supabase
      .from('courses')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      throw new Error(`Không thể cập nhật khóa học: ${error.message}`);
    }

    if (!data) {
      throw new Error('Không thể cập nhật khóa học: Không có dữ liệu trả về');
    }

    return transformCourseFromSupabase(data);
  } catch (error: any) {
    console.error('Error in updateCourse:', error);
    throw new Error(error.message || 'Không thể cập nhật khóa học');
  }
};

/**
 * Delete a course
 */
export const deleteCourse = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      throw new Error(`Không thể xóa khóa học: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in deleteCourse:', error);
    throw new Error(error.message || 'Không thể xóa khóa học');
  }
};

/**
 * Query courses with filters
 */
export const queryCourses = async (filters: {
  level?: string;
  status?: string;
  search?: string;
}): Promise<Course[]> => {
  try {
    let query = supabase.from('courses').select('*');

    if (filters.level) {
      query = query.eq('level', filters.level);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,curriculum.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error querying courses:', error);
      throw new Error(`Không thể tìm kiếm khóa học: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformCourseFromSupabase);
  } catch (error: any) {
    console.error('Error in queryCourses:', error);
    throw new Error(error.message || 'Không thể tìm kiếm khóa học');
  }
};
