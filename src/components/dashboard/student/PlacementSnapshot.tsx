import { useState, useEffect } from 'react'
import { Users, MessageSquare, Building2, Mic } from 'lucide-react'
import { fetchDashboardStats } from '../../../services/analyticsService'
import type { DashboardStats } from '../../../services/analyticsService'

interface PlacementSnapshotProps {
    onCardClick?: (index: number) => void
}

export function PlacementSnapshot({ onCardClick }: PlacementSnapshotProps) {
    const [stats, setStats] = useState<DashboardStats | null>(null)

    useEffect(() => {
        fetchDashboardStats().then(setStats).catch(console.error)
    }, [])

    const cards = [
        { label: 'Placement Companies', value: stats?.total_companies ?? '—', icon: Building2, iconBg: 'bg-brand-100', iconColor: 'text-brand-500', gradient: 'from-brand-50 to-brand-100/50', border: 'border-brand-200', hoverBorder: 'hover:border-brand-400', shadow: 'hover:shadow-brand-300/50' },
        { label: 'Alumni Placed', value: stats?.total_alumni ?? '—', icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-purple-500', gradient: 'from-purple-50 to-purple-100/50', border: 'border-purple-200', hoverBorder: 'hover:border-purple-400', shadow: 'hover:shadow-purple-300/50' },
        { label: 'Questions Answered', value: stats?.total_qa_pairs ?? '—', icon: MessageSquare, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500', gradient: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', shadow: 'hover:shadow-emerald-300/50' },
        { label: 'Interview Experiences', value: stats?.total_calls ?? '—', icon: Mic, iconBg: 'bg-amber-100', iconColor: 'text-amber-500', gradient: 'from-amber-50 to-amber-100/50', border: 'border-amber-200', hoverBorder: 'hover:border-amber-400', shadow: 'hover:shadow-amber-300/50' },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map(({ label, value, icon: Icon, iconBg, iconColor, gradient, border, hoverBorder, shadow }, idx) => (
                <div
                    key={label}
                    onClick={() => onCardClick?.(idx)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-br ${gradient} border ${border} ${hoverBorder} ${shadow} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${onCardClick ? 'cursor-pointer' : ''}`}
                >
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xl font-extrabold text-surface-800 leading-none">{value}</p>
                        <p className="text-xs font-medium text-surface-500 mt-0.5 truncate">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
