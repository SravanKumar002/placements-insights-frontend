import { useEffect, useState } from 'react'
import { GraduationCap, TrendingDown, TrendingUp } from 'lucide-react'
import { fetchDailyLoginCounts, type DailyLoginCount } from '../../services/analyticsService'

type LoginView = 'fortnight' | 'monthly' | 'yearly'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr + 'T00:00:00')
    return d.getDay() === 0 || d.getDay() === 6
}

function getDateLabel(dateStr: string): { day: string; month: string } {
    const d = new Date(dateStr + 'T00:00:00')
    return { day: d.getDate().toString(), month: MONTH_NAMES[d.getMonth()] }
}

function getMonthYearLabel(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getYearLabel(dateStr: string): string {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').getFullYear().toString()
}

function getMonthlyData(data: DailyLoginCount[]): { label: string; count: number }[] {
    if (data.length === 0) return []
    const latestMonth = data.at(-1)!.date.slice(0, 7)
    const monthData = data.filter(d => d.date.startsWith(latestMonth))
    const weekMap = new Map<number, number>()
    for (const d of monthData) {
        const day = new Date(d.date + 'T00:00:00').getDate()
        const week = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4
        weekMap.set(week, (weekMap.get(week) ?? 0) + d.count)
    }
    return [1, 2, 3, 4]
        .filter(w => weekMap.has(w))
        .map(w => ({ label: `WK${w}`, count: weekMap.get(w)! }))
}

function getYearlyData(data: DailyLoginCount[]): { label: string; count: number; hasData: boolean }[] {
    const latestYear = data.length > 0
        ? new Date(data.at(-1)!.date + 'T00:00:00').getFullYear()
        : new Date().getFullYear()
    const monthMap = new Map<number, number>()
    for (const d of data) {
        const date = new Date(d.date + 'T00:00:00')
        if (date.getFullYear() === latestYear) {
            const m = date.getMonth()
            monthMap.set(m, (monthMap.get(m) ?? 0) + d.count)
        }
    }
    return MONTH_NAMES.map((label, i) => ({
        label,
        count: monthMap.get(i) ?? 0,
        hasData: monthMap.has(i),
    }))
}

export function DailyLoginsChart() {
    const [data, setData] = useState<DailyLoginCount[]>([])
    const [loading, setLoading] = useState(true)
    const [loginView, setLoginView] = useState<LoginView>('fortnight')

    useEffect(() => {
        fetchDailyLoginCounts()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const recent = data.slice(-14)
    const maxCount = Math.max(...recent.map(d => d.count), 1)
    const weekdays = recent.filter(d => !isWeekend(d.date))
    const lastWeekday = weekdays.at(-1)
    const isLow = lastWeekday ? lastWeekday.count < maxCount * 0.5 : false

    const monthlyData = getMonthlyData(data)
    const monthMaxCount = Math.max(...monthlyData.map(w => w.count), 1)
    const peakWeek = monthlyData.reduce((max, w) => w.count > max.count ? w : max, monthlyData[0] ?? { label: '', count: 0 })
    const currentWeek = monthlyData.at(-1)
    const weekDeclinePct = currentWeek && peakWeek && currentWeek.label !== peakWeek.label
        ? Math.round(((peakWeek.count - currentWeek.count) / peakWeek.count) * 100)
        : 0

    const yearlyData = getYearlyData(data)
    const yearMaxCount = Math.max(...yearlyData.filter(m => m.hasData).map(m => m.count), 1)
    const peakMonth = yearlyData.filter(m => m.hasData).reduce((max, m) => m.count > max.count ? m : max, { label: '', count: 0 })

    const latestDate = data.at(-1)?.date ?? ''
    const monthLabel = getMonthYearLabel(latestDate)
    const yearLabel = getYearLabel(latestDate)

    const subtitle = loginView === 'yearly'
        ? `Activity Trends${yearLabel ? `: ${yearLabel}` : ''}`
        : `Activity Trends${monthLabel ? `: ${monthLabel}` : ''}`

    if (loading) {
        return <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm h-64 animate-pulse" />
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-8 border border-slate-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6 sm:mb-8">
                <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <GraduationCap className="text-blue-600 w-5 h-5" /> Login Velocity
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
                </div>
                {/* View Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                    {(['fortnight', 'monthly', 'yearly'] as LoginView[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setLoginView(v)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all ${
                                loginView === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {v === 'fortnight' ? '14 Days' : v === 'monthly' ? 'Monthly' : 'Yearly'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fortnight View */}
            {loginView === 'fortnight' && (
                <div className="overflow-x-auto -mx-1 px-1">
                    <div className="pt-7 min-w-[280px]">
                    <div className="h-40 flex items-end justify-between gap-1">
                        {recent.map(day => {
                            const isPeak = day.count === maxCount
                            const weekend = isWeekend(day.date)
                            const pct = (day.count / maxCount) * 100
                            const label = getDateLabel(day.date)
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shadow-sm">
                                            {day.count} visits
                                        </span>
                                    </div>
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${
                                            isPeak
                                                ? 'bg-blue-600 shadow-lg shadow-blue-100'
                                                : weekend
                                                    ? 'bg-slate-100'
                                                    : 'bg-blue-100 group-hover:bg-blue-500'
                                        }`}
                                        style={{ height: `${pct}%` }}
                                    />
                                    <div className="mt-3 flex flex-col items-center shrink-0">
                                        <span className="text-[8px] font-black text-slate-800">{label.day}</span>
                                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">{label.month}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    </div>
                </div>
            )}

            {/* Monthly View — Mon–Sun weeks */}
            {loginView === 'monthly' && (
                <div className="h-48 flex items-end justify-center gap-4 px-4">
                    {monthlyData.map(w => (
                        <div key={w.label} className="w-16 flex flex-col items-center group relative h-full justify-end">
                            <span className="text-xs font-black text-blue-600 mb-3 tabular-nums">{w.count.toLocaleString()}</span>
                            <div
                                className="w-full rounded-t-2xl bg-blue-600/10 group-hover:bg-blue-600 transition-all duration-700 relative overflow-hidden"
                                style={{ height: `${(w.count / monthMaxCount) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
                            </div>
                            <span className="text-[10px] mt-4 font-black text-slate-400 uppercase tracking-widest">{w.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Yearly View — all 12 months, data months highlighted */}
            {loginView === 'yearly' && (
                <div className="h-48 flex items-end justify-between gap-1 px-1">
                    {yearlyData.map(m => {
                        const isPeak = m.hasData && m.label === peakMonth.label
                        const barPct = m.hasData ? Math.max((m.count / yearMaxCount) * 100, 4) : 0
                        return (
                            <div key={m.label} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                {m.hasData && (
                                    <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shadow-sm">
                                            {m.count.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {m.hasData ? (
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-700 relative overflow-hidden ${
                                            isPeak
                                                ? 'bg-blue-600 shadow-lg shadow-blue-100'
                                                : 'bg-blue-200 group-hover:bg-blue-500'
                                        }`}
                                        style={{ height: `${barPct}%` }}
                                    />
                                ) : (
                                    <div className="w-full rounded-t-sm bg-slate-100" style={{ height: '4px' }} />
                                )}
                                <span className={`text-[7px] mt-2 font-black uppercase tracking-tighter shrink-0 ${
                                    m.hasData ? (isPeak ? 'text-blue-600' : 'text-slate-500') : 'text-slate-300'
                                }`}>
                                    {m.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Insight Footer */}
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                {loginView === 'fortnight' && (
                    <>
                        {isLow
                            ? <TrendingDown className="text-rose-400 shrink-0 w-[18px] h-[18px] mt-0.5" />
                            : <TrendingUp className="text-emerald-500 shrink-0 w-[18px] h-[18px] mt-0.5" />
                        }
                        <p className="text-[11px] leading-relaxed text-slate-500 italic">
                            <span className="text-slate-800 font-bold not-italic">SWD Insight: </span>
                            {isLow
                                ? <>Current weekday activity (<span className="text-slate-800 font-black">{lastWeekday?.count}</span>) is significantly lower than the 14-day peak of <span className="text-slate-800 font-black">{maxCount.toLocaleString()}</span>.</>
                                : <>Platform reached a 14-day peak of <span className="text-slate-800 font-black">{maxCount.toLocaleString()}</span> visits. Engagement is strong.</>
                            }
                        </p>
                    </>
                )}
                {loginView === 'monthly' && (
                    <>
                        <TrendingDown className="text-rose-400 shrink-0 w-[18px] h-[18px] mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-slate-500 italic">
                            <span className="text-slate-800 font-bold not-italic">SWD Insight: </span>
                            Monthly distribution shows <span className="text-slate-800 font-black">{peakWeek.label}</span> as the engagement anchor.
                            {weekDeclinePct > 0 && currentWeek
                                ? <> Current <span className="text-slate-800 font-black">{currentWeek.label}</span> volume represents a <span className="text-rose-500 font-bold">{weekDeclinePct}% decline</span> from the previous peak.</>
                                : <> Engagement is holding steady across the month.</>
                            }
                        </p>
                    </>
                )}
                {loginView === 'yearly' && (
                    <>
                        <TrendingUp className="text-emerald-500 shrink-0 w-[18px] h-[18px] mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-slate-500 italic">
                            <span className="text-slate-800 font-bold not-italic">SWD Insight: </span>
                            <span className="text-slate-800 font-black">{peakMonth.label}</span> recorded the highest visit volume at <span className="text-slate-800 font-black">{peakMonth.count.toLocaleString()}</span> visits across {yearlyData.length} tracked month{yearlyData.length !== 1 ? 's' : ''}.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
