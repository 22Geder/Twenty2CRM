'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  Save,
  Coffee,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// ===== Types =====
interface AttendanceRow {
  id: string
  userId: string
  date: string
  clockIn: string | null
  clockOut: string | null
  breakMinutes: number
  status: string
  notes: string | null
  isManualEdit: boolean
}

interface Holiday {
  date: string
  hebrewDate: string
  name: string
  nameEn: string
  type: 'MAJOR_HOLIDAY' | 'EREV_HOLIDAY' | 'CHOL_HAMOED' | 'MINOR_HOLIDAY' | 'ISRAELI_HOLIDAY' | 'MEMORIAL_DAY'
  isWorkDay: boolean
  isHalfDay: boolean
}

interface Hire {
  id: string
  name: string
  hiredAt: string | null
  hiredToEmployer?: { id: string; name: string } | null
}

interface BonusInfo {
  hires: number
  perCandidate: number
  totalBonus: number
  tier: { min: number; max: number; perCandidate: number; label: string }
  nextTier: { min: number; max: number; perCandidate: number; label: string } | null
  hiresToNextTier: number | null
}

interface MonthData {
  month: string
  user: { id: string; name: string; email: string; role: string } | null
  attendances: AttendanceRow[]
  holidays: Holiday[]
  hires: Hire[]
  bonus: BonusInfo
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PRESENT: { label: 'נוכח', color: 'bg-green-100 text-green-700 border-green-300' },
  ABSENT: { label: 'חיסור', color: 'bg-red-100 text-red-700 border-red-300' },
  SICK: { label: 'מחלה', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  VACATION: { label: 'חופש', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  HOLIDAY: { label: 'חג', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  RESERVE_DUTY: { label: 'מילואים', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  REMOTE: { label: 'מהבית', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
}

// ===== Date helpers =====
function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function getMonthString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function getDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseMonth(monthStr: string): { year: number; month: number } {
  const [y, m] = monthStr.split('-').map(Number)
  return { year: y, month: m }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getDayName(d: Date): string {
  return ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][d.getDay()]
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function calcWorkedMinutes(clockIn: string | null, clockOut: string | null, breakMin: number): number {
  if (!clockIn || !clockOut) return 0
  const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  if (diff <= 0) return 0
  return Math.max(0, Math.floor(diff / 60000) - (breakMin || 0))
}

function formatMinutes(min: number): string {
  if (!min || min < 0) return '0:00'
  return `${Math.floor(min / 60)}:${pad(min % 60)}`
}

function holidayBadgeColor(type: Holiday['type']): string {
  switch (type) {
    case 'MAJOR_HOLIDAY':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'EREV_HOLIDAY':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'CHOL_HAMOED':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300'
    case 'ISRAELI_HOLIDAY':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'MEMORIAL_DAY':
      return 'bg-gray-200 text-gray-800 border-gray-400'
    case 'MINOR_HOLIDAY':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-300'
  }
}

// ===== Main page =====
export default function AttendancePage() {
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState<string>(getMonthString(today))
  const [data, setData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyClock, setBusyClock] = useState<'in' | 'out' | null>(null)
  const [now, setNow] = useState(new Date())
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ clockIn: string; clockOut: string; breakMinutes: string; status: string; notes: string }>({
    clockIn: '',
    clockOut: '',
    breakMinutes: '30',
    status: 'PRESENT',
    notes: '',
  })

  // שעון חי
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // טען נתוני חודש
  const loadMonth = async (month: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?month=${month}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMonth(currentMonth)
  }, [currentMonth])

  // ניווט חודשים
  const changeMonth = (delta: number) => {
    const { year, month } = parseMonth(currentMonth)
    const d = new Date(year, month - 1 + delta, 1)
    setCurrentMonth(getMonthString(d))
  }

  // Clock in/out
  const handleClockIn = async () => {
    setBusyClock('in')
    try {
      const res = await fetch('/api/attendance/clock-in', { method: 'POST' })
      if (res.ok) await loadMonth(currentMonth)
    } finally {
      setBusyClock(null)
    }
  }

  const handleClockOut = async () => {
    setBusyClock('out')
    try {
      const res = await fetch('/api/attendance/clock-out', { method: 'POST' })
      if (res.ok) await loadMonth(currentMonth)
    } finally {
      setBusyClock(null)
    }
  }

  // עריכה ידנית
  const startEdit = (dateStr: string, existing?: AttendanceRow, holiday?: Holiday) => {
    setEditingDate(dateStr)
    setEditForm({
      clockIn: existing?.clockIn ? formatTime(existing.clockIn) : '',
      clockOut: existing?.clockOut ? formatTime(existing.clockOut) : '',
      breakMinutes: String(existing?.breakMinutes ?? 30),
      status: existing?.status ?? (holiday && !holiday.isWorkDay ? 'HOLIDAY' : 'PRESENT'),
      notes: existing?.notes ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editingDate) return
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: editingDate,
        clockIn: editForm.clockIn || null,
        clockOut: editForm.clockOut || null,
        breakMinutes: parseInt(editForm.breakMinutes, 10) || 0,
        status: editForm.status,
        notes: editForm.notes,
      }),
    })
    if (res.ok) {
      setEditingDate(null)
      await loadMonth(currentMonth)
    }
  }

  // מפת רישומים לפי תאריך
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceRow>()
    if (data) {
      for (const a of data.attendances) {
        // a.date בפורמט ISO; ניקח רק את חלק התאריך
        const dateOnly = new Date(a.date).toISOString().slice(0, 10)
        map.set(dateOnly, a)
      }
    }
    return map
  }, [data])

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    if (data) {
      for (const h of data.holidays) {
        if (!map.has(h.date)) map.set(h.date, [])
        map.get(h.date)!.push(h)
      }
    }
    return map
  }, [data])

  // היום הנוכחי - האם כבר קלוקאין?
  const todayStr = getDateString(today)
  const todayRow = attendanceByDate.get(todayStr)
  const isClockedIn = !!todayRow?.clockIn && !todayRow?.clockOut
  const isClockedOutToday = !!todayRow?.clockIn && !!todayRow?.clockOut

  // סיכום החודש
  const summary = useMemo(() => {
    if (!data) return { totalMinutes: 0, daysWorked: 0, lateMinutes: 0, overtimeMinutes: 0 }
    let totalMinutes = 0
    let daysWorked = 0
    let lateMinutes = 0
    let overtimeMinutes = 0
    for (const a of data.attendances) {
      const m = calcWorkedMinutes(a.clockIn, a.clockOut, a.breakMinutes)
      if (m > 0) daysWorked++
      totalMinutes += m
      if (a.clockIn) {
        const inDate = new Date(a.clockIn)
        const expectedIn = new Date(inDate)
        expectedIn.setHours(8, 0, 0, 0)
        const lateDiff = Math.floor((inDate.getTime() - expectedIn.getTime()) / 60000)
        if (lateDiff > 0) lateMinutes += lateDiff
      }
      if (a.clockOut) {
        const outDate = new Date(a.clockOut)
        const expectedOut = new Date(outDate)
        expectedOut.setHours(16, 30, 0, 0)
        const overDiff = Math.floor((outDate.getTime() - expectedOut.getTime()) / 60000)
        if (overDiff > 0) overtimeMinutes += overDiff
      }
    }
    return { totalMinutes, daysWorked, lateMinutes, overtimeMinutes }
  }, [data])

  // יצירת רשימת ימי החודש
  const { year, month } = parseMonth(currentMonth)
  const daysCount = daysInMonth(year, month)
  const monthDays = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(year, month - 1, i + 1)
    return d
  })

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('he-IL', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" />
            שעון נוכחות
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            שעות עבודה: 08:00 - 16:30 · הפסקה לפי חוק 30 דק'
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 shadow-sm">
          <Clock className="w-5 h-5 text-indigo-500" />
          <span className="font-mono text-xl font-bold text-gray-800">
            {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
          </span>
          <span className="text-xs text-gray-500 mr-2">
            {now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Clock in/out + Today summary */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <div className="text-sm text-gray-500">היום</div>
              <div className="font-semibold text-gray-800">
                {today.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="mt-2 text-sm">
                כניסה: <span className="font-mono">{formatTime(todayRow?.clockIn ?? null)}</span>
                {' · '}
                יציאה: <span className="font-mono">{formatTime(todayRow?.clockOut ?? null)}</span>
              </div>
              {todayRow?.clockIn && todayRow?.clockOut && (
                <div className="text-sm text-gray-600 mt-1">
                  סה"כ נטו: <span className="font-bold">{formatMinutes(calcWorkedMinutes(todayRow.clockIn, todayRow.clockOut, todayRow.breakMinutes))}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleClockIn}
                disabled={busyClock !== null || isClockedIn || isClockedOutToday}
                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                size="lg"
              >
                <LogIn className="w-5 h-5 ml-2" />
                {isClockedIn || isClockedOutToday ? 'נכנס/ה' : 'כניסה'}
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={busyClock !== null || !isClockedIn}
                className="bg-red-600 hover:bg-red-700 text-white flex-1 md:flex-none"
                size="lg"
              >
                <LogOut className="w-5 h-5 ml-2" />
                יציאה
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {isClockedIn && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  בעבודה כעת
                </div>
              )}
              {isClockedOutToday && (
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="w-4 h-4" />
                  יום העבודה הסתיים
                </div>
              )}
              {!todayRow?.clockIn && (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  טרם נרשמה כניסה היום
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus + Hires summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">ימי עבודה החודש</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-1">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              {summary.daysWorked}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">סה"כ שעות נטו</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-1">
              <Clock className="w-5 h-5 text-blue-500" />
              {formatMinutes(summary.totalMinutes)}
            </div>
            {summary.overtimeMinutes > 0 && (
              <div className="text-xs text-green-600 mt-1">
                + {formatMinutes(summary.overtimeMinutes)} שעות נוספות
              </div>
            )}
            {summary.lateMinutes > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                {formatMinutes(summary.lateMinutes)} איחורים
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">גיוסים החודש</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2 mt-1">
              <Users className="w-5 h-5 text-purple-500" />
              {data?.bonus.hires ?? 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">{data?.bonus.tier.label}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-xs text-green-800">בונוס החודש</div>
            <div className="text-2xl font-bold text-green-900 flex items-center gap-2 mt-1">
              <DollarSign className="w-5 h-5" />
              ₪{(data?.bonus.totalBonus ?? 0).toLocaleString('he-IL')}
            </div>
            <div className="text-xs text-green-700 mt-1">
              {data?.bonus.perCandidate ? `${data.bonus.perCandidate} ₪ למועמד` : 'ללא בונוס'}
            </div>
            {data?.bonus.nextTier && data.bonus.hiresToNextTier !== null && (
              <div className="text-xs text-emerald-800 mt-2 bg-white/60 rounded px-2 py-1">
                <TrendingUp className="w-3 h-3 inline ml-1" />
                עוד {data.bonus.hiresToNextTier} גיוסים → {data.bonus.nextTier.perCandidate} ₪/מועמד
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bonus tiers explanation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            מדרגות בונוס
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            {[
              { label: '0-4 גיוסים', val: 'ללא' },
              { label: '5-9 גיוסים', val: '150 ₪/מועמד' },
              { label: '10-14 גיוסים', val: '200 ₪/מועמד' },
              { label: '15-19 גיוסים', val: '250 ₪/מועמד' },
              { label: '20+ גיוסים', val: '300 ₪/מועמד' },
            ].map((t, i) => {
              const active = data && data.bonus.tier.label === t.label
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-2 text-center ${
                    active ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-xs">{t.label}</div>
                  <div className="text-sm">{t.val}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border p-3 shadow-sm">
        <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
          <ChevronRight className="w-4 h-4 ml-1" />
          חודש קודם
        </Button>
        <div className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          {monthLabel}
        </div>
        <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
          חודש הבא
          <ChevronLeft className="w-4 h-4 mr-1" />
        </Button>
      </div>

      {/* Hires list */}
      {data && data.hires.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              גיוסים שהתקבלו החודש ({data.hires.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.hires.map((h) => (
                <div key={h.id} className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-sm">
                  <div className="font-semibold text-purple-900">{h.name}</div>
                  <div className="text-xs text-purple-700">
                    {h.hiredToEmployer?.name ?? '—'}
                    {h.hiredAt && ` · ${new Date(h.hiredAt).toLocaleDateString('he-IL')}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Days table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ימי החודש</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">טוען...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">תאריך</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">יום</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">חג / הערות</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">כניסה</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">יציאה</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">הפסקה</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">נטו</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">סטטוס</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {monthDays.map((d) => {
                    const dateStr = getDateString(d)
                    const row = attendanceByDate.get(dateStr)
                    const dayHolidays = holidaysByDate.get(dateStr) || []
                    const isWeekend = d.getDay() === 5 || d.getDay() === 6
                    const isToday = dateStr === todayStr
                    const isFuture = d > today
                    const worked = calcWorkedMinutes(row?.clockIn ?? null, row?.clockOut ?? null, row?.breakMinutes ?? 30)
                    const status = row?.status || (dayHolidays.some((h) => !h.isWorkDay) ? 'HOLIDAY' : null)
                    const editing = editingDate === dateStr

                    const rowBg = editing
                      ? 'bg-yellow-50'
                      : isToday
                      ? 'bg-indigo-50'
                      : isWeekend
                      ? 'bg-gray-50'
                      : dayHolidays.some((h) => !h.isWorkDay)
                      ? 'bg-purple-50'
                      : ''

                    return (
                      <tr key={dateStr} className={`border-b last:border-b-0 ${rowBg}`}>
                        <td className="px-3 py-2 font-mono">{pad(d.getDate())}/{pad(d.getMonth() + 1)}</td>
                        <td className="px-3 py-2">
                          {getDayName(d)}
                          {isToday && <Badge className="bg-indigo-600 text-white mr-2 text-xs">היום</Badge>}
                          {isWeekend && <span className="text-xs text-gray-500 mr-2">סופ"ש</span>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {dayHolidays.map((h, i) => (
                              <Badge key={i} className={`text-xs border ${holidayBadgeColor(h.type)}`}>
                                {h.name}
                                {h.isHalfDay && ' (חצי)'}
                              </Badge>
                            ))}
                          </div>
                          {row?.notes && <div className="text-xs text-gray-500 mt-1">{row.notes}</div>}
                        </td>
                        {editing ? (
                          <>
                            <td className="px-2 py-2">
                              <Input
                                type="time"
                                value={editForm.clockIn}
                                onChange={(e) => setEditForm((s) => ({ ...s, clockIn: e.target.value }))}
                                className="h-8 text-xs w-24"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                type="time"
                                value={editForm.clockOut}
                                onChange={(e) => setEditForm((s) => ({ ...s, clockOut: e.target.value }))}
                                className="h-8 text-xs w-24"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                min="0"
                                max="240"
                                value={editForm.breakMinutes}
                                onChange={(e) => setEditForm((s) => ({ ...s, breakMinutes: e.target.value }))}
                                className="h-8 text-xs w-16"
                              />
                            </td>
                            <td className="px-2 py-2 text-gray-400">—</td>
                            <td className="px-2 py-2">
                              <select
                                aria-label="סטטוס יום"
                                value={editForm.status}
                                onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}
                                className="h-8 text-xs border rounded px-2"
                              >
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex gap-1">
                                <Button size="sm" onClick={saveEdit} className="h-7 px-2 bg-green-600 hover:bg-green-700">
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingDate(null)} className="h-7 px-2">
                                  ✕
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-mono">{formatTime(row?.clockIn ?? null)}</td>
                            <td className="px-3 py-2 font-mono">{formatTime(row?.clockOut ?? null)}</td>
                            <td className="px-3 py-2">
                              {row ? (
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Coffee className="w-3 h-3" />
                                  {row.breakMinutes}׳
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold">{worked > 0 ? formatMinutes(worked) : '—'}</td>
                            <td className="px-3 py-2">
                              {status && (
                                <Badge className={`text-xs border ${STATUS_LABELS[status]?.color || 'bg-gray-100 text-gray-700'}`}>
                                  {STATUS_LABELS[status]?.label || status}
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {!isFuture && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEdit(dateStr, row, dayHolidays[0])}>
                                  ערוך
                                </Button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
