import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Info, ChevronLeft, Bell, Send, AlertTriangle, Clock, UserCheck, CheckCircle, Users, LayoutGrid, TrendingUp, Sparkles } from "lucide-react"
import { DashboardRefresher } from "@/components/dashboard-refresher"
import { UrgentCandidatesAlert } from "@/components/urgent-candidates-alert"
import { DashboardTabs } from "@/components/dashboard-tabs"

async function getDashboardStats() {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

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
    monthlyHiredRaw,
    monthlyInProcessRaw,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.position.count(),
    prisma.position.count({ where: { active: true } }),
    prisma.application.count(),
    prisma.interview.count(),
    prisma.interview.count({
      where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" }
    }),
    prisma.employer.count(),
    prisma.application.count({ where: { appliedAt: { gte: monthAgo } } }),
    prisma.application.groupBy({ by: ['status'], _count: true }),
    prisma.candidate.count({ where: { hiredAt: { gte: monthAgo } } }),
    prisma.candidate.count({ where: { employmentStatus: "EMPLOYED", hiredAt: { gte: monthAgo } } }),
    prisma.candidate.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.candidate.count({
      where: {
        OR: [
          { employmentStatus: 'IN_PROCESS' },
          { inProcessPositionId: { not: null }, employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] } },
        ]
      }
    }),
    prisma.candidate.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } }),
    prisma.position.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } }),
    prisma.candidate.findMany({ where: { hiredAt: { gte: twelveMonthsAgo, not: null } }, select: { hiredAt: true } }),
    prisma.candidate.findMany({ where: { inProcessAt: { gte: twelveMonthsAgo, not: null } }, select: { inProcessAt: true } }),
  ])

  const monthlyLabels: string[] = []
  const monthlyHebrewLabels: string[] = []
  const monthlyCandidatesCounts: number[] = []
  const monthlyPositionsCounts: number[] = []
  const monthlyHiredCounts: number[] = []
  const monthlyInProcessCounts: number[] = []
  const hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyLabels.push(key)
    monthlyHebrewLabels.push(hebrewMonths[d.getMonth()])
    monthlyCandidatesCounts.push(0)
    monthlyPositionsCounts.push(0)
    monthlyHiredCounts.push(0)
    monthlyInProcessCounts.push(0)
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

  monthlyHiredRaw.forEach((c: any) => {
    if (!c.hiredAt) return
    const d = new Date(c.hiredAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const idx = monthlyLabels.indexOf(key)
    if (idx !== -1) monthlyHiredCounts[idx]++
  })

  monthlyInProcessRaw.forEach((c: any) => {
    if (!c.inProcessAt) return
    const d = new Date(c.inProcessAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const idx = monthlyLabels.indexOf(key)
    if (idx !== -1) monthlyInProcessCounts[idx]++
  })

  const monthlyData = monthlyLabels.map((key, i) => ({
    month: monthlyHebrewLabels[i],
    candidates: monthlyCandidatesCounts[i],
    positions: monthlyPositionsCounts[i],
    hired: monthlyHiredCounts[i],
    inProcess: monthlyInProcessCounts[i],
    candidatesDelta: i > 0 ? monthlyCandidatesCounts[i] - monthlyCandidatesCounts[i - 1] : 0,
    hiredDelta: i > 0 ? monthlyHiredCounts[i] - monthlyHiredCounts[i - 1] : 0,
  }))

  const candidatesByDay = await prisma.candidate.groupBy({
    by: ['createdAt'],
    _count: true,
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'asc' }
  })

  const dailyCounts: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    dailyCounts[key] = 0
  }

  const rawCandidates = await prisma.candidate.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  })

  rawCandidates.forEach(c => {
    const key = c.createdAt.toISOString().split('T')[0]
    if (dailyCounts[key] !== undefined) dailyCounts[key]++
  })

  const statusMap: Record<string, number> = {
    NEW: 0, SCREENING: 0, INTERVIEW: 0, OFFER: 0, HIRED: 0, REJECTED: 0
  }
  statusCounts.forEach((item) => { statusMap[item.status] = item._count })

  const inProcess = inProcessCount
  const waitingForScreening = statusMap.NEW

  return {
    totalCandidates, totalPositions, activePositions, totalApplications,
    totalInterviews, upcomingInterviews, totalEmployers, applicationsThisMonth,
    statusMap, hiredThisMonth, startedWorkThisMonth, candidatesThisMonth,
    inProcess, waitingForScreening,
    dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    monthlyData,
  }
}

