import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { updateAlumni } from '../../services/alumniService'

interface AlumniEditModalProps {
    isOpen: boolean
    onClose: () => void
    alumni: {
        alumni_id: string
        name: string
        company: string
        role: string
        batch: string | null
        branch: string | null
        college: string | null
        graduation_year: string | null
        location: string | null
        company_url?: string | null
    } | null
    onSaved: () => void
}

export function AlumniEditModal({ isOpen, onClose, alumni, onSaved }: AlumniEditModalProps) {
    const [form, setForm] = useState({
        alumni_name: '',
        company: '',
        role: '',
        batch: '',
        branch: '',
        college: '',
        graduation_year: '',
        location: '',
        company_url: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (alumni) {
            setForm({
                alumni_name: alumni.name,
                company: alumni.company,
                role: alumni.role,
                batch: alumni.batch ?? '',
                branch: alumni.branch ?? '',
                college: alumni.college ?? '',
                graduation_year: alumni.graduation_year ?? '',
                location: alumni.location ?? '',
                company_url: alumni.company_url ?? '',
            })
            setError(null)
        }
    }, [alumni])

    if (!isOpen || !alumni) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.alumni_name.trim()) return setError('Name is required')
        if (!form.company.trim()) return setError('Company is required')
        if (!form.role.trim()) return setError('Role is required')

        setSaving(true)
        setError(null)
        try {
            await updateAlumni(alumni.alumni_id, {
                alumni_name: form.alumni_name.trim(),
                company: form.company.trim(),
                role: form.role.trim(),
                batch: form.batch.trim() || null,
                branch: form.branch.trim() || null,
                college: form.college.trim() || null,
                graduation_year: form.graduation_year.trim() || null,
                location: form.location.trim() || null,
                company_url: form.company_url.trim() || null,
            })
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
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200">
                    <h2 className="text-lg font-bold text-surface-900">Edit Alumni</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Row 1: Name + Company */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Name *</label>
                            <input className="input-field" value={form.alumni_name}
                                onChange={e => setForm(f => ({ ...f, alumni_name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Company *</label>
                            <input className="input-field" value={form.company}
                                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                        </div>

                        {/* Row 2: Role + Salary */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Role *</label>
                            <input className="input-field" value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">NxtWave Batch</label>
                            <input className="input-field" placeholder="e.g. June 2022" value={form.batch}
                                onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} />
                        </div>

                        {/* Row 3: College (full width) */}
                        <div className="col-span-2">
                            <label className="block text-xs text-surface-500 mb-1">College / University</label>
                            <input className="input-field" placeholder="e.g. JNTU Hyderabad" value={form.college}
                                onChange={e => setForm(f => ({ ...f, college: e.target.value }))} />
                        </div>

                        {/* Row 4: Branch + Graduation Year */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Branch</label>
                            <input className="input-field" placeholder="e.g. Mechanical Engineering" value={form.branch}
                                onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Graduation Year</label>
                            <input className="input-field" placeholder="e.g. 2023" value={form.graduation_year}
                                onChange={e => setForm(f => ({ ...f, graduation_year: e.target.value }))} />
                        </div>

                        {/* Row 5: Location (full width) */}
                        <div className="col-span-2">
                            <label className="block text-xs text-surface-500 mb-1">Location</label>
                            <input className="input-field" placeholder="e.g. Hyderabad, Telangana" value={form.location}
                                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                        </div>

                        {/* Row 6: Company URL (full width) */}
                        <div className="col-span-2">
                            <label className="block text-xs text-surface-500 mb-1">Company URL</label>
                            <input className="input-field" type="url" placeholder="https://www.cubiccorporation.com" value={form.company_url}
                                onChange={e => setForm(f => ({ ...f, company_url: e.target.value }))} />
                            <p className="text-xs text-surface-600 mt-1">Company website URL — logo will be auto-generated.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
