import {
  Terminal, Code, CodeXml, Coffee, Compass, Book, BookOpen, BookMarked,
  Folder, FolderOpen, File, FileText, Files, Home, User, UserRound, Users,
  MessageCircle, MessageCircleHeart, MessageSquare, Heart, Star, Sparkles,
  Sparkle, Zap, Flame, Lightbulb, Pen, PenTool, Pencil, Feather, NotebookPen,
  StickyNote, Hash, Tag, Tags, Globe, Map, MapPin, Rocket, Brain, Cpu, Database,
  Server, Cloud, GitBranch, Leaf, Sprout, TreePine, Mountain, Sun, Moon, Music,
  Camera, Image, Palette, Brush, Wrench, Hammer, Settings, Cog, Lock, Key,
  Shield, Eye, Search, Bell, Calendar, Clock, Archive, Inbox, Layers, Box,
  Package, LayoutGrid, List, Bot, Wand, WandSparkles, Quote, Anchor, Atom,
  Award, Bookmark, Briefcase, Telescope, Wind, Waves, Footprints, Puzzle, Gem,
  Hourglass, AtSign, Mail, ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * A curated set of lucide icons, keyed by their kebab-case name. The admin can
 * type any of these (or an emoji) into a category / section icon field. Emoji
 * cover everything the set doesn't.
 */
const ICONS: Record<string, LucideIcon> = {
  terminal: Terminal, code: Code, 'code-xml': CodeXml, coffee: Coffee,
  compass: Compass, book: Book, 'book-open': BookOpen, 'book-marked': BookMarked,
  folder: Folder, 'folder-open': FolderOpen, file: File, 'file-text': FileText,
  files: Files, home: Home, user: User, 'user-round': UserRound, users: Users,
  'message-circle': MessageCircle, 'message-circle-heart': MessageCircleHeart,
  'message-square': MessageSquare, heart: Heart, star: Star, sparkles: Sparkles,
  sparkle: Sparkle, zap: Zap, flame: Flame, lightbulb: Lightbulb, pen: Pen,
  'pen-tool': PenTool, pencil: Pencil, feather: Feather, 'notebook-pen': NotebookPen,
  'sticky-note': StickyNote, hash: Hash, tag: Tag, tags: Tags, globe: Globe,
  map: Map, 'map-pin': MapPin, rocket: Rocket, brain: Brain, cpu: Cpu,
  database: Database, server: Server, cloud: Cloud, 'git-branch': GitBranch,
  leaf: Leaf, sprout: Sprout, 'tree-pine': TreePine, mountain: Mountain, sun: Sun,
  moon: Moon, music: Music, camera: Camera, image: Image, palette: Palette,
  brush: Brush, wrench: Wrench, hammer: Hammer, settings: Settings, cog: Cog,
  lock: Lock, key: Key, shield: Shield, eye: Eye, search: Search, bell: Bell,
  calendar: Calendar, clock: Clock, archive: Archive, inbox: Inbox, layers: Layers,
  box: Box, package: Package, 'layout-grid': LayoutGrid, list: List, bot: Bot,
  wand: Wand, 'wand-sparkles': WandSparkles, quote: Quote, anchor: Anchor,
  atom: Atom, award: Award, bookmark: Bookmark, briefcase: Briefcase,
  telescope: Telescope, wind: Wind, waves: Waves, footprints: Footprints,
  puzzle: Puzzle, gem: Gem, hourglass: Hourglass,
}

/** Normalise "FolderOpen", "folder open", "folder_open" to "folder-open". */
function toKebab(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
}

/** Resolve a stored icon name to a lucide component, or null if it isn't one. */
export function resolveLucideIcon(name?: string | null): LucideIcon | null {
  if (!name) return null
  return ICONS[toKebab(name)] ?? null
}

/** A value is an emoji/symbol glyph if it carries any non-ASCII character. */
function isGlyph(value: string): boolean {
  return Array.from(value).some((ch) => (ch.codePointAt(0) ?? 0) > 127)
}

/** size-N (Tailwind) to a font-size so an emoji fills the same box as an icon. */
function emojiFontSize(className?: string): string | undefined {
  const m = className?.match(/(?:^|\s)size-(\d+(?:\.\d+)?)/)
  if (!m) return undefined
  return `${Number(m[1]) * 0.25 * 0.92}rem`
}

/**
 * Renders a stored icon: a lucide component when the name matches one, an emoji
 * glyph when it's an emoji, otherwise the provided fallback icon. This is what
 * powers configurable category and section icons.
 */
export function DynamicIcon({
  name,
  className,
  fallback: Fallback = FolderOpen,
}: {
  name?: string | null
  className?: string
  fallback?: LucideIcon
}) {
  const Comp = resolveLucideIcon(name)
  if (Comp) return <Comp className={className} />
  if (name && isGlyph(name)) {
    return (
      <span
        className={cn('inline-flex items-center justify-center leading-none', className)}
        style={{ fontSize: emojiFontSize(className) }}
        aria-hidden
      >
        {name.trim()}
      </span>
    )
  }
  return <Fallback className={className} />
}

/** Back-compat resolver for spots that just need a component (no emoji). */
export function categoryIcon(name?: string | null): LucideIcon {
  return resolveLucideIcon(name) ?? FolderOpen
}

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  github: GitBranch,
  linkedin: Briefcase,
  twitter: AtSign,
  x: AtSign,
  mail: Mail,
  email: Mail,
  website: Globe,
  globe: Globe,
}

export function socialIcon(name?: string | null): LucideIcon {
  if (!name) return ExternalLink
  return SOCIAL_ICONS[name.toLowerCase()] ?? resolveLucideIcon(name) ?? ExternalLink
}
