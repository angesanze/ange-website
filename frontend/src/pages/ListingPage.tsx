import { useParams, Link } from 'react-router-dom'
import { Folder } from 'lucide-react'
import { useCategories, usePosts, usePostsByCategory } from '@/lib/hooks'
import { useSettings } from '@/lib/settings'
import { FileRow } from '@/components/FileRow'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'
import { Loading, ErrorState, EmptyState } from '@/components/Loading'
import { DynamicIcon } from '@/components/Icon'
import { cn } from '@/lib/cn'
import { mediaUrl } from '@/lib/api'
import { contrastText, withAlpha } from '@/lib/color'
import type { Category } from '@/lib/types'

export function ListingPage() {
  const { slug } = useParams()
  const settings = useSettings()
  const allPosts = usePosts()
  const catPosts = usePostsByCategory(slug ?? '')
  const cats = useCategories()

  const query = slug ? catPosts : allPosts
  const posts = query.data ?? []
  const category = slug ? cats.data?.find((c) => c.slug === slug) : undefined

  const crumbs: Crumb[] = slug
    ? [{ label: 'files', to: '/posts' }, { label: `${slug}/` }]
    : [{ label: 'files' }]

  // The folder header is a solid block in the category colour, with the same sheen
  // as the homepage tiles — so the filesystem mirrors the home. All-files = coffee.
  const headerColor = category?.color ?? '#6b4a32'
  const headerInk = contrastText(headerColor)
  const iconName = category ? category.icon : settings.filesIcon
  const headerImg = category ? undefined : mediaUrl(settings.filesImage?.url)
  const fileLabel = posts.length === 1 ? '1 file' : `${posts.length} files`

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs segments={crumbs} />

      <header
        className="overflow-hidden rounded-2xl border border-black/5 p-5 shadow-[var(--shadow-soft)] sm:p-6"
        style={{
          background: `linear-gradient(150deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.16) 100%), ${headerColor}`,
          color: headerInk,
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl"
            style={{ backgroundColor: withAlpha('#ffffff', 0.16), color: headerInk }}
          >
            {headerImg ? (
              <img src={headerImg} alt="" className="size-full object-cover" />
            ) : (
              <DynamicIcon name={iconName} className="size-6" fallback={Folder} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl" style={{ color: headerInk }}>
              {category ? category.name : settings.filesTitle}
            </h1>
            <p className="mt-0.5 text-pretty text-sm" style={{ color: headerInk, opacity: 0.85 }}>
              {category?.description ?? settings.filesDescription}
            </p>
          </div>
          <span
            className="path-text hidden shrink-0 self-start text-sm sm:block"
            style={{ color: headerInk, opacity: 0.8 }}
          >
            {fileLabel}
          </span>
        </div>
      </header>

      <FolderChips cats={cats.data ?? []} active={slug} />

      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState />
      ) : posts.length === 0 ? (
        <EmptyState message="This folder is empty." />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p, i) => (
            <FileRow key={p.id} post={p} index={i} showFolder={!slug} />
          ))}
        </div>
      )}

      <p className="path-text text-xs text-ink-faint">{fileLabel} · sorted by date</p>
    </div>
  )
}

function FolderChips({ cats, active }: { cats: Category[]; active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ChipLink to="/posts" active={!active} label="all" color="#6b4a32" />
      {cats.map((c) => (
        <ChipLink
          key={c.slug}
          to={`/c/${c.slug}`}
          active={active === c.slug}
          label={c.slug}
          color={c.color}
        />
      ))}
    </div>
  )
}

function ChipLink({
  to,
  active,
  label,
  color,
}: {
  to: string
  active: boolean
  label: string
  color: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'path-text inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-transparent text-canvas'
          : 'border-line bg-paper text-ink-soft hover:border-ink-faint',
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: active ? '#fdf9f1' : color }}
      />
      {label}
    </Link>
  )
}
