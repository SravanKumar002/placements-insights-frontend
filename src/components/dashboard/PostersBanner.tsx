import { useState, useEffect } from 'react'
import { fetchVisiblePosters } from '../../services/posterService'
import type { Poster } from '../../services/posterService'

export function PostersBanner() {
    const [posters, setPosters] = useState<Poster[]>([])

    useEffect(() => {
        fetchVisiblePosters().then(setPosters).catch(() => {})
    }, [])

    if (posters.length === 0) return null

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posters.map(poster => (
                <div key={poster.id} className="rounded-xl overflow-hidden border border-surface-200 bg-surface-100">
                    <img
                        src={poster.image_url}
                        alt={poster.title || 'Poster'}
                        className="w-full h-auto object-contain"
                    />
                </div>
            ))}
        </div>
    )
}
