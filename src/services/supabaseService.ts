/**
 * Supabase Service
 * Service để tương tác với Supabase database
 */

import { supabase, supabaseAdmin } from '../config/supabase';

/**
 * Example: Lấy dữ liệu từ một table
 */
export const getTableData = async (tableName: string) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }
};

/**
 * Example: Thêm dữ liệu vào table
 */
export const insertData = async (tableName: string, data: any) => {
  try {
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    return insertedData;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
};

/**
 * Example: Cập nhật dữ liệu
 */
export const updateData = async (tableName: string, id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
};

/**
 * Example: Xóa dữ liệu
 */
export const deleteData = async (tableName: string, id: string) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Example: Query với filter
 */
export const queryWithFilter = async (
  tableName: string,
  column: string,
  operator: string,
  value: any
) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .filter(column, operator, value);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
};

/**
 * Export Supabase clients để sử dụng trực tiếp nếu cần
 */
export { supabase, supabaseAdmin };
