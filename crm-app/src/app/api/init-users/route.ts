import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// סייקרט להגנה - DELETE THIS FILE AFTER USE
const SECRET = 'init-users-2024'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []

  const users = [
    { name: 'ספיר', email: 'sapir@twenty2crm.com', password: 'twentysapir', role: 'RECRUITER' },
    { name: 'רוני',  email: 'roni@twenty2crm.com',  password: 'twentyroni',  role: 'RECRUITER' },
  ]

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10)
    const result = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hash, name: u.name },
      create: { email: u.email, name: u.name, password: hash, role: u.role, active: true },
    })
    results.push({ name: result.name, email: result.email, status: 'ok' })
  }

  return NextResponse.json({ success: true, users: results })
}
