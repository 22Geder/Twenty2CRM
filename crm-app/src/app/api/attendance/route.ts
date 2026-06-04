import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getMonthRange, calcBonus } from '@/lib/attendance'
import { getHolidaysForMonth } from '@/lib/jewish-holidays'

/**
 * GET /api/attendance?month=YYYY-MM&userId=XX
 * מחזיר את כל רישומי הנוכחות של המשתמש עבור החודש + חגים + גיוסים + בונוס.
 * אם userId לא מצוין - משתמש מזהה הסשן הנוכחי.
 * רק ADMIN/MANAGER יכולים לבקש userId אחר.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUserId = (session.user as any).id as string
    const sessionRole = (session.user as any).role as string
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM
    const requestedUserId = searchParams.get('userId') || sessionUserId

    // הגנה: רק אדמין/מנהל יכולים לראות נוכחות של אחרים
    if (requestedUserId !== sessionUserId && sessionRole !== 'ADMIN' && sessionRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month parameter (expected YYYY-MM)' }, { status: 400 })
    }

    const { start, end, year, month: monthNum } = getMonthRange(month)

    // 1. רישומי נוכחות
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: requestedUserId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    })

    // 2. חגים בחודש
    const holidays = getHolidaysForMonth(year, monthNum)

    // 3. גיוסים שהתקבלו (Candidates שהמשתמש העלה ושעברו לסטטוס "התקבל" באותו חודש)
    const hires = await prisma.candidate.findMany({
      where: {
        uploadedById: requestedUserId,
        hiredAt: { gte: start, lt: end },
      },
      select: {
        id: true,
        name: true,
        hiredAt: true,
        hiredToEmployerId: true,
        hiredToEmployer: { select: { id: true, name: true } },
      },
      orderBy: { hiredAt: 'asc' },
    })

    // 4. חישוב בונוס
    const bonus = calcBonus(hires.length)

    // 5. פרטי המשתמש
    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({
      month,
      user,
      attendances,
      holidays,
      hires,
      bonus,
    })
  } catch (error: any) {
    console.error('GET /api/attendance error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

/**
 * POST /api/attendance
 * עדכון/יצירת רישום ידני ליום ספציפי.
 * body: { date: 'YYYY-MM-DD', clockIn?, clockOut?, breakMinutes?, status?, notes?, userId? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionUserId = (session.user as any).id as string
    const sessionRole = (session.user as any).role as string
    const body = await request.json()

    const targetUserId: string = body.userId || sessionUserId
    if (targetUserId !== sessionUserId && sessionRole !== 'ADMIN' && sessionRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: 'Invalid date (expected YYYY-MM-DD)' }, { status: 400 })
    }

    // תאריך כיום עבודה ב-UTC חצות
    const [yy, mm, dd] = body.date.split('-').map(Number)
    const workDate = new Date(Date.UTC(yy, mm - 1, dd, 0, 0, 0, 0))

    // עוזר: מחזיר את ה-offset של ישראל (Asia/Jerusalem) ב-דקות עבור תאריך UTC נתון
    // (חיובי = UTC+ ; קיץ = +180, חורף = +120)
    const getIsraelOffsetMinutes = (utcDate: Date): number => {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jerusalem',
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric',
          hour12: false,
        }).formatToParts(utcDate)
        const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10)
        const hour = get('hour') % 24 // מטפל ב-24:00
        const israelMs = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
        return Math.round((israelMs - utcDate.getTime()) / 60000)
      } catch {
        return 180 // fallback: קיץ UTC+3
      }
    }

    // בנה שעות מלאות (אם הגיעו רק "HH:MM")
    const buildDateTime = (timeStr: string | undefined | null): Date | null => {
      if (!timeStr) return null
      // תמיכה גם ב-ISO וגם ב-"HH:MM"
      if (/^\d{2}:\d{2}$/.test(timeStr)) {
        const [h, m] = timeStr.split(':').map(Number)
        // המשתמש הזין שעה ישראלית (Asia/Jerusalem) - ממירים ל-UTC
        // דוגמה: 08:00 ישראל קיץ → 05:00 UTC
        const approxUTC = new Date(Date.UTC(yy, mm - 1, dd, h, m, 0, 0))
        const offsetMin = getIsraelOffsetMinutes(approxUTC)
        return new Date(approxUTC.getTime() - offsetMin * 60000)
      }
      const d = new Date(timeStr)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const clockIn = buildDateTime(body.clockIn)
    const clockOut = buildDateTime(body.clockOut)
    const breakMinutes = body.breakMinutes !== undefined ? Math.max(0, parseInt(body.breakMinutes, 10) || 0) : undefined
    const status = typeof body.status === 'string' ? body.status : undefined
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : undefined

    const updated = await prisma.attendance.upsert({
      where: { userId_date: { userId: targetUserId, date: workDate } },
      create: {
        userId: targetUserId,
        date: workDate,
        clockIn,
        clockOut,
        breakMinutes: breakMinutes ?? 0,
        status: status ?? 'PRESENT',
        notes,
        isManualEdit: true,
      },
      update: {
        ...(clockIn !== undefined ? { clockIn } : {}),
        ...(clockOut !== undefined ? { clockOut } : {}),
        ...(breakMinutes !== undefined ? { breakMinutes } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        isManualEdit: true,
      },
    })

    return NextResponse.json({ attendance: updated })
  } catch (error: any) {
    console.error('POST /api/attendance error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}
