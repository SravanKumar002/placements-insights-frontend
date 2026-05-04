import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { fetchTopQuestions } from '../../services/qaService'
import { getCategoryEmoji } from '../../utils/categoryHelpers'
import { CATEGORY_META, type QACategory } from '../../config/constants'
import type { QAItem } from '../../types'

const NODE_COLORS = [
    'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50',
    'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50',
    'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/50',
    'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400/50',
    'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/50',
    'from-teal-500/20 to-teal-600/10 border-teal-500/30 hover:border-teal-400/50',
    'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400/50',
    'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50',
]

const LINE_COLORS = [
    'bg-blue-500/30',
    'bg-purple-500/30',
    'bg-cyan-500/30',
    'bg-pink-500/30',
    'bg-amber-500/30',
    'bg-teal-500/30',
    'bg-red-500/30',
    'bg-blue-500/30',
]

export function TopQuestionsMindMap() {
    const [items, setItems] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTopQuestions(8).then(setItems).catch(console.error).finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="glass-card p-8">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    <h2 className="section-title">Top Questions</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    const left = items.slice(0, Math.ceil(items.length / 2))
    const right = items.slice(Math.ceil(items.length / 2))

    return (
        <div className="glass-card p-6 sm:p-8">
            {/* Mind map layout */}
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 lg:gap-0">
                {/* Left branch */}
                <div className="flex-1 flex flex-col gap-3 w-full lg:pr-6">
                    {left.map((item, idx) => (
                        <MindMapNode key={item.id} item={item} colorIdx={idx} side="left" />
                    ))}
                </div>

                {/* Center node */}
                <div className="flex flex-col items-center justify-center shrink-0 relative py-4 lg:py-0">
                    {/* Vertical connector lines on desktop */}
                    <div className="hidden lg:block absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent" />

                    <div className="relative z-10 w-36 h-36 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex flex-col items-center justify-center shadow-lg shadow-brand-500/20 border-2 border-brand-400/30">
                        <TrendingUp className="w-7 h-7 text-white mb-1" />
                        <span className="text-sm font-bold text-white text-center leading-tight">Top<br/>Questions</span>
                    </div>
                </div>

                {/* Right branch */}
                <div className="flex-1 flex flex-col gap-3 w-full lg:pl-6">
                    {right.map((item, idx) => (
                        <MindMapNode key={item.id} item={item} colorIdx={idx + left.length} side="right" />
                    ))}
                </div>
            </div>
        </div>
    )
}

function MindMapNode({ item, colorIdx, side }: { item: QAItem; colorIdx: number; side: 'left' | 'right' }) {
    const color = NODE_COLORS[colorIdx % NODE_COLORS.length]
    const lineColor = LINE_COLORS[colorIdx % LINE_COLORS.length]
    const meta = CATEGORY_META[item.category as QACategory]

    return (
        <div className={`flex items-center gap-0 ${side === 'left' ? 'lg:flex-row-reverse' : ''}`}>
            {/* Connector line (desktop only) */}
            <div className={`hidden lg:block w-6 h-0.5 ${lineColor} shrink-0`} />

            {/* Node */}
            <Link
                to={`/search?q=${encodeURIComponent(item.question)}`}
                className={`flex-1 flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br ${color} border transition-all duration-200 hover:scale-[1.02] group`}
            >
                <span className="text-lg shrink-0 mt-0.5">{getCategoryEmoji(item.category)}</span>
                <div className="min-w-0 flex-1">
                    <p className={`text-sm text-surface-700 group-hover:text-surface-900 transition-colors leading-snug line-clamp-2 ${side === 'left' ? 'lg:text-right' : ''}`}>
                        {item.question}
                    </p>
                    <div className={`flex items-center gap-2 mt-1.5 ${side === 'left' ? 'lg:justify-end' : ''}`}>
                        {meta && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.bgColor} ${meta.color}`}>
                                {meta.short}
                            </span>
                        )}
                        {item.ask_count > 1 && (
                            <span className="text-[10px] font-medium text-brand-500">
                                Asked {item.ask_count}x
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    )
}
