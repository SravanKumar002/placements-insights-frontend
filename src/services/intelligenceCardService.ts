import { supabase } from '../config/supabase'

export interface IntelligenceCard {
    id: string
    created_at: string
    title: string
    url: string | null
    company_url: string | null
    description: string | null
    content: string | null
    month: string | null
    badge: string | null
    sort_order: number
}

export async function fetchIntelligenceCards(): Promise<IntelligenceCard[]> {
    const { data, error } = await supabase
        .from('interview_intelligence_cards')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as IntelligenceCard[]
}

export async function createIntelligenceCard(payload: {
    title: string
    url?: string | null
    company_url?: string | null
    description?: string | null
    content?: string | null
    month?: string | null
    badge?: string | null
}): Promise<void> {
    const { error } = await supabase
        .from('interview_intelligence_cards')
        .insert({ ...payload, sort_order: 0 })

    if (error) throw error
}

export async function updateIntelligenceCard(
    id: string,
    payload: {
        title?: string;
        url?: string | null;
        company_url?: string | null;
        description?: string | null;
        content?: string | null;
        month?: string | null;
        badge?: string | null;
    }
): Promise<void> {
    const { error } = await supabase
        .from('interview_intelligence_cards')
        .update(payload)
        .eq('id', id)

    if (error) throw error
}

export async function deleteIntelligenceCard(id: string): Promise<void> {
    const { error } = await supabase
        .from('interview_intelligence_cards')
        .delete()
        .eq('id', id)

    if (error) throw error
}
