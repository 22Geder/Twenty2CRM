import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { toWorkDate } from '@/lib/attendance'

/**
 * POST /api/attendance/clock-out
 * רושם יציאה למשתמש המחובר עבור היום הנוכחי.
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const now = new Date()
    const today = toWorkDate(now)

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    })

    if (!existing || !existing.clockIn) {
      return NextResponse.json({ error: 'לא נמצאה כניסה להיום - יש להירשם כניסה תחילה' }, { status: 400 })
    }

    const updated = await prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: { clockOut: now },
    })

    return NextResponse.json({ attendance: updated, message: 'יצאת בהצלחה' })
  } catch (error: any) {
    console.error('clock-out error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 })
  }
}
