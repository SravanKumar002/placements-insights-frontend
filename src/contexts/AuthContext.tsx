import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { trackStudentLogin } from '../services/analyticsService'
import { getStudentSession } from '../pages/AuthCallbackPage'

export type Role = 'student' | 'admin'

/** When true, unauthenticated users are treated as students (no NxtWave SSO gate). Set in Vercel for open demo deploys. */
function openStudentAccess(): boolean {
    return import.meta.env.VITE_OPEN_STUDENT_ACCESS === 'true'
}

const DIRECT_STUDENT_STORAGE_KEY = 'placement_insights_direct_student'

/** After visiting once with `?student=1`, browser remembers student access (no gate). */
function directStudentAccess(): boolean {
    try {
        return localStorage.getItem(DIRECT_STUDENT_STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

/** If URL has `?student=1`, persist flag and strip the param so `/` loads the student dashboard. */
function grantDirectStudentFromUrl(): void {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('student') !== '1') return
    try {
        localStorage.setItem(DIRECT_STUDENT_STORAGE_KEY, '1')
    } catch {
        /* quota / private mode */
    }
    params.delete('student')
    const qs = params.toString()
    const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
    window.history.replaceState({}, '', next)
}

function allowStudentWithoutGate(): boolean {
    return openStudentAccess() || directStudentAccess()
}

interface AuthState {
    role: Role | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const location = useLocation()

    // Supabase session changes (admin login/logout)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setRole('admin')
            } else {
                setRole(getStudentSession() || allowStudentWithoutGate() ? 'student' : null)
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    // Resolve role from session + `?student=1` entry link (re-runs when query changes, e.g. in-app link from gate)
    useEffect(() => {
        grantDirectStudentFromUrl()

        void supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setRole('admin')
            } else if (getStudentSession()) {
                setRole('student')
                if (!sessionStorage.getItem('student_login_tracked')) {
                    sessionStorage.setItem('student_login_tracked', '1')
                    trackStudentLogin()
                }
            } else if (allowStudentWithoutGate()) {
                setRole('student')
            } else {
                setRole(null)
            }
            setLoading(false)
        })
    }, [location.search])

    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setRole('admin')
        navigate('/')
    }, [navigate])

    const logout = useCallback(async () => {
        await supabase.auth.signOut()
        setRole(getStudentSession() || allowStudentWithoutGate() ? 'student' : null)
        navigate('/')
    }, [navigate])

    return (
        <AuthContext.Provider value={{ role, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
