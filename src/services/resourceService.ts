/**
 * Resource Library Service
 * Quản lý thư viện tài nguyên: video, tài liệu, link web
 * Đã migrate sang Supabase
 */

import { Resource, ResourceFolder } from '../../types';
import * as resourceFolderSupabaseService from './resourceFolderSupabaseService';
import * as resourceSupabaseService from './resourceSupabaseService';

// ==========================================
// FOLDER OPERATIONS
// ==========================================

export const getFolders = async (parentId?: string): Promise<ResourceFolder[]> => {
  try {
    const allFolders = await resourceFolderSupabaseService.getAllResourceFolders();
    
    // Filter by parentId
    if (parentId === undefined) {
      return allFolders;
    } else if (parentId === null || parentId === '') {
      return allFolders.filter(f => !f.parentId);
    } else {
      return allFolders.filter(f => f.parentId === parentId);
    }
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getAllFolders = async (): Promise<ResourceFolder[]> => {
  try {
    return await resourceFolderSupabaseService.getAllResourceFolders();
  } catch (error) {
    console.error('Error fetching all folders:', error);
    throw error;
  }
};


export const createFolder = async (data: Omit<ResourceFolder, 'id'>): Promise<string> => {
  try {
    const result = await resourceFolderSupabaseService.createResourceFolder(data);
    return result.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const updateFolder = async (id: string, data: Partial<ResourceFolder>): Promise<void> => {
  try {
    await resourceFolderSupabaseService.updateResourceFolder(id, data);
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

export const deleteFolder = async (id: string): Promise<void> => {
  try {
    // TODO: Delete all resources in folder when resources table is migrated
    // For now, just delete the folder
    // Delete all subfolders recursively
    const allFolders = await resourceFolderSupabaseService.getAllResourceFolders();
    const subfolders = allFolders.filter(f => f.parentId === id);
    for (const subfolder of subfolders) {
      await deleteFolder(subfolder.id);
    }
    
    // Delete the folder itself
    await resourceFolderSupabaseService.deleteResourceFolder(id);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// ==========================================
// RESOURCE OPERATIONS
// ==========================================

export const getResources = async (folderId?: string): Promise<Resource[]> => {
  try {
    return await resourceSupabaseService.queryResources({
      folderId: folderId,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const getAllResources = async (): Promise<Resource[]> => {
  try {
    return await resourceSupabaseService.getAllResources();
  } catch (error) {
    console.error('Error fetching all resources:', error);
    throw error;
  }
};

export const getResourceById = async (id: string): Promise<Resource | null> => {
  try {
    return await resourceSupabaseService.getResourceById(id);
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
};

export const createResource = async (data: Omit<Resource, 'id'>): Promise<string> => {
  try {
    // Generate UUID for id
    const id = crypto.randomUUID();
    
    const resourceWithId: Resource = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    
    const result = await resourceSupabaseService.createResource(resourceWithId);
    return result.id;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (id: string, data: Partial<Resource>): Promise<void> => {
  try {
    await resourceSupabaseService.updateResource(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  try {
    await resourceSupabaseService.deleteResource(id);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const incrementViewCount = async (id: string): Promise<void> => {
  try {
    await resourceSupabaseService.incrementViewCount(id);
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

export const incrementDownloadCount = async (id: string): Promise<void> => {
  try {
    await resourceSupabaseService.incrementDownloadCount(id);
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};

// Search resources by name or tags
export const searchResources = async (searchTerm: string): Promise<Resource[]> => {
  try {
    const allResources = await getAllResources();
    const term = searchTerm.toLowerCase();
    return allResources.filter(r => 
      r.name.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term) ||
      r.tags?.some(t => t.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching resources:', error);
    throw error;
  }
};
