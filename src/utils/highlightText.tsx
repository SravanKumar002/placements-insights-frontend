import React from 'react'

const COLOR_STYLES: Record<string, { background: string; color: string }> = {
    yellow: { background: '#fef08a', color: '#713f12' },
    green:  { background: '#bbf7d0', color: '#14532d' },
    blue:   { background: '#bfdbfe', color: '#1e3a8a' },
    orange: { background: '#fed7aa', color: '#7c2d12' },
}

/**
 * Parses [hl:color]text[/hl] tags in a string and returns React nodes
 * with colored <mark> elements. Untagged text is returned as-is.
 */
export function parseHighlights(text: string): React.ReactNode {
    const regex = /\[hl:(yellow|green|blue|orange)\]([\s\S]*?)\[\/hl\]/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index))
        }
        const style = COLOR_STYLES[match[1]] ?? COLOR_STYLES.yellow
        parts.push(
            <mark
                key={match.index}
                style={{
                    ...style,
                    borderRadius: '3px',
                    padding: '0 2px',
                    fontWeight: 600,
                }}
            >
                {match[2]}
            </mark>
        )
        lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
}

/**
 * Wraps the selected slice of `text` with a highlight tag of the given color.
 */
export function applyHighlight(text: string, start: number, end: number, color: string): string {
    if (start >= end) return text
    return text.slice(0, start) + `[hl:${color}]` + text.slice(start, end) + `[/hl]` + text.slice(end)
}

export const HIGHLIGHT_COLORS = [
    { key: 'yellow', bg: '#fef08a', label: 'Yellow' },
    { key: 'green',  bg: '#bbf7d0', label: 'Green'  },
    { key: 'blue',   bg: '#bfdbfe', label: 'Blue'   },
    { key: 'orange', bg: '#fed7aa', label: 'Orange'  },
] as const
