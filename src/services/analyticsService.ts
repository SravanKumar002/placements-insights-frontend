import { supabase } from '../config/supabase'
import { ALL_CATEGORIES } from '../config/constants'

export interface DashboardStats {
    total_qa_pairs: number
    transcripts_analysed: number
    categories_covered: number
    total_companies: number
    cwc_registrations: number
    journey_requests: number
    total_alumni: number
    total_calls: number
}

export interface CWCPeriodStats {
    current: number
    previous: number
}

export interface CWCSessionHistoryPoint {
    session_label: string
    registration_count: number
    period_start: string
}

export async function fetchCWCSessionHistory(): Promise<CWCSessionHistoryPoint[]> {
    const { data, error } = await (supabase as any)
        .from('cwc_session_history')
        .select('session_label, registration_count, period_start')
        .order('period_start', { ascending: true })
        .limit(12)
    if (error) throw error
    return (data ?? []) as CWCSessionHistoryPoint[]
}

export async function fetchCWCPeriodStats(): Promise<CWCPeriodStats> {
    // Current period starts from the end of the last archived session
    const { data: lastHistory } = await (supabase as any)
        .from('cwc_session_history')
        .select('registration_count, period_end')
        .order('period_start', { ascending: false })
        .limit(1)
        .single()

    const currentStart: string = (lastHistory as any)?.period_end ?? new Date(0).toISOString()

    // Count current-period registrations
    const currentResult = await (supabase as any)
        .from('cwc_registrations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentStart)

    return {
        current: currentResult.count ?? 0,
        previous: (lastHistory as any)?.registration_count ?? 0,
    }
}

export interface PageViewRow {
    id: string
    page_path: string
    page_label: string | null
    view_count: number
    total_time_seconds: number
    updated_at: string
}

export async function trackPageView(path: string, label?: string): Promise<void> {
    try {
        const { error } = await supabase.rpc('increment_page_view', { p_path: path, p_label: label })
        if (error) console.error('trackPageView failed:', error.message, error)
    } catch (e) {
        console.error('trackPageView exception:', e)
    }
}

export async function fetchPageViewStats(): Promise<PageViewRow[]> {
    const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .order('view_count', { ascending: false })
    if (error) throw error
    return (data ?? []) as PageViewRow[]
}

export interface PageViewTrend {
    page_path: string
    this_week: number
    last_week: number
}

export async function fetchPageViewWeeklyTrends(): Promise<PageViewTrend[]> {
    const offset = (days: number) => {
        const d = new Date()
        d.setDate(d.getDate() - days)
        return d.toISOString().split('T')[0]
    }
    const today = offset(0)
    const thisWeekStart = offset(6)   // 7-day window ending today
    const lastWeekStart = offset(13)  // 7-day window before that

    const { data, error } = await (supabase as any)
        .from('page_view_daily')
        .select('page_path, date, view_count')
        .gte('date', lastWeekStart)
        .lte('date', today)

    if (error) return []

    const map = new Map<string, { this_week: number; last_week: number }>()
    for (const row of (data ?? []) as { page_path: string; date: string; view_count: number }[]) {
        const bucket = map.get(row.page_path) ?? { this_week: 0, last_week: 0 }
        if (row.date >= thisWeekStart) {
            bucket.this_week += row.view_count
        } else {
            bucket.last_week += row.view_count
        }
        map.set(row.page_path, bucket)
    }

    return [...map.entries()].map(([page_path, { this_week, last_week }]) => ({
        page_path,
        this_week,
        last_week,
    }))
}

export async function fetchTotalPageViews(): Promise<number> {
    const { data, error } = await supabase
        .from('page_views')
        .select('view_count')
    if (error) throw error
    return (data ?? []).reduce((sum: number, r: { view_count: number }) => sum + r.view_count, 0)
}

export async function trackPageTime(path: string, seconds: number): Promise<void> {
    if (seconds <= 0) return
    try {
        const { error } = await (supabase.rpc as any)('increment_page_time', { p_path: path, p_seconds: seconds })
        if (error) console.error('trackPageTime failed:', error.message)
    } catch (e) {
        console.error('trackPageTime exception:', e)
    }
}

// ─── Student login tracking ────────────────────────────────────────

export async function trackStudentLogin(): Promise<void> {
    try {
        const { error } = await (supabase.from as any)('student_logins').insert({})
        if (error) console.error('trackStudentLogin failed:', error.message, error)
    } catch (e) {
        console.error('trackStudentLogin exception:', e)
    }
}

export async function fetchStudentLoginCount(): Promise<number> {
    const { count, error } = await (supabase.from as any)('student_logins')
        .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
}

export interface DailyLoginCount {
    date: string   // YYYY-MM-DD
    count: number
}

export async function fetchDailyLoginCounts(): Promise<DailyLoginCount[]> {
    const sinceDate = '2026-03-14'

    const { data, error } = await (supabase.rpc as any)('daily_login_counts', { since_date: sinceDate })

    if (error) throw error

    // Build a map from the RPC results
    const countMap = new Map<string, number>()
    for (const row of (data ?? []) as { day: string; count: number }[]) {
        countMap.set(row.day, row.count)
    }

    // Fill all days (including 0-count days)
    const result: DailyLoginCount[] = []
    const cursor = new Date(sinceDate + 'T00:00:00')
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    while (cursor <= today) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
        result.push({ date: key, count: countMap.get(key) ?? 0 })
        cursor.setDate(cursor.getDate() + 1)
    }

    return result
}

