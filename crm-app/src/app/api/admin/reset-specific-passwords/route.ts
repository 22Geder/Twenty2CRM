import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// One-time password reset endpoint - protected by secret key
// Usage: GET /api/admin/reset-specific-passwords?secret=t22reset2026

const RESET_SECRET = 't22reset2026'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== RESET_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const usersToReset = [
    { email: 'aviranpa007@gmail.com', name: 'Aviran' },
    { email: '22geder@gmail.com',     name: '22Geder' },
  ]

  const newPassword = 'avigdor22'
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  const results = []

  for (const u of usersToReset) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })

    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedAt: null,
          lockToken: null,
          lockTokenExpiresAt: null,
          active: true,
        },
      })
      results.push({ email: u.email, status: 'updated ✅' })
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          password: hashedPassword,
          role: 'RECRUITER',
          failedLoginAttempts: 0,
          active: true,
        },
      })
      results.push({ email: u.email, status: 'created ✅' })
    }
  }

  return NextResponse.json({
    message: 'סיסמאות אופסו בהצלחה',
    password: newPassword,
    results,
  })
}
