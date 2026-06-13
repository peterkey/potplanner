'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useMember } from '@/lib/context/member-context'
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

interface Member {
  id: number
  name: string
}

interface BottomNavProps {
  members: Member[]
}

export function BottomNav({ members }: BottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { activeMemberId, setActiveMemberId } = useMember()

  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href))
  const hasFilter = activeMemberId !== null

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
        {/* Member filter */}
        {members.length > 0 && (
          <div className="px-5 pt-4 pb-3 border-b border-border/50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2.5">
              Viewing
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveMemberId(null)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeMemberId === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                All members
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMemberId(m.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeMemberId === m.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col py-2">
          {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
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
            className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-opacity duration-150 ${
              moreOpen || isMoreActive ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <MoreHorizontal className={`h-[22px] w-[22px] ${moreOpen || isMoreActive ? 'text-primary' : 'text-foreground'}`} />
            <span className={`text-[10.5px] font-semibold tracking-wide ${moreOpen || isMoreActive ? 'text-primary' : 'text-foreground'}`}>
              More
            </span>
            {hasFilter && (
              <span className="absolute top-2.5 right-[calc(50%-14px)] h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
