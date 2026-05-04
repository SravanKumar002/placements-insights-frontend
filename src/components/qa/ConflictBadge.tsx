import { AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ConflictBadgeProps {
    small?: boolean
}

export function ConflictBadge({ small }: ConflictBadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-full font-semibold bg-orange-900/50 text-orange-300 border border-orange-700/50',
            small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
        )}>
            <AlertTriangle className={cn('shrink-0', small ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
            Conflict
        </span>
    )
}
