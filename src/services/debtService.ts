/**
 * Debt Service
 * Handle student debt management
 */

// ;

const CONTRACTS_COLLECTION = 'contracts';

export interface DebtRecord {
  id: string;
  contractCode: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className: string;
  parentName?: string;
  parentPhone?: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  dueDate?: string;
  createdAt: string;
  status: string;
  note?: string;
}

export const getDebtRecords = async (): Promise<DebtRecord[]> => {
  try {
    // Get contracts with Debt status
    
    
      const data = docSnap.data();
      const totalAmount = data.finalTotal || data.totalAmount || 0;
      const paidAmount = data.paidAmount || 0;
      
      return {
        studentId: data.studentId || '',
        studentName: data.studentName || 'N/A',
        classId: data.classId,
        className: data.className || 'N/A',
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        totalAmount,
        paidAmount,
        debtAmount: totalAmount - paidAmount,
        dueDate: data.dueDate,
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status,
        note: data.note,
      };
    });
  } catch (error) {
    console.error('Error getting debt records:', error);
    throw new Error('Không thể tải danh sách công nợ');
  }
};

export const markAsPaid = async (contractId: string, paidAmount?: number): Promise<void> => {
  try {
      //       status: 'Paid',
      //       paidAmount: paidAmount,
      //       paidAt: new Date().toISOString(),
      //       updatedAt: new Date().toISOString(),
      //     });
  } catch (error) {
    console.error('Error marking as paid:', error);
    throw new Error('Không thể cập nhật trạng thái');
  }
};

export const updateDebtNote = async (contractId: string, note: string): Promise<void> => {
  try {
      //       note,
      //       updatedAt: new Date().toISOString(),
      //     });
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('Không thể cập nhật ghi chú');
  }
};

export const getDebtSummary = async (): Promise<{
  totalDebt: number;
  debtCount: number;
  overdueCount: number;
}> => {
  try {
    const debts = await getDebtRecords();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalDebt: debts.reduce((sum, d) => sum + d.debtAmount, 0),
      debtCount: debts.length,
      overdueCount: debts.filter(d => d.dueDate && d.dueDate < today).length,
    };
  } catch (error) {
    console.error('Error getting debt summary:', error);
    throw new Error('Không thể tải tổng hợp công nợ');
  }
};
