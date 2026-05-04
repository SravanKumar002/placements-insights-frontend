/**
 * Cleans raw transcript text by removing silence/noise markers,
 * standalone timestamps, inline timestamps, and excessive blank lines.
 * Pure string manipulation — no API calls needed.
 *
 * Handles multiple transcript formats:
 *   - "[00:07:16] Speaker:" (bracket timestamps)
 *   - "00:07:16 Speaker:" (bare timestamps)
 *   - "- 3:15 Speaker:" (dash-prefixed timestamps)
 *   - "- 0:00 - 7:15 Silence" (range silence markers)
 */
export function cleanTranscript(text: string): string {
    return text
        // Remove lines that are purely silence/music/noise markers (any timestamp format)
        .replace(/^[\s\-–—]*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–—]\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*(?:silence|music|noise|applause).*$/gim, '')
        // Remove standalone [Silence], [Music], [Noise], [Inaudible] lines
        .replace(/^\s*\[(?:silence|music|noise|applause|inaudible)\]\s*$/gim, '')
        // Remove lines that are only timestamps (no speech content after)
        .replace(/^[\s\-–—]*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*(?:[-–—]\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?)?\s*$/gm, '')
        // Strip leading "- 3:15 " or "  - 03:15 " or "- 1:23:45 " (dash-prefixed timestamps)
        .replace(/^\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?\s+/gm, '')
        // Strip leading "[00:07:16] " or "00:07:16 " (bracket/bare timestamps)
        .replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s+/gm, '')
        // Collapse 3+ consecutive newlines into 2
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
