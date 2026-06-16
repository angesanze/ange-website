import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { useSettings } from '@/lib/settings'
import { useSiteChrome } from '@/lib/chrome'
import { mediaUrl } from '@/lib/api'
import { DynamicIcon } from '@/components/Icon'

export function Layout() {
  const { pathname } = useLocation()
  const settings = useSettings()
  useSiteChrome(settings)

  const nav = [
    { to: '/posts', label: settings.navFiles },
    { to: '/thoughts', label: settings.navThoughts },
    { to: '/about', label: settings.navAbout },
  ]

  const brandImg = mediaUrl(settings.brandImage?.url)
  const hasBrandIcon = Boolean(settings.brandIcon?.trim())

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center overflow-hidden rounded-lg bg-ink font-display text-lg leading-none text-canvas transition-transform group-hover:-rotate-6">
              {brandImg ? (
                <img src={brandImg} alt={settings.siteName} className="size-full object-cover" />
              ) : hasBrandIcon ? (
                <DynamicIcon name={settings.brandIcon} className="size-5" />
              ) : (
                '~'
              )}
            </span>
            <span className="font-display text-lg font-medium tracking-tight text-ink">
              {settings.siteName}
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3',
                    isActive
                      ? 'bg-ink/5 text-ink'
                      : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-7 sm:px-5 sm:pb-24 md:pt-12">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-ink-faint sm:flex-row sm:px-5">
          <span className="path-text text-center">{settings.footerText}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
