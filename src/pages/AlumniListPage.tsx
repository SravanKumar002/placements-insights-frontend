import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, GraduationCap, MapPin, Pencil, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { fetchAlumniPaginated } from '../services/alumniService'
import type { AlumniProfile } from '../services/alumniService'
import { AlumniEditModal } from '../components/alumni/AlumniEditModal'
import { AlumniAvatar } from '../components/alumni/AlumniAvatar'
import { ADMIN_ALUMNI_PATH } from '../config/constants'
import { Pagination } from '../components/qa/Pagination'

const PAGE_SIZE = 10

export function AlumniListPage() {
    const [alumni, setAlumni] = useState<Omit<AlumniProfile, 'contributions' | 'transcript_text'>[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [editingAlumni, setEditingAlumni] = useState<Omit<AlumniProfile, 'contributions' | 'transcript_text'> | null>(null)
    const [page, setPage] = useState(0)
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

    const loadPage = async (p: number) => {
        setLoading(true)
        try {
            const { alumni: data, totalCount: total } = await fetchAlumniPaginated(p, PAGE_SIZE)
            setAlumni(data)
            setTotalCount(total)
        } catch (err) {
            console.error('Failed to load alumni:', err)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (p: number) => {
        setPage(p)
        loadPage(p)
    }

    useEffect(() => {
        loadPage(0)
    }, [])

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-bold tracking-widest text-[10px] uppercase">
                        <Users size={16} strokeWidth={3} />
                        <span>Alumni Intelligence</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                        Alumni Interview{' '}
                        <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Experiences</span>
                    </h1>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                        <span className="text-blue-600 font-bold">{totalCount} placed alumni</span> in our knowledge base.
                    </p>
                </div>
            </header>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-52 rounded-3xl bg-blue-50/50 animate-pulse" />
                    ))}
                </div>
            ) : alumni.length === 0 ? (
                <div className="bg-white border border-blue-100 rounded-2xl p-12 text-center">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No alumni data yet. Upload transcripts to build the alumni database.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {alumni.map(a => {
                            const cardId = a.alumni_id ?? a.transcript_id
                            const isExpanded = expandedCards.has(cardId)
                            const hasProcess = a.interview_process && a.interview_process.length > 0

                            return (
                                <div
                                    key={cardId}
                                    className="group bg-white border border-blue-50 rounded-3xl p-6 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100/40 transition-all relative flex flex-col"
                                >
                                    {/* Edit button */}
                                    <button
                                        onClick={() => setEditingAlumni(a)}
                                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-[#0b4b8c] hover:bg-[#dbeafe] rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Pencil size={14} />
                                    </button>

                                    {/* Profile header */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="transition-transform group-hover:scale-105 shrink-0">
                                            <AlumniAvatar name={a.name} logoUrl={a.company_logo_url} size="md" />
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                to={`${ADMIN_ALUMNI_PATH}/${cardId}`}
                                                className="text-lg font-black text-slate-800 group-hover:text-[#0b4b8c] transition-colors truncate block"
                                            >
                                                {a.name}
                                            </Link>
                                            <div className="flex items-center gap-1.5 text-[#0b4b8c] font-bold text-[10px] uppercase tracking-wider mt-0.5">
                                                <Building2 size={12} />
                                                <span className="truncate">{a.role} @ {a.company}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data section */}
                                    <div className="flex-1 space-y-4">
                                        {/* Package */}
                                        {a.package_lpa && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package</span>
                                                <span className="text-sm font-black text-[#0b4b8c]">{a.package_lpa} LPA</span>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {(a.college || a.branch || a.graduation_year) && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <GraduationCap size={14} className="text-blue-300 shrink-0" />
                                                    <span className="truncate">{[a.college, a.branch, a.graduation_year].filter(Boolean).join(' · ')}</span>
                                                </div>
                                            )}
                                            {a.location && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <MapPin size={14} className="text-blue-300 shrink-0" />
                                                    <span className="truncate">{a.location}</span>
                                                </div>
                                            )}
                                            {a.company_url && (
                                                <button
                                                    onClick={() => window.open(a.company_url!.startsWith('http') ? a.company_url! : `https://${a.company_url}`, '_blank', 'noopener,noreferrer')}
                                                    className="flex items-center gap-2 text-xs text-blue-900 font-bold hover:underline"
                                                >
                                                    <ExternalLink size={14} className="shrink-0" />
                                                    <span className="truncate">{a.company_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {a.skills_tested && a.skills_tested.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {a.skills_tested.slice(0, 4).map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded bg-[#dbeafe] text-[#0b4b8c] border border-blue-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {a.skills_tested.length > 4 && (
                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-400 border border-slate-200">
                                                        +{a.skills_tested.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {a.batch && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbeafe] text-blue-900 border border-blue-100">
                                                NxtWave · {a.batch}
                                            </span>
                                        )}
                                    </div>

                                    {/* Interview Process toggle */}
                                    {hasProcess && (
                                        <div className="mt-6 pt-4 border-t border-slate-50">
                                            <button
                                                onClick={() => setExpandedCards(prev => {
                                                    const next = new Set(prev)
                                                    if (next.has(cardId)) next.delete(cardId)
                                                    else next.add(cardId)
                                                    return next
                                                })}
                                                className="w-full flex items-center justify-center gap-2 border-2 border-blue-50 bg-white text-[#0b4b8c] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#dbeafe] hover:border-blue-100 transition-all"
                                            >
                                                Process ({a.interview_process!.length} Rounds)
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-3 space-y-2">
                                                    {a.interview_process!.map((round, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-[#dbeafe] text-blue-900 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                                                {round.round}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-semibold text-slate-700">{round.title}</p>
                                                                {round.details.length > 0 && (
                                                                    <ul className="mt-0.5 space-y-0.5">
                                                                        {round.details.map((detail, j) => (
                                                                            <li key={j} className="text-[10px] text-slate-500 flex items-start gap-1">
                                                                                <span className="text-slate-300 mt-0.5">-</span>
                                                                                {detail}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

            <AlumniEditModal
                isOpen={editingAlumni !== null}
                onClose={() => setEditingAlumni(null)}
                alumni={editingAlumni ? {
                    alumni_id: editingAlumni.alumni_id!,
                    name: editingAlumni.name,
                    company: editingAlumni.company,
                    role: editingAlumni.role,
                    batch: editingAlumni.batch,
                    branch: editingAlumni.branch,
                    college: editingAlumni.college,
                    graduation_year: editingAlumni.graduation_year,
                    location: editingAlumni.location,
                    company_url: editingAlumni.company_url,
                } : null}
                onSaved={() => loadPage(page)}
            />
        </div>
    )
}
