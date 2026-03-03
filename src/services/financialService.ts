import {
    FinancialTransaction,
    TransactionType,
    TransactionCategory,
    Asset,
    TeacherDebtRecord,
    Contract,
    StaffSalaryRecord,
    DepreciationHistory
} from '../../types';
// Collection references
const TRANSACTIONS_COLLECTION = 'transactions';
const ASSETS_COLLECTION = 'assets';
const DEPRECIATION_COLLECTION = 'depreciation_history';
const TEACHER_DEBT_COLLECTION = 'teacher_debts';

export const financialService = {
    // ==========================================
    // TRANSACTION MANAGEMENT
    // ==========================================

    async addTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) {
        try {
      //                 ...transaction,
      //                 createdAt: new Date().toISOString()
            return { id: docRef.id, ...transaction };
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    },

    async getTransactions(startDate?: string, endDate?: string, type?: TransactionType) {
        try {

            if (startDate && endDate) {
            }

            if (type) {
            }

        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    },

    async deleteTransaction(id: string) {
        try {
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    },

    // ==========================================
    // ASSET MANAGEMENT
    // ==========================================

    async addAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'monthlyDepreciation' | 'residualValue' | 'status'>) {
        try {
            const monthlyDepreciation = Math.round(asset.cost / asset.usefulLife);
      //                 ...asset,
      //                 monthlyDepreciation,
      //                 residualValue: asset.cost,
      //                 status: 'Đang khấu hao',
      //                 createdAt: new Date().toISOString(),
      //                 updatedAt: new Date().toISOString()
            return { id: docRef.id, ...asset, monthlyDepreciation };
        } catch (error) {
            console.error('Error adding asset:', error);
            throw error;
        }
    },

    async getAssets() {
        try {
        } catch (error) {
            console.error('Error getting assets:', error);
            return [];
        }
    },

    // Run monthly depreciation for all active assets
    async runMonthlyDepreciation(month: number, year: number) {
        try {
            const assets = await this.getAssets();
            const activeAssets = assets.filter(a => a.status === 'Đang khấu hao');

            const depreciationDate = `${year}-${String(month).padStart(2, '0')}-01`; // First day of month

            for (const asset of activeAssets) {
                // Create transaction Record
                await this.addTransaction({
                    date: depreciationDate,
                    amount: asset.monthlyDepreciation,
                    type: TransactionType.EXPENSE,
                    category: this.mapAssetCategoryToExpense(asset.category),
                    description: `Khấu hao tháng ${month}/${year}: ${asset.name}`,
                    paymentMethod: 'Tiền mặt', // Virtual
                    referenceId: asset.id,
                    referenceType: 'Depreciation',
                    createdBy: 'System'
                });

                // Update Asset residual value
                const newResidual = asset.residualValue - asset.monthlyDepreciation;
      //                     residualValue: newResidual,
      //                     status: newResidual <= 0 ? 'Đã khấu hao xong' : 'Đang khấu hao',
      //                     updatedAt: new Date().toISOString()

                // Log history
      //                     assetId: asset.id,
      //                     assetName: asset.name,
      //                     month,
      //                     year,
      //                     amount: asset.monthlyDepreciation,
      //                     date: new Date().toISOString()
            }
        } catch (error) {
            console.error('Error running depreciation:', error);
            throw error;
        }
    },

    mapAssetCategoryToExpense(assetCategory: string): TransactionCategory {
        switch (assetCategory) {
            case 'Phần mềm cho công tác giảng dạy': return TransactionCategory.TEACHING_SOFTWARE;
            case 'Chi phí phần mềm': return TransactionCategory.SOFTWARE_COST;
            case 'Chi phí tài sản hữu hình': return TransactionCategory.ASSET_COST;
            default: return TransactionCategory.OTHER_EXPENSE;
        }
    },

    // ==========================================
    // TEACHER DEBT TRACKING
    // ==========================================

    async updateTeacherDebt(record: Omit<TeacherDebtRecord, 'id'>) {
        // TODO: Implement Supabase query to check if record exists
        // const { data: existing } = await supabase
        //   .from(TEACHER_DEBT_COLLECTION)
        //   .select('*')
        //   .eq('teacherId', record.teacherId)
        //   .eq('month', record.month)
        //   .eq('classId', record.classId)
        //   .limit(1)
        //   .single();

        const remainingDebt = record.totalSalary - record.paidAmount;
        const status = remainingDebt <= 0 ? 'Đã trả hết' : (record.paidAmount > 0 ? 'Trả một phần' : 'Chưa trả');

        // if (existing) {
        //   // Update
        //   const { error } = await supabase
        //     .from(TEACHER_DEBT_COLLECTION)
        //     .update({
        //       ...record,
        //       remainingDebt,
        //       status
        //     })
        //     .eq('id', existing.id);
        //   if (error) throw error;
        // } else {
        //   // Create
        //   const { error } = await supabase
        //     .from(TEACHER_DEBT_COLLECTION)
        //     .insert({
        //       ...record,
        //       remainingDebt,
        //       status
        //     });
        //   if (error) throw error;
        // }
    },

    async getTeacherDebts(teacherId?: string) {
        try {
            if (teacherId) {
            }
        } catch (error) {
            console.error('Error getting teacher debts:', error);
            return [];
        }
    },

    // ==========================================
    // SYNC DATA (REAL)
    // ==========================================

    async syncFinancialData() {
        let addedCount = 0;

        // Helper to normalize date to YYYY-MM-DD
        const formatDate = (dateStr?: string) => {
            if (!dateStr) return new Date().toISOString().split('T')[0];
            // Handle DD/MM/YYYY
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            // Handle ISO or YYYY-MM-DD
            try {
                return new Date(dateStr).toISOString().split('T')[0];
            } catch (e) {
                return new Date().toISOString().split('T')[0];
            }
        };

        // 1. Sync from CONTRACTS (Revenue)
        const contracts = contractsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Contract));

        for (const contract of contracts) {
            // Check if transaction already exists for this contract

            if (exists.empty && contract.paidAmount && contract.paidAmount > 0) {
                // Create Income Transaction
                await this.addTransaction({
                    date: formatDate(contract.startDate), // Normalize Date
                    amount: contract.paidAmount,
                    type: TransactionType.INCOME,
                    category: TransactionCategory.TUITION_FEE,
                    description: `Thu học phí: ${contract.studentName} - ${contract.className}`,
                    paymentMethod: 'Chuyển khoản', // Default
                    referenceId: contract.id,
                    referenceType: 'Contract',
                    createdBy: 'System Sync'
                });
                addedCount++;
            }
        }

        // 2. Sync from PAYROLL (Salaries)
        // Assuming there is a 'salary_records' or similar collection. 
        // Based on previous code, staffSalaryService uses 'salary_records' or similar? 
        // Let's check staffSalaryService usage. It uses STAFF_SALARY_COLLECTION = 'staff_salaries' (inferred) text-based search

        // We will try to fetch 'staff_salaries'
        try {
      //             const salaries = salariesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            for (const salary of salaries) {

                if (exists.empty && salary.finalSalary && salary.status === 'Paid') {
                    // Determine category based on position
                    let category = TransactionCategory.STAFF_SALARY;
                    if (salary.position === 'Giáo Viên Việt' || salary.position === 'Giáo Viên Nước Ngoài') {
                        category = TransactionCategory.TEACHER_SALARY;
                    } else if (salary.position === 'Quản lý') {
                        category = TransactionCategory.MANAGER_SALARY;
                    }

                    await this.addTransaction({
                        date: `${salary.year}-${String(salary.month).padStart(2, '0')}-05`,
                        amount: salary.finalSalary,
                        type: TransactionType.EXPENSE,
                        category: category,
                        description: `Lương tháng ${salary.month}/${salary.year}: ${salary.staffName} (${salary.position})`,
                        paymentMethod: 'Chuyển khoản',
                        referenceId: salary.id,
                        referenceType: 'Salary',
                        createdBy: 'System Sync'
                    });
                    addedCount++;
                }
            }
        } catch (e) {
            console.warn('Could not sync salaries (collection might differ)', e);
        }

        return addedCount;
    },

    async addWithdrawal(amount: number, description: string, date: string = new Date().toISOString().split('T')[0]) {
        return this.addTransaction({
            date,
            amount,
            type: TransactionType.EXPENSE, // Treat as expense for cashflow, separate logic for Net Profit
            category: TransactionCategory.WITHDRAWAL,
            description: description,
            paymentMethod: 'Chuyển khoản',
            referenceType: 'Withdrawal',
            createdBy: 'Admin'
        });
    },
};
