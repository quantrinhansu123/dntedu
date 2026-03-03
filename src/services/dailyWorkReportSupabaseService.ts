/**
 * Daily Work Report Supabase Service
 * Service để quản lý báo cáo công việc hàng ngày với Supabase
 */

import { supabase } from '../config/supabase';

export interface DailyWorkReport {
  id: string;
  staffId: string;
  staffName: string;
  reportDate: string; // YYYY-MM-DD
  workDescription: string;
  completedTasks: string[]; // Danh sách công việc đã hoàn thành
  status: 'Chờ xác nhận' | 'Đạt' | 'Chấp nhận' | 'Không đạt';
  approvalStatus?: 'Đạt' | 'Chấp nhận' | 'Không đạt' | null;
  approvalReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Map status từ database (ASCII) sang tiếng Việt
 */
const mapStatusFromDB = (status: string): DailyWorkReport['status'] => {
  const mapping: Record<string, DailyWorkReport['status']> = {
    'Cho xac nhan': 'Chờ xác nhận',
    'Dat': 'Đạt',
    'Chap nhan': 'Chấp nhận',
    'Khong dat': 'Không đạt',
  };
  return mapping[status] || 'Chờ xác nhận';
};

/**
 * Map status từ tiếng Việt sang database (ASCII)
 */
const mapStatusToDB = (status: DailyWorkReport['status']): string => {
  const mapping: Record<DailyWorkReport['status'], string> = {
    'Chờ xác nhận': 'Cho xac nhan',
    'Đạt': 'Dat',
    'Chấp nhận': 'Chap nhan',
    'Không đạt': 'Khong dat',
  };
  return mapping[status] || 'Cho xac nhan';
};

/**
 * Map approval status từ database (ASCII) sang tiếng Việt
 */
const mapApprovalStatusFromDB = (status: string | null): DailyWorkReport['approvalStatus'] => {
  if (!status) return null;
  const mapping: Record<string, DailyWorkReport['approvalStatus']> = {
    'Dat': 'Đạt',
    'Chap nhan': 'Chấp nhận',
    'Khong dat': 'Không đạt',
  };
  return mapping[status] || null;
};

/**
 * Map approval status từ tiếng Việt sang database (ASCII)
 */
const mapApprovalStatusToDB = (status: DailyWorkReport['approvalStatus']): string | null => {
  if (!status) return null;
  const mapping: Record<NonNullable<DailyWorkReport['approvalStatus']>, string> = {
    'Đạt': 'Dat',
    'Chấp nhận': 'Chap nhan',
    'Không đạt': 'Khong dat',
  };
  return mapping[status] || null;
};

/**
 * Chuyển đổi DailyWorkReport từ format Supabase
 */
const transformFromSupabase = (data: any): DailyWorkReport => {
  return {
    id: data.id,
    staffId: data.staff_id || '',
    staffName: data.staff_name || '',
    reportDate: data.report_date || '',
    workDescription: data.work_description || '',
    completedTasks: data.completed_tasks || [],
    status: mapStatusFromDB(data.status),
    approvalStatus: mapApprovalStatusFromDB(data.approval_status),
    approvalReason: data.approval_reason || null,
    approvedBy: data.approved_by || null,
    approvedAt: data.approved_at ? new Date(data.approved_at).toISOString() : null,
    note: data.note || null,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  };
};

/**
 * Chuyển đổi DailyWorkReport sang format Supabase
 */
const transformToSupabase = (report: Partial<DailyWorkReport>) => {
  const result: any = {};
  if (report.staffId !== undefined) result.staff_id = report.staffId;
  if (report.staffName !== undefined) result.staff_name = report.staffName;
  if (report.reportDate !== undefined) result.report_date = report.reportDate;
  if (report.workDescription !== undefined) result.work_description = report.workDescription;
  if (report.completedTasks !== undefined) result.completed_tasks = report.completedTasks;
  if (report.status !== undefined) result.status = mapStatusToDB(report.status);
  if (report.approvalStatus !== undefined) result.approval_status = mapApprovalStatusToDB(report.approvalStatus);
  if (report.approvalReason !== undefined) result.approval_reason = report.approvalReason || null;
  if (report.approvedBy !== undefined) result.approved_by = report.approvedBy || null;
  if (report.approvedAt !== undefined) result.approved_at = report.approvedAt || null;
  if (report.note !== undefined) result.note = report.note || null;
  return result;
};

/**
 * Lấy tất cả báo cáo công việc
 */
export const getAllDailyWorkReports = async (): Promise<DailyWorkReport[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_work_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformFromSupabase);
  } catch (error) {
    console.error('Error fetching daily work reports from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo theo ID
 */
export const getDailyWorkReportById = async (id: string): Promise<DailyWorkReport | null> => {
  try {
    const { data, error } = await supabase
      .from('daily_work_reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error fetching daily work report from Supabase:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo theo staff_id và ngày
 */
export const getDailyWorkReportByStaffAndDate = async (
  staffId: string,
  date: string
): Promise<DailyWorkReport | null> => {
  try {
    const { data, error } = await supabase
      .from('daily_work_reports')
      .select('*')
      .eq('staff_id', staffId)
      .eq('report_date', date)
      .maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data ? transformFromSupabase(data) : null;
  } catch (error) {
    console.error('Error fetching daily work report by staff and date from Supabase:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo công việc mới
 */
export const createDailyWorkReport = async (report: Omit<DailyWorkReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyWorkReport> => {
  try {
    const id = crypto.randomUUID();
    const transformed = transformToSupabase({
      ...report,
      id,
      createdAt: new Date().toISOString(),
    });
    
    const { data, error } = await supabase
      .from('daily_work_reports')
      .insert({
        id,
        ...transformed,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error creating daily work report in Supabase:', error);
    throw error;
  }
};

/**
 * Cập nhật báo cáo công việc
 */
export const updateDailyWorkReport = async (
  id: string,
  updates: Partial<DailyWorkReport>
): Promise<DailyWorkReport> => {
  try {
    const transformed = transformToSupabase(updates);
    transformed.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('daily_work_reports')
      .update(transformed)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error updating daily work report in Supabase:', error);
    throw error;
  }
};

/**
 * Xác nhận báo cáo công việc
 */
export const approveDailyWorkReport = async (
  id: string,
  approvalStatus: 'Đạt' | 'Chấp nhận' | 'Không đạt',
  approvalReason: string,
  approvedBy: string
): Promise<DailyWorkReport> => {
  try {
    const status = approvalStatus === 'Không đạt' ? 'Khong dat' : approvalStatus === 'Đạt' ? 'Dat' : 'Chap nhan';
    const approvalStatusDB = mapApprovalStatusToDB(approvalStatus);
    
    const { data, error } = await supabase
      .from('daily_work_reports')
      .update({
        status,
        approval_status: approvalStatusDB,
        approval_reason: approvalReason || null,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return transformFromSupabase(data);
  } catch (error) {
    console.error('Error approving daily work report in Supabase:', error);
    throw error;
  }
};

/**
 * Xóa báo cáo công việc
 */
export const deleteDailyWorkReport = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('daily_work_reports')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting daily work report from Supabase:', error);
    throw error;
  }
};

/**
 * Query báo cáo với filter
 */
export const queryDailyWorkReports = async (filters: {
  staffId?: string;
  reportDate?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  approvalStatus?: string;
}): Promise<DailyWorkReport[]> => {
  try {
    let query = supabase.from('daily_work_reports').select('*');
    
    if (filters.staffId) {
      query = query.eq('staff_id', filters.staffId);
    }
    if (filters.reportDate) {
      query = query.eq('report_date', filters.reportDate);
    }
    if (filters.startDate) {
      query = query.gte('report_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('report_date', filters.endDate);
    }
    if (filters.status) {
      // Map Vietnamese status to DB format
      const statusMap: Record<string, string> = {
        'Chờ xác nhận': 'Cho xac nhan',
        'Đạt': 'Dat',
        'Chấp nhận': 'Chap nhan',
        'Không đạt': 'Khong dat',
      };
      const dbStatus = statusMap[filters.status] || filters.status;
      query = query.eq('status', dbStatus);
    }
    if (filters.approvalStatus) {
      // Map Vietnamese approval status to DB format
      const approvalMap: Record<string, string> = {
        'Đạt': 'Dat',
        'Chấp nhận': 'Chap nhan',
        'Không đạt': 'Khong dat',
      };
      const dbApprovalStatus = approvalMap[filters.approvalStatus] || filters.approvalStatus;
      query = query.eq('approval_status', dbApprovalStatus);
    }
    
    const { data, error } = await query
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(transformFromSupabase);
  } catch (error) {
    console.error('Error querying daily work reports from Supabase:', error);
    throw error;
  }
};
