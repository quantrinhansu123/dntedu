/**
 * Feedback Campaign Service
 * Quản lý chiến dịch khảo sát và submissions
 */

import {
    FeedbackCampaign,
    FeedbackToken,
    FeedbackSubmission,
    DEFAULT_FEEDBACK_QUESTIONS
} from '../types/feedbackTypes';

const CAMPAIGNS_COLLECTION = 'feedbackCampaigns';
const TOKENS_COLLECTION = 'feedbackTokens';
const SUBMISSIONS_COLLECTION = 'feedbackSubmissions';

// Generate random token
const generateToken = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

export class FeedbackCampaignService {
    // ========================================
    // CAMPAIGNS
    // ========================================

    static async getCampaigns(): Promise<FeedbackCampaign[]> {
        // TODO: Implement Supabase query
        // const { data } = await supabase
        //   .from(CAMPAIGNS_COLLECTION)
        //   .select('*')
        //   .order('created_at', { ascending: false });
        // return data || [];
        return [];
    }

    static async getCampaign(id: string): Promise<FeedbackCampaign | null> {
        // TODO: Implement Supabase query
        // const { data } = await supabase
        //   .from(CAMPAIGNS_COLLECTION)
        //   .select('*')
        //   .eq('id', id)
        //   .single();
        // return data || null;
        return null;
    }

    static async createCampaign(data: Omit<FeedbackCampaign, 'id' | 'createdAt'>): Promise<string> {
        // TODO: Implement Supabase insert
        // const { data: result, error } = await supabase
        //   .from(CAMPAIGNS_COLLECTION)
        //   .insert({
        //     ...data,
        //     questions: data.questions || DEFAULT_FEEDBACK_QUESTIONS,
        //     status: data.status || 'draft',
        //     created_at: new Date().toISOString()
        //   })
        //   .select()
        //   .single();
        // if (error) throw error;
        // return result.id;
        throw new Error('Not implemented');
    }

    static async updateCampaign(id: string, data: Partial<FeedbackCampaign>): Promise<void> {
        // TODO: Implement Supabase update
        // const { error } = await supabase
        //   .from(CAMPAIGNS_COLLECTION)
        //   .update(data)
        //   .eq('id', id);
        // if (error) throw error;
    }

    static async deleteCampaign(id: string): Promise<void> {
        // TODO: Delete all tokens and submissions for this campaign with Supabase
        // const { data: tokens } = await supabase
        //   .from(TOKENS_COLLECTION)
        //   .select('id')
        //   .eq('campaignId', id);
        // if (tokens) {
        //   for (const token of tokens) {
        //     await supabase.from(TOKENS_COLLECTION).delete().eq('id', token.id);
        //   }
        // }
        
        // const { data: submissions } = await supabase
        //   .from(SUBMISSIONS_COLLECTION)
        //   .select('id')
        //   .eq('campaignId', id);
        // if (submissions) {
        //   for (const sub of submissions) {
        //     await supabase.from(SUBMISSIONS_COLLECTION).delete().eq('id', sub.id);
        //   }
        // }
        
        // await supabase.from(CAMPAIGNS_COLLECTION).delete().eq('id', id);
    }

    static onCampaignsChange(callback: (campaigns: FeedbackCampaign[]) => void): () => void {
        // TODO: Implement Supabase realtime subscription
        // const channel = supabase
        //   .channel('feedback-campaigns')
        //   .on('postgres_changes', {
        //     event: '*',
        //     schema: 'public',
        //     table: CAMPAIGNS_COLLECTION
        //   }, () => {
        //     this.getCampaigns().then(callback);
        //   })
        //   .subscribe();
        // return () => supabase.removeChannel(channel);
        return () => {};
    }

    // ========================================
    // TOKENS - Tạo link cho học viên
    // ========================================

