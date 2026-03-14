/**
 * Campaign Service
 * Handle marketing campaigns CRUD với Supabase
 */

import { supabase } from '../config/supabase';

const CAMPAIGNS_COLLECTION = 'campaigns';

export type CampaignStatus = 'Đang mở' | 'Tạm dừng' | 'Kết thúc';

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  targetCount: number;
  registeredCount: number;
  conversionRate?: number;
  scriptUrl?: string;
  assignedTo?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Chuyển đổi Campaign từ format Supabase
 */
const transformFromSupabase = (data: any): Campaign => {
  // Parse assigned_to from JSONB
  let assignedTo: string[] = [];
  if (data.assigned_to) {
    if (Array.isArray(data.assigned_to)) {
      assignedTo = data.assigned_to
        .filter((id: any) => id != null && String(id).trim() !== '')
        .map((id: any) => String(id).trim());
    } else if (typeof data.assigned_to === 'string') {
      try {
        const parsed = JSON.parse(data.assigned_to);
        if (Array.isArray(parsed)) {
          assignedTo = parsed
            .filter((id: any) => id != null && String(id).trim() !== '')
            .map((id: any) => String(id).trim());
        }
      } catch {
        assignedTo = [];
      }
    }
  }

  // Calculate conversion rate if not provided
  const targetCount = data.target_count || 0;
  const registeredCount = data.registered_count || 0;
  const conversionRate = targetCount > 0 
    ? (registeredCount / targetCount) * 100 
    : (data.conversion_rate || 0);

  return {
    id: data.id,
    name: data.name || '',
    description: data.description || undefined,
    startDate: data.start_date || new Date().toISOString().split('T')[0],
    endDate: data.end_date || new Date().toISOString().split('T')[0],
    status: data.status || 'Đang mở',
    targetCount: targetCount,
    registeredCount: registeredCount,
    conversionRate: conversionRate,
    scriptUrl: data.script_url || undefined,
    assignedTo: assignedTo,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
  };
};

/**
 * Chuyển đổi Campaign sang format Supabase
 */
const transformToSupabase = (campaign: Partial<Campaign>) => {
  const result: any = {};
  if (campaign.name !== undefined) result.name = campaign.name;
  if (campaign.description !== undefined) result.description = campaign.description || null;
  if (campaign.startDate !== undefined) result.start_date = campaign.startDate;
  if (campaign.endDate !== undefined) result.end_date = campaign.endDate;
  if (campaign.status !== undefined) result.status = campaign.status;
  if (campaign.targetCount !== undefined) result.target_count = campaign.targetCount;
  if (campaign.registeredCount !== undefined) result.registered_count = campaign.registeredCount;
  if (campaign.conversionRate !== undefined) result.conversion_rate = campaign.conversionRate;
  if (campaign.scriptUrl !== undefined) result.script_url = campaign.scriptUrl || null;
  if (campaign.assignedTo !== undefined) {
    result.assigned_to = campaign.assignedTo.filter(id => id && id.trim() !== '').map(id => String(id));
  }
  return result;
};

export const createCampaign = async (data: Omit<Campaign, 'id'>): Promise<string> => {
  try {
    const campaignData = {
      ...transformToSupabase(data),
      target_count: data.targetCount || 0,
      registered_count: data.registeredCount || 0,
      conversion_rate: 0, // Will be calculated automatically
      status: data.status || 'Đang mở',
    };

    const { data: result, error } = await supabase
      .from(CAMPAIGNS_COLLECTION)
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating campaign:', error);
      throw error;
    }

    return result.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Không thể tạo chiến dịch');
  }
};

export const getCampaigns = async (includeEnded: boolean = false): Promise<Campaign[]> => {
  try {
    let query = supabase.from(CAMPAIGNS_COLLECTION).select('*');
    
    if (!includeEnded) {
      query = query.neq('status', 'Kết thúc');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting campaigns:', error);
      throw error;
    }
    
    return (data || []).map(item => transformFromSupabase(item));
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return [];
  }
};

export const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<void> => {
  try {
    // Recalculate conversion rate if counts changed
    let updateData = { ...transformToSupabase(data) };
    if (data.registeredCount !== undefined || data.targetCount !== undefined) {
      const registered = data.registeredCount ?? 0;
      const target = data.targetCount ?? 1;
      updateData.conversion_rate = target > 0 ? (registered / target) * 100 : 0;
    }
    
    const { error } = await supabase
      .from(CAMPAIGNS_COLLECTION)
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error updating campaign:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw new Error('Không thể cập nhật chiến dịch');
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(CAMPAIGNS_COLLECTION)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting campaign:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw new Error('Không thể xóa chiến dịch');
  }
};

export const incrementRegistered = async (id: string): Promise<void> => {
  const campaigns = await getCampaigns(true);
  const campaign = campaigns.find(c => c.id === id);
  if (campaign) {
    await updateCampaign(id, { 
      registeredCount: (campaign.registeredCount || 0) + 1,
      targetCount: campaign.targetCount,
    });
  }
};
