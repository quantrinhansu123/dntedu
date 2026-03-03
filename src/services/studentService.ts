/**
 * Student Service (Refactored)
 * - Students có parentId reference đến parents collection
 * - parentName/parentPhone được denormalize để hiển thị nhanh
 */

import { Student, StudentStatus, CareLog } from '../../types';
import { getParent, createParent, findParentByPhone } from './parentService';
import * as studentSupabaseService from './studentSupabaseService';

export class StudentService {
  
  // Get all students with optional filters
  static async getStudents(filters?: {
    status?: StudentStatus;
    classId?: string;
    searchTerm?: string;
    parentId?: string;
  }): Promise<Student[]> {
    try {
      if (filters && (filters.status || filters.classId || filters.parentId)) {
        const result = await studentSupabaseService.queryStudents({
          status: filters.status,
          classId: filters.classId,
          parentId: filters.parentId,
        });
        
        // Client-side search if searchTerm provided
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          return result.filter(s => 
            s.fullName.toLowerCase().includes(term) ||
            s.code.toLowerCase().includes(term) ||
            s.phone?.includes(term) ||
            s.parentName?.toLowerCase().includes(term)
          );
        }
        
        return result;
      }
      
      const allStudents = await studentSupabaseService.getAllStudents();
      
      // Client-side search if searchTerm provided
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return allStudents.filter(s => 
          s.fullName.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term) ||
          s.phone?.includes(term) ||
          s.parentName?.toLowerCase().includes(term)
        );
      }
      
      return allStudents;
    } catch (error) {
      console.error('Error getting students:', error);
      throw error;
    }
  }
  
  // Get single student by ID
  static async getStudentById(id: string): Promise<Student | null> {
    try {
      return await studentSupabaseService.getStudentById(id);
    } catch (error) {
      console.error('Error getting student:', error);
      throw error;
    }
  }
  
  // Create new student with parent linking
  static async createStudent(studentData: Omit<Student, 'id'> & {
    parentId?: string;
    newParentName?: string;
    newParentPhone?: string;
  }): Promise<string> {
    try {
      let parentId = studentData.parentId;
      let parentName = studentData.parentName;
      let parentPhone = studentData.parentPhone;
      
      // If no parentId but has parent info, find or create parent
      if (!parentId && studentData.newParentPhone) {
        // Try to find existing parent by phone
        const existingParent = await findParentByPhone(studentData.newParentPhone);
        
        if (existingParent) {
          parentId = existingParent.id;
          parentName = existingParent.name;
          parentPhone = existingParent.phone;
        } else if (studentData.newParentName) {
          // Create new parent
          parentId = await createParent({
            name: studentData.newParentName,
            phone: studentData.newParentPhone,
          });
          parentName = studentData.newParentName;
          parentPhone = studentData.newParentPhone;
        }
      } else if (parentId) {
        // Get parent info for denormalization
        const parent = await getParent(parentId);
        if (parent) {
          parentName = parent.name;
          parentPhone = parent.phone;
        }
      }
      
      const { newParentName, newParentPhone, ...restData } = studentData;
      
      // Generate UUID for id
      const id = crypto.randomUUID();
      
      // Generate code if not provided
      let code = restData.code;
      if (!code || code.trim() === '') {
        // Generate code: HV + year + 6 digits from timestamp
        const year = new Date().getFullYear().toString().slice(-2);
        const timestamp = Date.now().toString().slice(-6);
        code = `HV${year}${timestamp}`;
        
        // Ensure uniqueness by checking existing codes
        const existingStudents = await this.getStudents();
        const existingCodes = new Set(existingStudents.map(s => s.code));
        let uniqueCode = code;
        let counter = 1;
        while (existingCodes.has(uniqueCode)) {
          uniqueCode = `HV${year}${timestamp}${counter.toString().padStart(2, '0')}`;
          counter++;
        }
        code = uniqueCode;
      }
      
      const studentWithId: Student = {
        ...restData,
        id,
        code,
        parentId: parentId || undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const result = await studentSupabaseService.createStudent(studentWithId);
      return result.id;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }
  
  // Update student
  static async updateStudent(id: string, updates: Partial<Student> & {
    newParentId?: string;
  }): Promise<void> {
    try {
      // Handle parent updates
      if (updates.newParentId) {
        const parent = await getParent(updates.newParentId);
        if (parent) {
          updates.parentId = parent.id;
          updates.parentName = parent.name;
          updates.parentPhone = parent.phone;
        }
      }
      
      // Get current student to check parentId
      const currentStudent = await this.getStudentById(id);
      
      // Sync parent info to parents collection if parentName/parentPhone changed
      if (currentStudent?.parentId && (updates.parentName || updates.parentPhone)) {
        const { updateParent } = await import('./parentService');
        const parentUpdates: Record<string, string> = {};
        if (updates.parentName) parentUpdates.name = updates.parentName;
        if (updates.parentPhone) parentUpdates.phone = updates.parentPhone;

        await updateParent(currentStudent.parentId, parentUpdates);
      }
      
      const { newParentId, ...restUpdates } = updates;
      
      await studentSupabaseService.updateStudent(id, {
        ...restUpdates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }
  
  // Delete student
  static async deleteStudent(id: string): Promise<void> {
    try {
      await studentSupabaseService.deleteStudent(id);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
  
  // Add care log to student
  static async addCareLog(studentId: string, careLog: Omit<CareLog, 'id'>): Promise<void> {
    try {
      const student = await this.getStudentById(studentId);
      if (!student) throw new Error('Student not found');
      
      const newLog: CareLog = {
        ...careLog,
        id: `LOG_${Date.now()}`
      };
      
      const updatedHistory = [...(student.careHistory || []), newLog];
      await this.updateStudent(studentId, { careHistory: updatedHistory });
    } catch (error) {
      console.error('Error adding care log:', error);
      throw error;
    }
  }
  
  // Get students by birthday month
  static async getStudentsByBirthdayMonth(month: number): Promise<Student[]> {
    try {
      const allStudents = await this.getStudents();
      return allStudents.filter(student => {
        const studentMonth = new Date(student.dob).getMonth() + 1;
        return studentMonth === month;
      });
    } catch (error) {
      console.error('Error getting students by birthday month:', error);
      throw error;
    }
  }
  
  // Bulk update student status (for class changes)
  static async bulkUpdateStudentStatus(
    studentIds: string[], 
    status: StudentStatus,
    classId?: string,
    className?: string
  ): Promise<void> {
    try {
      // Update each student individually in Supabase
      for (const studentId of studentIds) {
        await studentSupabaseService.updateStudent(studentId, {
          status,
          classId: classId || undefined,
          class: className || undefined,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error bulk updating students:', error);
      throw error;
    }
  }
}
