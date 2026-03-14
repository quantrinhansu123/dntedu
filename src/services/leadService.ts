/**
 * Lead Service
 * Handle customer leads/potential students CRUD với Supabase
 */

import { supabase } from '../config/supabase';

const LEADS_COLLECTION = 'leads';

export type LeadStatus = 'Mới' | 'Đang liên hệ' | 'Quan tâm' | 'Hẹn test' | 'Đã test' | 'Đăng ký' | 'Từ chối';
export type LeadSource = 'Facebook' | 'Zalo' | 'Website' | 'Giới thiệu' | 'Walk-in' | 'Khác';

export interface Lead {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  childName?: string;
  childAge?: number;
  source: LeadSource;
  status: LeadStatus;
  assignedTo?: string;
  assignedToName?: string;
  // Support multiple campaigns
  campaignIds?: string[];
  campaignNames?: string[];
  // Legacy single campaign (for backward compatibility)
  campaignId?: string;
  campaignName?: string;
  note?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Chuyển đổi Lead từ format Supabase
 */
const transformFromSupabase = (data: any): Lead => {
  // Parse campaign_ids and campaign_names from JSONB
  let campaignIds: string[] = [];
  if (data.campaign_ids) {
    if (Array.isArray(data.campaign_ids)) {
      campaignIds = data.campaign_ids.filter((id: any) => id != null && String(id).trim() !== '');
    } else if (typeof data.campaign_ids === 'string') {
      try {
        const parsed = JSON.parse(data.campaign_ids);
        if (Array.isArray(parsed)) {
          campaignIds = parsed.filter((id: any) => id != null && String(id).trim() !== '');
        }
      } catch {
        campaignIds = [];
      }
    }
  }

  let campaignNames: string[] = [];
  if (data.campaign_names) {
    if (Array.isArray(data.campaign_names)) {
      campaignNames = data.campaign_names;
    } else if (typeof data.campaign_names === 'string') {
      try {
        const parsed = JSON.parse(data.campaign_names);
        campaignNames = Array.isArray(parsed) ? parsed : [];
      } catch {
        campaignNames = [];
      }
    }
  }

  return {
    id: data.id,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || undefined,
    childName: data.child_name || undefined,
    childAge: data.child_age || undefined,
    source: data.source || 'Facebook',
    status: data.status || 'Mới',
    assignedTo: data.assigned_to || undefined,
    assignedToName: data.assigned_to_name || undefined,
    campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
    campaignNames: campaignNames.length > 0 ? campaignNames : undefined,
    campaignId: data.campaign_id || undefined,
    campaignName: data.campaign_name || undefined,
    note: data.note || undefined,
    lastContactDate: data.last_contact_date || undefined,
    nextFollowUp: data.next_follow_up || undefined,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
  };
};

/**
 * Chuyển đổi Lead sang format Supabase
 */
const transformToSupabase = (lead: Partial<Lead>) => {
  const result: any = {};
  
  // Required fields
  if (lead.name !== undefined) result.name = lead.name;
  if (lead.phone !== undefined) result.phone = lead.phone;
  if (lead.source !== undefined) result.source = lead.source;
  if (lead.status !== undefined) result.status = lead.status;
  
  // Optional fields - set to null if empty/undefined
  result.email = lead.email && lead.email.trim() ? lead.email : null;
  result.child_name = lead.childName && lead.childName.trim() ? lead.childName : null;
  result.child_age = lead.childAge || null;
  result.assigned_to = lead.assignedTo && lead.assignedTo.trim() ? lead.assignedTo : null;
  result.assigned_to_name = lead.assignedToName && lead.assignedToName.trim() ? lead.assignedToName : null;
  result.campaign_id = lead.campaignId && lead.campaignId.trim() ? lead.campaignId : null;
  result.campaign_name = lead.campaignName && lead.campaignName.trim() ? lead.campaignName : null;
  result.note = lead.note && lead.note.trim() ? lead.note : null;
  result.last_contact_date = lead.lastContactDate && lead.lastContactDate.trim() ? lead.lastContactDate : null;
  result.next_follow_up = lead.nextFollowUp && lead.nextFollowUp.trim() ? lead.nextFollowUp : null;
  
  // Arrays - always set as arrays, even if empty
  if (lead.campaignIds !== undefined) {
    result.campaign_ids = Array.isArray(lead.campaignIds) 
      ? lead.campaignIds.filter(id => id && String(id).trim() !== '')
      : [];
  } else {
    result.campaign_ids = [];
  }
  
  if (lead.campaignNames !== undefined) {
    result.campaign_names = Array.isArray(lead.campaignNames)
      ? lead.campaignNames.filter(name => name && String(name).trim() !== '')
      : [];
  } else {
    result.campaign_names = [];
  }
  
  return result;
};

export const createLead = async (data: Omit<Lead, 'id'>): Promise<string> => {
  try {
    // Validate required fields
    if (!data.name || !data.phone) {
      throw new Error('Vui lòng nhập đầy đủ tên và số điện thoại');
    }

    if (!data.source) {
      throw new Error('Vui lòng chọn nguồn khách hàng');
    }

    const leadData = {
      ...transformToSupabase(data),
      status: data.status || 'Mới',
      source: data.source, // Ensure source is set
    };

    // Ensure campaign_ids and campaign_names are arrays, not undefined
    if (!leadData.campaign_ids) {
      leadData.campaign_ids = [];
    }
    if (!leadData.campaign_names) {
      leadData.campaign_names = [];
    }

    console.log('Creating lead with data:', leadData);

    const { data: result, error } = await supabase
      .from(LEADS_COLLECTION)
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating lead:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Không thể tạo khách hàng tiềm năng');
    }

    if (!result) {
      throw new Error('Không nhận được phản hồi từ server');
    }

    return result.id;
  } catch (error) {
    console.error('Error creating lead:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Không thể tạo khách hàng tiềm năng');
  }
};

