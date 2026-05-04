import { MessageCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

interface AskCountBadgeProps {
    count: number
    small?: boolean
}

export function AskCountBadge({ count, small }: AskCountBadgeProps) {
    if (count <= 1) return null
    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-full font-semibold bg-brand-50 text-brand-600 border border-brand-200',
            small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
        )}>
            <MessageCircle className={cn('shrink-0', small ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
            Asked {count} times
        </span>
    )
}
