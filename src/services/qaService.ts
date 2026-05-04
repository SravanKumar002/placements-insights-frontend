import { supabase } from '../config/supabase'
import type { QAItem, QAAnswer, CategoryStats } from '../types'
import type { QACategory } from '../config/constants'
import { ALL_CATEGORIES } from '../config/constants'

export type QASortOption = 'newest' | 'oldest' | 'most_asked' | 'highest_score' | 'most_useful'

// ─── Knowledge-base view types ────────────────────────────────────────────────

interface ViewAlumniPerspective {
    answer_id: string
    alumni: string
    company: string
    role: string
    answer: string
    date: string | null
    transcript_id: string
    branch: string | null
    helpful_votes: number
    not_helpful_votes: number
}

interface KnowledgeBaseRow {
    question_id: string
    question: string
    category: QACategory
    code: string | null
    ask_count: number
    latest_answer_date: string | null
    skill_set: string | null
    total_score: number | null
    freshness_tag: 'evergreen' | 'latest' | null
    publish_level: 'homepage' | 'category' | 'archive' | 'discarded'
    subtopic: string | null
    consolidated_answer: string | null
    helpful_votes: number
    not_helpful_votes: number
    best_answer_votes: number
    score_usefulness: number | null
    score_actionability: number | null
    score_repeatability: number | null
    score_clarity: number | null
    alumni_perspectives: ViewAlumniPerspective[]
}

