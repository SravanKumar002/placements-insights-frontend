import { useState, useEffect } from 'react'
import { Brain, Plus, ExternalLink, Pencil, Trash2, ChevronRight, FileText, AlertCircle, Info } from 'lucide-react'
import {
    fetchIntelligenceCards,
    deleteIntelligenceCard,
} from '../services/intelligenceCardService'
import type { IntelligenceCard } from '../services/intelligenceCardService'
import { IntelligenceCardModal } from '../components/intelligence/IntelligenceCardModal'
import { MarkdownContent } from '../components/ui/MarkdownContent'
import { CompanyLogo, extractDomain } from '../components/ui/CompanyLogo'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const DUMMY_CARDS: IntelligenceCard[] = [
    {
        id: 'dummy-1',
        created_at: new Date().toISOString(),
        title: 'System Design: Scalable Architecture',
        url: 'https://example.com/system-design',
        company_url: null,
        description: 'Comprehensive guide to mastering system design interviews.',
        content: 'System design interviews test your ability to design large-scale distributed systems. Key topics include load balancing, caching strategies (Redis, Memcached), database sharding, CAP theorem, microservices vs monolith, message queues (Kafka, RabbitMQ), and CDN usage.\n\nFocus on: clarifying requirements, estimating scale, choosing the right database (SQL vs NoSQL), designing APIs, and discussing trade-offs. Practice drawing architecture diagrams and explaining your decisions clearly.',
        month: 'April 2024',
        badge: 'Top Choice',
        sort_order: 0,
    },
    {
        id: 'dummy-2',
        created_at: new Date().toISOString(),
        title: 'DSA: Top Patterns to Master',
        url: null,
        company_url: null,
        description: 'The most common coding interview patterns for DSA.',
        content: 'Most coding interviews follow recurring patterns. The top ones to master are: Sliding Window, Two Pointers, Fast & Slow Pointers, Merge Intervals, Cyclic Sort, In-place Reversal, Tree BFS/DFS, Two Heaps, Subsets, Modified Binary Search, Bitwise XOR, and Top K Elements.\n\nFocus on LeetCode Medium problems. Aim for pattern recognition over memorisation.',
        month: 'March 2024',
        badge: null,
        sort_order: 1,
    },
]

