import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { supabase } from '../../config/supabase'

interface CategoryStat {
    cat: string
    helpful: number
    notHelpful: number
    total: number
}

export function QAFeedbackSection() {
    const [categories, setCategories] = useState<CategoryStat[]>([])
    const [totalCategories, setTotalCategories] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data, error } = await supabase
                .from('qa_answers')
                .select('helpful_votes, not_helpful_votes, qa_item_id, qa_items ( category )')
                .or('helpful_votes.gt.0,not_helpful_votes.gt.0')

            if (!error && data) {
                const catMap = new Map<string, { helpful: number; notHelpful: number }>()
                for (const r of data as any[]) {
                    const cat = r.qa_items?.category ?? '—'
                    const hv = Number(r.helpful_votes ?? 0)
                    const nhv = Number(r.not_helpful_votes ?? 0)
                    const existing = catMap.get(cat) ?? { helpful: 0, notHelpful: 0 }
                    existing.helpful += hv
                    existing.notHelpful += nhv
                    catMap.set(cat, existing)
                }
                const sorted = [...catMap.entries()]
                    .map(([cat, v]) => ({ cat, helpful: v.helpful, notHelpful: v.notHelpful, total: v.helpful + v.notHelpful }))
                    .sort((a, b) => b.total - a.total)
                setTotalCategories(sorted.length)
                setCategories(sorted)
            }
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm h-48 animate-pulse" />
    )

    if (categories.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex items-center gap-3 text-slate-400">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">No Q&A feedback recorded yet.</span>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col" style={{ maxHeight: '420px' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <MessageSquare className="text-violet-500 w-[18px] h-[18px]" /> Satisfaction Intensity
                </h3>
                <span className="text-xs font-black text-slate-700 tabular-nums">{categories.reduce((s, c) => s + c.total, 0).toLocaleString()} <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">votes</span></span>
            </div>

            {/* Category rows */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                {categories.map(q => (
                    <div
                        key={q.cat}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-blue-600 transition-all duration-300 cursor-default"
                    >
                        <div className="min-w-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-blue-100 block truncate">{q.cat}</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <p className="text-lg font-black text-slate-800 group-hover:text-white leading-none">{q.total}</p>
                                <p className="text-[8px] font-bold text-slate-400 group-hover:text-blue-200">VOTES</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-emerald-500 group-hover:text-emerald-300 block">+{q.helpful}</span>
                            <span className="text-[10px] font-black text-rose-400 group-hover:text-rose-300 block">−{q.notHelpful}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-50 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest shrink-0">
                {totalCategories} categories with votes
            </div>
        </div>
    )
}
