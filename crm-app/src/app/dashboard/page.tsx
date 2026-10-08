import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Info, ChevronLeft, Bell, Send, AlertTriangle, Clock, UserCheck, CheckCircle, Users, LayoutGrid, TrendingUp, Target, Upload, Loader2 } from "lucide-react"
import { DashboardRefresher } from "@/components/dashboard-refresher"
import { UrgentCandidatesAlert } from "@/components/urgent-candidates-alert"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { CANDIDATE_HIRED_WHERE, CANDIDATE_REJECTED_WHERE, CANDIDATE_IN_PROCESS_WHERE } from "@/lib/candidate-status"
import { canSeeAllRecruiters, recruiterStatsUserWhere } from "@/lib/recruiter-stats"
import { currentYearMonth, scoreRecruiterMonth } from "@/lib/recruiter-performance"
import { toYearMonth } from "@/lib/candidate-hired-dates"

// גבולות חודש לפי אזור ישראל (UTC+3) — זהה ל-/api/candidates?period כדי שהמספרים יתאימו לסטטוס חודשי.
const ISRAEL_OFFSET_HOURS = 3
const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

function monthStartUtc(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1, -ISRAEL_OFFSET_HOURS))
}

function shiftYearMonth(yearMonth: string, delta: number) {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return { key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, monthIndex: d.getUTCMonth() }
}

// אותו סיווג כמו בעמוד סטטוס חודשי/שנתי.
function monthlyStatusOf(c: { hiredAt: Date | null; employmentStatus: string | null; inProcessPositionId: string | null }) {
  if (c.hiredAt || c.employmentStatus === 'EMPLOYED') return 'hired' as const
  if (c.employmentStatus === 'REJECTED') return 'rejected' as const
  if (c.employmentStatus === 'IN_PROCESS' || c.inProcessPositionId) return 'in-process' as const
  return 'new' as const
}

async function getDashboardStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const currentKey = toYearMonth(now) || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [cy, cm] = currentKey.split('-').map(Number)
  const monthStart = monthStartUtc(cy, cm - 1)
  const monthEnd = monthStartUtc(cy, cm)
  const windowStart = monthStartUtc(cy, cm - 12)

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
    inProcessCount,
    totalHired,
    totalRejected,
    monthlyPositionsRaw,
    periodRows,
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
    prisma.application.count({ where: { appliedAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.application.groupBy({ by: ['status'], _count: true }),
    prisma.candidate.count({ where: CANDIDATE_IN_PROCESS_WHERE }),
    prisma.candidate.count({ where: CANDIDATE_HIRED_WHERE }),
    prisma.candidate.count({ where: CANDIDATE_REJECTED_WHERE }),
    prisma.position.findMany({ where: { createdAt: { gte: windowStart } }, select: { createdAt: true } }),
    prisma.candidate.findMany({
      where: {
        OR: [
          { createdAt: { gte: windowStart } },
          { hiredAt: { gte: windowStart } },
          { inProcessAt: { gte: windowStart } },
        ],
      },
      select: { createdAt: true, hiredAt: true, inProcessAt: true, employmentStatus: true, inProcessPositionId: true },
    }),
  ])

  // 12 חודשים אחרונים — כל חודש נספר כמו בסטטוס חודשי: מועמד נכלל אם עלה / נכנס לתהליך / התקבל בחודש.
  const perMonth = Array.from({ length: 12 }, (_, i) => {
    const { key, monthIndex } = shiftYearMonth(currentKey, i - 11)
    return { key, monthIndex, uploaded: 0, inProcessEntered: 0, startedWork: 0, records: 0, hired: 0, inProcess: 0, rejected: 0, isNew: 0, positions: 0 }
  })
  const idxByKey = new Map(perMonth.map((m, i) => [m.key, i]))
  const yearly = { uploaded: 0, inProcessEntered: 0, hired: 0 }

  periodRows.forEach(row => {
    const createdKey = toYearMonth(row.createdAt)
    const hiredKey = toYearMonth(row.hiredAt)
    const inProcessKey = toYearMonth(row.inProcessAt)
    const status = monthlyStatusOf(row)
    const keys = new Set([createdKey, hiredKey, inProcessKey].filter((k): k is string => !!k && idxByKey.has(k)))

    keys.forEach(k => {
      const m = perMonth[idxByKey.get(k)!]
      m.records++
      if (status === 'hired') m.hired++
      else if (status === 'in-process') m.inProcess++
      else if (status === 'rejected') m.rejected++
      else m.isNew++
    })
    if (createdKey && idxByKey.has(createdKey)) { perMonth[idxByKey.get(createdKey)!].uploaded++; yearly.uploaded++ }
    if (inProcessKey && idxByKey.has(inProcessKey)) { perMonth[idxByKey.get(inProcessKey)!].inProcessEntered++; yearly.inProcessEntered++ }
    if (hiredKey && idxByKey.has(hiredKey) && row.employmentStatus === 'EMPLOYED') perMonth[idxByKey.get(hiredKey)!].startedWork++
    if (keys.size > 0 && status === 'hired') yearly.hired++
  })

  monthlyPositionsRaw.forEach(pos => {
    const k = toYearMonth(pos.createdAt)
    if (k && idxByKey.has(k)) perMonth[idxByKey.get(k)!].positions++
  })

  const monthlyData = perMonth.map((m, i) => ({
    month: HEBREW_MONTHS[m.monthIndex],
    candidates: m.uploaded,
    positions: m.positions,
    hired: m.hired,
    inProcess: m.inProcessEntered,
    candidatesDelta: i > 0 ? m.uploaded - perMonth[i - 1].uploaded : 0,
    hiredDelta: i > 0 ? m.hired - perMonth[i - 1].hired : 0,
  }))

  const current = perMonth[perMonth.length - 1]
  const month = { records: current.records, hired: current.hired, inProcess: current.inProcess, rejected: current.rejected, isNew: current.isNew }
  const hiredThisMonth = current.hired
  const startedWorkThisMonth = current.startedWork
  const candidatesThisMonth = current.uploaded

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
    inProcess, waitingForScreening, totalHired, totalRejected,
    dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    monthlyData,
    month, yearly, currentMonthKey: currentKey,
  }
}

