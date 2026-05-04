import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { fetchSkillTrends } from '../../../services/alumniService'
import type { SkillTrend } from '../../../services/alumniService'

const MAX_SKILLS = 10

export function SkillTrends() {
    const [skills, setSkills] = useState<SkillTrend[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSkillTrends()
            .then(data => setSkills(data.slice(0, MAX_SKILLS)))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const maxCount = skills.length > 0 ? skills[0].count : 1

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-surface-800">Skill Trends</h2>
            </div>

            {loading ? (
                <div className="glass-card p-6">
                    <div className="flex items-end gap-2 h-48">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex-1 bg-surface-100 animate-pulse rounded-t-md" style={{ height: `${30 + i * 8}%` }} />
                        ))}
                    </div>
                </div>
            ) : skills.length === 0 ? (
                <div className="glass-card p-8 text-center text-surface-500 text-sm">
                    No skill data available yet.
                </div>
            ) : (
                <div className="glass-card p-6">
                    {/* Vertical bar chart */}
                    <div className="flex items-end gap-2 h-48 mb-3">
                        {skills.map(({ skill, count }) => (
                            <div key={skill} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <span className="text-[10px] font-semibold text-surface-500">{count}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-brand-500 to-purple-500 rounded-t-md transition-all duration-500"
                                    style={{ height: `${Math.max((count / maxCount) * 100, 8)}%` }}
                                />
                            </div>
                        ))}
                    </div>
                    {/* Labels */}
                    <div className="flex gap-2">
                        {skills.map(({ skill }) => (
                            <div key={skill} className="flex-1 text-center">
                                <span className="text-[9px] font-medium text-surface-500 leading-tight line-clamp-2" title={skill}>
                                    {skill}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
