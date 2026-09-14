import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/api-authorization'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }

// בדיקת מצב בלבד: יצירת משתמש ראשון מחייבת תהליך מקומי ומאושר, לא נתיב HTTP.
export async function GET() {
  try {
    const authorization = await requireApiUser('ADMIN')
    if ('response' in authorization) return authorization.response

    // נשמרת החסימה הקיימת של הנתיב בסביבת ייצור.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers })
    }

    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'המערכת כבר מאותחלת',
        users: existingUsers,
      }, { headers })
    }

    // גם אם החשבון נמחק בין האימות לספירה, אין ליצור משתמש או סיסמה דרך הרשת.
    return NextResponse.json({
      error: 'אתחול משתמשים דורש הגדרה מקומית ומאושרת',
      code: 'BOOTSTRAP_REQUIRES_LOCAL_SETUP',
    }, { status: 503, headers })
  } catch {
    console.error('[init] Initialization status check failed')
    return NextResponse.json({ error: 'שגיאה באתחול המערכת' }, { status: 500, headers })
  }
}
