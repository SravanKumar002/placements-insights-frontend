import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ADMIN_BASE_PATH } from '../../config/constants'
import { AppLayout } from '../layout/AppLayout'
import { Loader2 } from 'lucide-react'

/** Wraps `AppLayout` + outlet; only signed-in admins; others go to `/admin` login. */
export function AdminOnlyLayout() {
    const { role, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        )
    }

    if (role !== 'admin') {
        return <Navigate to={ADMIN_BASE_PATH} replace />
    }

    return <AppLayout />
}
