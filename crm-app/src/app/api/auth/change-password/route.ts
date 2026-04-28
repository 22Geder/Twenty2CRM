import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const runtime = 'nodejs'

// 🔑 שינוי סיסמה למשתמש מחובר
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "יש להתחבר תחילה" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // וולידציה
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "יש למלא סיסמה נוכחית וסיסמה חדשה" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים" },
        { status: 400 }
      )
    }

    // שלוף את המשתמש
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: "משתמש לא נמצא" },
        { status: 404 }
      )
    }

    // בדוק סיסמה נוכחית
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "הסיסמה הנוכחית שגויה" },
        { status: 400 }
      )
    }

    // הצפן סיסמה חדשה
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // עדכן
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedAt: null,
        lockToken: null,
        lockTokenExpiresAt: null,
      }
    })

    console.log(`🔑 Password changed for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: "הסיסמה שונתה בהצלחה! ✅"
    })

  } catch (error: any) {
    console.error("❌ Change password error:", error)
    return NextResponse.json(
      { error: "שגיאה בשינוי הסיסמה" },
      { status: 500 }
    )
  }
}
