/**
 * Parent Service (Refactored)
 * - Parents collection: chỉ lưu thông tin PH
 * - Children: query từ students collection by parentId
 */

import { Parent, Student } from '../../types';
import * as parentSupabaseService from './parentSupabaseService';
import { StudentService } from './studentService';

const PARENTS_COLLECTION = 'parents';
const STUDENTS_COLLECTION = 'students';

export interface ParentWithChildren extends Parent {
  children: Student[];
}

/**
 * Create new parent
 */
export const createParent = async (data: Omit<Parent, 'id'>): Promise<string> => {
  try {
    // Generate UUID for id
    const id = crypto.randomUUID();
    
    const parentWithId: Parent = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await parentSupabaseService.createParent(parentWithId);
    return result.id;
  } catch (error) {
    console.error('Error creating parent:', error);
    throw new Error('Không thể tạo phụ huynh');
  }
};

/**
 * Get parent by ID
 */
export const getParent = async (id: string): Promise<Parent | null> => {
  try {
    return await parentSupabaseService.getParentById(id);
  } catch (error) {
    console.error('Error getting parent:', error);
    throw new Error('Không thể tải thông tin phụ huynh');
  }
};

/**
 * Get all parents with optional search
 */
export const getParents = async (searchTerm?: string): Promise<Parent[]> => {
  try {
    return await parentSupabaseService.queryParents({
      search: searchTerm,
    });
  } catch (error) {
    console.error('Error getting parents:', error);
    throw new Error('Không thể tải danh sách phụ huynh');
  }
};

/**
 * Get children of a parent (query from students collection)
 */
export const getChildrenByParentId = async (parentId: string): Promise<Student[]> => {
  try {
    return await StudentService.getStudents({ parentId });
  } catch (error) {
    console.error('Error getting children:', error);
    return [];
  }
};

/**
 * Get all parents with their children
 */
export const getParentsWithChildren = async (searchTerm?: string): Promise<ParentWithChildren[]> => {
  try {
    const parents = await getParents(searchTerm);
    
    // Get children for each parent
    const parentsWithChildren = await Promise.all(
      parents.map(async (parent) => {
        const children = await getChildrenByParentId(parent.id);
        return { ...parent, children };
      })
    );
    
    return parentsWithChildren;
  } catch (error) {
    console.error('Error getting parents with children:', error);
    throw new Error('Không thể tải danh sách phụ huynh');
  }
};

/**
 * Find parent by phone number
 */
export const findParentByPhone = async (phone: string): Promise<Parent | null> => {
  try {
    return await parentSupabaseService.findParentByPhone(phone);
  } catch (error) {
    console.error('Error finding parent by phone:', error);
    return null;
  }
};

/**
 * Update parent and sync to all related students
 */
export const updateParent = async (id: string, data: Partial<Parent>): Promise<void> => {
  try {
    await parentSupabaseService.updateParent(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    
    // Sync to all students with this parentId
    if (data.name || data.phone) {
      const children = await getChildrenByParentId(id);
      const studentUpdates: any = {};
      if (data.name) studentUpdates.parentName = data.name;
      if (data.phone) studentUpdates.parentPhone = data.phone;
      
      // Update each student's denormalized parent fields
      for (const child of children) {
        await StudentService.updateStudent(child.id, {
          ...studentUpdates,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating parent:', error);
    throw new Error('Không thể cập nhật phụ huynh');
  }
};

/**
 * Delete parent (only if no children)
 */
export const deleteParent = async (id: string): Promise<void> => {
  try {
    // Check if parent has children
    const children = await getChildrenByParentId(id);
    if (children.length > 0) {
      throw new Error('Không thể xóa phụ huynh đang có học sinh');
    }
    
    await parentSupabaseService.deleteParent(id);
  } catch (error) {
    console.error('Error deleting parent:', error);
    throw error;
  }
};
