import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(dateStr: string | null | undefined, fmt = 'MMM d, yyyy'): string {
    if (!dateStr) return 'N/A'
    try {
        return format(parseISO(dateStr), fmt)
    } catch {
        return 'Invalid date'
    }
}

export function formatRelative(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A'
    try {
        return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
    } catch {
        return 'N/A'
    }
}

export function formatDateTime(dateStr: string | null | undefined): string {
    return formatDate(dateStr, 'MMM d, yyyy · h:mm a')
}
