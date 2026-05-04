import { useEffect, useState, useRef, useMemo } from 'react'
import {
    BookOpen, MapPin, GraduationCap,
    Pencil, Trash2, ExternalLink, ChevronDown, ChevronUp,
    CalendarDays, Lightbulb, X, Loader2, CheckCircle, SlidersHorizontal, Search,
    ChevronRight, Briefcase, Users, Upload, AlertCircle,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { insertJourneyRequest } from '../services/journeyRequestService'
import { fetchAllJourneys, deleteJourney, insertJourneyBulk } from '../services/alumniJourneyService'
import type { AlumniJourney } from '../services/alumniJourneyService'
import { EditJourneyModal } from '../components/alumni-journey/EditJourneyModal'
import { AlumniJourneyModal } from '../components/alumni-journey/AlumniJourneyModal'
import { Pagination } from '../components/qa/Pagination'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../utils/cn'

const PAGE_SIZE = 12

// ── CSV helpers ──────────────────────────────────────────────────────
function splitCSVLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes }
        else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = '' }
        else { current += ch }
    }
    fields.push(current.trim())
    return fields
}

type CsvRow = {
    name: string; college: string; branch: string; city: string;
    state: string | null; yog: string | null; nxtwave_join_date: string | null;
    program: string | null; company: string | null; company_website: string | null;
    role: string | null; ctc: string | null; placement_month: string | null;
    linkedin_url: string | null; photo_url: string | null; social_media_url: string | null;
    journey_text: string; suggestion_to_peers: string | null;
}

function parseAlumniCSV(text: string): CsvRow[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')
    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
    if (!headers.includes('name')) throw new Error('Missing required column: name')
    return lines.slice(1).filter(line => splitCSVLine(line).some(v => v)).map((line) => {
        const values = splitCSVLine(line)
        const r: Record<string, string> = {}
        headers.forEach((h, i) => { r[h] = values[i] ?? '' })
        const orNull = (v: string) => v.trim() || null
        const ctcRaw = r['ctc']?.trim() ?? ''
        const ctc = ctcRaw ? (ctcRaw.toLowerCase().includes('lpa') ? ctcRaw : `${ctcRaw} LPA`) : null
        return {
            name: r['name']?.trim() ?? '',
            college: r['college']?.trim() ?? '',
            branch: r['branch']?.trim() ?? '',
            city: r['city']?.trim() ?? '',
            state: orNull(r['state'] ?? ''),
            yog: orNull(r['yog'] ?? ''),
            nxtwave_join_date: orNull(r['nxtwave_join_date'] ?? ''),
            program: orNull(r['program'] ?? ''),
            company: orNull(r['company'] ?? ''),
            company_website: orNull(r['company_website'] ?? ''),
            role: orNull(r['role'] ?? ''),
            ctc,
            placement_month: orNull(r['placement_month'] ?? ''),
            linkedin_url: orNull(r['linkedin_url'] ?? ''),
            photo_url: orNull(r['photo_url'] ?? ''),
            social_media_url: orNull(r['social_media_url'] ?? ''),
            journey_text: r['journey_text']?.trim() ?? '',
            suggestion_to_peers: orNull(r['suggestion_to_peers'] ?? ''),
        }
    })
}

function parseCtcValue(ctc: string | null): number | null {
    if (!ctc) return null
    const match = ctc.match(/[\d.]+/)
    if (!match) return null
    return parseFloat(match[0])
}

function formatJoinDate(dateStr: string): string {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        let year = parseInt(parts[2], 10)
        if (year < 100) year += 2000
        const date = new Date(year, month, day)
        if (!isNaN(date.getTime())) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const suffix = [1, 21, 31].includes(day) ? 'st' : [2, 22].includes(day) ? 'nd' : [3, 23].includes(day) ? 'rd' : 'th'
            return `${day}${suffix} ${months[date.getMonth()]}, ${date.getFullYear()}`
        }
    }
    return dateStr
}

const CTC_BUCKETS = [
    { label: 'Under 3 LPA', value: 'lt3' },
    { label: '3 – 5 LPA', value: '3to5' },
    { label: '5 – 8 LPA', value: '5to8' },
    { label: '8 – 12 LPA', value: '8to12' },
    { label: '12+ LPA', value: 'gt12' },
]

