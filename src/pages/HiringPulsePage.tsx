import { useState, useEffect, useMemo, useRef } from 'react'
import {
    Briefcase, Plus, Trash2, Pencil, ChevronLeft, ChevronRight,
    Upload, Loader2, AlertCircle, X,
    Terminal, Database, Globe, BrainCircuit, TrendingUp, Trophy, Building2, CalendarDays,
} from 'lucide-react'
import {
    fetchOpportunities, fetchPlacedStudents,
    insertOpportunity, insertOpportunitiesBulk,
    updateOpportunity,
    insertPlacedStudent, updatePlacedStudent, deletePlacedStudent,
} from '../services/hiringPulseService'
import type { PlacementOpportunity, PlacedStudent } from '../services/hiringPulseService'
import { uploadPosterImage } from '../services/posterService'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../utils/cn'
import { CompanyLogo, extractDomain } from '../components/ui/CompanyLogo'

// ── Helpers ──────────────────────────────────────────────────────────

function formatMonth(ym: string) {
    const [y, m] = ym.split('-')
    const date = new Date(Number(y), Number(m) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const MONTH_MAP: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** Normalise dates like "14-Mar", "14-Mar-2026", "2026-03-14" → "YYYY-MM-DD" */
function normalizeDate(raw: string): string {
    const s = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

    const dmy = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})(?:[-/\s](\d{2,4}))?$/)
    if (dmy) {
        const day = dmy[1].padStart(2, '0')
        const mon = MONTH_MAP[dmy[2].toLowerCase()]
        if (!mon) throw new Error(`Unknown month abbreviation: ${dmy[2]}`)
        const year = dmy[3] ? (dmy[3].length === 2 ? '20' + dmy[3] : dmy[3]) : String(new Date().getFullYear())
        return `${year}-${mon}-${day}`
    }

    const mdy = s.match(/^([A-Za-z]{3})[-/\s](\d{1,2})(?:[,\s]+(\d{2,4}))?$/)
    if (mdy) {
        const day = mdy[2].padStart(2, '0')
        const mon = MONTH_MAP[mdy[1].toLowerCase()]
        if (!mon) throw new Error(`Unknown month abbreviation: ${mdy[1]}`)
        const year = mdy[3] ? (mdy[3].length === 2 ? '20' + mdy[3] : mdy[3]) : String(new Date().getFullYear())
        return `${year}-${mon}-${day}`
    }

    const slash = s.match(/^(\d{1,2})[/](\d{1,2})[/](\d{2,4})$/)
    if (slash) {
        const mon = slash[1].padStart(2, '0')
        const day = slash[2].padStart(2, '0')
        const year = slash[3].length === 2 ? '20' + slash[3] : slash[3]
        return `${year}-${mon}-${day}`
    }

    throw new Error(`Unrecognised date format: "${raw}". Use YYYY-MM-DD, DD-Mon, or DD-Mon-YYYY.`)
}

/** Split a CSV line respecting quoted fields */
function splitCSVLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
            else if (ch === '"') { inQuotes = false }
            else { current += ch }
        } else {
            if (ch === '"') { inQuotes = true }
            else if (ch === ',') { fields.push(current.trim()); current = '' }
            else { current += ch }
        }
    }
    fields.push(current.trim())
    return fields
}

function parseCSV(text: string): { crp_date: string; company_name: string; mandatory_skills: string | null; optional_skills: string | null; openings: number; ctc: string | null; opportunity_month: string }[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')

    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
    if (!headers.includes('crp_date')) throw new Error('Missing required column: crp_date')
    if (!headers.includes('company_name')) throw new Error('Missing required column: company_name')

    return lines.slice(1).filter(line => splitCSVLine(line).some(v => v)).map((line, i) => {
        const values = splitCSVLine(line)
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })

        if (!row.crp_date || !row.company_name) {
            throw new Error(`Row ${i + 2}: crp_date and company_name are required`)
        }

        let isoDate: string
        try {
            isoDate = normalizeDate(row.crp_date)
        } catch {
            throw new Error(`Row ${i + 2}: ${row.crp_date} — invalid date format. Use YYYY-MM-DD or DD-Mon (e.g. 14-Mar)`)
        }

        return {
            crp_date: isoDate,
            company_name: row.company_name,
            mandatory_skills: row.mandatory_skills || null,
            optional_skills: row.optional_skills || null,
            openings: row.openings ? parseInt(row.openings, 10) : 0,
            ctc: row.ctc || null,
            opportunity_month: isoDate.slice(0, 7),
        }
    })
}

// ── Shared style tokens ───────────────────────────────────────────────
const card = 'bg-white rounded-[2.5rem] border border-slate-200 shadow-sm'
const btnPrimary = 'flex items-center gap-1.5 px-5 py-2.5 border border-blue-200 bg-white text-blue-900 text-sm font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm'
const btnSecondary = 'flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 shadow-sm'

