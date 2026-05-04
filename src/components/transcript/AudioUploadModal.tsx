import { useState, useRef } from 'react'
import { Mic, X, Loader2, CheckCircle, AlertCircle, Plus, Trash2, FileAudio, ChevronRight } from 'lucide-react'
import { uploadTranscript } from '../../services/transcriptService'
import { uploadAudioFile, startTranscription, type TranscriptionStage } from '../../services/geminiTranscriptionService'
import { cn } from '../../utils/cn'

interface AudioUploadModalProps {
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

type Step = 'form' | 'saving' | 'success'

const STAGE_LABELS: Record<TranscriptionStage, string> = {
    uploading: 'Uploading audio...',
    processing: 'Saving recording...',
}

export function AudioUploadModal({ isOpen, onClose }: AudioUploadModalProps) {
    const [step, setStep] = useState<Step>('form')
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const [callLabel, setCallLabel] = useState('')
    const [callDate, setCallDate] = useState('')
    const [alumniList, setAlumniList] = useState<AlumniFormEntry[]>([{ ...emptyAlumni }])
    const [stage, setStage] = useState<TranscriptionStage>('uploading')
    const [error, setError] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const reset = () => {
        setStep('form')
        setAudioFile(null)
        setCallLabel('')
        setCallDate('')
        setAlumniList([{ ...emptyAlumni }])
        setStage('uploading')
        setError(null)
    }

    const handleClose = () => { reset(); onClose() }

    const handleFilePick = (file: File) => {
        setAudioFile(file)
        setError(null)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('audio/') || file?.type.startsWith('video/')) {
            handleFilePick(file)
        }
    }

