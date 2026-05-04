import { useState, useEffect } from 'react'
import { Loader2, MessageSquareHeart, Star, Phone, Download, Clock, ChevronLeft, ChevronRight, Sparkles, RefreshCw, CheckCircle2, CalendarRange, AlertTriangle, Users, Target } from 'lucide-react'
import {
    fetchFeedbackPaginated, deleteFeedback, fetchFeedback,
    type FeedbackEntry,
} from '../services/studentCtaService'
import {
    fetchCWCRegistrationsPaginated, deleteCWCRegistration, fetchCWCRegistrations,
    type CWCRegistration,
} from '../services/cwcService'
import {
    fetchJourneyRequestsPaginated, deleteJourneyRequest, fetchJourneyRequests,
    type JourneyRequest,
} from '../services/journeyRequestService'
import {
    fetchLatestCombinedAnalysis, generateAnalysis,
    type AIAnalysis, type AIAnalysisRecord,
} from '../services/aiAnalysisService'
import { formatRelative } from '../utils/formatDate'
import { cn } from '../utils/cn'
import { downloadCsv } from '../utils/downloadCsv'

const PAGE_SIZE = 10
type TabId = 'cwc' | 'feedback' | 'journey-requests'

function defaultDateRange() {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    }
}

export function StudentSubmissionsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('cwc')

    const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
    const [fbTotal, setFbTotal] = useState(0)
    const [fbPage, setFbPage] = useState(0)

    const [cwcRegs, setCwcRegs] = useState<CWCRegistration[]>([])
    const [cwcTotal, setCwcTotal] = useState(0)
    const [cwcPage, setCwcPage] = useState(0)

    const [jrReqs, setJrReqs] = useState<JourneyRequest[]>([])
    const [jrTotal, setJrTotal] = useState(0)
    const [jrPage, setJrPage] = useState(0)

    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // ── AI Analysis state ───────────────────────────────────────────
    const [dateRange, setDateRange] = useState(defaultDateRange)
    const [combinedAnalysis, setCombinedAnalysis] = useState<AIAnalysisRecord | null>(null)
    const [analysing, setAnalysing] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    const loadFeedbackPage = async (p: number) => {
        const { feedback: data, totalCount } = await fetchFeedbackPaginated(p, PAGE_SIZE)
        setFeedback(data)
        setFbTotal(totalCount)
    }

    const loadCWCPage = async (p: number) => {
        const { registrations: data, totalCount } = await fetchCWCRegistrationsPaginated(p, PAGE_SIZE)
        setCwcRegs(data)
        setCwcTotal(totalCount)
    }

    const loadJRPage = async (p: number) => {
        const { requests: data, totalCount } = await fetchJourneyRequestsPaginated(p, PAGE_SIZE)
        setJrReqs(data)
        setJrTotal(totalCount)
    }

    useEffect(() => {
        Promise.all([loadFeedbackPage(0), loadCWCPage(0), loadJRPage(0)])
            .catch(console.error)
            .finally(() => setLoading(false))

        // Load latest stored combined analysis
        fetchLatestCombinedAnalysis().then(setCombinedAnalysis).catch(console.error)
    }, [])

    const handleDelete = async (type: 'feedback' | 'cwc' | 'jr', id: string) => {
        if (!confirm('Delete this entry? This cannot be undone.')) return
        setDeletingId(id)
        try {
            if (type === 'feedback') {
                await deleteFeedback(id)
                await loadFeedbackPage(fbPage)
            } else if (type === 'cwc') {
                await deleteCWCRegistration(id)
                await loadCWCPage(cwcPage)
            } else {
                await deleteJourneyRequest(id)
                await loadJRPage(jrPage)
            }
        } catch (err) {
            console.error('Delete failed:', err)
        } finally {
            setDeletingId(null)
        }
    }

    const handleCWCPageChange = (p: number) => { setCwcPage(p); loadCWCPage(p) }
    const handleFbPageChange = (p: number) => { setFbPage(p); loadFeedbackPage(p) }
    const handleJRPageChange = (p: number) => { setJrPage(p); loadJRPage(p) }

    const handleDownload = async () => {
        if (activeTab === 'cwc') {
            const all = await fetchCWCRegistrations()
            const headers = ['ID', 'Date', 'Time', 'Name', 'Phone', 'Email', 'Question']
            const rows = all.map(r => {
                const dt = new Date(r.created_at)
                return [r.id, dt.toLocaleDateString(), dt.toLocaleTimeString(), r.name, r.phone, r.email ?? '', r.question]
            })
            downloadCsv(`cwc_registrations_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
        } else if (activeTab === 'feedback') {
            const all = await fetchFeedback()
            const headers = ['ID', 'Date', 'Time', 'Name', 'Email', 'Phone', 'Category', 'Rating', 'Message']
            const rows = all.map(f => {
                const dt = new Date(f.created_at)
                return [f.id, dt.toLocaleDateString(), dt.toLocaleTimeString(), f.name ?? '', f.email ?? '', (f as { phone?: string }).phone ?? '', f.category ?? '', f.rating ?? '', f.message ?? '']
            })
            downloadCsv(`feedback_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
        } else {
            const all = await fetchJourneyRequests()
            const headers = ['ID', 'Date', 'Time', 'Name', 'Mobile', 'Request']
            const rows = all.map(r => {
                const dt = new Date(r.created_at)
                return [r.id, dt.toLocaleDateString(), dt.toLocaleTimeString(), r.name, r.mobile, r.request]
            })
            downloadCsv(`journey_requests_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
        }
    }

    const handleAnalyse = async () => {
        setAnalysing(true)
        setAnalysisError(null)
        try {
            const result = await generateAnalysis(dateRange.from, dateRange.to)
            const record: AIAnalysisRecord = {
                id: '',
                section: 'combined',
                date_from: dateRange.from,
                date_to: dateRange.to,
                analysis: result,
                generated_at: new Date().toISOString(),
            }
            setCombinedAnalysis(record)
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
        } finally {
            setAnalysing(false)
        }
    }

    const tabs = [
        { id: 'cwc' as TabId, label: 'CWC Registrations', count: cwcTotal },
        { id: 'feedback' as TabId, label: 'General Feedback', count: fbTotal },
        { id: 'journey-requests' as TabId, label: 'Journey Requests', count: jrTotal },
    ]

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <MessageSquareHeart size={16} strokeWidth={3} />
                            <span>Student Voice Registry</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Placement Support &{' '}
                            <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Student Sentiment</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            <span className="text-blue-600 font-bold">{fbTotal + cwcTotal + jrTotal} active submissions</span> across feedback, CWC registrations, and journey requests.
                        </p>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm shrink-0"
                    >
                        <Download size={16} strokeWidth={3} />
                        Download CSV
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex gap-8 border-b border-slate-100 mb-8 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setAnalysisError(null) }}
                                className={cn(
                                    'pb-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap',
                                    activeTab === tab.id ? 'text-blue-900' : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                {tab.label}
                                <span className="ml-2 text-[10px] opacity-60">({tab.count})</span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* AI Analysis Bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
                        <CalendarRange size={15} className="text-blue-400 shrink-0" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Analyse Range</span>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="text-xs font-semibold text-slate-600 border border-blue-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <span className="text-[11px] text-slate-400 font-bold">to</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="text-xs font-semibold text-slate-600 border border-blue-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                            onClick={handleAnalyse}
                            disabled={analysing}
                            className="ml-auto flex items-center gap-2 bg-[#0b4b8c] text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-[#0d5aa0] transition-all active:scale-95 shadow-sm disabled:opacity-60"
                        >
                            {analysing
                                ? <><Loader2 size={13} className="animate-spin" /> Analysing…</>
                                : <><Sparkles size={13} /> Analyse with AI</>
                            }
                        </button>
                        {combinedAnalysis && (
                            <span className="text-[10px] text-slate-400 font-medium">
                                Last run: {formatRelative(combinedAnalysis.generated_at)}
                            </span>
                        )}
                    </div>

                    {/* AI Analysis Results */}
                    {analysisError && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                            {analysisError}
                        </div>
                    )}
                    {combinedAnalysis?.analysis && combinedAnalysis.analysis.total_entries > 0 && (
                        <AIAnalysisPanel analysis={combinedAnalysis.analysis} dateFrom={combinedAnalysis.date_from} dateTo={combinedAnalysis.date_to} onRefresh={handleAnalyse} refreshing={analysing} />
                    )}

                    {/* CWC Registrations */}
                    {activeTab === 'cwc' && (
                        cwcRegs.length === 0 ? <EmptyState label="No CWC registrations yet" /> : (
                            <>
                                <div className="space-y-1">
                                    {cwcRegs.map(r => (
                                        <div key={r.id} className="group flex items-start gap-6 p-6 rounded-3xl transition-all hover:bg-blue-50/40 border border-transparent hover:border-blue-100/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                    <h4 className="text-sm font-black text-slate-800">{r.name}</h4>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                                        <Phone size={10} className="text-blue-300" /> {r.phone}
                                                    </p>
                                                    <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-1">
                                                        <Clock size={10} /> {formatRelative(r.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-base text-slate-600 leading-relaxed font-medium">{r.question}</p>
                                                <div className="mt-4">
                                                    <DeleteTextBtn id={r.id} deletingId={deletingId} onDelete={() => handleDelete('cwc', r.id)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <SimplePagination page={cwcPage} total={cwcTotal} pageSize={PAGE_SIZE} onChange={handleCWCPageChange} />
                            </>
                        )
                    )}

                    {/* Feedback */}
                    {activeTab === 'feedback' && (
                        feedback.length === 0 ? <EmptyState label="No feedback received yet" /> : (
                            <>
                                <div className="space-y-1">
                                    {feedback.map(f => (
                                        <div key={f.id} className="group flex items-start gap-6 p-6 rounded-3xl transition-all hover:bg-blue-50/40 border border-transparent hover:border-blue-100/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                    <h4 className="text-sm font-black text-slate-800">{f.name || '—'}</h4>
                                                    {f.phone && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                                                <Phone size={10} className="text-blue-300" /> {(f as { phone?: string }).phone}
                                                            </p>
                                                        </>
                                                    )}
                                                    {f.category && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                            {f.category}
                                                        </span>
                                                    )}
                                                    {f.rating && (
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} className={cn('w-3 h-3', s <= f.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-1">
                                                        <Clock size={10} /> {formatRelative(f.created_at)}
                                                    </span>
                                                </div>
                                                {f.message && <p className="text-base text-slate-600 leading-relaxed font-medium">{f.message}</p>}
                                                <div className="mt-4">
                                                    <DeleteTextBtn id={f.id} deletingId={deletingId} onDelete={() => handleDelete('feedback', f.id)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <SimplePagination page={fbPage} total={fbTotal} pageSize={PAGE_SIZE} onChange={handleFbPageChange} />
                            </>
                        )
                    )}

                    {/* Journey Requests */}
                    {activeTab === 'journey-requests' && (
                        jrReqs.length === 0 ? <EmptyState label="No journey requests yet" /> : (
                            <>
                                <div className="space-y-1">
                                    {jrReqs.map(r => (
                                        <div key={r.id} className="group flex items-start gap-6 p-6 rounded-3xl transition-all hover:bg-blue-50/40 border border-transparent hover:border-blue-100/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                    <h4 className="text-sm font-black text-slate-800">{r.name}</h4>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                                        <Phone size={10} className="text-blue-300" /> {r.mobile}
                                                    </p>
                                                    <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-1">
                                                        <Clock size={10} /> {formatRelative(r.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-base text-slate-600 leading-relaxed font-medium">{r.request}</p>
                                                <div className="mt-4">
                                                    <DeleteTextBtn id={r.id} deletingId={deletingId} onDelete={() => handleDelete('jr', r.id)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <SimplePagination page={jrPage} total={jrTotal} pageSize={PAGE_SIZE} onChange={handleJRPageChange} />
                            </>
                        )
                    )}
                </>
            )}
        </div>
    )
}

// ── AI Analysis Panel ────────────────────────────────────────────────

function AIAnalysisPanel({ analysis, dateFrom, dateTo, onRefresh, refreshing }: {
    analysis: AIAnalysis
    dateFrom: string
    dateTo: string
    onRefresh: () => void
    refreshing: boolean
}) {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <div className="mb-8 bg-white border border-blue-100 rounded-3xl overflow-hidden shadow-sm">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0b4b8c] text-white">
                <div className="flex items-center gap-2">
                    <Sparkles size={15} />
                    <span className="text-xs font-black uppercase tracking-widest">Academy Intelligence Gap</span>
                    <span className="text-[10px] text-blue-200 font-medium ml-2">
                        {fmt(dateFrom)} – {fmt(dateTo)} · {analysis.total_entries} entries
                    </span>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    Regenerate
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Hard Truths */}
                {analysis.hard_truths?.length > 0 && (
                    <div>
                        <p className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">
                            <AlertTriangle size={11} /> The Hard Truths
                        </p>
                        <div className="space-y-2">
                            {analysis.hard_truths.map((t, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50/60 border border-red-100">
                                    <span className="text-[10px] font-black text-red-400 shrink-0 mt-0.5 w-4">{i + 1}</span>
                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{t}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Confidence Drivers */}
                    {analysis.confidence_drivers?.length > 0 && (
                        <div>
                            <p className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">
                                <CheckCircle2 size={11} /> Confidence Drivers
                            </p>
                            <div className="space-y-2">
                                {analysis.confidence_drivers.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Representation Gap */}
                    {analysis.representation_gap?.length > 0 && (
                        <div>
                            <p className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                                <Users size={11} /> Representation Gap
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {analysis.representation_gap.map((r, i) => (
                                    <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Strategic Action Plan */}
                {analysis.strategic_action_plan?.length > 0 && (
                    <div>
                        <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                            <Target size={11} /> Strategic Action Plan
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {analysis.strategic_action_plan.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="w-5 h-5 rounded-full bg-[#0b4b8c] text-white flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Helpers ──────────────────────────────────────────────────────────

function DeleteTextBtn({ id, deletingId, onDelete }: { id: string; deletingId: string | null; onDelete: () => void }) {
    return (
        <button
            onClick={onDelete}
            disabled={deletingId === id}
            className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-1"
        >
            {deletingId === id && <Loader2 size={10} className="animate-spin" />}
            Delete Entry
        </button>
    )
}

function SimplePagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
    const totalPages = Math.ceil(total / pageSize)
    if (totalPages <= 1) return null
    const pages = [...Array(Math.min(totalPages, 5))].map((_, i) => i)
    return (
        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-2">
            <button onClick={() => onChange(page - 1)} disabled={page === 0} className="p-2 rounded-lg text-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30">
                <ChevronLeft size={20} />
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onChange(p)} className={cn('w-10 h-10 rounded-lg text-xs font-bold transition-all', p === page ? 'bg-[#0b4b8c] text-white shadow-lg' : 'text-slate-400 hover:bg-blue-50')}>
                    {p + 1}
                </button>
            ))}
            <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1} className="p-2 rounded-lg text-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30">
                <ChevronRight size={20} />
            </button>
        </div>
    )
}

function EmptyState({ label }: { label: string }) {
    return <div className="text-center py-12 text-slate-400 text-sm font-medium">{label}</div>
}
