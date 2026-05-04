import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, GraduationCap, Calendar, CheckCircle, Loader2, Clock, Trash2, MapPin, UserPlus, X, AlertCircle, Plus } from 'lucide-react'
import { fetchTranscriptById, fetchTranscriptAlumni, deleteTranscript, insertTranscriptAlumni } from '../services/transcriptService'
import type { Transcript, TranscriptAlumni, QAItem } from '../types'
import { formatDate, formatRelative } from '../utils/formatDate'
import { QAList } from '../components/qa/QAList'
import { supabase } from '../config/supabase'
import { AnalyzeButton } from '../components/AnalyzeButton'
import { AlumniAvatar } from '../components/alumni/AlumniAvatar'

export function TranscriptDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [transcript, setTranscript] = useState<Transcript | null>(null)
    const [alumni, setAlumni] = useState<TranscriptAlumni[]>([])
    const [relatedQA, setRelatedQA] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [showAddAlumni, setShowAddAlumni] = useState(false)
    const emptyAlumniEntry = () => ({ alumni_name: '', company: '', role: '', package_lpa: '', batch: '', branch: '', college: '', graduation_year: '', location: '', company_url: '' })
    const [addAlumniList, setAddAlumniList] = useState([emptyAlumniEntry()])
    const [savingAlumni, setSavingAlumni] = useState(false)
    const [alumniError, setAlumniError] = useState<string | null>(null)

    const loadData = async () => {
        if (!id) return

        try {
            // Run independent queries in parallel
            const [transcriptData, alumniData, answersResult] = await Promise.all([
                fetchTranscriptById(id),
                fetchTranscriptAlumni(id),
                supabase.from('qa_answers').select('qa_item_id').eq('transcript_id', id),
            ])

            setTranscript(transcriptData)
            setAlumni(alumniData)

            const answers = answersResult.data
            if (answers && answers.length > 0) {
                const qaItemIds = [...new Set((answers as { qa_item_id: string }[]).map(a => a.qa_item_id))]
                const { data: items } = await supabase
                    .from('qa_items')
                    .select('*, answers:qa_answers(*)')
                    .in('id', qaItemIds)

                if (items) {
                    setRelatedQA(
                        (items as QAItem[]).map(q => ({
                            ...q,
                            answers: q.answers?.filter(a => a.transcript_id === id) ?? []
                        })).filter(q => q.answers && q.answers.length > 0)
                    )
                }
            } else {
                setRelatedQA([])
            }
        } catch (error) {
            console.error('Error loading transcript data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [id])

    // Auto-poll every 5s while audio transcription is still running in the background
    useEffect(() => {
        if (!transcript) return
        if (transcript.transcript_text || transcript.processing_status !== 'pending') return
        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [transcript?.transcript_text, transcript?.processing_status])

    const handleDelete = async () => {
        if (!id) return
        if (!confirm('Delete this transcript and all its Q&A data? This cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteTranscript(id)
            navigate('/transcripts')
        } catch (err) {
            console.error('Delete failed:', err)
            alert('Failed to delete transcript.')
            setDeleting(false)
        }
    }

    const updateAlumniEntry = (index: number, field: string, value: string) =>
        setAddAlumniList(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))

    const handleAddAlumni = async () => {
        const filled = addAlumniList.filter(a => a.alumni_name.trim())
        if (!id || filled.length === 0) return setAlumniError('At least one alumni name is required')
        setSavingAlumni(true)
        setAlumniError(null)
        try {
            await insertTranscriptAlumni(id, filled.map(a => ({
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
            })))
            setShowAddAlumni(false)
            setAddAlumniList([emptyAlumniEntry()])
            loadData()
        } catch (err) {
            setAlumniError(err instanceof Error ? err.message : 'Failed to save alumni')
        } finally {
            setSavingAlumni(false)
        }
    }

    if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-surface-100 animate-pulse" />)}</div>
    if (!transcript) return <div className="text-surface-500 text-center py-10">Transcript not found</div>

    const isTranscribing = !transcript.transcript_text && transcript.processing_status === 'pending'

    const getStatusInfo = () => {
        if (isTranscribing) {
            return { icon: <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />, label: 'Transcribing audio...' }
        }
        if (transcript.processing_status === 'processing') {
            return { icon: <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />, label: 'Analysing' }
        }
        if (transcript.processing_status === 'done') {
            return { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: 'Completed' }
        }
        return { icon: <Clock className="w-4 h-4 text-surface-500" />, label: 'Pending' }
    }
    const statusInfo = getStatusInfo()

    return (
        <div className="animate-fade-in">
            <Link to="/transcripts" className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Transcripts
            </Link>

            {/* Alumni Header */}
            <div className="glass-card p-6 mb-6">
                {/* Status + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {statusInfo.icon}
                        <span className="text-xs text-surface-500">{statusInfo.label}</span>
                        {transcript.processing_status === 'done' && transcript.updated_at && (
                            <span className="text-xs text-surface-500">
                                · {formatDate(transcript.updated_at)} · {formatRelative(transcript.updated_at)}
                            </span>
                        )}
                        {transcript.call_date && (
                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                                <Calendar className="w-3.5 h-3.5" />{formatDate(transcript.call_date)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!isTranscribing && (
                            <AnalyzeButton
                                transcriptId={transcript.id}
                                status={transcript.processing_status}
                                onComplete={loadData}
                            />
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded shadow-sm text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>

                {/* Alumni entries */}
                <div className="space-y-4">
                    {alumni.length === 0 ? (
                        <p className="text-sm text-surface-400 italic">No alumni linked yet — add alumni details below.</p>
                    ) : alumni.map((a, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <AlumniAvatar name={a.alumni_name} logoUrl={a.company_logo_url} size="md" />
                            <div className="flex-1">
                                <h2 className={idx === 0 ? 'text-xl font-bold text-surface-900' : 'text-lg font-bold text-surface-900'}>{a.alumni_name}</h2>
                                <div className="space-y-1 mt-1">
                                    <p className="flex items-center gap-1.5 text-sm text-surface-500">
                                        <Building2 className="w-4 h-4 shrink-0" />
                                        <span>{a.company}{a.role ? ` · ${a.role}` : ''}{a.package_lpa ? ` · ${a.package_lpa} LPA` : ''}</span>
                                    </p>
                                    {(a.college || a.branch || a.graduation_year) && (
                                        <p className="flex items-center gap-1.5 text-sm text-surface-500">
                                            <GraduationCap className="w-4 h-4 shrink-0" />
                                            <span>{[a.college, a.branch, a.graduation_year].filter(Boolean).join(' · ')}</span>
                                        </p>
                                    )}
                                    {a.location && (
                                        <p className="flex items-center gap-1.5 text-sm text-surface-500">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span>{a.location}</span>
                                        </p>
                                    )}
                                    {a.batch && (
                                        <p className="mt-1">
                                            <span className="badge badge-brand text-xs">NxtWave · {a.batch}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Alumni button / inline form */}
                    {!showAddAlumni ? (
                        <button
                            onClick={() => setShowAddAlumni(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            {alumni.length === 0 ? 'Add Alumni' : 'Add Alumni'}
                        </button>
                    ) : (
                        <div className="border border-surface-200 rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-surface-600">Add Alumni Details</p>
                                <button onClick={() => { setShowAddAlumni(false); setAlumniError(null); setAddAlumniList([emptyAlumniEntry()]) }} className="p-1 rounded hover:bg-surface-100 text-surface-400">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {addAlumniList.map((entry, index) => (
                                <div key={index} className="border border-surface-100 rounded-lg p-3 relative">
                                    {addAlumniList.length > 1 && (
                                        <button
                                            onClick={() => setAddAlumniList(prev => prev.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 p-1 rounded text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {addAlumniList.length > 1 && <p className="text-xs font-medium text-surface-500 mb-2">Alumni {index + 1}</p>}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Name *</label>
                                            <input className="input-field" placeholder="Ravi Kumar" value={entry.alumni_name}
                                                onChange={e => updateAlumniEntry(index, 'alumni_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Company</label>
                                            <input className="input-field" placeholder="Infosys" value={entry.company}
                                                onChange={e => updateAlumniEntry(index, 'company', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Role</label>
                                            <input className="input-field" placeholder="Software Engineer" value={entry.role}
                                                onChange={e => updateAlumniEntry(index, 'role', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Package (LPA)</label>
                                            <input className="input-field" type="number" step="0.1" placeholder="6.5" value={entry.package_lpa}
                                                onChange={e => updateAlumniEntry(index, 'package_lpa', e.target.value)} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-surface-500 mb-1">College / University</label>
                                            <input className="input-field" placeholder="JNTU Hyderabad" value={entry.college}
                                                onChange={e => updateAlumniEntry(index, 'college', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Branch</label>
                                            <input className="input-field" placeholder="CSE" value={entry.branch}
                                                onChange={e => updateAlumniEntry(index, 'branch', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Graduation Year</label>
                                            <input className="input-field" placeholder="2023" value={entry.graduation_year}
                                                onChange={e => updateAlumniEntry(index, 'graduation_year', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">Location</label>
                                            <input className="input-field" placeholder="Hyderabad" value={entry.location}
                                                onChange={e => updateAlumniEntry(index, 'location', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-surface-500 mb-1">NxtWave Batch</label>
                                            <input className="input-field" placeholder="June 2022" value={entry.batch}
                                                onChange={e => updateAlumniEntry(index, 'batch', e.target.value)} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-surface-500 mb-1">Company URL</label>
                                            <input className="input-field" type="url" placeholder="https://www.company.com" value={entry.company_url}
                                                onChange={e => updateAlumniEntry(index, 'company_url', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setAddAlumniList(prev => [...prev, emptyAlumniEntry()])}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Another Alumni
                            </button>

                            {alumniError && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-600">{alumniError}</p>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => { setShowAddAlumni(false); setAlumniError(null); setAddAlumniList([emptyAlumniEntry()]) }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                                <button onClick={handleAddAlumni} disabled={savingAlumni}
                                    className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
                                    {savingAlumni ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : 'Save Alumni'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transcribing banner */}
            {isTranscribing && (
                <div className="glass-card p-6 mb-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-surface-800">Transcribing audio in the background</p>
                        <p className="text-xs text-surface-500 mt-0.5">Gemini is processing the recording — this page will update automatically when the transcript is ready.</p>
                    </div>
                </div>
            )}

            {/* Transcript Text */}
            {transcript.transcript_text && (
                <div className="glass-card p-6 mb-6">
                    <h2 className="section-title mb-4">Transcript</h2>
                    <div className="bg-surface-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-surface-500 font-mono whitespace-pre-wrap leading-relaxed">{transcript.transcript_text}</pre>
                    </div>
                </div>
            )}

            {/* Q&As from this transcript */}
            {relatedQA.length > 0 && (
                <div>
                    <h2 className="section-title mb-4">Q&As from this call ({relatedQA.length})</h2>
                    <QAList items={relatedQA} showCategory />
                </div>
            )}

        </div>
    )
}
