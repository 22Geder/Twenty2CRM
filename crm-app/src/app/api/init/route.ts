import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 🔧 API ליצירת משתמש admin ראשוני
// נקרא פעם אחת בלבד כשהמערכת חדשה
export async function GET() {
  try {
    // בדוק אם כבר יש משתמשים
    const existingUsers = await prisma.user.count()
    
    if (existingUsers > 0) {
      return NextResponse.json({ 
        message: 'המערכת כבר מאותחלת',
        users: existingUsers 
      })
    }

    // צור משתמש admin
    const hashedPassword = await bcrypt.hash('Admin123!', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@twenty2.co.il',
        name: 'מנהל מערכת',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('✅ משתמש Admin נוצר:', admin.email)

    return NextResponse.json({ 
      success: true,
      message: 'משתמש Admin נוצר בהצלחה!',
      email: admin.email
    })

  } catch (error) {
    console.error('❌ שגיאה באתחול:', error)
    return NextResponse.json({ 
      error: 'שגיאה באתחול המערכת',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
