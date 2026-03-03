/**
 * Resource Folder Supabase Service
 * Service để quản lý dữ liệu thư mục tài nguyên với Supabase
 */

import { supabase } from '../config/supabase';

export interface ResourceFolder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Transform ResourceFolder data from Supabase format to application format
 */
const transformResourceFolderFromSupabase = (data: any): ResourceFolder => {
  return {
    id: data.id,
    name: data.name,
    parentId: data.parent_id || undefined,
    color: data.color || undefined,
    description: data.description || undefined,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Transform ResourceFolder data from application format to Supabase format
 */
const transformResourceFolderForSupabase = (folder: Partial<ResourceFolder>): any => {
  const data: any = {
    name: folder.name,
    parent_id: folder.parentId || null,
    color: folder.color || null,
    description: folder.description || null,
  };

  return data;
};

/**
 * Generate UUID for folder ID
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Get all resource folders
 */
export const getAllResourceFolders = async (): Promise<ResourceFolder[]> => {
  try {
    const { data, error } = await supabase
      .from('resource_folders')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching resource folders:', error);
      throw new Error(`Không thể tải danh sách thư mục: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformResourceFolderFromSupabase);
  } catch (error: any) {
    console.error('Error in getAllResourceFolders:', error);
    throw new Error(error.message || 'Không thể tải danh sách thư mục');
  }
};

/**
 * Get resource folder by ID
 */
export const getResourceFolderById = async (id: string): Promise<ResourceFolder | null> => {
  try {
    const { data, error } = await supabase
      .from('resource_folders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching resource folder:', error);
      throw new Error(`Không thể tải thông tin thư mục: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return transformResourceFolderFromSupabase(data);
  } catch (error: any) {
    console.error('Error in getResourceFolderById:', error);
    throw new Error(error.message || 'Không thể tải thông tin thư mục');
  }
};

/**
 * Create a new resource folder
 */
export const createResourceFolder = async (folder: Partial<ResourceFolder>): Promise<ResourceFolder> => {
  try {
    // Generate UUID if id is not provided
    const folderId = folder.id || generateUUID();

    const supabaseData = {
      id: folderId,
      ...transformResourceFolderForSupabase(folder),
    };

    const { data, error } = await supabase
      .from('resource_folders')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating resource folder:', error);
      throw new Error(`Không thể tạo thư mục: ${error.message}`);
    }

    if (!data) {
      throw new Error('Không thể tạo thư mục: Không có dữ liệu trả về');
    }

    return transformResourceFolderFromSupabase(data);
  } catch (error: any) {
    console.error('Error in createResourceFolder:', error);
    throw new Error(error.message || 'Không thể tạo thư mục');
  }
};

/**
 * Update a resource folder
 */
export const updateResourceFolder = async (id: string, folder: Partial<ResourceFolder>): Promise<ResourceFolder> => {
  try {
    const supabaseData = transformResourceFolderForSupabase(folder);

    const { data, error } = await supabase
      .from('resource_folders')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resource folder:', error);
      throw new Error(`Không thể cập nhật thư mục: ${error.message}`);
    }

    if (!data) {
      throw new Error('Không thể cập nhật thư mục: Không có dữ liệu trả về');
    }

    return transformResourceFolderFromSupabase(data);
  } catch (error: any) {
    console.error('Error in updateResourceFolder:', error);
    throw new Error(error.message || 'Không thể cập nhật thư mục');
  }
};

/**
 * Delete a resource folder
 */
export const deleteResourceFolder = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('resource_folders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting resource folder:', error);
      throw new Error(`Không thể xóa thư mục: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in deleteResourceFolder:', error);
    throw new Error(error.message || 'Không thể xóa thư mục');
  }
};

/**
 * Get folders by parent ID (for building tree structure)
 */
export const getResourceFoldersByParent = async (parentId?: string): Promise<ResourceFolder[]> => {
  try {
    let query = supabase.from('resource_folders').select('*');

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching resource folders by parent:', error);
      throw new Error(`Không thể tải danh sách thư mục: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformResourceFolderFromSupabase);
  } catch (error: any) {
    console.error('Error in getResourceFoldersByParent:', error);
    throw new Error(error.message || 'Không thể tải danh sách thư mục');
  }
};
