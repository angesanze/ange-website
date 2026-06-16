import { MapPin, Mail } from 'lucide-react'
import { useProfile } from '@/lib/hooks'
import { useSettings } from '@/lib/settings'
import { Loading, ErrorState, EmptyState } from '@/components/Loading'
import { Markdown } from '@/components/Markdown'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { socialIcon } from '@/components/Icon'
import { mediaUrl } from '@/lib/api'

export function AboutPage() {
  const { data: profile, isLoading, isError } = useProfile()
  const settings = useSettings()

  if (isLoading) return <Loading />
  if (isError) return <ErrorState />
  if (!profile) return <EmptyState message="Profile not filled in yet." />

  const avatar = mediaUrl(profile.avatar?.url)
  const initials = profile.name ? profile.name.slice(0, 2).toUpperCase() : '~'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Breadcrumbs
        segments={[{ label: settings.aboutTitle.toLowerCase(), icon: settings.aboutIcon }]}
      />

      <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        {avatar ? (
          <img
            src={avatar}
            alt={profile.name}
            className="size-20 rounded-2xl border border-line object-cover"
          />
        ) : (
          <span className="grid size-20 place-items-center rounded-2xl bg-ink font-display text-2xl text-canvas">
            {initials}
          </span>
        )}
        <div>
          <h1 className="text-4xl">{profile.name}</h1>
          {profile.role && <p className="path-text mt-1 text-terracotta">{profile.role}</p>}
          {profile.tagline && <p className="mt-2 text-pretty text-ink-soft">{profile.tagline}</p>}
        </div>
      </header>

      {profile.bio && <Markdown>{profile.bio}</Markdown>}

      {(profile.location || profile.email) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-5 text-sm text-ink-soft">
          {profile.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {profile.location}
            </span>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 hover:text-terracotta"
            >
              <Mail className="size-4" />
              {profile.email}
            </a>
          )}
        </div>
      )}

      {profile.socials && profile.socials.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {profile.socials.map((s) => {
            const Icon = socialIcon(s.icon)
            return (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink transition-colors hover:border-ink-faint hover:bg-paper-2"
              >
                <Icon className="size-4" />
                {s.label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
