import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { AskQuestionModal } from './AskQuestionModal'

export function StickyAskCTA() {
    const [askOpen, setAskOpen] = useState(false)

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-20 pointer-events-none">
                <div className="p-4 bg-gradient-to-t from-surface-900 via-surface-900/80 to-transparent">
                    <button
                        onClick={() => setAskOpen(true)}
                        className="pointer-events-auto w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-brand-900/50 transition-all duration-200 active:scale-[0.98]"
                    >
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        Didn't find your question? Ask here
                    </button>
                </div>
            </div>
            <AskQuestionModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
        </>
    )
}
