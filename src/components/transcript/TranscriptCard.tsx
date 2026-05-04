import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, Loader2, Building2, GraduationCap, ExternalLink, MessageSquareText } from 'lucide-react'
import type { Transcript } from '../../types'
import { formatDate, formatRelative } from '../../utils/formatDate'
import { ADMIN_TRANSCRIPTS_PATH } from '../../config/constants'

interface TranscriptCardProps {
    transcript: Transcript
}


export function TranscriptCard({ transcript: t }: TranscriptCardProps) {
    const allAlumni = t.alumni && t.alumni.length > 0 ? t.alumni : [{ alumni_name: t.alumni_name, company: t.company, role: t.role }]
    const combinedName = allAlumni.map(a => a.alumni_name).join(' / ')
    const combinedInitials = allAlumni.map(a => a.alumni_name.charAt(0)).join('')
    const combinedCompanies = [...new Set(allAlumni.map(a => a.company))].join(' / ')

    return (
        <div className="group bg-white border border-blue-50 rounded-2xl p-5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50 transition-all cursor-default">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Avatar + Info */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#0b4b8c] text-white flex items-center justify-center text-lg font-black shadow-lg shadow-blue-100 transition-transform group-hover:scale-105 shrink-0">
                        {combinedInitials}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-800 group-hover:text-[#0b4b8c] transition-colors truncate mb-1">
                            {combinedName}
                        </h3>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Building2 size={12} className="text-blue-300" />
                                {combinedCompanies}
                            </span>
                            {t.branch && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="flex items-center gap-1.5">
                                        <GraduationCap size={12} className="text-blue-300" />
                                        {t.branch}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metrics + Actions */}
                <div className="flex items-center gap-8 shrink-0">
                    {/* Status + Q&As */}
                    <div className="text-right">
                        {t.processing_status === 'done' ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs uppercase mb-1 justify-end">
                                <CheckCircle2 size={14} /> Completed
                            </div>
                        ) : t.processing_status === 'processing' ? (
                            <div className="flex items-center gap-1.5 text-[#0b4b8c] font-black text-xs uppercase mb-1 justify-end">
                                <Loader2 size={14} className="animate-spin" /> Analysing
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-slate-400 font-black text-xs uppercase mb-1 justify-end">
                                <Clock size={14} /> Pending
                            </div>
                        )}
                        {t.processing_status === 'done' && t.qa_count > 0 && (
                            <div className="inline-flex items-center gap-2 bg-[#dbeafe] text-[#0b4b8c] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tighter">
                                <MessageSquareText size={12} /> {t.qa_count} Extracted Q&As
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    {t.updated_at && (
                        <>
                            <div className="hidden lg:block w-px h-10 bg-slate-100" />
                            <div className="text-right min-w-[120px] hidden sm:block">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                                    <Clock size={10} /> Updated
                                </p>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{formatDate(t.updated_at)}</p>
                                <p className="text-[10px] text-slate-400">{formatRelative(t.updated_at)}</p>
                            </div>
                        </>
                    )}

                    {/* View link */}
                    <Link
                        to={`${ADMIN_TRANSCRIPTS_PATH}/${t.id}`}
                        className="p-3 bg-slate-50 text-slate-400 group-hover:bg-[#0b4b8c] group-hover:text-white rounded-xl transition-all shadow-sm"
                        title="View transcript"
                    >
                        <ExternalLink size={18} />
                    </Link>
                </div>
            </div>
        </div>
    )
}
