import { Link } from 'react-router-dom'
import { Clock, CheckCircle, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useTranscripts } from '../../hooks/useTranscripts'
import { formatDate, formatRelative } from '../../utils/formatDate'

const statusIcon = {
    pending: <Clock className="w-4 h-4 text-surface-500" />,
    processing: <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />,
    done: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
}

const statusLabel = {
    pending: 'Pending',
    processing: 'Processing...',
    done: 'Done',
    error: 'Error',
}

export function RecentCalls() {
    const { transcripts, loading } = useTranscripts()
    const recent = transcripts.slice(0, 5)

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">Recent Calls</h2>
                <Link to="/transcripts" className="text-xs text-brand-500 hover:text-brand-600 transition-colors">View all →</Link>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : recent.length === 0 ? (
                <div className="text-center py-8 text-surface-500 text-sm">No calls uploaded yet</div>
            ) : (
                <div className="space-y-3">
                    {recent.map(t => (
                        <Link
                            key={t.id}
                            to={`/transcripts/${t.id}`}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl hover:bg-surface-100 transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-surface-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-surface-700 group-hover:text-surface-800 truncate">
                                        {t.alumni_name}
                                    </p>
                                    <p className="text-xs text-surface-500 truncate">
                                        {t.company} · {t.role}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 ml-13 sm:ml-auto">
                                <div className="flex items-center gap-1.5">
                                    {statusIcon[t.processing_status]}
                                    <span className="text-xs text-surface-500">{statusLabel[t.processing_status]}</span>
                                </div>
                                {t.processing_status === 'done' && t.updated_at ? (
                                    <span className="text-xs text-surface-600">
                                        {formatDate(t.updated_at)} · {formatRelative(t.updated_at)}
                                    </span>
                                ) : (
                                    <span className="text-xs text-surface-600">{formatRelative(t.created_at)}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
