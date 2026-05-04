import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Fingerprint, Loader2, Search, AlertCircle, CheckCircle2, Info, Copy } from 'lucide-react'
import { supabase } from '../config/supabase'
import { isPlacementApiConfigured } from '../config/placementApi'
import { validatePlacementAuthCode, type ValidateAuthCodeResponse } from '../services/placementAuthService'
import {
    getPlacementExchangeUserId,
    type StudentSession,
} from './AuthCallbackPage'

const SESSION_KEY = 'nw_student_session'

function readPlacementSession(): StudentSession | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (!raw) return null
        return JSON.parse(raw) as StudentSession
    } catch {
        return null
    }
}

export function AdminPlacementUserPage() {
    const [searchParams] = useSearchParams()
    const [tokenInput, setTokenInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [lookupResult, setLookupResult] = useState<ValidateAuthCodeResponse | null>(null)
    const [lookupError, setLookupError] = useState<string | null>(null)
    const [sessionSnap, setSessionSnap] = useState<StudentSession | null>(() => readPlacementSession())
    const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)

    useEffect(() => {
        void supabase.auth.getUser().then(({ data }) => {
            setSupabaseUserId(data.user?.id ?? null)
        })
    }, [])

    useEffect(() => {
        const q = searchParams.get('auth_token')
        if (q) setTokenInput(q)
    }, [searchParams])

    const refreshSessionSnapshot = () => setSessionSnap(readPlacementSession())

    const handleLookup = async () => {
        const token = tokenInput.trim()
        if (!token) {
            setLookupError('Paste an access token first.')
            setLookupResult(null)
            return
        }
        if (!isPlacementApiConfigured()) {
            setLookupError(
                'VITE_PLACEMENT_API_URL is not set. Add it in env and redeploy to resolve tokens against the database.'
            )
            setLookupResult(null)
            return
        }
        setLoading(true)
        setLookupError(null)
        setLookupResult(null)
        try {
            const res = await validatePlacementAuthCode(token)
            setLookupResult(res)
        } catch (e) {
            setLookupError(e instanceof Error ? e.message : 'Request failed')
        } finally {
            setLoading(false)
        }
    }

    const sessionUserId = getPlacementExchangeUserId()

    const copy = (text: string) => {
        void navigator.clipboard.writeText(text)
    }

    return (
        <div className="animate-fade-in max-w-2xl space-y-8">
            <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-[10px] uppercase mb-2">
                    <Fingerprint className="w-4 h-4" />
                    <span>Gamma / magic-link user</span>
                </div>
                <h1 className="text-2xl font-bold text-surface-900">Placement User ID</h1>
                <p className="text-sm text-surface-500 mt-1">
                    After a student opens your gamma link, the app stores the <strong>placement userId</strong> tied to the
                    one-time token in <code className="text-xs bg-slate-100 px-1 rounded">auth_exchange_tokens</code>. Look up
                    tokens or read the ID from this browser session.
                </p>
            </div>

            <div className="glass-card p-6 space-y-3">
                <h2 className="text-sm font-semibold text-surface-800 flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-500" />
                    Admin (Supabase) account
                </h2>
                <p className="text-xs text-surface-500">
                    This is your dashboard login — different from the placement <code className="text-xs">user_id</code> in
                    the exchange API.
                </p>
                {supabaseUserId ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 break-all flex-1 min-w-0">
                            {supabaseUserId}
                        </code>
                        <button
                            type="button"
                            onClick={() => copy(supabaseUserId)}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                            title="Copy"
                        >
                            <Copy className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-surface-400">—</p>
                )}
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-surface-800">Current browser — placement session</h2>
                <p className="text-xs text-surface-500">
                    If you (or a student) completed login via <code className="text-xs">?auth_token=…</code> on this browser, the
                    resolved userId is kept in local storage.
                </p>
                <button
                    type="button"
                    onClick={refreshSessionSnapshot}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                    Refresh
                </button>
                {sessionSnap && sessionSnap.verified ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-surface-500">Placement userId</span>
                            <span className="font-mono text-surface-900 break-all text-right">
                                {sessionUserId ?? '—'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs text-surface-400">
                            <span>Session age</span>
                            <span>{new Date(sessionSnap.ts).toLocaleString()}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-surface-500">No active placement session in this browser.</p>
                )}
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-surface-800">Resolve access token → userId (database)</h2>
                <p className="text-xs text-surface-500">
                    Calls your Placement API <code className="text-xs">POST /api/auth/validate-auth-code</code>, which reads{' '}
                    <code className="text-xs">auth_exchange_tokens</code> and returns the stored <code className="text-xs">user_id</code>.
                    Used tokens may show as invalid.
                </p>
                <textarea
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="Paste auth_token (hex from email/gamma link)"
                    rows={3}
                    className="input-field w-full font-mono text-sm"
                />
                <button
                    type="button"
                    onClick={() => void handleLookup()}
                    disabled={loading}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-4 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Look up userId
                </button>

                {lookupError && (
                    <div className="flex items-start gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {lookupError}
                    </div>
                )}

                {lookupResult && (
                    <div
                        className={`rounded-xl border p-4 text-sm ${
                            lookupResult.valid ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/80'
                        }`}
                    >
                        <div className="flex items-center gap-2 font-semibold text-surface-800 mb-2">
                            {lookupResult.valid ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Valid token
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    Not valid
                                </>
                            )}
                        </div>
                        <div className="space-y-1 font-mono text-xs">
                            <p>
                                <span className="text-surface-500">user_id (DB): </span>
                                {lookupResult.user_id ? (
                                    <span className="text-surface-900">{lookupResult.user_id}</span>
                                ) : (
                                    <span className="text-surface-400">null</span>
                                )}
                            </p>
                            {lookupResult.reason && (
                                <p>
                                    <span className="text-surface-500">reason: </span>
                                    {lookupResult.reason}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
