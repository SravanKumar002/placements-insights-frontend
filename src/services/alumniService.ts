import { supabase } from '../config/supabase'
import type { QAAnswer, Transcript, TranscriptAlumni, InterviewRound } from '../types'

// ─── Student homepage data types ─────────────────────────────────────────────

export interface InterviewPreview {
    alumni_name: string
    company: string
    role: string
    company_logo_url: string | null
    interview_process: InterviewRound[]
    skills_tested: string[]
    platforms_used: string[]
    alumni_id: string
}

export interface SkillTrend {
    skill: string
    count: number
}

export interface AlumniProfile {
    name: string
    company: string
    role: string
    package_lpa: number | null
    batch: string | null
    branch: string | null
    college: string | null
    graduation_year: string | null
    location: string | null
    company_logo_url?: string | null
    company_url?: string | null
    interview_process?: InterviewRound[] | null
    skills_tested?: string[] | null
    platforms_used?: string[] | null
    transcript_id: string
    alumni_id?: string
    call_date: string | null
    contributions: QAAnswer[]
    transcript_text?: string
}

// Paginated alumni — two queries: first get all done-transcript IDs, then .range() on alumni
export async function fetchAlumniPaginated(
    page: number,
    pageSize: number
): Promise<{ alumni: Omit<AlumniProfile, 'contributions' | 'transcript_text'>[]; totalCount: number }> {
    // Step 1: all done transcript IDs + call_dates (cheap – IDs only)
    const { data: doneTranscripts } = await supabase
        .from('transcripts')
        .select('id, call_date')
        .eq('processing_status', 'done')

    const transcriptMap = new Map(
        (doneTranscripts ?? []).map((t: { id: string; call_date: string | null }) => [t.id, t.call_date])
    )
    const doneIds = [...transcriptMap.keys()]

    if (doneIds.length === 0) return { alumni: [], totalCount: 0 }

    // Step 2: paginated alumni from those transcripts
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await (supabase
        .from('transcript_alumni')
        .select('id, transcript_id, alumni_name, company, role, package_lpa, batch, branch, college, graduation_year, location, company_logo_url, company_url, interview_process, skills_tested, platforms_used', { count: 'exact' }) as any)
        .in('transcript_id', doneIds)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) throw error

    const alumni = (data ?? []).map((a: Record<string, unknown>) => ({
        name: a.alumni_name as string,
        company: a.company as string,
        role: a.role as string,
        package_lpa: a.package_lpa as number | null,
        batch: a.batch as string | null,
        branch: a.branch as string | null,
        college: a.college as string | null,
        graduation_year: a.graduation_year as string | null,
        location: a.location as string | null,
        company_logo_url: a.company_logo_url as string | null,
        company_url: a.company_url as string | null,
        interview_process: a.interview_process as InterviewRound[] | null,
        skills_tested: a.skills_tested as string[] | null,
        transcript_id: a.transcript_id as string,
        alumni_id: a.id as string,
        call_date: transcriptMap.get(a.transcript_id as string) ?? null,
    }))

    return { alumni, totalCount: count ?? 0 }
}

