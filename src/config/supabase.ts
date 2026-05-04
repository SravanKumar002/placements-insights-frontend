import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey
)

export async function invokeEdge<T = unknown>(
    fnName: string,
    body?: Record<string, unknown>
): Promise<T> {
    const { data, error } = await supabase.functions.invoke(fnName, {
        body,
    })
    if (error) throw error
    return data as T
}
