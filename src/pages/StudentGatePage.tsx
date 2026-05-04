import { Link } from 'react-router-dom'
import { Lock, GraduationCap, BookOpen, Users } from 'lucide-react'
import { APP_NAME } from '../config/constants'

const SSO_URL = 'https://meetings.ccbp.in/mid/nxtwave_placements_insights'

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

                        {/* SSO Button */}
                        <a
                            href={SSO_URL}
                            className="relative overflow-hidden w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold text-sm transition-all duration-200 shadow-md shadow-amber-200/60 hover:shadow-lg hover:shadow-amber-200/80 hover:-translate-y-0.5"
                        >
                            <span className="pointer-events-none absolute inset-y-0 left-0 w-full animate-shimmer bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)]" />
                            <img
                                src="https://d14qv6cm1t62pm.cloudfront.net/logos/Nxtwave_90_48.png?q=80&auto=format%2C+compress"
                                alt=""
                                className="h-4 w-auto"
                            />
                            Continue with NxtWave
                        </a>

                        <p className="text-xs text-surface-400 mt-3">
                            Login using your registered mobile number & OTP
                        </p>
                    </div>
                </div>

                {/* Admin link */}
                <Link
                    to="/login"
                    className="mt-5 text-xs text-surface-400 hover:text-surface-600 transition-colors"
                >
                    Admin access →
                </Link>
            </div>
        </div>
    )
}
