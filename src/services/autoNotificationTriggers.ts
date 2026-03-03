/**
 * Auto Notification Triggers
 * Firebase đã được xóa - Service này đã bị disable
 * Sử dụng Supabase triggers thay thế
 */

// import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
import {
  createPaymentNotification,
  createFeedbackNotification,
  createHomeworkNotification,
  createScheduleChangeNotification
} from './notificationService';

/**
 * Lắng nghe contract mới có nợ -> gửi thông báo đóng phí
 */
export const watchContractDebts = () => {
  console.warn('watchContractDebts: Firebase đã được xóa. Sử dụng Supabase triggers thay thế.');
  return () => {}; // Return no-op unsubscribe function
};

/**
 * Lắng nghe feedback campaigns -> gửi thông báo
 */
export const watchFeedbackCampaigns = () => {
  console.warn('watchFeedbackCampaigns: Firebase đã được xóa. Sử dụng Supabase triggers thay thế.');
  return () => {}; // Return no-op unsubscribe function
};

/**
 * Lắng nghe homework mới -> gửi thông báo
 */
export const watchHomework = () => {
  console.warn('watchHomework: Firebase đã được xóa. Sử dụng Supabase triggers thay thế.');
  return () => {}; // Return no-op unsubscribe function
};

/**
 * Lắng nghe thay đổi lịch học -> gửi thông báo
 */
export const watchScheduleChanges = () => {
  console.warn('watchScheduleChanges: Firebase đã được xóa. Sử dụng Supabase triggers thay thế.');
  return () => {}; // Return no-op unsubscribe function
};

/**
 * Khởi tạo tất cả watchers
 */
export const initAutoNotificationTriggers = () => {
  console.warn('initAutoNotificationTriggers: Firebase đã được xóa. Sử dụng Supabase triggers thay thế.');
  // No-op
};

// Alias for backwards compatibility
export const initAutoNotifications = initAutoNotificationTriggers;
