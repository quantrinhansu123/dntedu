/**
 * useHolidays Hook
  * Sử dụng Supabase hooks thay thế
 */

import { useState, useEffect } from 'react';
// ;
// ;
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
  const [error, setError] = useState<string | null>('Tính năng này cần được migrate sang Supabase.');

  useEffect(() => {
    
    setLoading(false);
    setHolidays([]);
    setError('Tính năng này cần được migrate sang Supabase.');
  }, []);

  const createHoliday = async (data: Omit<Holiday, 'id'>): Promise<string> => {
    throw new Error('Tính năng này cần được migrate sang Supabase.');
  };

  const updateHoliday = async (id: string, data: Partial<Holiday>): Promise<void> => {
    throw new Error('Tính năng này cần được migrate sang Supabase.');
  };

  const deleteHoliday = async (id: string): Promise<void> => {
    throw new Error('Tính năng này cần được migrate sang Supabase.');
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
