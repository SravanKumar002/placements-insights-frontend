import { useEffect, useState } from 'react'
import { Activity, Clock, Star } from 'lucide-react'
import { fetchPageViewStats, type PageViewRow } from '../../services/analyticsService'
import { fetchFeedback, type FeedbackEntry } from '../../services/studentCtaService'

const TRACKED_PAGES = [
    { path: '/qa', label: 'Placement Doubts', category: 'Placement Doubts' },
    { path: '/alumni-journey', label: 'Academy Alumni', category: 'Academy Alumni' },
    { path: '/interview-intelligence', label: 'Interview Intelligence', category: 'NxtWave Interview Intelligence' },
    { path: '/hiring-pulse', label: 'Academy Hiring Pulse++', category: 'Academy Hiring Pulse++' },
    { path: '/posters', label: 'Academy Hiring Pulse (Old)', category: 'Academy Hiring Pulse' },
]

function formatCount(n: number): string {
    return n.toLocaleString()
}

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '—'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`
}


interface PageStat {
    label: string
    path: string
    views: number
    totalSeconds: number
    avgRating: number | null
    ratingCount: number
}

export function PageEngagementSection() {
    const [stats, setStats] = useState<PageStat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [rows, feedbackData] = await Promise.all([
                fetchPageViewStats().catch(() => [] as PageViewRow[]),
                fetchFeedback().catch(() => [] as FeedbackEntry[]),
            ])

            const ratingMap = new Map<string, { sum: number; count: number }>()
            for (const f of feedbackData) {
                if (f.rating != null && f.category) {
                    const existing = ratingMap.get(f.category) ?? { sum: 0, count: 0 }
                    existing.sum += f.rating
                    existing.count += 1
                    ratingMap.set(f.category, existing)
                }
            }

            const pageStats: PageStat[] = TRACKED_PAGES.map(tp => {
                let views = 0
                let totalSeconds = 0
                for (const row of rows) {
                    const matches = tp.path === '/qa'
                        ? (row.page_path === '/qa' || row.page_path.startsWith('/qa/'))
                        : row.page_path === tp.path
                    if (matches) {
                        views += row.view_count
                        totalSeconds += Number(row.total_time_seconds) || 0
                    }
                }
                const rating = ratingMap.get(tp.category)
                return {
                    label: tp.label,
                    path: tp.path,
                    views,
                    totalSeconds,
                    avgRating: rating ? rating.sum / rating.count : null,
                    ratingCount: rating?.count ?? 0,
                }
            }).sort((a, b) => b.views - a.views)

            setStats(pageStats)
            setLoading(false)
        }
        load()
    }, [])

    return (
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Activity className="text-blue-500 w-[18px] h-[18px]" /> Content Intensity
                </h3>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">By Visit Volume</span>
            </div>

            {/* Insight */}
            {!loading && stats.length > 0 && (() => {
                const topVisits = stats[0]
                const topTime = [...stats].sort((a, b) => b.totalSeconds - a.totalSeconds)[0]
                return (
                    <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] leading-relaxed text-slate-500 italic">
<span className="font-black text-blue-700">{topVisits.label}</span> leads with <span className="font-black text-slate-800">{formatCount(topVisits.views)}</span> visits
                            {topTime.label !== topVisits.label
                                ? <>, while <span className="font-black text-blue-700">{topTime.label}</span> sees the deepest engagement at <span className="font-black text-slate-800">{formatTime(topTime.totalSeconds)}</span> total time spent.</>
                                : <> and <span className="font-black text-slate-800">{formatTime(topTime.totalSeconds)}</span> total time spent — the top performer across both metrics.</>
                            }
                        </p>
                    </div>
                )
            })()}

            {/* Rows */}
            <div className="flex flex-col gap-3 flex-1">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-slate-50 animate-pulse h-14" />
                    ))
                ) : (
                    stats.map(s => {
                        return (
                            <div
                                key={s.label}
                                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 group hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300 cursor-default"
                            >
                                {/* Row 1: name + visits */}
                                <div className="flex items-center justify-between sm:contents gap-2">
                                    <p className="flex-1 min-w-0 text-[10px] font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{s.label}</p>
                                    <div className="text-right shrink-0 sm:order-last">
                                        <p className="text-sm font-black text-slate-800 tracking-tighter leading-none tabular-nums">{formatCount(s.views)}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Visits</p>
                                    </div>
                                </div>

                                {/* Row 2 (mobile) / inline (desktop): time + rating */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                        <span className="text-[9px] font-bold text-slate-500 tabular-nums">{formatTime(s.totalSeconds)}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                        <span className="text-[9px] font-black text-slate-800 tabular-nums">{s.avgRating != null ? s.avgRating.toFixed(1) : '—'}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

        </div>
    )
}
