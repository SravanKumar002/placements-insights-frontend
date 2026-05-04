import { useEffect, useState } from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import { fetchAllJourneys } from '../../services/alumniJourneyService'
import { useNavigate } from 'react-router-dom'

export function AlumniJourneyStats() {
    const navigate = useNavigate()
    const [total, setTotal] = useState(0)
    const [withJourney, setWithJourney] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAllJourneys()
            .then(data => {
                setTotal(data.length)
                setWithJourney(data.filter(j => j.journey_text?.trim()).length)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <div className="glass-card p-5 border border-purple-300 h-[180px] animate-pulse" />
    }

    const withoutJourney = total - withJourney

    return (
        <div className="glass-card p-5 border border-purple-300">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4.5 h-4.5 text-purple-500" />
                </div>
                <h2 className="text-base font-semibold text-surface-800">Academy Alumni</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-2xl font-bold text-purple-700">{total}</p>
                    <span className="text-[10px] text-surface-500 font-medium uppercase tracking-wide">Total</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{withJourney}</p>
                    <span className="text-[10px] text-surface-500 font-medium uppercase tracking-wide">With Journey</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-600">{withoutJourney}</p>
                    <span className="text-[10px] text-surface-500 font-medium uppercase tracking-wide">No Journey</span>
                </div>
            </div>

            <button
                onClick={() => navigate('/alumni-journey?withJourney=true')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold transition-colors"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                View Alumni with Journey ({withJourney})
            </button>
        </div>
    )
}
