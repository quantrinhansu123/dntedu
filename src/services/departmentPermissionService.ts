/**
 * Department Permission Service
 * Quản lý phân quyền theo bộ phận
 */

import { supabase } from '../config/supabase';
import { ModuleKey } from './permissionService';

export interface DepartmentPermission {
  department: string;
  allowedViews: ModuleKey[];
}

/**
 * Lấy tất cả permissions theo bộ phận từ Supabase
 */
export const getDepartmentPermissions = async (): Promise<Record<string, DepartmentPermission>> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .like('role_key', 'dept_%');

    if (error) {
      console.error('Error fetching department permissions:', error);
      return {};
    }

    const permissions: Record<string, DepartmentPermission> = {};

    if (data) {
      data.forEach((row) => {
        // role_key format: "dept_{department_name}"
        const department = row.role_key.replace('dept_', '');
        const allowedViews: ModuleKey[] = [];

        // Parse permissions JSONB để lấy danh sách các view được phép
        if (row.permissions && typeof row.permissions === 'object') {
          Object.keys(row.permissions).forEach((viewKey) => {
            const viewPerm = (row.permissions as any)[viewKey];
            if (viewPerm && viewPerm.view === true) {
              allowedViews.push(viewKey as ModuleKey);
            }
          });
        }

        permissions[department] = {
          department,
          allowedViews,
        };
      });
    }

    return permissions;
  } catch (error) {
    console.error('Error in getDepartmentPermissions:', error);
    return {};
  }
};

/**
 * Lưu permissions cho một bộ phận
 */
export const saveDepartmentPermission = async (
  department: string,
  allowedViews: ModuleKey[]
): Promise<void> => {
  try {
    const roleKey = `dept_${department}`;

    // Tạo permissions object từ allowedViews
    const permissions: Record<string, any> = {};
    allowedViews.forEach((viewKey) => {
      permissions[viewKey] = {
        view: true,
        create: false,
        edit: false,
        delete: false,
      };
    });

    // Kiểm tra xem đã có record chưa
    const { data: existing } = await supabase
      .from('role_permissions')
      .select('id')
      .eq('role_key', roleKey)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('role_permissions')
        .update({
          permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('role_key', roleKey);

      if (error) {
        console.error('Error updating department permission:', error);
        throw error;
      }
    } else {
      // Insert new
      const { error } = await supabase.from('role_permissions').insert({
        role_key: roleKey,
        role_name: department,
        description: `Phân quyền cho bộ phận ${department}`,
        permissions,
      });

      if (error) {
        console.error('Error creating department permission:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in saveDepartmentPermission:', error);
    throw error;
  }
};

/**
 * Lưu tất cả permissions cho nhiều bộ phận
 */
export const saveAllDepartmentPermissions = async (
  permissions: Record<string, DepartmentPermission>
): Promise<void> => {
  try {
    const promises = Object.values(permissions).map((perm) =>
      saveDepartmentPermission(perm.department, perm.allowedViews)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error in saveAllDepartmentPermissions:', error);
    throw error;
  }
};

/**
 * Lấy permissions cho một bộ phận cụ thể
 */
export const getDepartmentPermission = async (
  department: string
): Promise<DepartmentPermission | null> => {
  try {
    const roleKey = `dept_${department}`;
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_key', roleKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching department permission:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const allowedViews: ModuleKey[] = [];
    if (data.permissions && typeof data.permissions === 'object') {
      Object.keys(data.permissions).forEach((viewKey) => {
        const viewPerm = (data.permissions as any)[viewKey];
        if (viewPerm && viewPerm.view === true) {
          allowedViews.push(viewKey as ModuleKey);
        }
      });
    }

    return {
      department,
      allowedViews,
    };
  } catch (error) {
    console.error('Error in getDepartmentPermission:', error);
    return null;
  }
};
