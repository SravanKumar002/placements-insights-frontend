import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { fetchPageViewStats, type PageViewRow } from '../../services/analyticsService'

const TRACKED_PAGES: { path: string; label: string; color: string }[] = [
    { path: '/qa', label: 'Placement Doubts', color: 'bg-blue-600' },
    { path: '/alumni-journey', label: 'Academy Alumni', color: 'bg-blue-400' },
    { path: '/interview-intelligence', label: 'Interview Intelligence', color: 'bg-slate-500' },
    { path: '/posters', label: 'Academy Hiring Pulse', color: 'bg-slate-400' },
]

function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`
}

export function PageTimeSection() {
    const [rows, setRows] = useState<PageViewRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPageViewStats()
            .then(setRows)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const pageData = TRACKED_PAGES.map(tp => {
        let count = 0
        let totalSeconds = 0
        for (const row of rows) {
            if (tp.path === '/qa') {
                if (row.page_path === '/qa' || row.page_path.startsWith('/qa/')) {
                    count += row.view_count
                    totalSeconds += row.total_time_seconds ?? 0
                }
            } else if (row.page_path === tp.path) {
                count += row.view_count
                totalSeconds += row.total_time_seconds ?? 0
            }
        }
        return { ...tp, count, totalSeconds }
    }).sort((a, b) => b.totalSeconds - a.totalSeconds)

    const totalTime = pageData.reduce((s, p) => s + p.totalSeconds, 0)
    const maxTime = Math.max(...pageData.map(p => p.totalSeconds), 1)

    if (loading) {
        return <div className="glass-card p-5 border border-blue-200 h-[320px] animate-pulse" />
    }

    return (
        <div className="glass-card p-5 border border-blue-200 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div className="flex-1">
                    <h2 className="text-base font-semibold text-surface-800">Time Spent</h2>
                    <p className="text-xs text-surface-500 mt-0.5">Total time spent by page</p>
                </div>
                {totalTime > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">{formatTime(totalTime)}</span>
                    </div>
                )}
            </div>

            {/* Chart — sorted by total time */}
            <div className="flex-1 flex flex-col justify-center gap-4">
                {pageData.map(page => {
                    const barPct = maxTime > 0 ? (page.totalSeconds / maxTime) * 100 : 0
                    const barWidth = page.totalSeconds > 0 ? Math.max(barPct, 6) : 2

                    return (
                        <div key={page.path} className="flex items-center gap-3">
                            {/* Y-axis label */}
                            <span
                                className="text-xs font-semibold text-surface-600 text-right shrink-0 leading-tight"
                                style={{ width: 130 }}
                            >
                                {page.label}
                            </span>

                            {/* Bar with avg time at tip */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className={`h-8 rounded-sm ${page.color} opacity-80 hover:opacity-100 transition-all duration-300 flex items-center justify-end pr-2`}
                                    style={{ width: `${barWidth}%`, minWidth: 56 }}
                                >
                                    <span className="text-[11px] font-bold text-white tabular-nums whitespace-nowrap">
                                        {formatTime(page.totalSeconds)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
