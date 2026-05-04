import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { fetchPageViewStats, type PageViewRow } from '../../services/analyticsService'

const TRACKED_PAGES: { path: string; label: string; color: string }[] = [
    { path: '/qa', label: 'Placement Doubts', color: 'bg-blue-500' },
    { path: '/alumni-journey', label: 'Academy Alumni', color: 'bg-blue-400' },
    { path: '/interview-intelligence', label: 'Interview Intelligence', color: 'bg-slate-500' },
    { path: '/posters', label: 'Academy Hiring Pulse', color: 'bg-slate-400' },
]

export function PageViewsSection() {
    const [rows, setRows] = useState<PageViewRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPageViewStats()
            .then(setRows)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const pageCounts = TRACKED_PAGES.map(tp => {
        let count = 0
        for (const row of rows) {
            if (tp.path === '/qa') {
                if (row.page_path === '/qa' || row.page_path.startsWith('/qa/')) {
                    count += row.view_count
                }
            } else if (row.page_path === tp.path) {
                count += row.view_count
            }
        }
        return { ...tp, count }
    }).sort((a, b) => b.count - a.count)

    const totalViews = pageCounts.reduce((s, p) => s + p.count, 0)
    const maxCount = Math.max(...pageCounts.map(p => p.count), 1)

    if (loading) {
        return <div className="glass-card p-5 border border-brand-300 h-[320px] animate-pulse" />
    }

    return (
        <div className="glass-card p-5 border border-brand-300 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Eye className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-surface-800">Page Views</h2>
                    <p className="text-xs text-surface-500 mt-0.5">{totalViews.toLocaleString()} total views</p>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 flex flex-col justify-center gap-4">
                {pageCounts.map(page => {
                    const barPct = maxCount > 0 ? (page.count / maxCount) * 100 : 0
                    const barWidth = page.count > 0 ? Math.max(barPct, 6) : 2

                    return (
                        <div key={page.path} className="flex items-center gap-3">
                            {/* Y-axis label */}
                            <span
                                className="text-xs font-semibold text-surface-600 text-right shrink-0 leading-tight"
                                style={{ width: 130 }}
                            >
                                {page.label}
                            </span>

                            {/* Bar with count at tip */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className={`h-8 rounded-sm ${page.color} opacity-80 hover:opacity-100 transition-all duration-300 flex items-center justify-end pr-2`}
                                    style={{ width: `${barWidth}%`, minWidth: 48 }}
                                >
                                    <span className="text-[11px] font-bold text-white tabular-nums">
                                        {page.count.toLocaleString()}
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