export function InterviewIntelligencePage() {
    const [cards, setCards] = useState<IntelligenceCard[]>(DUMMY_CARDS)
    const [loadingCards, setLoadingCards] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCard, setEditingCard] = useState<IntelligenceCard | null>(null)
    const [viewingCard, setViewingCard] = useState<IntelligenceCard | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 3
    const { role } = useAuth()
    const isAdmin = role === 'admin'

    const loadCards = async () => {
        try {
            setLoadingCards(true)
            setError(null)
            const data = await fetchIntelligenceCards()
            const sortedData = (data.length > 0 ? data : DUMMY_CARDS).sort((a, b) =>
                new Date(b.created_at.replace(' ', 'T')).getTime() - new Date(a.created_at.replace(' ', 'T')).getTime()
            )
            setCards(sortedData)
        } catch {
            setCards(DUMMY_CARDS)
        } finally {
            setLoadingCards(false)
        }
    }

    useEffect(() => { loadCards() }, [])

    const handleEdit = (card: IntelligenceCard) => { setEditingCard(card); setModalOpen(true) }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this card?')) return
        try {
            await deleteIntelligenceCard(id)
            setCards(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete')
        }
    }

    const monthScore = (m: string | null): number => {
        if (!m) return 0
        const mths: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
        const parts = m.trim().split(/[\s']+/)
        const mon = mths[parts[0]?.toLowerCase().slice(0, 3)] ?? 0
        let yr = parseInt(parts[1] ?? '0') || 0
        if (yr > 0 && yr < 100) yr += 2000
        return yr * 100 + mon
    }
    const companyCards = cards.filter(c => c.company_url).sort((a, b) => monthScore(b.month) - monthScore(a.month))
    const prepCards = cards.filter(c => !c.company_url)

    const totalPages = Math.ceil(companyCards.length / itemsPerPage)
    const paginatedCards = companyCards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="animate-fade-in">
            {/* Page header */}
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <Brain size={16} strokeWidth={3} />
                            <span>Nxtwave Interview Intelligence</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Master the <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Interview Patterns</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            Know what companies are asking. Latest <span className="text-blue-600 font-bold">interview patterns</span>, project explanation tips, and self-intro guidance.
                        </p>
                    </div>
                    {isAdmin ? (
                        <button onClick={() => { setEditingCard(null); setModalOpen(true) }} className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm shrink-0">
                            <Plus size={18} />
                            Add New Card
                        </button>
                    ) : (
                        <div className="w-full sm:max-w-xs bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 shadow-sm shrink-0">
                            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-blue-800 font-medium">
                                <span className="font-black uppercase tracking-tighter block mb-1">Strategic Placement Advice</span>
                                Resources curated from real NxtWave alumni interview experiences across top companies.
                            </p>
                        </div>
                    )}
                </div>
            </header>

            {loadingCards ? (
                <div className="grid grid-cols-1 gap-5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-52 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="glass-card p-6 text-center text-red-500">{error}</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* SECTION 1: Company Selections */}
                    <section className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">Recent Company Selections</h2>
                            {companyCards.length > 0 && (
                                <span className="shrink-0 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-black uppercase tracking-wider">
                                    {companyCards.length} Case {companyCards.length === 1 ? 'Study' : 'Studies'}
                                </span>
                            )}
                        </div>

                        {companyCards.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-blue-200 p-10 text-center">
                                <p className="text-sm text-slate-400">No company-specific insights yet.</p>
                                {isAdmin && (
                                    <p className="text-xs text-blue-400 mt-1">Add a card with a Company URL to display it here.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {paginatedCards.map(card => {
                                        const cardHref = card.url
                                            ? (card.url.startsWith('http') ? card.url : `https://${card.url}`)
                                            : card.company_url
                                                ? (card.company_url.startsWith('http') ? card.company_url : `https://${card.company_url}`)
                                                : null
                                        return (
                                            <a
                                                key={card.id}
                                                href={cardHref || undefined}
                                                target={cardHref ? '_blank' : undefined}
                                                rel={cardHref ? 'noopener noreferrer' : undefined}
                                                onClick={e => {
                                                    // Prevent navigation if clicking admin action buttons
                                                    const target = e.target as HTMLElement
                                                    if (target.closest('button') || target.closest('[data-no-nav]')) e.preventDefault()
                                                }}
                                                className={`group relative bg-white border border-blue-50 rounded-2xl p-6 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50/50 transition-all block ${cardHref ? 'cursor-pointer' : ''}`}
                                            >
                                                <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                                                    <div className="flex items-center gap-3 text-left">
                                                        {card.company_url && (
                                                            <CompanyLogo
                                                                domain={extractDomain(card.company_url)}
                                                                companyName={card.title}
                                                                size="md"
                                                            />
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                                                                Company Analysis
                                                            </span>
                                                            {card.month && (
                                                                <span className="text-[11px] font-bold text-slate-400 mt-0.5">
                                                                    {card.month}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {card.badge && (
                                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse whitespace-nowrap">
                                                                {card.badge}
                                                            </span>
                                                        )}
                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(card)}
                                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(card.id)}
                                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {cardHref && (
                                                            <div className="px-2 py-1 rounded bg-blue-50 text-[10px] font-bold text-blue-400 hover:text-blue-600 transition-colors cursor-pointer border border-blue-100/50 whitespace-nowrap">
                                                                View Full Insights
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-blue-900 transition-colors text-left">
                                                    {card.title}
                                                </h3>

                                                {card.description && (
                                                    <p className="text-sm text-slate-500 leading-relaxed max-w-lg mb-5 text-left">
                                                        {card.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-5 mt-1">
                                                    {card.content && (
                                                        <button
                                                            onClick={() => setViewingCard(card)}
                                                            className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:gap-3 transition-all"
                                                        >
                                                            View Full Insights
                                                        </button>
                                                    )}
                                                    {card.company_url && (
                                                        <span
                                                            data-no-nav
                                                            className="inline-flex items-center gap-1 text-[10px] text-slate-300 group-hover:text-blue-500 transition-colors uppercase font-black tracking-widest"
                                                        >
                                                            {(() => { try { return new URL(card.company_url.startsWith('http') ? card.company_url : `https://${card.company_url}`).hostname.replace(/^www\./, '') } catch { return '' } })()}
                                                        </span>
                                                    )}
                                                </div>
                                            </a>
                                        )
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-2">
                                        <p className="text-xs text-slate-500 font-medium">
                                            Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4 rotate-180" />
                                            </button>
                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* SECTION 2: Core Prep Library */}
                    <aside className="lg:col-span-5 space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Core Prep Library</h2>
                        </div>

                        {prepCards.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-blue-200 p-10 text-center">
                                <p className="text-sm text-slate-400">No prep resources yet.</p>
                                {isAdmin && (
                                    <p className="text-xs text-blue-400 mt-1">Add a card without a Company URL to display it here.</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {prepCards.map(card => (
                                    <div
                                        key={card.id}
                                        className="group flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-5 rounded-2xl bg-white border border-blue-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                                        onClick={() => {
                                            if (card.content) setViewingCard(card)
                                            else if (card.url) window.open(card.url, '_blank')
                                        }}
                                    >
                                        {/* Mobile: icon + actions in one row | Desktop: just the icon */}
                                        <div className="flex items-center justify-between sm:contents">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 group-hover:bg-white group-hover:text-blue-600 transition-all border border-transparent group-hover:border-blue-100 shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            {/* Actions visible on mobile only */}
                                            <div className="flex items-center gap-1 sm:hidden">
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleEdit(card) }}
                                                            className="p-1 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleDelete(card.id) }}
                                                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </div>

                                        {/* Title + description */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-700 mb-1 group-hover:text-blue-900 transition-colors">
                                                {card.title}
                                            </h4>
                                            {card.description && (
                                                <p className="text-[11px] text-slate-400 leading-snug group-hover:text-slate-500">
                                                    {card.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions visible on desktop only */}
                                        <div className="hidden sm:flex items-center gap-1 self-center shrink-0">
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleEdit(card) }}
                                                        className="p-1 rounded-lg text-slate-200 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleDelete(card.id) }}
                                                        className="p-1 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Strategic dark card */}
                        <div className="p-8 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col gap-4 relative overflow-hidden bg-blue-900">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] -translate-y-16 translate-x-16 opacity-30 pointer-events-none" />
                            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest relative z-10">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Attention to Gaps</span>
                            </div>
                            <p className="text-base leading-relaxed font-bold text-white relative z-10">
                                Most students fail at the "Project Explanation" phase.
                            </p>
                            <p className="text-xs text-blue-200 leading-relaxed opacity-80 relative z-10">
                                Interviewer feedback consistently highlights that students explain <em>what</em> they built, but fail to explain <em>why</em> they chose specific tech stacks over alternatives.
                            </p>
                        </div>
                    </aside>

                </div>
            )}

            {/* Add / Edit modal */}
            <IntelligenceCardModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadCards}
                editing={editingCard}
            />

            {/* Content View Modal */}
            <Dialog.Root open={!!viewingCard} onOpenChange={open => { if (!open) setViewingCard(null) }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-2xl max-h-[85vh] flex flex-col focus:outline-none animate-in zoom-in-95 fade-in duration-200">
                        <div className="glass-card flex flex-col h-full overflow-hidden shadow-2xl">
                            <div className="px-6 py-5 border-b border-surface-200 bg-white flex items-center justify-between shrink-0">
                                <div className="min-w-0 pr-4">
                                    <h2 className="text-xl font-bold text-surface-900 truncate">
                                        {viewingCard?.title}
                                    </h2>
                                    {viewingCard?.url && (
                                        <a
                                            href={viewingCard.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 text-xs font-medium hover:bg-brand-100 hover:border-brand-300 transition-colors w-fit"
                                        >
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                            View Resource
                                        </a>
                                    )}
                                </div>
                                <button
                                    onClick={() => setViewingCard(null)}
                                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-white/50 custom-scrollbar">
                                {viewingCard?.description && (
                                    <div className="mb-6 p-4 rounded-xl bg-brand-50/50 border border-brand-100 text-sm text-surface-700 italic">
                                        {viewingCard.description}
                                    </div>
                                )}
                                <MarkdownContent content={viewingCard?.content || ''} />
                            </div>
                            <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-end shrink-0">
                                <button onClick={() => setViewingCard(null)} className="btn-secondary px-6">
                                    Close
                                </button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    )
}
