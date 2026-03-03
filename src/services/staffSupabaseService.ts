/**
 * Staff Supabase Service
 * Service để sync và quản lý dữ liệu nhân sự với Supabase
 */

import { supabase } from '../config/supabase';
import { Staff, StaffRole } from '../../types';

/**
 * Map internal role sang Supabase role
 * Supabase chỉ chấp nhận: 'Giáo viên', 'Trợ giảng', 'Nhân viên', 'Sale', 'Văn phòng', 'Quản lý', 'Quản trị viên'
 */
const mapRoleToSupabase = (internalRole: string): string => {
  const roleMap: Record<string, string> = {
    // Giáo viên
    'gv_viet': 'Giáo viên',
    'gv_nuocngoai': 'Giáo viên',
    'Giáo viên Việt': 'Giáo viên',
    'Giáo viên nước ngoài': 'Giáo viên',
    'Giáo Viên Việt': 'Giáo viên',
    'Giáo Viên Nước Ngoài': 'Giáo viên',
    'Giáo viên': 'Giáo viên',
    
    // Trợ giảng
    'tro_giang': 'Trợ giảng',
    'Trợ giảng': 'Trợ giảng',
    'Trợ Giảng': 'Trợ giảng',
    
    // Nhân viên
    'cskh': 'Nhân viên',
    'ketoan': 'Văn phòng',
    'Nhân viên': 'Nhân viên',
    'Kế toán': 'Văn phòng',
    'Lễ tân': 'Nhân viên',
    
    // Sale
    'Sale': 'Sale',
    'sale': 'Sale',
    
    // Văn phòng
    'marketer': 'Văn phòng',
    'Marketing': 'Văn phòng',
    
    // Quản lý
    'admin': 'Quản lý',
    'Quản lý': 'Quản lý',
    'Quản lý (Admin)': 'Quản lý',
    
    // Quản trị viên
    'Quản trị viên': 'Quản trị viên',
  };
  
  // Nếu đã là Supabase role hợp lệ, giữ nguyên
  const validSupabaseRoles = ['Giáo viên', 'Trợ giảng', 'Nhân viên', 'Sale', 'Văn phòng', 'Quản lý', 'Quản trị viên'];
  if (validSupabaseRoles.includes(internalRole)) {
    return internalRole;
  }
  
  // Map từ internal role
  return roleMap[internalRole] || 'Nhân viên'; // Default to 'Nhân viên' nếu không tìm thấy
};

/**
 * Chuyển đổi Staff từ Firestore sang format Supabase
 */
const transformStaffForSupabase = (staffData: Staff) => {
  // Đảm bảo các field bắt buộc có giá trị (id có thể không có khi tạo mới)
  if (!staffData.name) throw new Error('Staff name is required');
  if (!staffData.code) throw new Error('Staff code is required');
  if (!staffData.role) throw new Error('Staff role is required');
  if (!staffData.status) throw new Error('Staff status is required');

  const result: any = {};
  
  // Chỉ thêm id nếu có và không phải empty string (khi update, không cần khi create)
  if (staffData.id && staffData.id.trim() !== '') {
    result.id = staffData.id;
  }

  // Map role sang Supabase format
  const supabaseRole = mapRoleToSupabase(staffData.role);

  return {
    ...result,
    name: staffData.name,
    code: staffData.code,
    // JSONB fields - Supabase tự động parse JSON string hoặc có thể dùng array trực tiếp
    roles: staffData.roles && Array.isArray(staffData.roles) ? staffData.roles : null,
    role: supabaseRole, // Sử dụng mapped role
    department: staffData.department || null,
    position: staffData.position || null,
    phone: staffData.phone || null,
    email: staffData.email || null,
    status: staffData.status,
    dob: staffData.dob || null,
    start_date: staffData.startDate || null,
    branch: staffData.branch || null,
    gender: staffData.gender || null,
    id_number: staffData.idNumber || null,
    id_issue_date: staffData.idIssueDate || null,
    id_issue_place: staffData.idIssuePlace || null,
    address: staffData.address || null,
    permanent_address: staffData.permanentAddress || null,
    bank_account: staffData.bankAccount || null,
    bank_name: staffData.bankName || null,
    tax_code: staffData.taxCode || null,
    insurance_number: staffData.insuranceNumber || null,
    education: staffData.education || null,
    degree: staffData.degree || null,
    major: staffData.major || null,
    // JSONB - Supabase tự động parse array
    certificates: staffData.certificates && Array.isArray(staffData.certificates) ? staffData.certificates : null,
    salary_grade: staffData.salaryGrade ?? null,
    salary_coefficient: staffData.salaryCoefficient ?? null,
    base_salary: staffData.baseSalary ?? null,
    allowance: staffData.allowance ?? null,
    current_contract_id: staffData.currentContractId || null,
    current_contract_type: staffData.currentContractType || null,
    contract_start_date: staffData.contractStartDate || null,
    contract_end_date: staffData.contractEndDate || null,
    avatar: staffData.avatar || null,
    notes: staffData.notes || null,
    created_at: staffData.createdAt || new Date().toISOString(),
    updated_at: staffData.updatedAt || new Date().toISOString(),
  };
};

