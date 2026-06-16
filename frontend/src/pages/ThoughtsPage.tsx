import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { useSearchParams } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  GalleryHorizontalEnd,
  LayoutGrid,
  SquareStack,
  Shuffle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useThoughts } from '@/lib/hooks'
import { useSettings } from '@/lib/settings'
import { Loading, ErrorState, EmptyState } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { moodStyle } from '@/lib/moods'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Thought, ThoughtsView } from '@/lib/types'

const VIEWS: { id: ThoughtsView; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'carousel', label: 'Carousel', Icon: GalleryHorizontalEnd },
  { id: 'grid', label: 'Grid', Icon: LayoutGrid },
  { id: 'stack', label: 'Stack', Icon: SquareStack },
  { id: 'random', label: 'Random', Icon: Shuffle },
]

function isView(v: string | null): v is ThoughtsView {
  return !!v && VIEWS.some((o) => o.id === v)
}

export function ThoughtsPage() {
  const settings = useSettings()
  const { data: thoughts, isLoading, isError } = useThoughts()
  const [params, setParams] = useSearchParams()
  // Initial view comes from a `?view=` deep-link if present; otherwise null,
  // which means "follow the admin's configured default" until the user picks one.
  const paramView = params.get('view')
  const [view, setView] = useState<ThoughtsView | null>(isView(paramView) ? paramView : null)
  const activeView = view ?? settings.thoughtsDefaultView

  const choose = (v: ThoughtsView) => {
    setView(v)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('view', v)
      return next
    })
  }

  if (isLoading) return <Loading label="Gathering thoughts…" />
  if (isError) return <ErrorState />
  if (!thoughts || thoughts.length === 0)
    return <EmptyState message="No thoughts yet." />

  return (
    <div className="flex flex-col gap-7">
      <Breadcrumbs segments={[{ label: 'thoughts', icon: settings.thoughtsIcon }]} />

      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl sm:text-4xl">{settings.thoughtsTitle}</h1>
        {settings.thoughtsSubtitle?.trim() && (
          <p className="mx-auto max-w-md text-pretty text-ink-soft">{settings.thoughtsSubtitle}</p>
        )}
      </header>

      <ViewSwitcher value={activeView} onChange={choose} />

      <div className="w-full">
        {activeView === 'carousel' && <CarouselView thoughts={thoughts} />}
        {activeView === 'grid' && <GridView thoughts={thoughts} />}
        {activeView === 'stack' && <StackView thoughts={thoughts} />}
        {activeView === 'random' && <RandomView thoughts={thoughts} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared card                                                         */
/* ------------------------------------------------------------------ */

function ThoughtCard({
  thought,
  className,
  latest = false,
}: {
  thought: Thought
  className?: string
  latest?: boolean
}) {
  const m = moodStyle(thought.mood)
  return (
    <article
      className={cn(
        'relative flex flex-col justify-between gap-5 rounded-3xl border border-black/5 p-6 shadow-[var(--shadow-soft)] sm:p-7',
        className,
      )}
      style={{ backgroundColor: m.bg, color: m.ink }}
    >
      <div className="flex items-start justify-between">
        <Quote className="size-7 shrink-0" style={{ color: m.accent }} />
        {latest && (
          <span
            className="path-text rounded-full px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide"
            style={{ backgroundColor: `${m.accent}26`, color: m.accent }}
          >
            latest
          </span>
        )}
      </div>
      <p className="font-display text-lg leading-snug text-balance sm:text-xl">{thought.body}</p>
      <div className="path-text flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: m.accent }} />
          {m.label}
        </span>
        <span className="opacity-70">{formatDate(thought.publishedAt)}</span>
      </div>
    </article>
  )
}

function ViewSwitcher({
  value,
  onChange,
}: {
  value: ThoughtsView
  onChange: (v: ThoughtsView) => void
}) {
  return (
    <div className="mx-auto inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1 shadow-[var(--shadow-soft)]">
      {VIEWS.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            aria-label={o.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
            )}
          >
            <o.Icon className="size-4" />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Carousel — the highlighted card is the latest                       */
/* ------------------------------------------------------------------ */

function CarouselView({ thoughts }: { thoughts: Thought[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!emblaApi) return
      if (e.key === 'ArrowLeft') emblaApi.scrollPrev()
      if (e.key === 'ArrowRight') emblaApi.scrollNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [emblaApi])

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="w-full overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {thoughts.map((t, i) => {
            const active = i === selected
            return (
              <div
                key={t.id}
                className="min-w-0 flex-[0_0_86%] px-2 sm:flex-[0_0_62%] md:flex-[0_0_50%]"
              >
                <motion.div
                  animate={{ scale: active ? 1 : 0.92, opacity: active ? 1 : 0.5 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <ThoughtCard
                    thought={t}
                    latest={i === 0}
                    className="aspect-[4/5] sm:aspect-[5/4]"
                  />
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <RoundButton onClick={() => emblaApi?.scrollPrev()} aria-label="previous thought">
          <ChevronLeft className="size-5" />
        </RoundButton>

        <div className="flex max-w-[60vw] flex-wrap items-center justify-center gap-1.5">
          {thoughts.map((t, i) => (
            <button
              key={t.id}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`go to thought ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === selected ? 'w-6 bg-terracotta' : 'w-1.5 bg-line hover:bg-ink-faint',
              )}
            />
          ))}
        </div>

        <RoundButton onClick={() => emblaApi?.scrollNext()} aria-label="next thought">
          <ChevronRight className="size-5" />
        </RoundButton>
      </div>

      <p className="path-text text-xs text-ink-faint">
        {selected + 1} / {thoughts.length} · use ← →
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grid — the top-left card is the latest                              */
/* ------------------------------------------------------------------ */

function GridView({ thoughts }: { thoughts: Thought[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {thoughts.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3), ease: 'easeOut' }}
        >
          <ThoughtCard thought={t} latest={i === 0} className="h-full min-h-[11rem]" />
        </motion.div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stack — the top card is the latest published                        */
/* ------------------------------------------------------------------ */

function StackView({ thoughts }: { thoughts: Thought[] }) {
  const [top, setTop] = useState(0)
  const n = thoughts.length
  const advance = () => setTop((t) => (t + 1) % n)

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-sm sm:aspect-[5/4]">
        {thoughts.map((t, i) => {
          const depth = (i - top + n) % n
          const dd = Math.min(depth, 3)
          const isTop = depth === 0
          return (
            <motion.div
              key={t.id}
              className={cn('absolute inset-0', isTop ? 'cursor-pointer' : 'pointer-events-none')}
              onClick={isTop ? advance : undefined}
              animate={{
                y: -dd * 14,
                scale: 1 - dd * 0.05,
                rotate: depth === 0 ? 0 : (depth % 2 ? 1 : -1) * 2.5 * dd,
                opacity: depth > 3 ? 0 : 1 - dd * 0.12,
              }}
              style={{ zIndex: n - depth }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <ThoughtCard thought={t} latest={isTop} className="size-full" />
            </motion.div>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        <RoundButton onClick={advance} aria-label="next thought" wide>
          <span className="px-1 text-sm font-medium">Next</span>
          <ChevronRight className="size-4" />
        </RoundButton>
        <p className="path-text text-xs text-ink-faint">tap the card · top = latest published</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Random — one at a time, reshuffle on click                          */
/* ------------------------------------------------------------------ */

function RandomView({ thoughts }: { thoughts: Thought[] }) {
  const pick = useMemo(() => () => Math.floor(Math.random() * thoughts.length), [thoughts.length])
  const [idx, setIdx] = useState(pick)

  const shuffle = () => {
    if (thoughts.length < 2) return
    setIdx((prev) => {
      let next = pick()
      while (next === prev) next = pick()
      return next
    })
  }

  const t = thoughts[idx] ?? thoughts[0]

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative flex w-full max-w-md justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={t.id}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="w-full"
          >
            <ThoughtCard thought={t} className="min-h-[15rem]" />
          </motion.div>
        </AnimatePresence>
      </div>

      <RoundButton onClick={shuffle} aria-label="show another random thought" wide>
        <Shuffle className="size-4" />
        <span className="px-1 text-sm font-medium">Another one</span>
      </RoundButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bits                                                                */
/* ------------------------------------------------------------------ */

function RoundButton({
  children,
  wide = false,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { wide?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1 border border-line bg-paper text-ink transition-colors hover:bg-paper-2',
        wide ? 'rounded-full px-4 py-2' : 'size-10 rounded-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
