import { supabase } from '../config/supabase'
import type { QAItem } from '../types'
import type { QACategory } from '../config/constants'

export interface MasterQuestionInput {
    question: string
    category: QACategory
    skill_set?: string
}

// Fetch all Q&A items for admin management, ordered by total_score then latest_answer_date
export async function fetchMasterQuestions(): Promise<QAItem[]> {
    const { data, error } = await supabase
        .from('qa_items')
        .select('*, answers:qa_answers(*)')
        .order('total_score', { ascending: false, nullsFirst: false })
        .order('latest_answer_date', { ascending: false, nullsFirst: false })
        .order('call_date', { referencedTable: 'qa_answers', ascending: false })

    if (error) throw error
    return (data as QAItem[]) ?? []
}

// Add a new Q&A item
export async function addMasterQuestion(input: MasterQuestionInput): Promise<QAItem> {
    const { data, error } = await supabase
        .from('qa_items')
        .insert({
            question: input.question,
            normalized_question: input.question.toLowerCase(),
            category: input.category,
            skill_set: input.skill_set?.trim() || null,
            ask_count: 0,
            has_conflict: false,
            visible: true,
            publish_level: 'archive',
        })
        .select()
        .single()

    if (error) throw error
    return data as QAItem
}

// Fetch all unique skill_set values
export async function fetchUniqueSkillSets(): Promise<string[]> {
    const { data, error } = await supabase
        .from('qa_items')
        .select('skill_set')
        .not('skill_set', 'is', null)
        .order('skill_set')

    if (error) throw error
    const seen = new Set<string>()
    return (data ?? [])
        .map((r: { skill_set: string | null }) => r.skill_set?.trim() ?? '')
        .filter((s): s is string => Boolean(s))
        .filter(s => {
            const key = s.toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
}

// Update a Q&A item — supports question, category, skill_set, scores, tags, publish_level
export async function updateMasterQuestion(
    id: string,
    updates: Partial<Pick<QAItem,
        'code' | 'question' | 'category' | 'skill_set' |
        'score_usefulness' | 'score_actionability' | 'score_repeatability' | 'score_clarity' |
        'freshness_tag' | 'publish_level' | 'subtopic' | 'consolidated_answer'
    >>
): Promise<void> {
    const patch: Record<string, unknown> = {}
    if (updates.question !== undefined) {
        patch.question = updates.question
        patch.normalized_question = updates.question.toLowerCase()
    }
    if (updates.code !== undefined) patch.code = updates.code
    if (updates.category !== undefined) patch.category = updates.category
    if (updates.skill_set !== undefined) patch.skill_set = updates.skill_set?.trim() || null
    if (updates.subtopic !== undefined) patch.subtopic = updates.subtopic?.trim() || null
    if (updates.consolidated_answer !== undefined) patch.consolidated_answer = updates.consolidated_answer
    if (updates.freshness_tag !== undefined) patch.freshness_tag = updates.freshness_tag
    if (updates.publish_level !== undefined) patch.publish_level = updates.publish_level

    // Handle score updates — auto-recalculate total_score
    const scoreFields = ['score_usefulness', 'score_actionability', 'score_repeatability', 'score_clarity'] as const
    for (const field of scoreFields) {
        if (updates[field] !== undefined) patch[field] = updates[field]
    }

    // If any individual score was updated, recalculate total_score
    const hasScoreUpdate = scoreFields.some(f => updates[f] !== undefined)
    if (hasScoreUpdate) {
        // Fetch current scores to merge with updates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: current, error: fetchError } = await (supabase
            .from('qa_items')
            .select('score_usefulness, score_actionability, score_repeatability, score_clarity') as any)
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError

        const merged = {
            score_usefulness: (updates.score_usefulness ?? current?.score_usefulness) as number | null,
            score_actionability: (updates.score_actionability ?? current?.score_actionability) as number | null,
            score_repeatability: (updates.score_repeatability ?? current?.score_repeatability) as number | null,
            score_clarity: (updates.score_clarity ?? current?.score_clarity) as number | null,
        }

        const allScores = [merged.score_usefulness, merged.score_actionability, merged.score_repeatability, merged.score_clarity]
        if (allScores.every(s => s !== null && s !== undefined)) {
            patch.total_score = allScores.reduce((sum, s) => sum! + s!, 0)
        }
    }

    const { error } = await supabase
        .from('qa_items')
        .update(patch)
        .eq('id', id)

    if (error) throw error
}

// Delete a Q&A item (cascades to qa_answers via FK)
export async function deleteMasterQuestion(id: string): Promise<void> {
    const { error } = await supabase
        .from('qa_items')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Merge question B into question A: move all answers from B to A, then delete B
export async function mergeQuestions(keepId: string, mergeId: string): Promise<void> {
    // Move all answers from mergeId to keepId
    const { error: moveError } = await supabase
        .from('qa_answers')
        .update({ qa_item_id: keepId })
        .eq('qa_item_id', mergeId)

    if (moveError) throw moveError

    // Update ask_count on the kept question
    const { count } = await supabase
        .from('qa_answers')
        .select('*', { count: 'exact', head: true })
        .eq('qa_item_id', keepId)

    await supabase
        .from('qa_items')
        .update({ ask_count: count ?? 0 })
        .eq('id', keepId)

    // Delete the merged question
    const { error: deleteError } = await supabase
        .from('qa_items')
        .delete()
        .eq('id', mergeId)

    if (deleteError) throw deleteError
}

// Toggle visibility for students (question-level)
export async function toggleQuestionVisibility(id: string, visible: boolean): Promise<void> {
    const { error } = await supabase
        .from('qa_items')
        .update({ visible })
        .eq('id', id)

    if (error) throw error
}

// Update the text of a single answer
export async function updateAnswerText(answerId: string, answerText: string): Promise<void> {
    const { error } = await supabase
        .from('qa_answers')
        .update({ answer_text: answerText })
        .eq('id', answerId)
    if (error) throw error
}

// Toggle visibility for a single answer
export async function toggleAnswerVisibility(answerId: string, visible: boolean): Promise<void> {
    const { error } = await supabase
        .from('qa_answers')
        .update({ visible })
        .eq('id', answerId)

    if (error) throw error
}
