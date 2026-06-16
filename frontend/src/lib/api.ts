import type {
  Category,
  Global,
  Post,
  Profile,
  Thought,
  StrapiList,
  StrapiSingle,
} from './types'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:1338'

async function strapi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`)
  if (!res.ok) {
    throw new Error(`Strapi request failed (${res.status}) on ${path}`)
  }
  return (await res.json()) as T
}

/** Turn a relative Strapi media URL into an absolute one. */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  return url.startsWith('http') ? url : `${API_URL}${url}`
}

export async function getCategories(): Promise<Category[]> {
  const json = await strapi<StrapiList<Category>>(
    '/categories?sort=order:asc&pagination[pageSize]=100',
  )
  return json.data
}

export async function getPosts(): Promise<Post[]> {
  const json = await strapi<StrapiList<Post>>(
    '/posts?populate=*&sort=publishedAt:desc&pagination[pageSize]=100',
  )
  return json.data
}

export async function getPostsByCategory(slug: string): Promise<Post[]> {
  const json = await strapi<StrapiList<Post>>(
    `/posts?filters[category][slug][$eq]=${encodeURIComponent(
      slug,
    )}&populate=*&sort=publishedAt:desc&pagination[pageSize]=100`,
  )
  return json.data
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const json = await strapi<StrapiList<Post>>(
    `/posts?filters[slug][$eq]=${encodeURIComponent(
      slug,
    )}&populate=*&pagination[pageSize]=1`,
  )
  return json.data[0] ?? null
}

export async function getThoughts(): Promise<Thought[]> {
  const json = await strapi<StrapiList<Thought>>(
    '/thoughts?sort=publishedAt:desc&pagination[pageSize]=100',
  )
  return json.data
}

export async function getProfile(): Promise<Profile | null> {
  const json = await strapi<StrapiSingle<Profile>>('/profile?populate=*')
  return json.data ?? null
}

export async function getGlobal(): Promise<Global | null> {
  const json = await strapi<StrapiSingle<Global>>('/global?populate=*')
  return json.data ?? null
}
