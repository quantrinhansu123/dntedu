/**
 * Student Auth Service
 * Xác thực học viên bằng mã học viên + mật khẩu
 */

import { supabase } from '../config/supabase';
import { transformStudentFromSupabase } from './studentSupabaseService';

export interface StudentSession {
    studentId: string;
    studentCode: string;
    studentName: string;
    classId?: string;
    className?: string;
    loginAt: string;
}

const SESSION_KEY = 'studentSession';
const DEFAULT_PASSWORD = '123456';

export class StudentAuthService {
    /**
     * Đăng nhập học viên bằng mã học viên + password
     */
    static async login(studentCode: string, password: string): Promise<StudentSession> {
        try {
            // Tìm học viên theo mã
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('code', studentCode)
                .single();

            if (error || !data) {
                throw new Error('Mã học viên không tồn tại');
            }

            const student = transformStudentFromSupabase(data);

            // Kiểm tra password (mặc định là 123456 nếu chưa đổi)
            const storedPassword = student.password || DEFAULT_PASSWORD;
            if (password !== storedPassword) {
                throw new Error('Mật khẩu không đúng');
            }

            // Tạo session
            const session: StudentSession = {
                studentId: student.id,
                studentCode: student.code,
                studentName: student.fullName || 'Học viên',
                classId: student.classId,
                className: student.class,
                loginAt: new Date().toISOString()
            };

            // Lưu session vào localStorage
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));

            return session;
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Đăng xuất
     */
    static logout(): void {
        localStorage.removeItem(SESSION_KEY);
    }

    /**
     * Lấy session hiện tại
     */
    static getSession(): StudentSession | null {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;

        try {
            return JSON.parse(sessionStr) as StudentSession;
        } catch {
            return null;
        }
    }

    /**
     * Kiểm tra đã đăng nhập chưa
     */
    static isLoggedIn(): boolean {
        return this.getSession() !== null;
    }

    /**
     * Đổi mật khẩu
     */
    static async changePassword(studentId: string, oldPassword: string, newPassword: string): Promise<void> {
        try {
            // Lấy thông tin học viên
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (error || !data) {
                throw new Error('Học viên không tồn tại');
            }

            const student = transformStudentFromSupabase(data);
            const storedPassword = student.password || DEFAULT_PASSWORD;

            if (oldPassword !== storedPassword) {
                throw new Error('Mật khẩu cũ không đúng');
            }

            // Cập nhật mật khẩu mới
            const { error: updateError } = await supabase
                .from('students')
                .update({ password: newPassword })
                .eq('id', studentId);

            if (updateError) {
                throw new Error('Không thể cập nhật mật khẩu');
            }
        } catch (error: any) {
            console.error('Change password error:', error);
            throw error;
        }
    }
}
