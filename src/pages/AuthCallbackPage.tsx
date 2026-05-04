import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PLACEMENTS_OVERVIEW_PATH } from '../config/constants'
import { isPlacementApiConfigured } from '../config/placementApi'
import { validatePlacementAuthCode } from '../services/placementAuthService'

const SESSION_KEY = 'nw_student_session'
const SESSION_DAYS = 30

export type StudentSession = {
    verified: boolean
    ts: number
    userId?: string | null
}

export function setStudentSession(opts?: { userId?: string | null }) {
    const session: StudentSession = {
        verified: true,
        ts: Date.now(),
        userId: opts?.userId ?? null,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getStudentSession(): boolean {
    try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (!raw) return false
        const session = JSON.parse(raw) as StudentSession
        const expiry = SESSION_DAYS * 24 * 60 * 60 * 1000
        return session.verified === true && Date.now() - session.ts < expiry
    } catch {
        return false
    }
}

export function getPlacementExchangeUserId(): string | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (!raw) return null
        const session = JSON.parse(raw) as StudentSession
        return typeof session.userId === 'string' && session.userId.length > 0 ? session.userId : null
    } catch {
        return null
    }
}

export function clearStudentSession() {
    localStorage.removeItem(SESSION_KEY)
}

export function AuthCallbackPage() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        const run = async () => {
            const params = new URLSearchParams(window.location.search)
            const authToken = params.get('auth_token')
            const legacyToken = params.get('token')
            const mobile = params.get('mobile')

            // Placement backend: one-time exchange token (separate deploy from this Vite app)
            if (authToken) {
                if (!isPlacementApiConfigured()) {
                    setError(
                        'This app is not configured with VITE_PLACEMENT_API_URL. Add it to your environment and rebuild.'
                    )
                    return
                }
                try {
                    const result = await validatePlacementAuthCode(authToken)
                    if (cancelled) return
                    if (!result.valid) {
                        setError(result.reason ?? 'Invalid or expired link.')
                        return
                    }
                    setStudentSession({ userId: result.user_id })
                    navigate(PLACEMENTS_OVERVIEW_PATH, { replace: true })
                    return
                } catch (e) {
                    if (cancelled) return
                    setError(e instanceof Error ? e.message : 'Verification failed.')
                    return
                }
            }

            // NxtWave SSO callback (no Placement exchange token) — only when SSO actually sent params
            if (legacyToken || mobile) {
                console.log('SSO callback received', { token: legacyToken, mobile })
                setStudentSession()
                navigate(PLACEMENTS_OVERVIEW_PATH, { replace: true })
                return
            }

            navigate(PLACEMENTS_OVERVIEW_PATH, { replace: true })
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [navigate])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <div className="max-w-md text-center space-y-4">
                    <p className="text-sm text-red-600">{error}</p>
                    <Link
                        to="/"
                        className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                        Back to home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                <p className="text-sm text-surface-500">Verifying your NxtWave account...</p>
            </div>
        </div>
    )
}
