'use client'

import { useState } from 'react'

interface BillLogoProps {
  name: string
  size?: number
}

export function BillLogo({ name, size = 24 }: BillLogoProps) {
  const [hasError, setHasError] = useState(false)
  const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
  const initials = name.slice(0, 2).toUpperCase()

  if (hasError) {
    return (
      <div
        className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next-eslint/no-img-element
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      width={size}
      height={size}
      className="rounded-full shrink-0 object-contain"
      onError={() => setHasError(true)}
    />
  )
}
