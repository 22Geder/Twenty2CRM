import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Info, Settings, ChevronLeft, Bell, Send, HelpCircle } from "lucide-react"

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

  // Calculate candidates in process (not rejected, not hired yet)
  const inProcess = statusMap.NEW + statusMap.SCREENING + statusMap.INTERVIEW + statusMap.OFFER
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

// Get candidates in process (בתהליך)
async function getCandidatesInProcess() {
  return await prisma.application.findMany({
    where: {
      status: {
        in: ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER']
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      candidate: {
        select: { id: true, name: true, phone: true }
      },
      position: {
        select: { id: true, title: true }
      }
    }
  })
}

// Get rejected candidates (לא מתאים)
async function getRejectedCandidates() {
  return await prisma.application.findMany({
    where: {
      status: 'REJECTED'
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      candidate: {
        select: { id: true, name: true, phone: true }
      },
      position: {
        select: { id: true, title: true }
      }
    }
  })
}

// Get hired candidates (התקבלו)
async function getHiredCandidates() {
  return await prisma.application.findMany({
    where: {
      status: 'HIRED'
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      candidate: {
        select: { id: true, name: true, phone: true }
      },
      position: {
        select: { id: true, title: true }
      }
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

export default async function CiviDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const stats = await getDashboardStats()
  const recentPositions = await getRecentPositions()
  const upcomingTasks = await getUpcomingTasks()
  const candidateSources = await getCandidateSources()
  const inProcessCandidates = await getCandidatesInProcess()
  const rejectedCandidates = await getRejectedCandidates()
  const hiredCandidates = await getHiredCandidates()

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

  const sourceColors = ['#00A8A8', '#7CB342', '#FF8C00', '#9C27B0', '#2196F3']

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {/* Top Header Bar - Hidden on mobile (already have TopNavbar) */}
      <div className="hidden lg:block bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00A8A8] to-[#00D4D4] flex items-center justify-center font-bold text-white shadow-lg">
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
      <div className="bg-white border-b">
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-4">
          <h1 className="text-lg md:text-xl font-semibold text-slate-700">דף הבית - {session.user?.name || 'משתמש'}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        
        {/* Candidate Status Overview - 3 Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {/* In Process - בתהליך */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-semibold">בתהליך</span>
              <span className="bg-white/20 px-2 py-1 rounded text-sm">{inProcessCandidates.length}</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {inProcessCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {inProcessCandidates.map((app: any) => (
                    <Link key={app.id} href={`/dashboard/candidates/${app.candidate.id}`} 
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-700">{app.candidate.name}</span>
                          <span className="text-xs text-slate-400 mr-2">({app.status})</span>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(app.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="text-xs text-blue-600 truncate">{app.position?.title || 'משרה לא צוינה'}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">אין מועמדים בתהליך</div>
              )}
            </div>
          </div>

          {/* Rejected - לא מתאים */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-semibold">לא מתאים</span>
              <span className="bg-white/20 px-2 py-1 rounded text-sm">{rejectedCandidates.length}</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {rejectedCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {rejectedCandidates.map((app: any) => (
                    <Link key={app.id} href={`/dashboard/candidates/${app.candidate.id}`} 
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{app.candidate.name}</span>
                        <span className="text-xs text-slate-500">{new Date(app.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="text-xs text-red-600 truncate">{app.position?.title || 'משרה לא צוינה'}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">אין מועמדים שנדחו</div>
              )}
            </div>
          </div>

          {/* Hired - התקבלו */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-semibold">התקבלו</span>
              <span className="bg-white/20 px-2 py-1 rounded text-sm">{hiredCandidates.length}</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {hiredCandidates.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {hiredCandidates.map((app: any) => (
                    <Link key={app.id} href={`/dashboard/candidates/${app.candidate.id}`} 
                          className="block px-4 py-2 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{app.candidate.name}</span>
                        <span className="text-xs text-slate-500">{new Date(app.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="text-xs text-green-600 truncate">{app.position?.title || 'משרה לא צוינה'}</div>
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
          <Link href="/dashboard/candidates?status=hired" className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 relative hover:shadow-lg hover:border-[#00A8A8] transition-all cursor-pointer">
            <div className="absolute top-3 left-3 text-slate-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="text-center pt-2">
              <div className="text-4xl font-bold text-[#00A8A8]">{stats.startedWorkThisMonth}</div>
              <div className="text-sm text-slate-500 mt-2">התחילו לעבוד החודש</div>
            </div>
          </Link>

          {/* Card 2 - Upcoming Interviews */}
          <Link href="/dashboard/interviews" className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 relative hover:shadow-lg hover:border-[#FF8C00] transition-all cursor-pointer">
            <div className="absolute top-3 left-3 text-slate-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="text-center pt-2">
              <div className="text-4xl font-bold text-[#FF8C00]">{stats.upcomingInterviews}</div>
              <div className="text-sm text-slate-500 mt-2">ראיונות קרובים</div>
            </div>
          </Link>

          {/* Card 3 - Hired This Month */}
          <Link href="/dashboard/candidates?status=hired" className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 relative hover:shadow-lg hover:border-[#7CB342] transition-all cursor-pointer">
            <div className="absolute top-3 left-3 text-slate-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="text-center pt-2">
              <div className="text-4xl font-bold text-[#7CB342]">{stats.hiredThisMonth}</div>
              <div className="text-sm text-slate-500 mt-2">התקבלו לעבודה החודש</div>
            </div>
          </Link>

          {/* Card 4 - Referrals This Month */}
          <Link href="/dashboard/candidates?status=in-process" className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 relative hover:shadow-lg hover:border-[#9C27B0] transition-all cursor-pointer">
            <div className="absolute top-3 left-3 text-slate-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="text-center pt-2">
              <div className="text-4xl font-bold text-[#9C27B0]">{stats.applicationsThisMonth}</div>
              <div className="text-sm text-slate-500 mt-2">הפניות החודש</div>
            </div>
          </Link>

          {/* Card 5 - Candidates in Process */}
          <Link href="/dashboard/candidates?status=in-process" className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 relative hover:shadow-lg hover:border-[#2196F3] transition-all cursor-pointer">
            <div className="absolute top-3 left-3 text-slate-400">
              <Info className="h-4 w-4" />
            </div>
            <div className="text-center pt-2">
              <div className="text-4xl font-bold text-[#2196F3]">{stats.inProcess}</div>
              <div className="text-sm text-slate-500 mt-2">מועמדים בתהליך</div>
            </div>
          </Link>
        </div>

        {/* Middle Row - 3 Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {/* Left - Candidates by Stage */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">מועמדים בתהליך לפי שלב</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{stats.inProcess}</span>
            </div>
            
            {/* Status Bars */}
            <div className="space-y-3">
              {/* Bar 1 - בוצעה הפניה */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-4 rounded" style={{ width: `${Math.max(statusPercentages.referralSent * 2.5, 10)}px`, backgroundColor: '#00A8A8' }}></div>
                  <span className="text-xs text-slate-500">({statusPercentages.referralSent}%) {stats.statusMap.OFFER}</span>
                </div>
                <span className="text-sm text-slate-600 w-32 text-left">בוצעה הפניה</span>
                <span className="w-3 h-3 rounded-full bg-[#00A8A8]"></span>
              </div>
              
              {/* Bar 2 - תואם ראיון פרונטלי */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-4 rounded" style={{ width: `${Math.max(statusPercentages.frontInterview * 2.5, 10)}px`, backgroundColor: '#7CB342' }}></div>
                  <span className="text-xs text-slate-500">({statusPercentages.frontInterview}%) {stats.statusMap.INTERVIEW}</span>
                </div>
                <span className="text-sm text-slate-600 w-32 text-left">תואם ראיון פרונטלי</span>
                <span className="w-3 h-3 rounded-full bg-[#7CB342]"></span>
              </div>
              
              {/* Bar 3 - הגשת טפסים */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-4 rounded" style={{ width: `${Math.max(statusPercentages.formsFiled * 2.5, 10)}px`, backgroundColor: '#FF8C00' }}></div>
                  <span className="text-xs text-slate-500">({statusPercentages.formsFiled}%) {stats.statusMap.SCREENING}</span>
                </div>
                <span className="text-sm text-slate-600 w-32 text-left">הגשת טפסים</span>
                <span className="w-3 h-3 rounded-full bg-[#FF8C00]"></span>
              </div>
              
              {/* Bar 4 - נשלח מייל ללקוח */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-4 rounded" style={{ width: `${Math.max(statusPercentages.emailSent * 2.5, 10)}px`, backgroundColor: '#9C27B0' }}></div>
                  <span className="text-xs text-slate-500">({statusPercentages.emailSent}%) {Math.round(stats.statusMap.NEW * 0.3)}</span>
                </div>
                <span className="text-sm text-slate-600 w-32 text-left">נשלח מייל ללקוח</span>
                <span className="w-3 h-3 rounded-full bg-[#9C27B0]"></span>
              </div>
              
              {/* Bar 5 - נשלח הודעת וואטסאפ */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-4 rounded" style={{ width: `${Math.max(statusPercentages.whatsappSent * 2.5, 10)}px`, backgroundColor: '#2196F3' }}></div>
                  <span className="text-xs text-slate-500">({statusPercentages.whatsappSent}%) {Math.round(stats.statusMap.NEW * 0.2)}</span>
                </div>
                <span className="text-sm text-slate-600 w-32 text-left">נשלח הודעת וואטסאפ</span>
                <span className="w-3 h-3 rounded-full bg-[#2196F3]"></span>
              </div>
            </div>
            
            <Link href="/dashboard/candidates" className="flex items-center gap-1 text-[#00A8A8] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל המועמדים בתהליך
            </Link>
          </div>

          {/* Middle - Candidates This Month Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">מועמדים שנכנסו בחודש האחרון</span>
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
                      className="w-full bg-[#FF8C00] rounded-t hover:bg-[#E65100] transition-colors cursor-pointer"
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
            
            <Link href="/dashboard/candidates" className="flex items-center gap-1 text-[#00A8A8] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל המועמדים
            </Link>
          </div>

          {/* Right - Recent Open Positions */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">משרות פתוחות אחרונות</span>
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
            
            <Link href="/dashboard/positions" className="flex items-center gap-1 text-[#00A8A8] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל המשרות
            </Link>
          </div>
        </div>

        {/* Bottom Row - 3 More Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          
          {/* Left - Open Standards/Employers */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">לקוחות פעילים</span>
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
                    <Link href="/dashboard/employers" className="text-[#00A8A8] hover:underline">
                      צפה בכל הלקוחות &larr;
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Middle - Tasks by Due Date */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">פגישות וראיונות קרובים</span>
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
                        <span className="px-2 py-1 bg-[#00A8A8]/10 text-[#00A8A8] rounded text-xs">
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
            
            <Link href="/dashboard/interviews" className="flex items-center gap-1 text-[#00A8A8] text-sm mt-4 hover:underline">
              <ChevronLeft className="h-4 w-4" />
              כל הראיונות
            </Link>
          </div>

          {/* Right - Leading Recruitment Sources */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">מקורות גיוס מובילים בחודש האחרון</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{sourcePercentages.length}</span>
            </div>
            
            {/* Source Bars */}
            <div className="space-y-3">
              {sourcePercentages.length === 0 ? (
                <div className="py-4 text-center text-slate-400">אין נתונים על מקורות</div>
              ) : (
                sourcePercentages.map((source, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-24 text-left truncate">{source.source}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div 
                        className="h-4 rounded transition-all duration-300" 
                        style={{ 
                          width: `${source.percentage}%`, 
                          backgroundColor: sourceColors[i % sourceColors.length],
                          minWidth: '10px'
                        }}
                      ></div>
                      <span className="text-xs text-slate-500">({source.percentage}%) {source.count}</span>
                    </div>
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sourceColors[i % sourceColors.length] }}
                    ></span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 text-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-[#00D4D4]">{stats.totalCandidates}</div>
              <div className="text-sm text-slate-300">סה"כ מועמדים</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#7CB342]">{stats.totalPositions}</div>
              <div className="text-sm text-slate-300">סה"כ משרות</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FF8C00]">{stats.totalApplications}</div>
              <div className="text-sm text-slate-300">סה"כ מועמדויות</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#9C27B0]">{stats.totalInterviews}</div>
              <div className="text-sm text-slate-300">סה"כ ראיונות</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2196F3]">{stats.totalEmployers}</div>
              <div className="text-sm text-slate-300">סה"כ לקוחות</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
