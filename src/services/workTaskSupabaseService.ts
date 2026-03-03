/**
 * Work Task Supabase Service
 * Service để quản lý setup công việc với Supabase
 */

import { supabase } from '../config/supabase';

export interface WorkTask {
  id: string;
  category: string; // Hạng mục công việc
  taskName: string; // Tên công việc
  staffIds: string[]; // Array of staff IDs
  staffNames: string[]; // Array of staff names (denormalized)
  description?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Chuyển đổi WorkTask từ format Supabase
 */
const transformFromSupabase = (data: any): WorkTask => {
  return {
    id: data.id,
    category: data.category || '',
    taskName: data.task_name || '',
    staffIds: data.staff_ids || [],
    staffNames: data.staff_names || [],
    description: data.description || null,
    isActive: data.is_active !== false,
    createdBy: data.created_by || null,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Chuyển đổi WorkTask sang format Supabase
 */
const transformToSupabase = (task: Partial<WorkTask>) => {
  const result: any = {};
  if (task.category !== undefined) result.category = task.category;
  if (task.taskName !== undefined) result.task_name = task.taskName;
  if (task.staffIds !== undefined) result.staff_ids = task.staffIds;
  if (task.staffNames !== undefined) result.staff_names = task.staffNames;
  if (task.description !== undefined) result.description = task.description || null;
  if (task.isActive !== undefined) result.is_active = task.isActive;
  if (task.createdBy !== undefined) result.created_by = task.createdBy || null;
  return result;
};

/**
 * Lấy tất cả công việc
 */
export const getAllWorkTasks = async (): Promise<WorkTask[]> => {
  try {
    const { data, error } = await supabase
      .from('work_tasks')
      .select('*')
      .order('category', { ascending: true })
      .order('task_name', { ascending: true });
    
    if (error) throw error;
    
    return data.map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching work tasks from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy công việc theo ID
 */
export const getWorkTaskById = async (id: string): Promise<WorkTask | null> => {
  try {
    const { data, error } = await supabase
      .from('work_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error fetching work task from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy công việc theo staff ID
 */
export const getWorkTasksByStaffId = async (staffId: string): Promise<WorkTask[]> => {
  try {
    // Query using JSONB contains operator
    // staff_ids @> '["staffId"]'::jsonb
    const { data, error } = await supabase
      .from('work_tasks')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('task_name', { ascending: true });
    
    if (error) throw error;
    
    // Filter client-side to check if staffId is in staff_ids array
    const filtered = data.filter(task => {
      const staffIds = task.staff_ids || [];
      return Array.isArray(staffIds) && staffIds.includes(staffId);
    });
    
    return filtered.map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching work tasks by staff ID from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy công việc theo category
 */
export const getWorkTasksByCategory = async (category: string): Promise<WorkTask[]> => {
  try {
    const { data, error } = await supabase
      .from('work_tasks')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('task_name', { ascending: true });
    
    if (error) throw error;
    
    return data.map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching work tasks by category from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo công việc mới
 */
export const createWorkTask = async (task: Omit<WorkTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkTask> => {
  try {
    const id = crypto.randomUUID();
    const transformed = transformToSupabase({
      ...task,
      id,
      createdAt: new Date().toISOString(),
    });
    
    const { data, error } = await supabase
      .from('work_tasks')
      .insert({
        id,
        ...transformed,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error creating work task in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật công việc
 */
export const updateWorkTask = async (
  id: string,
  updates: Partial<WorkTask>
): Promise<WorkTask> => {
  try {
    const transformed = transformToSupabase(updates);
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('work_tasks')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error updating work task in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa công việc
 */
export const deleteWorkTask = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('work_tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting work task from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy tất cả categories
 */
export const getAllCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('work_tasks')
      .select('category')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const categories = [...new Set(data.map(d => d.category).filter(Boolean))];
    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories from Supabase:', error);
    throw error;
  }
};
