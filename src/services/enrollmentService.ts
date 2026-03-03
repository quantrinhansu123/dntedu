/**
 * Enrollment Service
 * Supabase operations for enrollment records
 */

import { EnrollmentRecord } from '../../types';
import * as enrollmentSupabaseService from './enrollmentSupabaseService';

export const getEnrollments = async (filters?: {
  type?: string;
  month?: number;
  year?: number;
}): Promise<EnrollmentRecord[]> => {
  try {
    let records: EnrollmentRecord[] = [];
    
    if (filters && filters.type && filters.type !== 'ALL') {
      records = await enrollmentSupabaseService.queryEnrollments({ type: filters.type });
    } else {
      records = await enrollmentSupabaseService.getAllEnrollments();
    }

    // Client-side filtering for month, year
    if (filters?.month && filters?.year) {
      records = records.filter(r => {
        if (!r.createdDate) return false;
        const date = new Date(r.createdDate.split('/').reverse().join('-'));
        return date.getMonth() + 1 === filters.month && date.getFullYear() === filters.year;
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    throw error;
  }
};

export const createEnrollment = async (data: Omit<EnrollmentRecord, 'id'>): Promise<string> => {
  try {
    // Generate UUID for id
    const id = crypto.randomUUID();
    
    const enrollmentWithId: EnrollmentRecord = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    const result = await enrollmentSupabaseService.createEnrollment(enrollmentWithId);
    return result.id;
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
};

export const updateEnrollment = async (id: string, data: Partial<EnrollmentRecord>): Promise<void> => {
  try {
    await enrollmentSupabaseService.updateEnrollment(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    throw error;
  }
};

export const deleteEnrollment = async (id: string): Promise<void> => {
  try {
    await enrollmentSupabaseService.deleteEnrollment(id);
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    throw error;
  }
};

/**
 * Check if enrollment exists for a contract
 */
export const getEnrollmentByContractCode = async (contractCode: string): Promise<EnrollmentRecord | null> => {
  try {
    const records = await enrollmentSupabaseService.queryEnrollments({ contractCode });
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('Error finding enrollment by contract:', error);
    return null;
  }
};

/**
 * Delete enrollment by contract code (for cascade delete)
 */
export const deleteEnrollmentByContractCode = async (contractCode: string): Promise<void> => {
  try {
    const enrollment = await getEnrollmentByContractCode(contractCode);
    if (enrollment) {
      await deleteEnrollment(enrollment.id);
    }
  } catch (error) {
    console.error('Error deleting enrollment by contract:', error);
  }
};
