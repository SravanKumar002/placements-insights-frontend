import { useState, useEffect } from 'react'
import { fetchAlumniProfile, fetchAlumniProfileById, type AlumniProfile } from '../services/alumniService'

export function useAlumniDetail(id: string | null) {
    const [profile, setProfile] = useState<AlumniProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        setError(null)
        // Try as transcript_alumni ID first, fall back to transcript ID
        fetchAlumniProfileById(id)
            .then(result => {
                if (result) return result
                return fetchAlumniProfile(id)
            })
            .then(setProfile)
            .catch(err => setError(err instanceof Error ? err.message : 'Failed to load alumni'))
            .finally(() => setLoading(false))
    }, [id])

    return { profile, loading, error }
}