function mapKnowledgeBaseRow(row: KnowledgeBaseRow): QAItem {
    const answers = (row.alumni_perspectives ?? []).map(p => ({
        id: p.answer_id,
        created_at: '',
        qa_item_id: row.question_id,
        transcript_id: p.transcript_id,
        alumni_name: p.alumni,
        company: p.company,
        role: p.role,
        package_lpa: null,
        batch: null,
        branch: p.branch,
        answer_text: p.answer,
        is_conflicting: false,
        conflict_context: null,
        call_date: p.date,
        visible: true,
        company_logo_url: null,
        helpful_votes: p.helpful_votes ?? 0,
        not_helpful_votes: p.not_helpful_votes ?? 0,
    } as QAAnswer))

    // Sort answers by helpful_votes DESC then call_date DESC (matching the view's ORDER BY)
    answers.sort((a, b) => {
        const vDiff = (b.helpful_votes ?? 0) - (a.helpful_votes ?? 0)
        if (vDiff !== 0) return vDiff
        const da = a.call_date ?? ''
        const db = b.call_date ?? ''
        return db.localeCompare(da)
    })

    return {
        id: row.question_id,
        created_at: '',
        updated_at: '',
        question: row.question,
        normalized_question: '',
        category: row.category,
        code: row.code,
        visible: true,
        ask_count: row.ask_count,
        has_conflict: false,
        latest_answer_date: row.latest_answer_date,
        skill_set: row.skill_set,
        score_usefulness: row.score_usefulness ?? null,
        score_actionability: row.score_actionability ?? null,
        score_repeatability: row.score_repeatability ?? null,
        score_clarity: row.score_clarity ?? null,
        total_score: row.total_score ?? null,
        freshness_tag: row.freshness_tag ?? null,
        publish_level: row.publish_level ?? 'archive',
        subtopic: row.subtopic ?? null,
        consolidated_answer: row.consolidated_answer ?? null,
        source_transcript_id: null,
        helpful_votes: row.helpful_votes ?? 0,
        not_helpful_votes: row.not_helpful_votes ?? 0,
        best_answer_votes: row.best_answer_votes ?? 0,
        answers,
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Filter out orphan qa_items that have zero answers
function removeOrphans(items: QAItem[]): QAItem[] {
    return items.filter(q => q.answers && q.answers.length > 0)
}

// Strip hidden answers and remove questions with zero visible answers (for student view)
function filterHiddenAnswers(items: QAItem[]): QAItem[] {
    return items
        .map(q => ({ ...q, answers: (q.answers ?? []).filter(a => a.visible !== false) }))
        .filter(q => q.answers!.length > 0)
}

// Keep only answers from the selected company and remove questions with zero matches
function filterByCompany(items: QAItem[], company: string): QAItem[] {
    return items
        .map(q => ({ ...q, answers: (q.answers ?? []).filter(a => a.company === company) }))
        .filter(q => q.answers!.length > 0)
}

// Keep only answers with the selected role (for display — server pre-filter handles pagination)
function filterByRole(items: QAItem[], role: string): QAItem[] {
    return items
        .map(q => ({ ...q, answers: (q.answers ?? []).filter(a => a.role === role) }))
        .filter(q => q.answers!.length > 0)
}

// Pre-fetch qa_item_ids that have answers matching role and/or company — used to enable server-side pagination
async function fetchItemIdsForFilters(company?: string, role?: string): Promise<string[] | null> {
    if (!company && !role) return null

    const fetchIds = async (field: 'company' | 'role', value: string) => {
        const { data, error } = await supabase
            .from('qa_answers')
            .select('qa_item_id')
            .eq(field, value)
        if (error) throw error
        return new Set((data ?? []).map((r: { qa_item_id: string }) => r.qa_item_id))
    }

    if (company && role) {
        const [companyIds, roleIds] = await Promise.all([fetchIds('company', company), fetchIds('role', role)])
        return [...companyIds].filter(id => roleIds.has(id))
    }
    if (company) return [...(await fetchIds('company', company))]
    return [...(await fetchIds('role', role!))]
}

// Fetch distinct role values from qa_answers
export async function fetchUniqueRoles(): Promise<string[]> {
    const { data, error } = await supabase
        .from('qa_answers')
        .select('role')
        .order('role')

    if (error) throw error
    const seen = new Set<string>()
    return (data ?? [])
        .map((r: { role: string }) => r.role?.trim())
        .filter(Boolean)
        .filter(name => {
            const key = name.toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
}

// Fetch total count of all visible Q&A items
export async function fetchTotalVisibleQACount(): Promise<number> {
    const { count, error } = await supabase
        .from('qa_items')
        .select('*', { count: 'exact', head: true })
        .eq('visible', true)
    if (error) throw error
    return count ?? 0
}

// Fetch distinct company names from qa_answers
export async function fetchUniqueCompanies(): Promise<string[]> {
    const { data, error } = await supabase
        .from('qa_answers')
        .select('company')
        .order('company')

    if (error) throw error
    const seen = new Set<string>()
    return (data ?? [])
        .map((r: { company: string }) => r.company?.trim())
        .filter(Boolean)
        .filter(name => {
            const key = name.toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
}

// Fetch student-facing Q&A from the pre-aggregated view (single DB round-trip)
export async function fetchFromKnowledgeBasePaginated(
    category: QACategory | undefined,
    page: number,
    pageSize: number,
    sort: QASortOption,
    signal?: AbortSignal,
    company?: string,
    skillSet?: string,
    role?: string,
    filterPositiveVotesOnly = true,
    search?: string,
): Promise<{ items: QAItem[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1

    const itemIds = await fetchItemIdsForFilters(company, role)
    if (itemIds !== null && itemIds.length === 0) return { items: [], totalCount: 0 }

    // supabase-js doesn't auto-type views, cast to any then re-type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('v_dashboard_knowledge_base') as any)
        .select('*', { count: 'exact' })

    if (category) query = query.eq('category', category)
    if (itemIds) query = query.in('question_id', itemIds)
    if (skillSet) query = query.eq('skill_set', skillSet)
    if (search) query = query.ilike('question', `%${search}%`)

    if (sort === 'newest') query = query.order('latest_answer_date', { ascending: false })
    else if (sort === 'oldest') query = query.order('latest_answer_date', { ascending: true })
    else if (sort === 'highest_score') query = query.order('total_score', { ascending: false, nullsFirst: false })
    else if (sort === 'most_useful') query = query.order('best_answer_votes', { ascending: false, nullsFirst: false })
    else query = query.order('ask_count', { ascending: false })

    if (sort === 'most_useful' && filterPositiveVotesOnly) query = query.gt('best_answer_votes', 0)

    if (signal) query = query.abortSignal(signal)

    const { data, error, count } = await query.range(from, to)
    if (error) throw error

    let items = ((data ?? []) as KnowledgeBaseRow[]).map(mapKnowledgeBaseRow)
    if (company) items = filterByCompany(items, company)
    if (role) items = filterByRole(items, role)
    return { items, totalCount: count ?? 0 }
}

// Fetch Q&A items by category, sorted by most recent answer
export async function fetchQAByCategory(category: QACategory): Promise<QAItem[]> {
    const { data, error } = await supabase
        .from('qa_items')
        .select(`
      *,
      answers:qa_answers(*)
    `)
        .eq('category', category)
        .order('latest_answer_date', { ascending: false })
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })

    if (error) throw error
    return removeOrphans((data as QAItem[]) ?? [])
}

// Fetch all Q&A items across categories
export async function fetchAllQA(limit = 50): Promise<QAItem[]> {
    const { data, error } = await supabase
        .from('qa_items')
        .select(`
      *,
      answers:qa_answers(*)
    `)
        .order('latest_answer_date', { ascending: false })
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })
        .limit(limit)

    if (error) throw error
    return removeOrphans((data as QAItem[]) ?? [])
}

// Fetch all Q&A items with pagination and sorting
export async function fetchAllQAPaginated(
    page: number,
    pageSize: number,
    sort: QASortOption,
    signal?: AbortSignal,
    visibleOnly = true,
    company?: string,
    skillSet?: string,
    role?: string,
    search?: string,
): Promise<{ items: QAItem[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1

    const itemIds = await fetchItemIdsForFilters(company, role)
    if (itemIds !== null && itemIds.length === 0) return { items: [], totalCount: 0 }

    let query = supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)', { count: 'exact' })

    if (visibleOnly) query = query.eq('visible', true)
    if (skillSet) query = query.eq('skill_set', skillSet)
    if (itemIds) query = query.in('id', itemIds)
    if (search) query = query.ilike('question', `%${search}%`)

    if (sort === 'newest') query = query.order('latest_answer_date', { ascending: false })
    else if (sort === 'oldest') query = query.order('latest_answer_date', { ascending: true })
    else if (sort === 'highest_score') query = query.order('total_score', { ascending: false, nullsFirst: false })
    else if (sort === 'most_useful') query = query.order('total_score', { ascending: false, nullsFirst: false })
    else query = query.order('ask_count', { ascending: false })

    // Always sort nested answers by call_date descending (latest first)
    query = query.order('call_date', { referencedTable: 'qa_answers', ascending: false })

    if (signal) query = query.abortSignal(signal)
    const { data, error, count } = await query.range(from, to)

    if (error) throw error
    let filtered = removeOrphans((data as QAItem[]) ?? [])
    if (visibleOnly) filtered = filterHiddenAnswers(filtered)
    if (company) filtered = filterByCompany(filtered, company)
    if (role) filtered = filterByRole(filtered, role)
    return { items: filtered, totalCount: count ?? 0 }
}

// Fetch Q&A items by category with pagination and sorting
export async function fetchQAByCategoryPaginated(
    category: QACategory,
    page: number,
    pageSize: number,
    sort: QASortOption,
    signal?: AbortSignal,
    visibleOnly = true,
    company?: string,
    skillSet?: string,
    role?: string,
    search?: string,
): Promise<{ items: QAItem[]; totalCount: number }> {
    const from = page * pageSize
    const to = from + pageSize - 1

    const itemIds = await fetchItemIdsForFilters(company, role)
    if (itemIds !== null && itemIds.length === 0) return { items: [], totalCount: 0 }

    let query = supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)', { count: 'exact' })
        .eq('category', category)

    if (visibleOnly) query = query.eq('visible', true)
    if (skillSet) query = query.eq('skill_set', skillSet)
    if (itemIds) query = query.in('id', itemIds)
    if (search) query = query.ilike('question', `%${search}%`)

    if (sort === 'newest') query = query.order('latest_answer_date', { ascending: false })
    else if (sort === 'oldest') query = query.order('latest_answer_date', { ascending: true })
    else if (sort === 'highest_score') query = query.order('total_score', { ascending: false, nullsFirst: false })
    else if (sort === 'most_useful') query = query.order('total_score', { ascending: false, nullsFirst: false })
    else query = query.order('ask_count', { ascending: false })

    // Always sort nested answers by call_date descending (latest first)
    query = query.order('call_date', { referencedTable: 'qa_answers', ascending: false })

    if (signal) query = query.abortSignal(signal)
    const { data, error, count } = await query.range(from, to)

    if (error) throw error
    let filtered = removeOrphans((data as QAItem[]) ?? [])
    if (visibleOnly) filtered = filterHiddenAnswers(filtered)
    if (company) filtered = filterByCompany(filtered, company)
    if (role) filtered = filterByRole(filtered, role)
    return { items: filtered, totalCount: count ?? 0 }
}

// Fetch top-scored question from each category (one per category)
export async function fetchTopQuestions(_limit = 10, visibleOnly = true): Promise<QAItem[]> {
    // Fetch top questions across all categories, then pick the best per category
    let query = supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)')
        .in('publish_level', ['homepage', 'category'])
        .order('total_score', { ascending: false, nullsFirst: false })
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })
        .limit(200)

    if (visibleOnly) query = query.eq('visible', true)

    const { data, error } = await query
    if (error) throw error
    let filtered = removeOrphans((data as QAItem[]) ?? [])
    if (visibleOnly) filtered = filterHiddenAnswers(filtered)

    // Pick the highest-scored question per category
    const seen = new Set<string>()
    const topPerCategory: QAItem[] = []
    for (const item of filtered) {
        if (!seen.has(item.category)) {
            seen.add(item.category)
            topPerCategory.push(item)
        }
    }
    return topPerCategory
}

