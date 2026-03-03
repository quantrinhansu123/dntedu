/**
 * useDepartmentGoals Hook
 * React hook for Department Goals (ERS) CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { DepartmentGoal, DepartmentCode, DEPARTMENT_LABELS } from '../../types';
import * as departmentGoalSupabaseService from '../services/departmentGoalSupabaseService';

interface UseDepartmentGoalsOptions {
    departmentCode?: DepartmentCode;
    month?: number;
    year?: number;
}

export const useDepartmentGoals = (options?: UseDepartmentGoalsOptions) => {
    const [goals, setGoals] = useState<DepartmentGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch goals with filters from Supabase
            let data: DepartmentGoal[];
            if (options?.departmentCode || options?.month || options?.year) {
                data = await departmentGoalSupabaseService.queryDepartmentGoals({
                    departmentCode: options?.departmentCode,
                    month: options?.month,
                    year: options?.year,
                });
            } else {
                data = await departmentGoalSupabaseService.getAllDepartmentGoals();
            }

            // Sort by createdAt descending
            data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

            setGoals(data);
        } catch (err: any) {
            console.error('Error fetching department goals:', err);
            setError(err.message || 'Không thể tải danh sách mục tiêu');
        } finally {
            setLoading(false);
        }
    }, [options?.departmentCode, options?.month, options?.year]);


    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const createGoal = async (data: Omit<DepartmentGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            // Generate UUID for id
            const id = crypto.randomUUID();
            
            const goalData: DepartmentGoal = {
                ...data,
                id,
                departmentName: DEPARTMENT_LABELS[data.departmentCode],
                kpiResult: data.kpiTarget > 0 ? Math.round((data.kpiActual / data.kpiTarget) * 100) : 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await departmentGoalSupabaseService.createDepartmentGoal(goalData);
            await fetchGoals();
            return id;
        } catch (err: any) {
            console.error('Error creating goal:', err);
            throw new Error(err.message || 'Không thể tạo mục tiêu');
        }
    };

    const updateGoal = async (id: string, data: Partial<DepartmentGoal>) => {
        try {
            const updateData: any = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            // Recalculate result if target or actual changed
            if (data.kpiTarget !== undefined || data.kpiActual !== undefined) {
                const goal = goals.find(g => g.id === id);
                if (goal) {
                    const target = data.kpiTarget ?? goal.kpiTarget;
                    const actual = data.kpiActual ?? goal.kpiActual;
                    updateData.kpiResult = target > 0 ? Math.round((actual / target) * 100) : 0;
                }
            }

            // Update department name if code changed
            if (data.departmentCode) {
                updateData.departmentName = DEPARTMENT_LABELS[data.departmentCode];
            }

            await departmentGoalSupabaseService.updateDepartmentGoal(id, updateData);
            await fetchGoals();
        } catch (err: any) {
            console.error('Error updating goal:', err);
            throw new Error(err.message || 'Không thể cập nhật mục tiêu');
        }
    };

    const deleteGoal = async (id: string) => {
        try {
            await departmentGoalSupabaseService.deleteDepartmentGoal(id);
            await fetchGoals();
        } catch (err: any) {
            console.error('Error deleting goal:', err);
            throw new Error(err.message || 'Không thể xóa mục tiêu');
        }
    };

    // Calculate overall result for a department (weighted average)
    const getDepartmentResult = useCallback((departmentCode: DepartmentCode) => {
        const deptGoals = goals.filter(g => g.departmentCode === departmentCode && g.status === 'active');
        if (deptGoals.length === 0) return 0;

        const totalWeight = deptGoals.reduce((sum, g) => sum + g.kpiWeight, 0);
        if (totalWeight === 0) return 0;

        const weightedSum = deptGoals.reduce((sum, g) => sum + (g.kpiResult * g.kpiWeight), 0);
        return Math.round(weightedSum / totalWeight * 10) / 10;
    }, [goals]);

    // Get goals grouped by department
    const getGoalsByDepartment = useCallback(() => {
        const grouped: Record<DepartmentCode, DepartmentGoal[]> = {
            sales: [],
            training: [],
            marketing: [],
            accounting: [],
            hr: []
        };

        goals.forEach(goal => {
            if (grouped[goal.departmentCode]) {
                grouped[goal.departmentCode].push(goal);
            }
        });

        return grouped;
    }, [goals]);

    return {
        goals,
        loading,
        error,
        refetch: fetchGoals,
        createGoal,
        updateGoal,
        deleteGoal,
        getDepartmentResult,
        getGoalsByDepartment
    };
};
