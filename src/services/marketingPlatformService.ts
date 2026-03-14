/**
 * Marketing Platform Service
 * CRUD operations cho Marketing Platforms và Stats với Supabase
 */

import { supabase } from '../config/supabase';
import { MarketingPlatform, PlatformMonthlyStats } from '../types/marketingTypes';

const PLATFORMS_COLLECTION = 'marketing_platforms';
const STATS_COLLECTION = 'platform_monthly_stats';

// Default platforms
export const DEFAULT_PLATFORMS = [
    { name: 'Facebook', icon: '📘', color: '#1877F2' },
    { name: 'Zalo', icon: '💬', color: '#0068FF' },
    { name: 'TikTok', icon: '🎵', color: '#000000' },
    { name: 'Instagram', icon: '📷', color: '#E4405F' },
    { name: 'YouTube', icon: '▶️', color: '#FF0000' },
    { name: 'Google Ads', icon: '🔍', color: '#4285F4' },
    { name: 'Website', icon: '🌐', color: '#6366F1' },
];

// ==================== PLATFORMS ====================

/**
 * Chuyển đổi MarketingPlatform từ format Supabase
 */
const transformPlatformFromSupabase = (data: any): MarketingPlatform => {
    return {
        id: data.id,
        name: data.name || '',
        icon: data.icon || undefined,
        color: data.color || undefined,
        isActive: data.is_active !== undefined ? data.is_active : true,
        createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
        updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
    };
};

/**
 * Chuyển đổi MarketingPlatform sang format Supabase
 */
const transformPlatformToSupabase = (platform: Partial<MarketingPlatform>) => {
    const result: any = {};
    if (platform.name !== undefined) result.name = platform.name;
    if (platform.icon !== undefined) result.icon = platform.icon || null;
    if (platform.color !== undefined) result.color = platform.color || null;
    if (platform.isActive !== undefined) result.is_active = platform.isActive;
    return result;
};

// Get all platforms
export const getPlatforms = async (): Promise<MarketingPlatform[]> => {
    try {
        const { data, error } = await supabase
            .from(PLATFORMS_COLLECTION)
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Supabase error getting platforms:', error);
            throw error;
        }
        
        return (data || []).map(item => transformPlatformFromSupabase(item));
    } catch (error) {
        console.error('Error getting platforms:', error);
        throw error;
    }
};

// Create platform
export const createPlatform = async (data: Omit<MarketingPlatform, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const platformData = {
            ...transformPlatformToSupabase(data),
            is_active: data.isActive !== undefined ? data.isActive : true,
        };

        const { data: result, error } = await supabase
            .from(PLATFORMS_COLLECTION)
            .insert(platformData)
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating platform:', error);
            throw error;
        }

        if (!result) {
            throw new Error('Không nhận được phản hồi từ server');
        }

        return result.id;
    } catch (error) {
        console.error('Error creating platform:', error);
        throw error;
    }
};

// Update platform
export const updatePlatform = async (id: string, data: Partial<MarketingPlatform>): Promise<void> => {
    try {
        const updateData = transformPlatformToSupabase(data);
        
        const { error } = await supabase
            .from(PLATFORMS_COLLECTION)
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Supabase error updating platform:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error updating platform:', error);
        throw error;
    }
};

// Delete platform
export const deletePlatform = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from(PLATFORMS_COLLECTION)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting platform:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error deleting platform:', error);
        throw error;
    }
};

// Initialize default platforms
export const initializeDefaultPlatforms = async (): Promise<void> => {
    try {
        const existing = await getPlatforms();
        if (existing.length > 0) return; // Already initialized

        for (const platform of DEFAULT_PLATFORMS) {
            await createPlatform({
                ...platform,
                isActive: true,
            });
        }
        console.log('Default platforms initialized');
    } catch (error) {
        console.error('Error initializing platforms:', error);
    }
};

// ==================== MONTHLY STATS ====================

/**
 * Chuyển đổi PlatformMonthlyStats từ format Supabase
 */
