import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TrendingUp, Users, MessageCircle, Brain,
    ArrowRight, MessageSquareHeart, ChevronRight,
    Zap, ClipboardList, CalendarDays, Clock, Info,
} from 'lucide-react'
import { FeedbackModal } from '../../student-cta/FeedbackModal'
import { CWCModal } from '../../student-cta/CWCModal'
import { playBubbleSound } from '../../../utils/sounds'
import { supabase } from '../../../config/supabase'
import { fetchSessionDate, fetchSessionDetails } from '../../../services/cwcService'
import { CompanyLogo } from '../../ui/CompanyLogo'

export function StudentHomepage() {
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [cwcOpen, setCwcOpen] = useState(false)
    const [sessionDate, setSessionDate] = useState<string>('')
    const [sessionDetails, setSessionDetails] = useState<string>('')
    const [companies, setCompanies] = useState<string[]>([])
    const [previousMonthAlumniCount, setPreviousMonthAlumniCount] = useState(0)
    const [previousMonthLabel, setPreviousMonthLabel] = useState('')
    const navigate = useNavigate()

    const go = (path: string) => {
        playBubbleSound()
        setTimeout(() => navigate(path), 180)
    }

    useEffect(() => {
        Promise.all([
            fetchSessionDate().catch(() => 'TBD'),
            fetchSessionDetails().catch(() => ''),
        ]).then(([date, details]) => {
            setSessionDate(date)
            setSessionDetails(details)
        })
    }, [])

    useEffect(() => {
        supabase
            .from('placement_opportunities')
            .select('company_name')
            .then(({ data }) => {
                if (data) {
                    const unique = [...new Set(data.map((r: { company_name: string }) => r.company_name))]
                    setCompanies(unique)
                }
            })
    }, [])

    useEffect(() => {
        const monthScore = (value: string | null): number => {
            if (!value) return 0
            const months: Record<string, number> = {
                jan: 1, january: 1,
                feb: 2, february: 2,
                mar: 3, march: 3,
                apr: 4, april: 4,
                may: 5,
                jun: 6, june: 6,
                jul: 7, july: 7,
                aug: 8, august: 8,
                sep: 9, sept: 9, september: 9,
                oct: 10, october: 10,
                nov: 11, november: 11,
                dec: 12, december: 12,
            }
            const parts = value.trim().split(/[\s']+/)
            const monthKey = parts[0]?.toLowerCase()
            const month = months[monthKey] ?? months[monthKey?.slice(0, 3)] ?? 0
            let year = parseInt(parts[1] ?? '0', 10) || 0
            if (year > 0 && year < 100) year += 2000
            return year * 100 + month
        }

        supabase
            .from('alumni_journeys')
            .select('placement_month')
            .then(({ data }) => {
                const rows = (data ?? []) as unknown as { placement_month: string | null }[]
                const validMonths = rows.map(row => row.placement_month).filter((month): month is string => !!month?.trim())
                // Find the latest month in actual data
                const latestMonth = validMonths.reduce<string | null>((best, m) =>
                    !best || monthScore(m) > monthScore(best) ? m : best, null)
                if (!latestMonth) return
                const latestScore = monthScore(latestMonth)
                setPreviousMonthLabel(latestMonth)
                setPreviousMonthAlumniCount(validMonths.filter(m => monthScore(m) === latestScore).length)
            })
    }, [])

    return (
        <div className="flex flex-col gap-2 lg:h-[calc(100vh-3rem)] lg:overflow-hidden animate-fade-in">
            <style>{`
                @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-ticker { animation: ticker-scroll 250s linear infinite; }
            `}</style>

            {/* ── Hero ── */}
            <section className="bg-[#0b4b8c] rounded-2xl px-6 py-6 text-white relative overflow-hidden shadow-lg shadow-blue-900/20 shrink-0">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-blue-200 font-bold tracking-widest text-[10px] uppercase mb-1.5">
                            <Zap size={14} strokeWidth={3} />
                            <span>Placement Intelligence Hub</span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-light leading-tight tracking-tight mb-1">
                            Your Placement{' '}
                            <span className="font-bold text-white underline decoration-blue-400 underline-offset-4">Success Starts Here</span>
                        </h1>
                        <p className="text-blue-100/70 text-xs sm:text-sm font-medium leading-relaxed italic">
                            Data-driven blueprints used by <span className="text-white font-bold">1,000+ academy students</span> to secure high-value placements.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5 self-start sm:self-auto shrink-0">
                        <button
                            onClick={() => setFeedbackOpen(true)}
                            className="flex items-center gap-2 bg-white text-[#0b4b8c] px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:bg-blue-50 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <MessageSquareHeart size={13} />
                            Provide Feedback
                        </button>
                        <button
                            onClick={() => setCwcOpen(true)}
                            className="flex items-center gap-2 bg-white text-[#0b4b8c] px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:bg-blue-50 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <ClipboardList size={13} />
                            CWC Registration
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Ticker ── */}
            <div className="bg-white border border-blue-100 rounded-xl py-2 overflow-hidden relative shadow-sm shrink-0">
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                <div className="flex items-center gap-6 w-max animate-ticker px-8">
                    {[...companies, ...companies].map((name, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <CompanyLogo companyName={name} size="lg" />
                            <span className="text-xs font-black text-slate-700 whitespace-nowrap">{name}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200 ml-2" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Navigation grid ── */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:grid-rows-[4fr_3fr]">

                {/* Academy Hiring Pulse++ — wide card */}
                <div
                    onClick={() => go('/hiring-pulse')}
                    className="lg:col-span-2 group relative bg-white border border-blue-100 rounded-2xl overflow-hidden hover:border-[#0b4b8c] hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row shadow-sm h-full"
                >
                    <div className="w-full h-32 md:w-2/5 md:h-auto overflow-hidden shrink-0">
                        <img src="/Students-1.jpg" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Pulse" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-lg">
                                    <TrendingUp size={15} strokeWidth={3} />
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Academy Hiring Pulse++</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-3">Real-time mapping of skills companies are actually hiring for this month.</p>
                        </div>
                        <ul className="space-y-2">
                            {['Recently hired students', 'Market skill demand', 'Live JD analysis'].map(t => (
                                <li key={t} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0b4b8c]/20 group-hover:bg-[#0b4b8c] transition-colors shrink-0" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center gap-2 text-[#0b4b8c] font-black text-xs uppercase tracking-widest mt-3 group-hover:gap-3 transition-all">
                            Explore <ArrowRight size={12} />
                        </div>
                    </div>
                </div>

                {/* Academy Alumni */}
                <div
                    onClick={() => go('/alumni-journey')}
                    className="group bg-white border border-blue-100 rounded-2xl hover:border-[#0b4b8c] hover:shadow-xl transition-all cursor-pointer shadow-sm relative flex flex-col h-full"
                >
                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-lg">
                                        <Users size={14} />
                                    </div>
                                    <h3 className="text-base font-black text-slate-800 tracking-tight">Academy Alumni</h3>
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Real Stories</span>
                            </div>

                            {/* Placement stat box */}
                            <div className="flex-1 rounded-xl bg-[#dbeafe]/50 border border-blue-100 p-3 flex flex-col justify-center gap-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0b4b8c]/60">
                                    Placements in {previousMonthLabel || '—'}
                                </p>
                                <div className="flex items-end gap-1.5">
                                    <span className="text-3xl font-black leading-none text-[#0b4b8c]">
                                        {previousMonthAlumniCount > 0 ? previousMonthAlumniCount : '—'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500 mb-0.5">students placed</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 leading-tight">
                                    Stories, companies & packages inside →
                                </p>
                            </div>

                            <button className="w-full py-2 bg-[#0b4b8c] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-blue-100 group-hover:scale-[1.02] transition-all shrink-0">
                                Browse Profiles
                            </button>
                        </div>
                </div>

                {/* Placement Doubts */}
                <div
                    onClick={() => go('/qa')}
                    className="group bg-white border border-blue-100 rounded-2xl p-3 hover:border-[#0b4b8c] hover:shadow-xl transition-all cursor-pointer shadow-sm flex flex-col h-full"
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-lg">
                            <MessageCircle size={15} />
                        </div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Placement Doubts</h3>
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed mb-auto">
                        Direct answers to critical questions asked by students during actual alumni meets.
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Real Alumni Advice</span>
                        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#0b4b8c] group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>

                {/* Interview Intelligence */}
                <div
                    onClick={() => go('/interview-intelligence')}
                    className="group bg-white border border-blue-100 rounded-2xl p-3 hover:border-[#0b4b8c] hover:shadow-xl transition-all cursor-pointer shadow-sm flex flex-col h-full"
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-lg">
                            <Brain size={15} />
                        </div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Interview Intelligence</h3>
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed mb-auto">
                        Know what companies are asking before you enter the room. Patterns and self-intro guides.
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Verified Patterns</span>
                        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#0b4b8c] group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>

                {/* CWC Session Info */}
                <div
                    onClick={() => setCwcOpen(true)}
                    className="group bg-[#dbeafe] border border-blue-100 rounded-2xl p-4 hover:border-[#0b4b8c] hover:shadow-xl transition-all cursor-pointer shadow-sm flex flex-col gap-3 relative overflow-hidden h-full"
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#0b4b8c]/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#0b4b8c] text-white rounded-lg">
                                <ClipboardList size={14} />
                            </div>
                            <h4 className="text-[10px] font-black text-[#0b4b8c] uppercase tracking-widest leading-none">Next CWC Session</h4>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Live Q&A</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <h5 className="text-base font-black text-slate-800 leading-tight">
                            {sessionDetails || 'Ask your placement questions directly to alumni.'}
                        </h5>

                        {sessionDate && (() => {
                            const atIdx = sessionDate.indexOf(' at ')
                            const timeMatch = sessionDate.match(/(\d{1,2}:\d{2}\s*(AM|PM|am|pm)?(\s*IST|\s*UTC)?)/i)
                            const datePart = atIdx !== -1
                                ? sessionDate.slice(0, atIdx).trim()
                                : timeMatch
                                    ? sessionDate.slice(0, timeMatch.index).trim().replace(/,\s*$/, '')
                                    : sessionDate
                            const timePart = atIdx !== -1
                                ? sessionDate.slice(atIdx + 4).trim()
                                : timeMatch ? timeMatch[0] : ''
                            return (
                                <div className="flex flex-wrap gap-3 pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarDays size={13} className="text-[#0b4b8c]" />
                                        <span className="text-xs font-bold text-slate-600">{datePart}</span>
                                    </div>
                                    {timePart && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={13} className="text-[#0b4b8c]" />
                                            <span className="text-xs font-bold text-slate-600">{timePart}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        <div className="p-2.5 bg-white/60 rounded-xl border border-blue-100/50 flex gap-2 items-start">
                            <Info size={13} className="text-[#0b4b8c] mt-0.5 shrink-0" />
                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                                Register now to ask your question directly to NxtWave alumni in this live session.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#0b4b8c] uppercase tracking-widest">Register Now</span>
                        <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center text-[#0b4b8c] group-hover:bg-[#0b4b8c] group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </div>

            </div>

            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            <CWCModal isOpen={cwcOpen} onClose={() => setCwcOpen(false)} />
        </div>
    )
}
