/**
 * Contract Supabase Service
 * CRUD operations cho Contracts với Supabase
 */

import { supabase } from '../config/supabase';
import { Contract, ContractStatus, ContractType, PaymentMethod, ContractItem } from '../../types';

/**
 * Chuyển đổi Contract từ format Supabase
 */
const transformContractFromSupabase = (data: any): Contract => {
  return {
    id: data.id,
    code: data.code,
    type: data.type as ContractType,
    category: data.category as any,
    studentId: data.student_id,
    studentName: data.student_name,
    studentDOB: data.student_dob,
    parentName: data.parent_name,
    parentPhone: data.parent_phone,
    items: (data.items || []) as ContractItem[],
    subtotal: parseFloat(data.subtotal || 0),
    totalDiscount: parseFloat(data.total_discount || 0),
    totalAmount: parseFloat(data.total_amount || 0),
    totalAmountInWords: data.total_amount_in_words || '',
    paymentMethod: data.payment_method as PaymentMethod,
    paidAmount: parseFloat(data.paid_amount || 0),
    remainingAmount: parseFloat(data.remaining_amount || 0),
    contractDate: data.contract_date,
    startDate: data.start_date,
    paymentDate: data.payment_date,
    nextPaymentDate: data.next_payment_date,
    classId: data.class_id,
    className: data.class_name,
    totalSessions: data.total_sessions,
    pricePerSession: parseFloat(data.price_per_session || 0),
    status: data.status as ContractStatus,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
};

// Valid payment method values (shared constant)
const VALID_PAYMENT_METHODS = ['Tiền mặt', 'Toàn bộ', 'Trả góp', 'Chuyển khoản'] as const;

/**
 * Chuyển đổi Contract sang format Supabase
 */
const transformContractForSupabase = (contract: Partial<Contract>) => {
  const result: any = {};
  
  // Always set required fields
  if (contract.code !== undefined) result.code = contract.code;
  if (contract.type !== undefined) result.type = contract.type;
  if (contract.category !== undefined) result.category = contract.category;
  
  // ALWAYS set payment_method (required field with CHECK constraint)
  // This field MUST be set, regardless of whether contract.paymentMethod exists
  let paymentMethodValue: string = 'Tiền mặt'; // Default value - MUST match CHECK constraint
  
  if (contract.paymentMethod !== undefined && contract.paymentMethod !== null) {
    const paymentMethodStr = String(contract.paymentMethod).trim();
    
    // Map PaymentMethod enum values to database values
    const paymentMethodMap: Record<string, string> = {
      'Tiền mặt': 'Tiền mặt',
      'Toàn bộ': 'Toàn bộ',
      'Trả góp': 'Trả góp',
      'Chuyển khoản': 'Chuyển khoản',
      // Handle any case variations
      'tiền mặt': 'Tiền mặt',
      'toàn bộ': 'Toàn bộ',
      'trả góp': 'Trả góp',
      'chuyển khoản': 'Chuyển khoản',
    };
    
    // Check if mapped value exists
    const mappedValue = paymentMethodMap[paymentMethodStr];
    if (mappedValue && VALID_PAYMENT_METHODS.includes(mappedValue as any)) {
      paymentMethodValue = mappedValue;
    } else if (VALID_PAYMENT_METHODS.includes(paymentMethodStr as any)) {
      paymentMethodValue = paymentMethodStr;
    } else {
      console.warn(`Invalid paymentMethod in transform: "${paymentMethodStr}", defaulting to 'Tiền mặt'`);
      console.warn('Valid values:', VALID_PAYMENT_METHODS);
      paymentMethodValue = 'Tiền mặt';
    }
  }
  
  // Final check - ensure it's always a valid value
  if (!VALID_PAYMENT_METHODS.includes(paymentMethodValue as any)) {
    console.error(`CRITICAL: paymentMethodValue "${paymentMethodValue}" is not in VALID_PAYMENT_METHODS, forcing to 'Tiền mặt'`);
    paymentMethodValue = 'Tiền mặt';
  }
  
  result.payment_method = paymentMethodValue; // ALWAYS set this field
  if (contract.studentId !== undefined) result.student_id = contract.studentId || null;
  if (contract.studentName !== undefined) result.student_name = contract.studentName || null;
  if (contract.studentDOB !== undefined) result.student_dob = contract.studentDOB || null;
  if (contract.parentName !== undefined) result.parent_name = contract.parentName || null;
  if (contract.parentPhone !== undefined) result.parent_phone = contract.parentPhone || null;
  if (contract.items !== undefined) result.items = contract.items || [];
  if (contract.subtotal !== undefined) result.subtotal = contract.subtotal || 0;
  if (contract.totalDiscount !== undefined) result.total_discount = contract.totalDiscount || 0;
  if (contract.totalAmount !== undefined) result.total_amount = contract.totalAmount || 0;
  if (contract.totalAmountInWords !== undefined) result.total_amount_in_words = contract.totalAmountInWords || null;
  if (contract.paidAmount !== undefined) result.paid_amount = contract.paidAmount || 0;
  if (contract.remainingAmount !== undefined) result.remaining_amount = contract.remainingAmount || 0;
  if (contract.contractDate !== undefined) result.contract_date = contract.contractDate;
  if (contract.startDate !== undefined) result.start_date = contract.startDate || null;
  if (contract.paymentDate !== undefined) result.payment_date = contract.paymentDate || null;
  if (contract.nextPaymentDate !== undefined) result.next_payment_date = contract.nextPaymentDate || null;
  if (contract.classId !== undefined) result.class_id = contract.classId || null;
  if (contract.className !== undefined) result.class_name = contract.className || null;
  if (contract.totalSessions !== undefined) result.total_sessions = contract.totalSessions || null;
  if (contract.pricePerSession !== undefined) result.price_per_session = contract.pricePerSession || null;
  if (contract.status !== undefined) result.status = contract.status;
  if (contract.notes !== undefined) result.notes = contract.notes || null;
  if (contract.createdBy !== undefined) result.created_by = contract.createdBy;
  
  return result;
};

/**
 * Lấy tất cả contracts
 */
export const getAllContracts = async (): Promise<Contract[]> => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(transformContractFromSupabase);
  } catch (error) {
    console.error('Error getting all contracts:', error);
    throw error;
  }
};

