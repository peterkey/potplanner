import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NavLink } from '@/components/nav-link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await verifySession()
  } catch {
    redirect('/login')
  }
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-sidebar">
        <div className="flex h-14 items-center px-4 md:px-6 gap-6">
          <Link href="/" className="text-lg font-semibold text-primary shrink-0">
            PotPlanner
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/accounts">Accounts</NavLink>
            <NavLink href="/pots">Pots</NavLink>
            <NavLink href="/bills">Bills</NavLink>
            <NavLink href="/history">History</NavLink>
            <NavLink href="/debts">Debts</NavLink>
            <NavLink href="/savings">Savings</NavLink>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto">{children}</main>
    </div>
  )
}
