/**
 * Salary Config Service
 * Handle salary configuration CRUD operations
 */

// import {
//   collection,
//   doc,
//   query,
//   where,
//   orderBy,
// ;

const SALARY_RULES_COLLECTION = 'salaryRules';
const SALARY_RANGES_COLLECTION = 'salaryRanges';

export type SalaryMethod = 'Theo ca' | 'Theo giờ' | 'Nhận xét' | 'Cố định';
export type WorkMethod = 'Cố định' | 'Theo sĩ số';
export type RangeType = 'Teaching' | 'AssistantFeedback';

export interface SalaryRule {
  id?: string;
  staffId: string;
  staffName: string;
  position: string;
  classId?: string;
  className?: string;
  classCode?: string;
  salaryMethod: SalaryMethod;
  baseRate: number;
  workMethod: WorkMethod;
  avgStudents?: number;
  ratePerSession: number;
  allowance?: number;
  kpiBonus?: number;
  note?: string;
  salaryCycle?: string;
  effectiveDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryRangeConfig {
  id?: string;
  type: RangeType;
  rangeLabel: string;
  minStudents?: number;
  maxStudents?: number;
  method?: string;
  amount: number;
  effectiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// SALARY RULES
// ============================================

export const createSalaryRule = async (data: Omit<SalaryRule, 'id'>): Promise<string> => {
  // TODO: Implement Supabase create
  throw new Error('Tính năng này cần được migrate sang Supabase.');
};

export const getSalaryRules = async (staffId?: string): Promise<SalaryRule[]> => {
  try {
    // TODO: Implement Supabase query for salary rules
    // const { data, error } = await supabase
    //   .from('salary_rules')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // if (staffId) {
    //   query = query.eq('staff_id', staffId);
    // }
    // if (error) throw error;
    // return data.map(transformSalaryRuleFromSupabase);
    
    // Tạm thời trả về empty array để không gây lỗi
    
    return [];
  } catch (error) {
    console.error('Error getting salary rules:', error);
    throw new Error('Không thể tải cấu hình lương');
  }
};

export const updateSalaryRule = async (id: string, data: Partial<SalaryRule>): Promise<void> => {
  // TODO: Implement Supabase update
  throw new Error('Tính năng này cần được migrate sang Supabase.');
};

export const deleteSalaryRule = async (id: string): Promise<void> => {
  // TODO: Implement Supabase delete
  throw new Error('Tính năng này cần được migrate sang Supabase.');
};

// ============================================
// SALARY RANGES (Mức lương theo sĩ số)
// ============================================

export const createSalaryRange = async (data: Omit<SalaryRangeConfig, 'id'>): Promise<string> => {
  // TODO: Implement Supabase create
  throw new Error('Tính năng này cần được migrate sang Supabase.');
};

export const getSalaryRanges = async (type?: RangeType): Promise<SalaryRangeConfig[]> => {
  try {
    // TODO: Implement Supabase query for salary ranges
    // const { data, error } = await supabase
    //   .from('salary_ranges')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // if (type) {
    //   query = query.eq('type', type);
    // }
    // if (error) throw error;
    // return data.map(transformSalaryRangeFromSupabase);
    
    // Tạm thời trả về empty array để không gây lỗi
    
    return [];
  } catch (error) {
    console.error('Error getting salary ranges:', error);
    throw new Error('Không thể tải mức lương');
  }
};

export const updateSalaryRange = async (id: string, data: Partial<SalaryRangeConfig>): Promise<void> => {
  // TODO: Implement Supabase update
  throw new Error('Tính năng này cần được migrate sang Supabase.');
};

export const deleteSalaryRange = async (id: string): Promise<void> => {
  // TODO: Implement Supabase delete
  throw new Error('Tính năng này cần được migrate sang Supabase.');
};

// ============================================
// SALARY CALCULATION
// ============================================

export const calculateSalary = (
  baseRate: number,
  workMethod: WorkMethod,
  studentCount: number,
  ranges: SalaryRangeConfig[]
): number => {
  if (workMethod === 'Cố định') {
    return baseRate;
  }
  
  // Theo sĩ số - tìm range phù hợp
  const applicableRange = ranges.find(r => {
    if (r.minStudents !== undefined && r.maxStudents !== undefined) {
      return studentCount >= r.minStudents && studentCount <= r.maxStudents;
    }
    return false;
  });
  
  if (applicableRange) {
    return applicableRange.amount;
  }
  
  return baseRate;
};