async function getCandidatesInProcess() {
  return await prisma.candidate.findMany({
    where: {
      OR: [
        { employmentStatus: 'IN_PROCESS' },
        { inProcessPositionId: { not: null }, employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] } },
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true, name: true, phone: true, updatedAt: true, employmentStatus: true,
      inProcessPosition: { select: { id: true, title: true } }
    }
  })
}

async function getRejectedCandidates() {
  return await prisma.candidate.findMany({
    where: { employmentStatus: 'REJECTED' },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true, name: true, phone: true, updatedAt: true,
      applications: {
        where: { status: 'REJECTED' }, orderBy: { updatedAt: 'desc' }, take: 1,
        select: { position: { select: { id: true, title: true } } }
      }
    }
  })
}

async function getHiredCandidates() {
  return await prisma.candidate.findMany({
    where: { employmentStatus: 'EMPLOYED' },
    orderBy: { hiredAt: 'desc' },
    take: 10,
    select: {
      id: true, name: true, phone: true, updatedAt: true, hiredAt: true,
      hiredToEmployer: { select: { id: true, name: true } }
    }
  })
}

async function getRecentPositions() {
  return await prisma.position.findMany({
    take: 5, where: { active: true }, orderBy: { createdAt: 'desc' },
    include: { employer: true }
  })
}

async function getUpcomingTasks() {
  return await prisma.interview.findMany({
    take: 5,
    where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
    orderBy: { scheduledAt: 'asc' },
    include: { candidate: true, position: true }
  })
}

async function getCandidateSources() {
  const sources = await prisma.candidate.groupBy({
    by: ['source'], _count: true,
    orderBy: { _count: { source: 'desc' } }, take: 5
  })
  return sources
}

async function getUntreatedInProcessCandidates() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return await prisma.candidate.findMany({
    where: {
      inProcessPositionId: { not: null },
      inProcessAt: { lt: cutoff },
      employmentStatus: { notIn: ['EMPLOYED', 'REJECTED'] },
    },
    orderBy: { inProcessAt: 'asc' },
    include: { inProcessPosition: { include: { employer: true } } }
  })
}

