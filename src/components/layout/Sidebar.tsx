import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    MessageCircle,
    FileText,
    Users,
    MessageSquareHeart,
    ListChecks,
    Brain,
    Image,
    Briefcase,
    LogOut,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../../utils/cn'
import { useAuth } from '../../contexts/AuthContext'
import { FeedbackModal } from '../student-cta/FeedbackModal'
import {
    ADMIN_ALUMNI_PATH,
    ADMIN_DASHBOARD_PATH,
    ADMIN_MASTER_QUESTIONS_PATH,
    ADMIN_SUBMISSIONS_PATH,
    ADMIN_TRANSCRIPTS_PATH,
} from '../../config/constants'

const adminLinks = [
    { to: ADMIN_DASHBOARD_PATH, label: 'Placements Overview', icon: LayoutDashboard },
    { to: ADMIN_MASTER_QUESTIONS_PATH, label: 'Q&A Management', icon: ListChecks },
    { to: ADMIN_TRANSCRIPTS_PATH, label: 'Interview Transcript Analyser', icon: FileText },
    { to: ADMIN_ALUMNI_PATH, label: 'Alumni Interview Experiences', icon: Users },
    { to: ADMIN_SUBMISSIONS_PATH, label: 'Feedback from Students', icon: MessageSquareHeart },
    { to: '/posters', label: 'Academy Hiring Pulse', icon: Image },
]

const studentLinks = [
    { to: '/qa', label: 'Placement Doubts', icon: MessageCircle },
    { to: '/alumni-journey', label: 'Academy Alumni', icon: Users },
    { to: '/hiring-pulse', label: 'Academy Hiring Pulse++', icon: Briefcase },
    { to: '/interview-intelligence', label: 'NxtWave Interview Intelligence', icon: Brain },
]

const studentViewLinks = [
    { to: '/student-preview', label: 'Students Placement Overview', icon: LayoutDashboard },
    ...studentLinks,
]

interface SidebarProps {
    open: boolean
    onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const { role, logout } = useAuth()
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    const isAdmin = role === 'admin'

    const renderLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) => (
        <NavLink
            key={to}
            to={to}
            end={to === ADMIN_DASHBOARD_PATH}
            className={({ isActive }) => cn('sidebar-link group', isActive && 'active')}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={18}
                        className={cn(
                            'shrink-0 transition-colors',
                            isActive ? 'text-[#0b4b8c]' : 'text-slate-400 group-hover:text-[#0b4b8c]'
                        )}
                    />
                    {label}
                </>
            )}
        </NavLink>
    )

    const content = (
        <>
            {/* Logo */}
            <div className="flex flex-col items-center px-2 py-4 bg-[#0b4b8c] mb-4">
                <div className="w-full h-12 rounded-lg flex items-center justify-center">
                    <img
                        src="https://d14qv6cm1t62pm.cloudfront.net/programs/v2/nxtwave_academy_logo_v2.png"
                        alt="Academy-logo"
                        className="h-14 w-auto object-contain"
                    />
                </div>
                <div className="mt-2 text-center">
                    <p className="text-white font-black text-sm tracking-tight">Placements IQ</p>
                    <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Intelligence Portal</p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 no-scrollbar">
                {isAdmin ? (
                    <>
                        {/* Operational Hub */}
                        <div className="space-y-1">
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Operational Hub</p>
                            {adminLinks.map(renderLink)}
                        </div>

                        {/* Student View */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-4 mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Student View</span>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            {studentViewLinks.map(renderLink)}
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        {renderLink({ to: '/', label: 'Placements Overview', icon: LayoutDashboard })}
                        {studentLinks.map(renderLink)}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
                {role === 'admin' && (
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-slate-500 bg-white/70 border border-slate-200 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all uppercase tracking-widest group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Sign Out
                    </button>
                )}
                <button
                    onClick={() => setFeedbackOpen(true)}
                    className="relative overflow-hidden w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 transition-all duration-200 shadow-md shadow-amber-100/60"
                >
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-full animate-shimmer bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)]" />
                    <MessageSquareHeart className="w-3.5 h-3.5 shrink-0" />
                    We value your Feedback
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Desktop sidebar — always visible on lg+ */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-[#dbeafe]/60 border-r border-blue-100 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {content}
            </aside>

            {/* Mobile drawer — Radix Dialog, only below lg */}
            <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in" />
                    <Dialog.Content className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-white border-r border-blue-100 z-50 lg:hidden animate-slide-in-left focus:outline-none">
                        <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                        <Dialog.Description className="sr-only">Main navigation menu</Dialog.Description>
                        {content}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    )
}
