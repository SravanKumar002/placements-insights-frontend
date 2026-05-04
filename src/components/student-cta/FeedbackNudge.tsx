import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquareHeart, X } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

interface NudgePage {
    label: string
    emoji: string
    feedbackPage: string
}

const NUDGE_PAGES: Record<string, NudgePage> = {
    '/qa': { label: 'Placement Doubts', emoji: '💬', feedbackPage: 'Placement Doubts' },
    '/alumni-journey': { label: 'Academy Alumni', emoji: '🎓', feedbackPage: 'Academy Alumni' },
    '/hiring-pulse': { label: 'Academy Hiring Pulse++', emoji: '📊', feedbackPage: 'Academy Hiring Pulse++' },
    '/interview-intelligence': { label: 'NxtWave Interview Intelligence', emoji: '🧠', feedbackPage: 'NxtWave Interview Intelligence' },
}

// Delay on first entry to a tracked page
const INITIAL_DELAY_MS = 8000

// Repeat nudge interval after each dismissal while staying on the same page
const REPEAT_INTERVAL_MS = 3 * 60 * 1000
const storageKey = (path: string) => `feedback_nudge_${path}`

function hasFeedbackGiven(path: string): boolean {
    try {
        const raw = localStorage.getItem(storageKey(path))
        if (!raw) return false
        return JSON.parse(raw).feedbackGiven === true
    } catch {
        return false
    }
}

function markFeedbackGiven(path: string) {
    localStorage.setItem(storageKey(path), JSON.stringify({ feedbackGiven: true }))
}

export function FeedbackNudge({ role }: { role: string | null }) {
    const location = useLocation()
    const [visible, setVisible] = useState(false)
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [activePage, setActivePage] = useState<NudgePage | null>(null)
    const [activePath, setActivePath] = useState('')
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const nudgeRef = useRef<HTMLDivElement>(null)

    // Registered at mount (before any Radix dialog opens), so it fires first in the
    // capture phase. When a pointerdown targets the nudge overlay, we stop other
    // document-level capture listeners (including Radix DismissableLayer) from seeing
    // the event — this prevents Radix from calling event.preventDefault() which would
    // kill the subsequent click event on the nudge buttons.
    useEffect(() => {
        const handler = (e: PointerEvent) => {
            if (nudgeRef.current?.contains(e.target as Node)) {
                e.stopImmediatePropagation()
            }
        }
        document.addEventListener('pointerdown', handler, { capture: true })
        return () => document.removeEventListener('pointerdown', handler, { capture: true })
    }, [])

    const clearTimer = () => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const scheduleNudge = (path: string, delayMs: number) => {
        clearTimer()
        console.log(`[FeedbackNudge] Scheduling nudge for "${path}" in ${delayMs / 1000}s...`)
        timerRef.current = setTimeout(() => {
            console.log(`[FeedbackNudge] Showing nudge for "${path}"`)
            setVisible(true)
        }, delayMs)
    }

    useEffect(() => {
        if (role !== 'student') {
            console.log(`[FeedbackNudge] role="${role}" — nudge only runs for students. Skipping.`)
            return
        }

        const config = NUDGE_PAGES[location.pathname]
        if (!config) {
            console.log(`[FeedbackNudge] "${location.pathname}" is not a tracked page. No nudge.`)
            clearTimer()
            setVisible(false)
            return
        }

        if (hasFeedbackGiven(location.pathname)) {
            console.log(`[FeedbackNudge] "${location.pathname}" — feedback already given. Suppressed forever.`)
            return
        }

        setVisible(false)
        setActivePage(config)
        setActivePath(location.pathname)

        scheduleNudge(location.pathname, INITIAL_DELAY_MS)

        return () => {
            console.log(`[FeedbackNudge] Left "${location.pathname}" — timer cleared. Fresh 6s delay on return.`)
            clearTimer()
            setVisible(false)
        }
    }, [location.pathname, role])

    const handleSkip = () => {
        console.log(`[FeedbackNudge] "${activePath}" dismissed. Re-nudging in ${REPEAT_INTERVAL_MS / 60000} min if still on page.`)
        setVisible(false)
        scheduleNudge(activePath, REPEAT_INTERVAL_MS)
    }

    const handleGiveFeedback = () => {
        markFeedbackGiven(activePath)
        console.log(`[FeedbackNudge] "${activePath}" — feedback given. Nudge suppressed permanently for this page.`)
        setVisible(false)
        clearTimer()
        setFeedbackOpen(true)
    }

    if (!activePage) return null

    return (
        <>
            {visible && (
                <div ref={nudgeRef} className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-brand-200 w-full max-w-sm p-6 animate-slide-up">
                        {/* Close */}
                        <div className="flex justify-end mb-1">
                            <button
                                onClick={handleSkip}
                                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="text-center px-2 pb-2">
                            <span className="text-4xl">{activePage.emoji}</span>
                            <h2 className="mt-3 text-xl font-extrabold text-surface-900">
                                How was {activePage.label}?
                            </h2>
                            <p className="mt-1.5 text-sm text-surface-500">
                                Your feedback helps us improve the experience for all students.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-5">
                            <button
                                onClick={handleGiveFeedback}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                            >
                                <MessageSquareHeart className="w-4 h-4" />
                                Give Feedback
                            </button>
                            <button
                                onClick={handleSkip}
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-surface-500 hover:bg-surface-100 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <FeedbackModal
                isOpen={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
                defaultPage={activePage.feedbackPage}
            />
        </>
    )
}
