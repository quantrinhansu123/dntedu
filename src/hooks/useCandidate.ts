/**
 * useCandidate Hook
  * Sử dụng Supabase hooks thay thế
 */

import { useState, useEffect } from 'react';
// ;
// ;
import { Candidate } from '../../types';

export const useCandidate = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('Tính năng này cần được migrate sang Supabase.');

  // Fetch all candidates
  const fetchCandidates = async () => {
    
    setLoading(false);
    setCandidates([]);
    setError('Tính năng này cần được migrate sang Supabase.');
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const addCandidate = async (candidate: Omit<Candidate, 'id'>) => {
    throw new Error('Tính năng này cần được migrate sang Supabase.');
  };

  const updateCandidate = async (id: string, candidate: Partial<Candidate>) => {
    throw new Error('Tính năng này cần được migrate sang Supabase.');
  };

  const deleteCandidate = async (id: string) => {
    throw new Error('Tính năng này cần được migrate sang Supabase.');
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
