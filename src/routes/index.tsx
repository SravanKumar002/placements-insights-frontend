import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
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
import { AdminPlacementUserPage } from '../pages/AdminPlacementUserPage'
import { MasterQuestionsPage } from '../pages/MasterQuestionsPage'
import { PostersPage } from '../pages/PostersPage'
import { HiringPulsePage } from '../pages/HiringPulsePage'
import { StudentHomepage } from '../components/dashboard/student/StudentHomepage'
import { StudentGatePage } from '../pages/StudentGatePage'
import { AdminOnlyLayout } from '../components/auth/AdminOnlyLayout'
import {
    AUTH_CALLBACK_PATH,
    PLACEMENTS_OVERVIEW_PATH,
    ADMIN_BASE_PATH,
    ADMIN_DASHBOARD_PATH,
    ADMIN_MASTER_QUESTIONS_PATH,
    ADMIN_TRANSCRIPTS_PATH,
    ADMIN_ALUMNI_PATH,
    ADMIN_SUBMISSIONS_PATH,
    ADMIN_PLACEMENT_USER_PATH,
} from '../config/constants'
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

    if (role === null) {
        return <StudentGatePage />
    }

    return <>{children}</>
}

/** Students stay on `/`; signed-in admins use the `/admin/...` hub */
function RootHome() {
    const { role, loading } = useAuth()
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        )
    }
    if (role === 'admin') {
        return <Navigate to={ADMIN_DASHBOARD_PATH} replace />
    }
    return <DashboardPage />
}

function LegacyTranscriptDetailRedirect() {
    const { id } = useParams()
    return <Navigate to={id ? `${ADMIN_TRANSCRIPTS_PATH}/${id}` : ADMIN_TRANSCRIPTS_PATH} replace />
}

function LegacyAlumniDetailRedirect() {
    const { id } = useParams()
    return <Navigate to={id ? `${ADMIN_ALUMNI_PATH}/${id}` : ADMIN_ALUMNI_PATH} replace />
}

/**
 * Backend / email links often use `/?auth_token=…` but exchange logic lives on `/auth/callback`.
 * Redirect first so we never flash the student gate.
 */
export function AppWithAuthTokenRedirect() {
    const location = useLocation()
    if (location.pathname !== AUTH_CALLBACK_PATH) {
        const params = new URLSearchParams(location.search)
        if (params.get('auth_token')) {
            return (
                <Navigate
                    to={{ pathname: AUTH_CALLBACK_PATH, search: location.search, hash: location.hash }}
                    replace
                />
            )
        }
    }
    return <AppRoutes />
}

export function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path={ADMIN_BASE_PATH} element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Admin panel (Supabase admin session required) */}
            <Route element={<AdminOnlyLayout />}>
                <Route path={ADMIN_DASHBOARD_PATH} element={<DashboardPage />} />
                <Route path={ADMIN_MASTER_QUESTIONS_PATH} element={<MasterQuestionsPage />} />
                <Route path={ADMIN_TRANSCRIPTS_PATH} element={<TranscriptsPage />} />
                <Route path={`${ADMIN_TRANSCRIPTS_PATH}/:id`} element={<TranscriptDetailPage />} />
                <Route path={ADMIN_ALUMNI_PATH} element={<AlumniListPage />} />
                <Route path={`${ADMIN_ALUMNI_PATH}/:id`} element={<AlumniDetailPage />} />
                <Route path={ADMIN_SUBMISSIONS_PATH} element={<StudentSubmissionsPage />} />
                <Route path={ADMIN_PLACEMENT_USER_PATH} element={<AdminPlacementUserPage />} />
            </Route>

            {/* Old admin URLs → /admin/... */}
            <Route path="/master-questions" element={<Navigate to={ADMIN_MASTER_QUESTIONS_PATH} replace />} />
            <Route path="/transcripts" element={<Navigate to={ADMIN_TRANSCRIPTS_PATH} replace />} />
            <Route path="/transcripts/:id" element={<LegacyTranscriptDetailRedirect />} />
            <Route path="/alumni" element={<Navigate to={ADMIN_ALUMNI_PATH} replace />} />
            <Route path="/alumni/:id" element={<LegacyAlumniDetailRedirect />} />
            <Route path="/submissions" element={<Navigate to={ADMIN_SUBMISSIONS_PATH} replace />} />

            {/* App routes — student (and admin preview of student experiences) */}
            <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                <Route path="/" element={<RootHome />} />
                <Route path="/qa" element={<AllQAPage />} />
                <Route path="/qa/:category" element={<QACategoryPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/alumni-journey" element={<AlumniJourneyPage />} />
                <Route path="/interview-intelligence" element={<InterviewIntelligencePage />} />
                <Route path="/register" element={<CWCRegistrationPage />} />
                <Route path="/hiring-pulse" element={<HiringPulsePage />} />
                <Route path="/student-preview" element={<StudentHomepage />} />
                <Route path="/posters" element={<PostersPage />} />
            </Route>

            <Route path="*" element={<Navigate to={PLACEMENTS_OVERVIEW_PATH} replace />} />
        </Routes>
    )
}
