import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { DynamicIcon } from '@/components/Icon'

export interface Crumb {
  label: string
  to?: string
  /** Optional leading icon (lucide name or emoji) for this segment. */
  icon?: string | null
}

/** A filesystem-style path: `~ / tech / la-cache.md`. */
export function Breadcrumbs({ segments, className }: { segments: Crumb[]; className?: string }) {
  return (
    <nav
      className={cn(
        'path-text flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-soft',
        className,
      )}
    >
      <Link to="/" className="text-ink-faint transition-colors hover:text-terracotta">
        ~
      </Link>
      {segments.map((s, i) => (
        <span key={i} className="flex items-center gap-x-1.5">
          <span className="text-ink-faint/60">/</span>
          {s.icon && <DynamicIcon name={s.icon} className="size-4 text-ink-faint" />}
          {s.to ? (
            <Link to={s.to} className="transition-colors hover:text-terracotta">
              {s.label}
            </Link>
          ) : (
            <span className="text-ink">{s.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
