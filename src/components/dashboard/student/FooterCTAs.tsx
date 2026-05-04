import { useState } from 'react'
import { HelpCircle, MessageSquareHeart } from 'lucide-react'
import { FeedbackModal } from '../../student-cta/FeedbackModal'
import { AskQuestionModal } from '../../student-cta/AskQuestionModal'

export function FooterCTAs() {
    const [askOpen, setAskOpen] = useState(false)
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Didn't find your question? */}
                <button
                    onClick={() => setAskOpen(true)}
                    className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-left hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-300/30 active:scale-[0.98] transition-all duration-200 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Didn't find your question?</h3>
                    <p className="text-sm text-white/70 mt-1">
                        Ask your placement-related question and we'll get it answered by alumni.
                    </p>
                </button>

                {/* We value your feedback */}
                <button
                    onClick={() => setFeedbackOpen(true)}
                    className="rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 p-6 text-left hover:from-amber-300 hover:to-yellow-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-300/30 active:scale-[0.98] transition-all duration-200 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                        <MessageSquareHeart className="w-5 h-5 text-amber-900" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-900">We value your feedback</h3>
                    <p className="text-sm text-amber-800/70 mt-1">
                        Rate your experience and share suggestions to help us improve.
                    </p>
                </button>
            </div>

            <AskQuestionModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    )
}
