import { CATEGORY_META, type QACategory } from '../config/constants'

export function getCategoryMeta(category: QACategory) {
    return CATEGORY_META[category] ?? {
        color: 'text-surface-600',
        bgColor: 'bg-surface-100',
        borderColor: 'border-surface-200',
        emoji: '❓',
        short: category,
    }
}

export function getCategoryColor(category: QACategory): string {
    return getCategoryMeta(category).color
}

export function getCategoryBg(category: QACategory): string {
    return getCategoryMeta(category).bgColor
}

export function getCategoryEmoji(category: QACategory): string {
    return getCategoryMeta(category).emoji
}

export function getCategoryShort(category: QACategory): string {
    return getCategoryMeta(category).short
}
