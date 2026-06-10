'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  TrendingUp,
  MoreHorizontal,
  TrendingDown,
  Target,
  Users,
} from 'lucide-react'

const PRIMARY_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/accounts', icon: CreditCard, label: 'Accounts' },
  { href: '/pay', icon: Banknote, label: 'Pay' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
]

const MORE_ITEMS = [
  { href: '/debts', icon: TrendingDown, label: 'Debts' },
  { href: '/savings', icon: Target, label: 'Savings' },
  { href: '/household', icon: Users, label: 'Household' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => { setMoreOpen(false) }, [pathname])

  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href))

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className="fixed inset-x-0 z-40 md:hidden transition-transform duration-200 ease-out bg-card border-t border-border/70"
        style={{
          bottom: 'calc(4rem + env(safe-area-inset-bottom))',
          transform: moreOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="flex flex-col py-2">
          {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-5 py-3.5 transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-foreground'}`} />
                <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-card border-t border-border/70"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {PRIMARY_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <Icon className={`h-[22px] w-[22px] ${isActive ? 'text-primary' : 'text-foreground'}`} />
                <span className={`text-[10.5px] font-semibold tracking-wide ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-opacity duration-150 ${
              moreOpen || isMoreActive ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <MoreHorizontal className={`h-[22px] w-[22px] ${moreOpen || isMoreActive ? 'text-primary' : 'text-foreground'}`} />
            <span className={`text-[10.5px] font-semibold tracking-wide ${moreOpen || isMoreActive ? 'text-primary' : 'text-foreground'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