    const updateAlumni = (index: number, field: keyof AlumniFormEntry, value: string) =>
        setAlumniList(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))

    const addAlumni = () => setAlumniList(prev => [...prev, { ...emptyAlumni }])
    const removeAlumni = (index: number) => {
        if (alumniList.length <= 1) return
        setAlumniList(prev => prev.filter((_, i) => i !== index))
    }

    const handleSaveAndTranscribe = async () => {
        if (!audioFile) return setError('Please select an audio or video file')
        if (!callLabel.trim()) return setError('Call label / recording title is required')

        setError(null)
        setStep('saving')
        setStage('uploading')

        try {
            // 1. TUS upload to Supabase Storage
            const path = await uploadAudioFile(audioFile, s => setStage(s))

            // 2. Save transcript record immediately (empty transcript_text — will be filled by background job)
            setStage('processing')
            const alumniWithData = alumniList.filter(a => a.alumni_name.trim())
            const transcript = await uploadTranscript({
                transcript_text: '',
                call_date: callDate || undefined,
                call_label: callLabel.trim(),
                alumni: alumniWithData.map(a => ({
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

            // 3. Fire edge function (non-blocking — background Gemini transcription)
            startTranscription(path, audioFile.type, audioFile.size, transcript.id)

            // 4. Done — show success
            setStep('success')
            window.dispatchEvent(new Event('transcript-uploaded'))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setStep('form')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                            <Mic className="w-5 h-5 text-violet-500" />
                            Upload Recording
                        </h2>
                        <p className="text-sm text-surface-500 mt-0.5">
                            {step === 'form' && 'Select an audio file — Gemini will transcribe it in the background'}
                            {step === 'saving' && 'Uploading and saving your recording...'}
                            {step === 'success' && 'Recording saved — transcription is running in the background'}
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Step: Success ── */}
                {step === 'success' && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-surface-800 mb-2">Recording Saved!</h3>
                        <p className="text-sm text-surface-500 mb-1">Gemini is transcribing the audio in the background.</p>
                        <p className="text-sm text-surface-400 mb-6">The transcript will appear on the recording's page in a few minutes.</p>
                        <button onClick={handleClose} className="btn-primary">Close</button>
                    </div>
                )}

                {/* ── Step: Saving ── */}
                {step === 'saving' && (
                    <div className="p-10 flex flex-col items-center gap-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-surface-700">{STAGE_LABELS[stage]}</p>
                            <p className="text-xs text-surface-400 mt-1">Please wait — do not close this window.</p>
                        </div>
                        {/* Stage pills */}
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            {(['uploading', 'processing'] as TranscriptionStage[]).map((s, i, arr) => (
                                <span key={s} className="flex items-center gap-2">
                                    <span className={cn(
                                        'px-2 py-1 rounded-full',
                                        s === stage
                                            ? 'bg-violet-100 text-violet-700'
                                            : arr.indexOf(stage) > i
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-surface-100 text-surface-400'
                                    )}>
                                        {s === 'uploading' ? 'Upload' : 'Save'}
                                    </span>
                                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-surface-300" />}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step: Form ── */}
                {step === 'form' && (
                    <div className="p-6 space-y-5">
                        {/* Audio file picker */}
                        <div>
                            <h3 className="text-sm font-semibold text-surface-600 mb-3">Recording File *</h3>
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={cn(
                                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                                    dragOver ? 'border-violet-400 bg-violet-50' : 'border-surface-300 hover:border-surface-400 hover:bg-surface-100'
                                )}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="audio/*,video/mp4,video/mpeg,video/quicktime"
                                    className="hidden"
                                    onChange={e => e.target.files?.[0] && handleFilePick(e.target.files[0])}
                                />
                                {audioFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileAudio className="w-6 h-6 text-violet-500 shrink-0" />
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-surface-800 truncate max-w-xs">{audioFile.name}</p>
                                            <p className="text-xs text-surface-400">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Mic className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                                        <p className="text-sm text-surface-500">Drop audio/video file here or <span className="text-violet-500">click to browse</span></p>
                                        <p className="text-xs text-surface-400 mt-1">mp3, mp4, m4a, wav, ogg, flac — up to 2 GB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Call Label */}
                        <div>
                            <label className="block text-xs text-surface-500 mb-1">Call Label / Recording Title *</label>
                            <input
                                className="input-field"
                                placeholder="e.g. CWC April 12 Call, Alumni Meet March 2025"
                                value={callLabel}
                                onChange={e => setCallLabel(e.target.value)}
                            />
                            <p className="text-xs text-surface-400 mt-1">Used to identify this recording. Alumni details can be added after.</p>
                        </div>

                        {/* Alumni Information */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-surface-600">Alumni Information <span className="font-normal text-surface-400">(optional — can add after)</span></h3>
                                <button type="button" onClick={addAlumni}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors">
                                    <Plus className="w-3.5 h-3.5" />Add Alumni
                                </button>
                            </div>
                            <div className="space-y-3">
                                {alumniList.map((alumni, index) => (
                                    <div key={index} className="border border-surface-200 rounded-xl p-4 relative">
                                        {alumniList.length > 1 && (
                                            <button type="button" onClick={() => removeAlumni(index)}
                                                className="absolute top-3 right-3 p-1 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {alumniList.length > 1 && <p className="text-xs text-surface-600 mb-2">Alumni {index + 1}</p>}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Name</label>
                                                <input className="input-field" placeholder="Ravi Kumar" value={alumni.alumni_name}
                                                    onChange={e => updateAlumni(index, 'alumni_name', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Company</label>
                                                <input className="input-field" placeholder="Infosys" value={alumni.company}
                                                    onChange={e => updateAlumni(index, 'company', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Role</label>
                                                <input className="input-field" placeholder="Software Engineer" value={alumni.role}
                                                    onChange={e => updateAlumni(index, 'role', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-surface-500 mb-1">Package (LPA)</label>
                                                <input className="input-field" type="number" step="0.1" placeholder="6.5" value={alumni.package_lpa}
                                                    onChange={e => updateAlumni(index, 'package_lpa', e.target.value)} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-surface-500 mb-1">College / University</label>
                                                <input className="input-field" placeholder="JNTU Hyderabad" value={alumni.college}
                                                    onChange={e => updateAlumni(index, 'college', e.target.value)} />
                                            </div>
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
                                            <input className="input-field" type="url" placeholder="https://www.company.com" value={alumni.company_url}
                                                onChange={e => updateAlumni(index, 'company_url', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Call Date */}
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
                            <button type="button" onClick={handleSaveAndTranscribe} disabled={!audioFile || !callLabel.trim()}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                                <Mic className="w-4 h-4" />
                                Save &amp; Transcribe
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
