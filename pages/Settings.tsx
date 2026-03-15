/**
 * Settings Page
 * Trang cài đặt hệ thống với mục Phân quyền
 * Hiển thị theo Bộ phận > Vị trí > Vai trò với các view được phép xem
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon, Shield, Save, Eye, ChevronRight, Building2, User, Users } from 'lucide-react';
import { usePermissions } from '../src/hooks/usePermissions';
import { useStaff } from '../src/hooks/useStaff';
import { ModuleKey } from '../src/services/permissionService';

// Định nghĩa các view/module trong hệ thống
const SYSTEM_VIEWS: { key: ModuleKey; label: string; description?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Trang chủ' },
  { key: 'classes', label: 'Lớp học', description: 'Quản lý lớp học' },
  { key: 'schedule', label: 'Thời khoá biểu', description: 'Xem lịch học' },
  { key: 'students', label: 'Khách hàng', description: 'Quản lý học viên' },
  { key: 'leads', label: 'Kinh doanh', description: 'Quản lý khách hàng tiềm năng' },
  { key: 'staff', label: 'Nhân sự', description: 'Quản lý nhân sự' },
  { key: 'contracts', label: 'Tài chính', description: 'Quản lý hợp đồng' },
  { key: 'marketing_tasks', label: 'Task', description: 'Quản lý công việc' },
  { key: 'marketing_kpi', label: 'KPI', description: 'Quản lý KPI' },
  { key: 'resources', label: 'Thư viện tài nguyên', description: 'Tài liệu học tập' },
  { key: 'reports_finance', label: 'Báo cáo tài chính', description: 'Báo cáo tài chính' },
  { key: 'department_goals', label: 'Mục tiêu phòng ban', description: 'KPI phòng ban' },
];

interface PermissionConfig {
  department: string;
  position: string;
  role: string;
  allowedViews: ModuleKey[];
}

export const Settings: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { staff, loading: staffLoading } = useStaff();
  const [activeTab, setActiveTab] = useState<'permissions'>('permissions');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<Record<string, PermissionConfig>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Nhóm staff theo Bộ phận > Vị trí > Vai trò
  const groupedStaff = useMemo(() => {
    if (!staff || staff.length === 0) return {};

    const groups: Record<string, Record<string, Record<string, typeof staff>>> = {};

    staff.forEach((s) => {
      const dept = s.department || 'Chưa phân loại';
      const pos = s.position || 'Chưa phân loại';
      const role = s.role || 'Chưa phân loại';

      if (!groups[dept]) groups[dept] = {};
      if (!groups[dept][pos]) groups[dept][pos] = {};
      if (!groups[dept][pos][role]) groups[dept][pos][role] = [];

      groups[dept][pos][role].push(s);
    });

    return groups;
  }, [staff]);

  // Lấy danh sách unique departments, positions, roles
  const departments = useMemo(() => {
    if (!staff || staff.length === 0) return [];
    const depts = new Set<string>();
    staff.forEach((s) => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [staff]);

  const positions = useMemo(() => {
    if (!staff || staff.length === 0) return [];
    const pos = new Set<string>();
    staff.forEach((s) => {
      if (s.position) pos.add(s.position);
    });
    return Array.from(pos).sort();
  }, [staff]);

  const roles = useMemo(() => {
    if (!staff || staff.length === 0) return [];
    const rls = new Set<string>();
    staff.forEach((s) => {
      if (s.role) rls.add(s.role);
    });
    return Array.from(rls).sort();
  }, [staff]);

  // Toggle expanded state
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle view permission change
  const handleViewToggle = (
    department: string,
    position: string,
    role: string,
    viewKey: ModuleKey,
    checked: boolean
  ) => {
    const key = `${department}|${position}|${role}`;
    setPermissions((prev) => {
      const current = prev[key] || {
        department,
        position,
        role,
        allowedViews: [],
      };

      const allowedViews = checked
        ? [...current.allowedViews, viewKey]
        : current.allowedViews.filter((v) => v !== viewKey);

      setHasChanges(true);
      return {
        ...prev,
        [key]: {
          ...current,
          allowedViews,
        },
      };
    });
  };

  // Check if view is allowed
  const isViewAllowed = (department: string, position: string, role: string, viewKey: ModuleKey): boolean => {
    const key = `${department}|${position}|${role}`;
    const config = permissions[key];
    return config?.allowedViews.includes(viewKey) || false;
  };

  // Save permissions
  const handleSave = async () => {
    // TODO: Implement save to Supabase role_permissions table
    console.log('Saving permissions:', permissions);
    alert('Tính năng lưu phân quyền sẽ được triển khai sau.');
    setHasChanges(false);
  };

  // Chỉ admin mới được truy cập - check sau khi đã gọi tất cả hooks
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Chỉ quản trị viên mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  if (staffLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="text-indigo-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Cài đặt</h2>
              <p className="text-sm text-gray-500 mt-1">Quản lý cấu hình hệ thống</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'permissions'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield size={18} />
              Phân quyền
            </div>
          </button>
        </div>

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Quản lý phân quyền</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cấu hình quyền truy cập theo Bộ phận - Vị trí - Vai trò
                </p>
              </div>
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  Lưu thay đổi
                </button>
              )}
            </div>

            {/* Grouped by Department > Position > Role */}
            <div className="space-y-4">
              {Object.keys(groupedStaff).map((department) => (
                <div key={department} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Department Header */}
                  <div
                    className="bg-indigo-50 p-4 cursor-pointer hover:bg-indigo-100 transition-colors"
                    onClick={() => toggleGroup(`dept_${department}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="text-indigo-600" size={20} />
                        <div>
                          <h4 className="font-semibold text-gray-800">Bộ phận: {department}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {Object.keys(groupedStaff[department]).length} vị trí
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`text-gray-400 transition-transform ${
                          expandedGroups[`dept_${department}`] ? 'rotate-90' : ''
                        }`}
                        size={20}
                      />
                    </div>
                  </div>

                  {/* Positions */}
                  {expandedGroups[`dept_${department}`] && (
                    <div className="bg-white p-4 space-y-3">
                      {Object.keys(groupedStaff[department]).map((position) => (
                        <div key={position} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Position Header */}
                          <div
                            className="bg-blue-50 p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => toggleGroup(`pos_${department}_${position}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <User className="text-blue-600" size={18} />
                                <div>
                                  <h5 className="font-medium text-gray-800">Vị trí: {position}</h5>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {Object.keys(groupedStaff[department][position]).length} vai trò
                                  </p>
                                </div>
                              </div>
                              <ChevronRight
                                className={`text-gray-400 transition-transform ${
                                  expandedGroups[`pos_${department}_${position}`] ? 'rotate-90' : ''
                                }`}
                                size={18}
                              />
                            </div>
                          </div>

                          {/* Roles */}
                          {expandedGroups[`pos_${department}_${position}`] && (
                            <div className="bg-white p-3 space-y-3">
                              {Object.keys(groupedStaff[department][position]).map((role) => {
                                const staffCount = groupedStaff[department][position][role].length;
                                const groupKey = `${department}|${position}|${role}`;

                                return (
                                  <div key={role} className="border border-gray-200 rounded-lg p-4">
                                    {/* Role Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <Users className="text-gray-500" size={16} />
                                        <h6 className="font-medium text-gray-800">Vai trò: {role}</h6>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                          {staffCount} người
                                        </span>
                                      </div>
                                    </div>

                                    {/* Views List */}
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Các view được phép xem:</p>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {SYSTEM_VIEWS.map((view) => (
                                          <label
                                            key={view.key}
                                            className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isViewAllowed(department, position, role, view.key)}
                                              onChange={(e) =>
                                                handleViewToggle(department, position, role, view.key, e.target.checked)
                                              }
                                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <div className="flex items-center gap-1">
                                              <Eye size={14} className="text-gray-500" />
                                              <span className="text-sm text-gray-700">{view.label}</span>
                                            </div>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(groupedStaff).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Chưa có dữ liệu nhân sự để phân quyền</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
