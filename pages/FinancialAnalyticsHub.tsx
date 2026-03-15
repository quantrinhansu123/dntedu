import React, { useState } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Box, Users } from 'lucide-react';
import { FinancialDashboard } from './FinancialDashboard';
import { CashflowReport } from './CashflowReport';
import { NetProfitReport } from './NetProfitReport';
import { AssetManager } from './AssetManager';
import { TeacherDebtTracker } from './TeacherDebtTracker';

export const FinancialAnalyticsHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'cashflow' | 'profit' | 'assets' | 'debt'>('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'cashflow', label: 'Dòng tiền', icon: Wallet },
        { id: 'profit', label: 'Lợi nhuận', icon: TrendingUp },
        { id: 'assets', label: 'Tài sản', icon: Box },
        { id: 'debt', label: 'Công nợ GV', icon: Users },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'dashboard' && <FinancialDashboard />}
                {activeTab === 'cashflow' && <CashflowReport />}
                {activeTab === 'profit' && <NetProfitReport />}
                {activeTab === 'assets' && <AssetManager />}
                {activeTab === 'debt' && <TeacherDebtTracker />}
            </div>
        </div>
    );
};
