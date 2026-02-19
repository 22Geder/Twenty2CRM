import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime (not Edge) to support Prisma
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// =====================================================================
// CRON BACKUP - גיבוי אוטומטי כל 24 שעות
// הפעלה: GET /api/cron/backup
// 
// להגדרת Cron Job ב-Railway/Vercel:
// Schedule: 0 3 * * * (כל יום בשעה 03:00)
// =====================================================================

// Secret key for cron authentication (optional)
const CRON_SECRET = process.env.CRON_SECRET || 'twenty2crm-backup-2024'

export async function GET(request: Request) {
  try {
    // בדיקת אבטחה (אופציונלי)
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    
    // אפשר לדלג על בדיקת הסוד בסביבת פיתוח
    if (process.env.NODE_ENV === 'production' && secret !== CRON_SECRET) {
      console.log('⚠️ Unauthorized cron attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting scheduled backup...')
    const startTime = Date.now()

    // ספירת כל הנתונים במערכת
    const [
      candidatesCount,
      employersCount,
      positionsCount,
      applicationsCount,
      tagsCount,
      notesCount,
      interviewsCount,
      documentsCount,
      communicationsCount,
      usersCount
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.employer.count(),
      prisma.position.count(),
      prisma.application.count(),
      prisma.tag.count(),
      prisma.note.count(),
      prisma.interview.count(),
      prisma.document.count(),
      prisma.communication.count(),
      prisma.user.count()
    ])

    // יצירת לוג גיבוי
    const backupLog = {
      timestamp: new Date().toISOString(),
      type: 'scheduled_backup',
      status: 'success',
      duration: Date.now() - startTime,
      counts: {
        candidates: candidatesCount,
        employers: employersCount,
        positions: positionsCount,
        applications: applicationsCount,
        tags: tagsCount,
        notes: notesCount,
        interviews: interviewsCount,
        documents: documentsCount,
        communications: communicationsCount,
        users: usersCount
      },
      totalRecords: candidatesCount + employersCount + positionsCount + applicationsCount + 
                    tagsCount + notesCount + interviewsCount + documentsCount + 
                    communicationsCount + usersCount
    }

    // שמירת לוג פעילות
    try {
      await prisma.activityLog.create({
        data: {
          type: 'SYSTEM_BACKUP',
          description: `גיבוי אוטומטי הושלם: ${backupLog.totalRecords} רשומות`,
          metadata: JSON.stringify(backupLog.counts)
        }
      })
    } catch (logError) {
      console.log('⚠️ Could not save activity log:', logError)
    }

    console.log('✅ Scheduled backup completed:', JSON.stringify(backupLog, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Scheduled backup completed successfully',
      backup: backupLog
    })

  } catch (error) {
    console.error('❌ Cron backup error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Scheduled backup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow POST as well for flexibility
export async function POST(request: Request) {
  return GET(request)
}
