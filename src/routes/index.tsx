import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { LoginPage } from '../pages/LoginPage'
import { AuthCallbackPage } from '../pages/AuthCallbackPage'
import { DashboardPage } from '../pages/DashboardPage'
import { AllQAPage } from '../pages/AllQAPage'
import { QACategoryPage } from '../pages/QACategoryPage'
import { TranscriptsPage } from '../pages/TranscriptsPage'
import { TranscriptDetailPage } from '../pages/TranscriptDetailPage'
import { AlumniListPage } from '../pages/AlumniListPage'
import { AlumniDetailPage } from '../pages/AlumniDetailPage'
import { AlumniJourneyPage } from '../pages/AlumniJourneyPage'
import { InterviewIntelligencePage } from '../pages/InterviewIntelligencePage'
import { SearchResultsPage } from '../pages/SearchResultsPage'
import { CWCRegistrationPage } from '../pages/CWCRegistrationPage'
import { StudentSubmissionsPage } from '../pages/StudentSubmissionsPage'
import { MasterQuestionsPage } from '../pages/MasterQuestionsPage'
import { PostersPage } from '../pages/PostersPage'
import { HiringPulsePage } from '../pages/HiringPulsePage'
import { StudentHomepage } from '../components/dashboard/student/StudentHomepage'
import { StudentGatePage } from '../pages/StudentGatePage'
import { PLACEMENTS_OVERVIEW_PATH } from '../config/constants'
import { Loader2 } from 'lucide-react'

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { loading, role } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        )
    }

    // Not verified through NxtWave SSO and not an admin → stay on this origin (student gate + admin link)
    if (role === null) {
        return <StudentGatePage />
    }

    return <>{children}</>
}

export function AppRoutes() {
    return (
        <Routes>
            {/* Public — no auth needed */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* App routes — require a role (student or admin) */}
            <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                {/* Both student and admin */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/qa" element={<AllQAPage />} />
                <Route path="/qa/:category" element={<QACategoryPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/alumni-journey" element={<AlumniJourneyPage />} />
                <Route path="/interview-intelligence" element={<InterviewIntelligencePage />} />
                <Route path="/register" element={<CWCRegistrationPage />} />
                <Route path="/hiring-pulse" element={<HiringPulsePage />} />

                <Route path="/student-preview" element={<StudentHomepage />} />

                {/* Admin only */}
<Route path="/posters" element={<PostersPage />} />
<Route path="/transcripts" element={<ProtectedRoute allowedRoles={['admin']}><TranscriptsPage /></ProtectedRoute>} />
                <Route path="/transcripts/:id" element={<ProtectedRoute allowedRoles={['admin']}><TranscriptDetailPage /></ProtectedRoute>} />
                <Route path="/alumni" element={<ProtectedRoute allowedRoles={['admin']}><AlumniListPage /></ProtectedRoute>} />
                <Route path="/alumni/:id" element={<ProtectedRoute allowedRoles={['admin']}><AlumniDetailPage /></ProtectedRoute>} />
                <Route path="/submissions" element={<ProtectedRoute allowedRoles={['admin']}><StudentSubmissionsPage /></ProtectedRoute>} />
                <Route path="/master-questions" element={<ProtectedRoute allowedRoles={['admin']}><MasterQuestionsPage /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={PLACEMENTS_OVERVIEW_PATH} replace />} />
        </Routes>
    )
}
