import { useState, useEffect } from 'react'
import { X, Loader2, Save, Eye, PenLine } from 'lucide-react'
import TurndownService from 'turndown'

const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
})
import { createIntelligenceCard, updateIntelligenceCard } from '../../services/intelligenceCardService'
import type { IntelligenceCard } from '../../services/intelligenceCardService'
import { MarkdownContent } from '../ui/MarkdownContent'
import { cn } from '../../utils/cn'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    editing?: IntelligenceCard | null
}

const emptyForm = { title: '', url: '', company_url: '', description: '', content: '', month: '', badge: '' }

export function IntelligenceCardModal({ isOpen, onClose, onSaved, editing }: Props) {
    const [form, setForm] = useState({ ...emptyForm })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState(false)

    useEffect(() => {
        if (editing) {
            setForm({
                title: editing.title,
                url: editing.url ?? '',
                company_url: editing.company_url ?? '',
                description: editing.description ?? '',
                content: editing.content ?? '',
                month: editing.month ?? '',
                badge: editing.badge ?? '',
            })
        } else {
            setForm({ ...emptyForm })
        }
        setError(null)
        setPreview(false)
    }, [editing, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!form.title.trim()) return setError('Title is required')

        setSaving(true)
        setError(null)
        try {
            const payload = {
                title: form.title.trim(),
                url: form.url.trim() || null,
                company_url: form.company_url.trim() || null,
                description: form.description.trim() || null,
                content: form.content.trim() || null,
                month: form.month.trim() || null,
                badge: form.badge.trim() || null,
            }
            if (editing) {
                await updateIntelligenceCard(editing.id, payload)
            } else {
                await createIntelligenceCard(payload)
            }
            onSaved()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200">
                    <h2 className="text-lg font-bold text-surface-900">
                        {editing ? 'Edit Card' : 'Add Card'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs text-surface-500 mb-1.5">Title *</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. System Design Fundamentals"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-xs text-surface-500 mb-1.5">URL (optional)</label>
                        <input
                            type="url"
                            className="input-field"
                            placeholder="https://..."
                            value={form.url}
                            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        />
                    </div>

                    {/* Company URL */}
                    <div>
                        <label className="block text-xs text-surface-500 mb-1.5">Company URL (optional)</label>
                        <input
                            type="url"
                            className="input-field"
                            placeholder="https://company.com"
                            value={form.company_url}
                            onChange={e => setForm(f => ({ ...f, company_url: e.target.value }))}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-surface-500 mb-1.5">Description (optional)</label>
                        <textarea
                            className="input-field min-h-[80px] resize-none"
                            placeholder="Brief summary shown on the card..."
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    {/* Month and Badge */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-surface-500 mb-1.5">Month (e.g. April 2024)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Month & Year"
                                value={form.month}
                                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-surface-500 mb-1.5">Badge Text (optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Students Selected"
                                value={form.badge}
                                onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs text-surface-500">Content — Markdown supported</label>
                            <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setPreview(false)}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                        !preview ? "bg-white text-surface-700 shadow-sm" : "text-surface-500 hover:text-surface-600"
                                    )}
                                >
                                    <PenLine className="w-3 h-3" /> Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreview(true)}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                        preview ? "bg-white text-surface-700 shadow-sm" : "text-surface-500 hover:text-surface-600"
                                    )}
                                >
                                    <Eye className="w-3 h-3" /> Preview
                                </button>
                            </div>
                        </div>
                        {preview ? (
                            <div className="input-field h-36 overflow-y-auto p-3">
                                {form.content.trim() ? (
                                    <MarkdownContent content={form.content} />
                                ) : (
                                    <p className="text-sm text-surface-400 italic">Nothing to preview</p>
                                )}
                            </div>
                        ) : (
                            <textarea
                                className="input-field h-36 resize-none font-mono text-xs"
                                placeholder="Paste from Notion or write markdown...&#10;&#10;# Heading&#10;- Bullet point&#10;**Bold text**&#10;`inline code`"
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                onPaste={e => {
                                    const html = e.clipboardData.getData('text/html')
                                    if (html && html.trim()) {
                                        e.preventDefault()
                                        const markdown = turndown.turndown(html)
                                        const ta = e.currentTarget
                                        const before = form.content.slice(0, ta.selectionStart)
                                        const after = form.content.slice(ta.selectionEnd)
                                        setForm(f => ({ ...f, content: before + markdown + after }))
                                    }
                                }}
                            />
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                        >
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                : <><Save className="w-4 h-4" /> {editing ? 'Save Changes' : 'Add Card'}</>}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    )
}
