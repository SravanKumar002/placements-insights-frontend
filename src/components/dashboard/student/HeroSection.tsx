import { useState } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { FeedbackModal } from '../../student-cta/FeedbackModal'

export function HeroSection() {
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    return (
        <>
            <div className="rounded-2xl bg-blue-100 border border-blue-200 px-8 py-6 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 leading-tight">
                    What You'll Discover Here 🔎
                </h1>
                <p className="mt-4 text-xl text-surface-500 leading-relaxed">
                    Everything you need to stay closer to placements.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
                    <button
                        onClick={() => setFeedbackOpen(true)}
                        className="relative overflow-hidden inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 text-amber-900 text-sm font-semibold shadow-md hover:bg-amber-300 transition-all"
                    >
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-full animate-shimmer bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)]" />
                        <MessageSquareHeart className="w-4 h-4" /> We value your feedback
                    </button>
                </div>
            </div>

            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    )
}
