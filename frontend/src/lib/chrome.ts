import { useEffect } from 'react'
import type { Settings } from './settings'

const LINK_ATTR = 'data-custom-font'

/** If the admin typed a bare family, quote it and append a generic fallback. */
function fontStack(family: string, generic: string): string {
  const trimmed = family.trim()
  if (!trimmed) return ''
  if (trimmed.includes(',')) return trimmed // already a full stack
  const quoted = /\s/.test(trimmed) ? `'${trimmed}'` : trimmed
  return `${quoted}, ${generic}`
}

/**
 * Applies the global settings that live outside React's tree: the browser tab
 * title, any custom web-font <link>s, and the heading/body/mono font overrides.
 * Driven entirely by the admin's Global single type.
 */
export function useSiteChrome(settings: Settings) {
  const { siteName, tagline, customFonts, headingFont, bodyFont, monoFont } = settings

  useEffect(() => {
    const parts = [siteName, tagline].filter(Boolean)
    document.title = parts.join(' — ') || 'ange'
  }, [siteName, tagline])

  // Load custom font stylesheets (idempotent, keyed by href; prunes removed ones).
  useEffect(() => {
    const urls = (customFonts ?? []).map((f) => f.url).filter(Boolean)
    document.head.querySelectorAll(`link[${LINK_ATTR}]`).forEach((el) => {
      if (!urls.includes(el.getAttribute('href') ?? '')) el.remove()
    })
    for (const url of urls) {
      if (document.head.querySelector(`link[${LINK_ATTR}][href="${CSS.escape(url)}"]`)) continue
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      link.setAttribute(LINK_ATTR, '')
      document.head.appendChild(link)
    }
  }, [customFonts])

  // Override the design-token font variables when the admin sets a family.
  useEffect(() => {
    const root = document.documentElement
    const apply = (cssVar: string, family: string, generic: string) => {
      const stack = fontStack(family, generic)
      if (stack) root.style.setProperty(cssVar, stack)
      else root.style.removeProperty(cssVar)
    }
    apply('--font-display', headingFont, 'ui-serif, Georgia, serif')
    apply('--font-sans', bodyFont, 'ui-sans-serif, system-ui, sans-serif')
    apply('--font-mono', monoFont, 'ui-monospace, SFMono-Regular, monospace')
  }, [headingFont, bodyFont, monoFont])
}
