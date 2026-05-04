import { useState, useEffect } from 'react'
import { fetchCategoryStats } from '../services/qaService'
import type { CategoryStats } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useCategories() {
    const { role } = useAuth()
    const visibleOnly = role !== 'admin'
    const [stats, setStats] = useState<CategoryStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCategoryStats(visibleOnly)
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [visibleOnly])

    return { stats, loading }
}
