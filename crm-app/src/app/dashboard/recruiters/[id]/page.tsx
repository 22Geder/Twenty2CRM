'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, Briefcase, CalendarClock, ChevronLeft, ChevronRight, Clock3, Loader2, Mail, Phone, RefreshCw, Target, Upload, UserCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MonthRow {
  month: string
  label: string
  uploaded: number
  hired: number
  score: number
  uploadScore: number
  hireScore: number
  level: string
  hoursMinutes: number
  completedShifts: number
}

interface YearData {
  year: string
  uploaded: number
  hired: number
  hoursMinutes: number
  completedShifts: number
  averageScore: number
  months: MonthRow[]
}

type CandidateStatus = 'hired' | 'in-process' | 'rejected' | 'new'

interface RecruiterCandidate {
  id: string
  name: string
  phone: string | null
  city: string | null
  currentTitle: string | null
  createdAt: string
  hiredAt: string | null
  inProcessAt: string | null
  interviewDate: string | null
  status: CandidateStatus
  employerName: string | null
  positionTitle: string | null
}

interface AssignedPosition {
  id: string
  title: string
  openings: number
  location: string | null
  employer: { name: string }
}

interface RecentShift {
  date: string
  clockIn: string | null
  clockOut: string | null
  workedMinutes: number
}

interface PerformanceResponse {
  recruiter: {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
    avatar: string | null
    active: boolean
    createdAt: string
    lastLoginAt: string | null
  }
  candidates: RecruiterCandidate[]
  candidatesTruncated: boolean
  assignedPositions: AssignedPosition[]
  recentShifts: RecentShift[]
  targets: { uploads: number; hires: number }
  currentMonth: string
  summary: {
    totalUploaded: number
    totalInProcess: number
    totalHired: number
    totalRejected: number
  }
  years: YearData[]
}

interface Metric {
  label: string
  value: number | string
  Icon: LucideIcon
}

const levelClass: Record<string, string> = {
  מעולה: 'bg-emerald-50 text-emerald-700',
  טוב: 'bg-sky-50 text-sky-700',
  בינוני: 'bg-amber-50 text-amber-700',
  חלש: 'bg-rose-50 text-rose-700',
}

const statusMeta: Record<CandidateStatus, { label: string; chip: string }> = {
  hired: { label: 'התקבל', chip: 'bg-emerald-50 text-emerald-700' },
  'in-process': { label: 'בתהליך', chip: 'bg-sky-50 text-sky-700' },
  rejected: { label: 'לא התקבל', chip: 'bg-rose-50 text-rose-700' },
  new: { label: 'חדש', chip: 'bg-slate-100 text-slate-700' },
}

const roleLabel: Record<string, string> = { ADMIN: 'מנהל מערכת', MANAGER: 'מנהל', RECRUITER: 'מגייס', EMPLOYEE: 'עובד' }

function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function formatClock(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' })
}

function formatHours(minutes: number | undefined): string {
  const safeMinutes = typeof minutes === 'number' && Number.isFinite(minutes) ? Math.max(0, minutes) : 0
  return `${Math.floor(safeMinutes / 60)}:${String(safeMinutes % 60).padStart(2, '0')}`
}

