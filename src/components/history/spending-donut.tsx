'use client'

import * as React from 'react'

interface SpendingSlice {
  potName: string
  amountPence: number
  color: string
}

interface SpendingDonutProps {
  slices: SpendingSlice[]
}

const CHART_COLORS = [
  'oklch(0.499 0.252 278.7)', // violet (primary)
  'oklch(0.623 0.214 259.815)',
  'oklch(0.809 0.105 251.813)',
  'oklch(0.546 0.245 262.881)',
  'oklch(0.424 0.199 265.638)',
  'oklch(0.488 0.243 264.376)',
]

export function assignColors(potIds: number[]): Record<number, string> {
  const result: Record<number, string> = {}
  potIds.forEach((id, i) => {
    result[id] = CHART_COLORS[i % CHART_COLORS.length]
  })
  return result
}

export function SpendingDonut({ slices }: SpendingDonutProps) {
  const total = slices.reduce((s, sl) => s + sl.amountPence, 0)

  if (total === 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-40 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="size-full">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="18"
            />
          </svg>
          <span className="absolute text-xs text-muted-foreground">No data</span>
        </div>
      </div>
    )
  }

  // Build SVG arcs
  const cx = 60
  const cy = 60
  const r = 45
  const circumference = 2 * Math.PI * r

  const { paths } = slices.reduce<{
    paths: Array<{ dashArray: string; rotation: number; color: string; potName: string; fraction: number }>
    offset: number
  }>(
    ({ paths, offset }, slice) => {
      const fraction = slice.amountPence / total
      return {
        paths: [...paths, {
          dashArray: `${fraction * circumference} ${circumference}`,
          rotation: (offset / total) * 360 - 90,
          color: slice.color,
          potName: slice.potName,
          fraction,
        }],
        offset: offset + slice.amountPence,
      }
    },
    { paths: [], offset: 0 }
  )

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          {paths.map((p, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="18"
              strokeDasharray={p.dashArray}
              strokeDashoffset={0}
              style={{ transform: `rotate(${p.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-semibold">£{(total / 100).toFixed(0)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full shrink-0"
                style={{ background: slice.color }}
              />
              <span className="text-sm">{slice.potName}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              £{(slice.amountPence / 100).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
