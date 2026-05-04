import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    page: number        // 0-indexed
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    const pages = getPageNumbers(page, totalPages)

    return (
        <div className="pt-8 flex items-center justify-center gap-2">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="p-2 rounded-lg border border-blue-50 text-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Mobile: simple page indicator */}
            <span className="sm:hidden text-xs text-slate-400 px-2">
                {page + 1} / {totalPages}
            </span>

            {/* Desktop: page number buttons */}
            <div className="hidden sm:flex items-center gap-1">
                {pages.map((p, idx) =>
                    p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-sm text-slate-300">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                page === p
                                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-100'
                                    : 'text-slate-400 hover:bg-blue-50 hover:text-blue-900'
                            }`}
                        >
                            {(p as number) + 1}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages - 1}
                className="p-2 rounded-lg border border-blue-50 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i)
    }

    const pages: (number | '...')[] = [0]

    if (current > 2) pages.push('...')

    const start = Math.max(1, current - 1)
    const end = Math.min(total - 2, current + 1)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    if (current < total - 3) pages.push('...')

    pages.push(total - 1)

    return pages
}
