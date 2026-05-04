import { useEffect, useState, useRef } from 'react'
import {
    List, Plus, Pencil, Trash2,
    ChevronDown, X, Loader2, Save, Check, Merge, Search,
    CheckCircle2, MessageSquareText,
} from 'lucide-react'
import { parseHighlights, applyHighlight, HIGHLIGHT_COLORS } from '../utils/highlightText'
import {
    fetchMasterQuestions, addMasterQuestion, updateMasterQuestion,
    deleteMasterQuestion, fetchUniqueSkillSets, mergeQuestions,
} from '../services/masterQuestionsService'
import type { QAItem } from '../types'
import { ALL_CATEGORIES, type QACategory } from '../config/constants'
import { getCategoryEmoji, getCategoryShort } from '../utils/categoryHelpers'
import { Pagination } from '../components/qa/Pagination'

const PAGE_SIZE = 20


type PublishTab = 'all' | 'archive' | 'discarded'

const PUBLISH_TABS: { value: PublishTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'archive', label: 'Archive' },
    { value: 'discarded', label: 'Discarded' },
]


type GroupedQuestions = Record<string, QAItem[]>

function groupByCategory(items: QAItem[]): GroupedQuestions {
    const grouped: GroupedQuestions = {}
    for (const item of items) {
        const cat = item.category
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(item)
    }
    return grouped
}

