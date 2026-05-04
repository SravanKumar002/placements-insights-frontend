import { supabase } from '../config/supabase'

export interface StudentQuery {
    id: string
    created_at: string
    name: string
    email: string | null
    question: string
    category: string | null
}

export interface AlumniRegistration {
    id: string
    created_at: string
    name: string
    email: string
    phone: string | null
    branch: string | null
    batch: string | null
    interest: string | null
}

export interface FeedbackEntry {
    id: string
    created_at: string
    name: string | null
    email: string | null
    phone: string | null
    rating: number | null
    message: string
    category: string | null
}

// ─── Fetch functions ────────────────────────────────────────────────

export async function fetchStudentQueries(): Promise<StudentQuery[]> {
    const { data, error } = await supabase
        .from('student_queries')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as StudentQuery[]
}

export async function fetchAlumniRegistrations(): Promise<AlumniRegistration[]> {
    const { data, error } = await supabase
        .from('alumni_registrations')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AlumniRegistration[]
}

export async function fetchRegistrationsPaginated(
    page: number,
    pageSize: number
): Promise<{ registrations: AlumniRegistration[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
        .from('alumni_registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
    if (error) throw error
    return { registrations: (data ?? []) as AlumniRegistration[], totalCount: count ?? 0 }
}

export async function fetchFeedback(): Promise<FeedbackEntry[]> {
    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as FeedbackEntry[]
}

export async function fetchFeedbackPaginated(
    page: number,
    pageSize: number
): Promise<{ feedback: FeedbackEntry[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await supabase
        .from('feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
    if (error) throw error
    return { feedback: (data ?? []) as FeedbackEntry[], totalCount: count ?? 0 }
}

// ─── Delete functions ───────────────────────────────────────────────

export async function deleteStudentQuery(id: string): Promise<void> {
    const { error } = await supabase.from('student_queries').delete().eq('id', id)
    if (error) throw error
}

export async function deleteAlumniRegistration(id: string): Promise<void> {
    const { error } = await supabase.from('alumni_registrations').delete().eq('id', id)
    if (error) throw error
}

export async function deleteFeedback(id: string): Promise<void> {
    const { error } = await supabase.from('feedback').delete().eq('id', id)
    if (error) throw error
}

// ─── Insert functions ───────────────────────────────────────────────

export async function insertStudentQuery(payload: {
    name: string
    question: string
    email?: string
    category?: string
}) {
    const { error } = await supabase.from('student_queries').insert(payload)
    if (error) throw error
}

export async function insertAlumniRegistration(payload: {
    name: string
    email: string
    phone?: string
    branch?: string
    batch?: string
    interest?: string
}) {
    const { error } = await supabase.from('alumni_registrations').insert(payload)
    if (error) throw error
}

export async function insertFeedback(payload: {
    message?: string
    name?: string
    email?: string
    phone?: string
    rating?: number
    category?: string
}) {
    const { error } = await (supabase.from('feedback') as any).insert(payload)
    if (error) throw error
}
