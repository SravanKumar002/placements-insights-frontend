import { MessageSquare } from 'lucide-react'

interface QAEmptyStateProps {
    category?: string
}

export function QAEmptyState({ category }: QAEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-surface-600" />
            </div>
            <h3 className="text-lg font-semibold text-surface-600 mb-2">No Q&As yet</h3>
            <p className="text-surface-500 text-sm max-w-sm">
                {category
                    ? `No questions and answers found in "${category}" category yet. Upload a transcript to start building the knowledge base.`
                    : 'Upload call transcripts to start extracting Q&A pairs automatically.'}
            </p>
        </div>
    )
}
