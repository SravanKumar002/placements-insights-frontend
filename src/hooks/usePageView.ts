import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { trackPageView, trackPageTime } from '../services/analyticsService'

const PAGE_LABELS: Record<string, string> = {
    '/qa': 'Placement Doubts',
    '/alumni-journey': 'Academy Alumni',
    '/hiring-pulse': 'Academy Hiring Pulse++',
    '/interview-intelligence': 'Interview Intelligence',
    '/posters': 'Academy Hiring Pulse (Old)',
}

function getLabel(pathname: string): string | null {
    if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname]
    if (pathname.startsWith('/qa/')) return `Q&A: ${decodeURIComponent(pathname.slice(4))}`
    return null
}

export function usePageView() {
    const { pathname } = useLocation()
    const { role } = useAuth()

    // Refs to track active time
    const activeStartRef = useRef<number>(0)
    const accumulatedRef = useRef<number>(0)
    const currentPathRef = useRef<string>('')

    // Refs for external link detection
    const externalClickTimeRef = useRef<number>(0)
    const hiddenAtRef = useRef<number>(0)

    // Flush accumulated time to the server
    const flushTime = useCallback(() => {
        // Add any currently running active segment
        if (activeStartRef.current > 0) {
            accumulatedRef.current += (Date.now() - activeStartRef.current) / 1000
            activeStartRef.current = Date.now() // reset for next segment
        }
        const seconds = Math.round(accumulatedRef.current)
        const path = currentPathRef.current
        if (seconds > 0 && path) {
            trackPageTime(path, seconds)
        }
        accumulatedRef.current = 0
    }, [])

    // Track page view + start timer
    useEffect(() => {
        if (role !== 'student') return

        const label = getLabel(pathname)

        // Flush time for the previous page
        flushTime()

        // Track page view for the new page
        if (label) trackPageView(pathname, label)

        // Start timing new page
        currentPathRef.current = pathname
        accumulatedRef.current = 0
        activeStartRef.current = Date.now()
        externalClickTimeRef.current = 0
        hiddenAtRef.current = 0

        // Track external link clicks so we can count reading time for those URLs
        const handleExternalClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a')
            if (anchor && anchor.target === '_blank') {
                externalClickTimeRef.current = Date.now()
            }
        }

        // Visibility change handler — pause/resume timer
        const handleVisibility = () => {
            if (document.hidden) {
                // Tab became hidden — accumulate active time and pause
                if (activeStartRef.current > 0) {
                    accumulatedRef.current += (Date.now() - activeStartRef.current) / 1000
                    activeStartRef.current = 0
                }
                hiddenAtRef.current = Date.now()
            } else {
                // Tab became visible — check if hidden because of an external link click
                const timeSinceClick = hiddenAtRef.current - externalClickTimeRef.current
                const wasExternalNavigation = externalClickTimeRef.current > 0
                    && timeSinceClick >= 0
                    && timeSinceClick < 2000 // link click → tab hide must be within 2s

                if (wasExternalNavigation && hiddenAtRef.current > 0) {
                    // Count time reading the external URL, capped at 10 minutes
                    const MAX_EXTERNAL_SECONDS = 10 * 60
                    const bgTime = Math.min((Date.now() - hiddenAtRef.current) / 1000, MAX_EXTERNAL_SECONDS)
                    accumulatedRef.current += bgTime
                }

                externalClickTimeRef.current = 0
                hiddenAtRef.current = 0
                // Resume timer
                activeStartRef.current = Date.now()
            }
        }

        // Before unload — flush remaining time
        const handleBeforeUnload = () => flushTime()

        document.addEventListener('click', handleExternalClick)
        document.addEventListener('visibilitychange', handleVisibility)
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            document.removeEventListener('click', handleExternalClick)
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [pathname, role, flushTime])
}