async function getCandidatesInProcess() {
  return await prisma.candidate.findMany({
    where: CANDIDATE_IN_PROCESS_WHERE,
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
    where: CANDIDATE_REJECTED_WHERE,
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
    where: CANDIDATE_HIRED_WHERE,
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

// 🎯 סטטיסטיקת מגייסים — כמה העלה, כמה בתהליך, כמה התקבלו.
// שיוך לפי uploadedById. מגייס רואה רק את עצמו; אדמין/office רואים את כולם.
async function getRecruiterStats(currentUserId: string, seeAll: boolean) {
  const monthKey = currentYearMonth()
  const [users, uploadedGroups, inProcessGroups, hiredGroups, rejectedGroups, activityRows] = await Promise.all([
    prisma.user.findMany({
      where: recruiterStatsUserWhere(currentUserId, seeAll),
      select: { id: true, name: true, avatar: true, role: true },
    }),
    prisma.candidate.groupBy({
      by: ['uploadedById'], _count: true,
      where: { uploadedById: { not: null } },
    }),
    prisma.candidate.groupBy({
      by: ['uploadedById'], _count: true,
      where: { uploadedById: { not: null }, ...CANDIDATE_IN_PROCESS_WHERE },
    }),
    prisma.candidate.groupBy({
      by: ['uploadedById'], _count: true,
      where: { uploadedById: { not: null }, ...CANDIDATE_HIRED_WHERE },
    }),
    prisma.candidate.groupBy({
      by: ['uploadedById'], _count: true,
      where: { uploadedById: { not: null }, ...CANDIDATE_REJECTED_WHERE },
    }),
    prisma.candidate.findMany({
      where: { uploadedById: { not: null } },
      select: { uploadedById: true, createdAt: true, hiredAt: true },
    }),
  ])

  const toMap = (groups: Array<{ uploadedById: string | null; _count: number }>) => {
    const m: Record<string, number> = {}
    groups.forEach(g => { if (g.uploadedById) m[g.uploadedById] = g._count })
    return m
  }
  const uploadedMap = toMap(uploadedGroups as any)
  const inProcessMap = toMap(inProcessGroups as any)
  const hiredMap = toMap(hiredGroups as any)
  const rejectedMap = toMap(rejectedGroups as any)
  const monthUploads: Record<string, number> = {}
  const monthHires: Record<string, number> = {}
  activityRows.forEach((row) => {
    if (!row.uploadedById) return
    if (toYearMonth(row.createdAt) === monthKey) monthUploads[row.uploadedById] = (monthUploads[row.uploadedById] || 0) + 1
    if (toYearMonth(row.hiredAt) === monthKey) monthHires[row.uploadedById] = (monthHires[row.uploadedById] || 0) + 1
  })

  return users
    .map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      isMe: u.id === currentUserId,
      uploaded: uploadedMap[u.id] || 0,
      inProcess: inProcessMap[u.id] || 0,
      hired: hiredMap[u.id] || 0,
      rejected: rejectedMap[u.id] || 0,
      monthUploaded: monthUploads[u.id] || 0,
      monthHired: monthHires[u.id] || 0,
      monthScore: scoreRecruiterMonth(monthUploads[u.id] || 0, monthHires[u.id] || 0).score,
    }))
    .sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0) || b.uploaded - a.uploaded)
}

