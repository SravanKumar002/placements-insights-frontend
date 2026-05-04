import { useState } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

export function StudentCTASection() {
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    return (
        <>
            <div className="mt-6">
                <button
                    onClick={() => setFeedbackOpen(true)}
                    className="glass-card-hover w-full p-4 flex items-center gap-3 text-left border border-amber-200 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <MessageSquareHeart className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-600 group-hover:text-surface-800 transition-colors">
                            Help us improve
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">Share your rating and feedback</p>
                    </div>
                </button>
            </div>

            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    )
}
