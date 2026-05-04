import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
    return (
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-700 px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-white">
                Start Exploring Placement Insights
            </h2>
            <p className="mt-2 text-white/70 text-sm">
                Browse Q&A, alumni journeys, and interview experiences — all in one place.
            </p>
            <Link
                to="/qa"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-brand-600 font-semibold rounded-xl shadow-lg hover:bg-brand-50 transition-colors"
            >
                Browse All Q&A
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    )
}
