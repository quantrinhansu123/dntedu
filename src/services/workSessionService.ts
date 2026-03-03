/**
 * Work Session Service
 * Handle work confirmation/session CRUD
 */

// import {
//   collection,
//   doc,
//   query,
//   where,
//   orderBy,
// ;

const WORK_SESSIONS_COLLECTION = 'workSessions';

export type WorkStatus = 'Chờ xác nhận' | 'Đã xác nhận' | 'Từ chối';
export type WorkType = 'Dạy chính' | 'Trợ giảng' | 'Nhận xét' | 'Dạy thay' | 'Bồi bài';

export interface WorkSession {
  id?: string;
  staffId?: string;
  staffName: string;
  position: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  classId?: string;
  className?: string;
  type: WorkType;
  status: WorkStatus;
  studentCount?: number;
  salary?: number;
  note?: string;
  
  // Thông tin dạy thay (chỉ dùng khi type = 'Dạy thay')
  substituteForStaffName?: string; // Dạy thay cho GV nào
  substituteReason?: SubstituteReason; // Lý do dạy thay
  
  confirmedAt?: string;
  confirmedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SubstituteReason = 'Nghỉ phép' | 'Nghỉ ốm' | 'Bận việc đột xuất' | 'Nghỉ không lương' | 'Khác';

export const createWorkSession = async (data: Omit<WorkSession, 'id'>): Promise<string> => {
  // TODO: Implement Supabase create
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để tạo work session.');
};

export const getWorkSessions = async (filters?: {
  staffId?: string;
  status?: WorkStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WorkSession[]> => {
  try {
    // TODO: Implement Supabase query for work sessions
    // const { data, error } = await supabase
    //   .from('work_sessions')
    //   .select('*')
    //   .order('date', { ascending: false });
    // if (error) throw error;
    // let sessions = data.map(transformWorkSessionFromSupabase);
    // 
    // // Apply filters
    // if (filters?.staffId) {
    //   sessions = sessions.filter(s => s.staffId === filters.staffId);
    // }
    // if (filters?.status) {
    //   sessions = sessions.filter(s => s.status === filters.status);
    // }
    // if (filters?.date) {
    //   sessions = sessions.filter(s => s.date === filters.date);
    // }
    // if (filters?.startDate) {
    //   sessions = sessions.filter(s => s.date >= filters.startDate!);
    // }
    // if (filters?.endDate) {
    //   sessions = sessions.filter(s => s.date <= filters.endDate!);
    // }
    // 
    // return sessions;
    
    // Tạm thời trả về empty array để không gây lỗi
    console.warn('getWorkSessions: Firebase đã được xóa. Sử dụng Supabase service thay thế.');
    return [];
  } catch (error) {
    console.error('Error getting work sessions:', error);
    throw new Error('Không thể tải danh sách công');
  }
};

export const updateWorkSession = async (id: string, data: Partial<WorkSession>): Promise<void> => {
  // TODO: Implement Supabase update
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để cập nhật work session.');
};

export const confirmWorkSession = async (id: string, confirmedBy?: string): Promise<void> => {
  // TODO: Implement Supabase confirm
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xác nhận work session.');
};

export const confirmAllWorkSessions = async (ids: string[], confirmedBy?: string): Promise<void> => {
  if (!ids || ids.length === 0) {
    throw new Error('Không có công nào để xác nhận');
  }
  
  // TODO: Implement Supabase batch update
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xác nhận hàng loạt.');
};

export const deleteWorkSession = async (id: string): Promise<void> => {
  // TODO: Implement Supabase delete
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xóa work session.');
};

// =============================================
// AUDIT LOG cho sửa/xóa công
// =============================================
export interface WorkSessionAuditLog {
  id?: string;
  workSessionId: string;
  action: 'create' | 'update' | 'delete' | 'confirm' | 'unconfirm';
  performedBy: string; // Tên người thực hiện
  performedByRole: string; // Role của người thực hiện
  performedAt: string;
  previousData?: Partial<WorkSession>; // Dữ liệu trước khi thay đổi
  newData?: Partial<WorkSession>; // Dữ liệu sau khi thay đổi
  reason?: string; // Lý do sửa/xóa
}

const AUDIT_LOG_COLLECTION = 'workSessionAuditLogs';

export const createAuditLog = async (log: Omit<WorkSessionAuditLog, 'id'>): Promise<void> => {
  // TODO: Implement Supabase audit log
  console.warn('createAuditLog: Firebase đã được xóa. Sử dụng Supabase service thay thế.');
  // Không throw error để không block action chính
};

// Update với audit log
export const updateWorkSessionWithAudit = async (
  id: string, 
  previousData: WorkSession,
  newData: Partial<WorkSession>,
  performer: { name: string; role: string },
  reason?: string
): Promise<void> => {
  // TODO: Implement Supabase update with audit
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để cập nhật work session với audit.');
};

// Delete với audit log
export const deleteWorkSessionWithAudit = async (
  id: string,
  sessionData: WorkSession,
  performer: { name: string; role: string },
  reason?: string
): Promise<void> => {
  // TODO: Implement Supabase delete with audit
  throw new Error('Firebase đã được xóa. Vui lòng sử dụng Supabase service để xóa work session với audit.');
};

// Get audit logs cho 1 work session
export const getWorkSessionAuditLogs = async (workSessionId: string): Promise<WorkSessionAuditLog[]> => {
  // TODO: Implement Supabase query for audit logs
  console.warn('getWorkSessionAuditLogs: Firebase đã được xóa. Sử dụng Supabase service thay thế.');
  return [];
};