// Fetch latest questions (most recently answered)
export async function fetchLatestQuestions(limit = 6): Promise<QAItem[]> {
    const { data, error } = await supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)')
        .in('publish_level', ['homepage', 'category'])
        .eq('visible', true)
        .order('latest_answer_date', { ascending: false })
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })
        .limit(limit)

    if (error) throw error
    return filterHiddenAnswers(removeOrphans((data as QAItem[]) ?? []))
}

// Fetch category counts using parallel HEAD requests (no row data transferred)
export async function fetchCategoryStats(visibleOnly = true): Promise<CategoryStats[]> {
    const results = await Promise.all(
        ALL_CATEGORIES.map(async (category) => {
            let query = supabase
                .from('qa_items')
                .select('*', { count: 'exact', head: true })
                .eq('category', category)
            if (visibleOnly) query = query.eq('visible', true)
            const { count, error } = await query
            return { category, count: error ? 0 : (count ?? 0) }
        })
    )
    return results
}

// Fetch answers for a specific Q&A item
export async function fetchAnswersForQA(qaItemId: string): Promise<QAAnswer[]> {
    const { data, error } = await supabase
        .from('qa_answers')
        .select('*')
        .eq('qa_item_id', qaItemId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data as QAAnswer[]) ?? []
}

// Enrich QAItem answers with company_logo_url from transcript_alumni
export async function enrichQAItemsWithLogos(items: QAItem[], signal?: AbortSignal): Promise<QAItem[]> {
    const allAnswers = items.flatMap(q => q.answers ?? [])
    if (allAnswers.length === 0) return items

    const transcriptIds = [...new Set(allAnswers.map(a => a.transcript_id))]
    let query = supabase
        .from('transcript_alumni')
        .select('transcript_id, alumni_name, company_logo_url')
        .in('transcript_id', transcriptIds)
    if (signal) query = query.abortSignal(signal)
    const { data: alumniRows } = await query

    if (!alumniRows || alumniRows.length === 0) return items

    const logoMap = new Map(
        (alumniRows as { transcript_id: string; alumni_name: string; company_logo_url: string | null }[])
            .filter(a => a.company_logo_url)
            .map(a => [`${a.transcript_id}::${a.alumni_name}`, a.company_logo_url])
    )

    if (logoMap.size === 0) return items

    return items.map(q => ({
        ...q,
        answers: q.answers?.map(a => ({
            ...a,
            company_logo_url: logoMap.get(`${a.transcript_id}::${a.alumni_name}`) ?? null,
        })),
    }))
}

