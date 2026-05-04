import { useState, useEffect } from 'react'
import { useQAItems } from '../hooks/useQAItems'
import { QAList } from '../components/qa/QAList'
import { QASortBar } from '../components/qa/QASortBar'
import { Pagination } from '../components/qa/Pagination'
import { fetchUniqueCompanies, fetchUniqueRoles, fetchTotalVisibleQACount } from '../services/qaService'
import { ALL_CATEGORIES, type QACategory } from '../config/constants'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../config/supabase'
import { X, ThumbsDown, Building2, MessageCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

interface NotHelpfulRow {
    id: string
    alumni_name: string
    company: string
    role: string
    answer_text: string
    not_helpful_votes: number
    transcript_id: string
    qa_item_id: string
    question: string
    category: string
}

function NotHelpfulModal({ onClose }: { onClose: () => void }) {
    const [rows, setRows] = useState<NotHelpfulRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data, error } = await supabase
                .from('qa_answers')
                .select(`
                    id,
                    alumni_name,
                    company,
                    role,
                    answer_text,
                    not_helpful_votes,
                    transcript_id,
                    qa_item_id,
                    qa_items ( question, category )
                `)
                .gt('not_helpful_votes', 0)
                .order('not_helpful_votes', { ascending: false })

            if (!error && data) {
                setRows((data as any[]).map(r => ({
                    id: r.id,
                    alumni_name: r.alumni_name,
                    company: r.company,
                    role: r.role,
                    answer_text: r.answer_text,
                    not_helpful_votes: r.not_helpful_votes,
                    transcript_id: r.transcript_id,
                    qa_item_id: r.qa_item_id,
                    question: r.qa_items?.question ?? '—',
                    category: r.qa_items?.category ?? '—',
                })))
            }
            setLoading(false)
        }
        load()
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-rose-200 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                            <ThumbsDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-surface-800">Not Helpful Answers</h2>
                            {!loading && (
                                <p className="text-xs text-surface-500">{rows.length} answer{rows.length !== 1 ? 's' : ''} flagged by students</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-surface-500 hover:text-surface-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="h-28 rounded-xl bg-surface-100 animate-pulse" />
                        ))
                    ) : rows.length === 0 ? (
                        <div className="text-center py-12 text-surface-400">
                            <ThumbsDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No answers flagged as not helpful yet 🎉</p>
                        </div>
                    ) : rows.map(r => (
                        <div key={r.id} className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                            {/* Question */}
                            <div className="mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-rose-400 mr-2">{r.category}</span>
                                <p className="text-sm font-semibold text-surface-800 leading-snug mt-0.5">"{r.question}"</p>
                            </div>
                            {/* Answer */}
                            <p className="text-sm text-surface-600 leading-relaxed line-clamp-3 mb-3 border-l-2 border-rose-200 pl-3">
                                {r.answer_text}
                            </p>
                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/alumni/${r.transcript_id}`}
                                        className="text-xs font-semibold text-brand-600 hover:underline"
                                    >
                                        {r.alumni_name}
                                    </Link>
                                    <span className="flex items-center gap-1 text-xs text-surface-500">
                                        <Building2 className="w-3 h-3" />
                                        {r.company}
                                    </span>
                                    <span className="text-xs text-surface-400">· {r.role}</span>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-xs font-bold text-rose-600">
                                    👎 {r.not_helpful_votes}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function AllQAPage() {
    const { role: userRole } = useAuth()
    const isAdmin = userRole === 'admin'
    const [category, setCategory] = useState<QACategory | undefined>()
    const [company, setCompany] = useState<string | undefined>()
    const [companies, setCompanies] = useState<string[]>([])
    const [role, setRole] = useState<string | undefined>()
    const [roles, setRoles] = useState<string[]>([])
    const [totalQACount, setTotalQACount] = useState(0)
    const [showNotHelpful, setShowNotHelpful] = useState(false)
    const [search, setSearch] = useState('')

    const { items, loading, error, sort, setSort, page, setPage, totalPages } = useQAItems(category, company, undefined, role, search)

    useEffect(() => {
        fetchUniqueCompanies().then(setCompanies).catch(console.error)
        fetchUniqueRoles().then(setRoles).catch(console.error)
        fetchTotalVisibleQACount().then(setTotalQACount).catch(console.error)
    }, [])

    return (
        <div className="animate-fade-in">
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <MessageCircle size={16} strokeWidth={3} />
                            <span>Alumni Intelligence Engine</span>
                        </div>
                        <h1 className="text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Placement Doubts Answered <br />
                            <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">by Alumni</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            {totalQACount > 0
                                ? <><span className="text-blue-600 font-bold">{totalQACount} questions</span> asked by Academy students during alumni meets.</>
                                : 'Questions asked by Academy students during alumni meets.'
                            }
                        </p>
                    </div>
                    <div className="max-w-xs bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 shadow-sm shrink-0">
                        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-blue-800 font-medium">
                            <span className="font-black uppercase tracking-tighter block mb-1">Perspective Note</span>
                            Real student questions. Real alumni answers. Perspectives may vary as it is from multiple Alumni.
                        </p>
                    </div>
                </div>
            </header>

            {showNotHelpful && <NotHelpfulModal onClose={() => setShowNotHelpful(false)} />}

            <QASortBar
                sort={sort}
                onSortChange={setSort}
                isAdmin={isAdmin}
                categories={ALL_CATEGORIES}
                selectedCategory={category}
                onCategoryChange={setCategory}
                companies={companies}
                selectedCompany={company}
                onCompanyChange={setCompany}
                roles={roles}
                selectedRole={role}
                onRoleChange={setRole}
                onNotHelpfulClick={() => setShowNotHelpful(true)}
                search={search}
                onSearchChange={setSearch}
            />

{loading ? (
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="glass-card p-6 text-center text-red-500">{error}</div>
            ) : (
                <>
                    <QAList items={items} showCategory highlightHelpful={sort === 'most_useful'} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

        </div>
    )
}
