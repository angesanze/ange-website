import type { Mood } from './types'

export interface MoodStyle {
  label: string
  /** card background tint */
  bg: string
  /** body ink color */
  ink: string
  /** small accent (dot / underline) */
  accent: string
}

/** Each mood gets a warm treatment, varied but within the same cozy family. */
export const MOODS: Record<Mood, MoodStyle> = {
  warm: { label: 'warm', bg: '#f7e7d3', ink: '#3a2a1d', accent: '#c2683d' },
  spark: { label: 'spark', bg: '#fbeccb', ink: '#3a2c12', accent: '#d99f57' },
  calm: { label: 'calm', bg: '#e9eede', ink: '#2f3520', accent: '#88976a' },
  night: { label: 'night', bg: '#e3d8ce', ink: '#2b2018', accent: '#6f4e37' },
  bitter: { label: 'bitter', bg: '#f1ddd2', ink: '#3a241a', accent: '#ad5430' },
  sweet: { label: 'sweet', bg: '#fbe6d8', ink: '#3a261c', accent: '#e8b06f' },
}

export function moodStyle(mood?: Mood): MoodStyle {
  return MOODS[mood ?? 'warm'] ?? MOODS.warm
}
