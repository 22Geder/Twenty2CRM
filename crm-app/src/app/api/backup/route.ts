import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime (not Edge) to support Prisma
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// =====================================================================
// BACKUP API - יצוא כל הנתונים לגיבוי
// GET /api/backup - מוריד את כל הנתונים כ-JSON
// =====================================================================

export async function GET() {
  try {
    console.log('📦 Starting full database backup...')
    const startTime = Date.now()

    // שליפת כל הנתונים מכל הטבלאות
    const [
      candidates,
      employers,
      positions,
      tags,
      departments,
      applications,
      users,
      notes,
      documents,
      interviews,
      communications,
      notifications,
      reminders,
      emailTemplates,
      messageTemplates,
      activityLogs,
      smartMatchingFeedback,
      employerEmailHistory
    ] = await Promise.all([
      // מועמדים עם כל הקשרים
      prisma.candidate.findMany({
        include: {
          tags: true,
          documents: true,
          candidateNotes: true,
          applications: {
            include: {
              position: {
                select: { id: true, title: true }
              }
            }
          }
        }
      }),
      // מעסיקים
      prisma.employer.findMany(),
      // משרות עם תגיות
      prisma.position.findMany({
        include: {
          tags: true
        }
      }),
      // תגיות
      prisma.tag.findMany(),
      // מחלקות
      prisma.department.findMany(),
      // מועמדויות
      prisma.application.findMany(),
      // משתמשים (בלי סיסמאות)
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          departmentId: true,
          createdAt: true,
          active: true
        }
      }),
      // הערות
      prisma.note.findMany(),
      // מסמכים
      prisma.document.findMany(),
      // ראיונות
      prisma.interview.findMany(),
      // תקשורת
      prisma.communication.findMany(),
      // התראות
      prisma.notification.findMany(),
      // תזכורות
      prisma.reminder.findMany(),
      // תבניות אימייל
      prisma.emailTemplate.findMany(),
      // תבניות הודעות
      prisma.messageTemplate.findMany(),
      // לוגים
      prisma.activityLog.findMany(),
      // פידבק התאמה חכמה
      prisma.smartMatchingFeedback.findMany(),
      // היסטוריית מיילים
      prisma.employerEmailHistory.findMany()
    ])

    const backupData = {
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        source: 'Twenty2CRM',
        counts: {
          candidates: candidates.length,
          employers: employers.length,
          positions: positions.length,
          tags: tags.length,
          departments: departments.length,
          applications: applications.length,
          users: users.length,
          notes: notes.length,
          documents: documents.length,
          interviews: interviews.length,
          communications: communications.length,
          notifications: notifications.length,
          reminders: reminders.length,
          emailTemplates: emailTemplates.length,
          messageTemplates: messageTemplates.length,
          activityLogs: activityLogs.length,
          smartMatchingFeedback: smartMatchingFeedback.length,
          employerEmailHistory: employerEmailHistory.length
        }
      },
      data: {
        candidates,
        employers,
        positions,
        tags,
        departments,
        applications,
        users,
        notes,
        documents,
        interviews,
        communications,
        notifications,
        reminders,
        emailTemplates,
        messageTemplates,
        activityLogs,
        smartMatchingFeedback,
        employerEmailHistory
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Backup completed in ${duration}ms`)
    console.log(`📊 Total records: ${Object.values(backupData.metadata.counts).reduce((a, b) => a + b, 0)}`)

    // החזר את הגיבוי כקובץ JSON להורדה
    const jsonString = JSON.stringify(backupData, null, 2)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="twenty2crm-backup-${timestamp}.json"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ Backup error:', error)
    return NextResponse.json(
      { error: 'Backup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/backup - שמירת גיבוי אוטומטית + הדפסת סיכום
export async function POST() {
  try {
    console.log('📦 Creating auto-backup summary...')
    
    const counts = await Promise.all([
      prisma.candidate.count(),
      prisma.employer.count(),
      prisma.position.count(),
      prisma.application.count(),
      prisma.tag.count(),
      prisma.note.count()
    ])

    const summary = {
      timestamp: new Date().toISOString(),
      status: 'success',
      counts: {
        candidates: counts[0],
        employers: counts[1],
        positions: counts[2],
        applications: counts[3],
        tags: counts[4],
        notes: counts[5]
      },
      message: 'Database backup summary generated successfully'
    }

    console.log('✅ Backup summary:', JSON.stringify(summary, null, 2))

    return NextResponse.json(summary)
  } catch (error) {
    console.error('❌ Backup summary error:', error)
    return NextResponse.json(
      { error: 'Backup summary failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
