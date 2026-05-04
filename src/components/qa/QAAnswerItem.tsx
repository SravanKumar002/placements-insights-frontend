import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Calendar, Eye, EyeOff, Pencil, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { QAAnswer } from '../../types'
import { formatDate } from '../../utils/formatDate'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'
import { toggleAnswerVisibility, updateAnswerText } from '../../services/masterQuestionsService'
import { voteOnQAAnswer } from '../../services/qaService'
import { parseHighlights, applyHighlight, HIGHLIGHT_COLORS } from '../../utils/highlightText'

function AnswerVoteWidget({ answer }: { answer: QAAnswer }) {
    const stored = localStorage.getItem(`qa_answer_vote_${answer.id}`) as 'helpful' | 'not_helpful' | null
    const [voted, setVoted] = useState<'helpful' | 'not_helpful' | null>(stored)
    const [counts, setCounts] = useState({ helpful: answer.helpful_votes ?? 0, not_helpful: answer.not_helpful_votes ?? 0 })
    const [loading, setLoading] = useState(false)

    const handleVote = async (v: 'helpful' | 'not_helpful', e: React.MouseEvent) => {
        e.stopPropagation()
        if (loading) return
        setLoading(true)
        try {
            if (voted === v) {
                await voteOnQAAnswer(answer.id, null, v)
                setCounts(prev => ({ ...prev, [v]: Math.max(0, prev[v] - 1) }))
                setVoted(null)
                localStorage.removeItem(`qa_answer_vote_${answer.id}`)
            } else {
                await voteOnQAAnswer(answer.id, v, voted)
                setCounts(prev => ({
                    helpful: v === 'helpful' ? prev.helpful + 1 : voted === 'helpful' ? Math.max(0, prev.helpful - 1) : prev.helpful,
                    not_helpful: v === 'not_helpful' ? prev.not_helpful + 1 : voted === 'not_helpful' ? Math.max(0, prev.not_helpful - 1) : prev.not_helpful,
                }))
                setVoted(v)
                localStorage.setItem(`qa_answer_vote_${answer.id}`, v)
            }
        } catch {
            // silently ignore
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-5 border-t border-slate-50 flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
            <button
                onClick={e => handleVote('helpful', e)}
                disabled={loading}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all group',
                    voted === 'helpful'
                        ? 'bg-blue-900 text-white shadow-md shadow-blue-100'
                        : 'bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white'
                )}
            >
                <ThumbsUp className="w-3.5 h-3.5 group-active:scale-125 transition-transform" />
                Helpful {counts.helpful > 0 && `(${counts.helpful})`}
            </button>
            <button
                onClick={e => handleVote('not_helpful', e)}
                disabled={loading}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all group',
                    voted === 'not_helpful'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                )}
            >
                <ThumbsDown className="w-3.5 h-3.5 group-active:scale-125 transition-transform" />
                Not Helpful {counts.not_helpful > 0 && `(${counts.not_helpful})`}
            </button>
        </div>
    )
}

interface QAAnswerItemProps {
    answer: QAAnswer
    answerIndex?: number
    theme?: unknown
    onVisibilityChange?: (answerId: string, visible: boolean) => void
    isStudentVerified?: boolean
}

