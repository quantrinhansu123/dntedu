/**
 * Parent Supabase Service
 * Service để sync và quản lý dữ liệu phụ huynh với Supabase
 */

import { supabase } from '../config/supabase';
import { Parent } from '../../types';

/**
 * Chuyển đổi Parent từ format Supabase sang ParentModel
 */
const transformParentFromSupabase = (data: any): Parent => {
  return {
    id: data.id,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email,
    address: data.address,
    relationship: data.relationship,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Chuyển đổi Parent sang format Supabase
 */
const transformParentForSupabase = (parent: Parent) => {
  return {
    id: parent.id,
    name: parent.name,
    phone: parent.phone,
    email: parent.email || null,
    address: parent.address || null,
    relationship: parent.relationship || null,
  };
};

/**
 * Lấy tất cả phụ huynh từ Supabase
 */
export const getAllParents = async (): Promise<Parent[]> => {
  try {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformParentFromSupabase);
  } catch (error) {
    console.error('Error fetching parents from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy phụ huynh theo ID
 */
export const getParentById = async (id: string): Promise<Parent | null> => {
  try {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformParentFromSupabase(data);
  } catch (error) {
    console.error('Error fetching parent from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo phụ huynh mới trong Supabase
 */
export const createParent = async (parent: Parent): Promise<Parent> => {
  try {
    const transformed = transformParentForSupabase(parent);
    
    const { data, error } = await supabase
      .from('parents')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformParentFromSupabase(data);
  } catch (error) {
    console.error('Error creating parent in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật phụ huynh trong Supabase
 */
export const updateParent = async (id: string, updates: Partial<Parent>): Promise<Parent> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.name !== undefined) transformed.name = updates.name;
    if (updates.phone !== undefined) transformed.phone = updates.phone;
    if (updates.email !== undefined) transformed.email = updates.email || null;
    if (updates.address !== undefined) transformed.address = updates.address || null;
    if (updates.relationship !== undefined) transformed.relationship = updates.relationship || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('parents')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformParentFromSupabase(data);
  } catch (error) {
    console.error('Error updating parent in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa phụ huynh trong Supabase
 */
export const deleteParent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('parents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting parent from Supabase:', error);
    throw error;
  }
};

/**
 * Tìm phụ huynh theo số điện thoại
 */
export const findParentByPhone = async (phone: string): Promise<Parent | null> => {
  try {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformParentFromSupabase(data);
  } catch (error) {
    console.error('Error finding parent by phone:', error);
    return null;
  }
};

/**
 * Query phụ huynh với filter
 */
export const queryParents = async (filters: {
  phone?: string;
  search?: string;
}): Promise<Parent[]> => {
  try {
    let query = supabase.from('parents').select('*');
    
    if (filters.phone) {
      query = query.eq('phone', filters.phone);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    let parents = data.map(transformParentFromSupabase);
    
    // Client-side search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      parents = parents.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.phone.includes(term)
      );
    }
    
    return parents;
  } catch (error) {
    console.error('Error querying parents from Supabase:', error);
    throw error;
  }
};
