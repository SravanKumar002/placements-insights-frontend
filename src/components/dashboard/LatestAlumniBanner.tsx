import { useState, useEffect } from 'react'
import { Sparkles, Building2 } from 'lucide-react'
import { fetchLatestJourney } from '../../services/alumniJourneyService'
import type { AlumniJourney } from '../../services/alumniJourneyService'

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days} days ago`
    const weeks = Math.floor(days / 7)
    if (weeks === 1) return '1 week ago'
    if (weeks < 5) return `${weeks} weeks ago`
    const months = Math.floor(days / 30)
    return months <= 1 ? '1 month ago' : `${months} months ago`
}

export function LatestAlumniBanner() {
    const [latest, setLatest] = useState<AlumniJourney | null>(null)

    useEffect(() => {
        fetchLatestJourney().then(setLatest).catch(console.error)

        const handler = () => fetchLatestJourney().then(setLatest).catch(console.error)
        window.addEventListener('journey-added', handler)
        return () => window.removeEventListener('journey-added', handler)
    }, [])

    if (!latest) return null

    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-brand-500" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-brand-500 font-medium uppercase tracking-wide mb-0.5">Latest Alumni Added</p>
                <p className="text-sm text-surface-700 truncate">
                    <span className="font-semibold">{latest.name}</span>
                    {latest.role && <span className="text-surface-500"> · {latest.role}</span>}
                    {latest.company && (
                        <span className="inline-flex items-center gap-1 ml-1.5 text-surface-500">
                            <Building2 className="w-3 h-3" />
                            {latest.company}
                        </span>
                    )}
                </p>
            </div>
            <span className="ml-auto text-xs text-surface-500 shrink-0">
                {timeAgo(latest.created_at)}
            </span>
        </div>
    )
}
