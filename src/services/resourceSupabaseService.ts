/**
 * Resource Supabase Service
 * Service để quản lý dữ liệu tài nguyên với Supabase
 */

import { supabase } from '../config/supabase';
import { Resource, ResourceType } from '../../types';

/**
 * Chuyển đổi Resource từ format Supabase sang ResourceModel
 */
const transformResourceFromSupabase = (data: any): Resource => {
  return {
    id: data.id,
    name: data.name || '',
    type: data.type as ResourceType,
    folderId: data.folder_id || undefined,
    url: data.url || undefined,
    fileUrl: data.file_url || undefined,
    fileName: data.file_name || undefined,
    fileSize: data.file_size || undefined,
    mimeType: data.mime_type || undefined,
    description: data.description || undefined,
    tags: data.tags ? (Array.isArray(data.tags) ? data.tags : []) : [],
    thumbnail: data.thumbnail || undefined,
    duration: data.duration || undefined,
    viewCount: data.view_count || 0,
    downloadCount: data.download_count || 0,
    isPublic: data.is_public || false,
    allowedRoles: data.allowed_roles ? (Array.isArray(data.allowed_roles) ? data.allowed_roles : []) : [],
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
    createdBy: data.created_by || undefined,
  };
};

/**
 * Chuyển đổi Resource sang format Supabase
 */
const transformResourceForSupabase = (resource: Resource) => {
  return {
    id: resource.id,
    name: resource.name,
    type: resource.type,
    folder_id: resource.folderId || null,
    url: resource.url || null,
    file_url: resource.fileUrl || null,
    file_name: resource.fileName || null,
    file_size: resource.fileSize || null,
    mime_type: resource.mimeType || null,
    description: resource.description || null,
    tags: resource.tags || [],
    thumbnail: resource.thumbnail || null,
    duration: resource.duration || null,
    view_count: resource.viewCount || 0,
    download_count: resource.downloadCount || 0,
    is_public: resource.isPublic || false,
    allowed_roles: resource.allowedRoles || [],
    created_by: resource.createdBy || null,
  };
};

/**
 * Lấy tất cả tài nguyên từ Supabase
 */
export const getAllResources = async (): Promise<Resource[]> => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformResourceFromSupabase);
  } catch (error) {
    console.error('Error fetching resources from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy tài nguyên theo ID
 */
export const getResourceById = async (id: string): Promise<Resource | null> => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformResourceFromSupabase(data);
  } catch (error) {
    console.error('Error fetching resource from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo tài nguyên mới trong Supabase
 */
export const createResource = async (resource: Resource): Promise<Resource> => {
  try {
    const transformed = transformResourceForSupabase(resource);
    
    const { data, error } = await supabase
      .from('resources')
      .insert(transformed)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformResourceFromSupabase(data);
  } catch (error) {
    console.error('Error creating resource in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật tài nguyên trong Supabase
 */
export const updateResource = async (id: string, updates: Partial<Resource>): Promise<Resource> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    if (updates.name !== undefined) transformed.name = updates.name;
    if (updates.type !== undefined) transformed.type = updates.type;
    if (updates.folderId !== undefined) transformed.folder_id = updates.folderId || null;
    if (updates.url !== undefined) transformed.url = updates.url || null;
    if (updates.fileUrl !== undefined) transformed.file_url = updates.fileUrl || null;
    if (updates.fileName !== undefined) transformed.file_name = updates.fileName || null;
    if (updates.fileSize !== undefined) transformed.file_size = updates.fileSize || null;
    if (updates.mimeType !== undefined) transformed.mime_type = updates.mimeType || null;
    if (updates.description !== undefined) transformed.description = updates.description || null;
    if (updates.tags !== undefined) transformed.tags = updates.tags || [];
    if (updates.thumbnail !== undefined) transformed.thumbnail = updates.thumbnail || null;
    if (updates.duration !== undefined) transformed.duration = updates.duration || null;
    if (updates.viewCount !== undefined) transformed.view_count = updates.viewCount;
    if (updates.downloadCount !== undefined) transformed.download_count = updates.downloadCount;
    if (updates.isPublic !== undefined) transformed.is_public = updates.isPublic;
    if (updates.allowedRoles !== undefined) transformed.allowed_roles = updates.allowedRoles || [];
    if (updates.createdBy !== undefined) transformed.created_by = updates.createdBy || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('resources')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformResourceFromSupabase(data);
  } catch (error) {
    console.error('Error updating resource in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa tài nguyên trong Supabase
 */
export const deleteResource = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting resource from Supabase:', error);
    throw error;
  }
};

/**
 * Query tài nguyên với filter
 */
export const queryResources = async (filters: {
  folderId?: string;
  type?: string;
  isPublic?: boolean;
}): Promise<Resource[]> => {
  try {
    let query = supabase.from('resources').select('*');
    
    if (filters.folderId !== undefined) {
      if (filters.folderId === null || filters.folderId === '') {
        query = query.is('folder_id', null);
      } else {
        query = query.eq('folder_id', filters.folderId);
      }
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformResourceFromSupabase);
  } catch (error) {
    console.error('Error querying resources from Supabase:', error);
    throw error;
  }
};

/**
 * Increment view count
 */
export const incrementViewCount = async (id: string): Promise<void> => {
  try {
    const resource = await getResourceById(id);
    if (resource) {
      await updateResource(id, { viewCount: (resource.viewCount || 0) + 1 });
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (id: string): Promise<void> => {
  try {
    const resource = await getResourceById(id);
    if (resource) {
      await updateResource(id, { downloadCount: (resource.downloadCount || 0) + 1 });
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};
