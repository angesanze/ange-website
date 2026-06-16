import { useQuery } from '@tanstack/react-query'
import {
  getCategories,
  getGlobal,
  getPostBySlug,
  getPosts,
  getPostsByCategory,
  getProfile,
  getThoughts,
} from './api'

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories })
}

export function usePosts() {
  return useQuery({ queryKey: ['posts'], queryFn: getPosts })
}

export function usePostsByCategory(slug: string) {
  return useQuery({
    queryKey: ['posts', 'category', slug],
    queryFn: () => getPostsByCategory(slug),
    enabled: Boolean(slug),
  })
}

export function usePostBySlug(slug: string) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPostBySlug(slug),
    enabled: Boolean(slug),
  })
}

export function useThoughts() {
  return useQuery({ queryKey: ['thoughts'], queryFn: getThoughts })
}

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: getProfile })
}

export function useGlobal() {
  // Settings rarely change; keep them fresh for a while to avoid refetches.
  return useQuery({ queryKey: ['global'], queryFn: getGlobal, staleTime: 5 * 60_000 })
}
