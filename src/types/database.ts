export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            transcripts: {
                Row: {
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
                    processing_status: 'pending' | 'processing' | 'done' | 'error'
                    error_message: string | null
                    qa_count: number
                    conflict_status: 'pending' | 'processing' | 'done' | 'skipped' | 'error'
                    conflict_error: string | null
                }
                Insert: {
                    alumni_name: string
                    company: string
                    role: string
                    transcript_text: string
                    processing_status: 'pending' | 'processing' | 'done' | 'error'
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    call_date?: string | null
                    file_url?: string | null
                    error_message?: string | null
                    conflict_status?: 'pending' | 'processing' | 'done' | 'skipped' | 'error'
                    conflict_error?: string | null
                }
                Update: {
                    alumni_name?: string
                    company?: string
                    role?: string
                    transcript_text?: string
                    processing_status?: 'pending' | 'processing' | 'done' | 'error'
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    call_date?: string | null
                    file_url?: string | null
                    error_message?: string | null
                    qa_count?: number
                    conflict_status?: 'pending' | 'processing' | 'done' | 'skipped' | 'error'
                    conflict_error?: string | null
                }
                Relationships: []
            }
            qa_items: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    code: string | null
                    question: string
                    normalized_question: string
                    category: string
                    ask_count: number
                    has_conflict: boolean
                    latest_answer_date: string | null
                    visible: boolean
                    skill_set: string | null
                }
                Insert: {
                    code?: string | null
                    question: string
                    normalized_question: string
                    category: string
                    ask_count: number
                    has_conflict: boolean
                    latest_answer_date?: string | null
                    visible?: boolean
                    skill_set?: string | null
                }
                Update: {
                    code?: string | null
                    question?: string
                    normalized_question?: string
                    category?: string
                    ask_count?: number
                    has_conflict?: boolean
                    latest_answer_date?: string | null
                    visible?: boolean
                    skill_set?: string | null
                }
                Relationships: []
            }
            qa_answers: {
                Row: {
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
                }
                Insert: {
                    qa_item_id: string
                    transcript_id: string
                    alumni_name: string
                    company: string
                    role: string
                    answer_text: string
                    is_conflicting: boolean
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    conflict_context?: string | null
                    call_date?: string | null
                    visible?: boolean
                }
                Update: {
                    qa_item_id?: string
                    transcript_id?: string
                    alumni_name?: string
                    company?: string
                    role?: string
                    answer_text?: string
                    is_conflicting?: boolean
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    conflict_context?: string | null
                    call_date?: string | null
                    visible?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: 'qa_answers_qa_item_id_fkey'
                        columns: ['qa_item_id']
                        isOneToOne: false
                        referencedRelation: 'qa_items'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'qa_answers_transcript_id_fkey'
                        columns: ['transcript_id']
                        isOneToOne: false
                        referencedRelation: 'transcripts'
                        referencedColumns: ['id']
                    }
                ]
            }
            qa_inbox: {
                Row: {
                    id: string
                    created_at: string
                    transcript_id: string | null
                    alumni_name: string | null
                    company: string | null
                    role: string | null
                    package_lpa: number | null
                    batch: string | null
                    branch: string | null
                    extracted_question: string
                    answer_text: string
                    suggested_category: string | null
                    call_date: string | null
                    status: 'pending' | 'assigned' | 'dismissed'
                    assigned_master_code: string | null
                    source: 'transcript' | 'student'
                    student_name: string | null
                    student_email: string | null
                }
                Insert: {
                    transcript_id?: string | null
                    alumni_name?: string | null
                    company?: string | null
                    role?: string | null
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    extracted_question: string
                    answer_text: string
                    suggested_category?: string | null
                    call_date?: string | null
                    status?: 'pending' | 'assigned' | 'dismissed'
                    assigned_master_code?: string | null
                    source?: 'transcript' | 'student'
                    student_name?: string | null
                    student_email?: string | null
                }
                Update: {
                    transcript_id?: string | null
                    alumni_name?: string | null
                    company?: string | null
                    role?: string | null
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    extracted_question?: string
                    answer_text?: string
                    suggested_category?: string | null
                    call_date?: string | null
                    status?: 'pending' | 'assigned' | 'dismissed'
                    assigned_master_code?: string | null
                    source?: 'transcript' | 'student'
                    student_name?: string | null
                    student_email?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'qa_inbox_transcript_id_fkey'
                        columns: ['transcript_id']
                        isOneToOne: false
                        referencedRelation: 'transcripts'
                        referencedColumns: ['id']
                    }
                ]
            }
            transcript_alumni: {
                Row: {
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
                    company_logo_url: string | null
                    sort_order: number
                }
                Insert: {
                    transcript_id: string
                    alumni_name: string
                    company: string
                    role: string
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    college?: string | null
                    graduation_year?: string | null
                    location?: string | null
                    company_logo_url?: string | null
                    sort_order?: number
                }
                Update: {
                    transcript_id?: string
                    alumni_name?: string
                    company?: string
                    role?: string
                    package_lpa?: number | null
                    batch?: string | null
                    branch?: string | null
                    college?: string | null
                    graduation_year?: string | null
                    location?: string | null
                    company_logo_url?: string | null
                    sort_order?: number
                }
                Relationships: [
                    {
                        foreignKeyName: 'transcript_alumni_transcript_id_fkey'
                        columns: ['transcript_id']
                        isOneToOne: false
                        referencedRelation: 'transcripts'
                        referencedColumns: ['id']
                    }
                ]
            }
            alumni_journeys: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    branch: string
                    college: string
                    city: string
                    state: string | null
                    journey_text: string
                    yog: string | null
                    nxtwave_join_date: string | null
                    program: string | null
                    linkedin_url: string | null
                    photo_url: string | null
                    social_media_url: string | null
                    company: string | null
                    role: string | null
                }
                Insert: {
                    name: string
                    branch: string
                    college: string
                    city: string
                    state?: string | null
                    journey_text: string
                    yog?: string | null
                    nxtwave_join_date?: string | null
                    program?: string | null
                    linkedin_url?: string | null
                    photo_url?: string | null
                    social_media_url?: string | null
                    company?: string | null
                    role?: string | null
                }
                Update: {
                    name?: string
                    branch?: string
                    college?: string
                    city?: string
                    state?: string | null
                    journey_text?: string
                    yog?: string | null
                    nxtwave_join_date?: string | null
                    program?: string | null
                    linkedin_url?: string | null
                    photo_url?: string | null
                    social_media_url?: string | null
                    company?: string | null
                    role?: string | null
                }
                Relationships: []
            }
            student_queries: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    email: string | null
                    question: string
                    category: string | null
                }
                Insert: {
                    name: string
                    question: string
                    email?: string | null
                    category?: string | null
                }
                Update: {
                    name?: string
                    email?: string | null
                    question?: string
                    category?: string | null
                }
                Relationships: []
            }
            alumni_registrations: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    email: string
                    phone: string | null
                    branch: string | null
                    batch: string | null
                    interest: string | null
                }
                Insert: {
                    name: string
                    email: string
                    phone?: string | null
                    branch?: string | null
                    batch?: string | null
                    interest?: string | null
                }
                Update: {
                    name?: string
                    email?: string
                    phone?: string | null
                    branch?: string | null
                    batch?: string | null
                    interest?: string | null
                }
                Relationships: []
            }
            feedback: {
                Row: {
                    id: string
                    created_at: string
                    name: string | null
                    email: string | null
                    rating: number | null
                    message: string
                }
                Insert: {
                    name?: string | null
                    email?: string | null
                    rating?: number | null
                    message: string
                }
                Update: {
                    name?: string | null
                    email?: string | null
                    rating?: number | null
                    message?: string
                }
                Relationships: []
            }
            page_views: {
                Row: {
                    id: string
                    page_path: string
                    page_label: string | null
                    view_count: number
                    updated_at: string
                }
                Insert: {
                    page_path: string
                    page_label?: string | null
                    view_count?: number
                }
                Update: {
                    page_path?: string
                    page_label?: string | null
                    view_count?: number
                }
                Relationships: []
            }
            interview_intelligence_cards: {
                Row: {
                    id: string
                    created_at: string
                    title: string
                    url: string | null
                    content: string | null
                    sort_order: number
                }
                Insert: {
                    title: string
                    url?: string | null
                    content?: string | null
                    sort_order?: number
                }
                Update: {
                    title?: string
                    url?: string | null
                    content?: string | null
                    sort_order?: number
                }
                Relationships: []
            }
            posters: {
                Row: {
                    id: string
                    created_at: string
                    image_url: string
                    title: string | null
                    visible: boolean
                    sort_order: number
                }
                Insert: {
                    image_url: string
                    title?: string | null
                    visible?: boolean
                    sort_order?: number
                }
                Update: {
                    image_url?: string
                    title?: string | null
                    visible?: boolean
                    sort_order?: number
                }
                Relationships: []
            }
            placement_opportunities: {
                Row: {
                    id: string
                    created_at: string
                    crp_date: string
                    company_name: string
                    mandatory_skills: string | null
                    optional_skills: string | null
                    openings: number
                    ctc: string | null
                    opportunity_month: string
                }
                Insert: {
                    crp_date: string
                    company_name: string
                    mandatory_skills?: string | null
                    optional_skills?: string | null
                    openings?: number
                    ctc?: string | null
                    opportunity_month: string
                }
                Update: {
                    crp_date?: string
                    company_name?: string
                    mandatory_skills?: string | null
                    optional_skills?: string | null
                    openings?: number
                    ctc?: string | null
                    opportunity_month?: string
                }
                Relationships: []
            }
            placed_students: {
                Row: {
                    id: string
                    created_at: string
                    student_name: string
                    company: string
                    role: string | null
                    ctc: string | null
                    photo_url: string | null
                    placement_month: string
                }
                Insert: {
                    student_name: string
                    company: string
                    role?: string | null
                    ctc?: string | null
                    photo_url?: string | null
                    placement_month: string
                }
                Update: {
                    student_name?: string
                    company?: string
                    role?: string | null
                    ctc?: string | null
                    photo_url?: string | null
                    placement_month?: string
                }
                Relationships: []
            }
            student_logins: {
                Row: {
                    id: string
                    created_at: string
                }
                Insert: Record<string, never>
                Update: Record<string, never>
                Relationships: []
            }
        }
        Views: Record<string, never>
        Functions: {
            increment_page_view: {
                Args: { p_path: string; p_label?: string }
                Returns: undefined
            }
        }
        Enums: Record<string, never>
    }
}
