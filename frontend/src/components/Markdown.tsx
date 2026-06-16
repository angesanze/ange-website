import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renders markdown post content with the warm `.article` styling. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="article">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
