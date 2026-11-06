// חישוב "הריצה הבאה" לתזמון מחזורי (RECURRING), עם תמיכה בטיימזון (ברירת מחדל Asia/Jerusalem כולל שעון קיץ).

export type RecurrenceRule = {
  frequency: "DAILY" | "WEEKLY"
  time: string // "HH:mm"
  daysOfWeek?: number[] // 0=ראשון..6=שבת - חובה ל-WEEKLY
  timezone?: string
}

// ממיר תאריך/שעה "מקומיים" באזור זמן נתון ל-UTC, עם תיקון איטרטיבי לקיזוז שעון הקיץ.
function localToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  let utcMillis = Date.UTC(year, month, day, hour, minute)
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(utcMillis))
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
    const formattedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
    const target = Date.UTC(year, month, day, hour, minute)
    utcMillis += target - formattedAsUtc
  }
  return new Date(utcMillis)
}

const WEEKDAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function computeNextRunAt(rule: RecurrenceRule, from: Date = new Date()): Date {
  const timeZone = rule.timezone || "Asia/Jerusalem"
  const [hourStr, minuteStr] = rule.time.split(":")
  const hour = Number(hourStr)
  const minute = Number(minuteStr)

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const candidateInstant = new Date(from.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
    }).formatToParts(candidateInstant)
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const year = Number(get("year"))
    const month = Number(get("month")) - 1
    const day = Number(get("day"))
    const weekday = WEEKDAY_MAP[get("weekday") || "Sun"]

    if (rule.frequency === "WEEKLY" && !(rule.daysOfWeek || []).includes(weekday)) continue

    const candidate = localToUtc(year, month, day, hour, minute, timeZone)
    if (candidate.getTime() > from.getTime()) return candidate
  }

  // פולבק בטיחותי - לא אמור להתרחש עבור DAILY/WEEKLY עם קלט תקין
  return new Date(from.getTime() + 24 * 60 * 60 * 1000)
}
