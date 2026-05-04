import { useState, useEffect, useCallback, useRef } from 'react'
import {
    fetchQAByCategoryPaginated,
    fetchAllQAPaginated,
    fetchFromKnowledgeBasePaginated,
    enrichQAItemsWithLogos,
} from '../services/qaService'
import type { QAItem } from '../types'
import type { QACategory } from '../config/constants'
import type { QASortOption } from '../services/qaService'
import { useAuth } from '../contexts/AuthContext'

const PAGE_SIZE = 10

export function useQAItems(category?: QACategory, company?: string, skillSet?: string, role?: string, search?: string) {
    const { role: userRole } = useAuth()
    const visibleOnly = userRole !== 'admin'
    const [items, setItems] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const [sort, setSort] = useState<QASortOption>('newest')
    const [totalCount, setTotalCount] = useState(0)
    const abortRef = useRef<AbortController | null>(null)

    // Reset page when any filter changes
    useEffect(() => {
        setPage(0)
    }, [category, sort, company, skillSet, role, search])

    const load = useCallback(async () => {
        // Abort any in-flight request before starting a new one
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setError(null)
        try {
            let result: { items: QAItem[]; totalCount: number }

            if (visibleOnly) {
                // Students: use the pre-aggregated view (single round-trip, DB-level filtering)
                result = await fetchFromKnowledgeBasePaginated(
                    category, page, PAGE_SIZE, sort, controller.signal, company, skillSet, role, true, search
                )
            } else if (sort === 'most_useful') {
                // Admins on "Top Rated": same view as students — only items students actually voted on
                result = await fetchFromKnowledgeBasePaginated(
                    category, page, PAGE_SIZE, sort, controller.signal, company, skillSet, role, true, search
                )
            } else {
                // Admins: use the full tables so hidden items are visible too
                result = category
                    ? await fetchQAByCategoryPaginated(category, page, PAGE_SIZE, sort, controller.signal, false, company, skillSet, role, search)
                    : await fetchAllQAPaginated(page, PAGE_SIZE, sort, controller.signal, false, company, skillSet, role, search)
            }

            const enriched = await enrichQAItemsWithLogos(result.items, controller.signal)
            if (!controller.signal.aborted) {
                setItems(enriched)
                setTotalCount(result.totalCount)
            }
        } catch (err) {
            // Ignore errors from aborted requests (tab switches, navigation)
            if (controller.signal.aborted) return
            setError(err instanceof Error ? err.message : 'Failed to load Q&A items')
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [category, page, sort, visibleOnly, company, skillSet, role, search])

    useEffect(() => {
        load()
        return () => { abortRef.current?.abort() }
    }, [load])

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return { items, loading, error, page, totalCount, totalPages, sort, setSort, setPage, refetch: load }
}
