/**
 * Survey Service
 * Quản lý form khảo sát templates và assignments
 */

import {
  SurveyTemplate,
  SurveyAssignment,
  SurveyResponse,
  DEFAULT_SURVEY_TEMPLATES
} from '../types/surveyTypes';

const TEMPLATES_COLLECTION = 'surveyTemplates';
const ASSIGNMENTS_COLLECTION = 'surveyAssignments';
const RESPONSES_COLLECTION = 'surveyResponses';

// Generate random token
const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

export class SurveyService {
  // ========================================
  // TEMPLATES - Form mẫu có sẵn
  // ========================================

  static async getTemplates(): Promise<SurveyTemplate[]> {
    // TODO: Implement Supabase query
    // const { data } = await supabase
    //   .from(TEMPLATES_COLLECTION)
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // return data || [];
    return [];
  }

  static async getTemplate(id: string): Promise<SurveyTemplate | null> {
    // TODO: Implement Supabase query
    // const { data } = await supabase
    //   .from(TEMPLATES_COLLECTION)
    //   .select('*')
    //   .eq('id', id)
    //   .single();
    // return data || null;
    return null;
  }

  static async createTemplate(data: Omit<SurveyTemplate, 'id' | 'createdAt'>): Promise<string> {
    // TODO: Implement Supabase insert
    // const { data: result, error } = await supabase
    //   .from(TEMPLATES_COLLECTION)
    //   .insert({
    //     ...data,
    //     created_at: new Date().toISOString()
    //   })
    //   .select()
    //   .single();
    // if (error) throw error;
    // return result.id;
    throw new Error('Not implemented');
  }

  static async updateTemplate(id: string, data: Partial<SurveyTemplate>): Promise<void> {
    // TODO: Implement Supabase update
    // const { error } = await supabase
    //   .from(TEMPLATES_COLLECTION)
    //   .update({
    //     ...data,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', id);
    // if (error) throw error;
  }

  static async deleteTemplate(id: string): Promise<void> {
    // TODO: Implement Supabase delete
    // const { error } = await supabase
    //   .from(TEMPLATES_COLLECTION)
    //   .delete()
    //   .eq('id', id);
    // if (error) throw error;
  }

  static onTemplatesChange(callback: (templates: SurveyTemplate[]) => void): () => void {
    // TODO: Implement Supabase realtime subscription
    // const channel = supabase
    //   .channel('survey-templates')
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: TEMPLATES_COLLECTION
    //   }, () => {
    //     this.getTemplates().then(callback);
    //   })
    //   .subscribe();
    // return () => supabase.removeChannel(channel);
    return () => {};
  }

  // Initialize default templates if none exist
  static async initializeDefaultTemplates(): Promise<void> {
    const existing = await this.getTemplates();
    if (existing.length === 0) {
      for (const template of DEFAULT_SURVEY_TEMPLATES) {
        await this.createTemplate(template);
      }
    }
  }


  // ========================================
  // ASSIGNMENTS - Gán form cho học viên
  // ========================================

  static async assignSurvey(
    templateId: string,
    students: Array<{ id: string; name: string; code?: string; classId?: string; className?: string }>,
    assignedBy?: string,
    expiresAt?: string
  ): Promise<SurveyAssignment[]> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const assignments: SurveyAssignment[] = [];

    for (const student of students) {
      // TODO: Check if already assigned with Supabase
      // const { data: existing } = await supabase
      //   .from(ASSIGNMENTS_COLLECTION)
      //   .select('*')
      //   .eq('templateId', templateId)
      //   .eq('studentId', student.id)
      //   .eq('status', 'pending')
      //   .limit(1)
      //   .single();

      // if (!existing) {
        const token = generateToken();
        // TODO: Insert with Supabase
        // const { data: result } = await supabase
        //   .from(ASSIGNMENTS_COLLECTION)
        //   .insert({
        //     templateId,
        //     templateName: template.name,
        //     studentId: student.id,
        //     studentName: student.name,
        //     studentCode: student.code || null,
        //     classId: student.classId || null,
        //     className: student.className || null,
        //     status: 'pending',
        //     token,
        //     assigned_at: new Date().toISOString(),
        //     assigned_by: assignedBy || null,
        //     expires_at: expiresAt || null
        //   })
        //   .select()
        //   .single();

        assignments.push({
          id: '', // result?.id || '',
          templateId,
          templateName: template.name,
          studentId: student.id,
          studentName: student.name,
          studentCode: student.code,
          classId: student.classId,
          className: student.className,
          status: 'pending',
          token,
          assignedAt: new Date().toISOString(),
          assignedBy,
          expiresAt
        });
      // }
    }

