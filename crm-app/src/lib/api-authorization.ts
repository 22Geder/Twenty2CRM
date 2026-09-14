import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export type ApiUser = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  lockedAt: Date | null
}

export type ApiAuthorization = { user: ApiUser } | { response: NextResponse }

const headers = { 'Cache-Control': 'private, no-store' }

// בודקים את החשבון בכל בקשה; הרשאות מתוך JWT ישן אינן מקור סמכות.
export async function requireApiUser(role?: 'ADMIN'): Promise<ApiAuthorization> {
  try {
    const session = await getServerSession(authOptions)
    const id = session?.user?.id
    if (typeof id !== 'string' || !id.trim()) {
      return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers }) }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, active: true, lockedAt: true },
    })

    if (!user || user.active !== true || user.lockedAt !== null || (role && user.role !== role)) {
      return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403, headers }) }
    }

    return { user }
  } catch {
    // אין לחשוף פרטי התחברות, משתמשים או שאילתות בלוג או בתשובה.
    console.error('[api-authorization] Authorization check failed')
    return { response: NextResponse.json({ error: 'Internal server error' }, { status: 500, headers }) }
  }
}