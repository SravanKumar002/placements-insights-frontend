import { supabase } from '../config/supabase'

export interface DemandSkill {
    name: string
    count: number
}

export interface DemandGraphConfig {
    title: string
    x_label: string
    y_label: string
    skills: DemandSkill[]
}

export async function fetchDemandGraph(): Promise<DemandGraphConfig | null> {
    const { data, error } = await (supabase
        .from('demand_graph_config' as any) as any)
        .select('title, x_label, y_label, skills')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw error
    return data as DemandGraphConfig | null
}

export async function saveDemandGraph(config: DemandGraphConfig): Promise<void> {
    const { data: existing } = await (supabase
        .from('demand_graph_config' as any) as any)
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (existing) {
        const { error } = await (supabase
            .from('demand_graph_config' as any) as any)
            .update({
                title: config.title,
                x_label: config.x_label,
                y_label: config.y_label,
                skills: config.skills,
                updated_at: new Date().toISOString()
            })
            .eq('id', (existing as any).id)
        if (error) throw error
    } else {
        const { error } = await (supabase
            .from('demand_graph_config' as any) as any)
            .insert({
                title: config.title,
                x_label: config.x_label,
                y_label: config.y_label,
                skills: config.skills
            })
        if (error) throw error
    }
}

export async function deleteDemandGraph(): Promise<void> {
    const { error } = await (supabase
        .from('demand_graph_config' as any) as any)
        .update({ is_active: false })
        .eq('is_active', true)

    if (error) throw error
}
