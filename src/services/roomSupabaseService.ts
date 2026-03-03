/**
 * Room Supabase Service
 * Service để quản lý dữ liệu phòng học với Supabase
 */

import { supabase } from '../config/supabase';
import { Room } from '../../types';

/**
 * Transform Room data from Supabase format to application format
 */
const transformRoomFromSupabase = (data: any): Room => {
  return {
    id: data.id,
    name: data.name,
    type: data.type as 'Đào tạo' | 'Văn phòng' | 'Hội trường',
    capacity: data.capacity || undefined,
    status: data.status as 'Hoạt động' | 'Bảo trì',
    branch: data.branch || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Transform Room data from application format to Supabase format
 */
const transformRoomForSupabase = (room: Partial<Room>): any => {
  const data: any = {
    name: room.name,
    type: room.type,
    status: room.status || 'Hoạt động',
  };

  if (room.capacity !== undefined) {
    data.capacity = room.capacity;
  }

  if (room.branch !== undefined) {
    data.branch = room.branch || null;
  }

  if (room.notes !== undefined) {
    data.notes = room.notes || null;
  }

  return data;
};

/**
 * Get all rooms
 */
export const getAllRooms = async (): Promise<Room[]> => {
  try {
    // Try to query from view first, fallback to table
    let query = supabase.from('rooms_management_view').select('*').order('name', { ascending: true });
    
    let { data, error } = await query;

    // If view doesn't exist, try rooms_view
    if (error && error.message?.includes('does not exist')) {
      query = supabase.from('rooms_view').select('*').order('name', { ascending: true });
      ({ data, error } = await query);
    }

    // If view still doesn't exist, use table directly
    if (error && error.message?.includes('does not exist')) {
      query = supabase.from('rooms').select('*').order('name', { ascending: true });
      ({ data, error } = await query);
    }

    if (error) {
      console.error('Error fetching rooms:', error);
      throw new Error(`Không thể tải danh sách phòng học: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformRoomFromSupabase);
  } catch (error: any) {
    console.error('Error in getAllRooms:', error);
    throw new Error(error.message || 'Không thể tải danh sách phòng học');
  }
};

/**
 * Get room by ID
 */
export const getRoomById = async (id: string): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching room:', error);
      throw new Error(`Không thể tải thông tin phòng học: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return transformRoomFromSupabase(data);
  } catch (error: any) {
    console.error('Error in getRoomById:', error);
    throw new Error(error.message || 'Không thể tải thông tin phòng học');
  }
};

/**
 * Create a new room
 */
export const createRoom = async (room: Partial<Room>): Promise<Room> => {
  try {
    // Generate UUID if id is not provided
    const roomId = room.id || crypto.randomUUID();

    const supabaseData = {
      id: roomId,
      ...transformRoomForSupabase(room),
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      throw new Error(`Không thể tạo phòng học: ${error.message}`);
    }

    if (!data) {
      throw new Error('Không thể tạo phòng học: Không có dữ liệu trả về');
    }

    return transformRoomFromSupabase(data);
  } catch (error: any) {
    console.error('Error in createRoom:', error);
    throw new Error(error.message || 'Không thể tạo phòng học');
  }
};

/**
 * Update a room
 */
export const updateRoom = async (id: string, room: Partial<Room>): Promise<Room> => {
  try {
    const supabaseData = transformRoomForSupabase(room);

    const { data, error } = await supabase
      .from('rooms')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating room:', error);
      throw new Error(`Không thể cập nhật phòng học: ${error.message}`);
    }

    if (!data) {
      throw new Error('Không thể cập nhật phòng học: Không có dữ liệu trả về');
    }

    return transformRoomFromSupabase(data);
  } catch (error: any) {
    console.error('Error in updateRoom:', error);
    throw new Error(error.message || 'Không thể cập nhật phòng học');
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting room:', error);
      throw new Error(`Không thể xóa phòng học: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in deleteRoom:', error);
    throw new Error(error.message || 'Không thể xóa phòng học');
  }
};

/**
 * Query rooms with filters
 */
export const queryRooms = async (filters: {
  type?: string;
  status?: string;
  branch?: string;
  search?: string;
}): Promise<Room[]> => {
  try {
    let query = supabase.from('rooms').select('*');

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.branch) {
      query = query.eq('branch', filters.branch);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error querying rooms:', error);
      throw new Error(`Không thể tìm kiếm phòng học: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(transformRoomFromSupabase);
  } catch (error: any) {
    console.error('Error in queryRooms:', error);
    throw new Error(error.message || 'Không thể tìm kiếm phòng học');
  }
};