    static async generateTokensForCampaign(
        campaignId: string,
        students: Array<{ id: string; name: string; classId?: string; className?: string }>
    ): Promise<FeedbackToken[]> {
        const tokens: FeedbackToken[] = [];

        for (const student of students) {
            // TODO: Check if token already exists with Supabase
            // const { data: existing } = await supabase
            //   .from(TOKENS_COLLECTION)
            //   .select('*')
            //   .eq('campaignId', campaignId)
            //   .eq('studentId', student.id)
            //   .limit(1)
            //   .single();

            // if (!existing) {
                const token = generateToken();
                // TODO: Insert with Supabase
                // const { data: result } = await supabase
                //   .from(TOKENS_COLLECTION)
                //   .insert({
                //     campaignId,
                //     studentId: student.id,
                //     studentName: student.name,
                //     classId: student.classId || null,
                //     className: student.className || null,
                //     token,
                //     status: 'pending',
                //     created_at: new Date().toISOString()
                //   })
                //   .select()
                //   .single();
                
                tokens.push({
                    id: '', // result?.id || '',
                    campaignId,
                    studentId: student.id,
                    studentName: student.name,
                    classId: student.classId,
                    className: student.className,
                    token,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
            // } else {
            //     tokens.push(existing as FeedbackToken);
            // }
        }

        return tokens;
    }

    static async getTokensByCampaign(campaignId: string): Promise<FeedbackToken[]> {
        // TODO: Implement Supabase query
        // const { data } = await supabase
        //   .from(TOKENS_COLLECTION)
        //   .select('*')
        //   .eq('campaignId', campaignId);
        // return data || [];
        return [];
    }

    static async getTokenByValue(token: string): Promise<FeedbackToken | null> {
        // TODO: Implement Supabase query
        // const { data } = await supabase
        //   .from(TOKENS_COLLECTION)
        //   .select('*')
        //   .eq('token', token)
        //   .limit(1)
        //   .single();
        // return data || null;
        return null;
    }

    static async markTokenAsSubmitted(tokenId: string): Promise<void> {
        // TODO: Implement Supabase update
        // const { error } = await supabase
        //   .from(TOKENS_COLLECTION)
        //   .update({ status: 'submitted' })
        //   .eq('id', tokenId);
        // if (error) throw error;
    }

    // ========================================
    // SUBMISSIONS - Khi học viên/phụ huynh điền form
    // ========================================

    static async submitFeedback(data: Omit<FeedbackSubmission, 'id'>): Promise<string> {
        // Calculate average score
        const scores = [
            data.teacherScore || 0,
            data.curriculumScore || 0,
            data.careScore || 0,
            data.facilitiesScore || 0
        ].filter(s => s > 0);

        const averageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        // TODO: Insert with Supabase
        // const { data: result, error } = await supabase
        //   .from(SUBMISSIONS_COLLECTION)
        //   .insert({
        //     ...data,
        //     averageScore,
        //     submitted_at: new Date().toISOString()
        //   })
        //   .select()
        //   .single();
        // if (error) throw error;

        // Mark token as submitted
        if (data.tokenId) {
            await this.markTokenAsSubmitted(data.tokenId);
        }

        // return result.id;
        throw new Error('Not implemented');
    }

    static async getSubmissions(campaignId?: string): Promise<FeedbackSubmission[]> {
        // TODO: Implement Supabase query
        // let query = supabase.from(SUBMISSIONS_COLLECTION).select('*');
        // if (campaignId) {
        //   query = query.eq('campaignId', campaignId);
        // }
        // const { data } = await query.order('submitted_at', { ascending: false });
        // return data || [];
        return [];
    }

    static onSubmissionsChange(
        callback: (submissions: FeedbackSubmission[]) => void,
        campaignId?: string
    ): () => void {
        // TODO: Implement Supabase realtime subscription
        // const channel = supabase
        //   .channel('feedback-submissions')
        //   .on('postgres_changes', {
        //     event: '*',
        //     schema: 'public',
        //     table: SUBMISSIONS_COLLECTION
        //   }, () => {
        //     this.getSubmissions(campaignId).then(callback);
        //   })
        //   .subscribe();
        // return () => supabase.removeChannel(channel);
        return () => {};
    }

    // ========================================
    // STATISTICS
    // ========================================

    static async getCampaignStats(campaignId: string): Promise<{
        total: number;
        submitted: number;
        pending: number;
        averageScore: number;
    }> {
        const tokens = await this.getTokensByCampaign(campaignId);
        const submissions = await this.getSubmissions(campaignId);

        const avgScore = submissions.length > 0
            ? submissions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / submissions.length
            : 0;

        return {
            total: tokens.length,
            submitted: tokens.filter(t => t.status === 'submitted').length,
            pending: tokens.filter(t => t.status === 'pending').length,
            averageScore: Math.round(avgScore * 10) / 10
        };
    }
}