export default async function CiviDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) { redirect("/login") }

  const [
    stats, recentPositions, upcomingTasks, candidateSources,
    inProcessCandidates, rejectedCandidates, hiredCandidates, untreatedInProcess,
  ] = await Promise.all([
    getDashboardStats(), getRecentPositions(), getUpcomingTasks(), getCandidateSources(),
    getCandidatesInProcess(), getRejectedCandidates(), getHiredCandidates(), getUntreatedInProcessCandidates(),
  ])

  const totalInProcess = stats.inProcess || 1
  const pct = (n: number) => Math.min(100, Math.max(0, Math.round((n / totalInProcess) * 100))) || 0
  const statusPercentages = {
    referralSent: pct(stats.statusMap.OFFER),
    frontInterview: pct(stats.statusMap.INTERVIEW),
    formsFiled: pct(stats.statusMap.SCREENING),
    emailSent: pct(stats.statusMap.NEW * 0.3),
    whatsappSent: pct(stats.statusMap.NEW * 0.2),
  }

  const totalSources = candidateSources.reduce((sum, s) => sum + s._count, 0) || 1
  const sourcePercentages = candidateSources.map(s => ({
    source: s.source || 'לא מזוהה',
    count: s._count,
    percentage: Math.round((s._count / totalSources) * 100)
  }))
  const sourceColors = ['#06B6D4', '#10B981', '#F97316', '#A855F7', '#3B82F6']

  const lastIdx = stats.monthlyData.length - 1
  const currentMonth = stats.monthlyData[lastIdx]
  const prevMonth = lastIdx > 0 ? stats.monthlyData[lastIdx - 1] : null

  const calcDelta = (curr: number, prev: number | undefined) => {
    if (prev === undefined || prev === 0) return { delta: curr, pct: 100, dir: curr > 0 ? 'up' : 'same' as 'up' | 'down' | 'same' }
    const delta = curr - prev
    const pctChange = Math.round((delta / prev) * 100)
    return { delta, pct: Math.abs(pctChange), dir: (delta > 0 ? 'up' : delta < 0 ? 'down' : 'same') as 'up' | 'down' | 'same' }
  }

  const momCandidates = calcDelta(currentMonth?.candidates ?? 0, prevMonth?.candidates)
  const momInProcess = calcDelta(currentMonth?.inProcess ?? 0, prevMonth?.inProcess)
  const momHired = calcDelta(currentMonth?.hired ?? 0, prevMonth?.hired)

  const ytdCandidates = stats.monthlyData.reduce((s, m) => s + m.candidates, 0)
  const ytdHired = stats.monthlyData.reduce((s, m) => s + m.hired, 0)
  const ytdInProcess = stats.monthlyData.reduce((s, m) => s + m.inProcess, 0)

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 pt-5">
        <div
          className="relative rounded-2xl overflow-hidden border border-indigo-200/60 mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(124,58,237,0.06) 50%, rgba(59,130,246,0.05) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="absolute top-0 left-8 w-32 h-32 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-16 w-24 h-24 rounded-full bg-purple-400/10 blur-xl pointer-events-none" />
          <div className="relative flex items-start gap-4 px-5 py-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mt-0.5">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-indigo-700">תקציר יומי AI</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">היום</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                {(() => {
                  const parts: string[] = []
                  if (stats.inProcess > 0) parts.push(`${stats.inProcess} מועמדים בתהליך פעיל`)
                  if (upcomingTasks.length > 0) parts.push(`${upcomingTasks.length} ראיונות קרובים`)
                  if (untreatedInProcess.length > 0) parts.push(`${untreatedInProcess.length} מועמדים דורשים מענה דחוף`)
                  if (stats.candidatesThisMonth > 0) parts.push(`${stats.candidatesThisMonth} מועמדים חדשים החודש`)
                  if (stats.hiredThisMonth > 0) parts.push(`${stats.hiredThisMonth} התקבלו לעבודה`)
                  return parts.length > 0
                    ? parts.join(' · ')
                    : `המערכת מעודכנת — ${stats.totalCandidates} מועמדים, ${stats.activePositions} משרות פתוחות`
                })()}
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end flex-shrink-0">
              <span className="text-xs text-slate-500">שלום,</span>
              <span className="text-sm font-bold text-slate-800">{session.user?.name?.split(' ')[0] || 'משתמש'}</span>
            </div>
          </div>
        </div>
      </div>

      <UrgentCandidatesAlert candidates={untreatedInProcess as any} />

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 pb-8">
        <DashboardTabs
          alertCount={untreatedInProcess.length}

          overviewContent={
            <div className="space-y-4 md:space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
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
                  <div className="space-y-4">
                    {[
                      { label: 'בוצעה הפניה', val: stats.statusMap.OFFER, pct: statusPercentages.referralSent, color: '#06B6D4' },
                      { label: 'תום ראיון פרונטלי', val: stats.statusMap.INTERVIEW, pct: statusPercentages.frontInterview, color: '#10B981' },
                      { label: 'הגשת טפסים', val: stats.statusMap.SCREENING, pct: statusPercentages.formsFiled, color: '#F97316' },
                      { label: 'נשלח מייל ללקוח', val: Math.round(stats.statusMap.NEW * 0.3), pct: statusPercentages.emailSent, color: '#A855F7' },
                      { label: 'נשלחה הודעת וואטסאפ', val: Math.round(stats.statusMap.NEW * 0.2), pct: statusPercentages.whatsappSent, color: '#3B82F6' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            {item.label}
                          </span>
                          <span className="text-xs font-medium text-slate-600">{item.val} <span className="text-slate-400">({item.pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(item.pct, 2)}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard/candidates" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
                    <ChevronLeft className="h-4 w-4" />כל המועמדים בתהליך
                  </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-[#F97316]" />
                      </div>
                      <span className="font-bold text-slate-800">מועמדים חדשים החודש</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-700">{stats.candidatesThisMonth}</span>
                  </div>
                  {stats.monthlyData && stats.monthlyData.some(m => m.candidates > 0) ? (
                    <div>
                      <div className="flex items-end gap-1 h-36">
                        {stats.monthlyData.map((m, i) => {
                          const maxVal = Math.max(...stats.monthlyData.map(x => x.candidates), 1)
                          const height = (m.candidates / maxVal) * 100
                          const isCurrentMonth = i === stats.monthlyData.length - 1
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
                              <span className="text-[9px] font-bold text-slate-700">{m.candidates > 0 ? m.candidates : ''}</span>
                              <div className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                  height: `${Math.max(height, 4)}%`,
                                  background: isCurrentMonth ? 'linear-gradient(180deg, #F97316 0%, #EA580C 100%)' : 'linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)',
                                  minHeight: '4px',
                                }}
                                title={`${m.month}: ${m.candidates} מועמדים`}
                              />
                              <span className="text-[8px] text-slate-400 text-center leading-tight">{m.month.substring(0, 3)}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#4F46E5] inline-block" />משרות חדשות לפי חודש
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {stats.monthlyData.slice(-6).map((m, i) => (
                              <span key={i} className="font-semibold text-[#4F46E5]">{m.positions}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 mt-4 flex flex-col items-center justify-center text-center">
                      <TrendingUp className="h-8 w-8 text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400">אין מספיק נתונים</p>
                    </div>
                  )}
                  <Link href="/dashboard/candidates" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
                    <ChevronLeft className="h-4 w-4" />כל המועמדים
                  </Link>
                </div>

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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-right py-2 font-medium text-slate-600">תאריך</th>
                        <th className="text-right py-2 font-medium text-slate-600">לקוח</th>
                        <th className="text-right py-2 font-medium text-slate-600">משרה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPositions.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-slate-400">אין משרות פתוחות</td></tr>
                      ) : recentPositions.map(pos => (
                        <tr key={pos.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 text-slate-500 text-xs">{new Date(pos.createdAt).toLocaleDateString('he-IL')}</td>
                          <td className="py-2 text-slate-600 text-xs">{pos.employer?.name || '—'}</td>
                          <td className="py-2 text-slate-700 font-medium text-xs">{pos.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link href="/dashboard/positions" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
                    <ChevronLeft className="h-4 w-4" />כל המשרות
                  </Link>
                </div>
              </div>
            </div>
          }

          actionsContent={
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <span className="font-bold text-lg">מעקב מועמדים בתהליך — ממתינים לטיפול</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {untreatedInProcess.length > 0 && (
                      <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                        {untreatedInProcess.length} לא טופלו!
                      </span>
                    )}
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      סה&quot;כ {inProcessCandidates.length} בתהליך
                    </span>
                  </div>
                </div>
                {untreatedInProcess.length === 0 ? (
                  <div className="p-8 text-center text-green-600 flex items-center justify-center gap-3">
                    <CheckCircle className="h-8 w-8" />
                    <span className="font-medium text-lg">כל המועמדים בתהליך טופלו תוך 24 שעות — כל הכבוד!</span>
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
                            <tr key={c.id} className={`border-b transition-colors ${isUrgent ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50/40 hover:bg-amber-50'}`}>
                              <td className="py-3 px-4">
                                <span className={`flex items-center gap-1 font-bold text-sm ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                                  <Clock className="h-3.5 w-3.5" />
                                  {daysAgo >= 1 ? `${daysAgo} ימים` : `${hoursAgo} שעות`}
                                  {isUrgent && <AlertTriangle className="h-3.5 w-3.5" />}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-xs">
                                {new Date(c.inProcessAt).toLocaleDateString('he-IL')} {new Date(c.inProcessAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-xs">{c.inProcessPosition?.employer?.name || '—'}</td>
                              <td className="py-3 px-4"><span className="text-blue-700 font-medium text-xs">{c.inProcessPosition?.title || '—'}</span></td>
                              <td className="py-3 px-4 text-slate-600 text-xs dir-ltr text-left">{c.phone || '—'}</td>
                              <td className="py-3 px-4">
                                <Link href={`/dashboard/candidates/${c.id}`} className="font-semibold text-slate-800 hover:text-[#06B6D4] hover:underline">{c.name}</Link>
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
                  <Link href="/dashboard/candidates?status=in-process" className="flex items-center gap-1 text-[#06B6D4] text-sm hover:underline font-medium">
                    <ChevronLeft className="h-4 w-4" />כל המועמדים בתהליך
                  </Link>
                  <span className="text-xs text-slate-400">מתרענן בכל טעינה של הדף הבית</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="font-bold text-slate-800">פגישות וראיונות קרובים</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-700">{upcomingTasks.length}</span>
                </div>
                {upcomingTasks.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">אין ראיונות קרובים</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="py-3 flex items-center justify-between">
                        <span className="font-semibold text-slate-700 text-sm">{task.candidate?.name || 'לא מוגדר'}</span>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-[#06B6D4]/10 text-[#06B6D4] rounded-full text-xs font-medium">
                            {task.status === 'SCHEDULED' ? 'מתוזמן' : task.status}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(task.scheduledAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/interviews" className="flex items-center gap-1 text-[#06B6D4] text-sm mt-4 hover:underline">
                  <ChevronLeft className="h-4 w-4" />כל הראיונות
                </Link>
              </div>
            </div>
          }

          activityContent={
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
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
                      + עוד {stats.inProcess - inProcessCandidates.length} מועמדים →
                    </Link>
                  )}
                </div>

                <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-red-500/8 hover:-translate-y-1 transition-all duration-300">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-red-500 rounded-full" />
                      <div>
                        <div className="font-bold text-slate-800 text-base">נדחו</div>
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

                <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-green-500/8 hover:-translate-y-1 transition-all duration-300">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                      <div>
                        <div className="font-bold text-slate-800 text-base">התקבלו</div>
                        <div className="text-slate-400 text-xs">אחרונים שהתקבלו</div>
                      </div>
                    </div>
                    <div className="text-4xl font-black text-emerald-600 tabular-nums">{hiredCandidates.length}</div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto">
                    {hiredCandidates.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {hiredCandidates.map((c: any) => (
                          <Link key={c.id} href={`/dashboard/candidates/${c.id}`}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50/60 transition-colors group/row">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-700 text-sm truncate group-hover/row:text-emerald-600 transition-colors">{c.name}</div>
                              <div className="text-xs text-emerald-500 truncate">{c.hiredToEmployer?.name || 'מעסיק לא צוין'}</div>
                            </div>
                            <span className="text-[11px] text-slate-400 flex-shrink-0 mr-2">{new Date(c.updatedAt).toLocaleDateString('he-IL')}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-sm">אין מועמדים שהתקבלו</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl p-5 md:p-8 text-white shadow-xl border border-white/5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 text-center">
                  {[
                    { val: stats.totalCandidates, label: 'סה"כ מועמדים', color: '#00D4D4' },
                    { val: stats.totalPositions, label: 'סה"כ משרות', color: '#10B981' },
                    { val: stats.totalApplications, label: 'סה"כ מועמדויות', color: '#F97316' },
                    { val: stats.totalInterviews, label: 'סה"כ ראיונות', color: '#A855F7' },
                    { val: stats.totalEmployers, label: 'סה"כ לקוחות', color: '#3B82F6' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="text-3xl font-bold" style={{ color: item.color }}>{item.val}</div>
                      <div className="text-sm text-slate-300">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }

          aiContent={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="font-bold text-slate-800">חלוקה לפי סטטוס</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-700">{stats.totalCandidates}</span>
                </div>
                {(() => {
                  const statusItems = [
                    { label: 'בתהליך', count: stats.inProcess, color: '#3B82F6' },
                    { label: 'התקבלו (החודש)', count: stats.hiredThisMonth, color: '#10B981' },
                    { label: 'נדחו', count: stats.statusMap.REJECTED || 0, color: '#EF4444' },
                    { label: 'חדשים (החודש)', count: stats.candidatesThisMonth, color: '#F97316' },
                  ].filter(s => s.count > 0)
                  const total = statusItems.reduce((a, b) => a + b.count, 0) || 1
                  const R = 54, cx = 64, cy = 64, strokeW = 18
                  const circumference = 2 * Math.PI * R
                  let offset = 0
                  const segments = statusItems.map(s => {
                    const dash = (s.count / total) * circumference
                    const seg = { dash, gap: circumference - dash, offset, ...s, pct: Math.round((s.count / total) * 100) }
                    offset += dash
                    return seg
                  })
                  return (
                    <div className="flex items-center gap-6">
                      <svg width="128" height="128" viewBox="0 0 128 128" className="flex-shrink-0">
                        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F1F5F9" strokeWidth={strokeW} />
                        {segments.map((seg, i) => (
                          <circle key={i} cx={cx} cy={cy} r={R}
                            fill="none" stroke={seg.color} strokeWidth={strokeW}
                            strokeDasharray={`${seg.dash} ${seg.gap}`}
                            strokeDashoffset={-seg.offset}
                            transform={`rotate(-90, ${cx}, ${cy})`} />
                        ))}
                        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="17" fontWeight="800" fill="#1E293B">{total}</text>
                        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="#94A3B8">פעיל</text>
                      </svg>
                      <div className="flex-1 space-y-3">
                        {segments.map((seg, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                              {seg.label}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">{seg.count}</span>
                              <span className="text-xs text-slate-400 w-10 text-left">({seg.pct}%)</span>
                            </span>
                          </div>
                        ))}
                        <Link href="/dashboard/employers" className="flex items-center gap-1 text-[#06B6D4] text-xs mt-2 hover:underline pt-2 border-t border-slate-100">
                          <ChevronLeft className="h-3 w-3" />לקוחות פעילים: {stats.totalEmployers}
                        </Link>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                      <Info className="h-4 w-4 text-violet-500" />
                    </div>
                    <span className="font-bold text-slate-800">מקורות גיוס</span>
                  </div>
                </div>
                {sourcePercentages.length === 0 ? (
                  <div className="py-4 text-center text-slate-400">אין נתונים על מקורות</div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {(() => {
                        const R = 52, cx = 62, cy = 62, strokeW = 18
                        const circumference = 2 * Math.PI * R
                        let offset = 0
                        const segments = sourcePercentages.slice(0, 5).map((s, i) => {
                          const dash = (s.percentage / 100) * circumference
                          const seg = { dash, gap: circumference - dash, offset, color: sourceColors[i % sourceColors.length] }
                          offset += dash
                          return seg
                        })
                        const totalCount = sourcePercentages.reduce((a, b) => a + b.count, 0)
                        return (
                          <svg width="124" height="124" viewBox="0 0 124 124">
                            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F1F5F9" strokeWidth={strokeW} />
                            {segments.map((seg, i) => (
                              <circle key={i} cx={cx} cy={cy} r={R}
                                fill="none" stroke={seg.color} strokeWidth={strokeW}
                                strokeDasharray={`${seg.dash} ${seg.gap}`}
                                strokeDashoffset={-seg.offset}
                                transform="rotate(-90, 62, 62)" />
                            ))}
                            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1E293B">{totalCount}</text>
                            <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="#94A3B8">מועמדים</text>
                          </svg>
                        )
                      })()}
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {sourcePercentages.slice(0, 5).map((source, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sourceColors[i % sourceColors.length] }} />
                              <span className="truncate">{source.source}</span>
                            </span>
                            <span className="text-xs font-bold text-slate-700 mr-1 flex-shrink-0">{source.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(source.percentage, 2)}%`, backgroundColor: sourceColors[i % sourceColors.length] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                  </div>
                  <span className="font-bold text-slate-800">משפך גיוס — המרה לפי שלב</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'סה"כ מועמדים', val: stats.totalCandidates, color: '#6366F1', icon: '👥' },
                    { label: 'הפניות', val: stats.totalApplications, color: '#3B82F6', icon: '📤' },
                    { label: 'ראיונות', val: stats.totalInterviews, color: '#F97316', icon: '🎤' },
                    { label: 'התקבלו', val: stats.hiredThisMonth, color: '#10B981', icon: '✅' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-3xl font-black" style={{ color: item.color }}>{item.val}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        {/* ═══════════════════════════════════════════════════════
            ניתוח שנתי 12 חודשים
        ═══════════════════════════════════════════════════════ */}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'מועמדים שהועלו', current: currentMonth?.candidates ?? 0, mom: momCandidates, color: '#3B82F6', bg: 'from-blue-50' },
            { title: 'נכנסו לתהליך', current: currentMonth?.inProcess ?? 0, mom: momInProcess, color: '#F97316', bg: 'from-orange-50' },
            { title: 'התקבלו לעבודה', current: currentMonth?.hired ?? 0, mom: momHired, color: '#10B981', bg: 'from-green-50' },
          ].map((card, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-md border border-slate-100 p-6 bg-gradient-to-br ${card.bg} to-white`}>
              <div className="text-xs font-semibold text-slate-500 mb-2">{card.title} — החודש</div>
              <div className="text-5xl font-black mb-3" style={{ color: card.color }}>{card.current}</div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  card.mom.dir === 'up' ? 'bg-green-100 text-green-700' :
                  card.mom.dir === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {card.mom.dir === 'up' ? '▲' : card.mom.dir === 'down' ? '▼' : '—'}
                  {card.mom.dir !== 'same' && `${card.mom.pct}%`}
                </span>
                <span className="text-xs text-slate-400">לעומת חודש שעבר</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <span className="font-bold text-slate-800 text-lg">ניתוח שנתי — 12 חודשים</span>
            <div className="flex items-center gap-4 mr-auto text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#3B82F6]" /> מועמדים</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#10B981]" /> התקבלו</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#F97316]" /> נכנסו לתהליך</span>
            </div>
          </div>
          {(() => {
            const data = stats.monthlyData
            const maxVal = Math.max(...data.map(m => m.candidates + m.hired + m.inProcess), 1)
            const chartH = 160
            const barW = 100 / data.length
            return (
              <div className="relative">
                <svg width="100%" height={chartH + 40} viewBox={`0 0 100 ${chartH + 40}`} preserveAspectRatio="none" className="overflow-visible">
                  {data.map((m, i) => {
                    const isCurrentMonth = i === data.length - 1
                    const hCand = ((m.candidates) / maxVal) * chartH
                    const hHired = ((m.hired) / maxVal) * chartH
                    const hInProc = ((m.inProcess) / maxVal) * chartH
                    const total = m.candidates + m.hired + m.inProcess
                    const totalH = (total / maxVal) * chartH
                    const x = i * barW + barW * 0.1
                    const w = barW * 0.8
                    const baseY = chartH
                    return (
                      <g key={i}>
                        {hInProc > 0 && <rect x={x} y={baseY - hInProc} width={w} height={hInProc}
                          fill={isCurrentMonth ? '#EA580C' : '#F97316'} fillOpacity={isCurrentMonth ? 1 : 0.7} rx="0.5" />}
                        {hHired > 0 && <rect x={x} y={baseY - hInProc - hHired} width={w} height={hHired}
                          fill={isCurrentMonth ? '#059669' : '#10B981'} fillOpacity={isCurrentMonth ? 1 : 0.7} rx="0.5" />}
                        {hCand > 0 && <rect x={x} y={baseY - hInProc - hHired - hCand} width={w} height={hCand}
                          fill={isCurrentMonth ? '#1D4ED8' : '#3B82F6'} fillOpacity={isCurrentMonth ? 1 : 0.7} rx="0.5" />}
                        <text x={x + w / 2} y={chartH + 14} textAnchor="middle" fontSize="2.8"
                          fill={isCurrentMonth ? '#1E293B' : '#94A3B8'} fontWeight={isCurrentMonth ? '700' : '400'}>
                          {m.month.substring(0, 3)}
                        </text>
                        {total > 0 && <text x={x + w / 2} y={baseY - hInProc - hHired - hCand - 1} textAnchor="middle" fontSize="2.5"
                          fill={isCurrentMonth ? '#1E293B' : '#64748B'} fontWeight="600">
                          {total}
                        </text>}
                      </g>
                    )
                  })}
                  <line x1="0" y1={chartH} x2="100" y2={chartH} stroke="#E2E8F0" strokeWidth="0.3" />
                </svg>
              </div>
            )
          })()}
        </div>

        <div className="mt-4 bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl p-5 md:p-8 text-white shadow-xl border border-white/5">
          <div className="text-center text-slate-400 text-xs mb-5 font-medium">סיכום שנתי — 12 חודשים אחרונים</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-4xl font-black text-[#60A5FA]">{ytdCandidates}</div>
              <div className="text-sm text-slate-300 mt-1">סה"כ מועמדים השנה</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#34D399]">{ytdHired}</div>
              <div className="text-sm text-slate-300 mt-1">סה"כ התקבלו השנה</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#FB923C]">{ytdInProcess}</div>
              <div className="text-sm text-slate-300 mt-1">סה"כ נכנסו לתהליך השנה</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
