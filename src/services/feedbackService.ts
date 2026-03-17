/**
 * Feedback Service — phản hồi phụ huynh (Supabase)
 */

import { supabase } from '../config/supabase';

const TABLE = 'feedbacks';

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

function rowToFeedback(row: Record<string, unknown>): FeedbackRecord {
  const n = (v: unknown) => (v != null ? Number(v) : undefined);
  return {
    id: row.id as string,
    date: (row.date as string) || '',
    type: row.type as FeedbackType,
    studentId: (row.student_id as string) || undefined,
    studentName: (row.student_name as string) || '',
    classId: (row.class_id as string) || undefined,
    className: (row.class_name as string) || '',
    teacher: (row.teacher as string) || undefined,
    teacherScore: n(row.teacher_score),
    curriculumScore: n(row.curriculum_score),
    careScore: n(row.care_score),
    facilitiesScore: n(row.facilities_score),
    averageScore: n(row.average_score),
    caller: (row.caller as string) || undefined,
    content: (row.content as string) || undefined,
    status: row.status as FeedbackStatus,
    parentId: (row.parent_id as string) || undefined,
    parentName: (row.parent_name as string) || undefined,
    parentPhone: (row.parent_phone as string) || undefined,
    createdAt:
      row.created_at != null
        ? new Date(row.created_at as string).toISOString()
        : undefined,
    updatedAt:
      row.updated_at != null
        ? new Date(row.updated_at as string).toISOString()
        : undefined,
  };
}

function toInsertRow(data: Omit<FeedbackRecord, 'id'>) {
  return {
    date: data.date,
    type: data.type,
    student_id: data.studentId ?? null,
    student_name: data.studentName ?? '',
    class_id: data.classId ?? null,
    class_name: data.className ?? '',
    teacher: data.teacher ?? null,
    teacher_score: data.teacherScore ?? null,
    curriculum_score: data.curriculumScore ?? null,
    care_score: data.careScore ?? null,
    facilities_score: data.facilitiesScore ?? null,
    average_score: data.averageScore ?? null,
    caller: data.caller ?? null,
    content: data.content ?? null,
    status: data.status,
    parent_id: data.parentId ?? null,
    parent_name: data.parentName ?? null,
    parent_phone: data.parentPhone ?? null,
  };
}

export const createFeedback = async (data: Omit<FeedbackRecord, 'id'>): Promise<string> => {
  let feedbackData = { ...data };
  if (data.type === 'Form') {
    const scores = [
      data.teacherScore,
      data.curriculumScore,
      data.careScore,
      data.facilitiesScore,
    ].filter((s): s is number => s !== undefined && s !== null);
    if (scores.length > 0) {
      feedbackData.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(toInsertRow(feedbackData))
    .select('id')
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    throw new Error('Không thể tạo phản hồi');
  }
  return inserted.id as string;
};

export const getFeedbacks = async (filters?: {
  type?: FeedbackType;
  status?: FeedbackStatus;
  studentId?: string;
}): Promise<FeedbackRecord[]> => {
  try {
    let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

    if (filters?.type) {
      q = q.eq('type', filters.type);
    }
    if (filters?.status) {
      q = q.eq('status', filters.status);
    }
    if (filters?.studentId) {
      q = q.eq('student_id', filters.studentId);
    }

    const { data, error } = await q;

    if (error) {
      console.error('Error getting feedbacks:', error);
      throw new Error('Không thể tải danh sách phản hồi');
    }
    return (data || []).map((row) => rowToFeedback(row as Record<string, unknown>));
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    throw new Error('Không thể tải danh sách phản hồi');
  }
};

export const updateFeedback = async (id: string, data: Partial<FeedbackRecord>): Promise<void> => {
  let updateData: Record<string, unknown> = {};

  if (data.date !== undefined) updateData.date = data.date;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.studentId !== undefined) updateData.student_id = data.studentId || null;
  if (data.studentName !== undefined) updateData.student_name = data.studentName;
  if (data.classId !== undefined) updateData.class_id = data.classId || null;
  if (data.className !== undefined) updateData.class_name = data.className;
  if (data.teacher !== undefined) updateData.teacher = data.teacher || null;
  if (data.teacherScore !== undefined) updateData.teacher_score = data.teacherScore ?? null;
  if (data.curriculumScore !== undefined) updateData.curriculum_score = data.curriculumScore ?? null;
  if (data.careScore !== undefined) updateData.care_score = data.careScore ?? null;
  if (data.facilitiesScore !== undefined) updateData.facilities_score = data.facilitiesScore ?? null;
  if (data.caller !== undefined) updateData.caller = data.caller || null;
  if (data.content !== undefined) updateData.content = data.content || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.parentId !== undefined) updateData.parent_id = data.parentId || null;
  if (data.parentName !== undefined) updateData.parent_name = data.parentName || null;
  if (data.parentPhone !== undefined) updateData.parent_phone = data.parentPhone || null;

  if (
    data.teacherScore !== undefined ||
    data.curriculumScore !== undefined ||
    data.careScore !== undefined ||
    data.facilitiesScore !== undefined
  ) {
    const scores = [
      data.teacherScore,
      data.curriculumScore,
      data.careScore,
      data.facilitiesScore,
    ].filter((s): s is number => s !== undefined && s !== null && s > 0);
    if (scores.length > 0) {
      updateData.average_score = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  const { error } = await supabase.from(TABLE).update(updateData).eq('id', id);

  if (error) {
    console.error('Error updating feedback:', error);
    throw new Error('Không thể cập nhật phản hồi');
  }
};

export const deleteFeedback = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting feedback:', error);
    throw new Error('Không thể xóa phản hồi');
  }
};

export const updateFeedbackStatus = async (id: string, status: FeedbackStatus): Promise<void> => {
  await updateFeedback(id, { status });
};
