// Firebase auth removed - using Supabase auth
import { Staff } from '../../types';
import { sanitizeError } from '../utils/errorUtils';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
  role?: string;
  staffData?: Staff;
}

export class AuthService {
  
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Backdoor for development
      if (email === 'admin@admin.admin' && password === 'admin123') {
        const mockUser: AuthUser = {
          uid: 'backdoor-admin-uid',
          email: 'admin@admin.admin',
          displayName: 'Admin Backdoor',
          emailVerified: true,
          role: 'Quản trị viên',
          staffData: {
            uid: 'backdoor-admin-uid',
            email: 'admin@admin.admin',
            name: 'Admin Backdoor',
            code: 'AD999',
            role: 'Quản trị viên',
            department: 'Quản lý',
            position: 'Quản trị viên',
            phone: '0123456789',
            status: 'Active',
            permissions: {
              canManageStudents: true,
              canManageClasses: true,
              canManageStaff: true,
              canManageFinance: true,
              canViewReports: true,
            },
          }
        };
        return mockUser;
      }

      // TODO: Implement with Supabase auth
      throw new Error('Authentication not implemented. Please use Supabase auth.');
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(sanitizeError(error));
    }
  }
  
  // Sign out
  static async signOut(): Promise<void> {
    try {
      // TODO: Implement with Supabase auth
      console.warn('Sign out not implemented. Please use Supabase auth.');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
  
  // Register new staff with email and password
  static async registerStaff(
    email: string,
    password: string,
    staffData: {
      name: string;
      code: string;
      role: string;
      department: string;
      position: string;
      phone: string;
    }
  ): Promise<string> {
    try {
      // TODO: Implement with Supabase auth
      throw new Error('Registration not implemented. Please use Supabase auth.');
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(sanitizeError(error));
    }
  }
  
  // Get current user
  static getCurrentUser(): AuthUser | null {
    // TODO: Implement with Supabase auth
    return null;
  }
  
  // Listen to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    // TODO: Implement with Supabase auth
    callback(null);
    return () => {}; // Return unsubscribe function
  }
}
