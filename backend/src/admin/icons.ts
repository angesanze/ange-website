/**
 * Curated lucide icon set for the admin icon picker.
 *
 * IMPORTANT: keep this list in sync with the frontend resolver in
 * frontend/src/components/Icon.tsx (same kebab-case keys) so anything picked here
 * actually renders on the site. Emoji are always allowed in addition to these.
 */
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
  Hourglass,
  type LucideIcon,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
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
};

export const ICON_NAMES = Object.keys(ICONS);

function toKebab(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-');
}

export function resolveIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return ICONS[toKebab(name)] ?? null;
}

/** True if the value carries a non-ASCII character (an emoji / symbol glyph). */
export function isEmoji(value: string): boolean {
  return Array.from(value).some((ch) => (ch.codePointAt(0) ?? 0) > 127);
}