export function QAAnswerItem({ answer, onVisibilityChange, isStudentVerified }: QAAnswerItemProps) {
    const { role } = useAuth()
    const [visible, setVisible] = useState(answer.visible !== false)
    const [toggling, setToggling] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editText, setEditText] = useState(answer.answer_text)
    const [answerText, setAnswerText] = useState(answer.answer_text)
    const [saving, setSaving] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    function handleHighlight(color: string) {
        const ta = textareaRef.current
        if (!ta) return
        const { selectionStart: start, selectionEnd: end } = ta
        if (start === end) return
        setEditText(applyHighlight(editText, start, end, color))
        setTimeout(() => ta.focus(), 0)
    }

    async function handleSaveEdit() {
        if (!editText.trim() || editText === answerText) { setEditing(false); return }
        setSaving(true)
        try {
            await updateAnswerText(answer.id, editText.trim())
            setAnswerText(editText.trim())
            setEditing(false)
        } catch {
            // keep edit mode open on error
        } finally {
            setSaving(false)
        }
    }

    async function handleToggle() {
        if (toggling) return
        setToggling(true)
        const newVisible = !visible
        setVisible(newVisible)
        onVisibilityChange?.(answer.id, newVisible)
        try {
            await toggleAnswerVisibility(answer.id, newVisible)
        } catch {
            setVisible(!newVisible)
            onVisibilityChange?.(answer.id, !newVisible)
        } finally {
            setToggling(false)
        }
    }

    const initial = answer.alumni_name?.charAt(0).toUpperCase() ?? '?'

    return (
        <div className={cn(
            'rounded-2xl border p-5 sm:p-6 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-50/30',
            visible
                ? 'bg-white border-blue-50 hover:border-blue-200'
                : 'bg-white border-blue-50 opacity-50',
        )}>
            {/* Alumni Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-50">
                <div className="flex items-center gap-3">
                    {/* Avatar with initial */}
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-100 shrink-0">
                        {initial}
                    </div>
                    <div>
                        <Link
                            to={`/alumni/${answer.transcript_id}`}
                            className="text-sm font-black text-slate-800 hover:text-blue-600 transition-colors"
                        >
                            {answer.alumni_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                <Building2 className="w-3 h-3 text-blue-300" /> {answer.company}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[11px] text-slate-500 font-medium italic">{answer.role}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isStudentVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                            👍 Top Rated
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight text-slate-400">
                        <Calendar className="w-3 h-3" /> {formatDate(answer.call_date)}
                    </span>
                    {role === 'admin' && !editing && (
                        <button
                            onClick={() => { setEditText(answerText); setEditing(true) }}
                            title="Edit answer"
                            className="p-1.5 rounded-lg border text-slate-400 bg-slate-50 border-slate-200 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {role === 'admin' && (
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            title={visible ? 'Hide from students' : 'Show to students'}
                            className={cn(
                                'p-1.5 rounded-lg border transition-colors',
                                visible
                                    ? 'text-emerald-500 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                    : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100',
                                toggling && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Answer content / edit area */}
            {editing ? (
                <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">Highlight:</span>
                        {HIGHLIGHT_COLORS.map(c => (
                            <button
                                key={c.key}
                                type="button"
                                title={`Highlight in ${c.label}`}
                                onClick={() => handleHighlight(c.key)}
                                className="w-5 h-5 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                                style={{ backgroundColor: c.bg }}
                            />
                        ))}
                        <span className="text-[10px] text-slate-300">← select text first</span>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed resize-y focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                        >
                            <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:text-slate-600 transition-colors"
                        >
                            <X className="w-3 h-3" /> Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium mb-5">
                    {parseHighlights(answerText)}
                </p>
            )}

            {/* Branch badge */}
            {answer.branch && (
                <div className="mb-3 flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Branch:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">{answer.branch}</span>
                </div>
            )}

            {/* Vote footer */}
            {role === 'admin' ? (
                (answer.helpful_votes > 0 || answer.not_helpful_votes > 0) && (
                    <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                        {answer.helpful_votes > 0 && (
                            <span className="text-xs font-bold text-emerald-600">👍 {answer.helpful_votes}</span>
                        )}
                        {answer.not_helpful_votes > 0 && (
                            <span className="text-xs font-bold text-rose-500">👎 {answer.not_helpful_votes}</span>
                        )}
                    </div>
                )
            ) : (
                <AnswerVoteWidget answer={answer} />
            )}

            {/* Hidden label */}
            {!visible && role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-2">
                    <EyeOff className="w-3 h-3" /> Hidden from students
                </span>
            )}
        </div>
    )
}
