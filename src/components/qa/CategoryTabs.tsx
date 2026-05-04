import { NavLink } from 'react-router-dom'
import { ALL_CATEGORIES } from '../../config/constants'
import { getCategoryEmoji, getCategoryMeta, getCategoryShort } from '../../utils/categoryHelpers'
import { cn } from '../../utils/cn'
import type { CategoryStats } from '../../types'

interface CategoryTabsProps {
    stats?: CategoryStats[]
}

export function CategoryTabs({ stats = [] }: CategoryTabsProps) {
    const getCount = (category: string) =>
        stats.find(s => s.category === category)?.count ?? 0

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {ALL_CATEGORIES.map(cat => {
                const meta = getCategoryMeta(cat)
                const count = getCount(cat)
                return (
                    <NavLink
                        key={cat}
                        to={`/qa/${encodeURIComponent(cat)}`}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200 text-left group',
                                isActive
                                    ? `${meta.bgColor} ${meta.borderColor} shadow-lg`
                                    : 'bg-surface-100 border-surface-200 hover:bg-white hover:border-surface-300'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className="text-2xl">{getCategoryEmoji(cat)}</span>
                                <div>
                                    <p className={cn(
                                        'text-xs font-semibold leading-tight',
                                        isActive ? meta.color : 'text-surface-600 group-hover:text-surface-700'
                                    )}>
                                        {getCategoryShort(cat)}
                                    </p>
                                    {count > 0 && (
                                        <p className="text-xs text-surface-500 mt-0.5">{count} Q&As</p>
                                    )}
                                </div>
                            </>
                        )}
                    </NavLink>
                )
            })}
        </div>
    )
}
