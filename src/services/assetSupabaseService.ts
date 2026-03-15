/**
 * Asset Supabase Service
 * Service để quản lý dữ liệu tài sản với Supabase
 */

import { supabase } from '../config/supabase';
import { Asset } from '../../types';

/**
 * Chuyển đổi Asset từ format app sang format Supabase
 */
const transformAssetForSupabase = (asset: Asset | Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'monthlyDepreciation' | 'residualValue' | 'status'>) => {
  const result: any = {};
  
  // Chỉ thêm id nếu có và không phải empty string
  if ('id' in asset && asset.id && asset.id.trim() !== '') {
    result.id = asset.id;
  }

  return {
    ...result,
    code: ('code' in asset ? asset.code : null) || null,
    name: asset.name,
    category: asset.category,
    purchase_date: asset.purchaseDate,
    cost: asset.cost,
    useful_life: asset.usefulLife,
    monthly_depreciation: 'monthlyDepreciation' in asset ? asset.monthlyDepreciation : Math.round(asset.cost / asset.usefulLife),
    residual_value: 'residualValue' in asset ? asset.residualValue : asset.cost,
    status: 'status' in asset ? asset.status : 'Đang khấu hao',
    start_date: ('startDate' in asset && (asset as any).startDate) ? (asset as any).startDate : asset.purchaseDate,
    created_at: ('createdAt' in asset && asset.createdAt) ? asset.createdAt : new Date().toISOString(),
    updated_at: ('updatedAt' in asset && asset.updatedAt) ? asset.updatedAt : new Date().toISOString(),
  };
};

/**
 * Chuyển đổi dữ liệu từ Supabase sang Asset
 */
const transformAssetFromSupabase = (data: any): Asset => {
  return {
    id: data.id,
    code: data.code || '',
    name: data.name,
    category: data.category,
    purchaseDate: data.purchase_date,
    cost: parseFloat(data.cost) || 0,
    usefulLife: parseInt(data.useful_life) || 0,
    monthlyDepreciation: parseFloat(data.monthly_depreciation) || 0,
    residualValue: parseFloat(data.residual_value) || 0,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Lấy tất cả tài sản từ Supabase
 */
export const getAllAssets = async (): Promise<Asset[]> => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(transformAssetFromSupabase);
  } catch (error) {
    console.error('Error fetching assets from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy tài sản theo ID
 */
export const getAssetById = async (id: string): Promise<Asset | null> => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    
    return data ? transformAssetFromSupabase(data) : null;
  } catch (error) {
    console.error('Error fetching asset by ID from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo tài sản mới trong Supabase
 */
export const createAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'monthlyDepreciation' | 'residualValue' | 'status'>): Promise<Asset> => {
  try {
    const monthlyDepreciation = Math.round(asset.cost / asset.usefulLife);
    const now = new Date().toISOString();
    const id = generateUUID();
    
    const assetToInsert: Asset = {
      id,
      code: '',
      ...asset,
      monthlyDepreciation,
      residualValue: asset.cost,
      status: 'Đang khấu hao',
      createdAt: now,
      updatedAt: now,
    };
    
    const transformed = transformAssetForSupabase(assetToInsert);
    
    const { data, error } = await supabase
      .from('assets')
      .insert(transformed)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    return transformAssetFromSupabase(data);
  } catch (error) {
    console.error('Error creating asset in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật tài sản trong Supabase
 */
export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
  try {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate;
    if (updates.cost !== undefined) updateData.cost = updates.cost;
    if (updates.usefulLife !== undefined) updateData.useful_life = updates.usefulLife;
    if (updates.monthlyDepreciation !== undefined) updateData.monthly_depreciation = updates.monthlyDepreciation;
    if (updates.residualValue !== undefined) updateData.residual_value = updates.residualValue;
    if (updates.status !== undefined) updateData.status = updates.status;
    if ((updates as any).startDate !== undefined) updateData.start_date = (updates as any).startDate;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformAssetFromSupabase(data);
  } catch (error) {
    console.error('Error updating asset in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa tài sản
 */
export const deleteAsset = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting asset from Supabase:', error);
    throw error;
  }
};
