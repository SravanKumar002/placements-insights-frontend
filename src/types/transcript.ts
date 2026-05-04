import type { ProcessingStatus } from '../config/constants'

export interface InterviewRound {
    round: number
    title: string
    details: string[]
}

export interface Transcript {
    id: string
    created_at: string
    updated_at: string
    alumni_name: string
    company: string
    role: string
    package_lpa: number | null
    batch: string | null
    branch: string | null
    call_date: string | null
    transcript_text: string
    file_url: string | null
    processing_status: ProcessingStatus
    error_message: string | null
    qa_count: number
    conflict_status: 'pending' | 'processing' | 'done' | 'skipped' | 'error'
    conflict_error: string | null
    alumni?: TranscriptAlumni[]
}

export interface AlumniMeta {
    name: string
    company: string
    role: string
    package_lpa: number | null
    batch: string | null
    branch: string | null
    college?: string | null
    graduation_year?: string | null
    location?: string | null
    company_logo_url?: string | null
    company_url?: string | null
}

export interface TranscriptAlumni {
    id: string
    created_at: string
    transcript_id: string
    alumni_name: string
    company: string
    role: string
    package_lpa: number | null
    batch: string | null
    branch: string | null
    college: string | null
    graduation_year: string | null
    location: string | null
    company_logo_url?: string | null
    company_url?: string | null
    interview_process?: InterviewRound[] | null
    skills_tested?: string[] | null
    platforms_used?: string[] | null
    sort_order: number
}

export interface TranscriptUploadPayload {
    transcript_text: string
    call_date?: string
    call_label?: string
    alumni: AlumniMeta[]
}