// ── Skill category definitions ────────────────────────────────────────
const SKILL_CATEGORIES = [
    { category: 'Languages',      Icon: Terminal,     keys: ['python', 'javascript', 'java', 'typescript', 'c', 'c++', 'golang', 'ruby', 'php', 'kotlin', 'swift', 'scala', 'r'] },
    { category: 'Frontend Stack', Icon: Globe,        keys: ['react', 'react js', 'html', 'css', 'bootstrap', 'tailwind', 'angular', 'vue', 'nextjs', 'next js', 'jquery', 'sass'] },
    { category: 'Backend & DB',   Icon: Database,     keys: ['sql', 'mysql', 'postgresql', 'mongodb', 'node js', 'node', 'express', 'django', 'flask', 'spring', 'rest api', 'rest apis', 'graphql', 'redis', 'firebase', 'docker', 'aws', 'git', 'linux'] },
    { category: 'AI & Emerging',  Icon: BrainCircuit, keys: ['ai/ml', 'ai', 'ml', 'machine learning', 'deep learning', 'llm', 'rag', 'langchain', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'data science', 'gen ai', 'genai'] },
]

function normalizeSkill(s: string) {
    return s.toLowerCase().trim().replace(/[\s/\-]+/g, '')
}

function skillMatchesCat(skillName: string, keys: string[]): boolean {
    const sn = normalizeSkill(skillName)
    return keys.some(k => sn === normalizeSkill(k))
}

// ── Main Page ────────────────────────────────────────────────────────

