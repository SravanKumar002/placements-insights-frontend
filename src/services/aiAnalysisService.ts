import { supabase, invokeEdge } from '../config/supabase'

export interface AIAnalysis {
    total_entries: number
    hard_truths: string[]
    confidence_drivers: string[]
    representation_gap: string[]
    strategic_action_plan: string[]
}

export interface AIAnalysisRecord {
    id: string
    section: string
    date_from: string
    date_to: string
    analysis: AIAnalysis
    generated_at: string
}

export async function fetchLatestCombinedAnalysis(): Promise<AIAnalysisRecord | null> {
    const { data, error } = await supabase
        .from('ai_analysis')
        .select('*')
        .eq('section', 'combined')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error('fetchLatestCombinedAnalysis error:', error)
        return null
    }
    return data as AIAnalysisRecord | null
}

export async function generateAnalysis(
    dateFrom: string,
    dateTo: string
): Promise<AIAnalysis> {
    return invokeEdge<AIAnalysis>('analyse-submissions', { dateFrom, dateTo })
}