// Get all unique alumni from junction table
export async function fetchAllAlumni(): Promise<Omit<AlumniProfile, 'contributions' | 'transcript_text'>[]> {
    const { data, error } = await (supabase
        .from('transcript_alumni')
        .select('id, transcript_id, alumni_name, company, role, package_lpa, batch, branch, college, graduation_year, location, company_logo_url, company_url, interview_process, skills_tested, platforms_used') as any)
        .order('created_at', { ascending: false })

    if (error) throw error

    // Filter to only alumni from processed transcripts
    const alumniRows = (data ?? []) as Record<string, unknown>[]
    if (alumniRows.length === 0) return []

    const transcriptIds = [...new Set(alumniRows.map(a => a.transcript_id as string))]
    const { data: transcripts } = await supabase
        .from('transcripts')
        .select('id, call_date, processing_status')
        .in('id', transcriptIds)
        .eq('processing_status', 'done')

    const transcriptMap = new Map(
        (transcripts ?? []).map((t: { id: string; call_date: string | null }) => [t.id, t.call_date])
    )

    return alumniRows
        .filter(a => transcriptMap.has(a.transcript_id as string))
        .map(a => ({
            name: a.alumni_name as string,
            company: a.company as string,
            role: a.role as string,
            package_lpa: a.package_lpa as number | null,
            batch: a.batch as string | null,
            branch: a.branch as string | null,
            college: a.college as string | null,
            graduation_year: a.graduation_year as string | null,
            location: a.location as string | null,
            company_logo_url: a.company_logo_url as string | null,
            company_url: a.company_url as string | null,
            interview_process: a.interview_process as InterviewRound[] | null,
            skills_tested: a.skills_tested as string[] | null,
            platforms_used: a.platforms_used as string[] | null,
            transcript_id: a.transcript_id as string,
            alumni_id: a.id as string,
            call_date: transcriptMap.get(a.transcript_id as string) ?? null,
        }))
}

// Get full alumni profile by transcript_alumni ID
export async function fetchAlumniProfileById(alumniId: string): Promise<AlumniProfile | null> {
    const { data: alumniRow, error: aError } = await (supabase
        .from('transcript_alumni')
        .select('*') as any)
        .eq('id', alumniId)
        .single()

    if (aError || !alumniRow) return null
    const row = alumniRow as TranscriptAlumni

    // Run transcript + answers in parallel (both only need transcript_id)
    const [transcriptResult, answersResult] = await Promise.all([
        supabase.from('transcripts')
            .select('call_date, transcript_text')
            .eq('id', row.transcript_id)
            .single(),
        supabase.from('qa_answers')
            .select('*')
            .eq('transcript_id', row.transcript_id)
            .eq('alumni_name', row.alumni_name)
            .order('created_at', { ascending: false }),
    ])

    if (transcriptResult.error) throw transcriptResult.error
    if (answersResult.error) throw answersResult.error

    const transcript = transcriptResult.data as { call_date: string | null; transcript_text: string } | null
    return {
        name: row.alumni_name,
        company: row.company,
        role: row.role,
        package_lpa: row.package_lpa,
        batch: row.batch,
        branch: row.branch,
        college: row.college,
        graduation_year: row.graduation_year,
        location: row.location,
        company_logo_url: row.company_logo_url ?? null,
        company_url: row.company_url ?? null,
        interview_process: row.interview_process ?? null,
        skills_tested: row.skills_tested ?? null,
        platforms_used: row.platforms_used ?? null,
        transcript_id: row.transcript_id,
        alumni_id: row.id,
        call_date: transcript?.call_date ?? null,
        contributions: (answersResult.data ?? []) as QAAnswer[],
        transcript_text: transcript?.transcript_text,
    }
}

