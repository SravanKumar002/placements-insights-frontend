import type { QACategory } from '../config/constants'

export interface QAItem {
    id: string
    created_at: string
    updated_at: string
    question: string
    normalized_question: string
    category: QACategory
    code: string | null
    visible: boolean
    ask_count: number
    has_conflict: boolean
    latest_answer_date: string | null
    skill_set?: string | null
    answers?: QAAnswer[]
    // Scoring & publishing fields
    score_usefulness: number | null
    score_actionability: number | null
    score_repeatability: number | null
    score_clarity: number | null
    total_score: number | null
    freshness_tag: 'evergreen' | 'latest' | null
    publish_level: 'homepage' | 'category' | 'archive' | 'discarded'
    subtopic: string | null
    consolidated_answer: string | null
    source_transcript_id: string | null
    helpful_votes: number
    not_helpful_votes: number
    best_answer_votes?: number
}

export interface QAAnswer {
    id: string
    created_at: string
    qa_item_id: string
    transcript_id: string
    alumni_name: string
    company: string
    role: string
    package_lpa: number | null
    batch: string | null
    branch: string | null
    answer_text: string
    is_conflicting: boolean
    conflict_context: string | null
    call_date: string | null
    visible: boolean
    company_logo_url?: string | null
    helpful_votes: number
    not_helpful_votes: number
}

export interface ConflictInfo {
    conflict_context: string
    answers: QAAnswer[]
}

export interface QASearchResult extends QAItem {
    relevance_score?: number
}

export interface CategoryStats {
    category: QACategory
    count: number
}
