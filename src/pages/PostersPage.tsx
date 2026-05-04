import { useState, useRef, useEffect, useMemo } from 'react'
import { Image, Plus, Trash2, Eye, EyeOff, Loader2, Link, Upload, X, Pencil, AlertCircle, ArrowUp, ArrowDown, GripVertical, Calendar, ChevronDown } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import {
    fetchPosters,
    fetchVisiblePosters,
    insertPoster,
    updatePosterVisibility,
    updatePosterMeta,
    updatePosterSortOrder,
    deletePoster,
    uploadPosterImage,
} from '../services/posterService'
import type { Poster } from '../services/posterService'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../utils/cn'

type InputMode = 'url' | 'upload'

export function PostersPage() {
    const { role } = useAuth()
    const isAdmin = role === 'admin'
    const [posters, setPosters] = useState<Poster[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [inputMode, setInputMode] = useState<InputMode>('url')
    const [imageUrl, setImageUrl] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lightbox, setLightbox] = useState<Poster | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editImageMode, setEditImageMode] = useState<InputMode>('url')
    const [editImageUrl, setEditImageUrl] = useState('')
    const [editFile, setEditFile] = useState<File | null>(null)
    const [editFilePreview, setEditFilePreview] = useState<string | null>(null)
    const editFileRef = useRef<HTMLInputElement>(null)
    const [savingEdit, setSavingEdit] = useState(false)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const [posterMonth, setPosterMonth] = useState('')
    const [editMonth, setEditMonth] = useState('')
    const [selectedMonth, setSelectedMonth] = useState<string>('all')

    // Derive unique months from posters, sorted newest first
    const availableMonths = useMemo(() => {
        const months = new Set<string>()
        for (const p of posters) {
            if (p.poster_month) months.add(p.poster_month)
        }
        return [...months].sort((a, b) => b.localeCompare(a))
    }, [posters])

    // Auto-select latest month when posters load (only on first load)
    useEffect(() => {
        if (availableMonths.length > 0 && selectedMonth === 'all') {
            setSelectedMonth(availableMonths[0])
        }
    }, [availableMonths])

    // Filter posters by selected month
    const filteredPosters = useMemo(() => {
        if (selectedMonth === 'all') return posters
        return posters.filter(p => p.poster_month === selectedMonth)
    }, [posters, selectedMonth])

    // Format YYYY-MM to readable label
    const formatMonth = (ym: string) => {
        const [y, m] = ym.split('-')
        const date = new Date(Number(y), Number(m) - 1)
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null
        setEditFile(f)
        if (editFilePreview) URL.revokeObjectURL(editFilePreview)
        setEditFilePreview(f ? URL.createObjectURL(f) : null)
    }

    const handleEditSave = async (id: string) => {
        setSavingEdit(true)
        try {
            let newImageUrl: string | undefined
            if (editImageMode === 'upload' && editFile) {
                newImageUrl = await uploadPosterImage(editFile)
            } else if (editImageMode === 'url' && editImageUrl.trim()) {
                newImageUrl = editImageUrl.trim()
            }
            await updatePosterMeta(id, editTitle.trim() || null, editDescription.trim() || null, newImageUrl, editMonth || null)
            setPosters(prev => prev.map(p => p.id === id ? {
                ...p,
                title: editTitle.trim() || null,
                description: editDescription.trim() || null,
                poster_month: editMonth || null,
                ...(newImageUrl ? { image_url: newImageUrl } : {})
            } : p))
            setEditingId(null)
            setEditFile(null)
            setEditFilePreview(null)
            setEditImageUrl('')
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSavingEdit(false)
        }
    }

    const load = async () => {
        try {
            setLoading(true)
            const postersData = await (isAdmin ? fetchPosters() : fetchVisiblePosters())
            setPosters(postersData)
        } catch (err) {
            console.error('Error loading posters:', err)
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null
        setFile(f)
        if (filePreview) URL.revokeObjectURL(filePreview)
        setFilePreview(f ? URL.createObjectURL(f) : null)
    }

    const resetForm = () => {
        setImageUrl('')
        setFile(null)
        if (filePreview) URL.revokeObjectURL(filePreview)
        setFilePreview(null)
        setTitle('')
        setDescription('')
        setPosterMonth('')
        setError(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    const canSubmit = inputMode === 'url' ? imageUrl.trim().length > 0 : file !== null

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        setSubmitting(true)
        setError(null)
        try {
            let url: string
            if (inputMode === 'upload' && file) {
                url = await uploadPosterImage(file)
            } else {
                url = imageUrl.trim()
            }

            await insertPoster({
                image_url: url,
                title: title.trim() || null,
                description: description.trim() || null,
                poster_month: posterMonth || null,
            })
            resetForm()
            setShowForm(false)
            await load()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add poster')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggle = async (poster: Poster) => {
        try {
            await updatePosterVisibility(poster.id, !poster.visible)
            setPosters(prev => prev.map(p => p.id === poster.id ? { ...p, visible: !p.visible } : p))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this poster?')) return
        try {
            await deletePoster(id)
            setPosters(prev => prev.filter(p => p.id !== id))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete')
        }
    }

    const movePoster = (items: Poster[], fromIndex: number, toIndex: number): Poster[] => {
        const next = [...items]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next.map((poster, index) => ({ ...poster, sort_order: index + 1 }))
    }

    const persistPosterOrder = async (orderedPosters: Poster[]) => {
        await Promise.all(
            orderedPosters.map((poster, index) =>
                updatePosterSortOrder(poster.id, index + 1)
            )
        )
    }

    const handleReorder = async (nextPosters: Poster[]) => {
        const normalized = nextPosters.map((poster, index) => ({ ...poster, sort_order: index + 1 }))
        const previous = [...posters]
        setPosters(normalized)
        try {
            await persistPosterOrder(normalized)
        } catch (err) {
            setPosters(previous)
            alert(err instanceof Error ? err.message : 'Failed to reorder')
        }
    }

    const handleMove = async (filteredIndex: number, direction: 'up' | 'down') => {
        const poster = filteredPosters[filteredIndex]
        const fullIndex = posters.findIndex(p => p.id === poster.id)
        const swapIndex = direction === 'up' ? fullIndex - 1 : fullIndex + 1
        if (swapIndex < 0 || swapIndex >= posters.length) return
        try {
            await handleReorder(movePoster(posters, fullIndex, swapIndex))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reorder')
        }
    }

    const handleDragStart = (id: string) => {
        if (!isAdmin) return
        setDraggingId(id)
    }

    const handleDragOver = (index: number) => {
        if (!isAdmin || draggingId === null) return
        setDragOverIndex(index)
    }

    const handleDragDrop = async (filteredIndex: number) => {
        if (!isAdmin || draggingId === null) return
        const fromIndex = posters.findIndex((poster) => poster.id === draggingId)
        const targetPoster = filteredPosters[filteredIndex]
        const toIndex = posters.findIndex(p => p.id === targetPoster?.id)
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            setDraggingId(null)
            setDragOverIndex(null)
            return
        }

        const ordered = movePoster(posters, fromIndex, toIndex)
        setDraggingId(null)
        setDragOverIndex(null)
        await handleReorder(ordered)
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-6 border-b border-blue-100 pb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <Image size={16} strokeWidth={3} />
                            <span>Academy Hiring Pulse</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Skills Companies Are <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Hiring For</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            Real-time placement posters with <span className="text-blue-600 font-bold">live hiring data</span> from top companies recruiting NxtWave students.
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowForm(f => !f)}
                            className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            {showForm ? 'Close Form' : 'Add Poster'}
                        </button>
                    )}
                </div>
            </header>

            {/* Add Poster Form */}
            {isAdmin && showForm && (
                <form onSubmit={handleAdd} className="glass-card p-5 mb-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-sm font-bold text-surface-800 mb-2">Upload New Poster</h2>
                    {/* Mode toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setInputMode('url')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                inputMode === 'url'
                                    ? 'bg-brand-500/20 text-brand-500 border-brand-500/30'
                                    : 'bg-surface-100 text-surface-500 border-surface-200 hover:bg-surface-100'
                            )}
                        >
                            <Link className="w-3.5 h-3.5" />
                            Image URL
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMode('upload')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                inputMode === 'upload'
                                    ? 'bg-brand-500/20 text-brand-500 border-brand-500/30'
                                    : 'bg-surface-100 text-surface-500 border-surface-200 hover:bg-surface-100'
                            )}
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Upload File
                        </button>
                    </div>

                    {/* URL input */}
                    {inputMode === 'url' && (
                        <div>
                            <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                                <Link className="w-3.5 h-3.5" />
                                Image URL *
                            </label>
                            <input
                                className="input-field"
                                placeholder="https://example.com/poster.png"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                            />
                        </div>
                    )}

                    {/* File upload */}
                    {inputMode === 'upload' && (
                        <div>
                            <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                Upload Image *
                            </label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-surface-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-500/20 file:text-brand-500 hover:file:bg-brand-500/30 file:cursor-pointer file:transition-colors"
                            />
                        </div>
                    )}

                    <div>
                        <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                            Title (optional)
                        </label>
                        <input
                            className="input-field"
                            placeholder="Poster title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                            Description (optional)
                        </label>
                        <textarea
                            className="input-field min-h-[80px] resize-none"
                            placeholder="Poster description..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Month *
                        </label>
                        <input
                            type="month"
                            className="input-field"
                            value={posterMonth}
                            onChange={e => setPosterMonth(e.target.value)}
                            required
                        />
                    </div>

                    {/* Preview */}
                    {(inputMode === 'url' ? imageUrl.trim() : filePreview) && (
                        <div>
                            <p className="text-xs text-surface-500 mb-2">Preview</p>
                            <img
                                src={inputMode === 'url' ? imageUrl.trim() : filePreview!}
                                alt="Preview"
                                className="max-h-48 rounded-xl border border-surface-200 object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => { resetForm(); setShowForm(false) }} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={submitting || !canSubmit} className="flex items-center gap-2 border border-blue-200 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {inputMode === 'upload' ? 'Uploading...' : 'Adding...'}</> : 'Add Poster'}
                        </button>
                    </div>
                </form>
            )}

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Month Filter */}
            {!loading && availableMonths.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer text-sm font-medium"
                        >
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonth(m)}</option>
                            ))}
                            <option value="all">All Months</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                    </div>
                    <span className="text-xs text-surface-400">
                        {filteredPosters.length} poster{filteredPosters.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Posters Grid */}
            <section>
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-72 rounded-2xl bg-surface-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredPosters.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-surface-200 p-16 text-center">
                        <Image className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                        <p className="text-surface-500 text-sm">
                            {selectedMonth !== 'all' && posters.length > 0
                                ? 'No posters for this month.'
                                : isAdmin ? 'No posters yet. Click "Add Poster" to get started.' : 'No posters available yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {filteredPosters.map((poster, posterIndex) => (
                            <div
                                key={poster.id}
                                draggable={isAdmin}
                                onDragStart={() => handleDragStart(poster.id)}
                                onDragOver={(event) => {
                                    event.preventDefault()
                                    handleDragOver(posterIndex)
                                }}
                                onDrop={(event) => {
                                    event.preventDefault()
                                    void handleDragDrop(posterIndex)
                                }}
                                onDragEnd={() => {
                                    setDraggingId(null)
                                    setDragOverIndex(null)
                                }}
                                className={cn(
                                    "group rounded-2xl border border-brand-200 hover:border-brand-400 shadow-md hover:shadow-xl hover:shadow-brand-300/40 hover:-translate-y-1 transition-all duration-300 self-start overflow-hidden bg-brand-50",
                                    draggingId === poster.id ? "ring-2 ring-brand-500/80" : "",
                                    dragOverIndex === posterIndex ? "ring-2 ring-brand-600/70" : ""
                                )}
                            >

                                {/* Title / info section — top with light blue bg */}
                                {(poster.title || poster.description || isAdmin) && (
                                    <div className="bg-brand-50 border-b border-brand-100">
                                        {editingId === poster.id ? (
                                            <div className="px-5 py-4 space-y-2">
                                                <input
                                                    className="w-full text-sm border border-brand-200 bg-white text-brand-900 placeholder-brand-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400"
                                                    placeholder="Title"
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                />
                                                <textarea
                                                    className="w-full text-sm border border-brand-200 bg-white text-brand-900 placeholder-brand-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400 resize-none"
                                                    placeholder="Description (optional)"
                                                    rows={2}
                                                    value={editDescription}
                                                    onChange={e => setEditDescription(e.target.value)}
                                                />
                                                {/* Image section */}
                                                <p className="text-xs text-brand-500 font-medium pt-1">Replace Image (optional)</p>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => setEditImageMode('url')} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors', editImageMode === 'url' ? 'bg-brand-500/20 text-brand-600 border-brand-400/30' : 'bg-white text-brand-400 border-brand-200')}>
                                                        <Link className="w-3 h-3" /> URL
                                                    </button>
                                                    <button type="button" onClick={() => setEditImageMode('upload')} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors', editImageMode === 'upload' ? 'bg-brand-500/20 text-brand-600 border-brand-400/30' : 'bg-white text-brand-400 border-brand-200')}>
                                                        <Upload className="w-3 h-3" /> Upload
                                                    </button>
                                                </div>
                                                {editImageMode === 'url' ? (
                                                    <input
                                                        className="w-full text-sm border border-brand-200 bg-white text-brand-900 placeholder-brand-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400"
                                                        placeholder="https://example.com/image.png"
                                                        value={editImageUrl}
                                                        onChange={e => setEditImageUrl(e.target.value)}
                                                    />
                                                ) : (
                                                    <input
                                                        ref={editFileRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleEditFileChange}
                                                        className="block w-full text-xs text-brand-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand-500/20 file:text-brand-600 hover:file:bg-brand-500/30 file:cursor-pointer"
                                                    />
                                                )}
                                                {(editImageMode === 'url' ? editImageUrl.trim() : editFilePreview) && (
                                                    <img
                                                        src={editImageMode === 'url' ? editImageUrl.trim() : editFilePreview!}
                                                        alt="Preview"
                                                        className="max-h-28 rounded-lg border border-brand-200 object-contain"
                                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                    />
                                                )}
                                                <p className="text-xs text-brand-500 font-medium pt-1">Month</p>
                                                <input
                                                    type="month"
                                                    className="w-full text-sm border border-brand-200 bg-white text-brand-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400"
                                                    value={editMonth}
                                                    onChange={e => setEditMonth(e.target.value)}
                                                />
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleEditSave(poster.id)}
                                                        disabled={savingEdit}
                                                        className="flex-1 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {savingEdit ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingId(null); setEditImageUrl(''); setEditFile(null); setEditFilePreview(null) }}
                                                        className="flex-1 py-1.5 rounded-lg border border-brand-200 bg-white text-xs text-brand-600 hover:bg-brand-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="px-5 py-4 flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    {poster.title && (
                                                        <p className="text-lg font-extrabold text-brand-900 tracking-tight leading-snug">{poster.title}</p>
                                                    )}
                                                    {poster.description && (
                                                        <p className="text-sm text-brand-700 mt-1 leading-relaxed">{poster.description}</p>
                                                    )}
                                                    {isAdmin && (
                                                        <p className={`text-xs mt-1 font-medium ${poster.visible ? 'text-emerald-600' : 'text-brand-300'}`}>
                                                            {poster.visible ? '● Visible to students' : '● Hidden from students'}
                                                        </p>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <div title="Drag poster to reorder">
                                                            <GripVertical className="w-4 h-4 text-surface-400" />
                                                        </div>
                                                        <button
                                                            onClick={() => handleMove(posterIndex, 'up')}
                                                            disabled={posterIndex === 0}
                                                            className="p-2 rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-100/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move up"
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMove(posterIndex, 'down')}
                                                            disabled={posterIndex === filteredPosters.length - 1}
                                                            className="p-2 rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-100/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move down"
                                                        >
                                                            <ArrowDown className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingId(poster.id); setEditTitle(poster.title ?? ''); setEditDescription(poster.description ?? ''); setEditMonth(poster.poster_month ?? '') }}
                                                            className="p-2 rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-100/50 transition-colors"
                                                            title="Edit title & description"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggle(poster)}
                                                            className={cn(
                                                                "p-2 rounded-lg transition-colors",
                                                                poster.visible ? "text-emerald-500 hover:bg-emerald-50" : "text-surface-300 hover:bg-surface-100"
                                                            )}
                                                            title={poster.visible ? 'Hide from students' : 'Show to students'}
                                                        >
                                                            {poster.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(poster.id)}
                                                            className="p-2 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Image — below title, with rounded edges and shadow */}
                                <div className="p-4 bg-white">
                                    <button onClick={() => setLightbox(poster)} className="relative w-full cursor-zoom-in block group/img">
                                        <div className="rounded-xl overflow-hidden shadow-lg shadow-brand-200/50">
                                            <img
                                                src={poster.image_url}
                                                alt={poster.title || 'Poster'}
                                                className="w-full h-auto object-contain transition-transform duration-300 group-hover/img:scale-[1.02]"
                                            />
                                        </div>
                                        <div className="absolute inset-0 rounded-xl bg-black/0 group-hover/img:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                                            <span className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                Click to expand
                                            </span>
                                        </div>
                                        {!poster.visible && (
                                            <div className="absolute top-2 left-2">
                                                <span className="text-xs font-medium text-surface-600 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-surface-200 shadow-sm">Hidden</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Lightbox */}
            <Dialog.Root open={!!lightbox} onOpenChange={open => { if (!open) setLightbox(null) }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-3xl max-h-[90vh] flex flex-col items-center focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out">
                        <Dialog.Title className="sr-only">{lightbox?.title || 'Poster'}</Dialog.Title>
                        <Dialog.Description className="sr-only">Enlarged poster view</Dialog.Description>
                        <Dialog.Close className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-surface-100 transition-colors z-10">
                            <X className="w-4 h-4 text-surface-700" />
                        </Dialog.Close>
                        {lightbox && (
                            <img
                                src={lightbox.image_url}
                                alt={lightbox.title || 'Poster'}
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                            />
                        )}
                        {lightbox?.title && (
                            <p className="mt-3 text-sm font-medium text-white/90">{lightbox.title}</p>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    )
}
