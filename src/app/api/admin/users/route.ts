import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/session'
import { getAllUsersSafe } from '@/lib/dal/auth'

export async function GET() {
  try {
    await verifyAdminSession()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await getAllUsersSafe()
  return NextResponse.json(users)
}