/**
 * Chuyển đổi dữ liệu từ Supabase sang Staff
 */
const transformStaffFromSupabase = (data: any): Staff => {
  // Xử lý JSONB fields - có thể là object hoặc string
  let roles: StaffRole[] | undefined;
  if (data.roles) {
    if (Array.isArray(data.roles)) {
      roles = data.roles as StaffRole[];
    } else if (typeof data.roles === 'string') {
      try {
        roles = JSON.parse(data.roles) as StaffRole[];
      } catch {
        roles = undefined;
      }
    }
  }

  let certificates: string[] | undefined;
  if (data.certificates) {
    if (Array.isArray(data.certificates)) {
      certificates = data.certificates as string[];
    } else if (typeof data.certificates === 'string') {
      try {
        certificates = JSON.parse(data.certificates) as string[];
      } catch {
        certificates = undefined;
      }
    }
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    roles,
    role: data.role as StaffRole,
    department: data.department || '',
    position: data.position || '',
    phone: data.phone || '',
    email: data.email,
    status: data.status as 'Active' | 'Inactive',
    dob: data.dob,
    startDate: data.start_date,
    branch: data.branch,
    gender: data.gender as 'Nam' | 'Nữ' | undefined,
    idNumber: data.id_number,
    idIssueDate: data.id_issue_date,
    idIssuePlace: data.id_issue_place,
    address: data.address,
    permanentAddress: data.permanent_address,
    bankAccount: data.bank_account,
    bankName: data.bank_name,
    taxCode: data.tax_code,
    insuranceNumber: data.insurance_number,
    education: data.education,
    degree: data.degree,
    major: data.major,
    certificates,
    salaryGrade: data.salary_grade,
    salaryCoefficient: data.salary_coefficient ? parseFloat(String(data.salary_coefficient)) : undefined,
    baseSalary: data.base_salary ? parseFloat(String(data.base_salary)) : undefined,
    allowance: data.allowance ? parseFloat(String(data.allowance)) : undefined,
    currentContractId: data.current_contract_id,
    currentContractType: data.current_contract_type as any,
    contractStartDate: data.contract_start_date,
    contractEndDate: data.contract_end_date,
    avatar: data.avatar,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Lấy tất cả nhân sự từ Supabase
 */
export const getAllStaff = async (): Promise<Staff[]> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStaffFromSupabase);
  } catch (error) {
    console.error('Error fetching staff from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy nhân sự theo ID
 */
export const getStaffById = async (id: string): Promise<Staff | null> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformStaffFromSupabase(data);
  } catch (error) {
    console.error('Error fetching staff from Supabase:', error);
    throw error;
  }
};

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  // Sử dụng crypto.randomUUID() nếu có sẵn (browser/Node.js hiện đại)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback cho môi trường không hỗ trợ
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Tạo nhân sự mới trong Supabase
 */
