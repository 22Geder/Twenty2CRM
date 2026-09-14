import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const headers = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    // בודקים הרשאה עדכנית כדי שחשבון שנחסם או איבד הרשאה לא יסתמך על JWT ישן.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, active: true, lockedAt: true },
    })
    if (!user || user.role !== 'ADMIN' || !user.active || user.lockedAt) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers })
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users }, { headers })
  } catch {
    // ללא פרטי משתמשים, שאילתות או סודות בלוגים.
    console.error('[list-users] Failed to list users')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
