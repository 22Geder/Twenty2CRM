import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔔 API להתראות על מועמדים בתהליך יותר משבוע
// GET - מחזיר רשימת מועמדים שבתהליך יותר מ-7 ימים
// POST - יוצר התראות במערכת

export async function GET() {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // מצא מועמדים בסטטוס "בתהליך" יותר משבוע
    const staleCandidates = await prisma.candidate.findMany({
      where: {
        inProcessPositionId: { not: null },
        inProcessAt: { lt: oneWeekAgo }
      },
      include: {
        inProcessPosition: {
          include: { employer: true }
        }
      },
      orderBy: { inProcessAt: 'asc' }
    })

    // חשב כמה ימים כל מועמד בתהליך
    const candidatesWithDays = staleCandidates.map(c => {
      const days = Math.floor((Date.now() - (c.inProcessAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        daysInProcess: days,
        inProcessAt: c.inProcessAt,
        position: c.inProcessPosition?.title,
        employer: c.inProcessPosition?.employer?.name,
        positionId: c.inProcessPositionId
      }
    })

    return NextResponse.json({
      success: true,
      count: candidatesWithDays.length,
      candidates: candidatesWithDays
    })

  } catch (error) {
    console.error('Error fetching stale candidates:', error)
    return NextResponse.json({ error: 'Failed to fetch stale candidates' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // מצא מועמדים בסטטוס "בתהליך" יותר משבוע
    const staleCandidates = await prisma.candidate.findMany({
      where: {
        inProcessPositionId: { not: null },
        inProcessAt: { lt: oneWeekAgo }
      },
      include: {
        inProcessPosition: {
          include: { employer: true }
        }
      }
    })

    if (staleCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'אין מועמדים בתהליך יותר משבוע',
        notificationsCreated: 0
      })
    }

    // מצא את כל המשתמשים הפעילים (מגייסים ומנהלים)
    const users = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: ['ADMIN', 'MANAGER', 'RECRUITER'] }
      }
    })

    // צור התראות לכל משתמש
    let notificationsCreated = 0
    
    for (const user of users) {
      for (const candidate of staleCandidates) {
        const days = Math.floor((Date.now() - (candidate.inProcessAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))
        
        // בדוק אם כבר יש התראה על המועמד הזה היום
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'SYSTEM',
            data: { contains: candidate.id },
            createdAt: { gte: today }
          }
        })

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: `⚠️ מועמד בתהליך ${days} ימים`,
              message: `${candidate.name} בתהליך למשרת "${candidate.inProcessPosition?.title}" ב-${candidate.inProcessPosition?.employer?.name} כבר ${days} ימים. יש לעדכן סטטוס.`,
              type: 'SYSTEM',
              data: JSON.stringify({
                candidateId: candidate.id,
                candidateName: candidate.name,
                positionId: candidate.inProcessPositionId,
                positionTitle: candidate.inProcessPosition?.title,
                employerName: candidate.inProcessPosition?.employer?.name,
                daysInProcess: days
              })
            }
          })
          notificationsCreated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `נוצרו ${notificationsCreated} התראות`,
      staleCandidatesCount: staleCandidates.length,
      notificationsCreated
    })

  } catch (error) {
    console.error('Error creating stale candidate notifications:', error)
    return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 })
  }
}
