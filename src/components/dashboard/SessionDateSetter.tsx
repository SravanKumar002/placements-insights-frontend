import { useState, useEffect } from 'react'
import { Calendar, Loader2, CheckCircle, Save } from 'lucide-react'
import { fetchSessionDate, updateSessionDate, fetchSessionDetails } from '../../services/cwcService'

/** Format YYYY-MM-DD + HH:MM → "March 15, 2026 at 10:30 AM" */
function buildDisplay(isoDate: string, isoTime: string): string {
    if (!isoDate) return ''
    const d = new Date(isoDate + 'T00:00:00')
    if (isNaN(d.getTime())) return ''
    const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!isoTime) return datePart
    const [h, m] = isoTime.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    const timePart = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
    return `${datePart} at ${timePart}`
}

/** Extract YYYY-MM-DD from a stored display value like "March 15, 2026 at 10:30 AM" */
function extractISODate(val: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    const datePart = val.replace(/ at .+$/, '')
    const d = new Date(datePart)
    if (isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${day}`
}

/** Extract HH:MM (24h) from a stored display value like "March 15, 2026 at 10:30 AM" */
function extractISOTime(val: string): string {
    const match = val.match(/at (\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return ''
    let h = parseInt(match[1])
    const m = match[2]
    const ampm = match[3].toUpperCase()
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
}

export function SessionDateSetter() {
    const [isoDate, setIsoDate] = useState('')
    const [isoTime, setIsoTime] = useState('')
    const [displayDate, setDisplayDate] = useState('')
    const [details, setDetails] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSessionDate().then(val => {
            setDisplayDate(val)
            setIsoDate(extractISODate(val))
            setIsoTime(extractISOTime(val))
        }).catch(console.error)
        fetchSessionDetails().then(setDetails).catch(console.error)
    }, [])

    const handleSave = async () => {
        if (!isoDate) return setError('Please select a date')
        const display = buildDisplay(isoDate, isoTime)
        setSaving(true)
        setError(null)
        try {
            await updateSessionDate(display, details)
            setDisplayDate(display)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-blue-900 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
                <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                    <Calendar className="text-blue-300 w-5 h-5" /> CWC Scheduler
                </h3>
                <p className="text-blue-200 text-[11px] mb-5 font-medium">Control the upcoming session broadcast date & time.</p>

                <div className="space-y-4 mb-6">
                    {/* Live Display */}
                    <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Live Display</p>
                        {saving ? (
                            <span className="flex items-center justify-center gap-2 text-blue-200 text-sm">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                            </span>
                        ) : saved ? (
                            <span className="flex items-center justify-center gap-2 text-emerald-300 text-sm">
                                <CheckCircle className="w-3.5 h-3.5" /> Saved
                            </span>
                        ) : (
                            <p className="text-sm font-black">{displayDate || 'No date set'}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Date</label>
                            <input
                                type="date"
                                value={isoDate}
                                onChange={e => setIsoDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:bg-white focus:text-slate-900 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Time</label>
                            <input
                                type="time"
                                value={isoTime}
                                onChange={e => setIsoTime(e.target.value)}
                                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:bg-white focus:text-slate-900 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-blue-300 uppercase tracking-widest ml-1">Call Details</label>
                        <textarea
                            rows={3}
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            placeholder="Brief details about this call…"
                            className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:bg-white focus:text-slate-900 focus:placeholder-slate-300 outline-none transition-colors resize-none"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || !isoDate}
                    className="w-full py-3 bg-blue-500 hover:bg-white hover:text-blue-900 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Syncing…' : 'Sync to Dashboard'}
                </button>

                {error && <p className="text-xs text-rose-300 mt-2">{error}</p>}
            </div>
        </div>
    )
}
