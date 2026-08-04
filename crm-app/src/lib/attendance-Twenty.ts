/**
 * 🕐 שעון נוכחות - חישובים, חוקי הפסקות ובונוסים
 * 
 * שעות עבודה סטנדרטיות: 08:00 - 16:30 (8.5 שעות ברוטו)
 * הפסקה לפי חוק: 30 דק' (מוגדר כברירת מחדל)
 * שעות נטו: 8 שעות
 */

export const STANDARD_START_HOUR = 8
export const STANDARD_START_MINUTE = 0
export const STANDARD_END_HOUR = 16
export const STANDARD_END_MINUTE = 30

// חוק שעות עבודה ומנוחה - הפסקות
// 6+ שעות עבודה: חובה הפסקה של 45 דק' מינימום (30 רצופות)
// כאן ברירת מחדל 30 דק' (כפי שביקש המשתמש)
export const DEFAULT_BREAK_MINUTES = 30
export const LEGAL_MIN_BREAK_FOR_6H_SHIFT = 45 // דקות

export const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: 'נוכח' },
  { value: 'ABSENT', label: 'חיסור' },
  { value: 'SICK', label: 'מחלה' },
  { value: 'VACATION', label: 'חופש' },
  { value: 'HOLIDAY', label: 'חג' },
  { value: 'RESERVE_DUTY', label: 'מילואים' },
  { value: 'REMOTE', label: 'עבודה מהבית' },
] as const

export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number]['value']

/**
 * חישוב סך הדקות בין כניסה ויציאה (פחות הפסקה)
 */
export function calcWorkedMinutes(
  clockIn: Date | string | null | undefined,
  clockOut: Date | string | null | undefined,
  breakMinutes: number = DEFAULT_BREAK_MINUTES,
): number {
  if (!clockIn || !clockOut) return 0
  const inDate = new Date(clockIn)
  const outDate = new Date(clockOut)
  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) return 0
  const diffMs = outDate.getTime() - inDate.getTime()
  if (diffMs <= 0) return 0
  const totalMinutes = Math.floor(diffMs / 60000)
  return Math.max(0, totalMinutes - (breakMinutes || 0))
}

/**
 * פורמט דקות → "Xש Yד"
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes < 0) return '0:00'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * סטנדרטי - 8 שעות נטו ביום (8.5 ברוטו פחות 30 דק' הפסקה)
 */
export const STANDARD_DAILY_NET_MINUTES = 8 * 60

/**
 * חישוב סטטוס איחור / יציאה מוקדמת
 */
export function getDayDelta(
  clockIn: Date | string | null | undefined,
  clockOut: Date | string | null | undefined,
): { lateMinutes: number; earlyLeaveMinutes: number; overtimeMinutes: number } {
  let lateMinutes = 0
  let earlyLeaveMinutes = 0
  let overtimeMinutes = 0

  if (clockIn) {
    const inDate = new Date(clockIn)
    const expectedIn = new Date(inDate)
    expectedIn.setHours(STANDARD_START_HOUR, STANDARD_START_MINUTE, 0, 0)
    const diff = Math.floor((inDate.getTime() - expectedIn.getTime()) / 60000)
    if (diff > 0) lateMinutes = diff
  }

  if (clockOut) {
    const outDate = new Date(clockOut)
    const expectedOut = new Date(outDate)
    expectedOut.setHours(STANDARD_END_HOUR, STANDARD_END_MINUTE, 0, 0)
    const diff = Math.floor((expectedOut.getTime() - outDate.getTime()) / 60000)
    if (diff > 0) earlyLeaveMinutes = diff
    if (diff < 0) overtimeMinutes = Math.abs(diff)
  }

  return { lateMinutes, earlyLeaveMinutes, overtimeMinutes }
}

/**
 * 💰 חישוב בונוס גיוסים בהתאם לכמות (ע"פ דרישת המשתמש)
 *  0-4   = ללא בונוס
 *  5-9   = 150 ש"ח לכל מועמד
 *  10-14 = 200 ש"ח לכל מועמד
 *  15-19 = 250 ש"ח לכל מועמד
 *  20+   = 300 ש"ח לכל מועמד
 */
export interface BonusTier {
  min: number
  max: number // inclusive; Infinity = top
  perCandidate: number
  label: string
}

export const BONUS_TIERS: BonusTier[] = [
  { min: 0, max: 4, perCandidate: 0, label: '0-4 גיוסים' },
  { min: 5, max: 9, perCandidate: 150, label: '5-9 גיוסים' },
  { min: 10, max: 14, perCandidate: 200, label: '10-14 גיוסים' },
  { min: 15, max: 19, perCandidate: 250, label: '15-19 גיוסים' },
  { min: 20, max: Infinity, perCandidate: 300, label: '20+ גיוסים' },
]

export interface BonusResult {
  hires: number
  perCandidate: number
  totalBonus: number
  tier: BonusTier
  nextTier: BonusTier | null
  hiresToNextTier: number | null
}

export function calcBonus(hires: number): BonusResult {
  const safeHires = Math.max(0, Math.floor(hires || 0))
  const tier = BONUS_TIERS.find((t) => safeHires >= t.min && safeHires <= t.max) || BONUS_TIERS[0]
  const nextIdx = BONUS_TIERS.indexOf(tier) + 1
  const nextTier = nextIdx < BONUS_TIERS.length ? BONUS_TIERS[nextIdx] : null
  const hiresToNextTier = nextTier ? Math.max(0, nextTier.min - safeHires) : null
  return {
    hires: safeHires,
    perCandidate: tier.perCandidate,
    totalBonus: safeHires * tier.perCandidate,
    tier,
    nextTier,
    hiresToNextTier,
  }
}

/**
 * עזר - מקבל "YYYY-MM" ומחזיר תאריך תחילת חודש וסוף חודש (UTC)
 */
export function getMonthRange(monthStr: string): { start: Date; end: Date; year: number; month: number } {
  const [yStr, mStr] = monthStr.split('-')
  const year = parseInt(yStr, 10)
  const month = parseInt(mStr, 10) // 1-12
  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid month format. Expected YYYY-MM')
  }
  // חצות UTC של היום הראשון בחודש
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { start, end, year, month }
}

/**
 * עזר - תאריך כיום עבודה: מאפס שעות (UTC) כדי שיתאים ל-@db.Date
 */
export function toWorkDate(d: Date | string): Date {
  const date = new Date(d)
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0))
}

/**
 * האם תאריך הוא שישי או שבת (סופ"ש בישראל)
 */
export function isIsraeliWeekend(d: Date): boolean {
  const day = d.getDay() // 0=Sun, 5=Fri, 6=Sat
  return day === 5 || day === 6
}
