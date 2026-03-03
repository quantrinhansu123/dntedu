/**
 * Firestore Utilities
 * Firebase đã được xóa - Utilities này đã bị disable
 * Sử dụng Supabase utilities thay thế
 */

// import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp or Date to ISO string
 */
export const convertTimestamp = (value: unknown): string => {
  if (!value) return '';
  // Firebase đã được xóa - chỉ xử lý string và Date
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return '';
};

/**
 * Convert to date-only string (YYYY-MM-DD)
 */
export const convertTimestampToDate = (value: unknown): string => {
  const iso = convertTimestamp(value);
  return iso ? iso.split('T')[0] : '';
};

/**
 * Convert to readable Vietnamese date format
 */
export const formatVietnameseDate = (value: unknown): string => {
  const iso = convertTimestamp(value);
  if (!iso) return '';

  const date = new Date(iso);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
