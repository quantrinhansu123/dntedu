/**
 * useLeads Hook - Realtime listener version
 */

import { useState, useEffect, useMemo } from 'react';
// ;
import * as leadService from '../services/leadService';
import { Lead, LeadStatus, LeadSource } from '../services/leadService';

interface UseLeadsProps {
  status?: LeadStatus;
  source?: LeadSource;
}

interface UseLeadsReturn {
  leads: Lead[];
  stats: Record<LeadStatus, number>;
  loading: boolean;
  error: string | null;
  createLead: (data: Omit<Lead, 'id'>) => Promise<string>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  assignLeads: (ids: string[], assignedTo: string, name: string) => Promise<void>;
  refresh: () => void;
}

const DEFAULT_STATS: Record<LeadStatus, number> = {
  'Mới': 0, 'Đang liên hệ': 0, 'Quan tâm': 0, 'Hẹn test': 0, 'Đã test': 0, 'Đăng ký': 0, 'Từ chối': 0,
};

export const useLeads = (props?: UseLeadsProps): UseLeadsReturn => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leads on mount and after mutations
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadService.getLeads();
      setAllLeads(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Không thể tải danh sách khách hàng');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter leads based on props
  const leads = useMemo(() => {
    let filtered = allLeads;
    if (props?.status) {
      filtered = filtered.filter(l => l.status === props.status);
    }
    if (props?.source) {
      filtered = filtered.filter(l => l.source === props.source);
    }
    return filtered;
  }, [allLeads, props?.status, props?.source]);

  // Calculate stats from all leads
  const stats = useMemo(() => {
    const result = { ...DEFAULT_STATS };
    allLeads.forEach(lead => {
      if (result[lead.status] !== undefined) {
        result[lead.status]++;
      }
    });
    return result;
  }, [allLeads]);

  const createLead = async (data: Omit<Lead, 'id'>): Promise<string> => {
    const id = await leadService.createLead(data);
    await fetchLeads(); // Refresh after create
    return id;
  };

  const updateLead = async (id: string, data: Partial<Lead>): Promise<void> => {
    await leadService.updateLead(id, data);
    await fetchLeads(); // Refresh after update
  };

  const updateStatus = async (id: string, status: LeadStatus): Promise<void> => {
    await leadService.updateLeadStatus(id, status);
    await fetchLeads(); // Refresh after update
  };

  const deleteLead = async (id: string): Promise<void> => {
    await leadService.deleteLead(id);
    await fetchLeads(); // Refresh after delete
  };

  const assignLeads = async (ids: string[], assignedTo: string, name: string): Promise<void> => {
    await leadService.assignLeads(ids, assignedTo, name);
    await fetchLeads(); // Refresh after assign
  };

  return {
    leads,
    stats,
    loading,
    error,
    createLead,
    updateLead,
    updateStatus,
    deleteLead,
    assignLeads,
    refresh: fetchLeads, // Refresh function
  };
};