    return assignments;
  }

  static async getAssignments(filters?: {
    templateId?: string;
    studentId?: string;
    status?: 'pending' | 'submitted' | 'expired';
  }): Promise<SurveyAssignment[]> {
    // TODO: Implement Supabase query
    // let query = supabase.from(ASSIGNMENTS_COLLECTION).select('*');
    // if (filters?.templateId) {
    //   query = query.eq('templateId', filters.templateId);
    // }
    // if (filters?.studentId) {
    //   query = query.eq('studentId', filters.studentId);
    // }
    // if (filters?.status) {
    //   query = query.eq('status', filters.status);
    // }
    // const { data } = await query.order('assigned_at', { ascending: false });
    // return data || [];
    return [];
  }

  static async getAssignmentByToken(token: string): Promise<SurveyAssignment | null> {
    // TODO: Implement Supabase query
    // const { data } = await supabase
    //   .from(ASSIGNMENTS_COLLECTION)
    //   .select('*')
    //   .eq('token', token)
    //   .limit(1)
    //   .single();
    // return data || null;
    return null;
  }

  static async getStudentPendingSurveys(studentId: string): Promise<SurveyAssignment[]> {
    // TODO: Implement Supabase query
    // const { data } = await supabase
    //   .from(ASSIGNMENTS_COLLECTION)
    //   .select('*')
    //   .eq('studentId', studentId)
    //   .eq('status', 'pending')
    //   .order('assigned_at', { ascending: false });
    // return data || [];
    return [];
  }

  static async cancelAssignment(assignmentId: string): Promise<void> {
    // TODO: Implement Supabase delete
    // const { error } = await supabase
    //   .from(ASSIGNMENTS_COLLECTION)
    //   .delete()
    //   .eq('id', assignmentId);
    // if (error) throw error;
  }

  static onAssignmentsChange(
    callback: (assignments: SurveyAssignment[]) => void,
    studentId?: string
  ): () => void {
    // TODO: Implement Supabase realtime subscription
    // const channel = supabase
    //   .channel('survey-assignments')
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: ASSIGNMENTS_COLLECTION
    //   }, () => {
    //     this.getAssignments({ studentId }).then(callback);
    //   })
    //   .subscribe();
    // return () => supabase.removeChannel(channel);
    return () => {};
  }


  // ========================================
  // RESPONSES - Câu trả lời từ học viên
  // ========================================

  static async submitResponse(data: Omit<SurveyResponse, 'id'>): Promise<string> {
    // Calculate average score from category scores
    const scores = [
      data.teacherScore,
      data.curriculumScore,
      data.careScore,
      data.facilitiesScore
    ].filter((s): s is number => s !== undefined && s !== null && s > 0);

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    // Build response object, excluding undefined values
    const responseData: Record<string, any> = {
      assignmentId: data.assignmentId,
      templateId: data.templateId,
      templateName: data.templateName,
      studentId: data.studentId,
      studentName: data.studentName,
      answers: data.answers || {},
      submitted_at: new Date().toISOString(),
      submitted_by: data.submittedBy || 'student',
    };

    // Only add optional fields if they have values
    if (data.studentCode) responseData.studentCode = data.studentCode;
    if (data.classId) responseData.classId = data.classId;
    if (data.className) responseData.className = data.className;
    if (data.teacherScore !== undefined && data.teacherScore !== null) responseData.teacherScore = data.teacherScore;
    if (data.curriculumScore !== undefined && data.curriculumScore !== null) responseData.curriculumScore = data.curriculumScore;
    if (data.careScore !== undefined && data.careScore !== null) responseData.careScore = data.careScore;
    if (data.facilitiesScore !== undefined && data.facilitiesScore !== null) responseData.facilitiesScore = data.facilitiesScore;
    if (averageScore !== null) responseData.averageScore = averageScore;
    if (data.comments) responseData.comments = data.comments;
    if (data.submitterName) responseData.submitterName = data.submitterName;
    if (data.submitterPhone) responseData.submitterPhone = data.submitterPhone;

    // TODO: Insert with Supabase
    // const { data: result, error } = await supabase
    //   .from(RESPONSES_COLLECTION)
    //   .insert(responseData)
    //   .select()
    //   .single();
    // if (error) throw error;

    // Update assignment status
    if (data.assignmentId) {
      // TODO: Update assignment with Supabase
      // await supabase
      //   .from(ASSIGNMENTS_COLLECTION)
      //   .update({
      //     status: 'submitted',
      //     submitted_at: new Date().toISOString()
      //   })
      //   .eq('id', data.assignmentId);
    }

    // return result.id;
    throw new Error('Not implemented');
  }

  static async getResponses(filters?: {
    templateId?: string;
    studentId?: string;
    classId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<SurveyResponse[]> {
    // TODO: Implement Supabase query
    // let query = supabase.from(RESPONSES_COLLECTION).select('*');
    // if (filters?.templateId) {
    //   query = query.eq('templateId', filters.templateId);
    // }
    // if (filters?.studentId) {
    //   query = query.eq('studentId', filters.studentId);
    // }
    // if (filters?.classId) {
    //   query = query.eq('classId', filters.classId);
    // }
    // if (filters?.fromDate) {
    //   query = query.gte('submitted_at', filters.fromDate);
    // }
    // if (filters?.toDate) {
    //   query = query.lte('submitted_at', filters.toDate);
    // }
    // const { data } = await query.order('submitted_at', { ascending: false });
    // return data || [];
    return [];
  }

  static onResponsesChange(callback: (responses: SurveyResponse[]) => void): () => void {
    // TODO: Implement Supabase realtime subscription
    // const channel = supabase
    //   .channel('survey-responses')
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: RESPONSES_COLLECTION
    //   }, () => {
    //     this.getResponses().then(callback);
    //   })
    //   .subscribe();
    // return () => supabase.removeChannel(channel);
    return () => {};
  }

  // ========================================
  // STATISTICS
  // ========================================

  static async getStatistics(filters?: {
    templateId?: string;
    classId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    totalAssigned: number;
    totalSubmitted: number;
    responseRate: number;
    averageScores: {
      teacher: number;
      curriculum: number;
      care: number;
      facilities: number;
      overall: number;
    };
  }> {
    const assignments = await this.getAssignments({ templateId: filters?.templateId });
    const responses = await this.getResponses(filters);

    const submitted = assignments.filter(a => a.status === 'submitted').length;
    const responseRate = assignments.length > 0 ? (submitted / assignments.length) * 100 : 0;

    // Calculate average scores
    const teacherScores = responses.map(r => r.teacherScore).filter((s): s is number => s !== undefined);
    const curriculumScores = responses.map(r => r.curriculumScore).filter((s): s is number => s !== undefined);
    const careScores = responses.map(r => r.careScore).filter((s): s is number => s !== undefined);
    const facilitiesScores = responses.map(r => r.facilitiesScore).filter((s): s is number => s !== undefined);
    const overallScores = responses.map(r => r.averageScore).filter((s): s is number => s !== undefined);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      totalAssigned: assignments.length,
      totalSubmitted: submitted,
      responseRate: Math.round(responseRate * 10) / 10,
      averageScores: {
        teacher: Math.round(avg(teacherScores) * 10) / 10,
        curriculum: Math.round(avg(curriculumScores) * 10) / 10,
        care: Math.round(avg(careScores) * 10) / 10,
        facilities: Math.round(avg(facilitiesScores) * 10) / 10,
        overall: Math.round(avg(overallScores) * 10) / 10,
      }
    };
  }
}
