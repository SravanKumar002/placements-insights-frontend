import { StatsOverview } from '../components/dashboard/StatsOverview'
import { SessionDateSetter } from '../components/dashboard/SessionDateSetter'
import { CWCRegistrationsTrendChart } from '../components/dashboard/CWCRegistrationsTrendChart'
import { StudentHomepage } from '../components/dashboard/student/StudentHomepage'
import { LayoutDashboard, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { DailyLoginsChart } from '../components/dashboard/DailyLoginsChart'
import { QAFeedbackSection } from '../components/dashboard/QAFeedbackSection'
import { PageEngagementSection } from '../components/dashboard/PageEngagementSection'
import { PeakActivityInsight } from '../components/dashboard/PeakActivityInsight'

export function DashboardPage() {
    const { role } = useAuth()

    if (role !== 'admin') {
        return <StudentHomepage />
    }

    return (
        <div className="animate-fade-in -m-4 lg:-m-6 p-6 lg:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="border-b border-blue-100 pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase">
                                <LayoutDashboard size={16} strokeWidth={3} />
                                <span>Platform Performance Hub</span>
                            </div>
                            <h1 className="text-4xl font-light text-slate-900 leading-tight tracking-tight">
                                Placements <span className="font-bold text-blue-900 underline decoration-blue-200 underline-offset-8">Overview</span>
                            </h1>
                            <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed italic">
                                Real-time overview of <span className="text-blue-600 font-bold">student engagement</span>.
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live System Status
                        </div>
                    </div>
                </header>

                {/* Top Vitals */}
                <StatsOverview />

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Track: 8 cols */}
                    <div className="lg:col-span-8 space-y-8">
                        <DailyLoginsChart />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PageEngagementSection />
                            <QAFeedbackSection />
                        </div>
                    </div>

                    {/* Right Track: 4 cols */}
                    <div className="lg:col-span-4 space-y-6">
                        <SessionDateSetter />
                        <CWCRegistrationsTrendChart />
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
                            <Star className="w-5 h-5 fill-emerald-600 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-black text-emerald-900">Success Highlight</h5>
                                <p className="text-[10px] text-emerald-700 leading-relaxed mt-1">"Job Search" drives 96% positive sentiment, marking it as the most helpful category.</p>
                            </div>
                        </div>
                        <PeakActivityInsight />
                    </div>
                </div>

            </div>
        </div>
    )
}
