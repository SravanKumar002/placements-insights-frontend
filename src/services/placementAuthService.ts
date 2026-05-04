import { getPlacementApiBaseUrl } from '../config/placementApi'

export type ValidateAuthCodeResponse = {
    valid: boolean
    user_id: string | null
    reason: string | null
}

/** Calls the Node Placement API (not Supabase directly). */
export async function validatePlacementAuthCode(authToken: string): Promise<ValidateAuthCodeResponse> {
    const base = getPlacementApiBaseUrl()
    if (!base) {
        throw new Error('VITE_PLACEMENT_API_URL is not set — add it to .env for the student auth link flow.')
    }
    const res = await fetch(`${base}/api/auth/validate-auth-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_token: authToken }),
    })
    const text = await res.text()
    let body: unknown
    try {
        body = text ? JSON.parse(text) : null
    } catch {
        throw new Error(text || `HTTP ${res.status}`)
    }
    if (!res.ok) {
        const msg =
            typeof body === 'object' && body !== null && 'message' in body
                ? String((body as { message: unknown }).message)
                : text
        throw new Error(msg || `HTTP ${res.status}`)
    }
    const o = body as Partial<ValidateAuthCodeResponse>
    return {
        valid: Boolean(o.valid),
        user_id: typeof o.user_id === 'string' ? o.user_id : null,
        reason: o.reason == null ? null : String(o.reason),
    }
}
