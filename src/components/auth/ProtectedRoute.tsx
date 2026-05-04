import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    allowedRoles: Role[]
    children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const { role, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        )
    }

    if (!role) return <Navigate to="/" replace />
    if (!allowedRoles.includes(role)) return <Navigate to="/" replace />

    return <>{children}</>
}
