import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/session'
import { getAllUsers } from '@/lib/dal/auth'

export async function GET() {
  try {
    await verifyAdminSession()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await getAllUsers()
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
    }))
  )
}
