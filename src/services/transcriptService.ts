import { supabase } from '../config/supabase'
import type { Transcript, TranscriptAlumni, TranscriptUploadPayload, AlumniMeta } from '../types'

function deriveLogoUrl(companyUrl: string | null | undefined): string | null {
    if (!companyUrl) return null
    try {
        const hostname = new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname
        return `https://logo.clearbit.com/${hostname}`
    } catch {
        return null
    }
}

export interface LatestAlumni {
    alumni_name: string
    company: string
    role: string
    call_date: string | null
    created_at: string
}

// Fetch the most recently processed transcript for the "latest alumni" banner
export async function fetchLatestAlumni(): Promise<LatestAlumni | null> {
    const { data, error } = await supabase
        .from('transcripts')
        .select('alumni_name, company, role, call_date, created_at')
        .eq('processing_status', 'done')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) return null
    return data as LatestAlumni
}

// Fetch all transcripts sorted by most recent
export async function fetchTranscripts(): Promise<Transcript[]> {
    const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data as Transcript[]) ?? []
}

// Fetch a single transcript by ID
export async function fetchTranscriptById(id: string): Promise<Transcript | null> {
    const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data as Transcript
}

// Fetch alumni entries for a transcript
export async function fetchTranscriptAlumni(transcriptId: string): Promise<TranscriptAlumni[]> {
    const { data, error } = await supabase
        .from('transcript_alumni')
        .select('*')
        .eq('transcript_id', transcriptId)
        .order('sort_order', { ascending: true })

    if (error) throw error
    return (data ?? []) as TranscriptAlumni[]
}

// Upload a new transcript with optional alumni
export async function uploadTranscript(payload: TranscriptUploadPayload): Promise<Transcript> {
    const primaryAlumni = payload.alumni[0]

    // Use call_label as display name when no alumni info provided yet
    const insertPayload = {
        alumni_name: primaryAlumni?.name || payload.call_label || 'Untitled Recording',
        company: primaryAlumni?.company || '',
        role: primaryAlumni?.role || '',
        transcript_text: payload.transcript_text,
        processing_status: 'pending' as const,
        package_lpa: primaryAlumni?.package_lpa ?? null,
        batch: primaryAlumni?.batch || null,
        branch: primaryAlumni?.branch || null,
        call_date: payload.call_date || null,
    }

    const { data, error } = await supabase
        .from('transcripts')
        .insert(insertPayload)
        .select()
        .single()

    if (error) throw error
    const transcript = data as unknown as Transcript

    // Only insert alumni rows if actual alumni data was provided
    if (payload.alumni.length > 0) {
        const alumniRows = payload.alumni.map((a, index) => ({
            transcript_id: transcript.id,
            alumni_name: a.name,
            company: a.company,
            role: a.role,
            package_lpa: a.package_lpa ?? null,
            batch: a.batch || null,
            branch: a.branch || null,
            college: a.college || null,
            graduation_year: a.graduation_year || null,
            location: a.location || null,
            company_url: a.company_url || null,
            company_logo_url: a.company_logo_url || deriveLogoUrl(a.company_url) || null,
            sort_order: index,
        }))
        const { error: alumniError } = await supabase
            .from('transcript_alumni')
            .insert(alumniRows)
        if (alumniError) console.error('[uploadTranscript] Alumni insert error:', alumniError)
    }

    return transcript
}

// Add alumni to an existing transcript
export async function insertTranscriptAlumni(transcriptId: string, alumni: AlumniMeta[]): Promise<void> {
    // Get current count to set sort_order
    const { count } = await supabase
        .from('transcript_alumni')
        .select('*', { count: 'exact', head: true })
        .eq('transcript_id', transcriptId)

    const startIndex = count ?? 0
    const rows = alumni.map((a, i) => ({
        transcript_id: transcriptId,
        alumni_name: a.name,
        company: a.company,
        role: a.role,
        package_lpa: a.package_lpa ?? null,
        batch: a.batch || null,
        branch: a.branch || null,
        college: a.college || null,
        graduation_year: a.graduation_year || null,
        location: a.location || null,
        company_url: a.company_url || null,
        company_logo_url: a.company_logo_url || deriveLogoUrl(a.company_url) || null,
        sort_order: startIndex + i,
    }))

    const { error } = await supabase.from('transcript_alumni').insert(rows)
    if (error) throw error

    // Update the transcript's primary alumni_name if it was a placeholder
    if (alumni[0]) {
        await supabase
            .from('transcripts')
            .update({ alumni_name: alumni[0].name, company: alumni[0].company, role: alumni[0].role })
            .eq('id', transcriptId)
    }
}

// Update transcript processing status
export async function updateTranscriptStatus(
    id: string,
    status: 'pending' | 'processing' | 'done' | 'error',
    errorMessage?: string
): Promise<void> {
    const { error } = await supabase
        .from('transcripts')
        .update({ processing_status: status, error_message: errorMessage ?? null })
        .eq('id', id)

    if (error) throw error
}

// Delete a transcript and all related data
export async function deleteTranscript(id: string): Promise<void> {
    // 1. Find qa_item IDs linked to this transcript (via qa_answers)
    const { data: answers } = await supabase
        .from('qa_answers')
        .select('qa_item_id')
        .eq('transcript_id', id)

    const qaItemIds = answers
        ? [...new Set(answers.map((a: { qa_item_id: string }) => a.qa_item_id))]
        : []

    // 2. Delete qa_answers for this transcript
    const { error: answersErr } = await supabase
        .from('qa_answers')
        .delete()
        .eq('transcript_id', id)
    if (answersErr) throw answersErr

    // 3. Delete orphaned qa_items (items with no remaining answers)
    for (const qaItemId of qaItemIds) {
        const { data: remaining } = await supabase
            .from('qa_answers')
            .select('id')
            .eq('qa_item_id', qaItemId)
            .limit(1)

        if (!remaining || remaining.length === 0) {
            await supabase.from('qa_items').delete().eq('id', qaItemId)
        }
    }

    // 4. Delete transcript_alumni
    await supabase.from('transcript_alumni').delete().eq('transcript_id', id)

    // 5. Delete the transcript itself
    const { error: transcriptErr } = await supabase
        .from('transcripts')
        .delete()
        .eq('id', id)
    if (transcriptErr) throw transcriptErr

    // 6. Verify it was actually deleted (RLS may silently block deletes)
    const { data: check } = await supabase
        .from('transcripts')
        .select('id')
        .eq('id', id)
        .maybeSingle()
    if (check) {
        throw new Error('Delete was blocked by Row Level Security. Add DELETE policies in Supabase SQL Editor.')
    }
}
