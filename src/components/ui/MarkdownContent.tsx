import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'

const components: Components = {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-brand-700 mt-5 mb-2 first:mt-0 pb-1 border-b border-brand-100">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold text-surface-800 mt-4 mb-2 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-surface-700 mt-3 mb-1.5 first:mt-0">{children}</h3>,
    p:  ({ children }) => <p className="text-sm text-surface-600 leading-relaxed mb-3 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-outside text-sm text-surface-600 space-y-1 mb-3 last:mb-0 ml-5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-outside text-sm text-surface-600 space-y-1 mb-3 last:mb-0 ml-5">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-surface-800">{children}</strong>,
    em: ({ children }) => <em className="italic text-surface-600">{children}</em>,
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600 underline underline-offset-2">
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-brand-300 pl-4 my-3 text-sm text-surface-500 italic bg-brand-50/40 py-2 rounded-r">{children}</blockquote>
    ),
    code: ({ className, children }) => {
        const isBlock = className?.includes('language-')
        if (isBlock) {
            return (
                <code className="block bg-surface-100 rounded-lg p-3 text-xs font-mono text-surface-700 overflow-x-auto my-2 whitespace-pre">
                    {children}
                </code>
            )
        }
        return <code className="bg-surface-100 text-brand-700 text-xs font-mono px-1.5 py-0.5 rounded border border-surface-200">{children}</code>
    },
    pre: ({ children }) => <pre className="my-2">{children}</pre>,
    table: ({ children }) => (
        <div className="overflow-x-auto my-2">
            <table className="text-sm border-collapse w-full">{children}</table>
        </div>
    ),
    th: ({ children }) => <th className="text-left text-xs font-semibold text-surface-700 bg-surface-100 px-3 py-2 border border-surface-200">{children}</th>,
    td: ({ children }) => <td className="text-sm text-surface-600 px-3 py-2 border border-surface-200">{children}</td>,
    hr: () => <hr className="my-4 border-surface-200" />,
}

export function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
            {content}
        </ReactMarkdown>
    )
}
