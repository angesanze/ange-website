import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CalendarDays } from 'lucide-react'
import { usePostBySlug } from '@/lib/hooks'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'
import { Markdown } from '@/components/Markdown'
import { Loading, ErrorState, EmptyState } from '@/components/Loading'
import { DynamicIcon } from '@/components/Icon'
import { fileName, formatDate, readingLabel } from '@/lib/format'
import { mediaUrl } from '@/lib/api'

export function PostPage() {
  const { slug } = useParams()
  const { data: post, isLoading, isError } = usePostBySlug(slug ?? '')

  if (isLoading) return <Loading label="Opening the file…" />
  if (isError) return <ErrorState />
  if (!post) return <EmptyState message="This file doesn't exist (anymore)." />

  const cat = post.category
  const crumbs: Crumb[] = [
    { label: 'files', to: '/posts' },
    ...(cat ? [{ label: `${cat.slug}/`, to: `/c/${cat.slug}` }] : []),
    { label: fileName(post.slug) },
  ]
  const cover = mediaUrl(post.cover?.url)
  const accent = cat?.accent ?? cat?.color ?? '#c2683d'

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <Breadcrumbs segments={crumbs} />

      <header className="flex flex-col gap-4">
        {cat && (
          <Link
            to={`/c/${cat.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            <DynamicIcon name={cat.icon} className="size-4" />
            {cat.name}
          </Link>
        )}
        <h1 className="text-balance text-[1.9rem] leading-[1.15] sm:text-4xl sm:leading-[1.12]">
          {post.title}
        </h1>
        {post.excerpt && <p className="text-pretty text-lg text-ink-soft">{post.excerpt}</p>}
        <div className="path-text flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {readingLabel(post.readingTime)}
          </span>
        </div>
      </header>

      {cover && (
        <img
          src={cover}
          alt={post.cover?.alternativeText ?? ''}
          className="aspect-[16/9] w-full rounded-2xl border border-line object-cover"
        />
      )}

      {post.content && <Markdown>{post.content}</Markdown>}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line/60 pt-5">
          {post.tags.map((t) => (
            <span
              key={t}
              className="path-text rounded-full bg-paper-2 px-3 py-1 text-xs text-ink-soft"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2">
        <Link
          to={cat ? `/c/${cat.slug}` : '/posts'}
          className="inline-flex items-center gap-2 text-sm text-clay hover:underline"
        >
          <ArrowLeft className="size-4" />
          back to {cat ? `${cat.slug}/` : 'files'}
        </Link>
      </div>
    </article>
  )
}
