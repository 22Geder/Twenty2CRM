import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { toWorkDate } from '@/lib/attendance'

/**
 * POST /api/attendance/clock-in
 * רושם כניסה למשתמש המחובר עבור היום הנוכחי.
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

    // אם כבר יש כניסה - לא לעדכן (הפעלה כפולה)
    if (existing?.clockIn) {
      return NextResponse.json({
        attendance: existing,
        message: 'כבר נרשמה כניסה היום',
      })
    }

    const updated = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        clockIn: now,
        breakMinutes: 30,
        status: 'PRESENT',
      },
      update: {
        clockIn: now,
        status: existing?.status || 'PRESENT',
      },
    })

    return NextResponse.json({ attendance: updated, message: 'נכנסת בהצלחה' })
  } catch (error: any) {
    console.error('clock-in error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 })
  }
}