export function MasterQuestionsPage() {
    const [questions, setQuestions] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<PublishTab>('all')
    const [page, setPage] = useState(0)

    const [searchQuery, setSearchQuery] = useState('')
    const [skillSets, setSkillSets] = useState<string[]>([])
    const [mergingId, setMergingId] = useState<string | null>(null)
    const [mergeSearch, setMergeSearch] = useState('')

    // Add form state
    const [newQuestion, setNewQuestion] = useState('')
    const [newCategory, setNewCategory] = useState<QACategory>(ALL_CATEGORIES[0])
    const [newSkillSet, setNewSkillSet] = useState('')

    // Edit form state
    const questionInputRef = useRef<HTMLTextAreaElement>(null)
    const [editQuestion, setEditQuestion] = useState('')
    const [editCategory, setEditCategory] = useState<QACategory>(ALL_CATEGORIES[0])
    const [editSkillSet, setEditSkillSet] = useState('')
    const [editScores, setEditScores] = useState({ u: 0, a: 0, r: 0, c: 0 })
    const [editPublish, setEditPublish] = useState<'category' | 'archive' | 'discarded'>('archive')

    const loadQuestions = () => {
        setLoading(true)
        fetchMasterQuestions()
            .then(setQuestions)
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadQuestions()
        fetchUniqueSkillSets().then(setSkillSets).catch(console.error)
    }, [])

    useEffect(() => { setPage(0) }, [activeTab, searchQuery])

    const handleAdd = async () => {
        if (!newQuestion.trim()) return
        setActionLoading('add')
        try {
            await addMasterQuestion({
                question: newQuestion.trim(),
                category: newCategory,
                skill_set: newSkillSet.trim() || undefined,
            })
            setNewQuestion('')
            setNewSkillSet('')
            setShowAddForm(false)
            loadQuestions()
            fetchUniqueSkillSets().then(setSkillSets).catch(console.error)
        } catch (err) {
            console.error('Add failed:', err)
            alert(err instanceof Error ? err.message : 'Failed to add question')
        } finally {
            setActionLoading(null)
        }
    }

    const startEdit = (q: QAItem) => {
        setEditingId(q.id)
        setEditQuestion(q.question)
        setEditCategory(q.category)
        setEditSkillSet(q.skill_set ?? '')
        setEditScores({
            u: q.score_usefulness ?? 3,
            a: q.score_actionability ?? 3,
            r: q.score_repeatability ?? 3,
            c: q.score_clarity ?? 3,
        })
        const pl = q.publish_level
        setEditPublish(pl === 'category' || pl === 'archive' || pl === 'discarded' ? pl : 'archive')
    }

    const handleSaveEdit = async (id: string) => {
        if (!editQuestion.trim()) return
        setActionLoading(id)
        try {
            await updateMasterQuestion(id, {
                question: editQuestion.trim(),
                category: editCategory,
                skill_set: editSkillSet.trim() || null,
                score_usefulness: editScores.u,
                score_actionability: editScores.a,
                score_repeatability: editScores.r,
                score_clarity: editScores.c,
                publish_level: editPublish,
            })
            setEditingId(null)
            loadQuestions()
        } catch (err) {
            console.error('Update failed:', err)
            alert(err instanceof Error ? err.message : 'Failed to update question')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (id: string, question: string) => {
        const label = question.length > 50 ? question.slice(0, 50) + '...' : question
        if (!confirm(`Delete "${label}"? This will also delete all its answers.`)) return
        setActionLoading(id)
        try {
            await deleteMasterQuestion(id)
            setQuestions(prev => prev.filter(q => q.id !== id))
        } catch (err) {
            console.error('Delete failed:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleMerge = async (keepId: string, mergeId: string) => {
        const keepQ = questions.find(q => q.id === keepId)
        const mergeQ = questions.find(q => q.id === mergeId)
        if (!keepQ || !mergeQ) return
        const mergeLabel = mergeQ.question.length > 60 ? mergeQ.question.slice(0, 60) + '...' : mergeQ.question
        if (!confirm(`Merge "${mergeLabel}" into the selected question? All answers will be moved and the duplicate will be deleted.`)) return
        setActionLoading(keepId)
        try {
            await mergeQuestions(keepId, mergeId)
            setMergingId(null)
            setMergeSearch('')
            loadQuestions()
        } catch (err) {
            console.error('Merge failed:', err)
            alert(err instanceof Error ? err.message : 'Failed to merge')
        } finally {
            setActionLoading(null)
        }
    }

    // Filter by publish tab + search; All excludes discarded
    const filtered = (activeTab === 'all'
        ? questions.filter(q => q.publish_level !== 'discarded')
        : questions.filter(q => q.publish_level === activeTab))
        .filter(q => !searchQuery || q.question.toLowerCase().includes(searchQuery.toLowerCase()))

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    const grouped = groupByCategory(pageItems)
    const categoryOrder = ALL_CATEGORIES.filter(cat => grouped[cat]?.length)

    // Tab counts
    const tabCounts: Record<PublishTab, number> = {
        all: questions.filter(q => q.publish_level !== 'discarded').length,
        archive: questions.filter(q => q.publish_level === 'archive').length,
        discarded: questions.filter(q => q.publish_level === 'discarded').length,
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <List size={16} strokeWidth={3} />
                            <span>Admin · Q&A Management</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Master Question{' '}
                            <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Bank</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                            <span className="text-blue-600 font-bold">{questions.filter(q => q.publish_level !== 'discarded').length} curated questions</span>
                            {' · '}
                            <span className="text-red-400">{questions.filter(q => q.publish_level === 'discarded').length} discarded</span>
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2.5 rounded-xl border border-blue-100 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 w-full sm:w-56"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm"
                        >
                            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showAddForm ? 'Cancel' : 'Add Question'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Publish level tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {PUBLISH_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeTab === tab.value
                            ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-100'
                            : 'bg-white text-slate-500 border-blue-50 hover:border-blue-200'
                            }`}
                    >
                        {tab.label} ({tabCounts[tab.value]})
                    </button>
                ))}
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white border border-blue-100 rounded-2xl p-5 space-y-4 mb-6">
                    <h3 className="text-sm font-semibold text-slate-700">New Question</h3>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Question</label>
                        <input
                            value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)}
                            placeholder="What should students know about...?"
                            className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Category</label>
                            <div className="relative">
                                <select
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value as QACategory)}
                                    className="w-full appearance-none bg-white border border-blue-100 rounded-xl px-3 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                    {ALL_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Skill Set <span className="text-slate-400">(optional)</span></label>
                            <input
                                value={newSkillSet}
                                onChange={e => setNewSkillSet(e.target.value)}
                                placeholder="e.g. DSA, System Design"
                                list="skill-set-suggestions"
                                className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <datalist id="skill-set-suggestions">
                                {skillSets.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={!newQuestion.trim() || actionLoading === 'add'}
                            className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-white text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                        >
                            {actionLoading === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Questions grouped by category */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-blue-100 rounded-2xl p-12 text-center">
                    <List className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No questions in this view</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {categoryOrder.map(cat => (
                        <section key={cat} className="animate-fade-in">
                            {/* Category header */}
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-lg text-base leading-none">
                                    {getCategoryEmoji(cat as QACategory)}
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#0b4b8c]">
                                    {getCategoryShort(cat as QACategory)}
                                </h2>
                                <div className="flex-1 h-px bg-blue-50" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                    {grouped[cat].length} Items
                                </span>
                            </div>

                            <div className="space-y-4">
                                {grouped[cat].map(q => {
                                    const isEditing = editingId === q.id
                                    const isLoading = actionLoading === q.id

                                    return (
                                        <div
                                            key={q.id}
                                            className="group bg-white border border-blue-50 rounded-2xl p-6 hover:border-blue-200 transition-all relative overflow-hidden"
                                        >
                                            {isEditing ? (
                                                /* Edit mode */
                                                <div className="space-y-3">
                                                    {/* Highlight toolbar */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs text-slate-500">Highlight:</span>
                                                        {HIGHLIGHT_COLORS.map(c => (
                                                            <button
                                                                key={c.key}
                                                                type="button"
                                                                title={`Highlight in ${c.label} (select text first)`}
                                                                onClick={() => {
                                                                    const ta = questionInputRef.current
                                                                    if (!ta) return
                                                                    const { selectionStart: s, selectionEnd: e } = ta
                                                                    if (s === e) return
                                                                    setEditQuestion(applyHighlight(editQuestion, s, e, c.key))
                                                                    setTimeout(() => ta.focus(), 0)
                                                                }}
                                                                className="w-4 h-4 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: c.bg }}
                                                            />
                                                        ))}
                                                        <span className="text-[10px] text-slate-400">← select text first</span>
                                                    </div>
                                                    <textarea
                                                        ref={questionInputRef}
                                                        value={editQuestion}
                                                        onChange={e => setEditQuestion(e.target.value)}
                                                        rows={2}
                                                        className="w-full bg-white border border-blue-100 rounded-xl px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                                                    />
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="relative">
                                                            <select
                                                                value={editCategory}
                                                                onChange={e => setEditCategory(e.target.value as QACategory)}
                                                                className="appearance-none bg-white border border-blue-100 rounded-lg px-2 py-1 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                            >
                                                                {ALL_CATEGORIES.map(c => (
                                                                    <option key={c} value={c}>{c}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                                        </div>
                                                        <input
                                                            value={editSkillSet}
                                                            onChange={e => setEditSkillSet(e.target.value)}
                                                            placeholder="Skill Set"
                                                            list="skill-set-suggestions"
                                                            className="w-32 bg-white border border-blue-100 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        />
                                                    </div>
                                                    {/* Score editing */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="text-[10px] text-slate-400 font-medium">Scores:</span>
                                                        {(['u', 'a', 'r', 'c'] as const).map(key => {
                                                            const labels = { u: 'Use', a: 'Act', r: 'Rep', c: 'Clr' }
                                                            return (
                                                                <label key={key} className="flex items-center gap-1">
                                                                    <span className="text-[10px] text-slate-400">{labels[key]}</span>
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={5}
                                                                        value={editScores[key]}
                                                                        onChange={e => setEditScores(prev => ({ ...prev, [key]: Math.min(5, Math.max(1, Number(e.target.value))) }))}
                                                                        className="w-10 bg-white border border-blue-100 rounded px-1 py-0.5 text-xs text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                                    />
                                                                </label>
                                                            )
                                                        })}
                                                        <span className="text-[10px] font-bold text-slate-600">
                                                            = {editScores.u + editScores.a + editScores.r + editScores.c}/20
                                                        </span>
                                                    </div>
                                                    {/* Publish */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <select
                                                            value={editPublish}
                                                            onChange={e => setEditPublish(e.target.value as 'category' | 'archive' | 'discarded')}
                                                            className="appearance-none bg-white border border-blue-100 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        >
                                                            <option value="category">Category</option>
                                                            <option value="archive">Archive</option>
                                                            <option value="discarded">Discarded</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleSaveEdit(q.id)}
                                                            disabled={isLoading}
                                                            className="flex items-center gap-1 px-3 py-1.5 border border-blue-200 bg-white text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                                                        >
                                                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Display mode */
                                                <div className="flex justify-between items-start gap-10">
                                                    <div className="flex-1 min-w-0">
                                                        {/* Question */}
                                                        <h3 className="text-base font-bold text-slate-800 mb-3 leading-snug group-hover:text-[#0b4b8c] transition-colors">
                                                            {parseHighlights(q.question)}
                                                        </h3>

                                                        {/* Metrics */}
                                                        <div className="flex items-center gap-5 mb-5 flex-wrap">
                                                            {q.total_score !== null && q.total_score !== undefined && (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-tighter">
                                                                    <CheckCircle2 size={12} /> {q.total_score} Impact Score
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-[#0b4b8c] uppercase tracking-widest bg-[#dbeafe] px-2.5 py-1 rounded-lg">
                                                                <MessageSquareText size={12} /> {q.ask_count} Contributed Answer{q.ask_count !== 1 ? 's' : ''}
                                                            </div>
                                                            {(q.skill_set || q.subtopic) && (
                                                                <>
                                                                    <div className="h-4 w-px bg-slate-200" />
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        {q.skill_set || q.subtopic}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Insight preview */}
                                                        {q.consolidated_answer && (
                                                            <div className="bg-slate-50 border-l-4 border-blue-100 p-4 rounded-r-2xl">
                                                                <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">
                                                                    "{parseHighlights(q.consolidated_answer)}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 shrink-0">
                                                        <button
                                                            onClick={() => { setMergingId(mergingId === q.id ? null : q.id); setMergeSearch('') }}
                                                            className={`p-2.5 rounded-xl transition-all ${mergingId === q.id ? 'text-[#0b4b8c] bg-[#dbeafe]' : 'text-slate-400 hover:text-[#0b4b8c] hover:bg-[#dbeafe]'}`}
                                                            title="Merge duplicate"
                                                        >
                                                            <Merge size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => startEdit(q)}
                                                            className="p-2.5 text-slate-400 hover:text-[#0b4b8c] hover:bg-[#dbeafe] rounded-xl transition-all"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(q.id, q.question)}
                                                            disabled={isLoading}
                                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Merge picker */}
                                            {mergingId === q.id && (
                                                <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                                                    <p className="text-xs font-medium text-amber-700">Select a duplicate question to merge into this one:</p>
                                                    <input
                                                        type="text"
                                                        placeholder="Search questions..."
                                                        value={mergeSearch}
                                                        onChange={e => setMergeSearch(e.target.value)}
                                                        className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-amber-400"
                                                    />
                                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                                        {questions
                                                            .filter(other => other.id !== q.id && other.question.toLowerCase().includes(mergeSearch.toLowerCase()))
                                                            .slice(0, 10)
                                                            .map(other => (
                                                                <button
                                                                    key={other.id}
                                                                    onClick={() => handleMerge(q.id, other.id)}
                                                                    disabled={isLoading}
                                                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-amber-100 transition-colors flex items-start gap-2"
                                                                >
                                                                    <Merge className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                                                    <span className="line-clamp-2">{other.question}</span>
                                                                    <span className="text-[10px] text-slate-400 shrink-0 ml-auto">{getCategoryShort(other.category)}</span>
                                                                </button>
                                                            ))}
                                                        {mergeSearch && questions.filter(other => other.id !== q.id && other.question.toLowerCase().includes(mergeSearch.toLowerCase())).length === 0 && (
                                                            <p className="text-xs text-slate-400 px-2 py-1">No matching questions found</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => { setMergingId(null); setMergeSearch('') }}
                                                        className="text-xs text-slate-500 hover:text-slate-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    )
}
