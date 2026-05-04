import { useState, useEffect } from 'react'

interface TypewriterTextProps {
    text: string
    speed?: number   // ms per character
    delay?: number   // ms before starting
    className?: string
    showCursor?: boolean
}

export function TypewriterText({ text, speed = 28, delay = 200, className, showCursor = true }: TypewriterTextProps) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)

    useEffect(() => {
        setDisplayed('')
        setDone(false)
        let i = 0
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                i++
                setDisplayed(text.slice(0, i))
                if (i >= text.length) {
                    clearInterval(interval)
                    setDone(true)
                }
            }, speed)
            return () => clearInterval(interval)
        }, delay)
        return () => clearTimeout(timeout)
    }, [text, speed, delay])

    return (
        <span className={className}>
            {displayed}
            {showCursor && !done && (
                <span className="inline-block w-px h-[1em] bg-current align-middle ml-0.5 animate-pulse" />
            )}
        </span>
    )
}
