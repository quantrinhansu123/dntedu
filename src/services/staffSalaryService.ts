export interface StaffSalaryRecord {
  id?: string;
  staffId: string;
  staffName: string;
  position: string;
  month: number;
  year: number;
  baseSalary: number;
  workDays: number;
  commission: number;
  allowance: number;
  deduction: number;
  totalSalary: number;
  note?: string;
}

export interface StaffAttendanceLog {
  id?: string;
  staffId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Đúng giờ' | 'Đi muộn' | 'Về sớm' | 'Nghỉ phép' | 'Nghỉ không phép';
  note?: string;
}

const SALARY_COLLECTION = 'staffSalaries';
const ATTENDANCE_COLLECTION = 'staffAttendance';
const STAFF_COLLECTION = 'staff';

// Get staff salaries by month/year - JOIN với staff collection
export const getStaffSalaries = async (month: number, year: number): Promise<StaffSalaryRecord[]> => {
  // TODO: Implement Supabase queries
  // 1. Lấy danh sách nhân viên văn phòng từ staff collection
  // const { data: staffData } = await supabase
  //   .from('staff')
  //   .select('*');
  
  const officeStaff: any[] = []; // staffData?.filter((s: any) => ...) || [];

  // 2. Lấy dữ liệu lương đã có trong tháng này
  // const { data: salaryData } = await supabase
  //   .from('staffSalaries')
  //   .select('*')
  //   .eq('month', month)
  //   .eq('year', year);
  
  const existingSalaries: any[] = []; // salaryData || [];

  // 3. Merge: Với mỗi nhân viên, tìm salary record hoặc tạo default
  const result: StaffSalaryRecord[] = officeStaff.map((staff: any) => {
    const existingSalary = existingSalaries.find(
      (s: any) => s.staffId === staff.id || s.staffName === staff.name
    );

    if (existingSalary) {
      return existingSalary as StaffSalaryRecord;
    }

    // Default salary record nếu chưa có
    return {
      staffId: staff.id,
      staffName: staff.name || staff.staffName || 'N/A',
      position: staff.position || 'Nhân viên',
      month,
      year,
      baseSalary: staff.baseSalary || 0,
      workDays: 0,
      commission: 0,
      allowance: 0,
      deduction: 0,
      totalSalary: 0,
    };
  });

  return result;
};

// Get single staff salary
export const getStaffSalaryById = async (id: string): Promise<StaffSalaryRecord | null> => {
  // TODO: Implement Supabase query
  return null;
};

// Create staff salary record
export const createStaffSalary = async (data: Omit<StaffSalaryRecord, 'id'>): Promise<string> => {
  // TODO: Implement Supabase insert
  // const { data: result, error } = await supabase
  //   .from('staffSalaries')
  //   .insert(data)
  //   .select()
  //   .single();
  // if (error) throw error;
  // return result.id;
  throw new Error('Not implemented');
};

// Update staff salary record
export const updateStaffSalary = async (id: string, data: Partial<StaffSalaryRecord>): Promise<void> => {
  // TODO: Implement Supabase update
  // const { error } = await supabase
  //   .from('staffSalaries')
  //   .update(data)
  //   .eq('id', id);
  // if (error) throw error;
};

// Delete staff salary record
export const deleteStaffSalary = async (id: string): Promise<void> => {
  // TODO: Implement Supabase delete
  // const { error } = await supabase
  //   .from('staffSalaries')
  //   .delete()
  //   .eq('id', id);
  // if (error) throw error;
};

// Get attendance logs for a staff member
export const getStaffAttendance = async (staffId: string, month?: number, year?: number): Promise<StaffAttendanceLog[]> => {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('staffAttendance')
  //   .select('*')
  //   .eq('staffId', staffId);
  
  let logs: StaffAttendanceLog[] = []; // data || [];

  // Filter by month/year if provided
  if (month && year) {
    logs = logs.filter(log => {
      const [d, m, y] = log.date.split('/').map(Number);
      return m === month && y === year;
    });
  }

  return logs;
};

// Create attendance log
export const createAttendanceLog = async (data: Omit<StaffAttendanceLog, 'id'>): Promise<string> => {
  // TODO: Implement Supabase insert
  // const { data: result, error } = await supabase
  //   .from('staffAttendance')
  //   .insert(data)
  //   .select()
  //   .single();
  // if (error) throw error;
  // return result.id;
  throw new Error('Not implemented');
};

// Update attendance log
export const updateAttendanceLog = async (id: string, data: Partial<StaffAttendanceLog>): Promise<void> => {
  // TODO: Implement Supabase update
  // const { error } = await supabase
  //   .from('staffAttendance')
  //   .update(data)
  //   .eq('id', id);
  // if (error) throw error;
};

// Delete attendance log
export const deleteAttendanceLog = async (id: string): Promise<void> => {
  // TODO: Implement Supabase delete
  // const { error } = await supabase
  //   .from('staffAttendance')
  //   .delete()
  //   .eq('id', id);
  // if (error) throw error;
};

// Generate monthly payroll snapshot for all eligible staff
export const generateMonthlyPayroll = async (month: number, year: number): Promise<number> => {
  try {
    // TODO: Get Office Staff from Supabase
    // const { data: staffData } = await supabase
    //   .from('staff')
    //   .select('*');
    
    const officeStaff: any[] = []; // staffData?.filter((s: any) => ...) || [];

    let count = 0;

    for (const staff of officeStaff) {
      // TODO: Check existing salary record with Supabase
      // const { data: existing } = await supabase
      //   .from('staffSalaries')
      //   .select('*')
      //   .eq('staffId', staff.id)
      //   .eq('month', month)
      //   .eq('year', year)
      //   .limit(1)
      //   .single();

      const baseSalary = staff.baseSalary || 0;
      const allowance = staff.allowance || 0;

      // if (existing) {
      //   // Update existing record
      //   await supabase
      //     .from('staffSalaries')
      //     .update({ baseSalary, allowance })
      //     .eq('id', existing.id);
      // } else {
        // Create new record
        const totalSalary = baseSalary + allowance;
        // TODO: Insert with Supabase
        // await supabase.from('staffSalaries').insert({
        //   staffId: staff.id,
        //   staffName: staff.name || 'N/A',
        //   position: staff.position || 'Unknown',
        //   month,
        //   year,
        //   baseSalary,
        //   workDays: 26,
        //   commission: 0,
        //   allowance,
        //   deduction: 0,
        //   totalSalary,
        //   note: 'Auto-generated'
        // });
        count++;
      // }
    }
    return count;
  } catch (error) {
    console.error('Error generating payroll:', error);
    throw error;
  }
};
