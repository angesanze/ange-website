import { Link } from 'react-router-dom'
import { FileText, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Post } from '@/lib/types'
import { fileName, formatDate, readingLabel } from '@/lib/format'
import { contrastText, withAlpha } from '@/lib/color'
import { mediaUrl } from '@/lib/api'
import { DynamicIcon } from '@/components/Icon'

/**
 * A post as a warm "file card" — tinted with its category colour and fronted by a
 * solid icon chip, so the listing mirrors the homepage's block aesthetic. The chip
 * shows the post's own image or icon when set, otherwise a default document icon.
 */
export function FileRow({
  post,
  index = 0,
  showFolder = true,
}: {
  post: Post
  index?: number
  showFolder?: boolean
}) {
  const color = post.category?.color ?? '#b05f31'
  const accent = post.category?.accent ?? color
  const chipInk = contrastText(color)
  const rowImage = mediaUrl(post.rowImage?.url)

  return (
    <motion.div
      initial={{ opacity: 0.5, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: 'easeOut' }}
    >
      <Link
        to={`/posts/${post.slug}`}
        className="group flex items-center gap-4 rounded-2xl border p-3.5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-4"
        style={{
          background: `linear-gradient(150deg, ${withAlpha(accent, 0.18)} 0%, ${withAlpha(color, 0.09)} 100%)`,
          borderColor: withAlpha(color, 0.22),
        }}
      >
        <span
          className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl shadow-[var(--shadow-soft)]"
          style={{ background: `linear-gradient(150deg, ${accent}, ${color})`, color: chipInk }}
        >
          {rowImage ? (
            <img
              src={rowImage}
              alt={post.rowImage?.alternativeText ?? ''}
              className="size-full object-cover"
            />
          ) : (
            <DynamicIcon name={post.icon} className="size-5" fallback={FileText} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="path-text truncate text-[0.95rem] text-ink">{fileName(post.slug)}</span>
            {post.featured && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-coffee"
                style={{ backgroundColor: withAlpha(color, 0.22) }}
              >
                featured
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-sm text-ink-soft">{post.title}</div>

          {/* Compact meta for phones, where the right-hand column is hidden. */}
          <div className="path-text mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.7rem] text-ink-faint sm:hidden">
            {showFolder && post.category && <span>{post.category.slug}/</span>}
            <span className="tabular-nums">{readingLabel(post.readingTime)}</span>
            <span className="tabular-nums">{formatDate(post.publishedAt)}</span>
          </div>
        </div>

        <div className="path-text hidden items-center gap-4 text-xs text-ink-faint sm:flex">
          {showFolder && post.category && <span>{post.category.slug}/</span>}
          <span className="tabular-nums">{readingLabel(post.readingTime)}</span>
          <span className="tabular-nums">{formatDate(post.publishedAt)}</span>
          <ArrowUpRight
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color }}
          />
        </div>
      </Link>
    </motion.div>
  )
}
