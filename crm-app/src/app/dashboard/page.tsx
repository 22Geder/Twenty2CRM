import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Info, ChevronLeft, Bell, Send, AlertTriangle, Clock, UserCheck, CheckCircle, Users, LayoutGrid, TrendingUp } from "lucide-react"
import { DashboardRefresher } from "@/components/dashboard-refresher"
import { UrgentCandidatesAlert } from "@/components/urgent-candidates-alert"

// Get comprehensive dashboard stats
async function getDashboardStats() {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Build last 6 months array for monthly chart
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalCandidates,
    totalPositions,
    activePositions,
    totalApplications,
    totalInterviews,
    upcomingInterviews,
    totalEmployers,
    applicationsThisMonth,
    statusCounts,
    hiredThisMonth,
    startedWorkThisMonth,
    candidatesThisMonth,
    inProcessCount,
    monthlyCandidatesRaw,
    monthlyPositionsRaw,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.position.count(),
    prisma.position.count({ where: { active: true } }),
    prisma.application.count(),
    prisma.interview.count(),
    prisma.interview.count({
      where: {
        scheduledAt: { gte: new Date() },
        status: "SCHEDULED"
      }
    }),
    prisma.employer.count(),
    prisma.application.count({
      where: { appliedAt: { gte: monthAgo } }
    }),
    prisma.application.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.candidate.count({
      where: { hiredAt: { gte: monthAgo } }
    }),
    prisma.candidate.count({
      where: { 
        employmentStatus: "EMPLOYED",
        hiredAt: { gte: monthAgo }
      }
    }),
    prisma.candidate.count({
      where: { createdAt: { gte: monthAgo } }
    }),
    // 🔄 ספירת מועמדים בתהליך לפי employmentStatus (מסונכרן עם סטטוס חודשי)
    prisma.candidate.count({
      where: {
        OR: [
          { employmentStatus: 'IN_PROCESS' },
          { 
            inProcessPositionId: { not: null },
            employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] },
          },
        ]
      }
    }),
    // Monthly candidates for last 6 months
    prisma.candidate.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    }),
    // Monthly positions for last 6 months
    prisma.position.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    }),
  ])

  // Build last 6 months labels and counts
  const monthlyLabels: string[] = []
  const monthlyHebrewLabels: string[] = []
  const monthlyCandidatesCounts: number[] = []
  const monthlyPositionsCounts: number[] = []
  const hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyLabels.push(key)
    monthlyHebrewLabels.push(hebrewMonths[d.getMonth()])
    monthlyCandidatesCounts.push(0)
    monthlyPositionsCounts.push(0)
  }
  
  monthlyCandidatesRaw.forEach(c => {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
    const idx = monthlyLabels.indexOf(key)
    if (idx !== -1) monthlyCandidatesCounts[idx]++
  })
  
  monthlyPositionsRaw.forEach(p => {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`
    const idx = monthlyLabels.indexOf(key)
    if (idx !== -1) monthlyPositionsCounts[idx]++
  })

  const monthlyData = monthlyLabels.map((key, i) => ({
    month: monthlyHebrewLabels[i],
    candidates: monthlyCandidatesCounts[i],
    positions: monthlyPositionsCounts[i],
  }))

  // Get candidates by day for the last 30 days
  const candidatesByDay = await prisma.candidate.groupBy({
    by: ['createdAt'],
    _count: true,
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Process candidates by day into daily counts
  const dailyCounts: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    dailyCounts[key] = 0
  }
  
  // Get actual daily counts
  const rawCandidates = await prisma.candidate.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  })
  
  rawCandidates.forEach(c => {
    const key = c.createdAt.toISOString().split('T')[0]
    if (dailyCounts[key] !== undefined) {
      dailyCounts[key]++
    }
  })

  const statusMap: Record<string, number> = {
    NEW: 0,
    SCREENING: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0
  }

  statusCounts.forEach((item) => {
    statusMap[item.status] = item._count
  })

  // Calculate candidates in process - מבוסס על employmentStatus של המועמד (מסונכרן עם סטטוס חודשי)
  const inProcess = inProcessCount
  const waitingForScreening = statusMap.NEW

  return {
    totalCandidates,
    totalPositions,
    activePositions,
    totalApplications,
    totalInterviews,
    upcomingInterviews,
    totalEmployers,
    applicationsThisMonth,
    statusMap,
    hiredThisMonth,
    startedWorkThisMonth,
    candidatesThisMonth,
    inProcess,
    waitingForScreening,
    dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    monthlyData,
  }
}

// Get candidates in process (בתהליך) - מבוסס על employmentStatus של המועמד
async function getCandidatesInProcess() {
  return await prisma.candidate.findMany({
    where: {
      // 🔄 רק מועמדים שבאמת בתהליך - לא כאלה שכבר התקבלו/נדחו
      OR: [
        { employmentStatus: 'IN_PROCESS' },
        { 
          inProcessPositionId: { not: null },
          employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] },
        },
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      phone: true,
      updatedAt: true,
      employmentStatus: true,
      inProcessPosition: {
        select: { id: true, title: true }
      }
    }
  })
}

// Get rejected candidates (לא מתאים) - מבוסס על employmentStatus של המועמד
async function getRejectedCandidates() {
  return await prisma.candidate.findMany({
    where: { employmentStatus: 'REJECTED' },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      phone: true,
      updatedAt: true,
      applications: {
        where: { status: 'REJECTED' },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { position: { select: { id: true, title: true } } }
      }
    }
  })
}

// Get hired candidates (התקבלו) - מבוסס על employmentStatus של המועמד
async function getHiredCandidates() {
  return await prisma.candidate.findMany({
    where: { employmentStatus: 'EMPLOYED' },
    orderBy: { hiredAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      phone: true,
      updatedAt: true,
      hiredAt: true,
      hiredToEmployer: { select: { id: true, name: true } }
    }
  })
}

// Get recent positions
async function getRecentPositions() {
  return await prisma.position.findMany({
    take: 5,
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    include: { employer: true }
  })
}

// Get upcoming interviews/tasks
async function getUpcomingTasks() {
  return await prisma.interview.findMany({
    take: 5,
    where: {
      scheduledAt: { gte: new Date() },
      status: "SCHEDULED"
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      candidate: true,
      position: true
    }
  })
}

// Get candidate sources
async function getCandidateSources() {
  const sources = await prisma.candidate.groupBy({
    by: ['source'],
    _count: true,
    orderBy: { _count: { source: 'desc' } },
    take: 5
  })
  return sources
}

// Get candidates in process for more than 24 hours without follow-up (התראות)
async function getUntreatedInProcessCandidates() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return await prisma.candidate.findMany({
    where: {
      inProcessPositionId: { not: null },
      inProcessAt: { lt: cutoff },
      // 🔄 לא מציג מועמדים שכבר התקבלו או נדחו
      employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] },
    },
    orderBy: { inProcessAt: 'asc' }, // oldest first
    include: {
      inProcessPosition: {
        include: { employer: true }
      }
    }
  })
}

export default async function CiviDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const [
    stats,
    recentPositions,
    upcomingTasks,
    candidateSources,
    inProcessCandidates,
    rejectedCandidates,
    hiredCandidates,
    untreatedInProcess,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentPositions(),
    getUpcomingTasks(),
    getCandidateSources(),
    getCandidatesInProcess(),
    getRejectedCandidates(),
    getHiredCandidates(),
    getUntreatedInProcessCandidates(),
  ])

  // Calculate percentages for status bars — capped at 100% to prevent overflow
  const totalInProcess = stats.inProcess || 1
  const pct = (n: number) => Math.min(100, Math.max(0, Math.round((n / totalInProcess) * 100))) || 0
  const statusPercentages = {
    referralSent: pct(stats.statusMap.OFFER),
    frontInterview: pct(stats.statusMap.INTERVIEW),
    formsFiled: pct(stats.statusMap.SCREENING),
    emailSent: pct(stats.statusMap.NEW * 0.3),
    whatsappSent: pct(stats.statusMap.NEW * 0.2),
  }

  // Calculate source percentages
  const totalSources = candidateSources.reduce((sum, s) => sum + s._count, 0) || 1
  const sourcePercentages = candidateSources.map(s => ({
    source: s.source || 'לא מזוהה',
    count: s._count,
    percentage: Math.round((s._count / totalSources) * 100)
  }))

  const sourceColors = ['#06B6D4', '#10B981', '#F97316', '#A855F7', '#3B82F6']

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 50%, #F5F3FF 100%)' }} dir="rtl">
      {/* Clean modern page header */}
      <div className="bg-white border-b border-slate-200/70 sticky top-0 z-20"
        style={{ backdropFilter: 'saturate(180%) blur(14px)', backgroundColor: 'rgba(255,255,255,0.85)' }}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-primary-50)' }}>
              <LayoutGrid className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <h1 className="t22-h1">לוח בקרה</h1>
              <p className="t22-sub mt-0.5">שלום, <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>{session.user?.name || 'משתמש'}</span> — הנה מה שקורה היום</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/activity" className="t22-btn-outline inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium">
              <Clock className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              <span className="hidden sm:inline">פעילות</span>
            </Link>
            <DashboardRefresher />
          </div>
        </div>
      </div>

      {/* 🔔 ALERT BANNER - עדיין לא טופלו מעל 24 שעות */}
      <UrgentCandidatesAlert candidates={untreatedInProcess as any} />

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        
        {/* Candidate Status Overview - 3 Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {/* In Process - בתהליך */}
          <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-blue-500/8 hover:-translate-y-1 transition-all duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-blue-500 rounded-full" />
                <div>
                  <div className="font-bold text-slate-800 text-base">בתהליך</div>
                  <div className="text-slate-400 text-xs">עדכון: היום</div>
                </div>
              </div>
              <div className="text-4xl font-black text-blue-600 tabular-nums">{stats.inProcess}</div>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {inProcessCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {inProcessCandidates.map((c: any) => (
                    <Link key={c.id} href={`/dashboard/candidates/${c.id}`}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/60 transition-colors group/row">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-700 text-sm truncate group-hover/row:text-blue-600 transition-colors">{c.name}</div>
                        <div className="text-xs text-blue-500 truncate">{c.inProcessPosition?.title || 'משרה לא צוינה'}</div>
                      </div>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 mr-2">{new Date(c.updatedAt).toLocaleDateString('he-IL')}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">אין מועמדים בתהליך</div>
              )}
            </div>
            {stats.inProcess > 10 && (
              <Link href="/dashboard/candidates?status=in-process" className="flex items-center justify-center gap-1 py-2.5 text-xs text-blue-500 font-medium bg-blue-50/50 hover:bg-blue-100/60 border-t border-blue-100 transition-colors">
                + עוד {stats.inProcess - inProcessCandidates.length} מועמדים בתהליך →
              </Link>
            )}
          </div>

          {/* Rejected - לא מתאים */}
          <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-red-500/8 hover:-translate-y-1 transition-all duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-red-500 rounded-full" />
                <div>
                  <div className="font-bold text-slate-800 text-base">לא מתאים</div>
                  <div className="text-slate-400 text-xs">אחרונים שנדחו</div>
                </div>
              </div>
              <div className="text-4xl font-black text-red-600 tabular-nums">{stats.statusMap?.REJECTED || rejectedCandidates.length}</div>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {rejectedCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {rejectedCandidates.map((c: any) => (
                    <Link key={c.id} href={`/dashboard/candidates/${c.id}`}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-red-50/60 transition-colors group/row">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-700 text-sm truncate group-hover/row:text-red-500 transition-colors">{c.name}</div>
                        <div className="text-xs text-red-400 truncate">{c.applications?.[0]?.position?.title || 'משרה לא צוינה'}</div>
                      </div>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 mr-2">{new Date(c.updatedAt).toLocaleDateString('he-IL')}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">אין מועמדים שנדחו</div>
              )}
            </div>
          </div>

          {/* Hired - התקבלו */}
          <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-green-500/8 hover:-translate-y-1 transition-all duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                <div>
                  <div className="font-bold text-slate-800 text-base">התקבלו</div>
                  <div className="text-slate-400 text-xs">החודש</div>
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-600 tabular-nums">{stats.hiredThisMonth}</div>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {hiredCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {hiredCandidates.map((c: any) => (
                    <Link key={c.id} href={`/dashboard/candidates/${c.id}`}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-green-50/60 transition-colors group/row">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-700 text-sm truncate group-hover/row:text-green-600 transition-colors">{c.name}</div>
                        <div className="text-xs text-green-500 truncate">{c.hiredToEmployer?.name || 'מעסיק לא צוין'}</div>
                      </div>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 mr-2">
                        {c.hiredAt ? new Date(c.hiredAt).toLocaleDateString('he-IL') : new Date(c.updatedAt).toLocaleDateString('he-IL')}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">אין מועמדים שהתקבלו</div>
              )}
            </div>
            <Link href="/dashboard/candidates?status=hired" className="flex items-center justify-center gap-1 py-2.5 text-xs text-green-600 font-medium bg-green-50/50 hover:bg-green-100/60 border-t border-green-100 transition-colors">
              כל המתקבלים →
            </Link>
          </div>
        </div>

        {/* Top Stats Row - 5 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Card 1 - Started Work This Month */}
          <Link href="/dashboard/candidates?status=hired" className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-xl flex items-center justify-center shadow-lg shadow-teal-400/30">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div className="text-4xl font-black text-[#06B6D4]">{stats.startedWorkThisMonth}</div>
              <div className="mt-2 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-[#06B6D4] rounded-full w-3/4" /></div>
              <div className="text-xs font-medium text-slate-500 leading-tight">התחילו לעבוד החודש</div>
            </div>
          </Link>

          {/* Card 2 - Upcoming Interviews */}
          <Link href="/dashboard/interviews" className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#F97316] to-[#FB923C] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl flex items-center justify-center shadow-lg shadow-orange-400/30">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div className="text-4xl font-black text-[#F97316]">{stats.upcomingInterviews}</div>
              <div className="mt-2 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-[#F97316] rounded-full w-2/3" /></div>
              <div className="text-xs font-medium text-slate-500 leading-tight">ראיונות קרובים</div>
            </div>
          </Link>

          {/* Card 3 - Hired This Month */}
          <Link href="/dashboard/candidates?status=hired" className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#10B981] to-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center shadow-lg shadow-green-400/30">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-4xl font-black text-[#10B981]">{stats.hiredThisMonth}</div>
              <div className="mt-2 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-[#10B981] rounded-full w-3/5" /></div>
              <div className="text-xs font-medium text-slate-500 leading-tight">התקבלו לעבודה החודש</div>
            </div>
          </Link>

          {/* Card 4 - Referrals This Month */}
          <Link href="/dashboard/candidates?status=in-process" className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#A855F7] to-[#C084FC] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-purple-400/30">
                <Send className="h-5 w-5 text-white" />
              </div>
              <div className="text-4xl font-black text-[#A855F7]">{stats.applicationsThisMonth}</div>
              <div className="mt-2 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-[#A855F7] rounded-full w-4/5" /></div>
              <div className="text-xs font-medium text-slate-500 leading-tight">הפניות החודש</div>
            </div>
          </Link>

          {/* Card 5 - Candidates in Process */}
          <Link href="/dashboard/candidates?status=in-process" className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl flex items-center justify-center shadow-lg shadow-blue-400/30">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-4xl font-black text-[#3B82F6]">{stats.inProcess}</div>
              <div className="mt-2 h-1 bg-slate-100 rounded-full"><div className="h-1 bg-[#3B82F6] rounded-full w-3/4" /></div>
              <div className="text-xs font-medium text-slate-500 leading-tight">מועמדים בתהליך</div>
            </div>
          </Link>
        </div>

        {/* Middle Row - 3 Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {/* Left - Candidates by Stage */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
                  <Info className="h-4 w-4 text-[#06B6D4]" />
                </div>
                <span className="font-bold text-slate-800">מועמדים בתהליך לפי שלב</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.inProcess}</span>
            </div>
            
            {/* Status Bars */}
            <div className="space-y-4">
              {/* Bar 1 - בוצעה הפניה */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] flex-shrink-0"></span>
                    בוצעה הפניה
                  </span>
                  <span className="text-xs font-medium text-slate-600">{stats.statusMap.OFFER} <span className="text-slate-400">({statusPercentages.referralSent}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-[#06B6D4] transition-all duration-500" style={{ width: `${Math.max(statusPercentages.referralSent, 2)}%` }}></div>
                </div>
              </div>
              
              {/* Bar 2 - תואם ראיון פרונטלי */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] flex-shrink-0"></span>
                    תואם ראיון פרונטלי
                  </span>
                  <span className="text-xs font-medium text-slate-600">{stats.statusMap.INTERVIEW} <span className="text-slate-400">({statusPercentages.frontInterview}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-[#10B981] transition-all duration-500" style={{ width: `${Math.max(statusPercentages.frontInterview, 2)}%` }}></div>
                </div>
              </div>
              
              {/* Bar 3 - הגשת טפסים */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] flex-shrink-0"></span>
                    הגשת טפסים
                  </span>
                  <span className="text-xs font-medium text-slate-600">{stats.statusMap.SCREENING} <span className="text-slate-400">({statusPercentages.formsFiled}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-[#F97316] transition-all duration-500" style={{ width: `${Math.max(statusPercentages.formsFiled, 2)}%` }}></div>
                </div>
              </div>
              
              {/* Bar 4 - נשלח מייל ללקוח */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] flex-shrink-0"></span>
                    נשלח מייל ללקוח
                  </span>
                  <span className="text-xs font-medium text-slate-600">{Math.round(stats.statusMap.NEW * 0.3)} <span className="text-slate-400">({statusPercentages.emailSent}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-[#A855F7] transition-all duration-500" style={{ width: `${Math.max(statusPercentages.emailSent, 2)}%` }}></div>
                </div>
              </div>
              
              {/* Bar 5 - נשלח הודעת וואטסאפ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] flex-shrink-0"></span>
                    נשלח הודעת וואטסאפ
                  </span>
                  <span className="text-xs font-medium text-slate-600">{Math.round(stats.statusMap.NEW * 0.2)} <span className="text-slate-400">({statusPercentages.whatsappSent}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-[#3B82F6] transition-all duration-500" style={{ width: `${Math.max(statusPercentages.whatsappSent, 2)}%` }}></div>
                </div>
              </div>
            </div>
            
            <Link href="/dashboard/candidates" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל המועמדים בתהליך
            </Link>
          </div>

          {/* Middle - Monthly Candidates Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#F97316]" />
                </div>
                <span className="font-bold text-slate-800">מועמדים לפי חודש</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.candidatesThisMonth}</span>
            </div>
            
            {/* Monthly Bar Chart */}
            {stats.monthlyData && stats.monthlyData.some(m => m.candidates > 0) ? (
              <div>
                {/* Bars */}
                <div className="flex items-end gap-2 h-36">
                  {stats.monthlyData.map((m, i) => {
                    const maxVal = Math.max(...stats.monthlyData.map(x => x.candidates), 1)
                    const height = (m.candidates / maxVal) * 100
                    const isCurrentMonth = i === stats.monthlyData.length - 1
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
                        <span className="text-xs font-bold text-slate-700">{m.candidates > 0 ? m.candidates : ''}</span>
                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${Math.max(height, 4)}%`,
                            background: isCurrentMonth
                              ? 'linear-gradient(180deg, #F97316 0%, #EA580C 100%)'
                              : 'linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)',
                            minHeight: '4px',
                          }}
                          title={`${m.month}: ${m.candidates} מועמדים`}
                        />
                        <span className="text-[10px] text-slate-400 text-center leading-tight">{m.month}</span>
                      </div>
                    )
                  })}
                </div>
                {/* Positions line */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4F46E5] inline-block" />
                      משרות חדשות לפי חודש
                    </span>
                    <div className="flex gap-2">
                      {stats.monthlyData.map((m, i) => (
                        <span key={i} className="font-semibold text-[#4F46E5]">{m.positions}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 mt-4 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">אין מספיק נתונים להצגה</p>
              </div>
            )}
            
            <Link href="/dashboard/candidates" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל המועמדים
            </Link>
          </div>

          {/* Right - Recent Open Positions */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                  <Info className="h-4 w-4 text-[#10B981]" />
                </div>
                <span className="font-bold text-slate-800">משרות פתוחות אחרונות</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.activePositions}</span>
            </div>
            
            {/* Positions Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-2 font-medium text-slate-600">תאריך יצירה</th>
                  <th className="text-right py-2 font-medium text-slate-600">שם הלקוח</th>
                  <th className="text-right py-2 font-medium text-slate-600">כותרת המשרה</th>
                </tr>
              </thead>
              <tbody>
                {recentPositions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">אין משרות פתוחות</td>
                  </tr>
                ) : (
                  recentPositions.map((pos) => (
                    <tr key={pos.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 text-slate-500">
                        {new Date(pos.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="py-2 text-slate-600">{pos.employer?.name || 'לא מוגדר'}</td>
                      <td className="py-2 text-slate-700 font-medium">{pos.title}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            <Link href="/dashboard/positions" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל המשרות
            </Link>
          </div>
        </div>

        {/* Bottom Row - 3 More Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {/* Left - Open Standards/Employers */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                  <Info className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="font-bold text-slate-800">לקוחות פעילים</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.totalEmployers}</span>
            </div>
            
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-2 font-medium text-slate-600">סה"כ משרות</th>
                  <th className="text-right py-2 font-medium text-slate-600">שם הלקוח</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} className="py-8 text-center text-slate-400">
                    <Link href="/dashboard/employers" className="text-[#06B6D4] hover:underline">
                      צפה בכל הלקוחות &larr;
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Middle - Tasks by Due Date */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                  <Info className="h-4 w-4 text-amber-500" />
                </div>
                <span className="font-bold text-slate-800">פגישות וראיונות קרובים</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{upcomingTasks.length}</span>
            </div>
            
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-2 font-medium text-slate-600">שם המועמד</th>
                  <th className="text-right py-2 font-medium text-slate-600">סטטוס</th>
                  <th className="text-right py-2 font-medium text-slate-600">תאריך יעד</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTasks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">אין ראיונות קרובים</td>
                  </tr>
                ) : (
                  upcomingTasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 text-slate-700">{task.candidate?.name || 'לא מוגדר'}</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-[#06B6D4]/10 text-[#06B6D4] rounded text-xs">
                          {task.status === 'SCHEDULED' ? 'מתוזמן' : task.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500">
                        {new Date(task.scheduledAt).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            <Link href="/dashboard/interviews" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל הראיונות
            </Link>
          </div>

          {/* Right - Leading Recruitment Sources */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                  <Info className="h-4 w-4 text-violet-500" />
                </div>
                <span className="font-bold text-slate-800">מקורות גיוס מובילים בחודש האחרון</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{sourcePercentages.length}</span>
            </div>
            
            {/* Source Bars */}
            <div className="space-y-4">
              {sourcePercentages.length === 0 ? (
                <div className="py-4 text-center text-slate-400">אין נתונים על מקורות</div>
              ) : (
                sourcePercentages.map((source, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sourceColors[i % sourceColors.length] }}></span>
                        <span className="truncate">{source.source}</span>
                      </span>
                      <span className="text-xs font-medium text-slate-600 mr-2 flex-shrink-0">{source.count} <span className="text-slate-400">({source.percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(source.percentage, 2)}%`,
                          backgroundColor: sourceColors[i % sourceColors.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 🔍 In-Process Tracking Panel - מעקב מועמדים בתהליך */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="font-bold text-lg">מעקב מועמדים בתהליך</span>
            </div>
            <div className="flex items-center gap-3">
              {untreatedInProcess.length > 0 && (
                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                  {untreatedInProcess.length} לא טופלו !
                </span>
              )}
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                סה&quot;כ {inProcessCandidates.length} בתהליך
              </span>
            </div>
          </div>

          {untreatedInProcess.length === 0 ? (
            <div className="p-6 text-center text-green-600 flex items-center justify-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="font-medium">כל המועמדים בתהליך טופלו תוך 24 שעות - כל הכבוד!</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-200">
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">המתנה</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">נכנס לתהליך</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">מעסיק</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">משרה</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">טלפון</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">שם מועמד</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-800">#</th>
                  </tr>
                </thead>
                <tbody>
                  {untreatedInProcess.map((c: any, idx: number) => {
                    const hoursAgo = Math.floor((Date.now() - new Date(c.inProcessAt).getTime()) / (60 * 60 * 1000))
                    const daysAgo = Math.floor(hoursAgo / 24)
                    const isUrgent = hoursAgo >= 48
                    return (
                      <tr key={c.id} className={`border-b transition-colors ${
                        isUrgent ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50/40 hover:bg-amber-50'
                      }`}>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1 font-bold text-sm ${
                            isUrgent ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            <Clock className="h-3.5 w-3.5" />
                            {daysAgo >= 1 ? `${daysAgo} ימים` : `${hoursAgo} שעות`}
                            {isUrgent && <AlertTriangle className="h-3.5 w-3.5" />}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {new Date(c.inProcessAt).toLocaleDateString('he-IL')}{' '}
                          {new Date(c.inProcessAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {c.inProcessPosition?.employer?.name || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-blue-700 font-medium text-xs">
                            {c.inProcessPosition?.title || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs dir-ltr text-left">
                          {c.phone || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/candidates/${c.id}`}
                            className="font-semibold text-slate-800 hover:text-[#06B6D4] hover:underline">
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{idx + 1}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t bg-slate-50 flex justify-between items-center">
            <Link href="/dashboard/candidates?status=in-process"
              className="flex items-center gap-1 text-[#06B6D4] text-sm hover:underline font-medium">
              <ChevronLeft className="h-4 w-4" />
              כל המועמדים בתהליך
            </Link>
            <span className="text-xs text-slate-400">מרענן בכל כניסה לדף הבית</span>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl p-5 md:p-8 text-white shadow-xl border border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#00D4D4]">{stats.totalCandidates}</div>
              <div className="text-sm text-slate-300">סה"כ מועמדים</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#10B981]">{stats.totalPositions}</div>
              <div className="text-sm text-slate-300">סה"כ משרות</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#F97316]">{stats.totalApplications}</div>
              <div className="text-sm text-slate-300">סה"כ מועמדויות</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#A855F7]">{stats.totalInterviews}</div>
              <div className="text-sm text-slate-300">סה"כ ראיונות</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#3B82F6]">{stats.totalEmployers}</div>
              <div className="text-sm text-slate-300">סה"כ לקוחות</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
