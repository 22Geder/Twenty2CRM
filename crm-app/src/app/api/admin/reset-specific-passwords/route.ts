import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireApiUser } from '@/lib/api-authorization'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }
const usersToReset = [
  { email: 'aviranpa007@gmail.com' },
  { email: '22geder@gmail.com' },
]
const requestSchema = z.object({
  newPassword: z.string().min(12).max(128).refine(password => password.trim().length >= 12),
}).strict()

function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  if (fetchSite === 'cross-site') return false
  // היעדר Origin מותר רק ללקוח שאינו שולח כותרת דפדפן, לאחר אימות מנהל.
  if (origin === null) return fetchSite === null
  if (origin === request.nextUrl.origin) return true

  try {
    const configuredUrl = process.env.NEXTAUTH_URL
    if (!configuredUrl) return false
    const url = new URL(configuredUrl)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && origin === url.origin
  } catch {
    return false
  }
}

// GET נשמר לתצוגה מקדימה בלבד; כותרת אישור או סיסמה בכתובת אינן מפעילות איפוס.
export async function GET() {
  try {
    const authorization = await requireApiUser('ADMIN')
    if ('response' in authorization) return authorization.response

    const results = []
    for (const { email } of usersToReset) {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      results.push({ email, status: existing ? 'ready' : 'not_found' })
    }
    return NextResponse.json({
      message: 'תצוגה מקדימה בלבד. לא בוצע איפוס סיסמאות.',
      results,
    }, { headers })
  } catch {
    console.error('[admin/reset-specific-passwords] Preview failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

// כתיבה מחייבת מנהל פעיל, אישור בכותרת וסיסמה מפורשת בגוף POST בלבד.
export async function POST(request: NextRequest) {
  try {
    const authorization = await requireApiUser('ADMIN')
    if ('response' in authorization) return authorization.response

    if (request.headers.get('X-Confirm-Password-Reset') !== 'reset') {
      return NextResponse.json({ error: 'נדרש אישור מפורש לאיפוס', code: 'CONFIRMATION_REQUIRED' }, {
        status: 400,
        headers,
      })
    }
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden', code: 'UNTRUSTED_ORIGIN' }, { status: 403, headers })
    }
    if (request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415, headers })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
    }
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', code: 'INVALID_INPUT' }, { status: 400, headers })
    }

    const results = []
    let updated = 0
    for (const { email } of usersToReset) {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (!existing) {
        results.push({ email, status: 'not_found' })
        continue
      }

      // מלח נפרד לכל חשבון קיים; חשבון חסר לעולם אינו נוצר מחדש.
      const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12)
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedAt: null,
          lockToken: null,
          lockTokenExpiresAt: null,
          active: true,
        },
      })
      updated++
      results.push({ email, status: 'updated ✅' })
    }

    return NextResponse.json({
      message: updated === usersToReset.length
        ? 'סיסמאות אופסו בהצלחה'
        : updated > 0 ? 'סיסמאות אופסו לחשבונות הקיימים בלבד' : 'לא נמצאו חשבונות לאיפוס',
      results,
    }, { headers })
  } catch {
    console.error('[admin/reset-specific-passwords] Password reset failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
