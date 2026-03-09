/**
 * useCenters Hook
 * React hook for Centers CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import * as centerService from '../services/centerService';
import type { Center } from '../services/centerService';

export const useCenters = () => {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCenters = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await centerService.getAllCenters();
            setCenters(data);
        } catch (err: any) {
            console.error('Error fetching centers:', err);
            setError(err.message || 'Không thể tải danh sách cơ sở');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCenters();
    }, [fetchCenters]);

    const createCenter = async (data: Omit<Center, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = await centerService.createCenter(data);
        await fetchCenters();
        return id;
    };

    const updateCenter = async (id: string, data: Partial<Center>) => {
        await centerService.updateCenter(id, data);
        await fetchCenters();
    };

    const deleteCenter = async (id: string) => {
        await centerService.deleteCenter(id);
        await fetchCenters();
    };

    return {
        centers,
        loading,
        error,
        refetch: fetchCenters,
        createCenter,
        updateCenter,
        deleteCenter,
    };
};
