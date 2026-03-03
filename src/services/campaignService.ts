/**
 * Campaign Service
 * Handle marketing campaigns CRUD
 */

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

export const createCampaign = async (data: Omit<Campaign, 'id'>): Promise<string> => {
  try {
    const campaignData = {
      ...data,
      targetCount: data.targetCount || 0,
      registeredCount: data.registeredCount || 0,
      conversionRate: 0,
      status: data.status || 'Đang mở',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // TODO: Implement Supabase insert
    // const { data: result, error } = await supabase
    //   .from(CAMPAIGNS_COLLECTION)
    //   .insert(campaignData)
    //   .select()
    //   .single();
    // if (error) throw error;
    // return result.id;
    throw new Error('Not implemented');
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Không thể tạo chiến dịch');
  }
};

export const getCampaigns = async (includeEnded: boolean = false): Promise<Campaign[]> => {
  try {
    // TODO: Implement Supabase query
    // let query = supabase.from(CAMPAIGNS_COLLECTION).select('*');
    // if (!includeEnded) {
    //   query = query.neq('status', 'Kết thúc');
    // }
    // const { data, error } = await query.order('created_at', { ascending: false });
    // if (error) throw error;
    // return (data || []).map(item => {
    //   const conversionRate = item.targetCount > 0 
    //     ? (item.registeredCount / item.targetCount) * 100 
    //     : 0;
    //   return {
    //     id: item.id,
    //     ...item,
    //     conversionRate,
    //   } as Campaign;
    // });
    return [];
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return [];
  }
};

export const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<void> => {
  try {
    // Recalculate conversion rate if counts changed
    let updateData = { ...data };
    if (data.registeredCount !== undefined || data.targetCount !== undefined) {
      const registered = data.registeredCount ?? 0;
      const target = data.targetCount ?? 1;
      updateData.conversionRate = target > 0 ? (registered / target) * 100 : 0;
    }
    
    // TODO: Implement Supabase update
    // const { error } = await supabase
    //   .from(CAMPAIGNS_COLLECTION)
    //   .update({
    //     ...updateData,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq('id', id);
    // if (error) throw error;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw new Error('Không thể cập nhật chiến dịch');
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    // TODO: Implement Supabase delete
    // const { error } = await supabase
    //   .from(CAMPAIGNS_COLLECTION)
    //   .delete()
    //   .eq('id', id);
    // if (error) throw error;
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
