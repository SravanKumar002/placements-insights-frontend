import { supabase } from '../config/supabase'

export interface PlacementOpportunity {
    id: string
    created_at: string
    crp_date: string
    company_name: string
    company_url: string | null
    mandatory_skills: string | null
    optional_skills: string | null
    openings: number
    ctc: string | null
    opportunity_month: string
}

export interface PlacedStudent {
    id: string
    created_at: string
    student_name: string
    company: string
    role: string | null
    ctc: string | null
    photo_url: string | null
    placement_month: string
}

// ── Placement Opportunities ──────────────────────────────────────────

export async function fetchOpportunities(): Promise<PlacementOpportunity[]> {
    const { data, error } = await supabase
        .from('placement_opportunities')
        .select('*')
        .order('crp_date', { ascending: false })

    if (error) throw error
    return (data ?? []) as PlacementOpportunity[]
}

export async function insertOpportunity(payload: {
    crp_date: string
    company_name: string
    company_url?: string | null
    mandatory_skills?: string | null
    optional_skills?: string | null
    openings?: number
    ctc?: string | null
    opportunity_month: string
}): Promise<void> {
    const { error } = await supabase
        .from('placement_opportunities')
        .insert(payload)

    if (error) throw error
}

export async function insertOpportunitiesBulk(rows: {
    crp_date: string
    company_name: string
    company_url?: string | null
    mandatory_skills?: string | null
    optional_skills?: string | null
    openings?: number
    ctc?: string | null
    opportunity_month: string
}[]): Promise<void> {
    const { error } = await supabase
        .from('placement_opportunities')
        .insert(rows)

    if (error) throw error
}

export async function updateOpportunity(id: string, payload: Partial<Omit<PlacementOpportunity, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
        .from('placement_opportunities')
        .update(payload)
        .eq('id', id)

    if (error) throw error
}

export async function deleteOpportunity(id: string): Promise<void> {
    const { error } = await supabase
        .from('placement_opportunities')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ── Placed Students ──────────────────────────────────────────────────

export async function fetchPlacedStudents(): Promise<PlacedStudent[]> {
    const { data, error } = await supabase
        .from('placed_students')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as PlacedStudent[]
}

export async function insertPlacedStudent(payload: {
    student_name: string
    company: string
    role?: string | null
    ctc?: string | null
    photo_url?: string | null
    placement_month: string
}): Promise<void> {
    const { error } = await supabase
        .from('placed_students')
        .insert(payload)

    if (error) throw error
}

export async function insertPlacedStudentsBulk(rows: {
    student_name: string
    company: string
    role?: string | null
    ctc?: string | null
    photo_url?: string | null
    placement_month: string
}[]): Promise<void> {
    const { error } = await supabase
        .from('placed_students')
        .insert(rows)

    if (error) throw error
}

export async function updatePlacedStudent(id: string, payload: Partial<Omit<PlacedStudent, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
        .from('placed_students')
        .update(payload)
        .eq('id', id)

    if (error) throw error
}

export async function deletePlacedStudent(id: string): Promise<void> {
    const { error } = await supabase
        .from('placed_students')
        .delete()
        .eq('id', id)

    if (error) throw error
}
