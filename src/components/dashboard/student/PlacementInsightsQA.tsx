import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchFromKnowledgeBasePaginated } from '../../../services/qaService'
import { getCategoryEmoji } from '../../../utils/categoryHelpers'
import { CATEGORY_META, type QACategory } from '../../../config/constants'
import type { QAItem } from '../../../types'

const CLIENT_PAGE_SIZE = 5

export function PlacementInsightsQA() {
    const [allItems, setAllItems] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)
    const [clientPage, setClientPage] = useState(0)

    useEffect(() => {
        fetchFromKnowledgeBasePaginated(undefined, 0, 25, 'highest_score')
            .then(({ items }) => setAllItems(items))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const totalClientPages = Math.ceil(allItems.length / CLIENT_PAGE_SIZE)
    const visible = allItems.slice(clientPage * CLIENT_PAGE_SIZE, (clientPage + 1) * CLIENT_PAGE_SIZE)

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-surface-800">Placement Preparation Insights</h2>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-28 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : allItems.length === 0 ? (
                <div className="glass-card p-8 text-center text-surface-500 text-sm">
                    No Q&A insights available yet.
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {visible.map(item => {
                            const meta = CATEGORY_META[item.category as QACategory]
                            return (
                                <Link
                                    key={item.id}
                                    to={`/search?id=${item.id}`}
                                    className="block glass-card p-4 hover:border-brand-400 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg shrink-0 mt-0.5">{getCategoryEmoji(item.category)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-surface-800 group-hover:text-brand-600 transition-colors">
                                                {item.question}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {meta && (
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.bgColor} ${meta.color}`}>
                                                        {meta.short}
                                                    </span>
                                                )}
                                                {item.answers && item.answers.length > 0 && (
                                                    <span className="text-[10px] text-surface-400">
                                                        {item.answers.length} answer{item.answers.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            {item.consolidated_answer && (
                                                <p className="mt-2 text-xs text-surface-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                                    {item.consolidated_answer}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {totalClientPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <button
                                onClick={() => setClientPage(p => p - 1)}
                                disabled={clientPage === 0}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                            </button>
                            <span className="text-xs text-surface-400">
                                {clientPage + 1} / {totalClientPages}
                            </span>
                            <button
                                onClick={() => setClientPage(p => p + 1)}
                                disabled={clientPage >= totalClientPages - 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
