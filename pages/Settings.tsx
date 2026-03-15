/**
 * Settings Page
 * Trang cài đặt hệ thống với mục Phân quyền
 * Hiển thị theo Bộ phận với các view được phép xem
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon, Shield, Save, Eye, ChevronRight, Building2, Users, CheckSquare, Square, Building, Upload } from 'lucide-react';
import { usePermissions } from '../src/hooks/usePermissions';
import { useStaff } from '../src/hooks/useStaff';
import { useAuth } from '../src/hooks/useAuth';
import { ModuleKey } from '../src/services/permissionService';
import {
  getDepartmentPermissions,
  saveAllDepartmentPermissions,
  DepartmentPermission,
} from '../src/services/departmentPermissionService';
import {
  getCenterInfo,
  saveCenterInfo,
  CenterInfo,
} from '../src/services/centerInfoService';

// Định nghĩa cấu trúc menu cha-con
interface MenuGroup {
  id: string;
  label: string;
  views: { key: ModuleKey; label: string; description?: string }[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Trang chủ',
    views: [
      { key: 'dashboard', label: 'Dashboard', description: 'Trang chủ' },
    ],
  },
  {
    id: 'training',
    label: 'Đào Tạo',
    views: [
      { key: 'classes', label: 'Lớp học', description: 'Quản lý lớp học' },
      { key: 'schedule', label: 'Thời khoá biểu', description: 'Xem lịch học' },
      { key: 'holidays', label: 'Lịch nghỉ', description: 'Quản lý lịch nghỉ' },
      { key: 'attendance', label: 'Điểm danh', description: 'Điểm danh học viên' },
      { key: 'attendance_history', label: 'Lịch sử điểm danh', description: 'Xem lịch sử điểm danh' },
      { key: 'enrollment_history', label: 'Lịch sử ghi danh', description: 'Xem lịch sử ghi danh' },
      { key: 'tutoring', label: 'Dạy kèm', description: 'Quản lý dạy kèm' },
      { key: 'homework', label: 'Bài tập', description: 'Quản lý bài tập' },
    ],
  },
  {
    id: 'resources',
    label: 'Tài nguyên trung tâm',
    views: [
      { key: 'resources', label: 'Tài nguyên trung tâm', description: 'Thư viện tài nguyên' },
    ],
  },
  {
    id: 'customers',
    label: 'Khách Hàng',
    views: [
      { key: 'students', label: 'Học viên', description: 'Quản lý học viên' },
      { key: 'students_reserved', label: 'Học viên bảo lưu', description: 'Học viên đang bảo lưu' },
      { key: 'students_dropped', label: 'Học viên nghỉ học', description: 'Học viên đã nghỉ học' },
      { key: 'students_trial', label: 'Học viên thử', description: 'Học viên học thử' },
      { key: 'parents', label: 'Phụ huynh', description: 'Quản lý phụ huynh' },
      { key: 'feedback', label: 'Phản hồi', description: 'Quản lý phản hồi' },
      { key: 'service_dashboard', label: 'Chăm sóc khách hàng', description: 'Dashboard CSKH' },
    ],
  },
  {
    id: 'business',
    label: 'Kinh Doanh',
    views: [
      { key: 'leads', label: 'Kho dữ liệu KH', description: 'Quản lý khách hàng tiềm năng' },
      { key: 'campaigns', label: 'Chiến dịch', description: 'Quản lý chiến dịch marketing' },
      { key: 'marketing_tasks', label: 'Quản lý Task', description: 'Quản lý công việc marketing' },
      { key: 'marketing_kpi', label: 'Mục tiêu KPI', description: 'Quản lý KPI marketing' },
      { key: 'marketing_platforms', label: 'Thống kê nền tảng', description: 'Thống kê nền tảng marketing' },
    ],
  },
  {
    id: 'hr',
    label: 'Nhân sự',
    views: [
      { key: 'staff', label: 'Quản lý Nhân sự', description: 'Quản lý nhân sự' },
      { key: 'salary_config', label: 'Cấu hình lương', description: 'Cấu hình lương và thưởng' },
      { key: 'work_confirmation', label: 'Xác nhận công việc', description: 'Xác nhận công việc nhân viên' },
      { key: 'salary_teacher', label: 'Lương giáo viên', description: 'Báo cáo lương giáo viên' },
      { key: 'salary_staff', label: 'Lương nhân viên', description: 'Báo cáo lương nhân viên' },
      { key: 'department_goals', label: 'Mục tiêu phòng ban', description: 'KPI phòng ban' },
      { key: 'teacher_goals', label: 'Mục tiêu giáo viên', description: 'KPI giáo viên' },
    ],
  },
  {
    id: 'finance',
    label: 'Tài chính',
    views: [
      { key: 'contracts', label: 'Quản lý hợp đồng', description: 'Quản lý hợp đồng học viên' },
      { key: 'invoices', label: 'Hóa đơn bán sách', description: 'Quản lý hóa đơn' },
      { key: 'debt', label: 'Quản lý công nợ', description: 'Quản lý công nợ' },
      { key: 'revenue', label: 'Doanh thu', description: 'Quản lý doanh thu' },
    ],
  },
  {
    id: 'reports',
    label: 'Báo Cáo',
    views: [
      { key: 'reports_training', label: 'Báo cáo đào tạo', description: 'Báo cáo đào tạo' },
      { key: 'reports_finance', label: 'Báo cáo tài chính', description: 'Báo cáo tài chính' },
    ],
  },
];

export const Settings: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { user } = useAuth();
  const { staff, loading: staffLoading } = useStaff();
  const [activeTab, setActiveTab] = useState<'permissions' | 'center-info'>('permissions');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedMenuGroups, setExpandedMenuGroups] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<Record<string, DepartmentPermission>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Center Info state
  const [centerInfo, setCenterInfo] = useState<Partial<CenterInfo>>({});
  const [centerInfoLoading, setCenterInfoLoading] = useState(true);
  const [centerInfoSaving, setCenterInfoSaving] = useState(false);

  // Lấy danh sách unique departments
  const departments = useMemo(() => {
    if (!staff || staff.length === 0) return [];
    const depts = new Set<string>();
    staff.forEach((s) => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [staff]);

  // Đếm số nhân viên theo bộ phận
  const departmentStaffCount = useMemo(() => {
    const counts: Record<string, number> = {};
    if (staff) {
      staff.forEach((s) => {
        const dept = s.department || 'Chưa phân loại';
        counts[dept] = (counts[dept] || 0) + 1;
      });
    }
    return counts;
  }, [staff]);

  // Load permissions từ database khi component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const deptPermissions = await getDepartmentPermissions();
        setPermissions(deptPermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && !staffLoading) {
      loadPermissions();
    }
  }, [isAdmin, staffLoading]);

  // Load center info khi component mount
  useEffect(() => {
    const loadCenterInfo = async () => {
      try {
        setCenterInfoLoading(true);
        const info = await getCenterInfo();
        if (info) {
          setCenterInfo(info);
        }
      } catch (error) {
        console.error('Error loading center info:', error);
      } finally {
        setCenterInfoLoading(false);
      }
    };

    if (isAdmin) {
      loadCenterInfo();
    }
  }, [isAdmin]);

  // Toggle expanded state for department
  const toggleGroup = (department: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [department]: !prev[department],
    }));
  };

  // Toggle expanded state for menu group
  const toggleMenuGroup = (menuGroupId: string) => {
    setExpandedMenuGroups((prev) => ({
      ...prev,
      [menuGroupId]: !prev[menuGroupId],
    }));
  };

  // Handle view permission change
  const handleViewToggle = (department: string, viewKey: ModuleKey, checked: boolean) => {
    setPermissions((prev) => {
      const current = prev[department] || {
        department,
        allowedViews: [],
      };

      const allowedViews = checked
        ? [...current.allowedViews, viewKey]
        : current.allowedViews.filter((v) => v !== viewKey);

      setHasChanges(true);
      return {
        ...prev,
        [department]: {
          ...current,
          allowedViews,
        },
      };
    });
  };

  // Check if view is allowed
  const isViewAllowed = (department: string, viewKey: ModuleKey): boolean => {
    const config = permissions[department];
    return config?.allowedViews.includes(viewKey) || false;
  };

  // Check if all views in a menu group are allowed
  const areAllViewsAllowed = (department: string, menuGroup: MenuGroup): boolean => {
    return menuGroup.views.every((view) => isViewAllowed(department, view.key));
  };

  // Check if some views in a menu group are allowed
  const areSomeViewsAllowed = (department: string, menuGroup: MenuGroup): boolean => {
    return menuGroup.views.some((view) => isViewAllowed(department, view.key));
  };

  // Toggle all views in a menu group
  const handleToggleAllViews = (department: string, menuGroup: MenuGroup) => {
    const allAllowed = areAllViewsAllowed(department, menuGroup);
    
    setPermissions((prev) => {
      const current = prev[department] || {
        department,
        allowedViews: [],
      };

      let allowedViews: ModuleKey[];
      if (allAllowed) {
        // Uncheck all views in this group
        allowedViews = current.allowedViews.filter(
          (viewKey) => !menuGroup.views.some((v) => v.key === viewKey)
        );
      } else {
        // Check all views in this group
        const groupViewKeys = menuGroup.views.map((v) => v.key);
        const existingViews = current.allowedViews.filter(
          (viewKey) => !groupViewKeys.includes(viewKey)
        );
        allowedViews = [...existingViews, ...groupViewKeys];
      }

      setHasChanges(true);
      return {
        ...prev,
        [department]: {
          ...current,
          allowedViews,
        },
      };
    });
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      await saveAllDepartmentPermissions(permissions);
      setHasChanges(false);
      alert('Đã lưu phân quyền thành công!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Không thể lưu phân quyền. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Save center info
  const handleSaveCenterInfo = async () => {
    try {
      setCenterInfoSaving(true);
      await saveCenterInfo(centerInfo, user?.uid);
      alert('Đã lưu thông tin trung tâm thành công!');
    } catch (error) {
      console.error('Error saving center info:', error);
      alert('Không thể lưu thông tin trung tâm. Vui lòng thử lại.');
    } finally {
      setCenterInfoSaving(false);
    }
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

  if (staffLoading || loading) {
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
          <button
            onClick={() => setActiveTab('center-info')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'center-info'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building size={18} />
              Thông tin trung tâm
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
                  Cấu hình quyền truy cập theo Bộ phận. Nhân viên ở bộ phận nào sẽ xem được các view được chọn cho bộ phận đó.
                </p>
              </div>
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>

            {/* Grouped by Department */}
            <div className="space-y-4">
              {departments.map((department) => (
                <div key={department} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Department Header */}
                  <div
                    className="bg-indigo-50 p-4 cursor-pointer hover:bg-indigo-100 transition-colors"
                    onClick={() => toggleGroup(department)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="text-indigo-600" size={20} />
                        <div>
                          <h4 className="font-semibold text-gray-800">Bộ phận: {department}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {departmentStaffCount[department] || 0} nhân viên
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`text-gray-400 transition-transform ${
                          expandedGroups[department] ? 'rotate-90' : ''
                        }`}
                        size={20}
                      />
                    </div>
                  </div>

                  {/* Views List - Grouped by Menu */}
                  {expandedGroups[department] && (
                    <div className="bg-white p-4">
                      <p className="text-sm font-medium text-gray-700 mb-4">
                        Các view được phép xem cho bộ phận này:
                      </p>
                      <div className="space-y-4">
                        {MENU_GROUPS.map((menuGroup) => {
                          const allAllowed = areAllViewsAllowed(department, menuGroup);
                          const someAllowed = areSomeViewsAllowed(department, menuGroup);
                          const isExpanded = expandedMenuGroups[`${department}_${menuGroup.id}`] ?? true;

                          return (
                            <div key={menuGroup.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Menu Group Header */}
                              <div className="bg-gray-50 p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <button
                                    onClick={() => toggleMenuGroup(`${department}_${menuGroup.id}`)}
                                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors"
                                  >
                                    <ChevronRight
                                      className={`text-gray-400 transition-transform ${
                                        isExpanded ? 'rotate-90' : ''
                                      }`}
                                      size={16}
                                    />
                                    <span className="font-semibold text-sm">{menuGroup.label}</span>
                                  </button>
                                  <span className="text-xs text-gray-500">
                                    ({menuGroup.views.length} mục)
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleToggleAllViews(department, menuGroup)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                >
                                  {allAllowed ? (
                                    <>
                                      <CheckSquare size={14} />
                                      Bỏ chọn tất cả
                                    </>
                                  ) : (
                                    <>
                                      <Square size={14} />
                                      Chọn tất cả
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Menu Group Views */}
                              {isExpanded && (
                                <div className="p-3 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {menuGroup.views.map((view) => (
                                      <label
                                        key={view.key}
                                        className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-colors ${
                                          isViewAllowed(department, view.key)
                                            ? 'border-indigo-300 bg-indigo-50'
                                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isViewAllowed(department, view.key)}
                                          onChange={(e) =>
                                            handleViewToggle(department, view.key, e.target.checked)
                                          }
                                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                          <Eye
                                            size={12}
                                            className={`flex-shrink-0 ${
                                              isViewAllowed(department, view.key)
                                                ? 'text-indigo-600'
                                                : 'text-gray-400'
                                            }`}
                                          />
                                          <div className="min-w-0">
                                            <span className="text-xs font-medium text-gray-700 block truncate">
                                              {view.label}
                                            </span>
                                            {view.description && (
                                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {view.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {departments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Chưa có dữ liệu nhân sự để phân quyền</p>
              </div>
            )}
          </div>
        )}

        {/* Center Info Tab */}
        {activeTab === 'center-info' && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Thông tin trung tâm</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cấu hình thông tin trung tâm sẽ được sử dụng trong các biểu mẫu như hợp đồng, hóa đơn, v.v.
                </p>
              </div>
              <button
                onClick={handleSaveCenterInfo}
                disabled={centerInfoSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {centerInfoSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>

            {centerInfoLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải thông tin...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 size={18} />
                    Thông tin cơ bản
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên trung tâm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={centerInfo.name || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="DNT EDU"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã trung tâm</label>
                      <input
                        type="text"
                        value={centerInfo.code || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="DNT"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                      <input
                        type="text"
                        value={centerInfo.logoUrl || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, logoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="/logo.jpg"
                      />
                      {centerInfo.logoUrl && (
                        <div className="mt-2">
                          <img
                            src={centerInfo.logoUrl}
                            alt="Logo preview"
                            className="h-20 w-auto object-contain border border-gray-200 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 size={18} />
                    Thông tin liên hệ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={centerInfo.address || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tây Mỗ, Nam Từ Liêm, Hà Nội"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={centerInfo.phone || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="0912.345.678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={centerInfo.email || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="contact@dntedu.vn"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="text"
                        value={centerInfo.website || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://dntedu.vn"
                      />
                    </div>
                  </div>
                </div>

                {/* Representative Information */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} />
                    Thông tin đại diện
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên đại diện</label>
                      <input
                        type="text"
                        value={centerInfo.representativeName || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, representativeName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                      <input
                        type="text"
                        value={centerInfo.representativePosition || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, representativePosition: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Giám đốc"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 size={18} />
                    Thông tin ngân hàng
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                      <input
                        type="text"
                        value={centerInfo.taxCode || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, taxCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="0123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                      <input
                        type="text"
                        value={centerInfo.bankAccount || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, bankAccount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
                      <input
                        type="text"
                        value={centerInfo.bankName || ''}
                        onChange={(e) => setCenterInfo({ ...centerInfo, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Vietcombank"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
