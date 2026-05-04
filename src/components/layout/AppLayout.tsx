import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { FeedbackNudge } from '../student-cta/FeedbackNudge'
import { FeedbackModal } from '../student-cta/FeedbackModal'
import { AskQuestionModal } from '../student-cta/AskQuestionModal'
import { useAuth } from '../../contexts/AuthContext'
import { usePageView } from '../../hooks/usePageView'
import { Menu, HelpCircle, MessageSquareHeart } from 'lucide-react'

export function AppLayout() {
    usePageView()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [askOpen, setAskOpen] = useState(false)
    const location = useLocation()
    const { role } = useAuth()

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    return (
        <div className="min-h-screen bg-surface-50">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile-only top bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center gap-2 px-3 bg-[#0b4b8c] z-20">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Open navigation"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <span className="flex-1 text-sm font-bold text-white">Placements IQ</span>

                {role !== 'admin' && (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setAskOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                        >
                            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden xs:inline">Ask</span>
                        </button>
                        <button
                            onClick={() => setFeedbackOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
                        >
                            <MessageSquareHeart className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden xs:inline">Feedback</span>
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
                <div className="p-4 lg:p-6 animate-fade-in">
                    <Outlet />
                </div>
            </main>

            <FeedbackNudge role={role} />
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            <AskQuestionModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
        </div>
    )
}
