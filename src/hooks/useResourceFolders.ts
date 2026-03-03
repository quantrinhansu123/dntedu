/**
 * useResourceFolders Hook
 * Hook để quản lý thư mục tài nguyên với Supabase realtime subscription
 */

import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import * as resourceFolderService from '../services/resourceFolderSupabaseService';
import { ResourceFolder } from '../services/resourceFolderSupabaseService';

interface UseResourceFoldersReturn {
  folders: ResourceFolder[];
  loading: boolean;
  error: string | null;
  createFolder: (data: Partial<ResourceFolder>) => Promise<ResourceFolder>;
  updateFolder: (id: string, data: Partial<ResourceFolder>) => Promise<ResourceFolder>;
  deleteFolder: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useResourceFolders = (): UseResourceFoldersReturn => {
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resourceFolderService.getAllResourceFolders();
      setFolders(data);
    } catch (err: any) {
      console.error('Error fetching resource folders:', err);
      setError(err.message || 'Không thể tải danh sách thư mục');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchFolders();

    // Subscribe to changes
    const channel = supabase
      .channel('resource-folders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource_folders',
        },
        (payload) => {
          console.log('Resource folder change detected:', payload);
          // Refresh data when changes occur
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createFolder = async (data: Partial<ResourceFolder>): Promise<ResourceFolder> => {
    try {
      const newFolder = await resourceFolderService.createResourceFolder(data);
      await fetchFolders(); // Refresh list
      return newFolder;
    } catch (err: any) {
      console.error('Error creating resource folder:', err);
      setError(err.message || 'Không thể tạo thư mục');
      throw err;
    }
  };

  const updateFolder = async (id: string, data: Partial<ResourceFolder>): Promise<ResourceFolder> => {
    try {
      const updatedFolder = await resourceFolderService.updateResourceFolder(id, data);
      await fetchFolders(); // Refresh list
      return updatedFolder;
    } catch (err: any) {
      console.error('Error updating resource folder:', err);
      setError(err.message || 'Không thể cập nhật thư mục');
      throw err;
    }
  };

  const deleteFolder = async (id: string): Promise<void> => {
    try {
      await resourceFolderService.deleteResourceFolder(id);
      await fetchFolders(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting resource folder:', err);
      setError(err.message || 'Không thể xóa thư mục');
      throw err;
    }
  };

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refresh: fetchFolders,
  };
};