function ctcMatchesBucket(ctc: string | null, bucket: string): boolean {
    const val = parseCtcValue(ctc)
    if (val === null) return false
    if (bucket === 'lt3') return val < 3
    if (bucket === '3to5') return val >= 3 && val < 5
    if (bucket === '5to8') return val >= 5 && val < 8
    if (bucket === '8to12') return val >= 8 && val < 12
    if (bucket === 'gt12') return val >= 12
    return true
}

// ── Journey Request Modal ─────────────────────────────────────────────
function JourneyRequestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [name, setName] = useState('')
    const [mobile, setMobile] = useState('')
    const [request, setRequest] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mobileRef = useRef<HTMLInputElement>(null)

    const reset = () => { setName(''); setMobile(''); setRequest(''); setSubmitted(false); setError(null) }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
            setError('Please enter a valid 10-digit mobile number.')
            mobileRef.current?.focus()
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await insertJourneyRequest({ name: name.trim(), mobile: mobile.trim(), request: request.trim() })
        } finally {
            setSubmitting(false)
            setSubmitted(true)
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) { onClose(); reset() } }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md focus:outline-none animate-in zoom-in-95 fade-in duration-200">
                    <Dialog.Title className="sr-only">Submit your request</Dialog.Title>
                    <Dialog.Description className="sr-only">Request an alumni journey</Dialog.Description>
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                            <div>
                                <h2 className="text-base font-bold text-surface-900">Submit your request</h2>
                                <p className="text-xs text-surface-500 mt-0.5">Request an alumni journey</p>
                            </div>
                            <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors">
                                <X className="w-4 h-4" />
                            </Dialog.Close>
                        </div>

                        {submitted ? (
                            <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
                                <CheckCircle className="w-12 h-12 text-emerald-500" />
                                <p className="text-lg font-bold text-surface-900">Thanks for your Request!</p>
                                <p className="text-sm text-surface-500">Every week New Alumni Journeys will be added here.</p>
                                <button onClick={() => { onClose(); reset() }} className="mt-2 flex items-center justify-center px-6 py-2 border border-blue-200 bg-white text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm">Close</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-surface-600 mb-1">Name</label>
                                    <input required className="input-field" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-600 mb-1">Registered Mobile Number</label>
                                    <input
                                        ref={mobileRef}
                                        required maxLength={10} inputMode="numeric" pattern="\d{10}"
                                        className="input-field"
                                        placeholder="Enter your 10-digit mobile number"
                                        value={mobile}
                                        onChange={e => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(null) }}
                                    />
                                    {mobile && mobile.length !== 10 && (
                                        <p className="text-xs text-red-500 mt-1">Enter a valid 10-digit mobile number</p>
                                    )}
                                    <p className="text-[11px] text-surface-400 mt-1">It should be a 10-digit number and your registered mobile number</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-600 mb-1">What kind of Alumni journey you would like to see here?</label>
                                    <textarea
                                        required rows={3} className="input-field resize-none"
                                        placeholder="e.g. Someone from Tier 3 college who cracked FAANG..."
                                        value={request} onChange={e => setRequest(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-xs text-red-500">{error}</p>}
                                <div className="flex justify-end gap-3 pt-1">
                                    <Dialog.Close className="btn-secondary">Cancel</Dialog.Close>
                                    <button
                                        type="submit" disabled={submitting}
                                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

// ── Journey Detail Popup ──────────────────────────────────────────────
function JourneyDetailModal({ journey, onClose }: { journey: AlumniJourney | null; onClose: () => void }) {
    const [expanded, setExpanded] = useState(false)
    const [expandedTakeaways, setExpandedTakeaways] = useState(false)

    const takeaways = journey ? [
        ...(journey.suggestion_to_peers ? journey.suggestion_to_peers.split('\n').map(s => s.trim()).filter(Boolean) : []),
    ] : []

    return (
        <Dialog.Root open={!!journey} onOpenChange={open => { if (!open) { onClose(); setExpanded(false); setExpandedTakeaways(false) } }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-2xl flex flex-col focus:outline-none animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in duration-200 sm:p-4">
                    <Dialog.Title className="sr-only">{journey?.name} Journey</Dialog.Title>
                    <Dialog.Description className="sr-only">Alumni journey details</Dialog.Description>

                    {journey && (
                        <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[88vh] sm:max-h-[calc(90vh-2rem)]">
                            {/* Modal Header */}
                            <div className="p-4 sm:p-8 pb-4 sm:pb-5 border-b border-slate-50 relative shrink-0">
                                <Dialog.Close className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </Dialog.Close>

                                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                                    {/* Photo */}
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] overflow-hidden shadow-lg ring-4 ring-blue-50 shrink-0">
                                        {journey.photo_url ? (
                                            <img src={journey.photo_url} alt={journey.name} className="w-full h-full object-cover object-top"
                                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                        ) : (
                                            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                                <span className="text-2xl font-black text-white">{journey.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{journey.name}</h2>
                                            {journey.ctc && (
                                                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-100">
                                                    {journey.ctc.replace(/(\s*LPA)+$/i, '')} LPA
                                                </span>
                                            )}
                                        </div>

                                        {(journey.role || journey.company) && (
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">
                                                {journey.role}{journey.company && ` @ ${journey.company}`}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 gap-y-1.5">
                                            {(journey.college || journey.yog || journey.branch) && (
                                                <div className="flex items-start gap-1.5 text-xs text-slate-400 font-medium">
                                                    <GraduationCap className="w-3.5 h-3.5 text-blue-300 shrink-0 mt-0.5" />
                                                    <span>{[journey.branch, journey.college, journey.yog && `Class of ${journey.yog}`].filter(Boolean).join(' · ')}</span>
                                                </div>
                                            )}
                                            {(journey.city || journey.state) && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                                                    <span>{[journey.city, journey.state].filter(Boolean).join(', ')}</span>
                                                </div>
                                            )}
                                            {(journey.program || journey.nxtwave_join_date) && (
                                                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
                                                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{[journey.program, journey.nxtwave_join_date ? `NxtWave since ${formatJoinDate(journey.nxtwave_join_date)}` : null].filter(Boolean).join(' · ')}</span>
                                                </div>
                                            )}
                                            {journey.company_website && (
                                                <div className="flex items-center gap-1.5">
                                                    <a href={journey.company_website.startsWith('http') ? journey.company_website : `https://${journey.company_website}`}
                                                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                                        className="text-xs text-blue-500 hover:underline truncate">
                                                        {journey.company_website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/30">
                                {journey.journey_text && (
                                    <section>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3 flex items-center gap-2">
                                            <span className="w-4 h-px bg-blue-200" /> The Journey
                                        </h4>
                                        <p className={cn('text-sm text-slate-600 leading-relaxed font-medium', expanded ? '' : 'line-clamp-4')}>
                                            "{journey.journey_text}"
                                        </p>
                                        {journey.journey_text.length > 200 && (
                                            <button
                                                onClick={() => setExpanded(e => !e)}
                                                className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors"
                                            >
                                                {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
                                            </button>
                                        )}
                                    </section>
                                )}

                                {takeaways.length > 0 && (
                                    <div className="bg-blue-900 rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] -translate-y-16 translate-x-16 opacity-30 pointer-events-none" />
                                        <div className="flex items-center gap-2 text-blue-300 text-[10px] font-bold uppercase tracking-widest relative z-10 mb-3">
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            <span>Key Advice to Juniors</span>
                                        </div>
                                        <ul className="space-y-2 relative z-10">
                                            {(expandedTakeaways ? takeaways : takeaways.slice(0, 3)).map((t, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs font-semibold text-blue-100/80">
                                                    <span className="text-emerald-400 font-black shrink-0">•</span> {t}
                                                </li>
                                            ))}
                                        </ul>
                                        {takeaways.length > 3 && (
                                            <button
                                                onClick={() => setExpandedTakeaways(e => !e)}
                                                className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-white transition-colors relative z-10"
                                            >
                                                {expandedTakeaways ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> +{takeaways.length - 3} more</>}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 sm:px-8 py-4 border-t border-slate-50 flex justify-between items-center bg-white shrink-0">
                                {journey.linkedin_url ? (
                                    <a
                                        href={journey.linkedin_url.startsWith('http') ? journey.linkedin_url : `https://${journey.linkedin_url}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> LinkedIn Profile
                                    </a>
                                ) : <span />}
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Verified on NxtWave</p>
                            </div>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

// ── Journey Card ──────────────────────────────────────────────────────
function JourneyCard({
    journey, isAdmin, isDeleting, onEdit, onDelete, onView,
}: {
    journey: AlumniJourney
    isAdmin: boolean
    isDeleting: boolean
    onEdit: () => void
    onDelete: () => void
    onView: () => void
}) {
    return (
        <div
            className="group bg-white border border-blue-50 rounded-3xl p-6 transition-all hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100/50 cursor-pointer relative overflow-hidden"
            onClick={onView}
        >
            {/* CTC badge — top right */}
            {journey.ctc && (
                <div className="absolute top-5 right-5 z-10">
                    <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-200/60 group-hover:bg-emerald-600 transition-colors">
                        {journey.ctc.replace(/(\s*LPA)+$/i, '')} LPA
                    </span>
                </div>
            )}

            {/* Admin buttons */}
            {isAdmin && (
                <div className="absolute top-5 left-5 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); onEdit() }}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-100 text-slate-400 hover:text-blue-600 transition-colors shadow-sm" title="Edit">
                        <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete() }} disabled={isDeleting}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-100 text-slate-400 hover:text-red-500 transition-colors shadow-sm disabled:opacity-50" title="Delete">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                {/* Avatar with briefcase badge */}
                <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl ring-4 ring-white group-hover:scale-105 transition-transform duration-500">
                        {journey.photo_url ? (
                            <img src={journey.photo_url} alt={journey.name} className="w-full h-full object-cover object-top"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                <span className="text-3xl font-black text-white">{journey.name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                        <Briefcase className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Name */}
                <h3 className="text-base font-black text-slate-800 group-hover:text-blue-900 transition-colors leading-tight mb-1">
                    {journey.name}
                </h3>

                {/* Role */}
                {journey.role && (
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{journey.role}</p>
                )}

                {/* Company */}
                {journey.company && (
                    <p className="text-sm font-black text-blue-600 mb-1">@ {journey.company}</p>
                )}

                {/* Company website */}
                {journey.company_website && (
                    <a href={journey.company_website.startsWith('http') ? journey.company_website : `https://${journey.company_website}`}
                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-600 hover:underline transition-colors mb-1">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {journey.company_website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                )}

                {/* Bottom row */}
                <div className="w-full mt-4 pt-4 border-t border-slate-50 group-hover:border-blue-100 transition-colors flex items-center justify-between">
                    <div className="text-left">
                        {journey.placement_month ? (
                            <>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Placed</p>
                                <p className="text-xs font-black text-slate-600">{journey.placement_month}</p>
                            </>
                        ) : (journey.yog || journey.branch) ? (
                            <>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                    {journey.yog ? 'YOG' : 'Branch'}
                                </p>
                                <p className="text-xs font-black text-slate-600">
                                    {[journey.yog, journey.branch].filter(Boolean).join(' · ')}
                                </p>
                            </>
                        ) : null}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-600 transition-colors flex items-center gap-0.5">
                        View Journey <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        </div>
    )
}

// ── Searchable Select ─────────────────────────────────────────────────
function SearchableSelect({ label, value, onChange, options, fullWidth }: {
    label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[]
    fullWidth?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [openLeft, setOpenLeft] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const active = value !== ''

    const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options

    const handleOpen = () => {
        if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setOpenLeft(rect.left + 224 > window.innerWidth - 16)
        }
        setOpen(o => !o)
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQuery('') }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className={cn('relative', fullWidth && 'w-full')} ref={containerRef}>
            <button
                onClick={handleOpen}
                className={cn(
                    'appearance-none flex items-center gap-1.5 pl-3 pr-8 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer outline-none shadow-sm',
                    fullWidth && 'w-full',
                    active ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-600 border-blue-100 hover:border-blue-300'
                )}
            >
                <Search className="w-3 h-3 shrink-0" />
                {active ? options.find(o => o.value === value)?.label ?? label : label}
            </button>
            <ChevronDown className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none', active ? 'text-white/70' : 'text-slate-400')} />

            {open && (
                <div className={`absolute z-50 top-full mt-1 ${openLeft ? 'right-0' : 'left-0'} w-56 sm:w-64 bg-white border border-blue-100 rounded-xl shadow-lg overflow-hidden`}>
                    <div className="p-2 border-b border-slate-50">
                        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <button onClick={() => { onChange(''); setOpen(false); setQuery('') }}
                            className={cn('w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors', !active && 'font-bold text-blue-600')}>
                            All {label}s
                        </button>
                        {filtered.map(o => (
                            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
                                className={cn('w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors truncate', value === o.value && 'font-bold text-blue-600 bg-blue-50')}>
                                {o.label}
                            </button>
                        ))}
                        {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No matches</p>}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────
export function AlumniJourneyPage() {
    const { role } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const journeyOnly = searchParams.get('withJourney') === 'true'
    const [allJourneys, setAllJourneys] = useState<AlumniJourney[]>([])
    const [loading, setLoading] = useState(true)
    const [editingJourney, setEditingJourney] = useState<AlumniJourney | null>(null)
    const [viewingJourney, setViewingJourney] = useState<AlumniJourney | null>(null)
    const [addJourneyOpen, setAddJourneyOpen] = useState(false)
    const [requestOpen, setRequestOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [page, setPage] = useState(0)

    const [filters, setFilters] = useState({ state: '', yog: '', branch: '', ctc: '', program: '', college: '', company: '', month: '' })
    const [filtersOpen, setFiltersOpen] = useState(false)

    const [showCsvUpload, setShowCsvUpload] = useState(false)
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvParsed, setCsvParsed] = useState<CsvRow[] | null>(null)
    const [csvError, setCsvError] = useState<string | null>(null)
    const [csvUploading, setCsvUploading] = useState(false)
    const csvFileRef = useRef<HTMLInputElement>(null)

    const handleCsvSelect = (file: File) => {
        setCsvFile(file); setCsvParsed(null); setCsvError(null)
        const reader = new FileReader()
        reader.onload = (e) => {
            try { setCsvParsed(parseAlumniCSV(e.target?.result as string)) }
            catch (err) { setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV') }
        }
        reader.readAsText(file)
    }

    const handleCsvUpload = async () => {
        if (!csvParsed || csvParsed.length === 0) return
        setCsvUploading(true)
        try {
            await insertJourneyBulk(csvParsed)
            await loadAll()
            setShowCsvUpload(false); setCsvFile(null); setCsvParsed(null); setCsvError(null)
        } catch (err) {
            setCsvError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setCsvUploading(false)
        }
    }

    const loadAll = async () => {
        setLoading(true)
        try { setAllJourneys(await fetchAllJourneys()) }
        catch (err) { console.error('Failed to load journeys:', err) }
        finally { setLoading(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this journey? This cannot be undone.')) return
        setDeletingId(id)
        try { await deleteJourney(id); await loadAll() }
        catch (err) { console.error('Delete failed:', err) }
        finally { setDeletingId(null) }
    }

    useEffect(() => {
        loadAll()
        const handler = () => { setPage(0); loadAll() }
        window.addEventListener('journey-added', handler)
        return () => window.removeEventListener('journey-added', handler)
    }, [])

    const filterOptions = useMemo(() => {
        const unique = <T,>(arr: (T | null | undefined)[]): T[] => [...new Set(arr.filter((v): v is T => !!v))].sort()
        const monthScore = (m: string): number => {
            const mths: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
            const p = m.trim().split(/[\s']+/)
            let yr = parseInt(p[1] ?? '0') || 0
            if (yr > 0 && yr < 100) yr += 2000
            return yr * 100 + (mths[p[0]?.toLowerCase().slice(0, 3)] ?? 0)
        }
        const uniqueMonths = [...new Set(allJourneys.map(j => j.placement_month).filter((v): v is string => !!v))]
            .sort((a, b) => monthScore(b) - monthScore(a))
        return {
            states: unique(allJourneys.map(j => j.state)).map(v => ({ label: v, value: v })),
            yogs: unique(allJourneys.map(j => j.yog)).reverse().map(v => ({ label: v, value: v })),
            branches: unique(allJourneys.map(j => j.branch)).map(v => ({ label: v, value: v })),
            programs: unique(allJourneys.map(j => j.program)).map(v => ({ label: v, value: v })),
            colleges: unique(allJourneys.map(j => j.college)).map(v => ({ label: v, value: v })),
            companies: unique(allJourneys.map(j => j.company)).map(v => ({ label: v, value: v })),
            months: uniqueMonths.map(v => ({ label: v, value: v })),
        }
    }, [allJourneys])

    const filteredJourneys = useMemo(() => {
        let result = allJourneys
        if (journeyOnly) result = result.filter(j => j.journey_text?.trim())
        if (filters.state) result = result.filter(j => j.state === filters.state)
        if (filters.yog) result = result.filter(j => j.yog === filters.yog)
        if (filters.branch) result = result.filter(j => j.branch === filters.branch)
        if (filters.program) result = result.filter(j => j.program === filters.program)
        if (filters.college) result = result.filter(j => j.college === filters.college)
        if (filters.company) result = result.filter(j => j.company === filters.company)
        if (filters.ctc) result = result.filter(j => ctcMatchesBucket(j.ctc, filters.ctc))
        if (filters.month) result = result.filter(j => j.placement_month === filters.month)
        // Parse "Mar 2025" or "March'26" → sortable number (yyyymm)
        const monthScore = (m: string | null): number => {
            if (!m) return 0
            const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
            const parts = m.trim().split(/[\s']+/)
            const mon = months[parts[0]?.toLowerCase().slice(0, 3)] ?? 0
            let yr = parseInt(parts[1] ?? '0') || 0
            if (yr > 0 && yr < 100) yr += 2000
            return yr * 100 + mon
        }
        const allScores = result.map(j => monthScore(j.placement_month))
        const latestScore = Math.max(...allScores, 0)

        return [...result].sort((a, b) => {
            const aScore = monthScore(a.placement_month), bScore = monthScore(b.placement_month)
            // 1. Latest month first
            const aLatest = aScore === latestScore && latestScore > 0
            const bLatest = bScore === latestScore && latestScore > 0
            if (aLatest && !bLatest) return -1
            if (!aLatest && bLatest) return 1
            // 2. Among same tier, newer months above older
            if (aScore !== bScore) return bScore - aScore
            // 3. With journey text above those without
            const aHas = !!(a.journey_text?.trim()), bHas = !!(b.journey_text?.trim())
            if (aHas && !bHas) return -1
            if (!aHas && bHas) return 1
            // 4. Higher CTC above lower
            const aCtc = parseCtcValue(a.ctc) ?? 0, bCtc = parseCtcValue(b.ctc) ?? 0
            if (bCtc !== aCtc) return bCtc - aCtc
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }, [allJourneys, filters, journeyOnly])

    const latestMonth = useMemo(() => {
        const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
        const score = (m: string | null) => {
            if (!m) return 0
            const p = m.trim().split(/[\s']+/)
            let yr = parseInt(p[1] ?? '0') || 0
            if (yr > 0 && yr < 100) yr += 2000
            return yr * 100 + (months[p[0]?.toLowerCase().slice(0, 3)] ?? 0)
        }
        const best = allJourneys.reduce<string | null>((acc, j) => {
            if (!j.placement_month) return acc
            return !acc || score(j.placement_month) > score(acc) ? j.placement_month : acc
        }, null)
        return best
    }, [allJourneys])

    const totalCount = filteredJourneys.length
    const pageJourneys = filteredJourneys.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const setFilter = (key: keyof typeof filters) => (value: string) => { setFilters(f => ({ ...f, [key]: value })); setPage(0) }
    const clearFilters = () => { setFilters({ state: '', yog: '', branch: '', ctc: '', program: '', college: '', company: '', month: '' }); setPage(0) }

    return (
        <div className="animate-fade-in">
            {/* Page header */}
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <Users size={16} strokeWidth={3} />
                            <span>Academy Alumni Network</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Students Who Made It —{' '}
                            <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Their Real Placement Journeys</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            Here are a few journeys from <span className="text-blue-600 font-bold">1000+ placed students</span> who cracked roles at top companies.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                        {latestMonth && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
                                <CalendarDays className="w-3.5 h-3.5" />
                                Latest: {latestMonth}
                            </div>
                        )}
                        <div className="flex flex-wrap justify-end gap-2">
                            <button onClick={() => setRequestOpen(true)} className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm">
                                🙋 Request a Journey
                            </button>
                            {role === 'admin' && (
                                <button
                                    onClick={() => { if (journeyOnly) { searchParams.delete('withJourney') } else { searchParams.set('withJourney', 'true') } setSearchParams(searchParams); setPage(0) }}
                                    className={cn('flex items-center gap-2 border px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm',
                                        journeyOnly ? 'bg-blue-900 text-white border-blue-900' : 'border-blue-200 bg-white text-blue-900 hover:bg-blue-50 hover:border-blue-300')}
                                >
                                    With Journey
                                </button>
                            )}
                            {role === 'admin' && (
                                <button onClick={() => setShowCsvUpload(v => !v)} className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm">
                                    <Upload size={16} />
                                    Upload CSV
                                </button>
                            )}
                            {role === 'admin' && (
                                <button onClick={() => setAddJourneyOpen(true)} className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm">
                                    <BookOpen size={16} />
                                    Add Journey
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </header>

            {/* CSV Upload Panel */}
            {role === 'admin' && showCsvUpload && (
                <div className="mb-6 p-5 bg-white border border-blue-100 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Bulk Upload Alumni CSV</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Expected headers: <code className="bg-slate-100 px-1 rounded text-slate-600">name, college, branch, city, state, yog, nxtwave_join_date, program, company, company_website, role, ctc, placement_month, linkedin_url, photo_url, social_media_url, journey_text, suggestion_to_peers</code>
                            </p>
                        </div>
                        <button onClick={() => { setShowCsvUpload(false); setCsvFile(null); setCsvParsed(null); setCsvError(null) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors shrink-0 ml-4">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <input ref={csvFileRef} type="file" accept=".csv" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleCsvSelect(e.target.files[0]) }} />
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => csvFileRef.current?.click()} className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all">
                            <Upload className="w-3.5 h-3.5" /> {csvFile ? csvFile.name : 'Choose File'}
                        </button>
                        {csvParsed && (
                            <button onClick={handleCsvUpload} disabled={csvUploading} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
                                {csvUploading
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                                    : <><Upload className="w-3.5 h-3.5" /> Import {csvParsed.length} rows</>
                                }
                            </button>
                        )}
                    </div>
                    {csvParsed && !csvError && (
                        <p className="text-xs text-emerald-600 mt-2 font-medium">Parsed {csvParsed.length} alumni records ready to import.</p>
                    )}
                    {csvError && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {csvError}
                        </div>
                    )}
                </div>
            )}

            {/* Admin stats */}
            {role === 'admin' && !loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Alumni', value: allJourneys.length, color: 'text-slate-800' },
                        { label: 'With Journey', value: allJourneys.filter(j => j.journey_text?.trim()).length, color: 'text-emerald-600' },
                        { label: 'No Journey', value: allJourneys.filter(j => !j.journey_text?.trim()).length, color: 'text-red-500' },
                        { label: 'Journey Coverage', value: `${allJourneys.length > 0 ? Math.round((allJourneys.filter(j => j.journey_text?.trim()).length / allJourneys.length) * 100) : 0}%`, color: 'text-slate-800' },
                    ].map(s => (
                        <div key={s.label} className="p-6 bg-white border border-blue-100 rounded-2xl">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter trigger row */}
            {!loading && allJourneys.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <button
                        onClick={() => setFiltersOpen(true)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all shadow-md shrink-0',
                            activeFilterCount > 0
                                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-200'
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filter & Search
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none">{activeFilterCount}</span>
                        )}
                    </button>

                    {/* Active filter chips */}
                    {filters.state && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{filters.state}<button onClick={() => setFilter('state')('')}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.yog && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">YOG {filters.yog}<button onClick={() => setFilter('yog')('')}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.branch && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{filters.branch}<button onClick={() => setFilter('branch')('')}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.college && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full max-w-[160px] truncate">{filters.college}<button onClick={() => setFilter('college')('')} className="shrink-0"><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.company && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full max-w-[160px] truncate">{filters.company}<button onClick={() => setFilter('company')('')} className="shrink-0"><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.ctc && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{CTC_BUCKETS.find(b => b.value === filters.ctc)?.label}<button onClick={() => setFilter('ctc')('')}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.program && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{filters.program}<button onClick={() => setFilter('program')('')}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {filters.month && <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{filters.month}<button onClick={() => setFilter('month')('')}><X className="w-3 h-3 text-blue-400 hover:text-blue-700" /></button></span>}
                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-xs text-red-500 font-bold hover:text-red-600 transition-colors shrink-0">Clear all</button>
                    )}

                    <span className="text-xs text-slate-400 font-medium ml-auto shrink-0">
                        {totalCount} result{totalCount !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Filter slide-out panel */}
            {filtersOpen && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" onClick={() => setFiltersOpen(false)} />
                    <div className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-600 shrink-0 bg-blue-600">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wide">Filter Journeys</h3>
                                <p className="text-[10px] text-blue-200 font-medium mt-0.5">{totalCount} result{totalCount !== 1 ? 's' : ''} match</p>
                            </div>
                            <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">State</p>
                                <SearchableSelect label="All States" value={filters.state} onChange={setFilter('state')} options={filterOptions.states} fullWidth />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Year of Graduation</p>
                                <SearchableSelect label="All Years" value={filters.yog} onChange={setFilter('yog')} options={filterOptions.yogs} fullWidth />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Branch</p>
                                <SearchableSelect label="All Branches" value={filters.branch} onChange={setFilter('branch')} options={filterOptions.branches} fullWidth />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">College</p>
                                <SearchableSelect label="All Colleges" value={filters.college} onChange={setFilter('college')} options={filterOptions.colleges} fullWidth />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Company</p>
                                <SearchableSelect label="All Companies" value={filters.company} onChange={setFilter('company')} options={filterOptions.companies} fullWidth />
                            </div>
                            {filterOptions.months.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Placement Month</p>
                                    <SearchableSelect label="All Months" value={filters.month} onChange={setFilter('month')} options={filterOptions.months} fullWidth />
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Package</p>
                                <div className="flex flex-wrap gap-2">
                                    {CTC_BUCKETS.map(b => (
                                        <button
                                            key={b.value}
                                            onClick={() => setFilter('ctc')(filters.ctc === b.value ? '' : b.value)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                                filters.ctc === b.value
                                                    ? 'bg-blue-900 text-white border-blue-900'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                            )}
                                        >
                                            {b.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {filterOptions.programs.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Program</p>
                                    <div className="flex flex-wrap gap-2">
                                        {filterOptions.programs.map(p => (
                                            <button
                                                key={p.value}
                                                onClick={() => setFilter('program')(filters.program === p.value ? '' : p.value)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                                    filters.program === p.value
                                                        ? 'bg-blue-900 text-white border-blue-900'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                                <button
                                    onClick={() => { clearFilters(); setFiltersOpen(false) }}
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" /> Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-[320px] rounded-3xl bg-surface-100 animate-pulse" />)}
                </div>
            ) : filteredJourneys.length === 0 ? (
                <div className="text-center py-20">
                    <BookOpen className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                    {activeFilterCount > 0 ? (
                        <>
                            <p className="text-surface-500 mb-2">No journeys match the selected filters.</p>
                            <button onClick={clearFilters} className="text-sm text-blue-500 hover:text-blue-600 font-semibold transition-colors">Clear filters</button>
                        </>
                    ) : (
                        <>
                            <p className="text-surface-500 mb-2">No journeys shared yet.</p>
                            <p className="text-sm text-surface-400">Check back soon for inspiring alumni stories!</p>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pageJourneys.map((journey) => (
                            <JourneyCard
                                key={journey.id} journey={journey}
                                isAdmin={role === 'admin'} isDeleting={deletingId === journey.id}
                                onEdit={() => setEditingJourney(journey)}
                                onDelete={() => handleDelete(journey.id)}
                                onView={() => setViewingJourney(journey)}
                            />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={Math.ceil(totalCount / PAGE_SIZE)} onPageChange={setPage} />
                </>
            )}

            <JourneyDetailModal journey={viewingJourney} onClose={() => setViewingJourney(null)} />
            <JourneyRequestModal isOpen={requestOpen} onClose={() => setRequestOpen(false)} />
            <EditJourneyModal journey={editingJourney} onClose={() => setEditingJourney(null)} onUpdated={loadAll} />
            <AlumniJourneyModal isOpen={addJourneyOpen} onClose={() => setAddJourneyOpen(false)} />
        </div>
    )
}
