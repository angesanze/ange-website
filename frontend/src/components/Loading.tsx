import { Coffee, TriangleAlert, Inbox } from 'lucide-react'

export function Loading({ label = 'Brewing…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
      <Coffee className="size-7 animate-pulse text-terracotta" />
      <p className="path-text text-sm">{label}</p>
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
      <TriangleAlert className="size-7 text-clay" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function EmptyState({ message = 'Nothing here yet.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-faint">
      <Inbox className="size-7" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
