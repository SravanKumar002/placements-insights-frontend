import { supabase } from '../config/supabase'

export interface Poster {
    id: string
    created_at: string
    image_url: string
    title: string | null
    description: string | null
    visible: boolean
    sort_order: number
    poster_month: string | null
}

export async function fetchPosters(): Promise<Poster[]> {
    const { data, error } = await supabase
        .from('posters')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Poster[]
}

export async function fetchVisiblePosters(): Promise<Poster[]> {
    const { data, error } = await supabase
        .from('posters')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Poster[]
}

export async function insertPoster(payload: {
    image_url: string
    title?: string | null
    description?: string | null
    poster_month?: string | null
}): Promise<void> {
    const { data: maxData } = await supabase
        .from('posters')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
    const maxOrder = (maxData?.[0] as { sort_order: number } | undefined)?.sort_order ?? 0

    const { error } = await supabase
        .from('posters')
        .insert({ ...payload, sort_order: maxOrder + 1 })

    if (error) throw error
}

export async function updatePosterSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await supabase
        .from('posters')
        .update({ sort_order: sortOrder })
        .eq('id', id)
    if (error) throw error
}

export async function updatePosterMeta(id: string, title: string | null, description: string | null, image_url?: string, poster_month?: string | null): Promise<void> {
    const update: Record<string, unknown> = { title, description }
    if (image_url !== undefined) update.image_url = image_url
    if (poster_month !== undefined) update.poster_month = poster_month
    const { error } = await supabase
        .from('posters')
        .update(update)
        .eq('id', id)

    if (error) throw error
}

export async function updatePosterVisibility(id: string, visible: boolean): Promise<void> {
    const { error } = await supabase
        .from('posters')
        .update({ visible })
        .eq('id', id)

    if (error) throw error
}

export async function deletePoster(id: string): Promise<void> {
    const { error } = await supabase
        .from('posters')
        .delete()
        .eq('id', id)

    if (error) throw error
}

/** Compress image client-side to max 1800px wide, JPEG quality 0.8 */
async function compressImage(file: File, maxWidth = 1800, quality = 0.8): Promise<File> {
    // Skip if already small enough (under 1MB)
    if (file.size <= 1_000_000) return file

    return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
            let { width, height } = img
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) return resolve(file)
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob(
                blob => {
                    if (!blob) return resolve(file)
                    resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
                },
                'image/jpeg',
                quality,
            )
        }
        img.onerror = () => reject(new Error('Failed to load image for compression'))
        img.src = URL.createObjectURL(file)
    })
}

export async function uploadPosterImage(file: File): Promise<string> {
    const compressed = await compressImage(file)
    const ext = compressed.name.split('.').pop() || 'jpg'
    const path = `posters/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
        .from('posters')
        .upload(path, compressed, { contentType: compressed.type })

    if (error) throw error

    const { data } = supabase.storage.from('posters').getPublicUrl(path)
    return data.publicUrl
}
