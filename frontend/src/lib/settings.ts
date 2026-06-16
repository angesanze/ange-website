import { useGlobal } from './hooks'
import type { CustomFont, Global, StrapiMedia, ThoughtsView } from './types'

/**
 * The site's editable copy/config. Every value here is the English default; the
 * admin's Global single type overrides any field. Centralising the defaults means
 * components can read `settings.homeTitle` and always get something sensible —
 * even before the API responds, so there's never a flash of empty chrome.
 */
export interface Settings {
  siteName: string
  tagline: string
  brandIcon: string
  brandImage: StrapiMedia | null
  homeTitle: string
  homeSubtitle: string
  homeCaption: string
  filesTitle: string
  filesDescription: string
  filesIcon: string
  filesImage: StrapiMedia | null
  thoughtsTitle: string
  thoughtsSubtitle: string
  thoughtsIcon: string
  thoughtsDefaultView: ThoughtsView
  aboutTitle: string
  aboutIcon: string
  navFiles: string
  navThoughts: string
  navAbout: string
  footerText: string
  headingFont: string
  bodyFont: string
  monoFont: string
  customFonts: CustomFont[]
}

export const DEFAULTS: Settings = {
  siteName: 'ange',
  tagline: 'Technical notes, a coffee obsession and scattered thoughts.',
  brandIcon: '',
  brandImage: null,
  homeTitle: 'Technical notes and scattered thoughts.',
  homeSubtitle: '',
  homeCaption: 'block size = amount of content · click to enter',
  filesTitle: 'All files',
  filesDescription: 'Every piece of writing, ordered like a filesystem.',
  filesIcon: 'folder-open',
  filesImage: null,
  thoughtsTitle: 'Scattered thoughts',
  thoughtsSubtitle:
    'Short, off-the-cuff fragments. Flip through them like a deck of postcards — no folders, no order, just the flow.',
  thoughtsIcon: 'message-circle-heart',
  thoughtsDefaultView: 'carousel',
  aboutTitle: 'About',
  aboutIcon: 'user-round',
  navFiles: 'Files',
  navThoughts: 'Thoughts',
  navAbout: 'About',
  footerText: 'made with coffee and curiosity',
  headingFont: '',
  bodyFont: '',
  monoFont: '',
  customFonts: [],
}

/** Merge admin values over the defaults; defined (incl. empty-string) values win. */
export function mergeSettings(global?: Global | null): Settings {
  const out: Settings = { ...DEFAULTS }
  if (!global) return out
  const source = global as unknown as Record<string, unknown>
  for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
    const value = source[key]
    if (value !== null && value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(out as any)[key] = value
    }
  }
  return out
}

/** Editable site settings, always fully populated with English fallbacks. */
export function useSettings(): Settings {
  const { data } = useGlobal()
  return mergeSettings(data)
}
