import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

// 🔒 איפוס סיסמה ושחרור נעילה ע"י אדמין
// GET - בדיקת סטטוס כל המשתמשים
// POST - איפוס סיסמה לאימייל ספציפי

const ADMIN_SECRET = process.env.ADMIN_RESET_SECRET || 't22-admin-reset-2026'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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

    return NextResponse.json({ summary, users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, email, newPassword, action } = body

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 })
    }

    // פעולה: שחרור נעילה בלבד
    if (action === 'unlock') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockedAt: null,
          lockToken: null,
          lockTokenExpiresAt: null,
          failedLoginAttempts: 0,
          active: true,
        }
      })

      console.log(`🔓 Admin unlocked account: ${email}`)
      return NextResponse.json({
        success: true,
        message: `✅ החשבון של ${user.name} (${email}) שוחרר מנעילה!`
      })
    }

    // פעולה: איפוס סיסמה (+ שחרור נעילה)
    const password = newPassword || 'avigdor22'
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedAt: null,
        lockToken: null,
        lockTokenExpiresAt: null,
        active: true,
      }
    })

    console.log(`🔑 Admin reset password for: ${email}`)

    return NextResponse.json({
      success: true,
      message: `✅ הסיסמה של ${user.name} (${email}) אופסה בהצלחה!`,
      newPassword: password,
    })

  } catch (error: any) {
    console.error("❌ Admin reset error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