/**
 * Lấy contract theo ID
 */
export const getContractById = async (id: string): Promise<Contract | null> => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data ? transformContractFromSupabase(data) : null;
  } catch (error) {
    console.error('Error getting contract by ID:', error);
    throw error;
  }
};

/**
 * Tạo contract mới trong Supabase
 */
export const createContract = async (contract: Omit<Contract, 'id'>): Promise<string> => {
  try {
    const transformed = transformContractForSupabase(contract);
    
    // DOUBLE-CHECK: Ensure payment_method is always set and valid (required field)
    if (!transformed.payment_method || transformed.payment_method === null || transformed.payment_method === undefined) {
      console.warn('payment_method was not set in transform, setting default');
      transformed.payment_method = 'Tiền mặt';
    }
    
    // Convert to string and validate payment_method value
    const paymentMethodStr = String(transformed.payment_method).trim();
    if (!paymentMethodStr || !VALID_PAYMENT_METHODS.includes(paymentMethodStr as any)) {
      console.warn(`Invalid payment_method: "${paymentMethodStr}", defaulting to 'Tiền mặt'`);
      console.warn('Original paymentMethod from contract:', contract.paymentMethod);
      console.warn('Transformed payment_method before fix:', transformed.payment_method);
      transformed.payment_method = 'Tiền mặt';
    } else {
      transformed.payment_method = paymentMethodStr;
    }
    
    // FINAL CHECK: Ensure payment_method is set before insert
    if (!transformed.payment_method || !VALID_PAYMENT_METHODS.includes(transformed.payment_method as any)) {
      console.error('CRITICAL: payment_method is still invalid after all checks, forcing to default');
      transformed.payment_method = 'Tiền mặt';
    }
    
    // Generate ID if not provided
    if (!transformed.id) {
      transformed.id = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // FINAL VALIDATION: Right before insert, ensure payment_method is valid
    if (!transformed.payment_method || 
        typeof transformed.payment_method !== 'string' ||
        !VALID_PAYMENT_METHODS.includes(transformed.payment_method as any)) {
      console.error('FINAL CHECK FAILED: payment_method is invalid:', transformed.payment_method);
      console.error('payment_method type:', typeof transformed.payment_method);
      transformed.payment_method = 'Tiền mặt';
    }
    
    // Log the final transformed data for debugging
    console.log('=== FINAL TRANSFORMED DATA ===');
    console.log('payment_method:', transformed.payment_method);
    console.log('payment_method type:', typeof transformed.payment_method);
    console.log('payment_method in VALID_PAYMENT_METHODS:', VALID_PAYMENT_METHODS.includes(transformed.payment_method as any));
    console.log('VALID_PAYMENT_METHODS:', VALID_PAYMENT_METHODS);
    console.log('Full transformed object:', JSON.stringify(transformed, null, 2));
    console.log('==============================');
    
    // Create a clean object with only valid fields for insert
    // Explicitly set payment_method FIRST to ensure it's never null/undefined
    const paymentMethodFinal = (transformed.payment_method && 
                                 typeof transformed.payment_method === 'string' &&
                                 VALID_PAYMENT_METHODS.includes(transformed.payment_method as any))
                               ? transformed.payment_method
                               : 'Tiền mặt';
    
    // CRITICAL: Normalize and validate payment_method BEFORE building insertData
    // This ensures payment_method is ALWAYS a valid value
    let finalPaymentMethod: string = 'Tiền mặt'; // Default value
    
    if (paymentMethodFinal && typeof paymentMethodFinal === 'string') {
      const trimmed = paymentMethodFinal.trim();
      // Exact match check - must be exactly one of the valid values
      if (trimmed === 'Tiền mặt' || trimmed === 'Toàn bộ' || trimmed === 'Trả góp' || trimmed === 'Chuyển khoản') {
        finalPaymentMethod = trimmed;
      } else {
        console.warn(`Invalid payment_method value: "${trimmed}", using default: "Tiền mặt"`);
        finalPaymentMethod = 'Tiền mặt';
      }
    }
    
    // Build insertData object explicitly, ensuring payment_method is set correctly
    const insertData: any = {
      code: transformed.code,
      type: transformed.type,
      category: transformed.category || null,
      student_id: transformed.student_id || null,
      student_name: transformed.student_name || null,
      student_dob: transformed.student_dob || null,
      parent_name: transformed.parent_name || null,
      parent_phone: transformed.parent_phone || null,
      items: transformed.items || [],
      subtotal: transformed.subtotal || 0,
      total_discount: transformed.total_discount || 0,
      total_amount: transformed.total_amount || 0,
      total_amount_in_words: transformed.total_amount_in_words || null,
      payment_method: finalPaymentMethod, // CRITICAL: Set explicitly to validated value
      paid_amount: transformed.paid_amount || 0,
      remaining_amount: transformed.remaining_amount || 0,
      contract_date: transformed.contract_date,
      start_date: transformed.start_date || null,
      payment_date: transformed.payment_date || null,
      next_payment_date: transformed.next_payment_date || null,
      class_id: transformed.class_id || null,
      class_name: transformed.class_name || null,
      total_sessions: transformed.total_sessions || null,
      price_per_session: transformed.price_per_session || null,
      status: transformed.status,
      notes: transformed.notes || null,
      created_by: transformed.created_by,
    };
    
    // Final validation - this should never fail, but double-check anyway
    if (insertData.payment_method !== 'Tiền mặt' && 
        insertData.payment_method !== 'Toàn bộ' && 
        insertData.payment_method !== 'Trả góp' && 
        insertData.payment_method !== 'Chuyển khoản') {
      console.error('CRITICAL: payment_method is still invalid after all checks:', insertData.payment_method);
      insertData.payment_method = 'Tiền mặt';
    }
    
    // CRITICAL: Create a clean insert object with ONLY the fields we want
    // This prevents any accidental overrides from transformed object
    const cleanInsertData: Record<string, any> = {
      code: insertData.code,
      type: insertData.type,
      category: insertData.category,
      student_id: insertData.student_id,
      student_name: insertData.student_name,
      student_dob: insertData.student_dob,
      parent_name: insertData.parent_name,
      parent_phone: insertData.parent_phone,
      items: insertData.items,
      subtotal: insertData.subtotal,
      total_discount: insertData.total_discount,
      total_amount: insertData.total_amount,
      total_amount_in_words: insertData.total_amount_in_words,
      payment_method: finalPaymentMethod, // CRITICAL: Use the validated value directly
      paid_amount: insertData.paid_amount,
      remaining_amount: insertData.remaining_amount,
      contract_date: insertData.contract_date,
      start_date: insertData.start_date,
      payment_date: insertData.payment_date,
      next_payment_date: insertData.next_payment_date,
      class_id: insertData.class_id,
      class_name: insertData.class_name,
      total_sessions: insertData.total_sessions,
      price_per_session: insertData.price_per_session,
      status: insertData.status,
      notes: insertData.notes,
      created_by: insertData.created_by,
    };
    
    console.log('=== INSERT DATA (FINAL CHECK) ===');
    console.log('payment_method:', cleanInsertData.payment_method);
    console.log('payment_method type:', typeof cleanInsertData.payment_method);
    console.log('payment_method length:', cleanInsertData.payment_method.length);
    console.log('payment_method === "Tiền mặt":', cleanInsertData.payment_method === 'Tiền mặt');
    console.log('payment_method === "Toàn bộ":', cleanInsertData.payment_method === 'Toàn bộ');
    console.log('payment_method === "Trả góp":', cleanInsertData.payment_method === 'Trả góp');
    console.log('payment_method === "Chuyển khoản":', cleanInsertData.payment_method === 'Chuyển khoản');
    console.log('VALID_PAYMENT_METHODS:', VALID_PAYMENT_METHODS);
    console.log('Full cleanInsertData keys:', Object.keys(cleanInsertData));
    console.log('===========================');
    
    const { data, error } = await supabase
      .from('contracts')
      .insert(cleanInsertData)
      .select('id')
      .single();
    
    if (error) {
      console.error('=== SUPABASE INSERT ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('payment_method value:', cleanInsertData.payment_method);
      console.error('payment_method type:', typeof cleanInsertData.payment_method);
      console.error('payment_method length:', cleanInsertData.payment_method?.length);
      console.error('payment_method char codes:', cleanInsertData.payment_method?.split('').map((c: string, i: number) => `${i}:${c.charCodeAt(0)}`));
      console.error('Insert data (stringified):', JSON.stringify(cleanInsertData, null, 2));
      console.error('===========================');
      throw error;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error creating contract in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật contract trong Supabase
 */
export const updateContract = async (id: string, updates: Partial<Contract>): Promise<Contract> => {
  try {
    const transformed = transformContractForSupabase(updates);
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contracts')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformContractFromSupabase(data);
  } catch (error) {
    console.error('Error updating contract in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa contract trong Supabase
 */
export const deleteContract = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting contract from Supabase:', error);
    throw error;
  }
};

/**
 * Query contracts với filter
 */
export const queryContracts = async (filters: {
  studentId?: string;
  status?: ContractStatus;
  type?: ContractType;
}): Promise<Contract[]> => {
  try {
    let query = supabase.from('contracts').select('*');
    
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(transformContractFromSupabase);
  } catch (error) {
    console.error('Error querying contracts:', error);
    throw error;
  }
};
