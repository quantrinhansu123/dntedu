/**
 * Department Bonus Config Service
 * Service để quản lý cấu hình thưởng KPI theo phòng ban với Supabase
 */

import { supabase } from '../config/supabase';
import { DepartmentBonusConfig, KpiBonusLevel } from '../../types';

/**
 * Chuyển đổi DepartmentBonusConfig từ format Supabase
 */
const transformFromSupabase = (data: any): DepartmentBonusConfig => {
  // Parse levels from JSONB
  let levels: KpiBonusLevel[] = [];
  if (data.levels) {
    if (Array.isArray(data.levels)) {
      levels = data.levels;
    } else if (typeof data.levels === 'string') {
      try {
        const parsed = JSON.parse(data.levels);
        levels = Array.isArray(parsed) ? parsed : [];
      } catch {
        levels = [];
      }
    }
  }
  
  return {
    id: data.id,
    departmentCode: data.department_code || '',
    departmentName: data.department_name || '',
    levels: levels,
    effectiveDate: data.effective_date || new Date().toISOString().split('T')[0],
    status: data.status || 'active',
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
    createdBy: data.created_by || undefined,
  };
};

/**
 * Chuyển đổi DepartmentBonusConfig sang format Supabase
 */
const transformToSupabase = (config: Partial<DepartmentBonusConfig>) => {
  const result: any = {};
  if (config.departmentCode !== undefined) result.department_code = config.departmentCode;
  if (config.departmentName !== undefined) result.department_name = config.departmentName;
  if (config.levels !== undefined) result.levels = config.levels;
  if (config.effectiveDate !== undefined) result.effective_date = config.effectiveDate;
  if (config.status !== undefined) result.status = config.status;
  if (config.createdBy !== undefined) result.created_by = config.createdBy || null;
  return result;
};

/**
 * Lấy tất cả cấu hình thưởng
 */
export const getAllBonusConfigs = async (): Promise<DepartmentBonusConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('department_bonus_configs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching bonus configs from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy cấu hình thưởng theo ID
 */
export const getBonusConfig = async (id: string): Promise<DepartmentBonusConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('department_bonus_configs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error fetching bonus config from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy cấu hình thưởng theo phòng ban
 */
export const getBonusConfigsByDepartment = async (departmentCode: string): Promise<DepartmentBonusConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('department_bonus_configs')
      .select('*')
      .eq('department_code', departmentCode)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching bonus configs by department from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo cấu hình thưởng mới
 */
export const createBonusConfig = async (data: Omit<DepartmentBonusConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    const transformed = transformToSupabase({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    
    const { data: result, error } = await supabase
      .from('department_bonus_configs')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    if (!result) throw new Error('Failed to create bonus config');
    
    return result.id;
  } catch (error) {
    console.error('Error creating bonus config in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật cấu hình thưởng
 */
export const updateBonusConfig = async (id: string, data: Partial<DepartmentBonusConfig>): Promise<void> => {
  try {
    const transformed = transformToSupabase({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    
    const { error } = await supabase
      .from('department_bonus_configs')
      .update(transformed)
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating bonus config in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa cấu hình thưởng
 */
export const deleteBonusConfig = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('department_bonus_configs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting bonus config from Supabase:', error);
    throw error;
  }
};
