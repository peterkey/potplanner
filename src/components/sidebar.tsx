'use client'

import Link from 'next/link'
import { NavLink } from '@/components/nav-link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useMember } from '@/lib/context/member-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  Banknote,
  Users,
  LogOut,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'

const OVERVIEW_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/accounts', icon: CreditCard, label: 'Accounts' },
  { href: '/pay', icon: Banknote, label: 'Income' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
]

const PLANNING_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/debts', icon: TrendingDown, label: 'Debts' },
  { href: '/savings', icon: Target, label: 'Savings' },
]

const SETTINGS_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/household', icon: Users, label: 'Household' },
]

interface Member {
  id: number
  name: string
}

interface SidebarProps {
  members: Member[]
  userInitial: string
}

function NavGroup({ label, items }: { label: string; items: { href: string; icon: LucideIcon; label: string }[] }) {
  return (
    <div className="mb-3">
      <p className="t-caption uppercase tracking-widest text-muted-foreground/50 px-3 mb-1.5">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ href, icon, label: itemLabel }) => (
          <NavLink key={href} href={href} icon={icon}>
            {itemLabel}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export function Sidebar({ members, userInitial }: SidebarProps) {
  const { activeMemberId, setActiveMemberId } = useMember()

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Branded header */}
      <div
        className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border"
        style={{ background: 'var(--sidebar-header-bg)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FF3B30 0%, #E0321F 100%)',
            boxShadow: '0 2px 8px rgba(255,59,48,0.35)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M3 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="7.5" cy="6" r="1.75" stroke="white" strokeWidth="1.5"/>
            <path d="M5.5 9.5h4M5.5 11.5h2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <Link href="/" className="text-[17px] font-bold tracking-tight text-foreground select-none">
          PotPlanner
        </Link>
      </div>

      {/* Member selector */}
      {members.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <p className="t-caption px-1 mb-1.5 uppercase tracking-widest text-muted-foreground/50">
            Viewing
          </p>
          <Select
            value={activeMemberId?.toString() ?? 'all'}
            onValueChange={(v) => setActiveMemberId(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <NavGroup label="Overview" items={OVERVIEW_ITEMS} />
        <NavGroup label="Planning" items={PLANNING_ITEMS} />
        <NavGroup label="Settings" items={SETTINGS_ITEMS} />
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        <ThemeToggle />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[11px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF3B30 0%, #E0321F 100%)' }}
            >
              {userInitial}
            </div>
            <span className="t-label text-muted-foreground truncate max-w-[100px]">Account</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