export interface HourlyLoginCount {
    hour: number   // 0-23 (IST)
    count: number
}

export async function fetchHourlyLoginCounts(days = 30): Promise<HourlyLoginCount[]> {
    const d = new Date()
    d.setDate(d.getDate() - days)
    const sinceDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const { data, error } = await (supabase.rpc as any)('hourly_login_counts', { since_date: sinceDate })
    if (error) throw error

    const countMap = new Map<number, number>()
    for (const row of (data ?? []) as { hour: number; count: number }[]) {
        countMap.set(row.hour, Number(row.count))
    }

    return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: countMap.get(h) ?? 0 }))
}

export interface HourlyLoginCountByDayType {
    hour: number       // 0-23 (IST)
    dayType: 'weekday' | 'weekend'
    count: number
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtShort(d: Date): string {
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

// Returns the previous calendar week Mon–Sun as a date range
export function getPrevCalendarWeek(): { fromDate: string; toDate: string; weekLabel: string } {
    const now = new Date()
    const dow = now.getDay() // 0=Sun, 1=Mon, …, 6=Sat
    const daysSinceMonday = dow === 0 ? 6 : dow - 1

    const thisMonday = new Date(now)
    thisMonday.setDate(now.getDate() - daysSinceMonday)
    thisMonday.setHours(0, 0, 0, 0)

    const prevMonday = new Date(thisMonday)
    prevMonday.setDate(thisMonday.getDate() - 7)

    const prevSunday = new Date(thisMonday)
    prevSunday.setDate(thisMonday.getDate() - 1)

    return {
        fromDate: fmtDate(prevMonday),
        toDate: fmtDate(prevSunday),
        weekLabel: `${fmtShort(prevMonday)} – ${fmtShort(prevSunday)}`,
    }
}

export async function fetchHourlyLoginCountsByDayType(): Promise<HourlyLoginCountByDayType[]> {
    const { fromDate, toDate } = getPrevCalendarWeek()

    const { data, error } = await (supabase.rpc as any)('hourly_login_counts_by_daytype', {
        from_date: fromDate,
        to_date: toDate,
    })
    if (error) throw error

    return ((data ?? []) as { hour: number; day_type: string; count: number }[]).map(r => ({
        hour: r.hour,
        dayType: r.day_type as 'weekday' | 'weekend',
        count: Number(r.count),
    }))
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const [transcriptResult, qaResult, alumniResult, cwcResult, journeyResult, alumniJourneysResult] = await Promise.all([
        supabase.from('transcripts').select('*', { count: 'exact', head: true }),
        supabase.from('qa_items').select('*', { count: 'exact', head: true })
            .in('publish_level', ['homepage', 'category', 'archive']),
        supabase.from('transcript_alumni').select('company'),
        (supabase as any).from('cwc_registrations').select('*', { count: 'exact', head: true }),
        (supabase as any).from('journey_requests').select('*', { count: 'exact', head: true }),
        (supabase as any).from('alumni_journeys').select('*', { count: 'exact', head: true }),
    ])

    const alumniRows = (alumniResult.data ?? []) as { company: string }[]
    const uniqueCompanies = new Set(
        alumniRows.map(a => a.company?.toLowerCase().trim()).filter(Boolean)
    )

    return {
        total_qa_pairs: qaResult.count ?? 0,
        transcripts_analysed: transcriptResult.count ?? 0,
        categories_covered: ALL_CATEGORIES.length,
        total_companies: uniqueCompanies.size,
        cwc_registrations: cwcResult.count ?? 0,
        journey_requests: journeyResult.count ?? 0,
        total_alumni: alumniJourneysResult.count ?? 0,
        total_calls: transcriptResult.count ?? 0,
    }
}
