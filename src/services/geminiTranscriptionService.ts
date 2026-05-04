import { supabase } from '../config/supabase'

export type TranscriptionStage = 'uploading' | 'processing'

/**
 * Step 1: TUS resumable upload to Supabase Storage.
 * Returns the storage path for use with startTranscription().
 */
export async function uploadAudioFile(
    file: File,
    onStage?: (stage: TranscriptionStage) => void
): Promise<string> {
    console.log('[uploadAudioFile] START', { name: file.name, size: file.size, type: file.type })
    onStage?.('uploading')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `transcription/${Date.now()}-${safeName}`
    console.log('[uploadAudioFile] TUS upload to path:', path)
    await tusUpload(file, path)
    console.log('[uploadAudioFile] TUS upload complete')
    return path
}

/**
 * Step 2: Fire the transcribe-audio edge function asynchronously.
 * Returns immediately — the edge function processes in the background
 * and updates the transcript DB record when done.
 */
export function startTranscription(
    path: string,
    mimeType: string,
    fileSize: number,
    transcriptId: string,
    onStage?: (stage: TranscriptionStage) => void
): void {
    onStage?.('processing')
    console.log('[startTranscription] Firing edge function for transcriptId:', transcriptId)

    // Fire-and-forget — do NOT await. Edge function runs in background via EdgeRuntime.waitUntil().
    supabase.functions.invoke('transcribe-audio', {
        body: { path, mimeType, fileSize, transcriptId },
    }).then(({ error }) => {
        if (error) console.error('[startTranscription] Edge function invocation error:', error)
        else console.log('[startTranscription] Edge function acknowledged, background processing started')
    })
}

/**
 * TUS resumable upload — uploads in 6 MB chunks, bypassing Supabase's
 * 50 MB per-file REST limit (free tier). Works for files of any size.
 */
async function tusUpload(file: File, objectPath: string): Promise<void> {
    const CHUNK_SIZE = 6 * 1024 * 1024 // 6 MB
    const bucket = 'recordings'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) throw new Error('Not authenticated — cannot upload recording')

    const b64 = (s: string) => btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))

    // ── Step 1: create TUS upload session ────────────────────────────
    const initRes = await fetch(`${supabaseUrl}/storage/v1/upload/resumable`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/offset+octet-stream',
            'X-Upsert': 'false',
            'Upload-Length': String(file.size),
            'Upload-Metadata': [
                `bucketName ${b64(bucket)}`,
                `objectName ${b64(objectPath)}`,
                `contentType ${b64(file.type || 'audio/aac')}`,
                `cacheControl ${b64('3600')}`,
            ].join(','),
            'Tus-Resumable': '1.0.0',
        },
    })

    if (!initRes.ok) {
        const body = await initRes.text()
        console.error('[tusUpload] Init failed:', initRes.status, body)
        throw new Error(`TUS init failed (${initRes.status}): ${body}`)
    }

    const uploadUrl = initRes.headers.get('Location')
    if (!uploadUrl) throw new Error('TUS server did not return a Location URL')
    console.log('[tusUpload] Session created, upload URL:', uploadUrl)

    // ── Step 2: upload chunks ─────────────────────────────────────────
    let offset = 0
    let chunkIndex = 0
    while (offset < file.size) {
        const end = Math.min(offset + CHUNK_SIZE, file.size)
        const chunk = file.slice(offset, end)
        const chunkBuffer = await chunk.arrayBuffer()

        console.log(`[tusUpload] Chunk ${++chunkIndex}: bytes ${offset}–${end} of ${file.size}`)

        const patchRes = await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/offset+octet-stream',
                'Upload-Offset': String(offset),
                'Tus-Resumable': '1.0.0',
                'Content-Length': String(chunkBuffer.byteLength),
            },
            body: chunkBuffer,
        })

        if (!patchRes.ok) {
            const body = await patchRes.text()
            console.error(`[tusUpload] Chunk ${chunkIndex} FAILED:`, patchRes.status, body)
            throw new Error(`TUS chunk upload failed at offset ${offset} (${patchRes.status}): ${body}`)
        }

        const newOffset = parseInt(patchRes.headers.get('Upload-Offset') ?? String(end), 10)
        console.log(`[tusUpload] Chunk ${chunkIndex} OK — server offset now: ${newOffset}`)
        offset = newOffset
    }

    console.log('[tusUpload] All chunks uploaded successfully')
}
