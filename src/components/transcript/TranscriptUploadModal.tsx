import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { uploadTranscript } from '../../services/transcriptService'
import { cn } from '../../utils/cn'
import { cleanTranscript } from '../../utils/cleanTranscript'

interface TranscriptUploadModalProps {
    isOpen: boolean
    onClose: () => void
}

interface AlumniFormEntry {
    alumni_name: string
    company: string
    role: string
    package_lpa: string
    batch: string
    branch: string
    college: string
    graduation_year: string
    location: string
    company_url: string
}

const emptyAlumni: AlumniFormEntry = {
    alumni_name: '', company: '', role: '',
    package_lpa: '', batch: '', branch: '',
    college: '', graduation_year: '', location: '',
    company_url: '',
}

export function TranscriptUploadModal({ isOpen, onClose }: TranscriptUploadModalProps) {
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const [transcriptText, setTranscriptText] = useState('')
    const [callDate, setCallDate] = useState('')
    const [alumniList, setAlumniList] = useState<AlumniFormEntry[]>([{ ...emptyAlumni }])

    if (!isOpen) return null

    const reset = () => {
        setTranscriptText('')
        setCallDate('')
        setAlumniList([{ ...emptyAlumni }])
        setSuccess(false)
        setError(null)
        setUploading(false)
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const handleFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = e => {
            const raw = e.target?.result as string ?? ''
            setTranscriptText(cleanTranscript(raw))
        }
        reader.readAsText(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    const updateAlumni = (index: number, field: keyof AlumniFormEntry, value: string) => {
        setAlumniList(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
    }

    const addAlumni = () => setAlumniList(prev => [...prev, { ...emptyAlumni }])

    const removeAlumni = (index: number) => {
        if (alumniList.length <= 1) return
        setAlumniList(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!transcriptText.trim()) return setError('Please paste or upload a transcript')
        if (!alumniList[0].alumni_name.trim()) return setError('Alumni name is required')
        if (!alumniList[0].company.trim()) return setError('Company is required')

        setUploading(true)
        setError(null)
        console.log('[Upload] Starting transcript upload...', {
            textLength: transcriptText.length,
            alumniCount: alumniList.length,
            callDate: callDate || 'not set',
        })
        try {
            const result = await uploadTranscript({
                transcript_text: transcriptText,
                call_date: callDate || undefined,
                alumni: alumniList.map(a => ({
                    name: a.alumni_name,
                    company: a.company,
                    role: a.role,
                    package_lpa: a.package_lpa ? parseFloat(a.package_lpa) : null,
                    batch: a.batch || null,
                    branch: a.branch || null,
                    college: a.college || null,
                    graduation_year: a.graduation_year || null,
                    location: a.location || null,
                    company_url: a.company_url || null,
                })),
            })
            console.log('[Upload] Transcript inserted successfully:', {
                id: result.id,
                status: result.processing_status,
                alumni: result.alumni_name,
            })
            setSuccess(true)
            // Notify transcript list to refetch immediately
            window.dispatchEvent(new Event('transcript-uploaded'))
        } catch (err) {
            console.error('[Upload] Failed:', err)
            setError(err instanceof Error ? err.message : 'Upload failed')
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
                        <h2 className="text-lg font-bold text-surface-900">Upload Transcript</h2>
                        <p className="text-sm text-surface-500 mt-0.5">Upload a call transcript, then analyse it manually</p>
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
                        <h3 className="text-lg font-semibold text-surface-800 mb-2">Transcript Uploaded!</h3>
                        <p className="text-sm text-surface-500 mb-6">Click the Analyse button on the transcript to start processing.</p>
                        <button onClick={handleClose} className="btn-primary">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Transcript — comes first so user can extract alumni from it */}
                        <div>
                            <h3 className="text-sm font-semibold text-surface-600 mb-3">Transcript *</h3>

                            {/* Drop Zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={cn(
                                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mb-3',
                                    dragOver
                                        ? 'border-brand-500 bg-brand-50'
                                        : 'border-surface-300 hover:border-surface-400 hover:bg-surface-100'
                                )}
                            >
                                <input ref={fileRef} type="file" accept=".txt,.md" className="hidden"
                                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                <FileText className="w-8 h-8 text-surface-500 mx-auto mb-2" />
                                <p className="text-sm text-surface-500">Drop .txt file here or <span className="text-brand-500">click to browse</span></p>
                            </div>

                            <textarea
                                className="input-field h-40 resize-none font-mono text-xs"
                                placeholder="Or paste the transcript text here..."
                                value={transcriptText}
                                onChange={e => setTranscriptText(e.target.value)}
                                onPaste={e => {
                                    e.preventDefault()
                                    const pasted = e.clipboardData.getData('text')
                                    setTranscriptText(cleanTranscript(pasted))
                                }}
                            />
                        </div>

                        {/* Alumni Information */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-surface-600">
                                    Alumni Information ({alumniList.length})
                                </h3>
                                <button
                                    type="button"
                                    onClick={addAlumni}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />Add Alumni
                                </button>
                            </div>

                            <div className="space-y-3">
                                {alumniList.map((alumni, index) => (
                                    <div key={index} className="border border-surface-200 rounded-xl p-4 relative">
                                        {alumniList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAlumni(index)}
                                                className="absolute top-3 right-3 p-1 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {alumniList.length > 1 && (
                                            <p className="text-xs text-surface-600 mb-2">Alumni {index + 1}</p>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Row 1: Name + Company */}
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Name *</label>
                                                <input className="input-field" placeholder="Ravi Kumar" value={alumni.alumni_name}
                                                    onChange={e => updateAlumni(index, 'alumni_name', e.target.value)} required={index === 0} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Company *</label>
                                                <input className="input-field" placeholder="Infosys" value={alumni.company}
                                                    onChange={e => updateAlumni(index, 'company', e.target.value)} required={index === 0} />
                                            </div>
                                            {/* Row 2: Role + Package */}
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Role *</label>
                                                <input className="input-field" placeholder="Software Engineer" value={alumni.role}
                                                    onChange={e => updateAlumni(index, 'role', e.target.value)} required={index === 0} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Package (LPA)</label>
                                                <input className="input-field" type="number" step="0.1" placeholder="6.5" value={alumni.package_lpa}
                                                    onChange={e => updateAlumni(index, 'package_lpa', e.target.value)} />
                                            </div>
                                            {/* Row 3: College (full width) */}
                                            <div className="col-span-2">
                                                <label className="block text-xs text-surface-500 mb-1">College / University</label>
                                                <input className="input-field" placeholder="JNTU Hyderabad" value={alumni.college}
                                                    onChange={e => updateAlumni(index, 'college', e.target.value)} />
                                            </div>
                                            {/* Row 4: Branch + Graduation Year */}
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Branch</label>
                                                <input className="input-field" placeholder="Mechanical Engineering" value={alumni.branch}
                                                    onChange={e => updateAlumni(index, 'branch', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Graduation Year</label>
                                                <input className="input-field" placeholder="2023" value={alumni.graduation_year}
                                                    onChange={e => updateAlumni(index, 'graduation_year', e.target.value)} />
                                            </div>
                                            {/* Row 5: Location + NxtWave Batch */}
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Location</label>
                                                <input className="input-field" placeholder="Hyderabad, Telangana" value={alumni.location}
                                                    onChange={e => updateAlumni(index, 'location', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">NxtWave Batch</label>
                                                <input className="input-field" placeholder="June 2022" value={alumni.batch}
                                                    onChange={e => updateAlumni(index, 'batch', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-xs text-surface-500 mb-1">Company URL</label>
                                            <input className="input-field" type="url" placeholder="https://www.cubiccorporation.com" value={alumni.company_url}
                                                onChange={e => updateAlumni(index, 'company_url', e.target.value)} />
                                            <p className="text-xs text-surface-600 mt-1">Company website URL — logo will be auto-generated.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Call Date (shared for the call) */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Call Date</label>
                            <input className="input-field" type="date" value={callDate}
                                onChange={e => setCallDate(e.target.value)} />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={uploading} className="btn-primary">
                                {uploading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                                ) : (
                                    <><Upload className="w-4 h-4" />Upload</>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
