/**
 * Marketing KPI Service
 * CRUD operations cho Marketing KPIs với Supabase
 */

import { supabase } from '../config/supabase';
import { MarketingKpi } from '../types/marketingTypes';

/**
 * Chuyển đổi MarketingKpi từ format Supabase
 */
const transformFromSupabase = (data: any): MarketingKpi => {
  return {
    id: data.id,
    staffId: data.staff_id || '',
    staffName: data.staff_name || '',
    month: data.month || '',
    targetName: data.target_name || '',
    targetValue: data.target_value || 0,
    actualValue: data.actual_value || 0,
    weight: data.weight || 0,
    unit: data.unit || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
  };
};

/**
 * Chuyển đổi MarketingKpi sang format Supabase
 */
const transformToSupabase = (kpi: Partial<MarketingKpi>) => {
  const result: any = {};
  if (kpi.staffId !== undefined) result.staff_id = kpi.staffId;
  if (kpi.staffName !== undefined) result.staff_name = kpi.staffName;
  if (kpi.month !== undefined) result.month = kpi.month;
  if (kpi.targetName !== undefined) result.target_name = kpi.targetName;
  if (kpi.targetValue !== undefined) result.target_value = kpi.targetValue;
  if (kpi.actualValue !== undefined) result.actual_value = kpi.actualValue;
  if (kpi.weight !== undefined) result.weight = kpi.weight;
  if (kpi.unit !== undefined) result.unit = kpi.unit || null;
  if (kpi.notes !== undefined) result.notes = kpi.notes || null;
  return result;
};

// Get all KPIs
export const getKpis = async (filters?: {
    staffId?: string;
    month?: string;
}): Promise<MarketingKpi[]> => {
    try {
        let query = supabase
            .from('marketing_kpis')
            .select('*')
            .order('month', { ascending: false })
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) throw error;
        
        let kpis = (data || []).map(transformFromSupabase);

        // Client-side filtering
        if (filters?.staffId) {
            kpis = kpis.filter(k => k.staffId === filters.staffId);
        }
        if (filters?.month) {
            kpis = kpis.filter(k => k.month === filters.month);
        }

        return kpis;
    } catch (error) {
        console.error('Error getting KPIs:', error);
        throw error;
    }
};

// Get single KPI
export const getKpi = async (id: string): Promise<MarketingKpi | null> => {
    try {
        const { data, error } = await supabase
            .from('marketing_kpis')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        if (!data) return null;
        
        return transformFromSupabase(data);
    } catch (error) {
        console.error('Error getting KPI:', error);
        throw error;
    }
};

// Create KPI
export const createKpi = async (data: Omit<MarketingKpi, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        const transformed = transformToSupabase({
            ...data,
            createdAt: now,
            updatedAt: now,
        });
        
        const { data: result, error } = await supabase
            .from('marketing_kpis')
            .insert(transformed)
            .select()
            .single();
        
        if (error) throw error;
        if (!result) throw new Error('Failed to create KPI');
        
        return result.id;
    } catch (error) {
        console.error('Error creating KPI:', error);
        throw error;
    }
};

// Update KPI
export const updateKpi = async (id: string, data: Partial<MarketingKpi>): Promise<void> => {
    try {
        const transformed = transformToSupabase({
            ...data,
            updatedAt: new Date().toISOString(),
        });
        
        const { error } = await supabase
            .from('marketing_kpis')
            .update(transformed)
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error updating KPI:', error);
        throw error;
    }
};

// Delete KPI
export const deleteKpi = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('marketing_kpis')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting KPI:', error);
        throw error;
    }
};

// Calculate single KPI completion percentage
export const calculateKpiPercent = (kpi: MarketingKpi): number => {
    if (kpi.targetValue === 0) return 0;
    const rawPercent = (kpi.actualValue / kpi.targetValue) * 100;
    return Math.min(100, Math.round(rawPercent)); // Cap at 100%
};

// Calculate weighted KPI completion for a staff member
export const calculateStaffKpiCompletion = (kpis: MarketingKpi[], staffId: string): number => {
    const staffKpis = kpis.filter(k => k.staffId === staffId);
    if (staffKpis.length === 0) return 0;

    let totalWeightedPercent = 0;
    let totalWeight = 0;

    staffKpis.forEach(kpi => {
        const kpiPercent = calculateKpiPercent(kpi);
        const weightedPercent = (kpiPercent * kpi.weight) / 100;
        totalWeightedPercent += weightedPercent;
        totalWeight += kpi.weight;
    });

    // Normalize if weights don't add up to 100
    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedPercent / totalWeight) * 100);
};

// Calculate overall staff performance
export const calculateOverallPerformance = (
    taskPercent: number,
    kpiPercent: number
): number => {
    return Math.round((taskPercent + kpiPercent) / 2);
};
