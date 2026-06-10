'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

export function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 t-label transition-all duration-100 border-l-2 ${
        isActive
          ? 'bg-primary/8 text-primary font-semibold border-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent'
      }`}
    >
      <Icon className="h-[15px] w-[15px] shrink-0" />
      {children}
    </Link>
  )
}
