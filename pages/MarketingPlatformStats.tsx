/**
 * Marketing Platform Stats Page
 * Theo dõi chỉ số Marketing trên từng nền tảng
 * Dữ liệu chính lấy tự động từ Kho dữ liệu khách hàng (leads)
 */

import React, { useState, useMemo } from 'react';
import {
    BarChart3, Plus, Edit, Trash2, X, Calendar, TrendingUp,
    MessageCircle, Users, MousePointer, Globe
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { useMarketingPlatforms, usePlatformStats } from '../src/hooks/useMarketingPlatforms';
import { MarketingPlatform, PlatformMonthlyStats } from '../src/types/marketingTypes';
import { useLeads } from '../src/hooks/useLeads';
import type { Lead } from '../src/services/leadService';

export const MarketingPlatformStats: React.FC = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const { platforms, loading: platformLoading, createPlatform, updatePlatform, deletePlatform } = useMarketingPlatforms();
    const {
        stats: dbStats,
        loading: statsLoading,
        createStats,
        updateStats,
        refetch: refetchStats,
    } = usePlatformStats(selectedMonth);
    const { leads, loading: leadsLoading } = useLeads();

    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<MarketingPlatform | null>(null);
    const [editingStats, setEditingStats] = useState<{ platform: MarketingPlatform; stats?: PlatformMonthlyStats } | null>(null);

    // Helper: kiểm tra lead thuộc tháng đang chọn
    const isLeadInSelectedMonth = (lead: Lead): boolean => {
        if (!lead.createdAt) return false;
        // createdAt dạng ISO: YYYY-MM-DD...
        return lead.createdAt.startsWith(selectedMonth);
    };

    // Thống kê leads theo nguồn (source) trong tháng được chọn
    const leadStatsBySource = useMemo(() => {
        const result: Record<string, { newFollowers: number; interactions: number; newMessages: number }> = {};

        const ensureSource = (source: string) => {
            if (!result[source]) {
                result[source] = { newFollowers: 0, interactions: 0, newMessages: 0 };
            }
            return result[source];
        };

        leads.forEach(lead => {
            if (!isLeadInSelectedMonth(lead)) return;
            const bucket = ensureSource(lead.source);

            // Quy ước:
            // - newFollowers: tổng số lead mới theo nguồn trong tháng
            bucket.newFollowers += 1;

            // - interactions: lead đang được chăm sóc/tương tác
            if (['Đang liên hệ', 'Quan tâm', 'Hẹn test', 'Đã test'].includes(lead.status)) {
                bucket.interactions += 1;
            }

            // - newMessages: lead ở trạng thái "Mới"
            if (lead.status === 'Mới') {
                bucket.newMessages += 1;
            }
        });

        return result;
    }, [leads, selectedMonth]);

    // Kết hợp danh sách nền tảng với:
    // - leadStatsBySource: số liệu tự động từ Kho dữ liệu khách hàng
    // - dbStats: số liệu bổ sung (reach, clicks, ghi chú) lưu trong Supabase
    const platformsWithStats = useMemo(() => {
        return platforms
            .filter(p => p.isActive)
            .map(platform => {
                const sourceStats = leadStatsBySource[platform.name] || {
                    newFollowers: 0,
                    interactions: 0,
                    newMessages: 0,
                };
                const platformDbStats = dbStats.find(s => s.platformId === platform.id) || null;
                return {
                    platform,
                    leadStats: sourceStats,
                    dbStats: platformDbStats,
                };
            });
    }, [platforms, leadStatsBySource, dbStats]);

    // Tổng quan từ leadStatsBySource
    const summary = useMemo(() => {
        return Object.values(leadStatsBySource).reduce(
            (acc, s) => {
                acc.totalFollowers += s.newFollowers;
                acc.totalInteractions += s.interactions;
                acc.totalMessages += s.newMessages;
                return acc;
            },
            { totalFollowers: 0, totalInteractions: 0, totalMessages: 0 }
        );
    }, [leadStatsBySource]);

    // Dữ liệu cho biểu đồ cột: theo nguồn (tất cả nền tảng đang bật)
    const barChartData = useMemo(() => {
        return platforms
            .filter(p => p.isActive)
            .map(p => {
                const s = leadStatsBySource[p.name] || { newFollowers: 0, interactions: 0, newMessages: 0 };
                return {
                    name: p.name,
                    leadMoi: s.newFollowers,
                    dangTuongTac: s.interactions,
                    leadMoiTao: s.newMessages,
                };
            });
    }, [platforms, leadStatsBySource]);

    // Dữ liệu cho biểu đồ tròn: phân bố lead theo nguồn trong tháng
    const pieChartData = useMemo(() => {
        return Object.entries(leadStatsBySource)
            .filter(([, s]) => s.newFollowers > 0)
            .map(([name, s]) => ({ name, value: s.newFollowers }));
    }, [leadStatsBySource]);

    const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#EF4444'];

    const handleDeletePlatform = async (id: string) => {
        if (!confirm('Xóa nền tảng này?')) return;
        try {
            await deletePlatform(id);
        } catch (err) {
            alert('Không thể xóa');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <BarChart3 className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Thống kê Nền tảng Marketing</h2>
                            <p className="text-sm text-gray-500">Theo dõi chỉ số trên từng kênh tiếp thị</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <button
                            onClick={() => { setEditingPlatform(null); setShowPlatformModal(true); }}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                            <Plus size={16} /> Thêm nền tảng
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    icon={<Users size={20} />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    label="Lượt theo dõi mới"
                    value={summary.totalFollowers.toLocaleString()}
                />
                <SummaryCard
                    icon={<TrendingUp size={20} />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    label="Lượt tương tác"
                    value={summary.totalInteractions.toLocaleString()}
                />
                <SummaryCard
                    icon={<MessageCircle size={20} />}
                    iconBg="bg-orange-100"
                    iconColor="text-orange-600"
                    label="Tin nhắn mới"
                    value={summary.totalMessages.toLocaleString()}
                />
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Biểu đồ cột: so sánh theo nguồn */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead theo nguồn (tháng {selectedMonth})</h3>
                    {barChartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Chưa có nền tảng nào. Thêm nền tảng để xem biểu đồ.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip
                                    formatter={(value: number) => [value, '']}
                                    labelFormatter={(label) => `Nguồn: ${label}`}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                                <Legend />
                                <Bar dataKey="leadMoi" name="Lead mới" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="dangTuongTac" name="Đang tương tác" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="leadMoiTao" name="Lead trạng thái Mới" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {/* Biểu đồ tròn: phân bố theo nguồn */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Phân bố lead theo nguồn</h3>
                    {pieChartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => [value, name]}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformLoading || statsLoading || leadsLoading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Đang tải...</div>
                ) : platformsWithStats.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        <Globe size={48} className="mx-auto mb-2 opacity-20" />
                        Chưa có nền tảng nào
                    </div>
                ) : platformsWithStats.map(({ platform, leadStats, dbStats: platformStats }) => (
                    <div key={platform.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div
                            className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
                            style={{ backgroundColor: platform.color ? `${platform.color}15` : '#f3f4f6' }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{platform.icon || '🌐'}</span>
                                <span className="font-semibold text-gray-800">{platform.name}</span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => { setEditingStats({ platform, stats: platformStats || undefined }); setShowStatsModal(true); }}
                                    className="p-1 text-gray-400 hover:text-purple-600" title="Cập nhật số liệu"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => { setEditingPlatform(platform); setShowPlatformModal(true); }}
                                    className="p-1 text-gray-400 hover:text-blue-600" title="Sửa nền tảng"
                                >
                                    <Globe size={16} />
                                </button>
                                <button
                                    onClick={() => platform.id && handleDeletePlatform(platform.id)}
                                    className="p-1 text-gray-400 hover:text-red-600" title="Xóa"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <StatRow icon={<Users size={16} />} label="Theo dõi mới (lead mới)" value={leadStats.newFollowers} color="text-blue-600" />
                            <StatRow icon={<TrendingUp size={16} />} label="Lead đang tương tác" value={leadStats.interactions} color="text-green-600" />
                            <StatRow icon={<MessageCircle size={16} />} label="Lead mới tạo" value={leadStats.newMessages} color="text-orange-600" />
                            {platformStats?.reach !== undefined && (
                                <StatRow icon={<Globe size={16} />} label="Tiếp cận" value={platformStats.reach} color="text-purple-600" />
                            )}
                            {platformStats?.clicks !== undefined && (
                                <StatRow icon={<MousePointer size={16} />} label="Click" value={platformStats.clicks} color="text-indigo-600" />
                            )}
                            {!platformStats && (
                                <p className="text-xs text-gray-400 text-center py-2">Chưa có số liệu bổ sung tháng này (reach, click)</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Platform Modal */}
            {showPlatformModal && (
                <PlatformModal
                    platform={editingPlatform}
                    onClose={() => { setShowPlatformModal(false); setEditingPlatform(null); }}
                    onSubmit={async (data) => {
                        if (editingPlatform?.id) {
                            await updatePlatform(editingPlatform.id, data);
                        } else {
                            await createPlatform(data as any);
                        }
                        setShowPlatformModal(false);
                        setEditingPlatform(null);
                    }}
                />
            )}

            {/* Stats Modal */}
            {showStatsModal && editingStats && (
                <StatsModal
                    platform={editingStats.platform}
                    stats={editingStats.stats}
                    month={selectedMonth}
                    onClose={() => { setShowStatsModal(false); setEditingStats(null); }}
                    onSubmit={async (data) => {
                        if (editingStats.stats?.id) {
                            await updateStats(editingStats.stats.id, {
                                reach: data.reach,
                                clicks: data.clicks,
                                notes: data.notes,
                            });
                        } else {
                            await createStats({
                                platformId: editingStats.platform.id || '',
                                platformName: editingStats.platform.name,
                                month: selectedMonth,
                                newFollowers: 0,
                                interactions: 0,
                                newMessages: 0,
                                reach: data.reach,
                                clicks: data.clicks,
                                notes: data.notes,
                            } as any);
                        }
                        setShowStatsModal(false);
                        setEditingStats(null);
                        refetchStats();
                    }}
                />
            )}
        </div>
    );
};

// Summary Card
const SummaryCard: React.FC<{ icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string }> =
    ({ icon, iconBg, iconColor, label, value }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
                <div className={`${iconBg} p-2 rounded-lg ${iconColor}`}>{icon}</div>
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );

// Stat Row
const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> =
    ({ icon, label, value, color }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <span className={`font-bold ${color}`}>{value.toLocaleString()}</span>
        </div>
    );

// Platform Modal
interface PlatformModalProps {
    platform?: MarketingPlatform | null;
    onClose: () => void;
    onSubmit: (data: Partial<MarketingPlatform>) => Promise<void>;
}

const PlatformModal: React.FC<PlatformModalProps> = ({ platform, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: platform?.name || '',
        icon: platform?.icon || '🌐',
        color: platform?.color || '#6366F1',
        isActive: platform?.isActive ?? true,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Vui lòng nhập tên nền tảng');
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
                    <h3 className="text-xl font-bold text-gray-800">{platform ? 'Sửa nền tảng' : 'Thêm nền tảng mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nền tảng <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="VD: Facebook, Zalo, TikTok..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                            <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-2xl text-center" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                            <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Stats Modal
interface StatsModalProps {
    platform: MarketingPlatform;
    stats?: PlatformMonthlyStats;
    month: string;
    onClose: () => void;
    onSubmit: (data: Partial<PlatformMonthlyStats>) => Promise<void>;
}

const StatsModal: React.FC<StatsModalProps> = ({ platform, stats, month, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        newFollowers: stats?.newFollowers || 0,
        interactions: stats?.interactions || 0,
        newMessages: stats?.newMessages || 0,
        reach: stats?.reach || 0,
        clicks: stats?.clicks || 0,
        notes: stats?.notes || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span>{platform.icon}</span> {platform.name}
                        </h3>
                        <p className="text-sm text-gray-500">Cập nhật số liệu tháng {month}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Theo dõi mới</label>
                            <input type="number" min={0} value={formData.newFollowers} onChange={e => setFormData({ ...formData, newFollowers: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tương tác</label>
                            <input type="number" min={0} value={formData.interactions} onChange={e => setFormData({ ...formData, interactions: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tin nhắn</label>
                            <input type="number" min={0} value={formData.newMessages} onChange={e => setFormData({ ...formData, newMessages: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiếp cận</label>
                            <input type="number" min={0} value={formData.reach} onChange={e => setFormData({ ...formData, reach: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Click</label>
                            <input type="number" min={0} value={formData.clicks} onChange={e => setFormData({ ...formData, clicks: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
