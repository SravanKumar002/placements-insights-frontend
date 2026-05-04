import { useParams } from 'react-router-dom'
import { useQAItems } from '../hooks/useQAItems'
import { QAList } from '../components/qa/QAList'
import { QASortBar } from '../components/qa/QASortBar'
import { Pagination } from '../components/qa/Pagination'
import { getCategoryEmoji, getCategoryMeta } from '../utils/categoryHelpers'
import { ALL_CATEGORIES, type QACategory } from '../config/constants'
import { cn } from '../utils/cn'
import { useAuth } from '../contexts/AuthContext'
export function QACategoryPage() {
    const { role: userRole } = useAuth()
    const isAdmin = userRole === 'admin'
    const { category: encodedCategory } = useParams<{ category: string }>()
    const category = decodeURIComponent(encodedCategory ?? '') as QACategory
    const isValid = ALL_CATEGORIES.includes(category)

    const { items, loading, error, sort, setSort, page, setPage, totalCount, totalPages } = useQAItems(isValid ? category : undefined)
    const meta = isValid ? getCategoryMeta(category) : null

    if (!isValid) {
        return (
            <div className="text-center py-20">
                <p className="text-surface-500">Invalid category</p>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            {/* Category Header */}
            <div className={cn('flex items-center gap-4 p-5 rounded-2xl border mb-6', meta!.bgColor, meta!.borderColor)}>
                <span className="text-4xl">{getCategoryEmoji(category)}</span>
                <div>
                    <h1 className={cn('text-xl font-bold', meta!.color)}>{category}</h1>
                </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <span className="text-sm shrink-0">💡</span>
                <p className="text-sm text-amber-700">{totalCount} question{totalCount !== 1 ? 's' : ''} from alumni</p>
            </div>

            <QASortBar sort={sort} onSortChange={setSort} isAdmin={isAdmin} />

            {/* Q&A List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-surface-100 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="glass-card p-6 text-center text-red-500">{error}</div>
            ) : (
                <>
                    <QAList items={items} category={category} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

        </div>
    )
}
