import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ===================================================================
// GET /api/system-registry
// פנקס רישום מערכת - מחזיר סטטיסטיקות ומצב עדכני של כל הנתונים
// ===================================================================

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      // ספירות כלליות
      totalCandidates,
      totalPositions,
      totalEmployers,
      totalApplications,
      totalInterviews,
      totalDocuments,
      totalTags,
      totalUsers,
      totalNotes,
      totalReminders,
      totalWhatsAppLogs,
      totalCommunications,

      // שבוע אחרון
      newCandidatesWeek,
      newPositionsWeek,
      newApplicationsWeek,
      newInterviewsWeek,

      // חודש אחרון
      newCandidatesMonth,
      newPositionsMonth,

      // מועמדים - פירוט
      candidatesWithCV,
      candidatesWithAI,
      candidatesHired,
      candidatesUnsubscribed,
      candidatesWithCity,
      candidatesInProcess,

      // משרות - פירוט
      activePositions,
      inactivePositions,

      // ראיונות קרובים
      upcomingInterviews,

      // תזכורות פתוחות
      openReminders,

      // פעילות אחרונה
      recentActivity,

      // מועמד אחרון
      latestCandidate,

      // משרה אחרונה
      latestPosition,

      // מעסיקים עם משרות
      employersWithPositions,

      // סטטוס applications
      applicationsByStage,

    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.position.count(),
      prisma.employer.count(),
      prisma.application.count(),
      prisma.interview.count(),
      prisma.document.count(),
      prisma.tag.count(),
      prisma.user.count(),
      prisma.note.count(),
      prisma.reminder.count(),
      prisma.whatsAppLog.count(),
      prisma.communication.count(),

      // שבוע אחרון
      prisma.candidate.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.position.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.application.count({ where: { appliedAt: { gte: sevenDaysAgo } } }),
      prisma.interview.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // חודש אחרון
      prisma.candidate.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.position.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // פירוט מועמדים
      prisma.candidate.count({ where: { resumeUrl: { not: null } } }),
      prisma.candidate.count({ where: { aiProfile: { not: null } } }),
      prisma.candidate.count({ where: { hiredAt: { not: null } } }),
      prisma.candidate.count({ where: { unsubscribed: true } }),
      prisma.candidate.count({ where: { city: { not: null } } }),
      prisma.candidate.count({ where: { inProcessPositionId: { not: null } } }),

      // פירוט משרות
      prisma.position.count({ where: { active: true } }),
      prisma.position.count({ where: { active: false } }),

      // ראיונות קרובים (7 ימים הבאים)
      prisma.interview.findMany({
        where: {
          scheduledAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          status: 'SCHEDULED'
        },
        include: {
          candidate: { select: { name: true } },
          position: { select: { title: true } }
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10
      }),

      // תזכורות פתוחות
      prisma.reminder.count({ where: { completed: false, dueDate: { gte: now } } }),

      // פעילות אחרונה
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          user: { select: { name: true } }
        }
      }),

      // מועמד אחרון
      prisma.candidate.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { name: true, createdAt: true, city: true, source: true }
      }),

      // משרה אחרונה
      prisma.position.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { title: true, createdAt: true, active: true, employer: { select: { name: true } } }
      }),

      // מעסיקים עם משרות פעילות
      prisma.employer.findMany({
        select: {
          name: true,
          _count: { select: { positions: true } }
        },
        where: {
          positions: { some: { active: true } }
        },
        orderBy: { name: 'asc' }
      }),

      // applications לפי stage
      prisma.application.groupBy({
        by: ['stage'],
        _count: { id: true }
      }),
    ])

    // API routes inventory
    const apiRoutes = [
      // מועמדים
      { group: 'מועמדים', route: '/api/candidates', methods: ['GET', 'POST'] },
      { group: 'מועמדים', route: '/api/candidates/[id]', methods: ['GET', 'PUT', 'DELETE'] },
      { group: 'מועמדים', route: '/api/notes', methods: ['GET', 'POST'] },
      { group: 'מועמדים', route: '/api/tags', methods: ['GET', 'POST', 'PUT'] },
      // משרות
      { group: 'משרות ומעסיקים', route: '/api/positions', methods: ['GET', 'POST'] },
      { group: 'משרות ומעסיקים', route: '/api/positions/[id]', methods: ['GET', 'PUT', 'DELETE'] },
      { group: 'משרות ומעסיקים', route: '/api/employers', methods: ['GET', 'POST'] },
      { group: 'משרות ומעסיקים', route: '/api/employers/[id]', methods: ['GET', 'PUT', 'DELETE'] },
      { group: 'משרות ומעסיקים', route: '/api/export-positions', methods: ['GET'] },
      { group: 'משרות ומעסיקים', route: '/api/sync-to-website', methods: ['POST'] },
      // AI
      { group: 'AI Matching', route: '/api/ai-match-v3', methods: ['POST'] },
      { group: 'AI Matching', route: '/api/smart-matching', methods: ['GET', 'POST'] },
      { group: 'AI Matching', route: '/api/best-matches', methods: ['GET'] },
      { group: 'AI Matching', route: '/api/dual-matching', methods: ['POST'] },
      { group: 'AI Matching', route: '/api/advanced-matching', methods: ['POST'] },
      { group: 'AI Matching', route: '/api/ai-analyze', methods: ['POST'] },
      { group: 'AI Matching', route: '/api/ultra-analyze', methods: ['POST'] },
      // העלאת קו"ח
      { group: 'קורות חיים', route: '/api/upload', methods: ['POST'] },
      { group: 'קורות חיים', route: '/api/analyze-cv', methods: ['POST'] },
      { group: 'קורות חיים', route: '/api/analyze-cv-dual', methods: ['POST'] },
      { group: 'קורות חיים', route: '/api/extract-cv', methods: ['POST'] },
      // Gmail
      { group: 'Gmail', route: '/api/gmail-poll', methods: ['GET'] },
      { group: 'Gmail', route: '/api/gmail-callback', methods: ['GET'] },
      { group: 'Gmail', route: '/api/gmail-test', methods: ['GET'] },
      { group: 'Gmail', route: '/api/gmail-scan-history', methods: ['GET'] },
      { group: 'Gmail', route: '/api/email-auto', methods: ['GET', 'POST'] },
      // תקשורת
      { group: 'תקשורת', route: '/api/send-bulk-sms', methods: ['POST'] },
      { group: 'תקשורת', route: '/api/send-bulk-email', methods: ['POST'] },
      { group: 'תקשורת', route: '/api/send-candidate-to-employer', methods: ['POST'] },
      { group: 'תקשורת', route: '/api/whatsapp-log', methods: ['GET', 'POST'] },
      { group: 'תקשורת', route: '/api/unsubscribe', methods: ['GET', 'POST'] },
      // גיבוי
      { group: 'גיבוי ושחזור', route: '/api/backup', methods: ['GET'] },
      { group: 'גיבוי ושחזור', route: '/api/restore', methods: ['POST'] },
      // מערכת
      { group: 'מערכת', route: '/api/auth/[...nextauth]', methods: ['GET', 'POST'] },
      { group: 'מערכת', route: '/api/dashboard', methods: ['GET'] },
      { group: 'מערכת', route: '/api/activity-logs', methods: ['GET'] },
      { group: 'מערכת', route: '/api/admin', methods: ['GET', 'PUT'] },
      { group: 'מערכת', route: '/api/cron', methods: ['GET'] },
      { group: 'מערכת', route: '/api/system-registry', methods: ['GET'] },
      // ראיונות
      { group: 'ראיונות', route: '/api/interviews', methods: ['GET', 'POST'] },
      { group: 'ראיונות', route: '/api/interview-reminders', methods: ['GET'] },
      { group: 'ראיונות', route: '/api/applications', methods: ['GET', 'POST', 'PUT'] },
    ]

    const stageMap: Record<string, string> = {
      NEW: 'חדש',
      SCREENING: 'סינון',
      INTERVIEW: 'ראיון',
      OFFER: 'הצעה',
      HIRED: 'התקבל',
      REJECTED: 'נדחה'
    }

    return NextResponse.json({
      generatedAt: now.toISOString(),

      summary: {
        candidates: totalCandidates,
        positions: totalPositions,
        employers: totalEmployers,
        applications: totalApplications,
        interviews: totalInterviews,
        documents: totalDocuments,
        tags: totalTags,
        users: totalUsers,
        notes: totalNotes,
        reminders: totalReminders,
        whatsappLogs: totalWhatsAppLogs,
        communications: totalCommunications,
      },

      thisWeek: {
        newCandidates: newCandidatesWeek,
        newPositions: newPositionsWeek,
        newApplications: newApplicationsWeek,
        newInterviews: newInterviewsWeek,
      },

      thisMonth: {
        newCandidates: newCandidatesMonth,
        newPositions: newPositionsMonth,
      },

      candidates: {
        withCV: candidatesWithCV,
        withAIProfile: candidatesWithAI,
        hired: candidatesHired,
        inProcess: candidatesInProcess,
        withCity: candidatesWithCity,
        unsubscribed: candidatesUnsubscribed,
        withoutCV: totalCandidates - candidatesWithCV,
        withoutAI: totalCandidates - candidatesWithAI,
      },

      positions: {
        active: activePositions,
        inactive: inactivePositions,
        latest: latestPosition,
      },

      employers: {
        total: totalEmployers,
        withActivePositions: employersWithPositions.length,
        list: employersWithPositions.map(e => ({
          name: e.name,
          positionsCount: e._count.positions
        }))
      },

      applicationsByStage: applicationsByStage.map(s => ({
        stage: stageMap[s.stage] || s.stage,
        stageKey: s.stage,
        count: s._count.id
      })).sort((a, b) => b.count - a.count),

      upcomingInterviews: upcomingInterviews.map(i => ({
        candidateName: i.candidate.name,
        positionTitle: i.position.title,
        scheduledAt: i.scheduledAt,
        type: i.type,
        location: i.location,
        meetingUrl: i.meetingUrl
      })),

      openReminders,

      latestCandidate,

      recentActivity: recentActivity.map(a => ({
        type: a.type,
        description: a.description,
        userName: a.user?.name || 'מערכת',
        createdAt: a.createdAt
      })),

      apiRoutes,

      systemInfo: {
        environment: process.env.NODE_ENV || 'unknown',
        appUrl: process.env.NEXTAUTH_URL || 'unknown',
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasGmailSetup: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET),
        hasDriveSetup: !!(process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
        hasSmtpSetup: !!(process.env.SMTP_HOST || process.env.BREVO_API_KEY),
        hasSmsSetup: !!(process.env.INFORU_USERNAME && process.env.INFORU_TOKEN),
        hasSyncSetup: !!(process.env.WEBSITE_SYNC_SECRET && process.env.WEBSITE_API_URL),
      }
    })
  } catch (error) {
    console.error('System registry error:', error)
    return NextResponse.json({ error: 'שגיאה בטעינת נתוני המערכת' }, { status: 500 })
  }
}
