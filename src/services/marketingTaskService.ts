/**
 * Marketing Task Service
 * CRUD operations cho Marketing Tasks với Supabase
 */

import { supabase } from '../config/supabase';
import { MarketingTask } from '../types/marketingTypes';

/**
 * Chuyển đổi MarketingTask từ format Supabase
 */
const transformFromSupabase = (data: any): MarketingTask => {
  // Parse assigned_to from JSONB - handle both array and string formats
  let assignedTo: string[] = [];
  if (data.assigned_to) {
    if (Array.isArray(data.assigned_to)) {
      // Filter out invalid values and ensure all are strings
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
  
  // Parse assigned_to_names similarly
  let assignedToNames: string[] = [];
  if (data.assigned_to_names) {
    if (Array.isArray(data.assigned_to_names)) {
      assignedToNames = data.assigned_to_names;
    } else if (typeof data.assigned_to_names === 'string') {
      try {
        const parsed = JSON.parse(data.assigned_to_names);
        assignedToNames = Array.isArray(parsed) ? parsed : [];
      } catch {
        assignedToNames = [];
      }
    }
  }
  
  return {
    id: data.id,
    title: data.title || '',
    description: data.description || '',
    assignedTo: assignedTo,
    assignedToNames: assignedToNames,
    campaignId: data.campaign_id || undefined,
    campaignName: data.campaign_name || undefined,
    status: data.status || 'Chưa bắt đầu',
    priority: data.priority || 'Trung bình',
    dueDate: data.due_date || new Date().toISOString().split('T')[0],
    completedDate: data.completed_date || undefined,
    result: data.result || undefined,
    completionPercent: data.completion_percent || 0,
    notes: data.notes || undefined,
    createdBy: data.created_by || undefined,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
  };
};

/**
 * Chuyển đổi MarketingTask sang format Supabase
 */
const transformToSupabase = (task: Partial<MarketingTask>) => {
  const result: any = {};
  if (task.title !== undefined) result.title = task.title;
  if (task.description !== undefined) result.description = task.description || '';
  if (task.assignedTo !== undefined) {
    // Filter out empty strings and ensure all values are valid strings
    result.assigned_to = task.assignedTo.filter(id => id && id.trim() !== '').map(id => String(id));
  }
  if (task.assignedToNames !== undefined) {
    // Filter out empty strings
    result.assigned_to_names = task.assignedToNames.filter(name => name && name.trim() !== '');
  }
  if (task.campaignId !== undefined) result.campaign_id = task.campaignId || null;
  if (task.campaignName !== undefined) result.campaign_name = task.campaignName || null;
  if (task.status !== undefined) result.status = task.status;
  if (task.priority !== undefined) result.priority = task.priority;
  if (task.dueDate !== undefined) result.due_date = task.dueDate;
  if (task.completedDate !== undefined) result.completed_date = task.completedDate || null;
  if (task.result !== undefined) result.result = task.result || null;
  if (task.completionPercent !== undefined) result.completion_percent = task.completionPercent;
  if (task.notes !== undefined) result.notes = task.notes || null;
  if (task.createdBy !== undefined) result.created_by = task.createdBy || null;
  return result;
};

// Get all tasks
export const getTasks = async (filters?: {
    status?: string;
    assignedTo?: string;
    campaignId?: string;
}): Promise<MarketingTask[]> => {
    try {
        let query = supabase
            .from('marketing_tasks')
            .select('*')
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) throw error;
        
        let tasks = (data || []).map(transformFromSupabase);

        // Client-side filtering to avoid composite index requirements
        if (filters?.status) {
            tasks = tasks.filter(t => t.status === filters.status);
        }
        if (filters?.assignedTo) {
            tasks = tasks.filter(t => t.assignedTo.includes(filters.assignedTo!));
        }
        if (filters?.campaignId) {
            tasks = tasks.filter(t => t.campaignId === filters.campaignId);
        }

        return tasks;
    } catch (error) {
        console.error('Error getting tasks:', error);
        throw error;
    }
};

// Get single task
export const getTask = async (id: string): Promise<MarketingTask | null> => {
    try {
        const { data, error } = await supabase
            .from('marketing_tasks')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        if (!data) return null;
        
        return transformFromSupabase(data);
    } catch (error) {
        console.error('Error getting task:', error);
        throw error;
    }
};

// Create task
export const createTask = async (data: Omit<MarketingTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        
        // Validate assignedTo - ensure all are valid non-empty strings
        const validAssignedTo = (data.assignedTo || []).filter(id => id && typeof id === 'string' && id.trim() !== '');
        const validAssignedToNames = (data.assignedToNames || []).filter(name => name && typeof name === 'string' && name.trim() !== '');
        
        const transformed = transformToSupabase({
            ...data,
            assignedTo: validAssignedTo,
            assignedToNames: validAssignedToNames,
            createdAt: now,
            updatedAt: now,
        });
        
        const { data: result, error } = await supabase
            .from('marketing_tasks')
            .insert(transformed)
            .select()
            .single();
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        if (!result) throw new Error('Failed to create task');
        
        return result.id;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};

// Update task
export const updateTask = async (id: string, data: Partial<MarketingTask>): Promise<void> => {
    try {
        // Validate assignedTo if provided
        let validatedData = { ...data };
        if (data.assignedTo !== undefined) {
            validatedData.assignedTo = (data.assignedTo || []).filter(id => id && typeof id === 'string' && id.trim() !== '');
        }
        if (data.assignedToNames !== undefined) {
            validatedData.assignedToNames = (data.assignedToNames || []).filter(name => name && typeof name === 'string' && name.trim() !== '');
        }
        
        const transformed = transformToSupabase({
            ...validatedData,
            updatedAt: new Date().toISOString(),
        });
        
        const { error } = await supabase
            .from('marketing_tasks')
            .update(transformed)
            .eq('id', id);
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

// Delete task
export const deleteTask = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('marketing_tasks')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

// Calculate staff task completion
export const calculateStaffTaskCompletion = (tasks: MarketingTask[], staffId: string): number => {
    const staffTasks = tasks.filter(t => t.assignedTo.includes(staffId));
    if (staffTasks.length === 0) return 0;

    const totalCompletion = staffTasks.reduce((sum, t) => sum + (t.completionPercent || 0), 0);
    return Math.round(totalCompletion / staffTasks.length);
};
