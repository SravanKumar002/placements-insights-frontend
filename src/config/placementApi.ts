/**
 * Placement **backend** (Express) is deployed separately from this Vite app.
 * The browser talks to it only via this base URL — never embed service_role or TOKEN_SECRET here.
 */
export function getPlacementApiBaseUrl(): string {
    const raw = import.meta.env.VITE_PLACEMENT_API_URL
    if (raw == null || String(raw).trim() === '') return ''
    return String(raw).trim().replace(/\/+$/, '')
}

export function isPlacementApiConfigured(): boolean {
    return getPlacementApiBaseUrl() !== ''
}
