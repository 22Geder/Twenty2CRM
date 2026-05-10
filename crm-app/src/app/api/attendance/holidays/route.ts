import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getHolidaysForYear, getHolidaysForRange, getHolidaysForNextYears } from '@/lib/jewish-holidays'

/**
 * GET /api/attendance/holidays?year=YYYY
 * GET /api/attendance/holidays?from=YYYY-MM&to=YYYY-MM
 * GET /api/attendance/holidays?yearsAhead=10
 *
 * מחזיר חגים יהודיים + ישראליים. מחושב מקומית מ-@hebcal/core, ללא תלות ברשת.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const yearsAhead = searchParams.get('yearsAhead')

    if (year) {
      const y = parseInt(year, 10)
      if (!y || y < 1900 || y > 2200) {
        return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
      }
      return NextResponse.json({ holidays: getHolidaysForYear(y) })
    }

    if (from && to) {
      const fromMatch = from.match(/^(\d{4})-(\d{2})$/)
      const toMatch = to.match(/^(\d{4})-(\d{2})$/)
      if (!fromMatch || !toMatch) {
        return NextResponse.json({ error: 'Invalid from/to (expected YYYY-MM)' }, { status: 400 })
      }
      const result = getHolidaysForRange(
        parseInt(fromMatch[1], 10),
        parseInt(fromMatch[2], 10),
        parseInt(toMatch[1], 10),
        parseInt(toMatch[2], 10),
      )
      return NextResponse.json({ holidays: result })
    }

    if (yearsAhead) {
      const n = Math.min(20, Math.max(1, parseInt(yearsAhead, 10) || 10))
      return NextResponse.json({ holidays: getHolidaysForNextYears(n) })
    }

    // ברירת מחדל - השנה הנוכחית
    const currentYear = new Date().getFullYear()
    return NextResponse.json({ holidays: getHolidaysForYear(currentYear) })
  } catch (error: any) {
    console.error('holidays error:', error?.message || error)
    return NextResponse.json({ error: 'Failed to load holidays' }, { status: 500 })
  }
}
