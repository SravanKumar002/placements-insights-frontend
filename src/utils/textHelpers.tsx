/**
 * Formats a string into an array of bullet points.
 * Splits by newlines or existing bullet characters.
 */
export function formatAsBullets(text: string | null | undefined): string[] {
    if (!text) return []

    // Split by common bullet characters or newlines
    const points = text.split(/[\n•·\-\*]/)

    return points
        .map(p => p.trim())
        .filter(p => p.length > 0)
}

/**
 * Renders a list of bullet points from a string.
 */
export function renderBullets(text: string | null | undefined) {
    const points = formatAsBullets(text)
    if (points.length === 0) return null

    return (
        <ul className="space-y-1.5 mt-2">
            {points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-surface-600">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span>{point}</span>
                </li>
            ))}
        </ul>
    )
}
