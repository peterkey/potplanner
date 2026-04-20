import { getAccounts } from '@/lib/dal/accounts'
import { AccountList } from '@/components/accounts/account-list'

export default async function AccountsPage() {
  const accounts = await getAccounts()
  return (
    <div className="px-6 md:px-8 py-8">
      <AccountList accounts={accounts} />
    </div>
  )
}
