import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchQAByKeyword, fetchQAById } from '../services/qaService'
import { QACard } from '../components/qa/QACard'
import type { QAItem } from '../types'

export function SearchResultsPage() {
    const [searchParams] = useSearchParams()
    const q = searchParams.get('q') ?? ''
    const id = searchParams.get('id') ?? ''
    const [items, setItems] = useState<QAItem[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (id) {
            setLoading(true)
            fetchQAById(id)
                .then(item => setItems(item ? [item] : []))
                .catch(console.error)
                .finally(() => setLoading(false))
            return
        }
        if (!q.trim()) { setItems([]); return }
        setLoading(true)
        searchQAByKeyword(q)
            .then(setItems)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [q, id])

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                    <h1 className="page-title">Search Results</h1>
                </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <span className="text-sm shrink-0">💡</span>
                <p className="text-sm text-amber-700">
                    {loading
                        ? 'Searching...'
                        : id
                            ? `${items.length} result${items.length !== 1 ? 's' : ''}`
                            : q
                                ? `${items.length} result${items.length !== 1 ? 's' : ''} for "${q}"`
                                : 'Enter a keyword in the search bar above'}
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Search className="w-10 h-10 text-surface-300 mx-auto mb-4" />
                    <p className="text-surface-600 font-semibold mb-1">
                        {q ? `No results for "${q}"` : 'Nothing to show'}
                    </p>
                    <p className="text-sm text-surface-500">
                        {q
                            ? 'Try a different keyword, company name, or alumni name.'
                            : 'Use the search bar above to find Q&A, companies, or alumni.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map(item => (
                        <QACard key={item.id} item={item} showCategory />
                    ))}
                </div>
            )}
        </div>
    )
}
