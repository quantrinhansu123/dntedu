/**
 * useHolidays Hook
 * Firebase đã được xóa - Hook này đã bị disable
 * Sử dụng Supabase hooks thay thế
 */

import { useState, useEffect } from 'react';
// import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
// import { db } from '../config/firebase';
import { Holiday } from '../../types';

interface UseHolidaysReturn {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  createHoliday: (data: Omit<Holiday, 'id'>) => Promise<string>;
  updateHoliday: (id: string, data: Partial<Holiday>) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
}

export const useHolidays = (): UseHolidaysReturn => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');

  useEffect(() => {
    console.warn('useHolidays: Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
    setLoading(false);
    setHolidays([]);
    setError('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
  }, []);

  const createHoliday = async (data: Omit<Holiday, 'id'>): Promise<string> => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để tạo holiday.');
  };

  const updateHoliday = async (id: string, data: Partial<Holiday>): Promise<void> => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để cập nhật holiday.');
  };

  const deleteHoliday = async (id: string): Promise<void> => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xóa holiday.');
  };

  return {
    holidays,
    loading,
    error,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
};
