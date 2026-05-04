import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
    fetchCWCSessionHistory,
    fetchCWCPeriodStats,
    type CWCSessionHistoryPoint,
} from '../../services/analyticsService'
import { fetchSessionDate } from '../../services/cwcService'

const MONTHS: Record<string, string> = {
    January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
    May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
    September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
}

function abbreviateLabel(label: string): string {
    const match = label.match(/^(\w+)\s+(\d+)/)
    if (!match) return label.slice(0, 6)
    return `${MONTHS[match[1]] ?? match[1].slice(0, 3)} ${match[2]}`
}

interface ChartPoint {
    label: string
    count: number
    isCurrent: boolean
}

const W = 320
const H = 130
const PAD_L = 28
const PAD_R = 12
const PAD_T = 18
const PAD_B = 28
const CHART_W = W - PAD_L - PAD_R
const CHART_H = H - PAD_T - PAD_B

export function CWCRegistrationsTrendChart() {
    const [points, setPoints] = useState<ChartPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null)

    useEffect(() => {
        async function load() {
            const [history, currentPeriod, sessionLabel] = await Promise.all([
                fetchCWCSessionHistory().catch(() => [] as CWCSessionHistoryPoint[]),
                fetchCWCPeriodStats().catch(() => ({ current: 0, previous: 0 })),
                fetchSessionDate().catch(() => 'TBD'),
            ])

            const pts: ChartPoint[] = history.map(h => ({
                label: abbreviateLabel(h.session_label),
                count: h.registration_count,
                isCurrent: false,
            }))

            pts.push({
                label: sessionLabel !== 'TBD' ? abbreviateLabel(sessionLabel) : 'Current',
                count: currentPeriod.current,
                isCurrent: true,
            })

            setPoints(pts)
            setLoading(false)
        }
        load()
    }, [])

    const maxVal = Math.max(...points.map(p => p.count), 1)
    const toX = (i: number) =>
        PAD_L + (points.length > 1 ? (i / (points.length - 1)) * CHART_W : CHART_W / 2)
    const toY = (v: number) => PAD_T + CHART_H - (v / maxVal) * CHART_H

    const pathD = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.count).toFixed(1)}`)
        .join(' ')

    const areaD =
        points.length > 0
            ? `${pathD} L${toX(points.length - 1).toFixed(1)},${(PAD_T + CHART_H).toFixed(1)} L${toX(0).toFixed(1)},${(PAD_T + CHART_H).toFixed(1)} Z`
            : ''

    const yTicks = [0, Math.round(maxVal / 2), maxVal]

    if (loading) {
        return <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm animate-pulse" style={{ minHeight: '250px' }} />
    }

    if (points.length <= 1) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 border-dashed flex flex-col items-center justify-center text-center" style={{ minHeight: '250px' }}>
                <TrendingUp className="w-8 h-8 text-slate-300 mb-4" />
                <h4 className="text-sm font-black text-slate-800">No Historical Data</h4>
                <p className="text-[11px] text-slate-400 mt-2 max-w-[200px]">Next CWC session pending data calculation.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
                    <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-800 tracking-tight">CWC Session Trend</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Registrations per weekly session</p>
                </div>
            </div>

            <div className="flex-1 relative" onMouseLeave={() => setTooltip(null)}>
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Y axis grid lines + labels */}
                        {yTicks.map((tick, i) => (
                            <g key={i}>
                                <line
                                    x1={PAD_L} y1={toY(tick)}
                                    x2={W - PAD_R} y2={toY(tick)}
                                    stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3"
                                />
                                <text
                                    x={PAD_L - 4} y={toY(tick) + 3}
                                    textAnchor="end" fontSize="7" fill="#94a3b8"
                                >
                                    {tick}
                                </text>
                            </g>
                        ))}

                        {/* Area fill */}
                        <path d={areaD} fill="rgba(245,158,11,0.12)" />

                        {/* Line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points + hover targets */}
                        {points.map((p, i) => (
                            <g key={i}>
                                <circle
                                    cx={toX(i)} cy={toY(p.count)}
                                    r={p.isCurrent ? 4.5 : 3.5}
                                    fill={p.isCurrent ? '#f59e0b' : 'white'}
                                    stroke={p.isCurrent ? '#d97706' : '#f59e0b'}
                                    strokeWidth={p.isCurrent ? 2 : 1.5}
                                />
                                {/* Invisible larger hit area for tooltip */}
                                <circle
                                    cx={toX(i)} cy={toY(p.count)} r={10}
                                    fill="transparent"
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={() => setTooltip({ x: toX(i), y: toY(p.count), label: p.label, count: p.count })}
                                />
                                {/* X axis label */}
                                <text
                                    x={toX(i)} y={H - 4}
                                    textAnchor="middle" fontSize="7"
                                    fill={p.isCurrent ? '#d97706' : '#94a3b8'}
                                    fontWeight={p.isCurrent ? 'bold' : 'normal'}
                                >
                                    {p.label}
                                </text>
                            </g>
                        ))}

                        {/* Tooltip */}
                        {tooltip && (() => {
                            const tx = Math.min(Math.max(tooltip.x, 30), W - 50)
                            const ty = tooltip.y > PAD_T + 30 ? tooltip.y - 32 : tooltip.y + 14
                            return (
                                <g>
                                    <rect
                                        x={tx - 24} y={ty - 10}
                                        width={48} height={20}
                                        rx="4" fill="#1e293b" opacity={0.9}
                                    />
                                    <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
                                        {tooltip.label}: {tooltip.count}
                                    </text>
                                </g>
                            )
                        })()}
                    </svg>
                </div>
        </div>
    )
}
