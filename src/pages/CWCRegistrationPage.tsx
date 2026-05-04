import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    UserCircle, Phone, HelpCircle, Calendar,
    CheckCircle, AlertCircle, Loader2, ArrowLeft,
} from 'lucide-react'
import { fetchSessionDate, insertCWCRegistration } from '../services/cwcService'
import { insertStudentQuery } from '../services/studentCtaService'

function Field({
    label, required, icon: Icon, children,
}: {
    label: string
    required?: boolean
    icon: React.ElementType
    children: React.ReactNode
}) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mb-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}{required && ' *'}
            </label>
            {children}
        </div>
    )
}

export function CWCRegistrationPage() {
    const navigate = useNavigate()
    const [sessionDate, setSessionDate] = useState<string>('...')
    const [form, setForm] = useState({ name: '', phone: '', question: '' })
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSessionDate().then(setSessionDate).catch(() => setSessionDate('TBD'))
    }, [])

    const set = (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [key]: e.target.value }))

    const phoneValid = /^\d{10}$/.test(form.phone.trim())
    const canSubmit = form.name.trim() && phoneValid && form.question.trim()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return setError('Name is required')
        if (!phoneValid) return setError('Enter a valid 10-digit mobile number')
        if (!form.question.trim()) return setError('Please enter your question')

        setSubmitting(true)
        setError(null)
        try {
            const trimmedName = form.name.trim()
            const trimmedQuestion = form.question.trim()

            // Save to CWC registrations table
            await insertCWCRegistration({
                name: trimmedName,
                phone: form.phone.trim(),
                question: trimmedQuestion,
            })

            // Also push question to QA Inbox (student_queries) so it appears in the Inbox
            await insertStudentQuery({
                name: trimmedName,
                question: trimmedQuestion,
                category: 'CWC Registration',
            })

            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to register')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="animate-fade-in pb-24">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0b4b8c] flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="page-title">Didn't find your question? Ask here</h1>
                    <p className="flex items-center gap-1.5 text-sm text-brand-500 font-medium mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Ask directly to Alumni on{' '}
                        <span className="text-brand-600 font-semibold">{sessionDate}</span>
                    </p>
                </div>
            </div>

            <div className="max-w-lg mt-8">
                {success ? (
                    /* ── Success state ── */
                    <div className="glass-card p-8 text-center animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold text-surface-800 mb-2">
                            Successfully Registered!
                        </h2>
                        <p className="text-surface-500 leading-relaxed mb-2">
                            You've been registered for the upcoming CWC session.
                        </p>
                        <p className="text-brand-600 font-semibold text-sm mb-8">
                            📅 {sessionDate}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => navigate('/')} className="btn-primary">
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Form ── */
                    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
                        <Field label="Student Name" required icon={UserCircle}>
                            <input
                                className="input-field"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={set('name')}
                            />
                        </Field>

                        <Field label="Registered Mobile Number" required icon={Phone}>
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
                        </Field>

                        <Field label="Ask Your Question" required icon={HelpCircle}>
                            <textarea
                                className="input-field h-32 resize-none"
                                placeholder="Type your question for the alumni..."
                                value={form.question}
                                onChange={set('question')}
                            />
                        </Field>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !canSubmit}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3"
                        >
                            {submitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                                : 'Register Here'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
