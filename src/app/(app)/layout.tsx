import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    await verifySession()
  } catch {
    redirect('/login')
  }
  return <>{children}</>
}
