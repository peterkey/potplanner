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
      <nav className="h-14 border-b border-border bg-sidebar flex items-center px-6">
        <Link href="/" className="text-lg font-semibold text-primary mr-8">PotPlanner</Link>
        <div className="flex gap-6">
          <NavLink href="/accounts">Accounts</NavLink>
          <NavLink href="/pots">Pots</NavLink>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto">{children}</main>
    </div>
  )
}