// Get full alumni profile by transcript ID (backward compat)
export async function fetchAlumniProfile(transcriptId: string): Promise<AlumniProfile | null> {
    // Try junction table first
    const { data: alumniRows } = await supabase
        .from('transcript_alumni')
        .select('*')
        .eq('transcript_id', transcriptId)
        .order('sort_order', { ascending: true })
        .limit(1)

    if (alumniRows && alumniRows.length > 0) {
        const firstRow = alumniRows[0] as unknown as TranscriptAlumni
        return fetchAlumniProfileById(firstRow.id)
    }

    // Fallback: read from transcript columns directly
    const { data, error: tError } = await supabase
        .from('transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single()

    if (tError) throw tError
    const transcript = data as unknown as Transcript

    const { data: answers, error: aError } = await supabase
        .from('qa_answers')
        .select('*')
        .eq('transcript_id', transcriptId)
        .order('created_at', { ascending: false })

    if (aError) throw aError

    return {
        name: transcript.alumni_name,
        company: transcript.company,
        role: transcript.role,
        package_lpa: transcript.package_lpa,
        batch: transcript.batch,
        branch: transcript.branch,
        college: null,
        graduation_year: null,
        location: null,
        transcript_id: transcript.id,
        call_date: transcript.call_date,
        contributions: (answers ?? []) as QAAnswer[],
        transcript_text: transcript.transcript_text,
    }
}

function deriveLogoUrl(companyUrl: string | null | undefined): string | null {
    if (!companyUrl) return null
    try {
        const hostname = new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname
        return `https://logo.clearbit.com/${hostname}`
    } catch {
        return null
    }
}

// Update alumni profile fields (syncs to qa_answers)
export async function updateAlumni(
    alumniId: string,
    updates: {
        alumni_name?: string
        company?: string
        role?: string
        batch?: string | null
        branch?: string | null
        college?: string | null
        graduation_year?: string | null
        location?: string | null
        company_url?: string | null
        company_logo_url?: string | null
    }
): Promise<void> {
    // Fetch old record so we can match denormalized rows
    const { data: old, error: fetchErr } = await supabase
        .from('transcript_alumni')
        .select('transcript_id, alumni_name')
        .eq('id', alumniId)
        .single()

    if (fetchErr || !old) throw fetchErr ?? new Error('Alumni not found')

    const { transcript_id, alumni_name: oldName } = old as { transcript_id: string; alumni_name: string }

    // Auto-derive logo from company URL
    if (updates.company_url !== undefined) {
        updates.company_logo_url = deriveLogoUrl(updates.company_url)
    }

    // Build the subset of fields shared with qa_answers
    const shared: Record<string, unknown> = {}
    if (updates.alumni_name !== undefined) shared.alumni_name = updates.alumni_name
    if (updates.company !== undefined) shared.company = updates.company
    if (updates.role !== undefined) shared.role = updates.role
    if (updates.batch !== undefined) shared.batch = updates.batch
    if (updates.branch !== undefined) shared.branch = updates.branch

    // Update both tables in parallel
    const [primary, answers] = await Promise.all([
        (supabase.from('transcript_alumni').update(updates) as any).eq('id', alumniId),
        Object.keys(shared).length > 0
            ? supabase.from('qa_answers').update(shared).eq('transcript_id', transcript_id).eq('alumni_name', oldName)
            : Promise.resolve({ error: null }),
    ])

    if (primary.error) throw primary.error
    if (answers.error) throw answers.error
}

// ─── Student homepage service functions ──────────────────────────────────────

export async function fetchInterviewPreviews(limit = 3): Promise<InterviewPreview[]> {
    const { data, error } = await (supabase
        .from('transcript_alumni')
        .select('id, alumni_name, company, role, company_logo_url, interview_process, skills_tested, platforms_used') as any)
        .not('interview_process', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error

    return (data ?? [])
        .filter((a: Record<string, unknown>) => {
            const proc = a.interview_process as InterviewRound[] | null
            return proc && proc.length > 0
        })
        .map((a: Record<string, unknown>) => ({
            alumni_name: a.alumni_name as string,
            company: a.company as string,
            role: a.role as string,
            company_logo_url: a.company_logo_url as string | null,
            interview_process: a.interview_process as InterviewRound[],
            skills_tested: (a.skills_tested as string[]) ?? [],
            platforms_used: (a.platforms_used as string[]) ?? [],
            alumni_id: a.id as string,
        }))
}

export async function fetchSkillTrends(): Promise<SkillTrend[]> {
    const { data, error } = await (supabase
        .from('transcript_alumni')
        .select('skills_tested') as any)
        .not('skills_tested', 'is', null)

    if (error) throw error

    const freq = new Map<string, number>()
    for (const row of (data ?? []) as { skills_tested: string[] }[]) {
        for (const skill of row.skills_tested ?? []) {
            const normalized = skill.trim()
            if (normalized) freq.set(normalized, (freq.get(normalized) ?? 0) + 1)
        }
    }

    return [...freq.entries()]
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
}