export default function RecruiterPerformancePage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<PerformanceResponse | null>(null)
  const [year, setYear] = useState('')
  const [error, setError] = useState<{ recruiterId: string; message: string } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [candidateFilter, setCandidateFilter] = useState<'all' | CandidateStatus>('all')
  const recruiterId = typeof params.id === 'string' ? params.id : ''
  const currentData = data?.recruiter.id === recruiterId ? data : null
  const errorMessage = error?.recruiterId === recruiterId ? error.message : ''
  const loading = Boolean(recruiterId) && !currentData && !errorMessage

  useEffect(() => {
    if (!recruiterId) return

    const controller = new AbortController()
    fetch(`/api/recruiters/${encodeURIComponent(recruiterId)}/performance`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 403) throw new Error('forbidden')
        if (response.status === 404) throw new Error('not-found')
        if (!response.ok) throw new Error(`load failed: ${response.status}`)
        return response.json() as Promise<PerformanceResponse>
      })
      .then((payload) => {
        if (!payload.currentMonth || !Array.isArray(payload.years)) {
          throw new Error('invalid performance payload')
        }
        setData(payload)
        setYear(payload.currentMonth.slice(0, 4))
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setData(null)
        const reason = fetchError instanceof Error ? fetchError.message : ''
        const message = reason === 'forbidden'
          ? 'אין לך הרשאה לצפות בנתוני מגייס זה.'
          : reason === 'not-found'
            ? 'המגייס לא נמצא במערכת.'
            : 'לא הצלחנו לטעון את ביצועי המגייס. נסו לרענן או לחזור ללוח הבקרה.'
        setError({ recruiterId, message })
      })

    return () => controller.abort()
  }, [recruiterId, reloadKey])

  const retryLoad = () => {
    setError(null)
    setReloadKey((value) => value + 1)
  }

  const selected = useMemo(
    () => currentData?.years.find((item) => item.year === year) || currentData?.years[0],
    [currentData, year],
  )
  const current = selected?.months.find((month) => month.month === currentData?.currentMonth)
  const statusCounts = useMemo(() => {
    const counts: Record<CandidateStatus, number> = { hired: 0, 'in-process': 0, rejected: 0, new: 0 }
    currentData?.candidates.forEach((candidate) => { counts[candidate.status] += 1 })
    return counts
  }, [currentData])
  const visibleCandidates = useMemo(
    () => (currentData?.candidates || []).filter((candidate) => candidateFilter === 'all' || candidate.status === candidateFilter),
    [currentData, candidateFilter],
  )
  const upcomingInterviews = useMemo(() => {
    const now = Date.now()
    return (currentData?.candidates || [])
      .filter((candidate) => candidate.interviewDate && new Date(candidate.interviewDate).getTime() >= now)
      .sort((a, b) => new Date(a.interviewDate as string).getTime() - new Date(b.interviewDate as string).getTime())
  }, [currentData])

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center rounded-3xl bg-slate-950 text-slate-200"><Loader2 className="me-2 h-5 w-5 animate-spin" />טוען את נתוני המגייס/ת</div>
  }
  if (errorMessage || !currentData || !selected) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h1 className="font-semibold">נתוני המגייס/ת אינם זמינים כרגע</h1>
            <p className="mt-1 text-sm text-rose-700">{errorMessage || (recruiterId ? 'אין נתונים להצגה' : 'מזהה מגייס לא תקין')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={retryLoad} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-700 px-3 text-sm font-medium text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                <RefreshCw className="h-4 w-4" />נסה שוב
              </button>
              <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-800 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">חזרה ללוח הבקרה</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const yearIndex = currentData.years.findIndex((item) => item.year === selected.year)

  return (
    <div className="mx-auto max-w-6xl space-y-5" dir="rtl">
      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white">
          <ChevronRight className="h-4 w-4" />חזרה ללוח הבקרה
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">ביצועי מגייס</p>
            <h1 className="text-2xl font-semibold tracking-tight">{currentData.recruiter.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{roleLabel[currentData.recruiter.role] || currentData.recruiter.role}{currentData.recruiter.active ? '' : ' · לא פעיל'}</span>
              {currentData.recruiter.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /><bdi>{currentData.recruiter.email}</bdi></span>}
              {currentData.recruiter.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /><bdi>{currentData.recruiter.phone}</bdi></span>}
              <span className="text-xs text-slate-400">הצטרף/ה: {formatDate(currentData.recruiter.createdAt)} · כניסה אחרונה: {formatDate(currentData.recruiter.lastLoginAt, true)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 p-1">
            <button type="button" aria-label="שנה קודמת" className="rounded-full p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" disabled={yearIndex < 0 || yearIndex === currentData.years.length - 1} onClick={() => currentData.years[yearIndex + 1] && setYear(currentData.years[yearIndex + 1].year)}><ChevronRight className="h-4 w-4" /></button>
            <span className="min-w-16 text-center tabular-nums">{selected.year}</span>
            <button type="button" aria-label="שנה הבאה" className="rounded-full p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" disabled={yearIndex <= 0} onClick={() => currentData.years[yearIndex - 1] && setYear(currentData.years[yearIndex - 1].year)}><ChevronLeft className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { label: 'העלאות השנה', value: selected.uploaded, Icon: Upload },
          { label: 'גיוסים השנה', value: selected.hired, Icon: UserCheck },
          { label: 'ציון ממוצע', value: selected.averageScore, Icon: Target },
          { label: 'שעות החודש', value: formatHours(current?.hoursMinutes), Icon: Clock3 },
        ] satisfies Metric[]).map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.45)]">
            <Icon className="mb-3 h-4 w-4 text-indigo-600" />
            <div className="text-3xl font-semibold tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { label: 'סה״כ העלאות', value: currentData.summary.totalUploaded, Icon: Upload },
          { label: 'כרגע בתהליך', value: currentData.summary.totalInProcess, Icon: Users },
          { label: 'סה״כ גיוסים', value: currentData.summary.totalHired, Icon: UserCheck },
          { label: 'משמרות השנה', value: selected.completedShifts, Icon: Clock3 },
        ] satisfies Metric[]).map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Icon className="mb-2 h-4 w-4 text-slate-500" />
            <div className="text-2xl font-semibold tabular-nums text-slate-950">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">ציון 100 דורש {currentData.targets.uploads} קורות חיים ו-{currentData.targets.hires} גיוסים באותו חודש. המדד הוא ממוצע של שני היעדים. שעות נספרות רק ממשמרות עם כניסה ויציאה מתועדות.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b">
                <th className="py-3 text-right font-medium">חודש</th>
                <th className="py-3 text-right font-medium">העלאות</th>
                <th className="py-3 text-right font-medium">גיוסים</th>
                <th className="py-3 text-right font-medium">שעות / משמרות</th>
                <th className="py-3 text-right font-medium">מדד</th>
                <th className="py-3 text-right font-medium">רמה</th>
              </tr>
            </thead>
            <tbody>
              {selected.months.map((month) => (
                <tr key={month.month} className={`border-b border-slate-100 ${month.month === currentData.currentMonth ? 'bg-indigo-50/70' : ''}`}>
                  <td className="py-3 font-medium">{month.label}</td>
                  <td className="py-3 tabular-nums">{month.uploaded} <span className="text-xs text-slate-400">/ {currentData.targets.uploads}</span></td>
                  <td className="py-3 tabular-nums">{month.hired} <span className="text-xs text-slate-400">/ {currentData.targets.hires}</span></td>
                  <td className="py-3 tabular-nums">{formatHours(month.hoursMinutes)} <span className="text-xs text-slate-400">/ {month.completedShifts} משמרות</span></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-600" style={{ width: `${month.score}%` }} /></div>
                      <span className="tabular-nums">{month.score}</span>
                    </div>
                  </td>
                  <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs ${levelClass[month.level]}`}>{month.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {upcomingInterviews.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-950"><CalendarClock className="h-4 w-4 text-indigo-600" />ראיונות קרובים ({upcomingInterviews.length})</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {upcomingInterviews.slice(0, 10).map((candidate) => (
              <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/dashboard/candidates/${candidate.id}`} className="font-medium text-indigo-700 hover:underline">{candidate.name}</Link>
                <span className="text-slate-500">{candidate.positionTitle || ''}{candidate.employerName ? ` · ${candidate.employerName}` : ''}</span>
                <span className="tabular-nums text-slate-700">{formatDate(candidate.interviewDate, true)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-slate-950"><Users className="h-4 w-4 text-indigo-600" />המועמדים שהמגייס/ת העלה/תה ({currentData.summary.totalUploaded})</h2>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="סינון לפי סטטוס">
            {([['all', 'הכל', currentData.candidates.length], ['hired', 'התקבלו', statusCounts.hired], ['in-process', 'בתהליך', statusCounts['in-process']], ['rejected', 'לא התקבלו', statusCounts.rejected], ['new', 'חדשים', statusCounts.new]] as Array<['all' | CandidateStatus, string, number]>).map(([key, label, count]) => (
              <button key={key} type="button" aria-pressed={candidateFilter === key} onClick={() => setCandidateFilter(key)} className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${candidateFilter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {label} <span className="tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        </div>
        {currentData.candidatesTruncated && (
          <p className="mb-3 text-xs text-slate-500">מוצגים {currentData.candidates.length} המועמדים האחרונים מתוך {currentData.summary.totalUploaded}.</p>
        )}
        {visibleCandidates.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">אין מועמדים להצגה</p>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="sticky top-0 bg-white text-xs text-slate-500">
                <tr className="border-b">
                  <th className="py-3 text-right font-medium">שם</th>
                  <th className="py-3 text-right font-medium">סטטוס</th>
                  <th className="py-3 text-right font-medium">משרה / מעסיק</th>
                  <th className="py-3 text-right font-medium">טלפון</th>
                  <th className="py-3 text-right font-medium">עיר</th>
                  <th className="py-3 text-right font-medium">הועלה</th>
                  <th className="py-3 text-right font-medium">התקבל</th>
                </tr>
              </thead>
              <tbody>
                {visibleCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5">
                      <Link href={`/dashboard/candidates/${candidate.id}`} className="font-medium text-indigo-700 hover:underline">{candidate.name}</Link>
                      {candidate.currentTitle && <div className="text-xs text-slate-400">{candidate.currentTitle}</div>}
                    </td>
                    <td className="py-2.5"><span className={`rounded-full px-2 py-1 text-xs ${statusMeta[candidate.status].chip}`}>{statusMeta[candidate.status].label}</span></td>
                    <td className="py-2.5 text-slate-600">{[candidate.positionTitle, candidate.employerName].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="py-2.5 tabular-nums text-slate-600"><bdi>{candidate.phone || '—'}</bdi></td>
                    <td className="py-2.5 text-slate-600">{candidate.city || '—'}</td>
                    <td className="py-2.5 tabular-nums text-slate-600">{formatDate(candidate.createdAt)}</td>
                    <td className="py-2.5 tabular-nums text-slate-600">{formatDate(candidate.hiredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-950"><Briefcase className="h-4 w-4 text-indigo-600" />משרות פעילות באחריות המגייס/ת ({currentData.assignedPositions.length})</h2>
          {currentData.assignedPositions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">אין משרות פעילות משויכות</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {currentData.assignedPositions.map((position) => (
                <li key={position.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/dashboard/positions/${position.id}`} className="font-medium text-indigo-700 hover:underline">{position.title}</Link>
                  <span className="text-xs text-slate-500">{position.employer.name}{position.location ? ` · ${position.location}` : ''} · {position.openings} משרות</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-950"><Clock3 className="h-4 w-4 text-indigo-600" />משמרות אחרונות</h2>
          {currentData.recentShifts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">אין רישומי נוכחות</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-right font-medium">תאריך</th>
                  <th className="py-2 text-right font-medium">כניסה</th>
                  <th className="py-2 text-right font-medium">יציאה</th>
                  <th className="py-2 text-right font-medium">שעות</th>
                </tr>
              </thead>
              <tbody>
                {currentData.recentShifts.map((shift) => (
                  <tr key={shift.date} className="border-b border-slate-100 tabular-nums">
                    <td className="py-2">{formatDate(shift.date)}</td>
                    <td className="py-2">{formatClock(shift.clockIn)}</td>
                    <td className="py-2">{formatClock(shift.clockOut)}</td>
                    <td className="py-2">{shift.workedMinutes > 0 ? formatHours(shift.workedMinutes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
