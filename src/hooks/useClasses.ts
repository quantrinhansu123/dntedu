/**
 * useClasses Hook
 * Fetch và quản lý classes từ Supabase với realtime updates
 */

import { useState, useEffect, useMemo } from 'react';
import { ClassModel, ClassStatus } from '../types';
import { ClassService } from '../services/classService';
import { supabase } from '../config/supabase';
import * as classSupabaseService from '../services/classSupabaseService';

export const useClasses = (filters?: {
  status?: ClassStatus;
  teacherId?: string;
  searchTerm?: string;
}) => {
  const [allClasses, setAllClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClassService.getClasses(filters);
      setAllClasses(data);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchClasses();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
        },
        (payload) => {
          console.log('Class change detected:', payload);
          // Refresh data when changes occur
          fetchClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.teacherId]);

  // Client-side filtering
  const classes = useMemo(() => {
    let filtered = allClasses;
    
    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters?.teacherId) {
      filtered = filtered.filter(c => c.teacherId === filters.teacherId);
    }
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(term) ||
        c.curriculum?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [allClasses, filters?.status, filters?.teacherId, filters?.searchTerm]);

  const refreshClasses = async () => {
    await fetchClasses();
  };

  const createClass = async (classData: Omit<ClassModel, 'id'>) => {
    try {
      const id = await ClassService.createClass(classData);
      await refreshClasses();
      return id;
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo lớp học');
      throw err;
    }
  };

  const updateClass = async (id: string, updates: Partial<ClassModel>) => {
    try {
      await ClassService.updateClass(id, updates);
      await refreshClasses();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật lớp học');
      throw err;
    }
  };

  const deleteClass = async (id: string, forceDelete: boolean = false): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const result = await ClassService.deleteClass(id, forceDelete);
      if (result.success) {
        await refreshClasses();
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa lớp học');
      return { success: false, message: err.message || 'Lỗi khi xóa lớp học' };
    }
  };

  return {
    classes,
    loading,
    error,
    refreshClasses,
    createClass,
    updateClass,
    deleteClass
  };
};

export const useClass = (id: string) => {
  const [classData, setClassData] = useState<ClassModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClassService.getClassById(id);
        setClassData(data);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải thông tin lớp học');
        console.error('Error fetching class:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClass();
    }
  }, [id]);

  return { classData, loading, error };
};
