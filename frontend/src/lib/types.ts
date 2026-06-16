/** Strapi 5 returns flattened entities (no `attributes` nesting). */

export interface StrapiMedia {
  url: string
  alternativeText?: string | null
  width?: number
  height?: number
}

export interface Category {
  id: number
  documentId: string
  name: string
  slug: string
  description?: string | null
  color: string
  accent?: string | null
  icon?: string | null
  order: number
}

export type Mood = 'calm' | 'spark' | 'warm' | 'night' | 'bitter' | 'sweet'

export interface Thought {
  id: number
  documentId: string
  body: string
  mood: Mood
  publishedAt: string
  createdAt: string
}

export interface Post {
  id: number
  documentId: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  readingTime?: number | null
  featured: boolean
  tags?: string[] | null
  category?: Category | null
  cover?: StrapiMedia | null
  /** Optional per-row graphic for the listing: a lucide name or emoji. */
  icon?: string | null
  /** Optional image shown instead of the default document icon on the row. */
  rowImage?: StrapiMedia | null
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface SocialLink {
  id: number
  label: string
  url: string
  icon?: string | null
}

export interface Profile {
  id: number
  documentId: string
  name: string
  role?: string | null
  tagline?: string | null
  bio?: string | null
  location?: string | null
  email?: string | null
  avatar?: StrapiMedia | null
  socials?: SocialLink[] | null
}

export interface CustomFont {
  id?: number
  family: string
  url: string
}

export type ThoughtsView = 'carousel' | 'grid' | 'stack' | 'random'

/** Site-wide settings (Strapi single type). Every field is editable in the admin. */
export interface Global {
  id: number
  documentId: string
  siteName?: string | null
  tagline?: string | null
  brandIcon?: string | null
  brandImage?: StrapiMedia | null
  homeTitle?: string | null
  homeSubtitle?: string | null
  homeCaption?: string | null
  filesTitle?: string | null
  filesDescription?: string | null
  filesIcon?: string | null
  filesImage?: StrapiMedia | null
  thoughtsTitle?: string | null
  thoughtsSubtitle?: string | null
  thoughtsIcon?: string | null
  thoughtsDefaultView?: ThoughtsView | null
  aboutTitle?: string | null
  aboutIcon?: string | null
  navFiles?: string | null
  navThoughts?: string | null
  navAbout?: string | null
  footerText?: string | null
  headingFont?: string | null
  bodyFont?: string | null
  monoFont?: string | null
  customFonts?: CustomFont[] | null
}

export interface StrapiList<T> {
  data: T[]
  meta: {
    pagination: { page: number; pageSize: number; pageCount: number; total: number }
  }
}

export interface StrapiSingle<T> {
  data: T
  meta: Record<string, unknown>
}
