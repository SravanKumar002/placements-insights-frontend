import type { QAItem } from '../../types'
import { QACard } from './QACard'
import { QAEmptyState } from './QAEmptyState'
import { CATEGORY_META, type QACategory, type CategoryMeta } from '../../config/constants'

interface QAListProps {
    items: QAItem[]
    showCategory?: boolean
    category?: string
    theme?: CategoryMeta | null
    highlightHelpful?: boolean
}

export function QAList({ items, showCategory, category, theme, highlightHelpful }: QAListProps) {
    if (items.length === 0) {
        return <QAEmptyState category={category} />
    }

    // If on a category page, auto-resolve theme from the category name
    const resolvedTheme = theme ?? (category ? CATEGORY_META[category as QACategory] ?? null : null)

    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <QACard key={item.id} item={item} showCategory={showCategory} index={idx} theme={resolvedTheme} highlightHelpful={highlightHelpful} />
            ))}
        </div>
    )
}
