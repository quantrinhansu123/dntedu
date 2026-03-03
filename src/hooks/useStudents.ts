/**
 * useStudents Hook
 * Fetch và quản lý students từ Supabase với realtime updates
 */

import { useState, useEffect, useMemo } from 'react';
import { Student, StudentStatus } from '../../types';
import { StudentService } from '../services/studentService';
import { supabase } from '../config/supabase';

export const useStudents = (filters?: {
  status?: StudentStatus;
  classId?: string;
  searchTerm?: string;
}) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudentService.getStudents(filters);
      setAllStudents(data);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Không thể tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchStudents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          console.log('Student change detected:', payload);
          // Refresh data when changes occur
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.classId]);

  // Client-side filtering
  const students = useMemo(() => {
    let filtered = allStudents;
    
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.fullName?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term) ||
        s.phone?.includes(term) ||
        s.parentName?.toLowerCase().includes(term) ||
        s.parentPhone?.includes(term)
      );
    }
    
    if (filters?.classId) {
      filtered = filtered.filter(s => 
        s.classId === filters.classId || 
        s.classIds?.includes(filters.classId)
      );
    }
    
    return filtered;
  }, [allStudents, filters?.searchTerm, filters?.classId]);

  const refreshStudents = async () => {
    await fetchStudents();
  };

  const createStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      const id = await StudentService.createStudent(studentData);
      return id;
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo học viên');
      throw err;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      await StudentService.updateStudent(id, updates);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật học viên');
      throw err;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await StudentService.deleteStudent(id);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa học viên');
      throw err;
    }
  };

  return {
    students,
    loading,
    error,
    refreshStudents,
    createStudent,
    updateStudent,
    deleteStudent
  };
};

export const useStudent = (id: string) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) {
        setStudent(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await StudentService.getStudentById(id);
        setStudent(data);
      } catch (err: any) {
        console.error('Error fetching student:', err);
        setError(err.message || 'Lỗi khi tải thông tin học viên');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  return { student, loading, error };
};
