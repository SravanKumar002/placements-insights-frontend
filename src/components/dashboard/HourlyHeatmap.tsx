import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { fetchHourlyLoginCounts, type HourlyLoginCount } from '../../services/analyticsService'

function formatHour(h: number): string {
    if (h === 0) return '12A'
    if (h === 12) return '12P'
    return h < 12 ? `${h}A` : `${h - 12}P`
}

function getColorClass(count: number, max: number): string {
    if (max === 0 || count === 0) return 'bg-slate-100'
    const r = count / max
    if (r < 0.15) return 'bg-indigo-100'
    if (r < 0.35) return 'bg-indigo-200'
    if (r < 0.55) return 'bg-indigo-400'
    if (r < 0.75) return 'bg-indigo-600'
    return 'bg-indigo-800'
}

function getTextClass(count: number, max: number): string {
    if (max === 0 || count === 0) return 'text-slate-300'
    const r = count / max
    return r >= 0.35 ? 'text-white' : 'text-indigo-700'
}

export function HourlyHeatmap() {
    const [data, setData] = useState<HourlyLoginCount[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHourlyLoginCounts()
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm h-28 animate-pulse" />
    }

    const max = Math.max(...data.map(d => d.count), 1)
    const total = data.reduce((s, d) => s + d.count, 0)
    const peakHour = data.reduce((best, d) => d.count > best.count ? d : best, data[0])

    return (
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Clock className="text-indigo-500 w-[18px] h-[18px]" />
                    Login Pulse by Hour
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">IST</span>
                </h3>
                <div className="text-right">
                    <span className="text-xs font-black text-slate-700 tabular-nums">{total.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">logins</span>
                </div>
            </div>

            {/* Peak insight */}
            {total > 0 && (
                <div className="mb-4 px-3 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                        Peak activity at{' '}
                        <span className="font-black text-indigo-700">
                            {peakHour.hour === 0 ? '12 AM' : peakHour.hour === 12 ? '12 PM' : peakHour.hour < 12 ? `${peakHour.hour} AM` : `${peakHour.hour - 12} PM`}
                        </span>
                        {' '}IST with{' '}
                        <span className="font-black text-slate-800">{peakHour.count}</span> logins — last 30 days.
                    </p>
                </div>
            )}

            {/* Heatmap: 24 cells in 2 rows of 12 */}
            <div className="grid grid-cols-12 gap-1">
                {data.map(({ hour, count }) => (
                    <div key={hour} className="flex flex-col items-center gap-0.5">
                        <div
                            className={`w-full aspect-square rounded-lg ${getColorClass(count, max)} flex items-center justify-center cursor-default transition-transform hover:scale-110`}
                            title={`${hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}: ${count} login${count !== 1 ? 's' : ''}`}
                        >
                            <span className={`text-[8px] font-black ${getTextClass(count, max)} leading-none select-none`}>
                                {count > 0 ? count : ''}
                            </span>
                        </div>
                        <span className="text-[7px] font-bold text-slate-400 tabular-nums leading-none">{formatHour(hour)}</span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-slate-400 mr-0.5">Low</span>
                    {['bg-slate-100', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600', 'bg-indigo-800'].map((c, i) => (
                        <div key={i} className={`w-3 h-3 rounded ${c}`} />
                    ))}
                    <span className="text-[8px] font-bold text-slate-400 ml-0.5">High</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Last 30 days</span>
            </div>
        </div>
    )
}
