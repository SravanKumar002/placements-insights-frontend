import { useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import { insertJourney } from '../../services/alumniJourneyService'

interface AlumniJourneyModalProps {
    isOpen: boolean
    onClose: () => void
}

const emptyForm = {
    name: '',
    yog: '',
    nxtwave_join_date: '',
    college: '',
    program: '',
    city: '',
    state: '',
    linkedin_url: '',
    photo_url: '',
    social_media_url: '',
    company: '',
    company_website: '',
    role: '',
    ctc: '',
    placement_month: '',
    branch: '',
    journey_text: '',
    suggestion_to_peers: '',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs text-surface-500 mb-1">{label}{required && ' *'}</label>
            {children}
        </div>
    )
}

export function AlumniJourneyModal({ isOpen, onClose }: AlumniJourneyModalProps) {
    const [form, setForm] = useState({ ...emptyForm })
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value }))

    const reset = () => { setForm({ ...emptyForm }); setSuccess(false); setError(null); setUploading(false) }
    const handleClose = () => { reset(); onClose() }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return setError('Name is required')

        setUploading(true)
        setError(null)
        try {
            await insertJourney({
                name: form.name.trim(),
                branch: form.branch.trim() || form.program.trim(),
                college: form.college.trim(),
                city: form.city.trim(),
                state: form.state.trim() || null,
                journey_text: form.journey_text.trim(),
                yog: form.yog.trim() || null,
                nxtwave_join_date: form.nxtwave_join_date.trim() || null,
                program: form.program.trim() || null,
                linkedin_url: form.linkedin_url.trim() || null,
                photo_url: form.photo_url.trim() || null,
                social_media_url: form.social_media_url.trim() || null,
                company: form.company.trim() || null,
                company_website: form.company_website.trim() || null,
                role: form.role.trim() || null,
                ctc: form.ctc.trim() ? `${form.ctc.trim()} LPA` : null,
                placement_month: (() => {
                    const m = form.placement_month.trim()
                    if (!m) return null
                    // If only a month name was entered (no year), append current year
                    return /^\d{4}$/.test(m) || m.includes(' ') ? m : `${m} ${new Date().getFullYear()}`
                })(),
                suggestion_to_peers: form.suggestion_to_peers.trim() || null,
            })
            setSuccess(true)
            window.dispatchEvent(new Event('journey-added'))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">Add Academy Alumni</h2>
                        <p className="text-sm text-surface-500 mt-0.5">Inspire future batches with this story</p>
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
                        <h3 className="text-lg font-semibold text-surface-800 mb-2">Journey Added!</h3>
                        <p className="text-sm text-surface-500 mb-6">The story is now visible to all students.</p>
                        <button onClick={handleClose} className="btn-primary">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">

                        {/* Section: Personal Info */}
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Personal Info</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Name" required>
                                <input className="input-field" placeholder="Sathvik Reddy" value={form.name} onChange={set('name')} />
                            </Field>
                            <Field label="Photo URL">
                                <input className="input-field" placeholder="https://..." value={form.photo_url} onChange={set('photo_url')} />
                            </Field>
                        </div>

                        {/* Section: Academic */}
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Academic Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Year of Graduation (YOG)">
                                <input className="input-field" placeholder="2023" value={form.yog} onChange={set('yog')} />
                            </Field>
                            <Field label="NxtWave Join Date">
                                <input className="input-field" placeholder="Jan 2021" value={form.nxtwave_join_date} onChange={set('nxtwave_join_date')} />
                            </Field>
                            <Field label="College">
                                <input className="input-field" placeholder="JNTU Hyderabad" value={form.college} onChange={set('college')} />
                            </Field>
                            <Field label="Branch">
                                <input className="input-field" placeholder="B.Tech CSE" value={form.branch} onChange={set('branch')} />
                            </Field>
                            <Field label="City">
                                <input className="input-field" placeholder="Hyderabad" value={form.city} onChange={set('city')} />
                            </Field>
                            <Field label="State">
                                <input className="input-field" placeholder="Telangana" value={form.state} onChange={set('state')} />
                            </Field>
                        </div>

                        {/* Section: Career */}
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Career Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Company">
                                <input className="input-field" placeholder="CUBIC" value={form.company} onChange={set('company')} />
                            </Field>
                            <Field label="Company Website">
                                <input className="input-field" placeholder="https://..." value={form.company_website} onChange={set('company_website')} />
                            </Field>
                            <Field label="Role">
                                <input className="input-field" placeholder="Engineering Trainee" value={form.role} onChange={set('role')} />
                            </Field>
                            <Field label="CTC (LPA)">
                                <div className="relative">
                                    <input className="input-field pr-12" placeholder="4.5" type="number" min="0" step="0.1" value={form.ctc} onChange={set('ctc')} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400 pointer-events-none">LPA</span>
                                </div>
                            </Field>
                            <Field label="Placement Month">
                                <input className="input-field" placeholder="Mar 2025" value={form.placement_month} onChange={set('placement_month')} />
                            </Field>
                        </div>

                        {/* Section: Links */}
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Links</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="LinkedIn Profile URL">
                                <input className="input-field" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={set('linkedin_url')} />
                            </Field>
                            <Field label="Journey Video / Social Media URL">
                                <input className="input-field" placeholder="https://youtube.com/..." value={form.social_media_url} onChange={set('social_media_url')} />
                            </Field>
                        </div>

                        {/* Section: Journey */}
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Journey Story</p>
                        <Field label="Journey">
                            <textarea
                                className="input-field h-36 resize-none"
                                placeholder="Share the placement journey, challenges faced, resources that helped, and advice for juniors..."
                                value={form.journey_text}
                                onChange={set('journey_text')}
                            />
                        </Field>
                        <Field label="Suggestions to Peers (one per line)">
                            <textarea
                                className="input-field h-24 resize-none"
                                placeholder={"Improved fundamentals\nFocused on problem-solving\nStay consistent"}
                                value={form.suggestion_to_peers}
                                onChange={set('suggestion_to_peers')}
                            />
                        </Field>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={uploading} className="btn-primary">
                                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><BookOpen className="w-4 h-4" />Add Journey</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
