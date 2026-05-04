import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { fetchDailyLoginCounts, type DailyLoginCount } from '../../services/analyticsService'

interface WeekBucket {
    label: string
    count: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function rangeLabel(startDate: string, endDate: string): string {
    const s = new Date(startDate + 'T00:00:00')
    const e = new Date(endDate + 'T00:00:00')
    if (startDate === endDate) return `${MONTHS[s.getMonth()]} ${s.getDate()}`
    if (s.getMonth() === e.getMonth()) return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}`
    return `${MONTHS[s.getMonth()]} ${s.getDate()}–${MONTHS[e.getMonth()]} ${e.getDate()}`
}

function buildWeeks(days: DailyLoginCount[]): WeekBucket[] {
    if (days.length === 0) return []
    const weeks: WeekBucket[] = []
    let i = 0
    const firstDow = new Date(days[0].date + 'T00:00:00').getDay()
    let weekEnd = Math.min(firstDow === 0 ? 1 : 8 - firstDow, days.length)
    let count = 0
    for (let j = i; j < weekEnd; j++) count += days[j].count
    weeks.push({ label: rangeLabel(days[i].date, days[weekEnd - 1].date), count })
    i = weekEnd
    while (i < days.length) {
        const end = Math.min(i + 7, days.length)
        count = 0
        for (let j = i; j < end; j++) count += days[j].count
        weeks.push({ label: rangeLabel(days[i].date, days[end - 1].date), count })
        i = end
    }
    return weeks
}

const BAR_HEIGHT = 140

export function WeeklyLoginsChart() {
    const [data, setData] = useState<DailyLoginCount[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDailyLoginCounts()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const weeks = buildWeeks(data)
    const totalLogins = weeks.reduce((s, w) => s + w.count, 0)
    const maxCount = Math.max(...weeks.map(w => w.count), 1)

    if (loading) {
        return <div className="bg-blue-50/60 backdrop-blur-xl rounded-[2rem] border border-blue-100 shadow-md shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/60 transition-shadow duration-200 h-full animate-pulse" />
    }

    return (
        <div className="bg-blue-50/60 backdrop-blur-xl rounded-[2rem] border border-blue-100 shadow-md shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/60 transition-shadow duration-200 p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 shrink-0">
                    <CalendarDays className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-800 tracking-tight">Weekly Student Logins</h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Since Mar 14 · <span className="font-bold text-violet-600">{totalLogins.toLocaleString()}</span> total logins
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 flex items-end justify-start gap-[6px] overflow-x-auto pb-1" style={{ minHeight: BAR_HEIGHT + 50 }}>
                {weeks.map(week => {
                    const barH = maxCount > 0 ? Math.max((week.count / maxCount) * BAR_HEIGHT, 4) : 4
                    return (
                        <div
                            key={week.label}
                            className="w-[60px] shrink-0 flex flex-col items-center justify-end h-full group"
                        >
                            <span className="text-xs font-bold text-slate-600 mb-1 tabular-nums">
                                {week.count.toLocaleString()}
                            </span>
                            <div
                                className="w-[70%] rounded-t-sm bg-violet-400 opacity-80 group-hover:opacity-100 group-hover:bg-violet-500 transition-all duration-200"
                                style={{ height: barH }}
                                title={`${week.label}: ${week.count.toLocaleString()} logins`}
                            />
                            <span className="text-[9px] text-slate-400 mt-2 text-center leading-tight whitespace-nowrap">
                                {week.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
