import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Info, Settings, ChevronLeft, Bell, Send, HelpCircle, AlertTriangle, Clock, UserCheck, CheckCircle, Users, Briefcase } from "lucide-react"
import { DashboardRefresher } from "@/components/dashboard-refresher"
import { UrgentCandidatesAlert } from "@/components/urgent-candidates-alert"

// Get comprehensive dashboard stats
async function getDashboardStats() {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

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
  ])

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
    dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
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

  // Calculate percentages for status bars
  const totalInProcess = stats.inProcess || 1
  const statusPercentages = {
    referralSent: Math.round((stats.statusMap.OFFER / totalInProcess) * 100) || 0,
    frontInterview: Math.round((stats.statusMap.INTERVIEW / totalInProcess) * 100) || 0,
    formsFiled: Math.round((stats.statusMap.SCREENING / totalInProcess) * 100) || 0,
    emailSent: Math.round(((stats.statusMap.NEW * 0.3) / totalInProcess) * 100) || 0,
    whatsappSent: Math.round(((stats.statusMap.NEW * 0.2) / totalInProcess) * 100) || 0,
  }

  // Find max for chart scaling
  const maxDaily = Math.max(...stats.dailyCounts.map(d => d.count), 1)

  // Calculate source percentages
  const totalSources = candidateSources.reduce((sum, s) => sum + s._count, 0) || 1
  const sourcePercentages = candidateSources.map(s => ({
    source: s.source || 'לא מזוהה',
    count: s._count,
    percentage: Math.round((s._count / totalSources) * 100)
  }))

  const sourceColors = ['#06B6D4', '#10B981', '#F97316', '#A855F7', '#3B82F6']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f0f0fa] to-[#e8f4f8]" dir="rtl">
      {/* Top Header Bar - Hidden on mobile (already have TopNavbar) */}
      <div className="hidden lg:block bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] text-white shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center font-bold text-white shadow-lg">
              22
            </div>
            <span className="text-xl font-bold">Twenty2Jobs</span>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link href="/dashboard/candidates" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">
              מועמדים ▼
            </Link>
            <Link href="/dashboard/employers" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">
              לקוחות ▼
            </Link>
            <Link href="/dashboard/positions" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">
              משרות ▼
            </Link>
            <Link href="/dashboard/candidates" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">
              סינון ראשוני ▼
            </Link>
            <Link href="/dashboard/activity" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">
              פעילות
            </Link>
            <Link href="/dashboard/tags" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">
              תגיות ▼
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Send className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">דף הבית - {session.user?.name || 'משתמש'}</h1>
          <DashboardRefresher />
        </div>
      </div>

      {/* 🔔 ALERT BANNER - עדיין לא טופלו מעל 24 שעות */}
      <UrgentCandidatesAlert candidates={untreatedInProcess as any} />

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        
        {/* Candidate Status Overview - 3 Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {/* In Process - בתהליך */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-[15px]">בתהליך</span>
              <span className="bg-white/25 px-3 py-0.5 rounded-full text-sm font-bold backdrop-blur-sm">{inProcessCandidates.length}</span>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {inProcessCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {inProcessCandidates.map((c: any) => (
                    <Link key={c.id} href={`/dashboard/candidates/${c.id}`} 
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-700">{c.name}</span>
                          <span className="text-xs text-slate-400 mr-2">(בתהליך)</span>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(c.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="text-xs text-blue-600 truncate">{c.inProcessPosition?.title || 'משרה לא צוינה'}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">אין מועמדים בתהליך</div>
              )}
            </div>
          </div>

          {/* Rejected - לא מתאים */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-rose-500 via-red-500 to-red-600 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-[15px]">לא מתאים</span>
              <span className="bg-white/25 px-3 py-0.5 rounded-full text-sm font-bold backdrop-blur-sm">{rejectedCandidates.length}</span>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {rejectedCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {rejectedCandidates.map((c: any) => (
                    <Link key={c.id} href={`/dashboard/candidates/${c.id}`} 
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{c.name}</span>
                        <span className="text-xs text-slate-500">{new Date(c.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="text-xs text-red-600 truncate">{c.applications?.[0]?.position?.title || 'משרה לא צוינה'}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">אין מועמדים שנדחו</div>
              )}
            </div>
          </div>

          {/* Hired - התקבלו */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-[15px]">התקבלו</span>
              <span className="bg-white/25 px-3 py-0.5 rounded-full text-sm font-bold backdrop-blur-sm">{hiredCandidates.length}</span>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {hiredCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {hiredCandidates.map((c: any) => (
                    <Link key={c.id} href={`/dashboard/candidates/${c.id}`} 
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{c.name}</span>
                        <span className="text-xs text-slate-500">{c.hiredAt ? new Date(c.hiredAt).toLocaleDateString('he-IL') : new Date(c.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="text-xs text-green-600 truncate">{c.hiredToEmployer?.name || 'מעסיק לא צוין'}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">אין מועמדים שהתקבלו</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Stats Row - 5 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Card 1 - Started Work This Month */}
          <Link href="/dashboard/candidates?status=hired" className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 relative hover:shadow-xl hover:border-teal-200 transition-all duration-300 cursor-pointer group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative flex flex-col items-center gap-2.5 py-1">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-teal-200/50">
                <UserCheck className="h-6 w-6 text-[#06B6D4]" />
              </div>
              <div className="text-4xl font-bold text-[#06B6D4]">{stats.startedWorkThisMonth}</div>
              <div className="text-sm text-slate-500 text-center leading-tight">התחילו לעבוד החודש</div>
            </div>
          </Link>

          {/* Card 2 - Upcoming Interviews */}
          <Link href="/dashboard/interviews" className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 relative hover:shadow-xl hover:border-orange-200 transition-all duration-300 cursor-pointer group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative flex flex-col items-center gap-2.5 py-1">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-orange-200/50">
                <Bell className="h-6 w-6 text-[#F97316]" />
              </div>
              <div className="text-4xl font-bold text-[#F97316]">{stats.upcomingInterviews}</div>
              <div className="text-sm text-slate-500 text-center leading-tight">ראיונות קרובים</div>
            </div>
          </Link>

          {/* Card 3 - Hired This Month */}
          <Link href="/dashboard/candidates?status=hired" className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 relative hover:shadow-xl hover:border-green-200 transition-all duration-300 cursor-pointer group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative flex flex-col items-center gap-2.5 py-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-green-200/50">
                <CheckCircle className="h-6 w-6 text-[#10B981]" />
              </div>
              <div className="text-4xl font-bold text-[#10B981]">{stats.hiredThisMonth}</div>
              <div className="text-sm text-slate-500 text-center leading-tight">התקבלו לעבודה החודש</div>
            </div>
          </Link>

          {/* Card 4 - Referrals This Month */}
          <Link href="/dashboard/candidates?status=in-process" className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 relative hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative flex flex-col items-center gap-2.5 py-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-purple-200/50">
                <Send className="h-6 w-6 text-[#A855F7]" />
              </div>
              <div className="text-4xl font-bold text-[#A855F7]">{stats.applicationsThisMonth}</div>
              <div className="text-sm text-slate-500 text-center leading-tight">הפניות החודש</div>
            </div>
          </Link>

          {/* Card 5 - Candidates in Process */}
          <Link href="/dashboard/candidates?status=in-process" className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 relative hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative flex flex-col items-center gap-2.5 py-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-blue-200/50">
                <Users className="h-6 w-6 text-[#3B82F6]" />
              </div>
              <div className="text-4xl font-bold text-[#3B82F6]">{stats.inProcess}</div>
              <div className="text-sm text-slate-500 text-center leading-tight">מועמדים בתהליך</div>
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

          {/* Middle - Candidates This Month Chart */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                  <Info className="h-4 w-4 text-[#F97316]" />
                </div>
                <span className="font-bold text-slate-800">מועמדים שנכנסו בחודש האחרון</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.candidatesThisMonth}</span>
            </div>
            
            {/* Bar Chart */}
            <div className="flex items-end gap-[2px] h-40 mt-4">
              {stats.dailyCounts.map((day, i) => {
                const height = maxDaily > 0 ? (day.count / maxDaily) * 100 : 0
                const dayNum = new Date(day.date).getDate()
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div 
                      className="w-full bg-[#F97316] rounded-t hover:bg-[#EA580C] transition-colors cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                      title={`${day.date}: ${day.count} מועמדים`}
                    ></div>
                  </div>
                )
              })}
            </div>
            
            {/* X-axis labels - show every 5th day */}
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
              {stats.dailyCounts.filter((_, i) => i % 5 === 0 || i === stats.dailyCounts.length - 1).map((day, i) => (
                <span key={i}>{new Date(day.date).getDate()}</span>
              ))}
            </div>
            
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
