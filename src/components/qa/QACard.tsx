import { useState } from 'react'
import type { QAItem } from '../../types'
import { QAAnswerItem } from './QAAnswerItem'
import { getCategoryEmoji } from '../../utils/categoryHelpers'
import { useAuth } from '../../contexts/AuthContext'
import { ALL_CATEGORIES, CATEGORY_META, type QACategory, type CategoryMeta } from '../../config/constants'
import { updateMasterQuestion } from '../../services/masterQuestionsService'
import { parseHighlights } from '../../utils/highlightText'
import { ArrowRight, ChevronUp } from 'lucide-react'

interface QACardProps {
    item: QAItem
    showCategory?: boolean
    index?: number
    theme?: CategoryMeta | null
    highlightHelpful?: boolean
}

export function QACard({ item, showCategory }: QACardProps) {
    const { role } = useAuth()
    const [expanded, setExpanded] = useState(false)
    const [category, setCategory] = useState<QACategory>(item.category)
    const [savingCategory, setSavingCategory] = useState(false)

    const [answerVisibility, setAnswerVisibility] = useState<Record<string, boolean>>(() => {
        const map: Record<string, boolean> = {}
        for (const a of item.answers ?? []) map[a.id] = a.visible !== false
        return map
    })

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation()
        const newCategory = e.target.value as QACategory
        setCategory(newCategory)
        setSavingCategory(true)
        try {
            await updateMasterQuestion(item.id, { category: newCategory })
        } catch {
            setCategory(item.category)
        } finally {
            setSavingCategory(false)
        }
    }

    const handleAnswerVisibilityChange = (answerId: string, newVisible: boolean) => {
        setAnswerVisibility(prev => ({ ...prev, [answerId]: newVisible }))
    }

    const allAnswers = item.answers ?? []
    const answers = (role === 'admin'
        ? allAnswers
        : allAnswers.filter(a => answerVisibility[a.id] !== false)
    ).slice().sort((a, b) => {
        const vDiff = (b.helpful_votes ?? 0) - (a.helpful_votes ?? 0)
        if (vDiff !== 0) return vDiff
        const da = a.call_date ?? a.created_at ?? ''
        const db = b.call_date ?? b.created_at ?? ''
        return db.localeCompare(da)
    })

    if (answers.length === 0) return null

    const previewAnswer = item.consolidated_answer || answers[0]?.answer_text || ''

    return (
        <div id={`qa-${item.id}`} className="group bg-white border border-blue-50 rounded-2xl p-6 hover:border-blue-200 transition-all">

            {/* Top row: badges + score */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {showCategory && (
                            role === 'admin' ? (
                                <select
                                    value={category}
                                    onChange={handleCategoryChange}
                                    disabled={savingCategory}
                                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border cursor-pointer outline-none disabled:opacity-50 ${CATEGORY_META[category].bgColor} ${CATEGORY_META[category].color} ${CATEGORY_META[category].borderColor}`}
                                >
                                    {ALL_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} className="bg-white text-surface-700 text-xs normal-case">{cat}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-50 px-2 py-0.5 rounded-sm">
                                    {getCategoryEmoji(category)} {category}
                                </span>
                            )
                        )}
                        {item.skill_set && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-violet-50 text-violet-500 border border-violet-200">
                                {item.skill_set}
                            </span>
                        )}
                    </div>

                    {/* Question */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors leading-snug">
                        {parseHighlights(item.question)}
                    </h3>
                </div>

                {/* Impact Score (admin) or answer count pill */}
                <div className="text-right shrink-0">
                    {role === 'admin' && item.total_score != null ? (
                        <>
                            <div className="text-[9px] font-black text-blue-200 uppercase tracking-tighter mb-1 leading-tight"><span className="sm:hidden">Score</span><span className="hidden sm:inline">Impact Score</span></div>
                            <div className="text-sm font-black text-blue-600">{item.total_score}/20</div>
                        </>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 whitespace-nowrap">
                            ⭐ {answers.length}x
                        </span>
                    )}
                </div>
            </div>

            {/* Answer preview */}
            {previewAnswer && (
                <div className="bg-blue-50/30 border-l-2 border-blue-200 p-4 rounded-r-xl">
                    <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">
                        "{parseHighlights(previewAnswer)}"
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-blue-50/50 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-700">
                    ⭐ Asked {answers.length} {answers.length === 1 ? 'time' : 'times'}
                </span>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                    {expanded ? (
                        <>Hide Answers <ChevronUp className="w-3 h-3" /></>
                    ) : (
                        <>View Alumni Answers <ArrowRight className="w-3 h-3" /></>
                    )}
                </button>
            </div>

            {/* Expanded: all answers */}
            {expanded && (
                <div className="mt-4 space-y-3 border-t border-blue-100 pt-4 animate-fade-in">
                    {answers.map((ans, ansIdx) => (
                        <QAAnswerItem
                            key={ans.id}
                            answer={ans}
                            answerIndex={ansIdx}
                            theme={null}
                            onVisibilityChange={handleAnswerVisibilityChange}
                            isStudentVerified={ans.helpful_votes >= 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
