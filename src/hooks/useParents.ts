/**
 * useParents Hook
 * Fetch và quản lý parents từ Supabase với realtime updates
 */

import { useState, useEffect, useMemo } from 'react';
import { Parent, Student } from '../../types';
import * as parentService from '../services/parentService';
import { ParentWithChildren } from '../services/parentService';
import { supabase } from '../config/supabase';

interface UseParentsReturn {
  parents: ParentWithChildren[];
  loading: boolean;
  error: string | null;
  createParent: (data: Omit<Parent, 'id'>) => Promise<string>;
  updateParent: (id: string, data: Partial<Parent>) => Promise<void>;
  deleteParent: (id: string) => Promise<void>;
  findByPhone: (phone: string) => Promise<Parent | null>;
  refresh: () => Promise<void>;
}

export const useParents = (searchTerm?: string): UseParentsReturn => {
  const [allParents, setAllParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchParents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parentService.getParents(searchTerm);
      setAllParents(data);
    } catch (err: any) {
      console.error('Error fetching parents:', err);
      setError(err.message || 'Không thể tải danh sách phụ huynh');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchParents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('parents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parents',
        },
        (payload) => {
          console.log('Parent change detected:', payload);
          // Refresh data when changes occur
          fetchParents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Fetch children for each parent and combine
  const [parentsWithChildren, setParentsWithChildren] = useState<ParentWithChildren[]>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (allParents.length === 0) {
        setParentsWithChildren([]);
        return;
      }
      
      try {
        const parentsWithChildrenData = await Promise.all(
          allParents.map(async (parent) => {
            const children = await parentService.getChildrenByParentId(parent.id);
            return { ...parent, children };
          })
        );
        
        setParentsWithChildren(parentsWithChildrenData);
      } catch (err) {
        console.error('Error fetching children:', err);
        setParentsWithChildren(allParents.map(p => ({ ...p, children: [] })));
      }
    };
    
    fetchChildren();
  }, [allParents]);

  const parents = parentsWithChildren;

  const createParent = async (data: Omit<Parent, 'id'>): Promise<string> => {
    return parentService.createParent(data);
  };

  const updateParent = async (id: string, data: Partial<Parent>): Promise<void> => {
    await parentService.updateParent(id, data);
  };

  const deleteParent = async (id: string): Promise<void> => {
    await parentService.deleteParent(id);
  };

  const findByPhone = async (phone: string): Promise<Parent | null> => {
    return parentService.findParentByPhone(phone);
  };

  const refresh = async () => {
    await fetchParents();
  };

  return {
    parents,
    loading,
    error,
    createParent,
    updateParent,
    deleteParent,
    findByPhone,
    refresh,
  };
};
