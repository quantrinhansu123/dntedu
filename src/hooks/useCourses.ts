/**
 * useCourses Hook
 * Hook để quản lý khóa học với Supabase realtime subscription
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import * as courseService from '../services/courseSupabaseService';
import { Course } from '../services/courseSupabaseService';

interface UseCoursesProps {
  level?: string;
  status?: string;
  search?: string;
}

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  createCourse: (data: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCourses = (props?: UseCoursesProps): UseCoursesReturn => {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (props && (props.level || props.status || props.search)) {
        // Use query with filters
        const data = await courseService.queryCourses({
          level: props.level,
          status: props.status,
          search: props.search,
        });
        setAllCourses(data);
      } else {
        // Get all courses
        const data = await courseService.getAllCourses();
        setAllCourses(data);
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchCourses();

    // Subscribe to changes
    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
        },
        (payload) => {
          console.log('Course change detected:', payload);
          // Refresh data when changes occur
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [props?.level, props?.status, props?.search]);

  // Client-side filtering (additional filtering if needed)
  const courses = useMemo(() => {
    let filtered = allCourses;
    
    if (props?.level) {
      filtered = filtered.filter(c => c.level === props.level);
    }
    
    if (props?.status) {
      filtered = filtered.filter(c => c.status === props.status);
    }
    
    if (props?.search) {
      const searchLower = props.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.code.toLowerCase().includes(searchLower) ||
        (c.curriculum && c.curriculum.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [allCourses, props?.level, props?.status, props?.search]);

  const createCourse = async (data: Partial<Course>): Promise<Course> => {
    try {
      const newCourse = await courseService.createCourse(data);
      await fetchCourses(); // Refresh list
      return newCourse;
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message || 'Không thể tạo khóa học');
      throw err;
    }
  };

  const updateCourse = async (id: string, data: Partial<Course>): Promise<Course> => {
    try {
      const updatedCourse = await courseService.updateCourse(id, data);
      await fetchCourses(); // Refresh list
      return updatedCourse;
    } catch (err: any) {
      console.error('Error updating course:', err);
      setError(err.message || 'Không thể cập nhật khóa học');
      throw err;
    }
  };

  const deleteCourse = async (id: string): Promise<void> => {
    try {
      await courseService.deleteCourse(id);
      await fetchCourses(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError(err.message || 'Không thể xóa khóa học');
      throw err;
    }
  };

  return {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    refresh: fetchCourses,
  };
};
