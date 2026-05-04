import { useState, useCallback, useRef } from 'react'
import { searchQAByKeyword } from '../services/qaService'
import type { QAItem } from '../types'

export function useSearch() {
    const [results, setResults] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const search = useCallback((q: string) => {
        setQuery(q)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!q.trim()) {
            setResults([])
            setLoading(false)
            return
        }
        setLoading(true)
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchQAByKeyword(q)
                setResults(data)
            } catch (err) {
                console.error('Search error:', err)
            } finally {
                setLoading(false)
            }
        }, 300)
    }, [])

    const clear = useCallback(() => {
        setQuery('')
        setResults([])
        if (debounceRef.current) clearTimeout(debounceRef.current)
    }, [])

    return { results, loading, query, search, clear }
}
