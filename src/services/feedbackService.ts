/**
 * Feedback Service
 * Handle parent feedback CRUD operations
 */

const FEEDBACKS_COLLECTION = 'feedbacks';

export type FeedbackType = 'Call' | 'Form';
export type FeedbackStatus = 'Cần gọi' | 'Đã gọi' | 'Hoàn thành';

export interface FeedbackRecord {
  id?: string;
  date: string;
  type: FeedbackType;
  studentId?: string;
  studentName: string;
  classId?: string;
  className: string;
  teacher?: string;
  teacherScore?: number;
  curriculumScore?: number;
  careScore?: number;
  facilitiesScore?: number;
  averageScore?: number;
  caller?: string;
  content?: string;
  status: FeedbackStatus;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createFeedback = async (data: Omit<FeedbackRecord, 'id'>): Promise<string> => {
  try {
    // Calculate average score for Form type (4 criteria: teacher, curriculum, care, facilities)
    let feedbackData = { ...data };
    if (data.type === 'Form') {
      const scores = [data.teacherScore, data.curriculumScore, data.careScore, data.facilitiesScore].filter(s => s !== undefined && s !== null) as number[];
      if (scores.length > 0) {
        feedbackData.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }
    
    const docData = {
      ...feedbackData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return docRef.id;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw new Error('Không thể tạo phản hồi');
  }
};

export const getFeedbacks = async (filters?: {
  type?: FeedbackType;
  status?: FeedbackStatus;
  studentId?: string;
}): Promise<FeedbackRecord[]> => {
  try {
    
    if (filters?.type) {
    }
    
    if (filters?.status) {
    }
    
    let feedbacks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as FeedbackRecord));
    
    // Client-side filtering for additional filters
    if (filters?.studentId) {
      feedbacks = feedbacks.filter(f => f.studentId === filters.studentId);
    }
    
    return feedbacks;
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    throw new Error('Không thể tải danh sách phản hồi');
  }
};

export const updateFeedback = async (id: string, data: Partial<FeedbackRecord>): Promise<void> => {
  try {
    // Recalculate average if scores changed (4 criteria)
    let updateData = { ...data };
    if (data.teacherScore !== undefined || data.curriculumScore !== undefined || data.careScore !== undefined || data.facilitiesScore !== undefined) {
      const scores = [data.teacherScore, data.curriculumScore, data.careScore, data.facilitiesScore].filter(s => s !== undefined && s !== null && s > 0) as number[];
      if (scores.length > 0) {
        updateData.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }
    
      //       ...updateData,
      //       updatedAt: new Date().toISOString(),
      //     });
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw new Error('Không thể cập nhật phản hồi');
  }
};

export const deleteFeedback = async (id: string): Promise<void> => {
  try {
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw new Error('Không thể xóa phản hồi');
  }
};

export const updateFeedbackStatus = async (id: string, status: FeedbackStatus): Promise<void> => {
  await updateFeedback(id, { status });
};
