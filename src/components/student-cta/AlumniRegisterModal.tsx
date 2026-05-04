import { useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react'
import { insertAlumniRegistration } from '../../services/studentCtaService'

interface Props {
    isOpen: boolean
    onClose: () => void
}

const emptyForm = { name: '', email: '', phone: '', branch: '', batch: '', interest: '' }

export function AlumniRegisterModal({ isOpen, onClose }: Props) {
    const [form, setForm] = useState({ ...emptyForm })
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const reset = () => {
        setForm({ ...emptyForm })
        setSuccess(false)
        setError(null)
        setSubmitting(false)
    }

    const handleClose = () => { reset(); onClose() }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            branch: form.branch.trim(),
            batch: form.batch.trim(),
            interest: form.interest.trim(),
        }

        if (!trimmed.name) return setError('Name is required')
        if (!trimmed.email) return setError('Email is required')

        setSubmitting(true)
        setError(null)
        try {
            await insertAlumniRegistration({
                name: trimmed.name,
                email: trimmed.email,
                phone: trimmed.phone || undefined,
                branch: trimmed.branch || undefined,
                batch: trimmed.batch || undefined,
                interest: trimmed.interest || undefined,
            })
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
                <div className="flex items-center justify-between p-6 border-b border-surface-200">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">Register for Alumni Interaction</h2>
                        <p className="text-sm text-surface-500 mt-0.5">Get notified about upcoming alumni sessions</p>
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
                        <h3 className="text-lg font-semibold text-surface-800 mb-2">Registration Received!</h3>
                        <p className="text-sm text-surface-500 mb-6">We'll notify you about upcoming alumni interaction sessions.</p>
                        <button onClick={handleClose} className="btn-primary">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-surface-500 mb-1">Name *</label>
                                <input className="input-field" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs text-surface-500 mb-1">Email *</label>
                                <input className="input-field" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-surface-500 mb-1">Phone</label>
                                <input className="input-field" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs text-surface-500 mb-1">Branch</label>
                                <input className="input-field" placeholder="Computer Science" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-surface-500 mb-1">Batch</label>
                                <input className="input-field" placeholder="2024" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Topics of Interest</label>
                            <textarea className="input-field h-20 resize-none" placeholder="What topics would you like to discuss with alumni?" value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value }))} />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={submitting} className="btn-primary">
                                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><UserPlus className="w-4 h-4" /> Register</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
