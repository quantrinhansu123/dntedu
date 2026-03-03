/**
 * useStaffContract Hook
 * Firebase đã được xóa - Hook này đã bị disable
 * Sử dụng Supabase hooks thay thế
 */

import { useState, useEffect } from 'react';
// import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
// import { db } from '../config/firebase';
import { StaffContract } from '../../types';

export const useStaffContract = () => {
  const [contracts, setContracts] = useState<StaffContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');

  // Fetch all contracts
  const fetchContracts = async () => {
    console.warn('useStaffContract.fetchContracts: Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
    setLoading(false);
    setContracts([]);
    setError('Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Create contract
  const createContract = async (contractData: Omit<StaffContract, 'id'>) => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để tạo contract.');
  };

  // Update contract
  const updateContract = async (id: string, contractData: Partial<StaffContract>) => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để cập nhật contract.');
  };

  // Delete contract
  const deleteContract = async (id: string) => {
    throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xóa contract.');
  };

  // Get contracts by staff ID
  const getContractsByStaff = async (staffId: string) => {
    console.warn('useStaffContract.getContractsByStaff: Firebase đã được xóa. Sử dụng Supabase hooks thay thế.');
    return [];
  };

  return {
    contracts,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
    getContractsByStaff,
    refetch: fetchContracts,
  };
};
