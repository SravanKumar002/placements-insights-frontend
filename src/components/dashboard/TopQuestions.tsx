import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { fetchTopQuestions } from '../../services/qaService'
import { AskCountBadge } from '../qa/AskCountBadge'
import { getCategoryEmoji, getCategoryShort } from '../../utils/categoryHelpers'
import type { QAItem } from '../../types'

export function TopQuestions() {
    const [items, setItems] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTopQuestions().then(setItems).catch(console.error).finally(() => setLoading(false))
    }, [])

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    <h2 className="section-title">Top Questions</h2>
                </div>
                <span className="text-xs text-surface-400">1 per category</span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <Link
                            key={item.id}
                            to={`/search?id=${item.id}`}
                            className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-xl hover:bg-surface-100 transition-colors group"
                        >
                            <span className="text-xs font-bold text-surface-400 w-5 shrink-0 tabular-nums mt-0.5 sm:mt-0">#{idx + 1}</span>
                            <span className="text-base shrink-0 mt-0.5 sm:mt-0">{getCategoryEmoji(item.category)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-surface-700 group-hover:text-surface-900 transition-colors sm:line-clamp-1">
                                    {item.question}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-surface-400">{getCategoryShort(item.category)}</span>
                                    <span className="sm:hidden"><AskCountBadge count={item.ask_count} small /></span>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 shrink-0">
                                <AskCountBadge count={item.ask_count} small />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
