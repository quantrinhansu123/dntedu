import { ClassModel, ClassStatus } from '../../types';
import * as classSupabaseService from './classSupabaseService';

const COLLECTION_NAME = 'classes';

// NOTE: Session generation is now handled by Cloud Functions (onClassCreate trigger)
// See: functions/src/triggers/classTriggers.ts

export class ClassService {
  
  // Get all classes with optional filters
  static async getClasses(filters?: {
    status?: ClassStatus;
    teacherId?: string;
    searchTerm?: string;
  }): Promise<ClassModel[]> {
    try {
      if (filters && (filters.status || filters.teacherId)) {
        const result = await classSupabaseService.queryClasses({
          status: filters.status,
          teacherId: filters.teacherId,
        });
        
        // Client-side search if searchTerm provided
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          return result.filter(c => 
            c.name.toLowerCase().includes(term)
          );
        }
        
        return result;
      }
      
      const allClasses = await classSupabaseService.getAllClasses();
      
      // Client-side search if searchTerm provided
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return allClasses.filter(c => 
          c.name.toLowerCase().includes(term)
        );
      }
      
      return allClasses;
    } catch (error) {
      console.error('Error getting classes:', error);
      throw error;
    }
  }
  
  // Get single class by ID
  static async getClassById(id: string): Promise<ClassModel | null> {
    try {
      return await classSupabaseService.getClassById(id);
    } catch (error) {
      console.error('Error getting class:', error);
      throw error;
    }
  }
  
  // Create new class
  static async createClass(classData: Omit<ClassModel, 'id'>): Promise<string> {
    try {
      // Generate UUID for id
      const id = crypto.randomUUID();
      
      const classWithId: ClassModel = {
        ...classData,
        id,
        createdAt: classData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add training history entry
      if (!classWithId.trainingHistory) {
        classWithId.trainingHistory = [];
      }
      classWithId.trainingHistory.push({
        id: `HIST_${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Tạo lớp',
        description: `Lớp học ${classData.name} được tạo`,
        staffId: '',
        staffName: 'System'
      });
      
      const result = await classSupabaseService.createClass(classWithId);
      return result.id;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }
  
  // Update class
  static async updateClass(id: string, updates: Partial<ClassModel>): Promise<void> {
    try {
      await classSupabaseService.updateClass(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // Cascade update className to students if name changed
      // TODO: Implement cascade update for Supabase
      // if (updates.name) {
      //   await cascadeUpdateClassName(id, updates.name);
      // }
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  }
  
  // Delete class with validation and cascade
  static async deleteClass(id: string, forceDelete: boolean = false): Promise<{
    success: boolean;
    message: string;
    cascadeResult?: { studentsUpdated: number; workSessionsUpdated: number };
  }> {
    try {
      // Get class info first
      const classData = await this.getClassById(id);
      
      // Validate before delete
      // TODO: Implement validation for Supabase
      // if (!forceDelete) {
      //   const validation = await validateDeleteClass(id);
      //   if (!validation.canDelete) {
      //     return {
      //       success: false,
      //       message: validation.reason || 'Không thể xóa lớp học',
      //     };
      //   }
      // }
      
      // Cascade updates (clear references in students/work sessions)
      // TODO: Implement cascade delete for Supabase
      // const cascadeResult = await cascadeDeleteClass(id, classData?.name);
      
      // Delete the class
      await classSupabaseService.deleteClass(id);
      
      return {
        success: true,
        message: 'Đã xóa lớp học.',
        cascadeResult: { studentsUpdated: 0, workSessionsUpdated: 0 },
      };
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }
  
  // Simple delete (backward compatibility)
  static async deleteClassSimple(id: string): Promise<void> {
    const result = await this.deleteClass(id, true);
    if (!result.success) {
      throw new Error(result.message);
    }
  }
  
  // Add history entry to class
  static async addClassHistory(
    classId: string, 
    historyEntry: {
      type: string;
      description: string;
      staffId: string;
      staffName: string;
    }
  ): Promise<void> {
    try {
      const classData = await this.getClassById(classId);
      if (!classData) throw new Error('Class not found');
      
      const currentHistory = classData.trainingHistory || [];
      
      const newEntry = {
        id: `HIST_${Date.now()}`,
        date: new Date().toISOString(),
        ...historyEntry
      };
      
      await classSupabaseService.updateClass(classId, {
        trainingHistory: [...currentHistory, newEntry],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding class history:', error);
      throw error;
    }
  }
  
  // Update class progress
  static async updateClassProgress(classId: string, progress: string): Promise<void> {
    try {
      await this.updateClass(classId, { progress });
      await this.addClassHistory(classId, {
        type: 'Cập nhật tiến độ',
        description: `Tiến độ cập nhật: ${progress}`,
        staffId: '',
        staffName: 'System'
      });
    } catch (error) {
      console.error('Error updating class progress:', error);
      throw error;
    }
  }
  
  // Get classes by teacher
  static async getClassesByTeacher(teacherId: string): Promise<ClassModel[]> {
    return this.getClasses({ teacherId });
  }
  
  // Get active classes
  static async getActiveClasses(): Promise<ClassModel[]> {
    return this.getClasses({ status: ClassStatus.STUDYING });
  }
}
