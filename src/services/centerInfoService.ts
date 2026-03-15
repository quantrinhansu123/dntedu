/**
 * Center Info Service
 * Quản lý thông tin trung tâm cho các biểu mẫu (hợp đồng, hóa đơn, v.v.)
 */

import { supabase } from '../config/supabase';

export interface CenterInfo {
  id: string;
  name: string;
  code?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  representativeName?: string;
  representativePosition?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Lấy thông tin trung tâm
 */
export const getCenterInfo = async (): Promise<CenterInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('center_info')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return null
        return null;
      }
      console.error('Error fetching center info:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name || 'DNT EDU',
      code: data.code,
      logoUrl: data.logo_url,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      representativeName: data.representative_name,
      representativePosition: data.representative_position,
      taxCode: data.tax_code,
      bankAccount: data.bank_account,
      bankName: data.bank_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in getCenterInfo:', error);
    return null;
  }
};

/**
 * Lưu hoặc cập nhật thông tin trung tâm
 */
export const saveCenterInfo = async (info: Partial<CenterInfo>, userId?: string): Promise<CenterInfo> => {
  try {
    // Check if record exists
    const existing = await getCenterInfo();

    const dataToSave = {
      name: info.name || 'DNT EDU',
      code: info.code,
      logo_url: info.logoUrl,
      address: info.address,
      phone: info.phone,
      email: info.email,
      website: info.website,
      representative_name: info.representativeName,
      representative_position: info.representativePosition,
      tax_code: info.taxCode,
      bank_account: info.bankAccount,
      bank_name: info.bankName,
      updated_by: userId,
    };

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('center_info')
        .update(dataToSave)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating center info:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name || 'DNT EDU',
        code: data.code,
        logoUrl: data.logo_url,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        representativeName: data.representative_name,
        representativePosition: data.representative_position,
        taxCode: data.tax_code,
        bankAccount: data.bank_account,
        bankName: data.bank_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('center_info')
        .insert({
          ...dataToSave,
          created_by: userId || 'system',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating center info:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name || 'DNT EDU',
        code: data.code,
        logoUrl: data.logo_url,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        representativeName: data.representative_name,
        representativePosition: data.representative_position,
        taxCode: data.tax_code,
        bankAccount: data.bank_account,
        bankName: data.bank_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (error) {
    console.error('Error in saveCenterInfo:', error);
    throw error;
  }
};
