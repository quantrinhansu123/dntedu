/**
 * Center Service
 * Service để quản lý các cơ sở với Supabase
 */

import { supabase } from '../config/supabase';

export interface Center {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  status: 'Hoạt động' | 'Tạm dừng';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Chuyển đổi Center từ format Supabase
 */
const transformFromSupabase = (data: any): Center => {
  return {
    id: data.id,
    name: data.name || '',
    code: data.code || undefined,
    address: data.address || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    manager: data.manager || undefined,
    status: data.status || 'Hoạt động',
    notes: data.notes || undefined,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Chuyển đổi Center sang format Supabase
 */
const transformToSupabase = (center: Partial<Center>) => {
  const result: any = {};
  if (center.name !== undefined) result.name = center.name;
  if (center.code !== undefined) result.code = center.code || null;
  if (center.address !== undefined) result.address = center.address || null;
  if (center.phone !== undefined) result.phone = center.phone || null;
  if (center.email !== undefined) result.email = center.email || null;
  if (center.manager !== undefined) result.manager = center.manager || null;
  if (center.status !== undefined) result.status = center.status;
  if (center.notes !== undefined) result.notes = center.notes || null;
  return result;
};

/**
 * Lấy tất cả cơ sở
 */
export const getAllCenters = async (): Promise<Center[]> => {
  try {
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching centers from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy cơ sở theo ID
 */
export const getCenter = async (id: string): Promise<Center | null> => {
  try {
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error fetching center from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo cơ sở mới
 */
export const createCenter = async (data: Omit<Center, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const transformed = transformToSupabase(data);
    
    const { data: result, error } = await supabase
      .from('centers')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    if (!result) throw new Error('Failed to create center');
    
    return result.id;
  } catch (error) {
    console.error('Error creating center in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật cơ sở
 */
export const updateCenter = async (id: string, data: Partial<Center>): Promise<void> => {
  try {
    const transformed = transformToSupabase(data);
    
    const { error } = await supabase
      .from('centers')
      .update(transformed)
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating center in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa cơ sở
 */
export const deleteCenter = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('centers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting center from Supabase:', error);
    throw error;
  }
};
