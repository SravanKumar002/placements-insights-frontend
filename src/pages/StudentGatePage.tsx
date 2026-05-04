import { Link } from 'react-router-dom'
import { Lock, GraduationCap, BookOpen, Users } from 'lucide-react'
import { APP_NAME, ADMIN_BASE_PATH, PLACEMENTS_OVERVIEW_PATH } from '../config/constants'

const FEATURES = [
    { icon: <GraduationCap className="w-4 h-4" />, text: 'Alumni journeys & placement stories' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Common placement doubts answered' },
    { icon: <Users className="w-4 h-4" />, text: 'Real interview experiences' },
]

export function StudentGatePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-brand-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm flex flex-col items-center">

                {/* Logo */}
                <div className="flex items-center gap-3 mb-6">
                    <img
                        src="https://d14qv6cm1t62pm.cloudfront.net/logos/Nxtwave_90_48.png?q=80&auto=format%2C+compress"
                        alt="NxtWave"
                        className="h-9 w-auto"
                    />
                </div>

                {/* Card */}
                <div className="w-full bg-white rounded-2xl shadow-xl shadow-brand-100/40 border border-surface-200 overflow-hidden">

                    {/* Top accent */}
                    <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-amber-400 to-brand-500" />

                    <div className="p-7 flex flex-col items-center text-center">

                        {/* Lock icon */}
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-brand-500" />
                        </div>

                        <h1 className="text-xl font-extrabold text-surface-900 leading-tight">{APP_NAME}</h1>
                        <p className="text-sm text-surface-500 mt-1 mb-5">
                            Exclusively for NxtWave registered students
                        </p>

                        {/* Feature list */}
                        <ul className="w-full space-y-2.5 mb-6 text-left">
                            {FEATURES.map(f => (
                                <li key={f.text} className="flex items-center gap-2.5 text-sm text-surface-600">
                                    <span className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
                                        {f.icon}
                                    </span>
                                    {f.text}
                                </li>
                            ))}
                        </ul>

                        <p className="text-sm text-surface-600 mb-4">
                            Use your program entry link below to open the student experience, or admin sign-in.
                        </p>

                        <Link
                            to={`${PLACEMENTS_OVERVIEW_PATH}?student=1`}
                            className="w-full flex items-center justify-center px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
                        >
                            Continue as student
                        </Link>
                    </div>
                </div>

                {/* Admin link */}
                <Link
                    to={ADMIN_BASE_PATH}
                    className="mt-5 text-xs text-surface-400 hover:text-surface-600 transition-colors"
                >
                    Admin access →
                </Link>
            </div>
        </div>
    )
}
