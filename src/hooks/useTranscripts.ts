import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchTranscripts } from '../services/transcriptService'
import { supabase } from '../config/supabase'
import type { Transcript, TranscriptAlumni } from '../types'

const POLL_INTERVAL = 5000 // 5 seconds while transcripts are processing

export function useTranscripts() {
    const [transcripts, setTranscripts] = useState<Transcript[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const load = useCallback(async () => {
        try {
            const data = await fetchTranscripts()

            // Fetch alumni for all transcripts to attach counts
            const ids = data.map(t => t.id)
            if (ids.length > 0) {
                const { data: alumniRows } = await supabase
                    .from('transcript_alumni')
                    .select('id, transcript_id, alumni_name, company, role, sort_order')
                    .in('transcript_id', ids)
                    .order('sort_order', { ascending: true })

                if (alumniRows && alumniRows.length > 0) {
                    const grouped = new Map<string, TranscriptAlumni[]>()
                    for (const row of alumniRows as unknown as TranscriptAlumni[]) {
                        const list = grouped.get(row.transcript_id) ?? []
                        list.push(row)
                        grouped.set(row.transcript_id, list)
                    }
                    for (const t of data) {
                        t.alumni = grouped.get(t.id)
                    }
                }
            }

            setTranscripts(data)
            setError(null)
            return data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load transcripts')
            return null
        }
    }, [])

    // Initial load
    useEffect(() => {
        load().finally(() => setLoading(false))
    }, [load])

    // Listen for custom 'transcript-uploaded' event from upload modal
    useEffect(() => {
        const handler = () => { load() }
        window.addEventListener('transcript-uploaded', handler)
        return () => window.removeEventListener('transcript-uploaded', handler)
    }, [load])

    // Smart polling: poll while any transcript is pending/processing
    useEffect(() => {
        const hasActive = transcripts.some(
            t => t.processing_status === 'pending' || t.processing_status === 'processing'
        )

        if (hasActive && !pollRef.current) {
            pollRef.current = setInterval(() => { load() }, POLL_INTERVAL)
        } else if (!hasActive && pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current)
                pollRef.current = null
            }
        }
    }, [transcripts, load])

    // Keep Realtime subscription as bonus (works when publication is configured)
    useEffect(() => {
        const subscription = supabase
            .channel('transcripts_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transcripts' }, () => {
                load()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [load])

    return { transcripts, loading, error, refetch: load }
}
