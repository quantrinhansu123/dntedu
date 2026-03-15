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

  // Helper function to convert empty string to null for date fields
  const toDateOrNull = (value: any): string | null => {
    if (!value || value.toString().trim() === '') return null;
    return value.toString();
  };
  
  // Helper function to convert empty string to null for text fields
  const toStringOrNull = (value: any): string | null => {
    if (!value || value.toString().trim() === '') return null;
    return value.toString();
  };

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
    department: toStringOrNull(staffData.department),
    position: toStringOrNull(staffData.position),
    phone: toStringOrNull(staffData.phone),
    email: toStringOrNull(staffData.email),
    password: toStringOrNull((staffData as any).password), // Password field
    status: staffData.status,
    dob: toDateOrNull(staffData.dob),
    start_date: toDateOrNull(staffData.startDate),
    branch: toStringOrNull(staffData.branch),
    gender: toStringOrNull(staffData.gender),
    id_number: toStringOrNull(staffData.idNumber),
    id_issue_date: toDateOrNull(staffData.idIssueDate),
    id_issue_place: toStringOrNull(staffData.idIssuePlace),
    address: toStringOrNull(staffData.address),
    permanent_address: toStringOrNull(staffData.permanentAddress),
    bank_account: toStringOrNull(staffData.bankAccount),
    bank_name: toStringOrNull(staffData.bankName),
    tax_code: toStringOrNull(staffData.taxCode),
    insurance_number: toStringOrNull(staffData.insuranceNumber),
    education: toStringOrNull(staffData.education),
    degree: toStringOrNull(staffData.degree),
    major: toStringOrNull(staffData.major),
    // JSONB - Supabase tự động parse array
    certificates: staffData.certificates && Array.isArray(staffData.certificates) ? staffData.certificates : null,
    salary_grade: staffData.salaryGrade ?? null,
    salary_coefficient: staffData.salaryCoefficient ?? null,
    base_salary: staffData.baseSalary ?? null,
    allowance: staffData.allowance ?? null,
    current_contract_id: toStringOrNull(staffData.currentContractId),
    current_contract_type: toStringOrNull(staffData.currentContractType),
    contract_start_date: toDateOrNull(staffData.contractStartDate),
    contract_end_date: toDateOrNull(staffData.contractEndDate),
    avatar: toStringOrNull(staffData.avatar),
    notes: toStringOrNull(staffData.notes),
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
    
    // Helper function to convert empty string to null for date fields
    const toDateOrNull = (value: any): string | null => {
      if (value === undefined) return undefined as any;
      return value && value.toString().trim() !== '' ? value.toString() : null;
    };
    
    // Helper function to convert empty string to null for text fields
    const toStringOrNull = (value: any): string | null => {
      if (value === undefined) return undefined as any;
      return value && value.toString().trim() !== '' ? value.toString() : null;
    };
    
    // Handle basic fields
    if (updates.name !== undefined) transformed.name = updates.name;
    if (updates.code !== undefined) transformed.code = updates.code;
    if (updates.phone !== undefined) transformed.phone = updates.phone;
    if (updates.department !== undefined) transformed.department = updates.department;
    if (updates.position !== undefined) transformed.position = updates.position;
    if (updates.status !== undefined) transformed.status = updates.status;
    if (updates.gender !== undefined) transformed.gender = updates.gender;
    
    // JSONB fields - Supabase tự động parse array
    if (updates.roles !== undefined) transformed.roles = Array.isArray(updates.roles) ? updates.roles : null;
    if (updates.certificates !== undefined) transformed.certificates = Array.isArray(updates.certificates) ? updates.certificates : null;
    
    // Date fields - must convert empty string to null
    if (updates.dob !== undefined) transformed.dob = toDateOrNull(updates.dob);
    if (updates.startDate !== undefined) transformed.start_date = toDateOrNull(updates.startDate);
    if (updates.idIssueDate !== undefined) transformed.id_issue_date = toDateOrNull(updates.idIssueDate);
    if (updates.contractStartDate !== undefined) transformed.contract_start_date = toDateOrNull(updates.contractStartDate);
    if (updates.contractEndDate !== undefined) transformed.contract_end_date = toDateOrNull(updates.contractEndDate);
    
    // Text fields - convert empty string to null
    if (updates.idNumber !== undefined) transformed.id_number = toStringOrNull(updates.idNumber);
    if (updates.idIssuePlace !== undefined) transformed.id_issue_place = toStringOrNull(updates.idIssuePlace);
    if (updates.permanentAddress !== undefined) transformed.permanent_address = toStringOrNull(updates.permanentAddress);
    if (updates.bankAccount !== undefined) transformed.bank_account = toStringOrNull(updates.bankAccount);
    if (updates.bankName !== undefined) transformed.bank_name = toStringOrNull(updates.bankName);
    if (updates.taxCode !== undefined) transformed.tax_code = toStringOrNull(updates.taxCode);
    if (updates.insuranceNumber !== undefined) transformed.insurance_number = toStringOrNull(updates.insuranceNumber);
    if (updates.email !== undefined) transformed.email = toStringOrNull(updates.email);
    if (updates.branch !== undefined) transformed.branch = toStringOrNull(updates.branch);
    if (updates.address !== undefined) transformed.address = toStringOrNull(updates.address);
    if (updates.education !== undefined) transformed.education = toStringOrNull(updates.education);
    if (updates.degree !== undefined) transformed.degree = toStringOrNull(updates.degree);
    if (updates.major !== undefined) transformed.major = toStringOrNull(updates.major);
    if (updates.notes !== undefined) transformed.notes = toStringOrNull(updates.notes);
    if (updates.avatar !== undefined) transformed.avatar = toStringOrNull(updates.avatar);
    if (updates.currentContractId !== undefined) transformed.current_contract_id = toStringOrNull(updates.currentContractId);
    
    // Numeric fields
    if (updates.salaryGrade !== undefined) transformed.salary_grade = updates.salaryGrade;
    if (updates.salaryCoefficient !== undefined) transformed.salary_coefficient = updates.salaryCoefficient;
    if (updates.baseSalary !== undefined) transformed.base_salary = updates.baseSalary;
    if (updates.allowance !== undefined) transformed.allowance = updates.allowance;
    
    // Other fields
    if (updates.currentContractType !== undefined) transformed.current_contract_type = updates.currentContractType;
    // Only update password if provided (for security)
    if ((updates as any).password !== undefined && (updates as any).password !== '') {
      transformed.password = (updates as any).password;
    }
    
    // Don't copy any other fields - all fields should be explicitly handled above
    // This prevents accidentally sending empty strings or invalid values
    
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

/**
 * Lấy staff theo email và password (dùng cho authentication)
 */
export const getStaffByEmailAndPassword = async (email: string, password: string): Promise<Staff | null> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'Active')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    if (!data) return null;
    
    // Check password
    if (!data.password || data.password !== password) {
      return null;
    }
    
    return transformStaffFromSupabase(data);
  } catch (error) {
    console.error('Error getting staff by email and password:', error);
    throw error;
  }
};