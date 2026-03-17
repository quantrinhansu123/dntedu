/**
 * Marketing KPI Manager Page
 * Quản lý mục tiêu KPI nhân viên Marketing
 * Admin: xem và quản lý KPI tất cả nhân viên. Nhân viên: chỉ xem KPI của bản thân.
 */

import React, { useState, useMemo } from 'react';
import {
    Target, Plus, Edit, Trash2, X, Users, Calendar, Award, User
} from 'lucide-react';
import { useMarketingKpis } from '../src/hooks/useMarketingKpis';
import { useMarketingTasks } from '../src/hooks/useMarketingTasks';
import { useStaff } from '../src/hooks/useStaff';
import { usePermissions } from '../src/hooks/usePermissions';
import { MarketingKpi } from '../src/types/marketingTypes';

export const MarketingKpiManager: React.FC = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const perms = usePermissions();
    const { staffId: currentStaffId, isAdmin } = perms;
    const canCreate = perms.canCreate('marketing_kpi');
    const canEdit = perms.canEdit('marketing_kpi');
    const canDelete = perms.canDelete('marketing_kpi');

    const { kpis, loading, error, createKpi, updateKpi, deleteKpi, calculateKpiPercent, getStaffKpiCompletion, getOverallPerformance } = useMarketingKpis({
        month: selectedMonth,
        staffId: isAdmin ? undefined : (currentStaffId || undefined),
    });
    const { getStaffCompletion } = useMarketingTasks();
    const { staff = [] } = useStaff();

    const [showModal, setShowModal] = useState(false);
    const [editingKpi, setEditingKpi] = useState<MarketingKpi | null>(null);

    // Nhân viên chỉ thấy bản thân; admin thấy tất cả
    const marketingStaff = useMemo(() => {
        if (isAdmin) return staff;
        if (!currentStaffId) return [];
        return staff.filter(s => s.id === currentStaffId);
    }, [staff, isAdmin, currentStaffId]);

    // Group KPIs by staff (đã bị giới hạn theo marketingStaff)
    const kpisByStaff = useMemo(() => {
        const grouped: Record<string, { staff: any; kpis: MarketingKpi[] }> = {};
        marketingStaff.forEach(s => {
            grouped[s.id || ''] = { staff: s, kpis: [] };
        });
        kpis.forEach(kpi => {
            if (grouped[kpi.staffId]) {
                grouped[kpi.staffId].kpis.push(kpi);
            }
        });
        return Object.values(grouped).filter(g => g.kpis.length > 0 || marketingStaff.some(s => s.id === g.staff.id));
    }, [kpis, marketingStaff]);

    // Staff performance summary (một dòng cho nhân viên, nhiều dòng cho admin)
    const staffPerformance = useMemo(() => {
        return marketingStaff.map(s => {
            const taskPercent = getStaffCompletion(s.id || '');
            const kpiPercent = getStaffKpiCompletion(s.id || '');
            const overall = getOverallPerformance(taskPercent, kpiPercent);
            return {
                id: s.id,
                name: s.name,
                taskPercent,
                kpiPercent,
                overall,
            };
        });
    }, [marketingStaff, getStaffCompletion, getStaffKpiCompletion, getOverallPerformance]);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mục tiêu KPI này?')) return;
        try {
            await deleteKpi(id);
        } catch (err) {
            alert('Không thể xóa');
        }
    };

    const myPerformance = staffPerformance[0];
    const showSummaryTable = isAdmin && staffPerformance.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl">
                            <Target className="text-emerald-600" size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {isAdmin ? 'Quản lý KPI' : 'KPI của tôi'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {isAdmin ? 'Thiết lập mục tiêu và theo dõi kết quả nhân viên' : 'Xem mục tiêu và kết quả KPI của bạn'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <Calendar size={18} className="text-gray-500" aria-hidden />
                            <label className="sr-only" htmlFor="kpi-month-picker">Chọn tháng</label>
                            <input
                                id="kpi-month-picker"
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:ring-0 p-0"
                                aria-label="Chọn tháng xem KPI"
                            />
                        </div>
                        {canCreate && (
                            <button
                                onClick={() => { setEditingKpi(null); setShowModal(true); }}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm"
                            >
                                <Plus size={16} /> Thêm KPI
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Employee: single summary card */}
            {!isAdmin && myPerformance && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User size={20} className="text-emerald-600" />
                        Kết quả tháng {selectedMonth}
                    </h3>
                    <div className="text-sm text-gray-600 mb-4">
                        Công thức: <strong>Kết quả = (% Công việc + % Mục tiêu) / 2</strong>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/80 rounded-lg p-4 border border-emerald-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">% Công việc</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${myPerformance.taskPercent}%` }} />
                                </div>
                                <span className="font-bold text-blue-600 min-w-[2.5rem]">{myPerformance.taskPercent}%</span>
                            </div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4 border border-emerald-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">% Mục tiêu KPI</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${myPerformance.kpiPercent}%` }} />
                                </div>
                                <span className="font-bold text-emerald-600 min-w-[2.5rem]">{myPerformance.kpiPercent}%</span>
                            </div>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4 border border-emerald-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kết quả</p>
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-lg font-bold ${myPerformance.overall >= 80 ? 'bg-emerald-100 text-emerald-700' : myPerformance.overall >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {myPerformance.overall}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin: Staff Performance Summary Table */}
            {showSummaryTable && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Award size={20} className="text-emerald-600" />
                        Tổng kết kết quả nhân viên – Tháng {selectedMonth}
                    </h3>
                    <div className="text-sm text-gray-500 mb-4">
                        Công thức: <strong>Kết quả = (% Công việc + % Mục tiêu) / 2</strong>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-emerald-50 text-xs uppercase font-semibold text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Nhân viên</th>
                                    <th className="px-4 py-3 text-center">% Công việc (Task)</th>
                                    <th className="px-4 py-3 text-center">% Mục tiêu (KPI)</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Kết quả (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staffPerformance.map(sp => (
                                    <tr key={sp.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium text-gray-900">{sp.name}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden min-w-[80px]">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${sp.taskPercent}%` }} />
                                                </div>
                                                <span className="font-medium text-blue-600 tabular-nums">{sp.taskPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden min-w-[80px]">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${sp.kpiPercent}%` }} />
                                                </div>
                                                <span className="font-medium text-emerald-600 tabular-nums">{sp.kpiPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${sp.overall >= 80 ? 'bg-emerald-100 text-emerald-700' : sp.overall >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {sp.overall}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* KPI Details by Staff */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-xl p-10 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <p className="text-gray-500 mt-3">Đang tải...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-xl p-8 text-center text-red-500 border border-red-100 rounded-xl">{error}</div>
                ) : kpisByStaff.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <Target className="mx-auto text-gray-300" size={48} />
                        <p className="text-gray-500 mt-3">
                            {isAdmin ? 'Chưa có dữ liệu KPI cho tháng này.' : 'Bạn chưa có mục tiêu KPI nào trong tháng này.'}
                        </p>
                        {isAdmin && <p className="text-sm text-gray-400 mt-1">Thêm KPI để bắt đầu theo dõi.</p>}
                    </div>
                ) : (
                    kpisByStaff.map(({ staff: s, kpis: staffKpis }) => (
                        <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-emerald-600" />
                                        <span className="font-semibold text-gray-800">{s.name}</span>
                                        <span className="text-xs text-gray-500">({s.position})</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">
                                        KPI: {getStaffKpiCompletion(s.id || '')}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                {staffKpis.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">Chưa có mục tiêu KPI</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-gray-500 border-b">
                                                <tr>
                                                    <th className="text-left py-2.5">Mục tiêu</th>
                                                    <th className="text-center py-2.5">Chỉ tiêu</th>
                                                    <th className="text-center py-2.5">Thực tế</th>
                                                    <th className="text-center py-2.5">Tỷ trọng</th>
                                                    <th className="text-center py-2.5">% Đạt</th>
                                                    {(canEdit || canDelete) && <th className="text-center py-2.5">Hành động</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {staffKpis.map(kpi => {
                                                    const percent = calculateKpiPercent(kpi);
                                                    return (
                                                        <tr key={kpi.id} className="hover:bg-gray-50/80">
                                                            <td className="py-2.5">
                                                                <span className="font-medium text-gray-800">{kpi.targetName}</span>
                                                                {kpi.notes && <p className="text-xs text-gray-400 mt-0.5">{kpi.notes}</p>}
                                                            </td>
                                                            <td className="py-2.5 text-center text-gray-600">{kpi.targetValue} {kpi.unit}</td>
                                                            <td className="py-2.5 text-center font-medium text-gray-800">{kpi.actualValue} {kpi.unit}</td>
                                                            <td className="py-2.5 text-center text-gray-600">{kpi.weight}%</td>
                                                            <td className="py-2.5 text-center">
                                                                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${percent >= 100 ? 'bg-emerald-100 text-emerald-700' : percent >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {percent}%
                                                                </span>
                                                            </td>
                                                            {(canEdit || canDelete) && (
                                                                <td className="py-2.5 text-center">
                                                                    {canEdit && (
                                                                        <button onClick={() => { setEditingKpi(kpi); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded" title="Sửa">
                                                                            <Edit size={14} />
                                                                        </button>
                                                                    )}
                                                                    {canDelete && (
                                                                        <button onClick={() => kpi.id && handleDelete(kpi.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Xóa">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <KpiModal
                    kpi={editingKpi}
                    staff={marketingStaff}
                    selectedMonth={selectedMonth}
                    onClose={() => { setShowModal(false); setEditingKpi(null); }}
                    onSubmit={async (data) => {
                        if (editingKpi?.id) {
                            await updateKpi(editingKpi.id, data);
                        } else {
                            await createKpi(data as any);
                        }
                        setShowModal(false);
                        setEditingKpi(null);
                    }}
                />
            )}
        </div>
    );
};

// KPI Modal
interface KpiModalProps {
    kpi?: MarketingKpi | null;
    staff: any[];
    selectedMonth: string;
    onClose: () => void;
    onSubmit: (data: Partial<MarketingKpi>) => Promise<void>;
}

const KpiModal: React.FC<KpiModalProps> = ({ kpi, staff, selectedMonth, onClose, onSubmit }) => {
    // Get department from existing KPI's staff or default to empty
    const existingStaff = kpi ? staff.find(s => s.id === kpi.staffId) : null;
    const initialDepartment = existingStaff?.department || '';
    const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartment);

    const [formData, setFormData] = useState({
        staffId: kpi?.staffId || '',
        staffName: kpi?.staffName || '',
        month: kpi?.month || selectedMonth,
        targetName: kpi?.targetName || '',
        targetValue: kpi?.targetValue || 0,
        actualValue: kpi?.actualValue || 0,
        weight: kpi?.weight || 100,
        unit: kpi?.unit || '',
        notes: kpi?.notes || '',
    });
    const [loading, setLoading] = useState(false);

    // Normalize department name for comparison (case-insensitive, trim spaces)
    const normalizeDepartment = (dept: string | undefined | null): string => {
        if (!dept) return '';
        return dept.trim().toLowerCase();
    };

    // Departments list
    const DEPARTMENTS = ['Điều hành', 'kinh doanh', 'chuyên môn', 'marketing', 'kế toán', 'nhân sự'];
    
    // Get unique departments from actual staff data
    const availableDepartments = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));

    // Filter staff by selected department (case-insensitive)
    const filteredStaff = selectedDepartment 
        ? staff.filter(s => normalizeDepartment(s.department) === normalizeDepartment(selectedDepartment))
        : [];

    const handleDepartmentChange = (department: string) => {
        setSelectedDepartment(department);
        // Reset staff selection if current staff doesn't belong to new department
        if (formData.staffId) {
            const currentStaff = staff.find(s => s.id === formData.staffId);
            if (normalizeDepartment(currentStaff?.department) !== normalizeDepartment(department)) {
                setFormData({
                    ...formData,
                    staffId: '',
                    staffName: '',
                });
            }
        }
    };

    const handleStaffChange = (staffId: string) => {
        const selectedStaff = filteredStaff.find(s => s.id === staffId);
        setFormData({
            ...formData,
            staffId,
            staffName: selectedStaff?.name || '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment || !formData.staffId || !formData.targetName || formData.targetValue <= 0) {
            alert('Vui lòng điền đầy đủ thông tin (Phòng ban, Nhân viên, Tên mục tiêu, Chỉ tiêu)');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">{kpi ? 'Sửa KPI' : 'Thêm KPI mới'}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Đóng" aria-label="Đóng"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="kpi-modal-department" className="block text-sm font-medium text-gray-700 mb-1">Phòng ban <span className="text-red-500">*</span></label>
                        <select 
                            id="kpi-modal-department"
                            value={selectedDepartment} 
                            onChange={e => handleDepartmentChange(e.target.value)} 
                            required
                            aria-label="Chọn phòng ban"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            <option value="">-- Chọn phòng ban --</option>
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                            {/* Add departments from actual data that are not in DEPARTMENTS list */}
                            {availableDepartments
                                .filter(dept => !DEPARTMENTS.includes(dept))
                                .map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="kpi-modal-staff" className="block text-sm font-medium text-gray-700 mb-1">Nhân viên <span className="text-red-500">*</span></label>
                        <select 
                            id="kpi-modal-staff"
                            value={formData.staffId} 
                            onChange={e => handleStaffChange(e.target.value)} 
                            required
                            disabled={!selectedDepartment}
                            aria-label="Chọn nhân viên"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">-- Chọn nhân viên --</option>
                            {filteredStaff.length === 0 && selectedDepartment ? (
                                <option value="" disabled>Không có nhân viên trong phòng ban này</option>
                            ) : (
                                filteredStaff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} {s.position ? `(${s.position})` : ''}</option>
                                ))
                            )}
                        </select>
                        {!selectedDepartment && (
                            <p className="text-xs text-gray-500 mt-1">Vui lòng chọn phòng ban trước</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="kpi-modal-target-name" className="block text-sm font-medium text-gray-700 mb-1">Tên mục tiêu <span className="text-red-500">*</span></label>
                        <input id="kpi-modal-target-name" type="text" required value={formData.targetName} onChange={e => setFormData({ ...formData, targetName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="VD: Số lead mới, Số hợp đồng..." aria-label="Tên mục tiêu KPI" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="kpi-modal-target-value" className="block text-sm font-medium text-gray-700 mb-1">Chỉ tiêu <span className="text-red-500">*</span></label>
                            <input id="kpi-modal-target-value" type="number" min={1} required value={formData.targetValue} onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" aria-label="Chỉ tiêu" />
                        </div>
                        <div>
                            <label htmlFor="kpi-modal-actual-value" className="block text-sm font-medium text-gray-700 mb-1">Thực tế</label>
                            <input id="kpi-modal-actual-value" type="number" min={0} value={formData.actualValue} onChange={e => setFormData({ ...formData, actualValue: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" aria-label="Giá trị thực tế" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="kpi-modal-weight" className="block text-sm font-medium text-gray-700 mb-1">Tỷ trọng (%)</label>
                            <input id="kpi-modal-weight" type="number" min={1} max={100} value={formData.weight} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" aria-label="Tỷ trọng phần trăm" />
                        </div>
                        <div>
                            <label htmlFor="kpi-modal-unit" className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                            <input id="kpi-modal-unit" type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="leads, HĐ, ..." aria-label="Đơn vị" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="kpi-modal-notes" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea id="kpi-modal-notes" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" aria-label="Ghi chú" />
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
