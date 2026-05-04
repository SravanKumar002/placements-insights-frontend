import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Loader2, AlertCircle } from 'lucide-react'
import { APP_NAME, PLACEMENTS_OVERVIEW_PATH } from '../config/constants'

export function LoginPage() {
    const { role, login } = useAuth()
    const [email, setEmail] = useState('admin@nxtwave.co.in')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Already logged in as admin — go to dashboard
    if (role === 'admin') return <Navigate to={PLACEMENTS_OVERVIEW_PATH} replace />

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <img
                            src="https://d14qv6cm1t62pm.cloudfront.net/logos/Nxtwave_90_48.png?q=80&auto=format%2C+compress"
                            alt="NxtWave"
                            className="h-10 w-auto"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900">{APP_NAME}</h1>
                    <p className="text-sm text-surface-500 mt-1">Admin Access</p>
                </div>

                {/* Admin Login Card */}
                <div className="glass-card p-6">
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-surface-500" />
                            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Admin Login</span>
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email"
                            className="input-field w-full"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            className="input-field w-full"
                            required
                            autoFocus
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-500">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-2.5 text-sm font-semibold justify-center disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-surface-400 mt-6">NxtWave Placement Intelligence</p>
            </div>
        </div>
    )
}
