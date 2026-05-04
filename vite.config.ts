import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(frontendDir, '..')
const monorepoRootEnv = path.join(repoRoot, '.env')

/** Merge .env files + process.env (Vercel / CI inject VITE_* into process.env at build time). */
function mergedViteEnv(mode: string): Record<string, string> {
    const fromFiles: Record<string, string> = {
        ...loadEnv(mode, repoRoot, 'VITE_'),
        ...loadEnv(mode, frontendDir, 'VITE_'),
    }
    const out = { ...fromFiles }
    for (const [k, v] of Object.entries(process.env)) {
        if (k.startsWith('VITE_') && typeof v === 'string' && v.length > 0) {
            out[k] = v
        }
    }
    return out
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const viteEnv = mergedViteEnv(mode)
    const define: Record<string, string> = {}
    for (const [key, val] of Object.entries(viteEnv)) {
        define[`import.meta.env.${key}`] = JSON.stringify(val)
    }

    return {
        plugins: [react()],
        envDir: existsSync(monorepoRootEnv) ? repoRoot : frontendDir,
        define,
    }
})