const transformStatsFromSupabase = (data: any): PlatformMonthlyStats => {
    return {
        id: data.id,
        platformId: data.platform_id || '',
        platformName: data.platform_name || '',
        month: data.month || '',
        newFollowers: data.new_followers || 0,
        interactions: data.interactions || 0,
        newMessages: data.new_messages || 0,
        reach: data.reach || undefined,
        clicks: data.clicks || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
        updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
    };
};

/**
 * Chuyển đổi PlatformMonthlyStats sang format Supabase
 */
const transformStatsToSupabase = (stats: Partial<PlatformMonthlyStats>) => {
    const result: any = {};
    if (stats.platformId !== undefined) result.platform_id = stats.platformId;
    if (stats.platformName !== undefined) result.platform_name = stats.platformName;
    if (stats.month !== undefined) result.month = stats.month;
    if (stats.newFollowers !== undefined) result.new_followers = stats.newFollowers;
    if (stats.interactions !== undefined) result.interactions = stats.interactions;
    if (stats.newMessages !== undefined) result.new_messages = stats.newMessages;
    if (stats.reach !== undefined) result.reach = stats.reach || null;
    if (stats.clicks !== undefined) result.clicks = stats.clicks || null;
    if (stats.notes !== undefined) result.notes = stats.notes || null;
    return result;
};

// Get stats by month
export const getStatsByMonth = async (month: string): Promise<PlatformMonthlyStats[]> => {
    try {
        const { data, error } = await supabase
            .from(STATS_COLLECTION)
            .select('*')
            .eq('month', month)
            .order('platform_name', { ascending: true });
        
        if (error) {
            console.error('Supabase error getting stats:', error);
            throw error;
        }
        
        return (data || []).map(item => transformStatsFromSupabase(item));
    } catch (error) {
        console.error('Error getting stats:', error);
        return [];
    }
};

// Get or create stats for platform/month
export const getOrCreateStats = async (
    platformId: string,
    platformName: string,
    month: string
): Promise<PlatformMonthlyStats> => {
    try {
        // Try to get existing stats
        const { data: existing, error: fetchError } = await supabase
            .from(STATS_COLLECTION)
            .select('*')
            .eq('platform_id', platformId)
            .eq('month', month)
            .single();

        if (existing && !fetchError) {
            return transformStatsFromSupabase(existing);
        }

        // Create new stats if not exists
        const statsData = {
            platform_id: platformId,
            platform_name: platformName,
            month: month,
            new_followers: 0,
            interactions: 0,
            new_messages: 0,
        };

        const { data: result, error: insertError } = await supabase
            .from(STATS_COLLECTION)
            .insert(statsData)
            .select()
            .single();

        if (insertError) {
            // If unique constraint violation, try to fetch again
            if (insertError.code === '23505') {
                const { data: retry } = await supabase
                    .from(STATS_COLLECTION)
                    .select('*')
                    .eq('platform_id', platformId)
                    .eq('month', month)
                    .single();
                if (retry) {
                    return transformStatsFromSupabase(retry);
                }
            }
            console.error('Supabase error creating stats:', insertError);
            throw insertError;
        }

        if (!result) {
            throw new Error('Không nhận được phản hồi từ server');
        }

        return transformStatsFromSupabase(result);
    } catch (error) {
        console.error('Error getting/creating stats:', error);
        throw error;
    }
};

// Update stats
export const updateStats = async (id: string, data: Partial<PlatformMonthlyStats>): Promise<void> => {
    try {
        const updateData = transformStatsToSupabase(data);
        
        const { error } = await supabase
            .from(STATS_COLLECTION)
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Supabase error updating stats:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
        throw error;
    }
};

// Create stats
export const createStats = async (data: Omit<PlatformMonthlyStats, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const statsData = transformStatsToSupabase(data);

        const { data: result, error } = await supabase
            .from(STATS_COLLECTION)
            .insert(statsData)
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating stats:', error);
            throw error;
        }

        if (!result) {
            throw new Error('Không nhận được phản hồi từ server');
        }

        return result.id;
    } catch (error) {
        console.error('Error creating stats:', error);
        throw error;
    }
};
