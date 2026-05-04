import { useState, useEffect } from 'react'
import { MessageSquare, FileText, BookOpen, GraduationCap, ClipboardList, BookMarked } from 'lucide-react'
import { fetchDashboardStats, fetchStudentLoginCount, fetchCWCPeriodStats } from '../../services/analyticsService'
import type { DashboardStats, CWCPeriodStats } from '../../services/analyticsService'
import { useAuth } from '../../contexts/AuthContext'

export function StatsOverview() {
    const { role } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loginCount, setLoginCount] = useState<number | null>(null)
    const [cwcPeriod, setCwcPeriod] = useState<CWCPeriodStats | null>(null)

    useEffect(() => {
        fetchDashboardStats().then(setStats).catch(console.error)
        if (role === 'admin') {
            fetchStudentLoginCount().then(setLoginCount).catch(console.error)
            fetchCWCPeriodStats().then(setCwcPeriod).catch(console.error)
        }
    }, [role])

    const cards = [
        { label: 'Transcripts', value: stats?.transcripts_analysed ?? '—', icon: FileText, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
        { label: 'Q&A Pairs', value: stats?.total_qa_pairs ?? '—', icon: MessageSquare, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { label: 'Categories', value: stats?.categories_covered ?? '—', icon: BookOpen, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
        ...(role === 'admin' ? [
            { label: 'Journey Requests', value: stats?.journey_requests ?? '—', icon: BookMarked, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
            { label: 'Student Logins', value: loginCount ?? '—', icon: GraduationCap, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
        ] : []),
    ]

    const cwcCurrent = cwcPeriod?.current ?? null
    const cwcPrevious = cwcPeriod?.previous ?? null

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                <div key={label} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="mb-4">
                        <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">{value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</p>
                </div>
            ))}

            {/* CWC Registrations — special card with prev session badge */}
            {role === 'admin' && (
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-4 h-4" />
                        </div>
                        {cwcPrevious !== null && cwcPrevious > 0 && (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
                                Was {cwcPrevious}
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">{cwcCurrent ?? '—'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">CWC Registrations</p>
                </div>
            )}
        </div>
    )
}