export const getLeads = async (filters?: {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
}): Promise<Lead[]> => {
  try {
    let query = supabase.from(LEADS_COLLECTION).select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting leads:', error);
      throw error;
    }
    
    let leads = (data || []).map(item => transformFromSupabase(item));
    
    // Client-side filtering for source (if needed)
    if (filters?.source) {
      leads = leads.filter(l => l.source === filters.source);
    }
    
    return leads;
  } catch (error) {
    console.error('Error getting leads:', error);
    throw new Error('Không thể tải danh sách khách hàng');
  }
};

export const updateLead = async (id: string, data: Partial<Lead>): Promise<void> => {
  try {
    const updateData = transformToSupabase(data);
    
    const { error } = await supabase
      .from(LEADS_COLLECTION)
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error updating lead:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating lead:', error);
    throw new Error('Không thể cập nhật khách hàng');
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(LEADS_COLLECTION)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting lead:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw new Error('Không thể xóa khách hàng');
  }
};

export const assignLeads = async (leadIds: string[], assignedTo: string, assignedToName: string): Promise<void> => {
  try {
    const updateData = {
      assigned_to: assignedTo,
      assigned_to_name: assignedToName,
    };
    
    const { error } = await supabase
      .from(LEADS_COLLECTION)
      .update(updateData)
      .in('id', leadIds);
    
    if (error) {
      console.error('Supabase error assigning leads:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error assigning leads:', error);
    throw new Error('Không thể phân công khách hàng');
  }
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<void> => {
  await updateLead(id, { status, lastContactDate: new Date().toISOString() });
};

export const getLeadStats = async (): Promise<Record<LeadStatus, number>> => {
  const leads = await getLeads();
  const stats: Record<LeadStatus, number> = {
    'Mới': 0,
    'Đang liên hệ': 0,
    'Quan tâm': 0,
    'Hẹn test': 0,
    'Đã test': 0,
    'Đăng ký': 0,
    'Từ chối': 0,
  };
  
  leads.forEach(lead => {
    if (stats[lead.status] !== undefined) {
      stats[lead.status]++;
    }
  });
  
  return stats;
};
