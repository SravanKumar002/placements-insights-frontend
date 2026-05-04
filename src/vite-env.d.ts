/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    /** Base URL of the Placement Express API (no trailing slash). Browser-only; never put service keys here. */
    readonly VITE_PLACEMENT_API_URL?: string
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_BRANDFETCH_CLIENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
