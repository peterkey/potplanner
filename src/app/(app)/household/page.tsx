import { getHouseholdMembers } from '@/lib/dal/household-members'
import { MemberList } from '@/components/household/member-list'
import { PageTransition } from '@/components/page-transition'

export default async function HouseholdPage() {
  const members = await getHouseholdMembers()
  return (
    <PageTransition>
      <div className="px-6 md:px-8 py-8 max-w-2xl">
        <MemberList members={members} />
      </div>
    </PageTransition>
  )
}
