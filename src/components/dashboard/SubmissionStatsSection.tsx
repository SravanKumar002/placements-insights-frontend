import { useEffect, useState } from 'react'
import { ClipboardList, BookOpen, Star } from 'lucide-react'
import { supabase } from '../../config/supabase'
import { fetchFeedback } from '../../services/studentCtaService'
import type { FeedbackEntry } from '../../services/studentCtaService'

interface PageRating {
    category: string
    avg: number
    count: number
}

export function SubmissionStatsSection() {
    const [cwcCount, setCwcCount] = useState<number | null>(null)
    const [journeyCount, setJourneyCount] = useState<number | null>(null)
    const [pageRatings, setPageRatings] = useState<PageRating[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [cwcRes, journeyRes, feedbackData] = await Promise.all([
                (supabase as any).from('cwc_registrations').select('*', { count: 'exact', head: true }),
                (supabase as any).from('journey_requests').select('*', { count: 'exact', head: true }),
                fetchFeedback().catch(() => [] as FeedbackEntry[]),
            ])

            setCwcCount(cwcRes.count ?? 0)
            setJourneyCount(journeyRes.count ?? 0)

            // Compute per-category avg rating
            const withRating = (feedbackData as FeedbackEntry[]).filter(f => f.rating != null && f.category)
            const catMap = new Map<string, { sum: number; count: number }>()
            for (const f of withRating) {
                const cat = f.category!
                const existing = catMap.get(cat) ?? { sum: 0, count: 0 }
                existing.sum += f.rating!
                existing.count += 1
                catMap.set(cat, existing)
            }
            const ratings: PageRating[] = [...catMap.entries()]
                .map(([category, { sum, count }]) => ({ category, avg: sum / count, count }))
                .sort((a, b) => b.avg - a.avg)
            setPageRatings(ratings)

            setLoading(false)
        }
        load()
    }, [])

    const statCards = [
        {
            label: 'CWC Registrations',
            value: cwcCount,
            icon: ClipboardList,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        },
        {
            label: 'Journey Requests',
            value: journeyCount,
            icon: BookOpen,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
        },
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stat cards */}
            {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                <div key={label} className={`glass-card p-5 border ${border}`}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4.5 h-4.5 ${color}`} />
                        </div>
                        <h2 className="text-sm font-semibold text-surface-700">{label}</h2>
                    </div>
                    {loading ? (
                        <div className="h-9 w-16 rounded-lg bg-surface-100 animate-pulse" />
                    ) : (
                        <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
                    )}
                    <p className="text-[11px] text-surface-400 mt-1">Total unique submissions</p>
                </div>
            ))}

            {/* Page-wise ratings */}
            <div className="glass-card p-5 border border-amber-200">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Star className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-surface-700">Page Ratings</h2>
                        <p className="text-[11px] text-surface-400">Avg student rating by page</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-7 rounded bg-surface-100 animate-pulse" />
                        ))}
                    </div>
                ) : pageRatings.length === 0 ? (
                    <p className="text-xs text-surface-400 italic">No ratings submitted yet.</p>
                ) : (
                    <div className="space-y-2.5">
                        {pageRatings.map(r => (
                            <div key={r.category}>
                                <div className="flex justify-between text-[11px] mb-0.5">
                                    <span className="font-medium text-surface-700 truncate">{r.category}</span>
                                    <span className="shrink-0 ml-1 text-amber-600 font-semibold">
                                        ★ {r.avg.toFixed(1)} <span className="text-surface-400 font-normal">({r.count})</span>
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full"
                                        style={{ width: `${(r.avg / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
