import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, CheckCircle, AlertCircle, UserCircle, Phone, HelpCircle, Calendar } from 'lucide-react'
import { fetchSessionDate, insertCWCRegistration } from '../../services/cwcService'
import { insertStudentQuery } from '../../services/studentCtaService'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export function CWCModal({ isOpen, onClose }: Props) {
    const [sessionDate, setSessionDate] = useState<string>('...')
    const [form, setForm] = useState({ name: '', phone: '', question: '' })
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchSessionDate().then(setSessionDate).catch(() => setSessionDate('TBD'))
        }
    }, [isOpen])

    if (!isOpen) return null

    const reset = () => { setForm({ name: '', phone: '', question: '' }); setSuccess(false); setError(null) }
    const handleClose = () => { reset(); onClose() }

    const set = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [key]: e.target.value }))

    const phoneValid = /^\d{10}$/.test(form.phone.trim())
    const canSubmit = form.name.trim() && phoneValid && form.question.trim()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!form.name.trim()) return setError('Name is required')
        if (!phoneValid) return setError('Enter a valid 10-digit mobile number')
        if (!form.question.trim()) return setError('Please enter your question')

        setSubmitting(true)
        setError(null)
        try {
            const trimmedName = form.name.trim()
            const trimmedQuestion = form.question.trim()
            await insertCWCRegistration({ name: trimmedName, phone: form.phone.trim(), question: trimmedQuestion })
            await insertStudentQuery({ name: trimmedName, question: trimmedQuestion, category: 'CWC Registration' })
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to register')
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
                        <h2 className="text-lg font-bold text-surface-900">Didn't find your question? Ask here</h2>
                        <p className="flex items-center gap-1.5 text-xs text-brand-500 font-medium mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Ask directly to Alumni on <span className="text-brand-600 font-semibold">{sessionDate}</span>
                        </p>
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
                        <h3 className="text-lg font-semibold text-surface-800 mb-2">Successfully Registered!</h3>
                        <p className="text-sm text-surface-500 mb-2">You've been registered for the upcoming CWC session.</p>
                        <p className="text-brand-600 font-semibold text-sm mb-6">📅 {sessionDate}</p>
                        <button onClick={handleClose} className="btn-primary">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                                <UserCircle className="w-3.5 h-3.5" /> Student Name *
                            </label>
                            <input
                                className="input-field"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={set('name')}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                                <Phone className="w-3.5 h-3.5" /> Registered Mobile Number *
                            </label>
                            <input
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

                        <div>
                            <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                                <HelpCircle className="w-3.5 h-3.5" /> Ask Your Question *
                            </label>
                            <textarea
                                className="input-field h-32 resize-none"
                                placeholder="Type your question for the alumni..."
                                value={form.question}
                                onChange={set('question')}
                            />
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
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                                    : 'Register Here'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    )
}
