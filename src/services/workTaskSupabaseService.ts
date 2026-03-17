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
  // Parse staff_ids from JSONB - handle both array and string formats
  let staffIds: string[] = [];
  if (data.staff_ids) {
    if (Array.isArray(data.staff_ids)) {
      staffIds = data.staff_ids.map((id: any) => String(id)); // Convert to string for consistency
    } else if (typeof data.staff_ids === 'string') {
      try {
        const parsed = JSON.parse(data.staff_ids);
        staffIds = Array.isArray(parsed) ? parsed.map((id: any) => String(id)) : [];
      } catch {
        staffIds = [];
      }
    }
  }
  
  // Parse staff_names similarly
  let staffNames: string[] = [];
  if (data.staff_names) {
    if (Array.isArray(data.staff_names)) {
      staffNames = data.staff_names;
    } else if (typeof data.staff_names === 'string') {
      try {
        const parsed = JSON.parse(data.staff_names);
        staffNames = Array.isArray(parsed) ? parsed : [];
      } catch {
        staffNames = [];
      }
    }
  }
  
  return {
    id: data.id,
    category: data.category || '',
    taskName: data.task_name || '',
    staffIds: staffIds,
    staffNames: staffNames,
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
 * Sử dụng Supabase JSONB query để filter trực tiếp trong database
 */
export const getWorkTasksByStaffId = async (staffId: string): Promise<WorkTask[]> => {
  try {
    console.log('getWorkTasksByStaffId - Looking for staffId:', staffId);
    console.log('getWorkTasksByStaffId - staffId type:', typeof staffId);
    
    // Method 1: Try using Supabase JSONB contains operator (more efficient)
    // Query: staff_ids @> '["staffId"]'::jsonb
    // This checks if the JSONB array contains the staffId
    const { data: queryData, error: queryError } = await supabase
      .from('work_tasks')
      .select('*')
      .eq('is_active', true)
      .contains('staff_ids', [staffId])  // JSONB contains operator
      .order('category', { ascending: true })
      .order('task_name', { ascending: true });
    
    // If contains() works, use it
    if (!queryError && queryData) {
      console.log('getWorkTasksByStaffId - Using Supabase contains() query');
      console.log('getWorkTasksByStaffId - Found', queryData.length, 'tasks');
      const transformed = queryData.map(transformFromSupabase);
      transformed.forEach(task => {
        console.log(`✅ Task "${task.taskName}" (ID: ${task.id}) - staffIds:`, task.staffIds);
      });
      return transformed;
    }
    
    // Method 2: Fallback to client-side filtering if contains() doesn't work
    console.log('getWorkTasksByStaffId - Fallback to client-side filtering');
    console.log('Query error (if any):', queryError);
    
    const { data, error } = await supabase
      .from('work_tasks')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('task_name', { ascending: true });
    
    if (error) throw error;
    
    console.log('getWorkTasksByStaffId - All active tasks:', data.length);
    
    // Filter client-side to check if staffId is in staff_ids array
    const transformedTasks = data.map(transformFromSupabase);
    
    const filtered = transformedTasks.filter(task => {
      const staffIdsArray = task.staffIds || [];
      
      // Convert both to string for comparison (handle type mismatches)
      const searchId = String(staffId);
      const isMatch = staffIdsArray.some(id => String(id) === searchId);
      
      if (!isMatch) {
        console.log(`❌ Task "${task.taskName}" (ID: ${task.id}) - staffIds:`, staffIdsArray, 'does not include', searchId);
        console.log('  - staffIds types:', staffIdsArray.map(id => typeof id));
        console.log('  - staffIds values:', staffIdsArray);
      } else {
        console.log(`✅ Task "${task.taskName}" (ID: ${task.id}) - MATCHED for staffId:`, searchId);
        console.log('  - Matching staffIds:', staffIdsArray);
      }
      
      return isMatch;
    });
    
    console.log('getWorkTasksByStaffId - Filtered tasks:', filtered.length, 'out of', data.length);
    
    return filtered;
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
 * Lấy tất cả categories (từ work_tasks - backward compat)
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

/**
 * Lấy danh sách hạng mục từ bảng work_task_categories, gộp thêm từ work_tasks (backward compat).
 * Nếu bảng work_task_categories chưa tồn tại thì chỉ lấy từ work_tasks.
 */
export const getWorkTaskCategoryNames = async (): Promise<string[]> => {
  const fromTable = new Set<string>();
  const { data, error } = await supabase
    .from('work_task_categories')
    .select('name')
    .order('name', { ascending: true });
  if (!error && data) {
    data.forEach((r: { name: string }) => fromTable.add(r.name));
  }
  const fromTasks = await getAllCategories();
  fromTasks.forEach(c => fromTable.add(c));
  return Array.from(fromTable).sort();
};

/**
 * Tạo hạng mục mới và lưu vào bảng work_task_categories.
 * Nếu bảng chưa tồn tại sẽ throw với message hướng dẫn chạy migration.
 */
export const createWorkTaskCategory = async (name: string): Promise<void> => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Tên hạng mục không được để trống');
  const { error } = await supabase
    .from('work_task_categories')
    .insert({ name: trimmed });
  if (error) {
    if (error.message?.includes('work_task_categories') || error.message?.includes('schema cache')) {
      throw new Error('Bảng work_task_categories chưa có. Vui lòng chạy file SQL trong supabase/sql/work_task_categories.sql tại Supabase Dashboard → SQL Editor.');
    }
    throw error;
  }
};
