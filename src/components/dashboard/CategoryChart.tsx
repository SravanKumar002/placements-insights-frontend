import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { fetchCategoryStats } from '../../services/qaService'
import { getCategoryMeta } from '../../utils/categoryHelpers'
import type { CategoryStats } from '../../types'
import type { QACategory } from '../../config/constants'

const BAR_COLORS: Record<string, string> = {
    'Non-IT to IT Transition': 'bg-purple-500',
    'Mindset': 'bg-sky-500',
    'Learning': 'bg-violet-500',
    'Technical Interviews': 'bg-cyan-500',
    'Resume': 'bg-amber-500',
    'Projects': 'bg-fuchsia-500',
    'HR Round': 'bg-pink-500',
    'Job Search': 'bg-teal-500',
    'AI Roles': 'bg-rose-500',
    'Academics': 'bg-emerald-500',
    'NxtWave Support': 'bg-blue-500',
}

const MAX_BAR_HEIGHT = 160 // px

export function CategoryChart() {
    const [stats, setStats] = useState<CategoryStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCategoryStats()
            .then(data => setStats(data.sort((a, b) => b.count - a.count)))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const maxCount = stats.length > 0 ? Math.max(...stats.map(s => s.count)) : 1
    const totalItems = stats.reduce((sum, s) => sum + s.count, 0)

    if (loading) {
        return <div className="glass-card p-5 h-[320px] animate-pulse" />
    }

    return (
        <div className="glass-card p-5 h-full flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4.5 h-4.5 text-brand-500" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-surface-800">Category Distribution</h2>
                    <p className="text-xs text-surface-500 mt-0.5">{totalItems} Qs across {stats.length} categories</p>
                </div>
            </div>

            {stats.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-8">No Q&A data yet.</p>
            ) : (
                <div className="flex items-end gap-1.5 overflow-x-auto" style={{ height: MAX_BAR_HEIGHT + 60 }}>
                    {stats.map(({ category, count }) => {
                        const meta = getCategoryMeta(category as QACategory)
                        const barHeight = Math.max((count / maxCount) * MAX_BAR_HEIGHT, 8)
                        const barColor = BAR_COLORS[category] ?? 'bg-surface-500'

                        return (
                            <div
                                key={category}
                                className="flex-1 min-w-[28px] flex flex-col items-center justify-end h-full group"
                            >
                                {/* Count label */}
                                <span className="text-[10px] font-bold text-surface-600 mb-1 tabular-nums">
                                    {count}
                                </span>

                                {/* Bar */}
                                <div
                                    className={`w-full max-w-[28px] rounded-t-md ${barColor} opacity-75 group-hover:opacity-100 transition-all duration-300`}
                                    style={{ height: barHeight }}
                                    title={`${category}: ${count}`}
                                />

                                {/* Label */}
                                <div className="mt-2 flex flex-col items-center w-full">
                                    <span className="text-sm" title={category}>{meta.emoji}</span>
                                    <span
                                        className="text-[9px] text-surface-500 text-center leading-tight truncate w-full mt-0.5 hidden sm:block"
                                        title={category}
                                    >
                                        {meta.short}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
