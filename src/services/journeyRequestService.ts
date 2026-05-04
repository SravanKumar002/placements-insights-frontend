import { supabase } from '../config/supabase'

export interface JourneyRequest {
    id: string
    created_at: string
    name: string
    mobile: string
    request: string
}

// Use `any` cast because the Supabase generated types don't include this
// new table yet — run `supabase gen types` after applying the migration to remove this.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function insertJourneyRequest(payload: {
    name: string
    mobile: string
    request: string
}): Promise<void> {
    const { error } = await db.from('journey_requests').insert(payload)
    if (error) throw error
}

export async function fetchJourneyRequestsPaginated(
    page: number,
    pageSize: number
): Promise<{ requests: JourneyRequest[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await db
        .from('journey_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) throw error
    return { requests: (data ?? []) as JourneyRequest[], totalCount: count ?? 0 }
}

export async function fetchJourneyRequests(): Promise<JourneyRequest[]> {
    const { data, error } = await db
        .from('journey_requests')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as JourneyRequest[]
}

export async function deleteJourneyRequest(id: string): Promise<void> {
    const { error } = await db.from('journey_requests').delete().eq('id', id)
    if (error) throw error
}
