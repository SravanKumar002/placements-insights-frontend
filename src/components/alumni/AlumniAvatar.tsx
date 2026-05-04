import { useState } from 'react'

interface AlumniAvatarProps {
    name: string
    logoUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeClasses = {
    sm: 'w-6 h-6 rounded-full text-xs',
    md: 'w-14 h-14 rounded-2xl text-lg',
    lg: 'w-20 h-20 rounded-2xl text-3xl',
}

export function AlumniAvatar({ name, logoUrl, size = 'md', className = '' }: AlumniAvatarProps) {
    const [imgError, setImgError] = useState(false)
    const base = sizeClasses[size]

    if (logoUrl && !imgError) {
        return (
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className={`${base} object-contain bg-white/10 shrink-0 ${className}`}
                onError={() => setImgError(true)}
            />
        )
    }

    return (
        <div className={`${base} bg-[#0b4b8c] flex items-center justify-center text-white font-black shadow-lg shadow-blue-100 shrink-0 ${className}`}>
            {name.charAt(0)}
        </div>
    )
}
