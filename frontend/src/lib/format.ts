/** English short date, e.g. "Jun 15, 2026". */
export function formatDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(
    'en-US',
    opts ?? { day: 'numeric', month: 'short', year: 'numeric' },
  )
}

/** Reading-time label used as the "weight" of a file in the listing. */
export function readingLabel(min?: number | null): string {
  return min ? `${min} min` : '— min'
}

/** A post rendered as a filesystem file name: `slug.md`. */
export function fileName(slug: string): string {
  return `${slug}.md`
}
