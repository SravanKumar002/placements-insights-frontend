import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { fetchHourlyLoginCountsByDayType, getPrevCalendarWeek } from '../../services/analyticsService'

function formatFullHour(h: number): string {
    if (h === 0) return '12 AM'
    if (h === 12) return '12 PM'
    return h < 12 ? `${h} AM` : `${h - 12} PM`
}

interface Peak { hour: number; count: number }

export function PeakActivityInsight() {
    const [weekday, setWeekday] = useState<Peak | null>(null)
    const [weekend, setWeekend] = useState<Peak | null>(null)
    const { weekLabel } = getPrevCalendarWeek()

    useEffect(() => {
        fetchHourlyLoginCountsByDayType()
            .then(data => {
                const peakOf = (type: 'weekday' | 'weekend') => {
                    const rows = data.filter(d => d.dayType === type && d.count > 0)
                    return rows.length === 0 ? null : rows.reduce((best, d) => d.count > best.count ? d : best)
                }
                setWeekday(peakOf('weekday'))
                setWeekend(peakOf('weekend'))
            })
            .catch(() => {})
    }, [])

    if (!weekday && !weekend) return null

    return (
        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex gap-4">
            <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
                <h5 className="text-xs font-black text-indigo-900 mb-1.5">Peak Activity</h5>
                {weekday && (
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                        <span className="font-black">Weekdays:</span>{' '}
                        <span className="font-black text-indigo-900">{weekday.count.toLocaleString()} logins</span>
                        {' '}({formatFullHour(weekday.hour)} spike)
                    </p>
                )}
                {weekend && (
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                        <span className="font-black">Weekends:</span>{' '}
                        <span className="font-black text-indigo-900">{weekend.count.toLocaleString()} logins</span>
                        {' '}({formatFullHour(weekend.hour)} spike)
                    </p>
                )}
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest pt-1.5">
                    {weekLabel} · IST
                </p>
            </div>
        </div>
    )
}
