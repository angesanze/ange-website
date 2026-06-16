import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <FileQuestion className="size-12 text-ink-faint" />
      <div>
        <h1 className="text-3xl">404 — file not found</h1>
        <p className="path-text mt-2 text-ink-soft">cat: no such path</p>
      </div>
      <Link
        to="/"
        className="rounded-full bg-ink px-5 py-2 text-sm text-canvas transition-transform hover:-translate-y-0.5"
      >
        back to home
      </Link>
    </div>
  )
}
