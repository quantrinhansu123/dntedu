/**
 * useStaff Hook
 * Đã migrate sang Supabase với realtime subscription
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Staff } from '../../types';
import * as staffService from '../services/staffService';

interface UseStaffProps {
  department?: string;
  role?: string;
  status?: string;
}

interface UseStaffReturn {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  createStaff: (data: Omit<Staff, 'id'>) => Promise<string>;
  updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useStaff = (props?: UseStaffProps): UseStaffReturn => {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffService.getStaff(props);
      setAllStaff(data);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      setError(err.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchStaff();

    // Subscribe to changes
    const channel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff',
        },
        (payload) => {
          console.log('Staff change detected:', payload);
          // Refresh data when changes occur
          fetchStaff();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [props?.department, props?.role, props?.status]);

  // Client-side filtering
  const staff = useMemo(() => {
    let filtered = allStaff;
    
    if (props?.department) {
      filtered = filtered.filter(s => s.department === props.department);
    }
    if (props?.role) {
      filtered = filtered.filter(s => s.role === props.role);
    }
    if (props?.status) {
      filtered = filtered.filter(s => s.status === props.status);
    }
    
    return filtered;
  }, [allStaff, props?.department, props?.role, props?.status]);

  const createStaff = async (data: Omit<Staff, 'id'>): Promise<string> => {
    try {
      const id = await staffService.createStaff(data);
      await fetchStaff(); // Refresh after create
      return id;
    } catch (err: any) {
      setError(err.message || 'Không thể tạo nhân sự');
      throw err;
    }
  };

  const updateStaff = async (id: string, data: Partial<Staff>): Promise<void> => {
    try {
      await staffService.updateStaff(id, data);
      await fetchStaff(); // Refresh after update
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật nhân sự');
      throw err;
    }
  };

  const deleteStaff = async (id: string): Promise<void> => {
    try {
      await staffService.deleteStaff(id);
      await fetchStaff(); // Refresh after delete
    } catch (err: any) {
      setError(err.message || 'Không thể xóa nhân sự');
      throw err;
    }
  };

  const refresh = async (): Promise<void> => {
    await fetchStaff();
  };

  return {
    staff,
    loading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    refresh,
  };
};
