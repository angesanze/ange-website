import { useMemo } from 'react'
import { useCategories, usePosts, useThoughts } from '@/lib/hooks'
import { useSettings } from '@/lib/settings'
import { Treemap, type TreeBlock } from '@/components/Treemap'
import { Loading, ErrorState } from '@/components/Loading'

export function HomePage() {
  const settings = useSettings()
  const cats = useCategories()
  const posts = usePosts()
  const thoughts = useThoughts()

  const blocks = useMemo<TreeBlock[]>(() => {
    if (!cats.data || !posts.data) return []

    const counts = new Map<string, number>()
    for (const p of posts.data) {
      const slug = p.category?.slug
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }

    const folders: TreeBlock[] = cats.data
      .map((c) => {
        const count = counts.get(c.slug) ?? 0
        return {
          key: c.slug,
          label: c.name,
          value: count,
          color: c.color,
          accent: c.accent,
          icon: c.icon,
          href: `/c/${c.slug}`,
          kind: 'folder' as const,
          meta: count === 1 ? '1 file' : `${count} files`,
        }
      })
      .filter((b) => b.value > 0)

    const thoughtsCount = thoughts.data?.length ?? 0
    if (thoughtsCount > 0) {
      folders.push({
        key: 'thoughts',
        label: settings.thoughtsTitle,
        // gently downweighted so a stream of short notes doesn't swallow the square
        value: Math.max(1, Math.round(thoughtsCount * 0.7)),
        color: '#b06a33',
        accent: '#d2935a',
        icon: settings.thoughtsIcon,
        href: '/thoughts',
        kind: 'thoughts',
        meta: thoughtsCount === 1 ? '1 thought' : `${thoughtsCount} thoughts`,
      })
    }

    return folders
  }, [cats.data, posts.data, thoughts.data, settings.thoughtsTitle, settings.thoughtsIcon])

  const loading = cats.isLoading || posts.isLoading
  const error = cats.isError || posts.isError

  return (
    <div className="flex min-h-[calc(100svh-14rem)] flex-col items-center justify-center gap-6 py-2 sm:gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="max-w-2xl text-balance text-[1.8rem] leading-[1.15] sm:text-[2.15rem] md:text-[2.5rem]">
          {settings.homeTitle}
        </h1>
        {settings.homeSubtitle?.trim() && (
          <p className="max-w-xl text-pretty text-ink-soft">{settings.homeSubtitle}</p>
        )}
      </div>

      {loading ? (
        <Loading label="Opening the filesystem…" />
      ) : error ? (
        <ErrorState message="Can't reach the backend. Is it running on :1338?" />
      ) : (
        <Treemap blocks={blocks} />
      )}

      <p className="path-text max-w-xs text-center text-xs text-ink-faint sm:max-w-none">
        {settings.homeCaption}
      </p>
    </div>
  )
}
