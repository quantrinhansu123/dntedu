/**
 * usePermissions Hook
 * Hook để kiểm tra quyền của user hiện tại
 * Ưu tiên kiểm tra theo bộ phận, sau đó mới kiểm tra theo role
 */

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  UserRole,
  ModuleKey,
  PermissionAction,
  ModulePermission,
  ROLE_PERMISSIONS,
  getRoleFromPosition,
  hasPermission,
  getModulePermission,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
  shouldShowOnlyOwnClasses,
  shouldHideParentPhone,
  requiresApproval,
  getVisibleMenuItems,
} from '../services/permissionService';
import { getDepartmentPermission } from '../services/departmentPermissionService';

interface UsePermissionsReturn {
  role: UserRole;
  staffId: string | null;
  
  // Permission checks
  hasPermission: (module: ModuleKey, action: PermissionAction) => boolean;
  getModulePermission: (module: ModuleKey) => ModulePermission | null;
  canView: (module: ModuleKey) => boolean;
  canCreate: (module: ModuleKey) => boolean;
  canEdit: (module: ModuleKey) => boolean;
  canDelete: (module: ModuleKey) => boolean;
  canApprove: (module: ModuleKey) => boolean;
  
  // Special conditions
  shouldShowOnlyOwnClasses: (module: ModuleKey) => boolean;
  shouldHideParentPhone: (module: ModuleKey) => boolean;
  requiresApproval: (module: ModuleKey) => boolean;
  
  // Menu visibility
  getVisibleMenuItems: () => ModuleKey[];
  isMenuVisible: (module: ModuleKey) => boolean;
  
  // Role checks
  isAdmin: boolean;
  isTeacher: boolean;
  isOfficeStaff: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user, staffData } = useAuth();
  const [departmentAllowedViews, setDepartmentAllowedViews] = useState<ModuleKey[] | null>(null);

  // Determine role from staff position
  const role = useMemo<UserRole>(() => {
    if (!staffData?.position) {
      console.warn(`[SECURITY] Staff ${staffData?.id || 'unknown'} missing position, restricting access`);
      return 'tro_giang'; // Most restrictive role for staff without position
    }
    return getRoleFromPosition(staffData.position);
  }, [staffData?.position, staffData?.id]);

  const staffId = staffData?.id || user?.uid || null;
  const department = staffData?.department || null;
  const isAdminRole = role === 'admin';

  // Load department permissions
  useEffect(() => {
    const loadDepartmentPermissions = async () => {
      if (!department || isAdminRole) {
        // Admin có full quyền, không cần load department permissions
        setDepartmentAllowedViews(null);
        return;
      }

      try {
        const deptPermission = await getDepartmentPermission(department);
        if (deptPermission) {
          setDepartmentAllowedViews(deptPermission.allowedViews);
        } else {
          // Không có permissions cho department này, dùng role-based permissions
          setDepartmentAllowedViews(null);
        }
      } catch (error) {
        console.error('Error loading department permissions:', error);
        setDepartmentAllowedViews(null);
      }
    };

    loadDepartmentPermissions();
  }, [department, isAdminRole]);

  // Check if module is allowed by department
  const isModuleAllowedByDepartment = (module: ModuleKey): boolean => {
    // Admin có full quyền
    if (isAdminRole) return true;
    
    // Nếu không có department permissions, fallback về role-based
    if (departmentAllowedViews === null) return false;
    
    // Kiểm tra xem module có trong danh sách allowed views không
    return departmentAllowedViews.includes(module);
  };

  // Memoized permission functions
  const permissions = useMemo(() => {
    // Nếu có department permissions, sử dụng nó
    if (departmentAllowedViews !== null && !isAdminRole) {
      return {
        hasPermission: (module: ModuleKey, action: PermissionAction) => {
          // Admin luôn có full quyền
          if (isAdminRole) return true;
          
          // Chỉ kiểm tra view permission từ department
          if (action === 'view') {
            return isModuleAllowedByDepartment(module);
          }
          
          // Các action khác (create, edit, delete) mặc định là false cho department-based permissions
          // Có thể mở rộng sau nếu cần
          return false;
        },
        
        getModulePermission: (module: ModuleKey) => {
          if (isAdminRole) {
            return getModulePermission(role, module);
          }
          
          const canViewModule = isModuleAllowedByDepartment(module);
          if (!canViewModule) return null;
          
          return {
            view: true,
            create: false,
            edit: false,
            delete: false,
          };
        },
        
        canView: (module: ModuleKey) => isModuleAllowedByDepartment(module),
        canCreate: (module: ModuleKey) => isAdminRole ? canCreate(role, module) : false,
        canEdit: (module: ModuleKey) => isAdminRole ? canEdit(role, module) : false,
        canDelete: (module: ModuleKey) => isAdminRole ? canDelete(role, module) : false,
        canApprove: (module: ModuleKey) => isAdminRole ? canApprove(role, module) : false,
        
        shouldShowOnlyOwnClasses: (module: ModuleKey) => 
          shouldShowOnlyOwnClasses(role, module),
        
        shouldHideParentPhone: (module: ModuleKey) => 
          shouldHideParentPhone(role, module),
        
        requiresApproval: (module: ModuleKey) => 
          requiresApproval(role, module),
        
        getVisibleMenuItems: () => {
          if (isAdminRole) {
            return getVisibleMenuItems(role);
          }
          // Trả về danh sách menu items dựa trên department permissions
          return departmentAllowedViews || [];
        },
        
        isMenuVisible: (module: ModuleKey) => isModuleAllowedByDepartment(module),
      };
    }
    
    // Fallback về role-based permissions
    return {
      hasPermission: (module: ModuleKey, action: PermissionAction) => 
        hasPermission(role, module, action),
      
      getModulePermission: (module: ModuleKey) => 
        getModulePermission(role, module),
      
      canView: (module: ModuleKey) => canView(role, module),
      canCreate: (module: ModuleKey) => canCreate(role, module),
      canEdit: (module: ModuleKey) => canEdit(role, module),
      canDelete: (module: ModuleKey) => canDelete(role, module),
      canApprove: (module: ModuleKey) => canApprove(role, module),
      
      shouldShowOnlyOwnClasses: (module: ModuleKey) => 
        shouldShowOnlyOwnClasses(role, module),
      
      shouldHideParentPhone: (module: ModuleKey) => 
        shouldHideParentPhone(role, module),
      
      requiresApproval: (module: ModuleKey) => 
        requiresApproval(role, module),
      
      getVisibleMenuItems: () => getVisibleMenuItems(role),
      
      isMenuVisible: (module: ModuleKey) => canView(role, module),
    };
  }, [role, departmentAllowedViews, isAdminRole]);

  // Role type checks
  const roleChecks = useMemo(() => ({
    isAdmin: isAdminRole,
    isTeacher: ['gv_viet', 'gv_nuocngoai', 'tro_giang'].includes(role),
    isOfficeStaff: ['cskh', 'ketoan'].includes(role),
  }), [role, isAdminRole]);

  return {
    role,
    staffId,
    ...permissions,
    ...roleChecks,
  };
};

// HOC for wrapping components with permission check
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: ModuleKey,
  action: PermissionAction = 'view'
) => {
  return (props: P) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(module, action)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-semibold">Không có quyền truy cập</p>
            <p className="text-gray-500 text-sm mt-1">Bạn không có quyền xem nội dung này</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};
