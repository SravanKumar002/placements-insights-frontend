import { useState } from 'react'
import { User } from 'lucide-react'
import type { InterviewPreview } from '../../services/alumniService'

// Known practice platforms — used as fallback for old data that hasn't been re-processed
const KNOWN_PLATFORMS = new Set([
    'leetcode', 'hackerrank', 'codechef', 'codeforces', 'hackerearth',
    'geeksforgeeks', 'gfg', 'interviewbit', 'kaggle', 'github', 'codesignal',
    'topcoder', 'atcoder', 'spoj', 'codingninjas', 'unstop',
])

function splitSkillsAndPlatforms(skills: string[], platforms: string[]): { skills: string[], platforms: string[] } {
    // If platforms_used already populated from DB, use it directly
    if (platforms.length > 0) return { skills, platforms }
    // Fallback: detect known platforms from the skills array (old data)
    const detectedPlatforms: string[] = []
    const filteredSkills: string[] = []
    for (const s of skills) {
        if (KNOWN_PLATFORMS.has(s.toLowerCase())) {
            detectedPlatforms.push(s)
        } else {
            filteredSkills.push(s)
        }
    }
    return { skills: filteredSkills, platforms: detectedPlatforms }
}

export function TimelineCard({ preview }: { preview: InterviewPreview }) {
    const [showAllSkills, setShowAllSkills] = useState(false)
    const rounds = preview.interview_process
    const maxSkills = 5

    const { skills, platforms } = splitSkillsAndPlatforms(
        preview.skills_tested ?? [],
        preview.platforms_used ?? [],
    )

    const allBadges = [
        ...skills.map(s => ({ label: s, type: 'skill' as const })),
        ...platforms.map(p => ({ label: p, type: 'platform' as const })),
    ]
    const visibleBadges = showAllSkills ? allBadges : allBadges.slice(0, maxSkills)

    return (
        <div className="glass-card p-5 border-2 border-transparent hover:border-brand-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-300/50 transition-all duration-200">
            {/* Header: Company + Alumni on left, Rounds count on right */}
            <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                    <p className="font-bold text-sm text-surface-800 truncate">
                        {preview.company}{preview.role ? ` · ${preview.role}` : ''}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3 text-surface-400 shrink-0" />
                        <span className="text-xs text-surface-500 truncate">{preview.alumni_name}</span>
                    </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-600 text-xs font-semibold shrink-0 ml-2">
                    {rounds.length} Round{rounds.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Timeline */}
            <div className="flex items-start gap-0 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                {rounds.map((round, i) => (
                    <div key={i} className="flex items-start shrink-0">
                        <div className="flex flex-col items-center w-[90px] sm:w-[100px]">
                            <div className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                                {round.round}
                            </div>
                            <p className="text-[10px] text-surface-600 text-center mt-2 px-1 leading-tight whitespace-normal break-words w-full">
                                {round.title}
                            </p>
                        </div>
                        {i < rounds.length - 1 && (
                            <div className="flex items-center mt-3.5 -mx-4 group">
                                <div className="w-8 sm:w-12 border-t-2 border-dashed border-brand-200 group-hover:border-brand-300 transition-colors" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Skills + Platforms */}
            {allBadges.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center gap-3 mb-2">
                        {skills.length > 0 && (
                            <h4 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Skills Tested</h4>
                        )}
                        {platforms.length > 0 && (
                            <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Platforms Used</h4>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {visibleBadges.map(({ label, type }) => (
                            <span
                                key={label}
                                className={
                                    type === 'skill'
                                        ? 'px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600'
                                        : 'px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 border border-violet-200 text-violet-600'
                                }
                            >
                                {type === 'platform' && '🔗 '}{label}
                            </span>
                        ))}
                        {allBadges.length > maxSkills && (
                            <button
                                onClick={() => setShowAllSkills(!showAllSkills)}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-surface-100 border border-surface-200 text-surface-500 hover:bg-surface-200 transition-colors cursor-pointer"
                            >
                                {showAllSkills ? 'Show less' : `+${allBadges.length - maxSkills} more`}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
