import React, { useState } from 'react';
import { supabase } from '../config/supabase';

interface ConflictButtonProps {
    transcriptId: string;
    status: 'pending' | 'processing' | 'done' | 'skipped' | 'error';
    error: string | null;
    onComplete?: () => void;
}

export const ConflictButton: React.FC<ConflictButtonProps> = ({
    transcriptId,
    status,
    error,
    onComplete
}) => {
    const [loading, setLoading] = useState(false);

    const handleDetect = async () => {
        setLoading(true);
        try {
            const { error: fnError } = await supabase.functions.invoke('process-transcript', {
                body: { transcript_id: transcriptId, action: 'detect_conflicts' },
            });
            if (fnError) throw fnError;
            if (onComplete) onComplete();
        } catch (err) {
            console.error('Conflict detection failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const isProcessing = status === 'processing' || loading;

    // Don't show button if conflicts are resolved, skipped, or not yet attempted
    if (status === 'done' || status === 'skipped' || status === 'pending') return null;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDetect}
                    disabled={isProcessing}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Detecting...
                        </>
                    ) : (
                        'Retry Conflict Detection'
                    )}
                </button>
                <span className="text-xs text-red-400">Failed</span>
            </div>
            {error && (
                <p className="text-xs text-red-400/80 max-w-xs truncate" title={error}>
                    {error}
                </p>
            )}
        </div>
    );
};
