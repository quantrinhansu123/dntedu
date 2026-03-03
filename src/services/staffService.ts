/**
 * Staff Service
 * Đã migrate sang Supabase
 */

import { Staff } from '../../types';
import * as staffSupabaseService from './staffSupabaseService';

export class StaffService {
  private static readonly COLLECTION = 'staff';

  static async getStaff(filters?: {
    department?: string;
    role?: string;
    status?: string;
  }): Promise<Staff[]> {
    try {
      if (filters) {
        return await staffSupabaseService.queryStaff({
          department: filters.department,
          role: filters.role,
          status: filters.status,
        });
      }
      return await staffSupabaseService.getAllStaff();
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  }

  static async getStaffById(id: string): Promise<Staff | null> {
    try {
      return await staffSupabaseService.getStaffById(id);
    } catch (error) {
      console.error('Error fetching staff by id:', error);
      throw error;
    }
  }

  static async createStaff(data: Omit<Staff, 'id'>): Promise<string> {
    try {
      // Tạo staff object không có id (Supabase sẽ tự generate UUID)
      const staffData: Staff = {
        ...data,
        // Không thêm id - Supabase sẽ tự generate UUID
      } as Staff;
      
      const created = await staffSupabaseService.createStaff(staffData);
      return created.id;
    } catch (error: any) {
      console.error('Error creating staff:', error);
      throw new Error(error.message || 'Không thể tạo nhân sự');
    }
  }

  static async updateStaff(id: string, data: Partial<Staff>): Promise<void> {
    try {
      await staffSupabaseService.updateStaff(id, data);
    } catch (error: any) {
      console.error('Error updating staff:', error);
      throw new Error(error.message || 'Không thể cập nhật nhân sự');
    }
  }

  static async deleteStaff(id: string): Promise<void> {
    try {
      await staffSupabaseService.deleteStaff(id);
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  }

  static async getTeachers(): Promise<Staff[]> {
    try {
      return await staffSupabaseService.queryStaff({ role: 'Giáo viên' });
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  }

  static async getAssistants(): Promise<Staff[]> {
    try {
      return await staffSupabaseService.queryStaff({ role: 'Trợ giảng' });
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return [];
    }
  }
}

// Legacy named exports for backwards compatibility during migration
export const getStaff = StaffService.getStaff.bind(StaffService);
export const getStaffById = StaffService.getStaffById.bind(StaffService);
export const createStaff = StaffService.createStaff.bind(StaffService);
export const updateStaff = StaffService.updateStaff.bind(StaffService);
export const deleteStaff = StaffService.deleteStaff.bind(StaffService);
export const getTeachers = StaffService.getTeachers.bind(StaffService);
export const getAssistants = StaffService.getAssistants.bind(StaffService);