export default async function CiviDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) { redirect("/login") }

  const currentUserId = (session.user as any)?.id as string
  const seeAllRecruiters = canSeeAllRecruiters({
    role: (session.user as any)?.role,
    email: session.user?.email,
  })

  const [
    stats, recentPositions, upcomingTasks, candidateSources,
    inProcessCandidates, rejectedCandidates, hiredCandidates, untreatedInProcess,
    recruiterStats,
  ] = await Promise.all([
    getDashboardStats(), getRecentPositions(), getUpcomingTasks(), getCandidateSources(),
    getCandidatesInProcess(), getRejectedCandidates(), getHiredCandidates(), getUntreatedInProcessCandidates(),
    getRecruiterStats(currentUserId, seeAllRecruiters),
  ])

  const stageKeys = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER'] as const
  const stageTotal = stageKeys.reduce((sum, k) => sum + (stats.statusMap[k] || 0), 0)
  const stageItems = [
    { label: 'חדשות', val: stats.statusMap.NEW, color: '#94A3B8' },
    { label: 'בסינון', val: stats.statusMap.SCREENING, color: '#0891B2' },
    { label: 'בראיון', val: stats.statusMap.INTERVIEW, color: '#0E7490' },
    { label: 'הצעה / הפניה', val: stats.statusMap.OFFER, color: '#059669' },
  ].map(item => ({ ...item, pct: stageTotal > 0 ? Math.round((item.val / stageTotal) * 100) : 0 }))

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

  const ytdCandidates = stats.yearly.uploaded
  const ytdHired = stats.yearly.hired
  const ytdInProcess = stats.yearly.inProcessEntered

  const [monthYear, monthNum] = stats.currentMonthKey.split('-').map(Number)
  const monthLabel = new Date(monthYear, monthNum - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  const monthConversion = stats.month.records > 0 ? Math.round((stats.month.hired / stats.month.records) * 100) : null

  // אותם חמשת המדדים כמו בעמוד סטטוס חודשי — לחודש הנוכחי.
  const kpiMetrics = [
    { href: '/dashboard/monthly-status', label: 'בצינור', value: stats.month.records, icon: Users, accent: 'text-slate-900', hint: 'בתקופה שנבחרה' },
    { href: '/dashboard/monthly-status', label: 'התקבלו', value: stats.month.hired, icon: CheckCircle, accent: 'text-emerald-700', hint: monthConversion === null ? 'אין בסיס להמרה' : `${monthConversion}% המרה` },
    { href: '/dashboard/monthly-status', label: 'בתהליך', value: stats.month.inProcess, icon: Clock, accent: 'text-sky-700', hint: 'ממתינים להחלטה' },
    { href: '/dashboard/monthly-status', label: 'לא התקבלו', value: stats.month.rejected, icon: AlertTriangle, accent: 'text-rose-700', hint: 'נסגרו בלי קבלה' },
    { href: '/dashboard/monthly-status', label: 'חדשים', value: stats.month.isNew, icon: UserCheck, accent: 'text-slate-900', hint: 'עדיין בלי סטטוס' },
  ]

  return (
    <div className="min-h-screen" dir="rtl">

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 pt-5">
        <header className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-7">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.18em] text-slate-500">OVERVIEW</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">לוח בקרה</h1>
              <p className="max-w-2xl text-sm text-slate-600">
                {(() => {
                  const parts: string[] = []
                  if (stats.inProcess > 0) parts.push(`${stats.inProcess} מועמדים בתהליך פעיל`)
                  if (upcomingTasks.length > 0) parts.push(`${upcomingTasks.length} ראיונות קרובים`)
                  if (untreatedInProcess.length > 0) parts.push(`${untreatedInProcess.length} מועמדים דורשים מענה דחוף`)
                  return parts.length > 0
                    ? parts.join(' · ')
                    : `המערכת מעודכנת — ${stats.totalCandidates} מועמדים, ${stats.activePositions} משרות פתוחות`
                })()}
              </p>
              <p className="text-xs text-slate-500">
                {monthLabel}. המספרים נספרים כמו בסטטוס חודשי — לפי תאריך העלאה, כניסה לתהליך או קבלה.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              שלום, <span className="font-semibold text-slate-900">{session.user?.name?.split(' ')[0] || 'משתמש'}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-slate-200 text-center text-xs text-slate-500">
            <div className="px-4 py-3">
              <span className="block text-lg font-semibold tabular-nums text-slate-900">{stats.month.records}</span>
              רשומות החודש
            </div>
            <div className="border-x border-slate-200 px-4 py-3">
              <span className="block text-lg font-semibold tabular-nums text-slate-900">{stats.month.hired}</span>
              התקבלו
            </div>
            <div className="px-4 py-3">
              <span className="block text-lg font-semibold tabular-nums text-slate-900">{monthConversion === null ? '—' : `${monthConversion}%`}</span>
              המרה לקבלה
            </div>
          </div>
        </header>
      </div>

      <UrgentCandidatesAlert candidates={untreatedInProcess as any} />

      <div className="max-w-[1600px] mx-auto px-3 md:px-6 pb-8">
        <DashboardTabs
          alertCount={untreatedInProcess.length}

          overviewContent={
            <div className="space-y-4 md:space-y-5">
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label={`מדדי ${monthLabel}`}>
                {kpiMetrics.map((m) => {
                  const Icon = m.icon
                  return (
                    <Link key={m.label} href={m.href} className="rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:-translate-y-0.5">
                      <span className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{m.label}</span>
                        <Icon className={`h-4 w-4 ${m.accent}`} />
                      </span>
                      <span className={`mt-3 block text-3xl font-semibold tabular-nums ${m.accent}`}>{m.value}</span>
                      <span className="mt-1 block text-xs text-slate-400">{m.hint}</span>
                    </Link>
                  )
                })}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                        <Info className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="text-base font-semibold text-slate-950">הפניות פעילות לפי שלב</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">{stageTotal}</span>
                  </div>
                  <div className="space-y-4">
                    {stageItems.map((item, i) => (
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
                  <Link href="/dashboard/candidates" className="flex items-center gap-1 text-teal-700 text-sm mt-4 hover:underline">
                    <ChevronLeft className="h-4 w-4" />כל המועמדים בתהליך
                  </Link>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                        <TrendingUp className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="text-base font-semibold text-slate-950">מועמדים חדשים החודש</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">{stats.candidatesThisMonth}</span>
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
                              <span className="text-[9px] font-semibold text-slate-700">{m.candidates > 0 ? m.candidates : ''}</span>
                              <div className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                  height: `${Math.max(height, 4)}%`,
                                  background: isCurrentMonth ? '#0E7490' : '#CBD5E1',
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
                  <Link href="/dashboard/candidates" className="flex items-center gap-1 text-teal-700 text-sm mt-4 hover:underline">
                    <ChevronLeft className="h-4 w-4" />כל המועמדים
                  </Link>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                        <Info className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="text-base font-semibold text-slate-950">משרות פתוחות אחרונות</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">{stats.activePositions}</span>
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
                  <Link href="/dashboard/positions" className="flex items-center gap-1 text-teal-700 text-sm mt-4 hover:underline">
                    <ChevronLeft className="h-4 w-4" />כל המשרות
                  </Link>
                </div>
              </div>
            </div>
          }

          recruitersContent={
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                    <Target className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-950">
                      {seeAllRecruiters ? 'ביצועי מגייסים' : 'הביצועים שלי'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {seeAllRecruiters
                        ? 'כל המגייסים במערכת — העלאות, תהליך וקבלה'
                        : 'כאן אתה רואה איפה אתה עומד'}
                    </div>
                  </div>
                </div>
              </div>

              {recruiterStats.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white py-12 text-center text-slate-400 text-sm">
                  אין עדיין נתוני מגייסים
                </div>
              ) : (
                <div className={`grid gap-4 ${recruiterStats.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {recruiterStats.map((r) => {
                    const R = 52
                    const C = 2 * Math.PI * R
                    const denom = r.uploaded || 1
                    const hiredDash = Math.min(C, (r.hired / denom) * C)
                    const inProcessDash = Math.min(C - hiredDash, (r.inProcess / denom) * C)
                    const conversion = r.uploaded > 0 ? Math.round((r.hired / r.uploaded) * 100) : 0
                    const initials = r.name?.trim()?.split(/\s+/).slice(0, 2).map(w => w[0]).join('') || '?'
                    return (
                      <Link key={r.id} href={`/dashboard/recruiters/${r.id}`} className={`group block rounded-3xl border bg-white p-5 transition hover:-translate-y-0.5 ${r.isMe ? 'border-teal-600 ring-1 ring-teal-600' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                            {r.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                            ) : initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-950 text-sm truncate flex items-center gap-1.5">
                              {r.name}
                              {r.isMe && <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">אני</span>}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {r.role === 'ADMIN' ? 'מנהל מערכת' : r.role === 'MANAGER' ? 'מנהל' : 'מגייס'}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center my-2">
                          <div className="relative w-[128px] h-[128px]">
                            <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                              <circle cx="64" cy="64" r={R} fill="none" stroke="#F1F5F9" strokeWidth="12" />
                              {inProcessDash > 0 && (
                                <circle cx="64" cy="64" r={R} fill="none" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round"
                                  strokeDasharray={`${inProcessDash} ${C - inProcessDash}`} strokeDashoffset={-hiredDash} />
                              )}
                              {hiredDash > 0 && (
                                <circle cx="64" cy="64" r={R} fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round"
                                  strokeDasharray={`${hiredDash} ${C - hiredDash}`} strokeDashoffset={0} />
                              )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-semibold text-slate-800 tabular-nums">{conversion}%</div>
                              <div className="text-[10px] font-medium text-slate-400">יחס קבלה</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-3">
                          <div className="rounded-xl bg-slate-50 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5"><Upload className="h-3 w-3" /></div>
                            <div className="text-lg font-semibold text-slate-700 tabular-nums">{r.uploaded}</div>
                            <div className="text-[10px] text-slate-400 font-medium">העלה</div>
                          </div>
                          <div className="rounded-xl bg-blue-50 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5"><Loader2 className="h-3 w-3" /></div>
                            <div className="text-lg font-semibold text-blue-600 tabular-nums">{r.inProcess}</div>
                            <div className="text-[10px] text-blue-400 font-medium">בתהליך</div>
                          </div>
                          <div className="rounded-xl bg-emerald-50 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5"><CheckCircle className="h-3 w-3" /></div>
                            <div className="text-lg font-semibold text-emerald-600 tabular-nums">{r.hired}</div>
                            <div className="text-[10px] text-emerald-500 font-medium">התקבלו</div>
                          </div>
                          <div className="rounded-xl bg-red-50 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-red-400 mb-0.5"><AlertTriangle className="h-3 w-3" /></div>
                            <div className="text-lg font-semibold text-red-600 tabular-nums">{r.rejected}</div>
                            <div className="text-[10px] text-red-400 font-medium">לא גויסו</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-slate-900">
                          <span className="text-xs text-slate-500">מדד החודש</span>
                          <span className="text-lg font-semibold tabular-nums">{r.monthScore}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          }

          actionsContent={
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <span className="font-semibold text-lg">מעקב מועמדים בתהליך — ממתינים לטיפול</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {untreatedInProcess.length > 0 && (
                      <span className="bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                        {untreatedInProcess.length} לא טופלו!
                      </span>
                    )}
                    <span className="bg-white border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm">
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
                                <span className={`flex items-center gap-1 font-semibold text-sm ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
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
                                <Link href={`/dashboard/candidates/${c.id}`} className="font-semibold text-slate-800 hover:text-teal-700 hover:underline">{c.name}</Link>
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
                  <Link href="/dashboard/candidates?status=in-process" className="flex items-center gap-1 text-teal-700 text-sm hover:underline font-medium">
                    <ChevronLeft className="h-4 w-4" />כל המועמדים בתהליך
                  </Link>
                  <span className="text-xs text-slate-400">מתרענן בכל טעינה של הדף הבית</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                      <Clock className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="text-base font-semibold text-slate-950">פגישות וראיונות קרובים</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">{upcomingTasks.length}</span>
                </div>
                {upcomingTasks.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">אין ראיונות קרובים</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="py-3 flex items-center justify-between">
                        <span className="font-semibold text-slate-700 text-sm">{task.candidate?.name || 'לא מוגדר'}</span>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                            {task.status === 'SCHEDULED' ? 'מתוזמן' : task.status}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(task.scheduledAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/interviews" className="flex items-center gap-1 text-teal-700 text-sm mt-4 hover:underline">
                  <ChevronLeft className="h-4 w-4" />כל הראיונות
                </Link>
              </div>
            </div>
          }

          activityContent={
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                <div className="group rounded-3xl border border-slate-200 bg-white overflow-hidden transition hover:-translate-y-0.5">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-blue-500 rounded-full" />
                      <div>
                        <div className="font-semibold text-slate-950 text-base">בתהליך</div>
                        <div className="text-slate-400 text-xs">עדכון: היום</div>
                      </div>
                    </div>
                    <div className="text-4xl font-semibold text-blue-600 tabular-nums">{stats.inProcess}</div>
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

                <div className="group rounded-3xl border border-slate-200 bg-white overflow-hidden transition hover:-translate-y-0.5">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-red-500 rounded-full" />
                      <div>
                        <div className="font-semibold text-slate-950 text-base">נדחו</div>
                        <div className="text-slate-400 text-xs">אחרונים שנדחו</div>
                      </div>
                    </div>
                    <div className="text-4xl font-semibold text-red-600 tabular-nums">{stats.totalRejected}</div>
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
                  {stats.totalRejected > rejectedCandidates.length && (
                    <Link href="/dashboard/candidates?status=rejected" className="flex items-center justify-center gap-1 py-2.5 text-xs text-red-500 font-medium bg-red-50/50 hover:bg-red-100/60 border-t border-red-100 transition-colors">
                      + עוד {stats.totalRejected - rejectedCandidates.length} מועמדים →
                    </Link>
                  )}
                </div>

                <div className="group rounded-3xl border border-slate-200 bg-white overflow-hidden transition hover:-translate-y-0.5">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                      <div>
                        <div className="font-semibold text-slate-950 text-base">התקבלו</div>
                        <div className="text-slate-400 text-xs">אחרונים שהתקבלו</div>
                      </div>
                    </div>
                    <div className="text-4xl font-semibold text-emerald-600 tabular-nums">{stats.totalHired}</div>
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
                  {stats.totalHired > hiredCandidates.length && (
                    <Link href="/dashboard/candidates?status=hired" className="flex items-center justify-center gap-1 py-2.5 text-xs text-emerald-600 font-medium bg-emerald-50/50 hover:bg-emerald-100/60 border-t border-emerald-100 transition-colors">
                      + עוד {stats.totalHired - hiredCandidates.length} מועמדים →
                    </Link>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 text-center">
                  {[
                    { val: stats.totalCandidates, label: 'סה"כ מועמדים', color: '#00D4D4' },
                    { val: stats.totalPositions, label: 'סה"כ משרות', color: '#10B981' },
                    { val: stats.totalApplications, label: 'סה"כ מועמדויות', color: '#F97316' },
                    { val: stats.totalInterviews, label: 'סה"כ ראיונות', color: '#A855F7' },
                    { val: stats.totalEmployers, label: 'סה"כ לקוחות', color: '#3B82F6' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="text-3xl font-semibold tabular-nums text-slate-900">{item.val}</div>
                      <div className="text-sm text-slate-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }

          aiContent={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                      <Users className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="text-base font-semibold text-slate-950">חלוקה לפי סטטוס</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">{stats.totalCandidates}</span>
                </div>
                {(() => {
                  const statusItems = [
                    { label: 'בתהליך', count: stats.inProcess, color: '#3B82F6' },
                    { label: 'התקבלו', count: stats.totalHired, color: '#10B981' },
                    { label: 'נדחו', count: stats.totalRejected, color: '#EF4444' },
                    { label: 'חדשים', count: Math.max(0, stats.totalCandidates - stats.inProcess - stats.totalHired - stats.totalRejected), color: '#F97316' },
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
                              <span className="text-sm font-semibold text-slate-950">{seg.count}</span>
                              <span className="text-xs text-slate-400 w-10 text-left">({seg.pct}%)</span>
                            </span>
                          </div>
                        ))}
                        <Link href="/dashboard/employers" className="flex items-center gap-1 text-teal-700 text-xs mt-2 hover:underline pt-2 border-t border-slate-100">
                          <ChevronLeft className="h-3 w-3" />לקוחות פעילים: {stats.totalEmployers}
                        </Link>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                      <Info className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="text-base font-semibold text-slate-950">מקורות גיוס</span>
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
                            <span className="text-xs font-semibold text-slate-700 mr-1 flex-shrink-0">{source.percentage}%</span>
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

              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
                    <TrendingUp className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="text-base font-semibold text-slate-950">משפך גיוס — המרה לפי שלב</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'סה"כ מועמדים', val: stats.totalCandidates, color: '#6366F1' },
                    { label: 'הפניות', val: stats.totalApplications, color: '#3B82F6' },
                    { label: 'ראיונות', val: stats.totalInterviews, color: '#F97316' },
                    { label: 'התקבלו', val: stats.totalHired, color: '#10B981' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                      <div className="mx-auto mb-3 h-1 w-8 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="text-3xl font-semibold tabular-nums text-slate-950">{item.val}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.label}</div>
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
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: card.color }} />
                {card.title} — החודש
              </div>
              <div className="mb-3 text-5xl font-semibold tabular-nums text-slate-950">{card.current}</div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
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

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </div>
            <span className="font-semibold text-slate-950 text-lg">ניתוח שנתי — 12 חודשים</span>
            <div className="flex items-center gap-4 mr-auto text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#3B82F6]" /> מועמדים</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#10B981]" /> התקבלו</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#F97316]" /> נכנסו לתהליך</span>
            </div>
          </div>
          {(() => {
            const data = stats.monthlyData
            const maxVal = Math.max(...data.flatMap(m => [m.candidates, m.hired, m.inProcess]), 1)
            const chartH = 180
            const series = [
              { key: 'candidates' as const, label: 'מועמדים', color: '#3B82F6', colorCur: '#1D4ED8' },
              { key: 'hired' as const, label: 'התקבלו', color: '#10B981', colorCur: '#059669' },
              { key: 'inProcess' as const, label: 'נכנסו לתהליך', color: '#F97316', colorCur: '#EA580C' },
            ]
            return (
              <div className="flex items-end gap-1 sm:gap-2" style={{ height: chartH + 44 }}>
                {data.map((m, i) => {
                  const isCurrentMonth = i === data.length - 1
                  const total = m.candidates + m.hired + m.inProcess
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className="flex items-end justify-center gap-[2px] sm:gap-1 w-full" style={{ height: chartH }}>
                        {series.map((s) => {
                          const val = m[s.key]
                          const h = (val / maxVal) * chartH
                          return (
                            <div key={s.key} className="relative flex-1 flex flex-col items-center justify-end h-full">
                              {val > 0 && (
                                <span className="text-[9px] sm:text-[10px] font-semibold mb-0.5"
                                  style={{ color: isCurrentMonth ? s.colorCur : '#64748B' }}>
                                  {val}
                                </span>
                              )}
                              <div className="w-full rounded-t transition-all"
                                style={{
                                  height: Math.max(h, val > 0 ? 3 : 0),
                                  backgroundColor: isCurrentMonth ? s.colorCur : s.color,
                                  opacity: isCurrentMonth ? 1 : 0.85,
                                }}
                                title={`${m.month} · ${s.label}: ${val}`}
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-2 text-[10px] sm:text-xs text-center leading-tight"
                        style={{ color: isCurrentMonth ? '#1E293B' : '#94A3B8', fontWeight: isCurrentMonth ? 700 : 400 }}>
                        {m.month}
                        {total > 0 && <span className="block text-[9px] text-slate-400 font-normal">סה"כ {total}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 md:p-8">
          <div className="text-center text-slate-500 text-xs mb-5 font-medium">סיכום שנתי — 12 חודשים אחרונים</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-4xl font-semibold tabular-nums text-slate-900">{ytdCandidates}</div>
              <div className="text-sm text-slate-500 mt-1">סה"כ מועמדים השנה</div>
            </div>
            <div>
              <div className="text-4xl font-semibold tabular-nums text-slate-900">{ytdHired}</div>
              <div className="text-sm text-slate-500 mt-1">סה"כ התקבלו השנה</div>
            </div>
            <div>
              <div className="text-4xl font-semibold tabular-nums text-slate-900">{ytdInProcess}</div>
              <div className="text-sm text-slate-500 mt-1">סה"כ נכנסו לתהליך השנה</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
