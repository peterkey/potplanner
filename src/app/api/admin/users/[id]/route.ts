import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth/session'
import { getUserById, deleteUserById } from '@/lib/dal/auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: { userId: number }
  try {
    session = await verifyAdminSession()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const targetId = Number(id)

  if (isNaN(targetId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  if (targetId === session.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const target = await getUserById(targetId)
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (target.isAdmin) {
    return NextResponse.json({ error: 'Admin accounts cannot be deleted' }, { status: 400 })
  }

  await deleteUserById(targetId)
  return new NextResponse(null, { status: 204 })
}
