import { getHouseholdMembers } from '@/lib/dal/household-members'
import { getAllUsersSafe, getUserById } from '@/lib/dal/auth'
import { verifySession } from '@/lib/auth/session'
import { MemberList } from '@/components/household/member-list'
import { UserAccountsList } from '@/components/household/user-accounts-list'
import { PageTransition } from '@/components/page-transition'

export default async function HouseholdPage() {
  const [members, { userId }] = await Promise.all([
    getHouseholdMembers(),
    verifySession(),
  ])

  const currentUser = await getUserById(userId)
  const isAdmin = currentUser?.isAdmin ?? false

  const users = isAdmin ? await getAllUsersSafe() : []

  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8 max-w-2xl">
        <MemberList members={members} />
        {isAdmin && (
          <UserAccountsList users={users} currentUserId={userId} />
        )}
      </div>
    </PageTransition>
  )
}
