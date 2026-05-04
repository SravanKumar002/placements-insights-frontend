import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Monorepo: keep a single repo-root `.env` for local dev (VITE_* + server secrets).
  envDir: '..',
})
