// תאריכי העלאה/קבלה של מועמד — מקור אמת לסטטוס חודשי ולדף מועמד.
// אין שינוי schema: createdAt = מתי עלה, hiredAt = מתי התקבל.

const ISRAEL_TZ = 'Asia/Jerusalem'
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function isDateOnlyString(value: unknown): boolean {
  return typeof value === 'string' && DATE_ONLY_RE.test(value.trim())
}

export function parseHiredAtInput(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  if (isDateOnlyString(trimmed)) {
    const parsed = new Date(`${trimmed}T12:00:00+03:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function asValidDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function toYearMonth(
  value: Date | string | null | undefined,
  timeZone = ISRAEL_TZ
): string | null {
  const date = asValidDate(value)
  if (!date) return null

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  if (!year || !month) return null
  return `${year}-${month}`
}

export function isInYearMonth(
  value: Date | string | null | undefined,
  yearMonth: string
): boolean {
  return Boolean(yearMonth) && toYearMonth(value) === yearMonth
}

export function isMonthlyStatusCandidate(
  candidate: {
    createdAt?: Date | string | null
    hiredAt?: Date | string | null
    inProcessAt?: Date | string | null
  },
  yearMonth: string
): boolean {
  return (
    isInYearMonth(candidate.createdAt, yearMonth) ||
    isInYearMonth(candidate.hiredAt, yearMonth) ||
    isInYearMonth(candidate.inProcessAt, yearMonth)
  )
}

export function formatDateHe(value: Date | string | null | undefined): string {
  const date = asValidDate(value)
  if (!date) return ''
  return date.toLocaleDateString('he-IL', { timeZone: ISRAEL_TZ })
}

/**
 * קובע את hiredAt בעדכון מועמד:
 * - מעבר ראשון ל-EMPLOYED -> שומר עכשיו (או תאריך מפורש)
 * - לחיצה חוזרת על "התקבל" לא דורסת תאריך קיים
 * - עריכה ידנית מסוג YYYY-MM-DD מעדכנת את התאריך
 * - undefined = לא לגעת בעמודה
 */
export function resolveHiredAtForUpdate(params: {
  existingHiredAt: Date | string | null | undefined
  requestedHiredAt?: Date | string | null
  hiredAtProvided: boolean
  employmentStatus?: string | null
  employmentStatusProvided: boolean
}): Date | null | undefined {
  const {
    existingHiredAt,
    requestedHiredAt,
    hiredAtProvided,
    employmentStatus,
    employmentStatusProvided,
  } = params

  const existing = asValidDate(existingHiredAt)
  const becomingEmployed = employmentStatusProvided && employmentStatus === 'EMPLOYED'

  if (becomingEmployed) {
    if (existing) {
      if (hiredAtProvided && isDateOnlyString(requestedHiredAt)) {
        return parseHiredAtInput(requestedHiredAt)
      }
      return undefined
    }

    if (hiredAtProvided) {
      return parseHiredAtInput(requestedHiredAt) ?? new Date()
    }

    return new Date()
  }

  if (hiredAtProvided) {
    return parseHiredAtInput(requestedHiredAt)
  }

  return undefined
}
