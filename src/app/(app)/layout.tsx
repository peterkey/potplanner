import { verifySession } from '@/lib/auth/session'
import { getHouseholdMembers } from '@/lib/dal/household-members'
import { getCurrentUser } from '@/lib/dal/user'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { BottomNav } from '@/components/bottom-nav'
import { MemberProvider } from '@/lib/context/member-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await verifySession()
  } catch {
    redirect('/login')
  }

  const [members, user] = await Promise.all([
    getHouseholdMembers(),
    getCurrentUser(),
  ])

  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <MemberProvider>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar members={members} userInitial={userInitial} />
        <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav members={members} />
    </MemberProvider>
  )
}
