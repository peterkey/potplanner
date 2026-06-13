'use client'

interface KpiCardProps {
  label: string
  value: string
  sub: string
  intent?: 'default' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}

export function KpiCard({ label, value, sub, intent = 'default', icon }: KpiCardProps) {
  const subColor =
    intent === 'success' ? 'var(--color-success)' :
    intent === 'warning' ? 'var(--color-warning)' :
    intent === 'danger' ? 'var(--tw-color-destructive, #EF4444)' :
    undefined

  return (
    <div className="elevation-1 px-5 py-4 overflow-hidden">
      <div className="flex items-start justify-between mb-2">
        <p className="t-label text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
      </div>
      <p className="text-[clamp(1rem,4vw,2rem)] font-bold font-money leading-[1.1] tracking-tight mb-1">{value}</p>
      <p className="t-caption" style={{ color: subColor ?? 'var(--muted-foreground)' }}>{sub}</p>
    </div>
  )
}