export function HiringPulsePage() {
    const { role } = useAuth()
    const isAdmin = role === 'admin'

    const [opportunities, setOpportunities] = useState<PlacementOpportunity[]>([])
    const [students, setStudents] = useState<PlacedStudent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedMonth, setSelectedMonth] = useState('')
    const [oppModalOpen, setOppModalOpen] = useState(false)
    const [studentModalOpen, setStudentModalOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [editingOpp, setEditingOpp] = useState<PlacementOpportunity | null>(null)
    const [editingStudent, setEditingStudent] = useState<PlacedStudent | null>(null)
    const [showCsvUpload, setShowCsvUpload] = useState(false)
    const [hoveredPill, setHoveredPill] = useState<string | null>(null)
    const [halfTab, setHalfTab] = useState<'1st' | '2nd' | 'full'>('full')
    const [showSkillModal, setShowSkillModal] = useState(false)

    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvParsed, setCsvParsed] = useState<ReturnType<typeof parseCSV> | null>(null)
    const [csvError, setCsvError] = useState<string | null>(null)
    const [csvUploading, setCsvUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const monthRef = useRef<HTMLInputElement>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const [opps, studs] = await Promise.all([fetchOpportunities(), fetchPlacedStudents()])
            setOpportunities(opps)
            setStudents(studs)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const availableMonths = useMemo(() => {
        const months = new Set<string>()
        for (const o of opportunities) months.add(o.opportunity_month)
        for (const s of students) months.add(s.placement_month)
        return [...months].sort((a, b) => b.localeCompare(a))
    }, [opportunities, students])

    useEffect(() => {
        if (availableMonths.length > 0 && !selectedMonth) setSelectedMonth(availableMonths[0])
    }, [availableMonths, selectedMonth])

    const filteredOpps = useMemo(() =>
        opportunities.filter(o => o.opportunity_month === selectedMonth),
        [opportunities, selectedMonth]
    )
    const filteredStudents = useMemo(() =>
        students.filter(s => s.placement_month === selectedMonth),
        [students, selectedMonth]
    )

    const postersForMonth = useMemo(() => filteredStudents.filter(s => s.photo_url), [filteredStudents])
    const hasAutoShown = useRef<string | null>(null)
    useEffect(() => {
        if (postersForMonth.length > 0 && selectedMonth && hasAutoShown.current !== selectedMonth) {
            hasAutoShown.current = selectedMonth
            setLightboxIndex(0)
        }
    }, [postersForMonth, selectedMonth])

    const stats = useMemo(() => {
        const companies = new Set(filteredOpps.map(o => o.company_name))
        const totalOpenings = filteredOpps.reduce((sum, o) => sum + (o.openings || 0), 0)
        const ctcValues = filteredOpps
            .map(item => { if (!item.ctc) return null; const m = item.ctc.match(/[\d.]+/); return m ? parseFloat(m[0]) : null })
            .filter((v): v is number => v !== null)
        const avgCtc = ctcValues.length > 0
            ? (ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length).toFixed(1) : null
        const totalPlaced = filteredStudents.reduce((sum, s) => {
            const n = s.role ? parseInt(s.role, 10) : 0
            return sum + (isNaN(n) ? 0 : n)
        }, 0)
        return { totalCompanies: companies.size, totalOpenings, avgCtc, totalPlaced }
    }, [filteredOpps, filteredStudents])

    const firstHalfOpps = useMemo(() =>
        filteredOpps.filter(o => { const d = new Date(o.crp_date).getDate(); return d >= 1 && d <= 15 }),
        [filteredOpps]
    )
    const secondHalfOpps = useMemo(() =>
        filteredOpps.filter(o => new Date(o.crp_date).getDate() > 15),
        [filteredOpps]
    )

    function buildSkillChart(opps: PlacementOpportunity[]) {
        const freq = new Map<string, number>()
        for (const opp of opps) {
            const skip = (s: string) => !s || s.toLowerCase() === 'null' || s.toLowerCase() === 'not in source'
            const mSkills = opp.mandatory_skills?.split(',').map(s => s.trim()).filter(s => !skip(s)) ?? []
            for (const s of mSkills) {
                const key = s.toLowerCase()
                freq.set(key, (freq.get(key) ?? 0) + 1)
            }
        }
        return [...freq.entries()]
            .map(([key, mandatory]) => ({ skill: key.replace(/\b\w/g, c => c.toUpperCase()), mandatory, optional: 0, total: mandatory }))
            .sort((a, b) => b.mandatory - a.mandatory)
    }

    function buildCompanyList(opps: PlacementOpportunity[]) {
        const skip = (s: string) => !s || s.toLowerCase() === 'null' || s.toLowerCase() === 'not in source'
        const map = new Map<string, { openings: number; ctc: string | null; skills: Set<string>; company_url: string | null }>()
        for (const opp of opps) {
            const mandatorySkills = opp.mandatory_skills?.split(',').map(s => s.trim()).filter(s => !skip(s)) ?? []
            const existing = map.get(opp.company_name)
            if (existing) {
                existing.openings += opp.openings || 0
                for (const s of mandatorySkills) existing.skills.add(s)
                if (!existing.company_url && opp.company_url) existing.company_url = opp.company_url
            } else {
                map.set(opp.company_name, { openings: opp.openings || 0, ctc: opp.ctc, skills: new Set(mandatorySkills), company_url: opp.company_url ?? null })
            }
        }
        return [...map.entries()]
            .map(([name, v]) => ({ name, openings: v.openings, ctc: v.ctc, skills: [...v.skills], company_url: v.company_url }))
            .sort((a, b) => parseLpa(b.ctc) - parseLpa(a.ctc))
    }

    function parseLpa(ctc: string | null | undefined): number {
        if (!ctc) return 0
        const match = ctc.match(/[\d.]+/)
        return match ? parseFloat(match[0]) : 0
    }

    const firstHalfSkills = useMemo(() => buildSkillChart(firstHalfOpps), [firstHalfOpps])
    const secondHalfSkills = useMemo(() => buildSkillChart(secondHalfOpps), [secondHalfOpps])
    const fullMonthSkills = useMemo(() => buildSkillChart(filteredOpps), [filteredOpps])
    const firstHalfCompanies = useMemo(() => buildCompanyList(firstHalfOpps), [firstHalfOpps])
    const secondHalfCompanies = useMemo(() => buildCompanyList(secondHalfOpps), [secondHalfOpps])
    const fullMonthCompanies = useMemo(() => buildCompanyList(filteredOpps), [filteredOpps])

    // Reset to full month view when month changes
    useEffect(() => { setHalfTab('full') }, [selectedMonth])

    const handleCsvSelect = (file: File) => {
        setCsvFile(file)
        setCsvError(null)
        setCsvParsed(null)
        const reader = new FileReader()
        reader.onload = (e) => {
            try { setCsvParsed(parseCSV(e.target?.result as string)) }
            catch (err) { setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV') }
        }
        reader.readAsText(file)
    }

    const handleCsvUpload = async () => {
        if (!csvParsed || csvParsed.length === 0) return
        setCsvUploading(true)
        try {
            await insertOpportunitiesBulk(csvParsed)
            await loadData()
            setShowCsvUpload(false)
            setCsvFile(null)
            setCsvParsed(null)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)
            setCsvError(msg || 'Upload failed')
        } finally {
            setCsvUploading(false)
        }
    }

    const handleDeleteStudent = async (id: string) => {
        if (!confirm('Delete this student?')) return
        try {
            await deletePlacedStudent(id)
            setStudents(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete')
        }
    }

    // ── Analysis insights ─────────────────────────────────────────────
    const analysis = useMemo(() => {
        const skip = (s: string) => !s || s.toLowerCase() === 'null' || s.toLowerCase() === 'not in source'
        const skillFreq = new Map<string, number>()
        for (const opp of filteredOpps) {
            for (const s of opp.mandatory_skills?.split(',').map(s => s.trim()).filter(s => !skip(s)) ?? []) {
                const key = s.toLowerCase()
                skillFreq.set(key, (skillFreq.get(key) ?? 0) + 1)
            }
        }
        const topSkills = [...skillFreq.entries()]
            .sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([s]) => s.replace(/\b\w/g, c => c.toUpperCase()))

        const top3Keys = [...skillFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s)
        const oppsWithTop3 = filteredOpps.filter(opp => {
            const skills = opp.mandatory_skills?.split(',').map(s => s.trim().toLowerCase()).filter(s => !skip(s)) ?? []
            return skills.some(s => top3Keys.includes(s))
        })
        const top3Pct = filteredOpps.length > 0 ? Math.round((oppsWithTop3.length / filteredOpps.length) * 100) : 0

        const companyOpenings = new Map<string, number>()
        for (const opp of filteredOpps)
            companyOpenings.set(opp.company_name, (companyOpenings.get(opp.company_name) ?? 0) + (opp.openings ?? 0))
        const topByOpenings = [...companyOpenings.entries()]
            .sort((a, b) => b[1] - a[1]).slice(0, 4)
            .map(([name, count]) => ({ name, count }))

        const companyCtc = new Map<string, number>()
        for (const opp of filteredOpps) {
            if (opp.ctc) {
                const m = opp.ctc.match(/[\d.]+/)
                if (m) {
                    const val = parseFloat(m[0])
                    if (!companyCtc.has(opp.company_name) || val > companyCtc.get(opp.company_name)!)
                        companyCtc.set(opp.company_name, val)
                }
            }
        }
        const topByCtc = [...companyCtc.entries()]
            .sort((a, b) => b[1] - a[1]).slice(0, 4)
            .map(([name, ctc]) => ({ name, ctc }))

        return { topSkills, topByOpenings, topByCtc, top3Pct }
    }, [filteredOpps])

    // ── Loading ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-14 w-80 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />)}
                </div>
                <div className="h-72 bg-slate-100 rounded-[2.5rem] animate-pulse" />
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">

            {/* ── Header ───────────────────────────────────────────── */}
            <header className="mb-6 border-b border-blue-100 pb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                            <Briefcase size={16} strokeWidth={3} />
                            <span>Placement Intelligence</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                            Academy Hiring <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Pulse++</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            Track <span className="text-blue-600 font-bold">live CRP opportunities</span>, skill trends, and student placement success stories month by month.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {availableMonths.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => { try { monthRef.current?.showPicker() } catch { monthRef.current?.click() } }}
                                    className={btnPrimary}
                                >
                                    <CalendarDays size={14} />
                                    {selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Select Month'}
                                </button>
                                <input
                                    ref={monthRef}
                                    type="month"
                                    value={selectedMonth}
                                    onChange={e => { if (e.target.value) setSelectedMonth(e.target.value) }}
                                    min={availableMonths[availableMonths.length - 1]}
                                    max={availableMonths[0]}
                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                    tabIndex={-1}
                                />
                            </div>
                        )}
                        {isAdmin && (
                            <>
                                <button onClick={() => setShowCsvUpload(v => !v)} className={btnSecondary}>
                                    <Upload className="w-3.5 h-3.5" /> Upload CSV
                                </button>
                                <button onClick={() => { setEditingStudent(null); setStudentModalOpen(true) }} className={btnPrimary}>
                                    <Plus size={16} /> Add Poster
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>


            {/* ── Error ────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* ── CSV Upload Panel ──────────────────────────────────── */}
            {isAdmin && showCsvUpload && (
                <div className={`${card} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-800">Upload Opportunities CSV</h3>
                        <button
                            onClick={() => { setShowCsvUpload(false); setCsvFile(null); setCsvParsed(null); setCsvError(null) }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                        Expected columns:{' '}
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[11px]">
                            crp_date, company_name, mandatory_skills, optional_skills, openings, ctc
                        </code>
                    </p>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleCsvSelect(e.target.files[0]) }} />
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => fileRef.current?.click()} className={btnSecondary}>
                            <Upload className="w-3.5 h-3.5" /> {csvFile ? csvFile.name : 'Choose File'}
                        </button>
                        {csvParsed && (
                            <button onClick={handleCsvUpload} disabled={csvUploading} className={`${btnPrimary} disabled:opacity-50`}>
                                {csvUploading
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                                    : <><Upload className="w-3.5 h-3.5" /> Import {csvParsed.length} rows</>
                                }
                            </button>
                        )}
                    </div>
                    {csvParsed && (
                        <p className="text-xs text-emerald-600 mt-3 font-medium">
                            Parsed {csvParsed.length} opportunities from {new Set(csvParsed.map(r => r.opportunity_month)).size} month(s)
                        </p>
                    )}
                    {csvError && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-red-500">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {csvError}
                        </div>
                    )}
                </div>
            )}


            {/* ── Stats Bar ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Active Companies */}
                <div className="p-4 bg-white border border-blue-100 rounded-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Companies</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800">{stats.totalCompanies}</span>
                        <span className="text-blue-500 text-xs font-bold bg-blue-50 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                </div>

                {/* Total Openings */}
                <div className="p-4 bg-white border border-blue-100 rounded-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Openings</p>
                    <span className="text-2xl font-black text-slate-800">{stats.totalOpenings}</span>
                </div>

                {/* Avg CTC */}
                {stats.avgCtc && (
                    <div className="p-4 bg-white border border-blue-100 rounded-2xl">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg CTC</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800">{stats.avgCtc}</span>
                            <span className="text-xs font-bold text-slate-400">LPA</span>
                        </div>
                    </div>
                )}

                {/* Students Placed */}
                {stats.totalPlaced > 0 && (
                    <div className="p-4 bg-white border border-blue-100 rounded-2xl">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Students Placed</p>
                        <span className="text-2xl font-black text-emerald-600">{stats.totalPlaced}</span>
                    </div>
                )}

                {/* Success Stories / Gallery */}
                {postersForMonth.length > 0 ? (
                    <button
                        onClick={() => setLightboxIndex(0)}
                        className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl text-left group hover:bg-blue-600 transition-all"
                    >
                        <p className="text-[11px] font-bold text-blue-400 group-hover:text-blue-200 uppercase tracking-widest mb-1">Success Stories</p>
                        <span className="text-sm font-bold text-blue-900 group-hover:text-white flex items-center gap-2">
                            View Gallery <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                ) : (
                    <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">Success Stories</p>
                        <span className="text-sm font-bold text-blue-300">Gathering Data...</span>
                    </div>
                )}
            </div>

            {/* ── Company Ticker ───────────────────────────────────── */}
            {fullMonthCompanies.length > 0 && (
                <div className="bg-white border border-blue-100 rounded-[2rem] py-4 overflow-hidden relative shadow-sm">
                    <style>{`@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                    <div className="flex items-center gap-4 px-8 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 shrink-0">Live Hiring Partners</span>
                        <div className="h-px flex-1 bg-blue-50" />
                        <span className="text-[10px] font-black text-[#0b4b8c] bg-[#dbeafe] px-3 py-1 rounded-full border border-blue-200 shrink-0">
                            {fullMonthCompanies.length} ACTIVE ENTITIES
                        </span>
                    </div>
                    <div
                        className="flex items-center gap-6 w-max"
                        style={{ animation: `ticker-scroll 300s linear infinite` }}
                    >
                        {[...fullMonthCompanies, ...fullMonthCompanies].map((c, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:border-blue-300 hover:bg-white">
                                <CompanyLogo companyName={c.name} domain={c.company_url ? extractDomain(c.company_url) : undefined} size="lg" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-black text-slate-700 whitespace-nowrap">{c.name}</span>
                                    {c.ctc && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                                            {c.ctc}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Summary Zone ─────────────────────────────────────── */}
            {filteredOpps.length > 0 && (() => {
                const totalFullJDs = filteredOpps.length || 1
                const topSkillsWithPct = fullMonthSkills
                    .filter(sk => sk.mandatory > 0)
                    .slice(0, 6)
                    .map(sk => ({ ...sk, pct: Math.round((sk.mandatory / totalFullJDs) * 100) }))
                    .filter(sk => sk.pct > 0)
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                            {/* Left: Key Insights + Top Skills Demand */}
                            <div className="lg:col-span-7 flex flex-col gap-4">

                            {/* Key Insights */}
                            {analysis.topSkills.length > 0 && (
                                <div className="bg-[#0b4b8c] rounded-[2rem] p-4 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-[60px] opacity-20 -translate-y-12 translate-x-12" />
                                    <div className="flex items-center gap-2 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                        <BrainCircuit size={14} />
                                        <span>Key Insights</span>
                                    </div>
                                    <p className="text-sm text-blue-100/90 leading-relaxed font-medium relative z-10">
                                        Bridge the gap:{' '}
                                        <span className="text-white font-bold underline decoration-blue-400 underline-offset-4">
                                            {analysis.topSkills[0]} ({topSkillsWithPct.find(s => s.skill.toLowerCase() === analysis.topSkills[0]?.toLowerCase())?.pct ?? 0}%)
                                        </span>{' '}
                                        opens the door, but{' '}
                                        <span className="text-white font-bold">{analysis.topSkills.slice(1, 3).join(' & ')}</span>{' '}
                                        closes the deal at {analysis.top3Pct}% of partner companies.
                                    </p>
                                </div>
                            )}

                            {/* Top Skills Demand */}
                            <div className="bg-white border border-blue-100 rounded-[2.5rem] p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#dbeafe] text-[#0b4b8c] rounded-xl shadow-sm">
                                            <TrendingUp size={18} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Top Skills Demand</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Based on {totalFullJDs} Active JDs</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSkillModal(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0b4b8c] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 active:scale-95 transition-all shadow-md shadow-blue-200"
                                    >
                                        Full Skill Map <ChevronRight size={12} />
                                    </button>
                                </div>
                                <div className="space-y-5">
                                    {topSkillsWithPct.map(sk => (
                                        <div key={sk.skill} className="group cursor-default">
                                            <div className="flex justify-between items-end mb-1.5">
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-base font-black text-slate-700 group-hover:text-[#0b4b8c] transition-colors">{sk.skill}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{sk.mandatory} Companies hiring</span>
                                                </div>
                                                <span className="text-xs font-black text-[#0b4b8c]">{sk.pct}% Reach</span>
                                            </div>
                                            <div className="relative h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0b4b8c] rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-600 shadow-[2px_0_8px_rgba(11,75,140,0.3)]"
                                                    style={{ width: `${sk.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                            {/* Right: High Yield Partners + Requirement Alert */}
                            <div className="lg:col-span-5 space-y-4">
                                <div className="bg-white border border-blue-100 rounded-[2.5rem] p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-[#0b4b8c] text-white rounded-xl shadow-lg shadow-blue-100">
                                            <Trophy size={18} />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">High Yield Partners</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sorted by highest package</p>
                                    <div className="space-y-2">
                                        {fullMonthCompanies.slice(0, 6).map(c => (
                                            <div
                                                key={c.name}
                                                className="group flex items-center justify-between p-2.5 rounded-[1.5rem] bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-[#dbeafe]/30 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CompanyLogo companyName={c.name} domain={c.company_url ? extractDomain(c.company_url) : undefined} size="lg" className="group-hover:scale-110 transition-transform" />
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{c.name}</p>
                                                        {c.ctc ? <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{c.ctc}</p> : <p className="text-[10px] font-bold text-slate-400">CTC TBD</p>}
                                                    </div>
                                                </div>
                                                {c.openings > 0 && (
                                                    <span className="text-[10px] font-black text-[#0b4b8c] bg-[#dbeafe] px-2 py-1 rounded-full shrink-0">
                                                        {c.openings} openings
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {analysis.topSkills.length > 0 && (
                                    <div className="p-4 rounded-[2rem] bg-[#dbeafe]/40 border border-blue-100">
                                        <h4 className="text-[11px] font-black text-[#0b4b8c] uppercase tracking-widest mb-2">Requirement Alert</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {analysis.top3Pct}% of active roles mandate{' '}
                                            <span className="font-bold text-[#0b4b8c] italic">{analysis.topSkills.slice(0, 2).join(' or ')}</span>{' '}
                                            as a core skill — even for non-specialist roles.
                                        </p>
                                    </div>
                                )}
                            </div>

                    </div>
                )
            })()}

            {/* ── Skill Map Modal ───────────────────────────────────── */}
            {showSkillModal && filteredOpps.length > 0 && (() => {
                const TABS = [
                    { key: '1st' as const, label: '1st Half', sub: '1–15', opps: firstHalfOpps, skills: firstHalfSkills, companies: firstHalfCompanies },
                    { key: '2nd' as const, label: '2nd Half', sub: '16–end', opps: secondHalfOpps, skills: secondHalfSkills, companies: secondHalfCompanies },
                    { key: 'full' as const, label: 'Full Month', sub: 'all', opps: filteredOpps, skills: fullMonthSkills, companies: fullMonthCompanies },
                ]
                const active = TABS.find(t => t.key === halfTab) ?? TABS[2]
                const totalJDs = active.opps.length || 1
                const pctData = active.skills
                    .filter(sk => sk.mandatory > 0)
                    .map(sk => ({ ...sk, mandatoryPct: Math.round((sk.mandatory / totalJDs) * 100) }))
                    .filter(sk => sk.mandatoryPct > 0)

                const groupedData = SKILL_CATEGORIES.map(cat => {
                    const matchedSkills = pctData
                        .filter(sk => skillMatchesCat(sk.skill, cat.keys))
                        .sort((a, b) => b.mandatoryPct - a.mandatoryPct)
                    const groupCompanies = active.companies
                        .filter(c => c.skills.some(s => skillMatchesCat(s, cat.keys)))
                        .slice(0, 6)
                    return { ...cat, matchedSkills, groupCompanies }
                }).filter(g => g.matchedSkills.length > 0)

                const allCatKeys = SKILL_CATEGORIES.flatMap(c => c.keys)
                const ungrouped = pctData
                    .filter(sk => !skillMatchesCat(sk.skill, allCatKeys))
                    .sort((a, b) => b.mandatoryPct - a.mandatoryPct)

                return (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto cursor-pointer"
                        onClick={() => setShowSkillModal(false)}
                    >
                        <div
                            className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl shadow-slate-900/20 mb-8 cursor-default"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100">
                                <div>
                                    <h2 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">Full-Stack Competency Matrix</h2>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Detailed Category Breakdown</p>
                                </div>
                                <button onClick={() => setShowSkillModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0 ml-3">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tab bar */}
                            <div className="flex flex-col gap-3 px-4 sm:px-8 pt-4 pb-3 border-b border-slate-50">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {TABS.map(t => (
                                            <button
                                                key={t.key}
                                                onClick={() => setHalfTab(t.key)}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold border transition-all',
                                                    halfTab === t.key
                                                        ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-100'
                                                        : 'bg-white text-slate-500 border-blue-100 hover:border-blue-300'
                                                )}
                                            >
                                                {t.label}
                                                <span className={cn(
                                                    'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                                                    halfTab === t.key ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                                                )}>
                                                    {t.opps.length}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <span className="bg-[#dbeafe] text-[#0b4b8c] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm shrink-0">
                                        {active.opps.length} JDs
                                    </span>
                                </div>
                                <span className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-bold w-full text-center sm:text-left">
                                    75% = required by 75 in 100 companies
                                </span>
                            </div>

                            {/* Matrix content */}
                            {active.opps.length === 0 ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-black text-slate-400">No data for this period yet.</p>
                                </div>
                            ) : (
                                <div className="px-4 sm:px-8 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    {groupedData.map(group => (
                                        <section key={group.category} className="space-y-4">
                                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                                <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-xl">
                                                    <group.Icon size={14} />
                                                </div>
                                                <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">{group.category}</h2>
                                            </div>
                                            <div className="space-y-3">
                                                {group.matchedSkills.map(sk => (
                                                    <div key={sk.skill} className="group cursor-default">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <span className="text-xs font-black text-slate-600 group-hover:text-[#0b4b8c] transition-colors uppercase tracking-tight">{sk.skill}</span>
                                                            <span className="text-xs font-black text-[#0b4b8c]">{sk.mandatoryPct}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#0b4b8c] rounded-full transition-all duration-700 group-hover:bg-blue-500"
                                                                style={{ width: `${sk.mandatoryPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {group.groupCompanies.length > 0 && (
                                                <div className="pt-1">
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <Building2 size={11} className="text-slate-300" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Primary Hiring Entities</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {group.groupCompanies.map(c => {
                                                            const key = `modal-grp:${group.category}:${c.name}`
                                                            const isHovered = hoveredPill === key
                                                            return (
                                                                <div
                                                                    key={c.name}
                                                                    className="relative"
                                                                    onMouseEnter={() => setHoveredPill(key)}
                                                                    onMouseLeave={() => setHoveredPill(null)}
                                                                    onTouchStart={() => setHoveredPill(key)}
                                                                    onTouchEnd={() => setTimeout(() => setHoveredPill(null), 1500)}
                                                                >
                                                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-default transition-all select-none ${isHovered ? 'bg-[#0b4b8c] text-white border-[#0b4b8c]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-[#0b4b8c] hover:border-blue-200'}`}>
                                                                        {c.name}
                                                                    </span>
                                                                    {isHovered && (c.ctc || c.openings > 0) && (
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-0.5 bg-[#0b4b8c] rounded-xl px-3 py-2 shadow-lg z-50 whitespace-nowrap pointer-events-none">
                                                                            {c.ctc && <span className="text-xs font-black text-white">{c.ctc}</span>}
                                                                            {c.openings > 0 && <span className="text-[10px] font-semibold text-blue-200">{c.openings} openings</span>}
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0b4b8c] rotate-45 -mt-1" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </section>
                                    ))}
                                    {ungrouped.length > 0 && (
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                                                <div className="p-1.5 bg-[#dbeafe] text-[#0b4b8c] rounded-xl">
                                                    <TrendingUp size={14} />
                                                </div>
                                                <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">Other Skills</h2>
                                            </div>
                                            <div className="space-y-3">
                                                {ungrouped.map(sk => (
                                                    <div key={sk.skill} className="group cursor-default">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <span className="text-xs font-black text-slate-600 group-hover:text-[#0b4b8c] transition-colors uppercase tracking-tight">{sk.skill}</span>
                                                            <span className="text-xs font-black text-[#0b4b8c]">{sk.mandatoryPct}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#0b4b8c] rounded-full transition-all duration-700 group-hover:bg-blue-500"
                                                                style={{ width: `${sk.mandatoryPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })()}

            {/* ── Poster Lightbox ───────────────────────────────────── */}
            {lightboxIndex !== null && postersForMonth[lightboxIndex] && (() => {
                const current = postersForMonth[lightboxIndex]
                const hasPrev = lightboxIndex > 0
                const hasNext = lightboxIndex < postersForMonth.length - 1
                return (
                    <div
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
                        onClick={() => setLightboxIndex(null)}
                    >
                        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors z-10">
                            <X className="w-6 h-6" />
                        </button>

                        {postersForMonth.length > 1 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium z-10">
                                {lightboxIndex + 1} / {postersForMonth.length}
                            </div>
                        )}

                        {hasPrev && (
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors z-10"
                                onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        {hasNext && (
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors z-10"
                                onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        <img
                            src={current.photo_url!}
                            alt="Placement poster"
                            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain cursor-default"
                            onClick={e => e.stopPropagation()}
                        />

                        {isAdmin && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                                <button
                                    onClick={e => { e.stopPropagation(); setEditingStudent(current); setStudentModalOpen(true); setLightboxIndex(null) }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); setLightboxIndex(null); handleDeleteStudent(current.id) }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-medium hover:bg-red-500/60 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )
            })()}

            {/* ── Modals ────────────────────────────────────────────── */}
            {oppModalOpen && (
                <OpportunityFormModal
                    editing={editingOpp}
                    onClose={() => { setOppModalOpen(false); setEditingOpp(null) }}
                    onSaved={loadData}
                />
            )}
            {studentModalOpen && (
                <StudentFormModal
                    editing={editingStudent}
                    onClose={() => { setStudentModalOpen(false); setEditingStudent(null) }}
                    onSaved={loadData}
                />
            )}
        </div>
    )
}

// ── Opportunity Form Modal ───────────────────────────────────────────

function OpportunityFormModal({ editing, onClose, onSaved }: {
    editing: PlacementOpportunity | null
    onClose: () => void
    onSaved: () => void
}) {
    const [form, setForm] = useState({
        crp_date: editing?.crp_date ?? '',
        company_name: editing?.company_name ?? '',
        company_url: editing?.company_url ?? '',
        mandatory_skills: editing?.mandatory_skills ?? '',
        optional_skills: editing?.optional_skills ?? '',
        openings: editing?.openings?.toString() ?? '',
        ctc: editing?.ctc ?? '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.crp_date || !form.company_name.trim()) return setError('CRP Date and Company are required')
        setSaving(true)
        setError(null)
        try {
            const payload = {
                crp_date: form.crp_date,
                company_name: form.company_name.trim(),
                company_url: form.company_url.trim() || null,
                mandatory_skills: form.mandatory_skills.trim() || null,
                optional_skills: form.optional_skills.trim() || null,
                openings: form.openings ? parseInt(form.openings, 10) : 0,
                ctc: form.ctc.trim() || null,
                opportunity_month: form.crp_date.slice(0, 7),
            }
            if (editing) { await updateOpportunity(editing.id, payload) }
            else { await insertOpportunity(payload) }
            onSaved()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl shadow-slate-200/80">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-800">{editing ? 'Edit Opportunity' : 'Add Opportunity'}</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CRP Date *</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" value={form.crp_date}
                                onChange={e => setForm(f => ({ ...f, crp_date: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Company *</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" value={form.company_name}
                                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Company Website <span className="normal-case font-medium">(for logo)</span></label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="e.g. adp.com or https://adp.com" value={form.company_url}
                            onChange={e => setForm(f => ({ ...f, company_url: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mandatory Skills (comma-separated)</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="React, Node.js, SQL" value={form.mandatory_skills}
                            onChange={e => setForm(f => ({ ...f, mandatory_skills: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Optional Skills (comma-separated)</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="AWS, Docker" value={form.optional_skills}
                            onChange={e => setForm(f => ({ ...f, optional_skills: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Openings</label>
                            <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" value={form.openings}
                                onChange={e => setForm(f => ({ ...f, openings: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CTC</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="e.g. 6 LPA" value={form.ctc}
                                onChange={e => setForm(f => ({ ...f, ctc: e.target.value }))} />
                        </div>
                    </div>
                    {form.crp_date && (
                        <p className="text-[11px] text-slate-400 font-medium">Month: {formatMonth(form.crp_date.slice(0, 7))}</p>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-black uppercase tracking-tight rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-white text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editing ? 'Save Changes' : 'Add Opportunity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Student Form Modal ───────────────────────────────────────────────

function StudentFormModal({ editing, onClose, onSaved }: {
    editing: PlacedStudent | null
    onClose: () => void
    onSaved: () => void
}) {
    const [mode, setMode] = useState<'upload' | 'url'>(editing?.photo_url ? 'url' : 'upload')
    const [form, setForm] = useState({
        photo_url: editing?.photo_url ?? '',
        placement_month: editing?.placement_month ?? '',
        student_count: editing?.role ?? '',
    })
    const [file, setFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (f: File) => {
        setFile(f)
        setFilePreview(URL.createObjectURL(f))
        setForm(prev => ({ ...prev, photo_url: '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.placement_month) return setError('Month is required')
        const hasUrl = form.photo_url.trim()
        if (!hasUrl && !file) return setError('Upload an image or enter a URL')
        setSaving(true)
        setError(null)
        try {
            let photoUrl = form.photo_url.trim()
            if (file) photoUrl = await uploadPosterImage(file)
            const payload = {
                student_name: 'Poster', company: 'Placement',
                role: form.student_count.trim() || null,
                ctc: null, photo_url: photoUrl,
                placement_month: form.placement_month,
            }
            if (editing) { await updatePlacedStudent(editing.id, payload) }
            else { await insertPlacedStudent(payload) }
            onSaved()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const previewUrl = mode === 'upload' ? filePreview : form.photo_url

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl shadow-slate-200/80">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-800">{editing ? 'Edit Poster' : 'Add Poster'}</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                    {/* Mode toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 w-fit">
                        <button type="button"
                            onClick={() => setMode('upload')}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all',
                                mode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}>
                            <Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Upload
                        </button>
                        <button type="button"
                            onClick={() => setMode('url')}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all',
                                mode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}>
                            Paste URL
                        </button>
                    </div>

                    {mode === 'upload' ? (
                        <div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }} />
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl p-8 text-center transition-colors">
                                <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 font-medium">{file ? file.name : 'Click to choose an image'}</p>
                                <p className="text-[11px] text-slate-400 mt-1">JPG, PNG — auto-compressed</p>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Poster Image URL *</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="https://…" value={form.photo_url}
                                onChange={e => { setForm(f => ({ ...f, photo_url: e.target.value })); setFile(null); setFilePreview(null) }} />
                        </div>
                    )}

                    {previewUrl && (
                        <div className="rounded-2xl border border-slate-100 overflow-hidden">
                            <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain bg-slate-50"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Month *</label>
                            <input type="month" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" value={form.placement_month}
                                onChange={e => setForm(f => ({ ...f, placement_month: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Students Placed Count</label>
                            <input type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="e.g. 45" value={form.student_count}
                                onChange={e => setForm(f => ({ ...f, student_count: e.target.value }))} />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-black uppercase tracking-tight rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-white text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {file ? 'Uploading…' : 'Saving…'}</> : editing ? 'Save Changes' : 'Add Poster'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
