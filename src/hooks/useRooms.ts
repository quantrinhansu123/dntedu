/**
 * useRooms Hook
 * Hook để quản lý phòng học với Supabase realtime subscription
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Room } from '../../types';
import * as roomService from '../services/roomSupabaseService';

interface UseRoomsProps {
  type?: string;
  status?: string;
  branch?: string;
  search?: string;
}

interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  createRoom: (data: Partial<Room>) => Promise<Room>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<Room>;
  deleteRoom: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useRooms = (props?: UseRoomsProps): UseRoomsReturn => {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (props && (props.type || props.status || props.branch || props.search)) {
        // Use query with filters
        const data = await roomService.queryRooms({
          type: props.type,
          status: props.status,
          branch: props.branch,
          search: props.search,
        });
        setAllRooms(data);
      } else {
        // Get all rooms
        const data = await roomService.getAllRooms();
        setAllRooms(data);
      }
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.message || 'Không thể tải danh sách phòng học');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchRooms();

    // Subscribe to changes
    const channel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        (payload) => {
          console.log('Room change detected:', payload);
          // Refresh data when changes occur
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [props?.type, props?.status, props?.branch, props?.search]);

  // Client-side filtering (additional filtering if needed)
  const rooms = useMemo(() => {
    let filtered = allRooms;
    
    if (props?.type) {
      filtered = filtered.filter(r => r.type === props.type);
    }
    
    if (props?.status) {
      filtered = filtered.filter(r => r.status === props.status);
    }
    
    if (props?.branch) {
      filtered = filtered.filter(r => r.branch === props.branch);
    }
    
    if (props?.search) {
      const searchLower = props.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        (r.notes && r.notes.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [allRooms, props?.type, props?.status, props?.branch, props?.search]);

  const createRoom = async (data: Partial<Room>): Promise<Room> => {
    try {
      const newRoom = await roomService.createRoom(data);
      await fetchRooms(); // Refresh list
      return newRoom;
    } catch (err: any) {
      console.error('Error creating room:', err);
      throw err;
    }
  };

  const updateRoom = async (id: string, data: Partial<Room>): Promise<Room> => {
    try {
      const updatedRoom = await roomService.updateRoom(id, data);
      await fetchRooms(); // Refresh list
      return updatedRoom;
    } catch (err: any) {
      console.error('Error updating room:', err);
      throw err;
    }
  };

  const deleteRoom = async (id: string): Promise<void> => {
    try {
      await roomService.deleteRoom(id);
      await fetchRooms(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting room:', err);
      throw err;
    }
  };

  return {
    rooms,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
    refresh: fetchRooms,
  };
};
