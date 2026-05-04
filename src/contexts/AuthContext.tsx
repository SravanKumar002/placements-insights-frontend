import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { trackStudentLogin } from '../services/analyticsService'
import { getStudentSession } from '../pages/AuthCallbackPage'

export type Role = 'student' | 'admin'

/** When true, unauthenticated users are treated as students (no NxtWave SSO gate). Set in Vercel for open demo deploys. */
function openStudentAccess(): boolean {
    return import.meta.env.VITE_OPEN_STUDENT_ACCESS === 'true'
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

    // Check existing session on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Has Supabase session → admin
                setRole('admin')
            } else if (getStudentSession()) {
                // Has valid NxtWave SSO session → student
                setRole('student')
                if (!sessionStorage.getItem('student_login_tracked')) {
                    sessionStorage.setItem('student_login_tracked', '1')
                    trackStudentLogin()
                }
            } else if (openStudentAccess()) {
                setRole('student')
            } else {
                // Not verified → show gate
                setRole(null)
            }
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setRole('admin')
            } else {
                // On admin logout, re-check student session / open-access mode
                setRole(getStudentSession() || openStudentAccess() ? 'student' : null)
            }
        })

        return () => subscription.unsubscribe()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setRole('admin')
        navigate('/')
    }, [navigate])

    const logout = useCallback(async () => {
        await supabase.auth.signOut()
        setRole(getStudentSession() || openStudentAccess() ? 'student' : null)
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
