import { supabase } from '../config/supabase'

export interface AlumniJourney {
    id: string
    created_at: string
    name: string
    branch: string
    college: string
    city: string
    state: string | null
    journey_text: string
    yog: string | null
    nxtwave_join_date: string | null
    program: string | null
    linkedin_url: string | null
    photo_url: string | null
    social_media_url: string | null
    company: string | null
    company_website: string | null
    role: string | null
    ctc: string | null
    suggestion_to_peers: string | null
    placement_month: string | null
}

export interface AlumniJourneyInsert {
    name: string
    branch: string
    college: string
    city: string
    state?: string | null
    journey_text: string
    yog?: string | null
    nxtwave_join_date?: string | null
    program?: string | null
    linkedin_url?: string | null
    photo_url?: string | null
    social_media_url?: string | null
    company?: string | null
    company_website?: string | null
    role?: string | null
    ctc?: string | null
    suggestion_to_peers?: string | null
    placement_month?: string | null
}

export async function fetchLatestJourney(): Promise<AlumniJourney | null> {
    const { data, error } = await supabase
        .from('alumni_journeys')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) return null
    return data as AlumniJourney
}

export async function fetchAllJourneys(): Promise<AlumniJourney[]> {
    const { data, error } = await supabase
        .from('alumni_journeys')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as AlumniJourney[]
}

export async function fetchJourneysPaginated(
    page: number,
    pageSize: number
): Promise<{ journeys: AlumniJourney[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
        .from('alumni_journeys')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) throw error
    return { journeys: (data ?? []) as AlumniJourney[], totalCount: count ?? 0 }
}

export async function insertJourney(payload: AlumniJourneyInsert): Promise<AlumniJourney> {
    const { data, error } = await supabase
        .from('alumni_journeys')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data as AlumniJourney
}

export async function updateJourney(id: string, payload: AlumniJourneyInsert): Promise<AlumniJourney> {
    const { data, error } = await supabase
        .from('alumni_journeys')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as AlumniJourney
}

export async function insertJourneyBulk(payload: AlumniJourneyInsert[]): Promise<void> {
    const { error } = await supabase
        .from('alumni_journeys')
        .insert(payload)

    if (error) throw error
}

export async function deleteJourney(id: string): Promise<void> {
    const { error } = await supabase
        .from('alumni_journeys')
        .delete()
        .eq('id', id)

    if (error) throw error
}
