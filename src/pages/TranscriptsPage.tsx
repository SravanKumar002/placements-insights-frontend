import { useState } from 'react'
import { useTranscripts } from '../hooks/useTranscripts'
import { TranscriptCard } from '../components/transcript/TranscriptCard'
import { Pagination } from '../components/qa/Pagination'
import { TranscriptUploadModal } from '../components/transcript/TranscriptUploadModal'
import { AudioUploadModal } from '../components/transcript/AudioUploadModal'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Upload, Search, BarChart3, Mic } from 'lucide-react'

const PAGE_SIZE = 10

export function TranscriptsPage() {
    const { transcripts, loading, error } = useTranscripts()
    const { role } = useAuth()
    const [page, setPage] = useState(0)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [audioOpen, setAudioOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const completed = transcripts.filter(t => t.processing_status === 'done').length
    const inProgress = transcripts.filter(t => t.processing_status === 'processing').length
    const totalQAs = transcripts.reduce((sum, t) => sum + (t.qa_count ?? 0), 0)

    const filtered = transcripts.filter(t => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        const allAlumni = t.alumni && t.alumni.length > 0 ? t.alumni : [{ alumni_name: t.alumni_name, company: t.company, role: t.role }]
        return (
            allAlumni.some(a => a.alumni_name?.toLowerCase().includes(q) || a.company?.toLowerCase().includes(q)) ||
            t.branch?.toLowerCase().includes(q)
        )
    })

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-10 border-b border-blue-100 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#0b4b8c] font-bold tracking-widest text-[10px] uppercase">
                            <FileText size={16} strokeWidth={3} />
                            <span>Transcript Intelligence Pipeline</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-light text-slate-900 tracking-tight leading-tight">
                            Converting Conversations into{' '}
                            <span className="font-bold text-[#0b4b8c]">Actionable Placement Data</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                            Processed{' '}
                            <span className="text-[#0b4b8c] font-bold">{transcripts.length} interview transcript{transcripts.length !== 1 ? 's' : ''}</span>
                            {totalQAs > 0 && <> resulting in <span className="text-[#0b4b8c] font-bold">{totalQAs}+</span> verified question-answer patterns.</>}
                        </p>
                    </div>
                    {role === 'admin' && (
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => setAudioOpen(true)}
                                className="flex items-center gap-2 border-2 border-violet-500 bg-white text-violet-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-50 transition-all active:scale-95 shadow-sm"
                            >
                                <Mic size={18} strokeWidth={3} />
                                Upload Recording
                            </button>
                            <button
                                onClick={() => setUploadOpen(true)}
                                className="flex items-center gap-2 border-2 border-[#0b4b8c] bg-white text-[#0b4b8c] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#dbeafe] transition-all active:scale-95 shadow-sm"
                            >
                                <Upload size={18} strokeWidth={3} />
                                Upload Transcript
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {role === 'admin' && (
                <>
                    <TranscriptUploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
                    <AudioUploadModal isOpen={audioOpen} onClose={() => setAudioOpen(false)} />
                </>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="p-6 bg-white border border-blue-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Intelligence Yield</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#0b4b8c]">{totalQAs}</span>
                        <span className="text-xs font-bold text-slate-400">Total Q&As</span>
                    </div>
                </div>
                <div className="p-6 bg-white border border-blue-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                    <span className="text-3xl font-black text-emerald-600">{completed}</span>
                </div>
                <div className={`p-6 border border-blue-100 rounded-2xl ${inProgress > 0 ? 'bg-[#dbeafe]/30' : 'bg-white shadow-sm'}`}>
                    <p className="text-[10px] font-black text-[#0b4b8c] uppercase tracking-widest mb-1">Processing</p>
                    {inProgress > 0
                        ? <span className="text-3xl font-black text-[#0b4b8c]/60 italic">Syncing...</span>
                        : <span className="text-3xl font-black text-slate-300">—</span>
                    }
                </div>
                <div className="p-6 bg-white border border-blue-100 rounded-2xl shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[#0b4b8c] text-[10px] font-black uppercase tracking-widest">
                        <BarChart3 size={14} />
                        <span>{transcripts.length} Transcripts Total</span>
                    </div>
                </div>
            </div>

            {/* List section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 mb-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Recent Extractions</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                            type="text"
                            placeholder="Filter by name or company..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(0) }}
                            className="bg-transparent border-b border-slate-200 pl-8 pr-3 pb-1 text-xs focus:border-[#0b4b8c] outline-none transition-all w-full sm:w-48 placeholder-slate-300"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-blue-50/50 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-white border border-blue-100 rounded-2xl p-6 text-center text-red-500">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Upload className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm font-medium">
                            {searchQuery ? 'No transcripts match your filter.' : 'No transcripts yet. Upload your first call!'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {pageItems.map(t => <TranscriptCard key={t.id} transcript={t} />)}
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </>
                )}
            </div>
        </div>
    )
}
