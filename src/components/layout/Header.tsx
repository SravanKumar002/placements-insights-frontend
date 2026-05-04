import { useState } from 'react'
import { Menu, HelpCircle, MessageSquareHeart } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { FeedbackModal } from '../student-cta/FeedbackModal'
import { AskQuestionModal } from '../student-cta/AskQuestionModal'

interface HeaderProps {
    onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [askOpen, setAskOpen] = useState(false)
    const { role } = useAuth()

    return (
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-[92px] flex items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 bg-[#0b4b8c] backdrop-blur-xl z-20">
            {/* Mobile menu button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-1 rounded-lg text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors shrink-0"
                aria-label="Open navigation"
            >
                <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* Student-only CTA buttons */}
            {role !== 'admin' && (
                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                    <button
                        onClick={() => setAskOpen(true)}
                        className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-md shadow-brand-200/40"
                    >
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        <span className="hidden md:inline whitespace-nowrap">Didn't find your question?</span>
                    </button>
                    <button
                        onClick={() => setFeedbackOpen(true)}
                        className="relative overflow-hidden flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-md shadow-amber-200/40"
                    >
                        {/* Shimmer sweep */}
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-full animate-shimmer bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)]" />
                        <MessageSquareHeart className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline whitespace-nowrap">We value your feedback</span>
                    </button>
                </div>
            )}

            {/* Admin-only buttons */}

            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            <AskQuestionModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
        </header>
    )
}
