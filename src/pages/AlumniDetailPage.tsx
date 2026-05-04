import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, GraduationCap, MapPin, Calendar, MessageSquare, FileText, Globe, Zap } from 'lucide-react'
import { useAlumniDetail } from '../hooks/useAlumniDetail'
import { formatDate } from '../utils/formatDate'
import { QACard } from '../components/qa/QACard'
import { AlumniAvatar } from '../components/alumni/AlumniAvatar'
import { supabase } from '../config/supabase'
import type { QAItem } from '../types'
import { ADMIN_ALUMNI_PATH, ADMIN_TRANSCRIPTS_PATH } from '../config/constants'

export function AlumniDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { profile, loading } = useAlumniDetail(id ?? null)
    const [alumniQAItems, setAlumniQAItems] = useState<QAItem[]>([])

    useEffect(() => {
        if (!profile) return
        async function loadQA() {
            const { data, error } = await supabase
                .from('qa_answers')
                .select('qa_item_id')
                .eq('transcript_id', profile!.transcript_id)
                .eq('alumni_name', profile!.name)

            if (error || !data?.length) return

            const qaItemIds = [...new Set((data as { qa_item_id: string }[]).map(a => a.qa_item_id))]
            const { data: items } = await supabase
                .from('qa_items')
                .select('*, answers:qa_answers(*)')
                .in('id', qaItemIds)

            if (items) {
                setAlumniQAItems(
                    (items as QAItem[]).map(q => ({
                        ...q,
                        answers: q.answers?.filter(a => a.transcript_id === profile!.transcript_id && a.alumni_name === profile!.name) ?? []
                    }))
                )
            }
        }
        loadQA()
    }, [profile])

    if (loading) {
        return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-surface-100 animate-pulse" />)}</div>
    }
    if (!profile) {
        return <div className="text-center py-10 text-surface-500">Alumni not found</div>
    }

    return (
        <div className="animate-fade-in">
            <Link to={ADMIN_ALUMNI_PATH} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Alumni
            </Link>

            {/* Profile Hero */}
            <div className="glass-card p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <AlumniAvatar name={profile.name} logoUrl={profile.company_logo_url} size="lg" />
                    <div className="flex-1">
                        {/* 1. Name */}
                        <h1 className="text-2xl font-bold text-surface-900 mb-3">{profile.name}</h1>

                        <div className="space-y-2">
                            {/* 2. Role @ Company · Salary */}
                            <InfoRow
                                icon={<Building2 className="w-4 h-4" />}
                                label={`${profile.role} @ ${profile.company}${profile.package_lpa ? ` · ${profile.package_lpa} LPA` : ''}`}
                            />

                            {/* 3. College · Branch · Graduation Year */}
                            {(profile.college || profile.branch || profile.graduation_year) && (
                                <InfoRow
                                    icon={<GraduationCap className="w-4 h-4" />}
                                    label={[profile.college, profile.branch, profile.graduation_year].filter(Boolean).join(' · ')}
                                />
                            )}

                            {/* 4. Location */}
                            {profile.location && (
                                <InfoRow
                                    icon={<MapPin className="w-4 h-4" />}
                                    label={profile.location}
                                />
                            )}

                            {/* 5. NxtWave Batch */}
                            {profile.batch && (
                                <InfoRow
                                    icon={<Calendar className="w-4 h-4" />}
                                    label={`NxtWave · ${profile.batch}`}
                                />
                            )}

                            {/* Call date */}
                            {profile.call_date && (
                                <InfoRow
                                    icon={<Calendar className="w-4 h-4" />}
                                    label={`Call on ${formatDate(profile.call_date)}`}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Company URL */}
            {profile.company_url && (
                <div className="glass-card p-4 mb-6 flex items-center gap-3">
                    <Globe className="w-4 h-4 text-brand-500 shrink-0" />
                    <a href={profile.company_url.startsWith('http') ? profile.company_url : `https://${profile.company_url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline truncate">
                        {profile.company_url}
                    </a>
                </div>
            )}

            {/* Skills Tested */}
            {profile.skills_tested && profile.skills_tested.length > 0 && (
                <div className="glass-card p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-semibold text-surface-700">Skills Tested</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills_tested.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Interview Process */}
            {profile.interview_process && profile.interview_process.length > 0 && (
                <div className="glass-card p-5 mb-6">
                    <h2 className="section-title mb-4">Interview Process at {profile.company}</h2>
                    <div className="space-y-4">
                        {profile.interview_process.map((round, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold shrink-0">
                                        {round.round}
                                    </div>
                                    {i < profile.interview_process!.length - 1 && (
                                        <div className="w-px flex-1 bg-surface-200 mt-1" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <h3 className="text-sm font-semibold text-surface-800">{round.title}</h3>
                                    {round.details.length > 0 && (
                                        <ul className="mt-1.5 space-y-1">
                                            {round.details.map((detail, j) => (
                                                <li key={j} className="text-xs text-surface-500 flex items-start gap-2">
                                                    <span className="text-surface-300 mt-0.5">-</span>
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contributions */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-brand-500" />
                    <h2 className="section-title">Q&As Answered ({alumniQAItems.length})</h2>
                </div>
                {alumniQAItems.length === 0 ? (
                    <p className="text-surface-500 text-sm">No Q&As attributed yet.</p>
                ) : (
                    <div className="space-y-4">
                        {alumniQAItems.map(item => <QACard key={item.id} item={item} showCategory />)}
                    </div>
                )}
            </div>

            {/* Full transcript link */}
            <div className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-surface-500">
                    <FileText className="w-4 h-4 text-surface-500" />
                    View the full call transcript for complete context
                </div>
                <Link to={`${ADMIN_TRANSCRIPTS_PATH}/${profile.transcript_id}`} className="btn-secondary text-sm">
                    View Transcript →
                </Link>
            </div>
        </div>
    )
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-surface-500">
            <span className="text-surface-500 shrink-0">{icon}</span>
            {label}
        </div>
    )
}
