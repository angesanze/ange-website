import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  hierarchy,
  treemap,
  treemapSquarify,
  type HierarchyRectangularNode,
} from 'd3-hierarchy'
import { motion } from 'framer-motion'
import { ArrowUpRight, MessageCircleHeart } from 'lucide-react'
import { DynamicIcon } from './Icon'
import { contrastText } from '@/lib/color'

export interface TreeBlock {
  key: string
  label: string
  value: number
  color: string
  accent?: string | null
  icon?: string | null
  href: string
  kind: 'folder' | 'thoughts'
  meta: string
}

interface TreeDatum {
  value?: number
  block?: TreeBlock
  children?: TreeDatum[]
}

interface Tile {
  block: TreeBlock
  x: number
  y: number
  w: number
  h: number
}

function computeTiles(blocks: TreeBlock[]): Tile[] {
  if (blocks.length === 0) return []

  const root = hierarchy<TreeDatum>({
    children: blocks.map((b) => ({ value: b.value, block: b })),
  })
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  treemap<TreeDatum>()
    .size([100, 100])
    .paddingInner(0.8)
    .round(false)
    .tile(treemapSquarify.ratio(1))(root)

  return (root.leaves() as HierarchyRectangularNode<TreeDatum>[]).map((leaf) => ({
    block: leaf.data.block as TreeBlock,
    x: leaf.x0,
    y: leaf.y0,
    w: leaf.x1 - leaf.x0,
    h: leaf.y1 - leaf.y0,
  }))
}

/** The homepage filesystem: a big square split into content blocks sized by volume. */
export function Treemap({ blocks }: { blocks: TreeBlock[] }) {
  const tiles = useMemo(() => computeTiles(blocks), [blocks])

  return (
    // `container-type: inline-size` lets tile text be sized in `cqi` units, so the
    // whole square — and every label inside it — scales proportionally with its
    // width. That keeps the home elegant on a phone instead of cramped/overflowing.
    <div
      className="relative mx-auto aspect-square w-full max-w-[600px]"
      style={{ containerType: 'inline-size' }}
    >
      {tiles.map(({ block, x, y, w, h }, i) => (
        <TileView key={block.key} block={block} x={x} y={y} w={w} h={h} index={i} />
      ))}
    </div>
  )
}

function TileView({ block, x, y, w, h, index }: Tile & { index: number }) {
  const ink = contrastText(block.color)
  const big = w > 24 && h > 20
  const medium = w > 15 && h > 13
  // Tiered sizes expressed in container units: readable on the big desktop square,
  // gracefully smaller (never cramped) as the square shrinks on mobile.
  const labelSize = big
    ? 'clamp(0.85rem, 4.2cqi, 1.5rem)'
    : medium
      ? 'clamp(0.72rem, 3cqi, 1.05rem)'
      : 'clamp(0.6rem, 2.3cqi, 0.85rem)'
  const iconClass = big ? 'size-5' : medium ? 'size-4' : 'size-3.5'
  // Solid category colour with a soft sheen (light top-left, shaded bottom-right)
  // for depth — keeps every tile saturated and distinct, even on the warm canvas.
  const background = `linear-gradient(155deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.16) 100%), ${block.color}`

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
      initial={{ opacity: 0.5, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.03, ease: 'easeOut' }}
    >
      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }} className="size-full">
        <Link
          to={block.href}
          aria-label={`${block.label} — ${block.meta}`}
          className="group relative flex size-full flex-col justify-between overflow-hidden rounded-2xl border border-black/5 p-3 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-4"
          style={{
            background,
            color: ink,
            ...(block.kind === 'thoughts'
              ? { outline: `2px dashed ${ink}55`, outlineOffset: '-7px' }
              : null),
          }}
        >
          <div className="flex items-start justify-between">
            <DynamicIcon
              name={block.icon}
              className={`${iconClass} opacity-90`}
              fallback={block.kind === 'thoughts' ? MessageCircleHeart : undefined}
            />
            <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-80" />
          </div>

          <div>
            <h3
              className="font-display leading-tight text-balance"
              style={{ color: ink, fontSize: labelSize }}
            >
              {block.label}
            </h3>
            {(big || medium) && (
              <p
                className="path-text mt-0.5 opacity-75"
                style={{ fontSize: 'clamp(0.55rem, 1.9cqi, 0.75rem)' }}
              >
                {block.meta}
              </p>
            )}
          </div>
        </Link>
      </motion.div>
    </motion.div>
  )
}
