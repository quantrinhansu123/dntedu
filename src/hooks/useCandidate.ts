/**
 * useCandidate Hook
 * Firebase đã được xóa - Hook này đã bị disable
 * Sử dụng Supabase hooks thay thế
 */

import { useState, useEffect } from 'react';
// import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
// import { db } from '../config/firebase';
import { Candidate } from '../../types';

export const useCandidate = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');

  // Fetch all candidates
  const fetchCandidates = async () => {
    console.warn('useCandidate.fetchCandidates: Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
    setLoading(false);
    setCandidates([]);
    setError('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const addCandidate = async (candidate: Omit<Candidate, 'id'>) => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để thêm candidate.');
  };

  const updateCandidate = async (id: string, candidate: Partial<Candidate>) => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để cập nhật candidate.');
  };

  const deleteCandidate = async (id: string) => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xóa candidate.');
  };

  return {
    candidates,
    loading,
    error,
    fetchCandidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
  };
};
