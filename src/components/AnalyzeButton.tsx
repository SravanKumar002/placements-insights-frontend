import React, { useState } from 'react';
import { supabase } from '../config/supabase';

export interface AnalysisResult {
    raw_extracted: number
    weak_removed: number
    saved: number
}

interface AnalyzeButtonProps {
    transcriptId: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    onComplete?: () => void;
    onResult?: (result: AnalysisResult) => void;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
    transcriptId,
    status,
    onComplete,
    onResult
}) => {
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        console.log('[AnalyzeButton] Invoking process-transcript for:', transcriptId);
        try {
            const { data, error } = await supabase.functions.invoke('process-transcript', {
                body: { transcript_id: transcriptId },
            });

            console.log('[AnalyzeButton] Response data:', data);
            if (error) {
                console.error('[AnalyzeButton] Response error:', error);
                console.error('[AnalyzeButton] Error details:', JSON.stringify(error, null, 2));
                throw error;
            }

            if (data?.success && onResult) {
                onResult({
                    raw_extracted: data.raw_extracted ?? 0,
                    weak_removed: data.weak_removed ?? 0,
                    saved: data.saved ?? 0,
                });
            }

        } catch (err) {
            console.error('[AnalyzeButton] Failed:', err);
        } finally {
            setLoading(false);
            // Always refresh — the function may have succeeded on the server
            // even if the client-side call timed out
            if (onComplete) onComplete();
        }
    };

    return (
        <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${status === 'done'
                    ? 'text-brand-700 bg-brand-100 hover:bg-brand-200'
                    : 'text-white bg-brand-600 hover:bg-brand-700 focus:ring-brand-500'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analysing...
                </>
            ) : status === 'done' ? (
                'Re-analyze'
            ) : status === 'processing' ? (
                'Analysing... (Stuck?)'
            ) : (
                'Analyze'
            )}
        </button>
    );
};
