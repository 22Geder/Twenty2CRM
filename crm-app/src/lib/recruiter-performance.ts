import { toYear, toYearMonth } from '@/lib/candidate-hired-dates'
import { calcWorkedMinutes } from '@/lib/attendance'

export const UPLOAD_TARGET = 450
export const HIRE_TARGET = 10
export const PERFECT_SCORE = 100

export type PerformanceLevel = 'מעולה' | 'טוב' | 'בינוני' | 'חלש'

export interface RecruiterScore {
  score: number
  uploadScore: number
  hireScore: number
  level: PerformanceLevel
}

export function scoreRecruiterMonth(uploaded: number, hired: number): RecruiterScore {
  const safeUploaded = Math.max(0, uploaded || 0)
  const safeHired = Math.max(0, hired || 0)
  const cappedPercent = (value: number, target: number) => (
    value >= target ? PERFECT_SCORE : Math.floor((value / target) * (PERFECT_SCORE - 1))
  )
  const uploadScore = cappedPercent(safeUploaded, UPLOAD_TARGET)
  const hireScore = cappedPercent(safeHired, HIRE_TARGET)
  const score = Math.round((uploadScore + hireScore) / 2)

  return {
    score,
    uploadScore,
    hireScore,
    level: score >= 85 ? 'מעולה' : score >= 65 ? 'טוב' : score >= 40 ? 'בינוני' : 'חלש',
  }
}

export function currentYearMonth(now = new Date()): string {
  return toYearMonth(now) || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export function bucketRecruiterActivity(
  rows: Array<{ uploadedById: string | null; createdAt: Date | string; hiredAt?: Date | string | null }>,
) {
  const uploads = new Map<string, Map<string, number>>()
  const hires = new Map<string, Map<string, number>>()

  const bump = (store: Map<string, Map<string, number>>, userId: string, month: string) => {
    const months = store.get(userId) || new Map<string, number>()
    months.set(month, (months.get(month) || 0) + 1)
    store.set(userId, months)
  }

  for (const row of rows) {
    if (!row.uploadedById) continue
    const uploadedMonth = toYearMonth(row.createdAt)
    if (uploadedMonth) bump(uploads, row.uploadedById, uploadedMonth)
    const hiredMonth = toYearMonth(row.hiredAt)
    if (hiredMonth) bump(hires, row.uploadedById, hiredMonth)
  }

  return { uploads, hires }
}

export function bucketRecruiterAttendance(
  rows: Array<{
    date: Date | string
    clockIn: Date | string | null
    clockOut: Date | string | null
    breakMinutes: number
  }>,
) {
  const workedMinutes = new Map<string, number>()
  const completedShifts = new Map<string, number>()

  for (const row of rows) {
    const month = toYearMonth(row.date)
    if (!month) continue

    const minutes = calcWorkedMinutes(row.clockIn, row.clockOut, row.breakMinutes)
    if (minutes <= 0) continue

    workedMinutes.set(month, (workedMinutes.get(month) || 0) + minutes)
    completedShifts.set(month, (completedShifts.get(month) || 0) + 1)
  }

  return { workedMinutes, completedShifts }
}

export function yearMonths(year: string): string[] {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
}

export function isYear(value: string): boolean {
  return /^\d{4}$/.test(value) && toYear(`${value}-01-01T12:00:00+03:00`) === value
}
