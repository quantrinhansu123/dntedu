/**
 * Financial Transaction Supabase Service
 * Service để quản lý dữ liệu giao dịch tài chính với Supabase
 */

import { supabase } from '../config/supabase';
import { FinancialTransaction } from './financialReportService';

/**
 * Chuyển đổi FinancialTransaction từ format app sang format Supabase
 */
const transformTransactionForSupabase = (transaction: FinancialTransaction) => {
  const result: any = {};
  
  // Chỉ thêm id nếu có và không phải empty string
  if (transaction.id && transaction.id.trim() !== '') {
    result.id = transaction.id;
  }

  return {
    ...result,
    date: transaction.date,
    month: transaction.month,
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description || null,
    student_id: transaction.studentId || null,
    student_name: transaction.studentName || null,
    contract_id: transaction.contractId || null,
    invoice_id: transaction.invoiceId || null,
    created_at: transaction.createdAt || new Date().toISOString(),
    created_by: transaction.createdBy || null,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Chuyển đổi dữ liệu từ Supabase sang FinancialTransaction
 */
const transformTransactionFromSupabase = (data: any): FinancialTransaction => {
  return {
    id: data.id,
    date: data.date,
    month: data.month,
    type: data.type as 'income' | 'expense',
    category: data.category as 'Học phí' | 'Sách vở' | 'Đồng phục' | 'Khác',
    amount: parseFloat(data.amount) || 0,
    description: data.description,
    studentId: data.student_id,
    studentName: data.student_name,
    contractId: data.contract_id,
    invoiceId: data.invoice_id,
    createdAt: data.created_at,
    createdBy: data.created_by,
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
 * Lấy tất cả giao dịch từ Supabase
 */
export const getAllTransactions = async (month?: string): Promise<FinancialTransaction[]> => {
  try {
    // Sử dụng view thay vì bảng để có computed fields
    let query = supabase
      .from('financial_transactions_view')
      .select('*')
      .order('date', { ascending: false });
    
    if (month) {
      query = query.eq('month', month);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // Nếu view chưa tồn tại, fallback về bảng
      console.warn('financial_transactions_view not found, falling back to financial_transactions table:', error);
      let fallbackQuery = supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (month) {
        fallbackQuery = fallbackQuery.eq('month', month);
      }
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) throw fallbackError;
      return fallbackData.map(transformTransactionFromSupabase);
    }
    
    return data.map(transformTransactionFromSupabase);
  } catch (error) {
    console.error('Error fetching transactions from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy giao dịch theo ID
 */
export const getTransactionById = async (id: string): Promise<FinancialTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformTransactionFromSupabase(data);
  } catch (error) {
    console.error('Error fetching transaction from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo giao dịch mới trong Supabase
 */
export const createTransaction = async (transaction: Omit<FinancialTransaction, 'id'>): Promise<FinancialTransaction> => {
  try {
    const transformed = transformTransactionForSupabase(transaction as FinancialTransaction);
    
    // Generate UUID nếu không có id
    if (!transformed.id || transformed.id.trim() === '') {
      transformed.id = generateUUID();
    }
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transformed)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    return transformTransactionFromSupabase(data);
  } catch (error) {
    console.error('Error creating transaction in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật giao dịch trong Supabase
 */
export const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> => {
  try {
    const transformed: any = {};
    
    if (updates.date !== undefined) transformed.date = updates.date;
    if (updates.month !== undefined) transformed.month = updates.month;
    if (updates.type !== undefined) transformed.type = updates.type;
    if (updates.category !== undefined) transformed.category = updates.category;
    if (updates.amount !== undefined) transformed.amount = updates.amount;
    if (updates.description !== undefined) transformed.description = updates.description || null;
    if (updates.studentId !== undefined) transformed.student_id = updates.studentId || null;
    if (updates.studentName !== undefined) transformed.student_name = updates.studentName || null;
    if (updates.contractId !== undefined) transformed.contract_id = updates.contractId || null;
    if (updates.invoiceId !== undefined) transformed.invoice_id = updates.invoiceId || null;
    if (updates.createdBy !== undefined) transformed.created_by = updates.createdBy || null;
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformTransactionFromSupabase(data);
  } catch (error) {
    console.error('Error updating transaction in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa giao dịch trong Supabase
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting transaction from Supabase:', error);
    throw error;
  }
};

/**
 * Query giao dịch với filter
 */
export const queryTransactions = async (filters: {
  month?: string;
  type?: 'income' | 'expense';
  category?: string;
  studentId?: string;
}): Promise<FinancialTransaction[]> => {
  try {
    let query = supabase.from('financial_transactions_view').select('*');
    
    if (filters.month) {
      query = query.eq('month', filters.month);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      // Fallback về bảng nếu view chưa tồn tại
      console.warn('financial_transactions_view not found, falling back to financial_transactions table:', error);
      let fallbackQuery = supabase.from('financial_transactions').select('*');
      
      if (filters.month) {
        fallbackQuery = fallbackQuery.eq('month', filters.month);
      }
      if (filters.type) {
        fallbackQuery = fallbackQuery.eq('type', filters.type);
      }
      if (filters.category) {
        fallbackQuery = fallbackQuery.eq('category', filters.category);
      }
      if (filters.studentId) {
        fallbackQuery = fallbackQuery.eq('student_id', filters.studentId);
      }
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('date', { ascending: false });
      
      if (fallbackError) throw fallbackError;
      return fallbackData.map(transformTransactionFromSupabase);
    }
    
    return data.map(transformTransactionFromSupabase);
  } catch (error) {
    console.error('Error querying transactions from Supabase:', error);
    throw error;
  }
};
