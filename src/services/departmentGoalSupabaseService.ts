/**
 * Department Goal Supabase Service
 * Service để quản lý dữ liệu mục tiêu phòng ban với Supabase
 */

import { supabase } from '../config/supabase';
import { DepartmentGoal } from '../../types';

/**
 * Chuyển đổi DepartmentGoal từ format Supabase sang DepartmentGoalModel
 */
const transformDepartmentGoalFromSupabase = (data: any): DepartmentGoal => {
  return {
    id: data.id,
    departmentCode: data.department_code as any,
    departmentName: data.department_name || '',
    month: data.month || 1,
    year: data.year || new Date().getFullYear(),
    title: data.title || '',
    description: data.description || undefined,
    kpiTarget: parseFloat(data.kpi_target) || 0,
    kpiWeight: parseFloat(data.kpi_weight) || 0,
    kpiActual: parseFloat(data.kpi_actual) || 0,
    kpiResult: parseFloat(data.kpi_result) || 0,
    unit: data.unit || undefined,
    status: data.status as 'active' | 'completed' | 'cancelled',
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
    createdBy: data.created_by || undefined,
  };
};

/**
 * Chuyển đổi DepartmentGoal sang format Supabase
 */
const transformDepartmentGoalForSupabase = (goal: DepartmentGoal) => {
  return {
    id: goal.id,
    department_code: goal.departmentCode,
    department_name: goal.departmentName,
    month: goal.month,
    year: goal.year,
    title: goal.title,
    description: goal.description || null,
    kpi_target: goal.kpiTarget,
    kpi_weight: goal.kpiWeight,
    kpi_actual: goal.kpiActual || 0,
    kpi_result: goal.kpiResult || 0,
    unit: goal.unit || null,
    status: goal.status || 'active',
    created_by: goal.createdBy || null,
  };
};

/**
 * Lấy tất cả mục tiêu từ Supabase
 */
export const getAllDepartmentGoals = async (): Promise<DepartmentGoal[]> => {
  try {
    const { data, error } = await supabase
      .from('department_goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformDepartmentGoalFromSupabase);
  } catch (error) {
    console.error('Error fetching department goals from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy mục tiêu theo ID
 */
export const getDepartmentGoalById = async (id: string): Promise<DepartmentGoal | null> => {
  try {
    const { data, error } = await supabase
      .from('department_goals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformDepartmentGoalFromSupabase(data);
  } catch (error) {
    console.error('Error fetching department goal from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo mục tiêu mới trong Supabase
 */
export const createDepartmentGoal = async (goal: DepartmentGoal): Promise<DepartmentGoal> => {
  try {
    const transformed = transformDepartmentGoalForSupabase(goal);
    
    const { data, error } = await supabase
      .from('department_goals')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformDepartmentGoalFromSupabase(data);
  } catch (error) {
    console.error('Error creating department goal in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật mục tiêu trong Supabase
 */
export const updateDepartmentGoal = async (id: string, updates: Partial<DepartmentGoal>): Promise<DepartmentGoal> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.departmentCode !== undefined) transformed.department_code = updates.departmentCode;
    if (updates.departmentName !== undefined) transformed.department_name = updates.departmentName;
    if (updates.month !== undefined) transformed.month = updates.month;
    if (updates.year !== undefined) transformed.year = updates.year;
    if (updates.title !== undefined) transformed.title = updates.title;
    if (updates.description !== undefined) transformed.description = updates.description || null;
    if (updates.kpiTarget !== undefined) transformed.kpi_target = updates.kpiTarget;
    if (updates.kpiWeight !== undefined) transformed.kpi_weight = updates.kpiWeight;
    if (updates.kpiActual !== undefined) transformed.kpi_actual = updates.kpiActual;
    if (updates.kpiResult !== undefined) transformed.kpi_result = updates.kpiResult;
    if (updates.unit !== undefined) transformed.unit = updates.unit || null;
    if (updates.status !== undefined) transformed.status = updates.status;
    if (updates.createdBy !== undefined) transformed.created_by = updates.createdBy || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('department_goals')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformDepartmentGoalFromSupabase(data);
  } catch (error) {
    console.error('Error updating department goal in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa mục tiêu trong Supabase
 */
export const deleteDepartmentGoal = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('department_goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting department goal from Supabase:', error);
    throw error;
  }
};

/**
 * Query mục tiêu với filter
 */
export const queryDepartmentGoals = async (filters: {
  departmentCode?: string;
  month?: number;
  year?: number;
  status?: string;
}): Promise<DepartmentGoal[]> => {
  try {
    let query = supabase.from('department_goals').select('*');
    
    if (filters.departmentCode) {
      query = query.eq('department_code', filters.departmentCode);
    }
    if (filters.month) {
      query = query.eq('month', filters.month);
    }
    if (filters.year) {
      query = query.eq('year', filters.year);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformDepartmentGoalFromSupabase);
  } catch (error) {
    console.error('Error querying department goals from Supabase:', error);
    throw error;
  }
};
