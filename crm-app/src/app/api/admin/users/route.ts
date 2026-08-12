import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'office@hr22group.com'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return null
  }
  return session
}

// GET - רשימת כל המשתמשים
export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'אין הרשאה - מותר רק לאדמין' }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - יצירת משתמש חדש
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  try {
    const { name, email, password, role, phone } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'שם, אימייל וסיסמה הם שדות חובה' }, { status: 400 })
    }

    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'אימייל לא תקין' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'הסיסמה חייבת להיות לפחות 6 תווים' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'כתובת אימייל כבר קיימת במערכת' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'RECRUITER',
        phone: phone?.trim() || null,
        active: true,
      },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    })

    console.log(`✅ Admin created user: ${email}`)
    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - עדכון משתמש (סיסמה, תפקיד, סטטוס, שחרור נעילה)
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  try {
    const { userId, action, newPassword, role, active } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId חסר' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
    }

    // שחרור נעילה
    if (action === 'unlock') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedAt: null,
          lockToken: null,
          lockTokenExpiresAt: null,
          failedLoginAttempts: 0,
        },
      })
      return NextResponse.json({ success: true, message: `✅ חשבון ${user.name} שוחרר מנעילה` })
    }

    // שינוי סיסמה
    if (action === 'resetPassword') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'הסיסמה חייבת להיות לפחות 6 תווים' }, { status: 400 })
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedAt: null,
          lockToken: null,
          lockTokenExpiresAt: null,
        },
      })
      console.log(`🔑 Admin reset password for: ${user.email}`)
      return NextResponse.json({ success: true, message: `✅ סיסמת ${user.name} אופסה בהצלחה` })
    }

    // שינוי תפקיד
    if (action === 'changeRole') {
      const validRoles = ['ADMIN', 'MANAGER', 'RECRUITER', 'EMPLOYEE']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'תפקיד לא תקין' }, { status: 400 })
      }
      await prisma.user.update({ where: { id: userId }, data: { role } })
      return NextResponse.json({ success: true, message: `✅ תפקיד ${user.name} עודכן ל-${role}` })
    }

    // הפעלה/כיבוי חשבון
    if (action === 'toggleActive') {
      if (user.email === ADMIN_EMAIL) {
        return NextResponse.json({ error: 'לא ניתן לנטרל את חשבון האדמין הראשי' }, { status: 403 })
      }
      await prisma.user.update({ where: { id: userId }, data: { active } })
      const status = active ? 'הופעל' : 'כובה'
      return NextResponse.json({ success: true, message: `✅ חשבון ${user.name} ${status}` })
    }

    return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - מחיקת משתמש
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId חסר' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
    }

    if (user.email === ADMIN_EMAIL) {
      return NextResponse.json({ error: 'לא ניתן למחוק את חשבון האדמין הראשי' }, { status: 403 })
    }

    await prisma.user.delete({ where: { id: userId } })

    console.log(`🗑️ Admin deleted user: ${user.email}`)
    return NextResponse.json({ success: true, message: `✅ משתמש ${user.name} נמחק` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
