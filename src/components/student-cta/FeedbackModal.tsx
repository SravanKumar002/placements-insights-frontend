import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, CheckCircle, AlertCircle, Send, Star, LayoutDashboard } from 'lucide-react'
import { insertFeedback } from '../../services/studentCtaService'
import { cn } from '../../utils/cn'

interface Props {
    isOpen: boolean
    onClose: () => void
    defaultPage?: string
}

const RATING_LABELS: Record<number, string> = {
    1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent!',
}

const PAGE_OPTIONS = [
    { value: 'Placement Doubts', label: '💬 Placement Doubts' },
    { value: 'Academy Alumni', label: '🎓 Academy Alumni' },
    { value: 'Academy Hiring Pulse++', label: '📊 Academy Hiring Pulse++' },
    { value: 'NxtWave Interview Intelligence', label: '🧠 Interview Intelligence' },
    { value: 'Other', label: '✨ Other' },
]

const emptyForm = { rating: 0, message: '', phone: '', page: '' }

export function FeedbackModal({ isOpen, onClose, defaultPage }: Props) {
    const [form, setForm] = useState({ ...emptyForm, page: defaultPage ?? '' })
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) setForm(f => ({ ...f, page: defaultPage ?? f.page }))
    }, [isOpen, defaultPage])

    if (!isOpen) return null

    const reset = () => { setForm({ ...emptyForm, page: defaultPage ?? '' }); setSuccess(false); setError(null) }
    const handleClose = () => { reset(); onClose() }

    const isPositive = form.rating >= 4
    const isNegative = form.rating > 0 && form.rating <= 3
    const messageRequired = isNegative
    const messageLabel = isPositive
        ? 'What helped you the most?'
        : 'What other suggestions or improvements are required? *'
    const messagePlaceholder = isPositive
        ? 'Tell us what was most helpful...'
        : 'Share your suggestions for improvement...'

    const phoneValid = /^\d{10}$/.test(form.phone.trim())
    const canSubmit =
        form.rating > 0 &&
        form.page !== '' &&
        phoneValid &&
        (!messageRequired || form.message.trim().length > 0)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!form.rating) return setError('Please select a rating')
        if (!form.page) return setError('Please select the page you are giving feedback on')
        if (!phoneValid) return setError('Enter a valid 10-digit mobile number')
        if (messageRequired && !form.message.trim()) return setError('Please share your suggestions')

        setSubmitting(true)
        setError(null)
        try {
            await insertFeedback({
                rating: form.rating,
                message: form.message.trim() || undefined,
                phone: form.phone.trim() || undefined,
                category: form.page,
            })
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit')
        } finally {
            setSubmitting(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">We value your feedback</h2>
                        <p className="text-xs text-surface-500 mt-0.5">Help us improve your experience</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-surface-800 mb-2">Feedback Sent!</h3>
                        <p className="text-sm text-surface-500 mb-6">Thank you for helping us improve.</p>
                        <button onClick={handleClose} className="btn-primary">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">

                        {/* Page selector */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-2">
                                <span className="flex items-center gap-1">
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Which page are you giving feedback on? *
                                </span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAGE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, page: opt.value }))}
                                        className={cn(
                                            'px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all',
                                            form.page === opt.value
                                                ? 'bg-brand-50 border-brand-400 text-brand-700 ring-1 ring-brand-400'
                                                : 'bg-white border-surface-200 text-surface-600 hover:border-brand-300 hover:bg-brand-50/50'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Star rating */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-2">How was your experience? *</label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, rating: f.rating === star ? 0 : star, message: '' }))}
                                        className="p-1 rounded transition-colors"
                                    >
                                        <Star className={cn(
                                            'w-7 h-7 transition-colors',
                                            star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-600'
                                        )} />
                                    </button>
                                ))}
                                {form.rating > 0 && (
                                    <span className="ml-2 text-sm text-surface-500">
                                        {RATING_LABELS[form.rating]}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Conditional message area */}
                        {(isPositive || isNegative) && (
                            <div>
                                <label className="block text-xs text-surface-500 mb-2">{messageLabel}</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    placeholder={messagePlaceholder}
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                />
                            </div>
                        )}

                        {/* Registered Mobile Number */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-2">Registered Mobile Number *</label>
                            <input
                                type="tel"
                                required
                                className="input-field"
                                placeholder="10-digit mobile number"
                                maxLength={10}
                                value={form.phone}
                                onChange={e => {
                                    const v = e.target.value.replace(/\D/g, '')
                                    setForm(f => ({ ...f, phone: v }))
                                }}
                            />
                            {form.phone && !phoneValid && (
                                <p className="text-xs text-red-500 mt-1">Enter a valid 10-digit mobile number</p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-1">
                            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                            <button
                                type="submit"
                                disabled={submitting || !canSubmit}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                    : <><Send className="w-4 h-4" /> Send Feedback</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    )
}
