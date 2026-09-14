import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { requireApiUser } from '@/lib/api-authorization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }
const targetFields = {
  email: z.string().trim().max(254).email().toLowerCase().optional(),
  userId: z.string().min(1).max(128).refine(id => !/[^a-zA-Z0-9_-]/.test(id)).optional(),
}
const requestSchema = z.discriminatedUnion('action', [
  z.object({ ...targetFields, action: z.literal('unlock') }).strict(),
  z.object({
    ...targetFields,
    // resetPassword הוא שם הפעולה בממשק; reset נשמר ככינוי מפורש לאיפוס.
    action: z.enum(['resetPassword', 'reset']),
    newPassword: z.string().min(12).max(128).refine(password => password.trim().length >= 12),
  }).strict(),
]).refine(input => (input.email !== undefined) !== (input.userId !== undefined))

function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  if (fetchSite === 'cross-site') return false
  // לקוח ניהולי שאינו דפדפן רשאי להשמיט Origin, אך עדיין חייב session מנהל תקף.
  if (origin === null) return fetchSite === null
  if (origin === request.nextUrl.origin) return true

  // כתובת מוגדרת תומכת ב-proxy בלי לסמוך על כותרות Host/Forwarded שמגיעות מהלקוח.
  try {
    const configuredUrl = process.env.NEXTAUTH_URL
    if (!configuredUrl) return false
    const url = new URL(configuredUrl)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && origin === url.origin
  } catch {
    return false
  }
}

// פעולות ניהול חשבונות מחייבות session והרשאת ADMIN עדכנית; סוד משותף אינו משמש לאימות.

export async function GET() {
  try {
    const authorization = await requireApiUser('ADMIN')
    if ('response' in authorization) return authorization.response

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        failedLoginAttempts: true,
        lockedAt: true,
        lastLoginAt: true,
      },
      orderBy: { name: 'asc' }
    })

    const summary = {
      total: users.length,
      locked: users.filter(u => u.lockedAt).length,
      inactive: users.filter(u => !u.active).length,
      withFailedAttempts: users.filter(u => u.failedLoginAttempts > 0).length,
    }

    return NextResponse.json({ summary, users }, { headers })
  } catch {
    console.error('[admin/reset-password] Failed to list users')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await requireApiUser('ADMIN')
    if ('response' in authorization) return authorization.response

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
    const input = parsed.data
    const user = await prisma.user.findUnique({
      where: input.userId ? { id: input.userId } : { email: input.email },
      select: { id: true, name: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers })
    }

    // פעולה: שחרור נעילה בלבד, ללא גיבוב או שינוי סיסמה.
    if (input.action === 'unlock') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockedAt: null,
          lockToken: null,
          lockTokenExpiresAt: null,
          failedLoginAttempts: 0,
          active: true,
        },
      })
      console.log('[admin/reset-password] Account unlocked')
      return NextResponse.json({
        success: true,
        message: `✅ החשבון של ${user.name} (${user.email}) שוחרר מנעילה!`,
      }, { headers })
    }

    // סיסמה נמסרת במפורש ועוברת בדיקה לפני גיבוב; אין סיסמת ברירת מחדל.
    const hashedPassword = await bcrypt.hash(input.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedAt: null,
        lockToken: null,
        lockTokenExpiresAt: null,
        active: true,
      },
    })
    console.log('[admin/reset-password] Password reset completed')
    return NextResponse.json({
      success: true,
      message: `✅ הסיסמה של ${user.name} (${user.email}) אופסה בהצלחה!`,
    }, { headers })
  } catch {
    console.error('[admin/reset-password] Password reset failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