export const createStaff = async (staffData: Staff): Promise<Staff> => {
  try {
    const transformed = transformStaffForSupabase(staffData);
    
    // Bảng staff yêu cầu id là PRIMARY KEY, không có DEFAULT
    // Nên chúng ta phải generate UUID trước khi insert
    if (!transformed.id || transformed.id.trim() === '') {
      transformed.id = generateUUID();
    }
    
    const { data, error } = await supabase
      .from('staff')
      .insert(transformed)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    return transformStaffFromSupabase(data);
  } catch (error) {
    console.error('Error creating staff in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật nhân sự trong Supabase
 */
export const updateStaff = async (id: string, updates: Partial<Staff>): Promise<Staff> => {
  try {
    // Chuyển đổi updates sang format Supabase
    const transformed: any = {};
    
    // Map role nếu có
    if (updates.role !== undefined) {
      transformed.role = mapRoleToSupabase(updates.role);
    }
    
    // JSONB fields - Supabase tự động parse array
    if (updates.roles !== undefined) transformed.roles = Array.isArray(updates.roles) ? updates.roles : null;
    if (updates.certificates !== undefined) transformed.certificates = Array.isArray(updates.certificates) ? updates.certificates : null;
    if (updates.startDate !== undefined) transformed.start_date = updates.startDate;
    if (updates.idNumber !== undefined) transformed.id_number = updates.idNumber;
    if (updates.idIssueDate !== undefined) transformed.id_issue_date = updates.idIssueDate;
    if (updates.idIssuePlace !== undefined) transformed.id_issue_place = updates.idIssuePlace;
    if (updates.permanentAddress !== undefined) transformed.permanent_address = updates.permanentAddress;
    if (updates.bankAccount !== undefined) transformed.bank_account = updates.bankAccount;
    if (updates.bankName !== undefined) transformed.bank_name = updates.bankName;
    if (updates.taxCode !== undefined) transformed.tax_code = updates.taxCode;
    if (updates.insuranceNumber !== undefined) transformed.insurance_number = updates.insuranceNumber;
    if (updates.salaryGrade !== undefined) transformed.salary_grade = updates.salaryGrade;
    if (updates.salaryCoefficient !== undefined) transformed.salary_coefficient = updates.salaryCoefficient;
    if (updates.baseSalary !== undefined) transformed.base_salary = updates.baseSalary;
    if (updates.allowance !== undefined) transformed.allowance = updates.allowance;
    if (updates.currentContractId !== undefined) transformed.current_contract_id = updates.currentContractId;
    if (updates.currentContractType !== undefined) transformed.current_contract_type = updates.currentContractType;
    if (updates.contractStartDate !== undefined) transformed.contract_start_date = updates.contractStartDate;
    if (updates.contractEndDate !== undefined) transformed.contract_end_date = updates.contractEndDate;
    
    // Copy các field khác
    Object.keys(updates).forEach(key => {
      if (!transformed[key] && 
          key !== 'roles' && key !== 'certificates' && 
          key !== 'startDate' && key !== 'idNumber' && key !== 'idIssueDate' && 
          key !== 'idIssuePlace' && key !== 'permanentAddress' && 
          key !== 'bankAccount' && key !== 'bankName' && key !== 'taxCode' && 
          key !== 'insuranceNumber' && key !== 'salaryGrade' && 
          key !== 'salaryCoefficient' && key !== 'baseSalary' && key !== 'allowance' &&
          key !== 'currentContractId' && key !== 'currentContractType' && 
          key !== 'contractStartDate' && key !== 'contractEndDate') {
        transformed[key] = (updates as any)[key];
      }
    });
    
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('staff')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformStaffFromSupabase(data);
  } catch (error) {
    console.error('Error updating staff in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa nhân sự trong Supabase
 */
export const deleteStaff = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting staff from Supabase:', error);
    throw error;
  }
};

/**
 * Query nhân sự với filter
 */
export const queryStaff = async (filters: {
  status?: string;
  role?: string;
  department?: string;
  branch?: string;
}): Promise<Staff[]> => {
  try {
    let query = supabase.from('staff').select('*');
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.branch) {
      query = query.eq('branch', filters.branch);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformStaffFromSupabase);
  } catch (error) {
    console.error('Error querying staff from Supabase:', error);
    throw error;
  }
};