// Search Q&A items by keyword — searches question text AND answer fields (company, alumni, answer text)
export async function fetchQAById(id: string): Promise<QAItem | null> {
    const { data, error } = await supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)')
        .eq('id', id)
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })
        .single()
    if (error || !data) return null
    return data as QAItem
}

export async function searchQAByKeyword(query: string): Promise<QAItem[]> {
    // Step 1: match by question text
    const { data: byQuestion, error: e1 } = await supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)')
        .or(`question.ilike.%${query}%,normalized_question.ilike.%${query}%`)
        .order('latest_answer_date', { ascending: false })
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })
        .limit(30)

    if (e1) throw e1

    // Step 2: match by answer fields (company name, alumni name, answer text)
    const { data: matchingAnswers, error: e2 } = await supabase
        .from('qa_answers')
        .select('qa_item_id')
        .or(`company.ilike.%${query}%,alumni_name.ilike.%${query}%,answer_text.ilike.%${query}%`)
        .limit(50)

    if (e2) throw e2

    const existingIds = new Set((byQuestion as QAItem[]).map(q => q.id))
    const extraIds = [...new Set((matchingAnswers ?? []).map((a: { qa_item_id: string }) => a.qa_item_id))]
        .filter(id => !existingIds.has(id))

    let combined = [...(byQuestion as QAItem[])]

    if (extraIds.length > 0) {
        const { data: byAnswers, error: e3 } = await supabase
            .from('qa_items')
            .select('*, answers:qa_answers(*)')
            .in('id', extraIds)
            .order('latest_answer_date', { ascending: false })
            .order('call_date', { referencedTable: 'qa_answers', ascending: false })

        if (e3) throw e3
        combined = [...combined, ...(byAnswers as QAItem[])]
    }

    return removeOrphans(combined).slice(0, 30)
}

// ─── Student vote on individual answer helpfulness ────────────────────────────

export async function voteOnQAAnswer(
    answerId: string,
    vote: 'helpful' | 'not_helpful' | null,  // null = remove vote
    prevVote: 'helpful' | 'not_helpful' | null = null
): Promise<void> {
    const toCol = (v: 'helpful' | 'not_helpful') =>
        v === 'helpful' ? 'helpful_votes' : 'not_helpful_votes'

    if (prevVote) {
        const { error } = await (supabase.rpc as any)('decrement_qa_answer_vote', {
            p_id: answerId,
            p_col: toCol(prevVote),
        })
        if (error) throw error
    }

    if (vote) {
        const { error } = await (supabase.rpc as any)('increment_qa_answer_vote', {
            p_id: answerId,
            p_col: toCol(vote),
        })
        if (error) throw error
    }
}
