'use client'

interface PotSlice {
  name: string
  allocatedPence: number
  color: string
}

interface PotDonutProps {
  pots: PotSlice[]
  totalPence: number
}

export function PotDonut({ pots, totalPence }: PotDonutProps) {
  const allocated = pots.reduce((s, p) => s + p.allocatedPence, 0)
  const unallocated = Math.max(0, totalPence - allocated)

  const allSlices = [
    ...pots.filter((p) => p.allocatedPence > 0),
    ...(unallocated > 0 ? [{ name: 'Unallocated', allocatedPence: unallocated, color: 'var(--muted)' }] : []),
  ]

  if (allSlices.length === 0) return null

  const cx = 40
  const cy = 40
  const r = 28
  const circumference = 2 * Math.PI * r
  let offset = 0

  const paths = allSlices.map((slice) => {
    const fraction = slice.allocatedPence / totalPence
    const dashArray = `${fraction * circumference} ${circumference}`
    const rotation = (offset / totalPence) * 360 - 90
    offset += slice.allocatedPence
    return { dashArray, rotation, color: slice.color, name: slice.name }
  })

  const pct = totalPence > 0 ? Math.round((allocated / totalPence) * 100) : 0

  return (
    <div className="relative w-[80px] h-[80px] shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        {paths.map((p, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth="12"
            strokeDasharray={p.dashArray}
            strokeDashoffset={0}
            style={{ transform: `rotate(${p.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="t-caption font-money font-bold text-foreground">{pct}%</span>
      </div>
    </div>
  )
}
