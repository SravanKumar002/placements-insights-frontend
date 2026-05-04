import { supabase } from '../config/supabase'

export interface CWCRegistration {
    id: string
    created_at: string
    name: string
    phone: string
    email: string | null
    question: string
}

export async function fetchSessionDetails(): Promise<string> {
    const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'cwc_session_details')
        .single()
    return (data as { value: string } | null)?.value ?? ''
}

export async function updateSessionDetails(details: string): Promise<void> {
    const { error } = await (supabase as any).from('app_settings').upsert(
        { key: 'cwc_session_details', value: details },
        { onConflict: 'key' }
    )
    if (error) throw error
}

export async function fetchSessionDate(): Promise<string> {
    const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'cwc_session_date')
        .single()
    return (data as { value: string } | null)?.value ?? 'TBD'
}

export async function updateSessionDate(date: string, details: string): Promise<void> {
    const now = new Date().toISOString()

    // Fetch the current session date + details rows
    const [{ data: currentSetting }, { data: currentDetails }] = await Promise.all([
        supabase.from('app_settings').select('value, updated_at').eq('key', 'cwc_session_date').single(),
        supabase.from('app_settings').select('value').eq('key', 'cwc_session_details').single(),
    ])

    const prevDisplay = (currentSetting as { value: string; updated_at: string } | null)?.value ?? ''
    const prevPeriodStart = (currentSetting as { updated_at: string } | null)?.updated_at ?? now
    const prevDetails = (currentDetails as { value: string } | null)?.value ?? ''

    // Count registrations in the closing period
    const { count: closingCount } = await (supabase as any)
        .from('cwc_registrations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevPeriodStart)
        .lt('created_at', now)

    // Archive the closing session into history (skip if no valid label yet)
    if (prevDisplay && prevDisplay !== 'TBD') {
        await (supabase as any).from('cwc_session_history').insert({
            session_label: prevDisplay,
            period_start: prevPeriodStart,
            period_end: now,
            registration_count: closingCount ?? 0,
            call_details: prevDetails || null,
        })
    }

    await Promise.all([
        (supabase as any).from('app_settings')
            .update({ value: date, updated_at: now })
            .eq('key', 'cwc_session_date'),
        (supabase as any).from('app_settings')
            .upsert({ key: 'cwc_prev_period_start', value: prevPeriodStart, updated_at: now }, { onConflict: 'key' }),
        (supabase as any).from('app_settings')
            .upsert({ key: 'cwc_session_details', value: details }, { onConflict: 'key' }),
    ]).then(results => {
        const err = results.find(r => r.error)?.error
        if (err) throw err
    })
}

export async function insertCWCRegistration(payload: {
    name: string
    phone: string
    email?: string
    question: string
}): Promise<void> {
    const { error } = await supabase.from('cwc_registrations' as any).insert(payload)
    if (error) throw error
}

export async function fetchCWCRegistrations(): Promise<CWCRegistration[]> {
    const { data, error } = await supabase
        .from('cwc_registrations' as any)
        .select('*')
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as CWCRegistration[]
}

export async function fetchCWCRegistrationsPaginated(
    page: number,
    pageSize: number
): Promise<{ registrations: CWCRegistration[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await (supabase as any)
        .from('cwc_registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
    if (error) throw error
    return { registrations: (data ?? []) as CWCRegistration[], totalCount: count ?? 0 }
}

export async function deleteCWCRegistration(id: string): Promise<void> {
    const { error } = await supabase.from('cwc_registrations' as any).delete().eq('id', id)
    if (error) throw error
}
