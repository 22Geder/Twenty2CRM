export type CalendarViewMode =
  | "day"
  | "fourDays"
  | "week"
  | "workWeek"
  | "month"
  | "agenda"
  | "year"

export type TeamCalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  calendarEmails: string[]
  location?: string
  description?: string
  meetingUrl?: string
  htmlLink?: string
  colorId?: string
  attendeeEmails?: string[]
  interview?: {
    interviewId: string
    candidateId: string
    candidateName?: string
    interviewTitle?: string
  } | null
}

export const WEEK_DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const
export const VIEW_LABELS: Record<CalendarViewMode, string> = {
  day: "יום",
  fourDays: "4 ימים",
  week: "שבוע",
  workWeek: "ראשון–חמישי",
  month: "חודש",
  agenda: "סדר יום",
  year: "שנה",
}

export const DAY_START_HOUR = 7
export const DAY_END_HOUR = 21

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date)
  start.setDate(start.getDate() - start.getDay())
  return start
}

export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

export function yearMonths(year: Date): Date[] {
  return Array.from({ length: 12 }, (_, index) => new Date(year.getFullYear(), index, 1))
}

export function eventDateKey(event: Pick<TeamCalendarEvent, "start" | "allDay">): string {
  if (event.allDay) return event.start.slice(0, 10)
  return dateKey(new Date(event.start))
}

export function visibleRange(anchor: Date, view: CalendarViewMode): { from: Date; to: Date } {
  if (view === "day") {
    const from = startOfDay(anchor)
    return { from, to: addDays(from, 1) }
  }
  if (view === "fourDays") {
    const from = startOfDay(anchor)
    return { from, to: addDays(from, 4) }
  }
  if (view === "week") {
    const from = startOfWeek(anchor)
    return { from, to: addDays(from, 7) }
  }
  if (view === "workWeek") {
    const from = startOfWeek(anchor)
    return { from, to: addDays(from, 5) }
  }
  if (view === "agenda") {
    const from = startOfDay(anchor)
    return { from, to: addDays(from, 14) }
  }
  if (view === "year") {
    const from = new Date(anchor.getFullYear(), 0, 1)
    return { from, to: new Date(anchor.getFullYear() + 1, 0, 1) }
  }
  const days = monthGrid(anchor)
  const from = days[0]
  return { from, to: addDays(days[days.length - 1], 1) }
}

export function shiftAnchor(anchor: Date, view: CalendarViewMode, offset: number): Date {
  if (view === "month") return addMonths(anchor, offset)
  if (view === "year") return new Date(anchor.getFullYear() + offset, 0, 1)
  if (view === "week" || view === "workWeek") return addDays(startOfWeek(anchor), offset * 7)
  if (view === "fourDays") return addDays(startOfDay(anchor), offset * 4)
  if (view === "agenda") return addDays(startOfDay(anchor), offset * 7)
  return addDays(startOfDay(anchor), offset)
}

export function viewTitle(anchor: Date, view: CalendarViewMode): string {
  if (view === "year") return String(anchor.getFullYear())
  if (view === "month") {
    return anchor.toLocaleDateString("he-IL", { month: "long", year: "numeric" })
  }
  if (view === "day") {
    return anchor.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }
  const { from, to } = visibleRange(anchor, view)
  const last = addDays(to, -1)
  const fromLabel = from.toLocaleDateString("he-IL", { day: "numeric", month: "short" })
  const toLabel = last.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })
  return `${fromLabel} – ${toLabel}`
}

export function daysInRange(from: Date, to: Date): Date[] {
  const days: Date[] = []
  for (let cursor = startOfDay(from); cursor < to; cursor = addDays(cursor, 1)) {
    days.push(cursor)
  }
  return days
}

export function hourSlots(slotMinutes: 15 | 30 | 60): { hour: number; minute: number; label: string }[] {
  const slots: { hour: number; minute: number; label: string }[] = []
  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += slotMinutes) {
      slots.push({
        hour,
        minute,
        label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      })
    }
  }
  return slots
}

export function eventLayout(
  event: Pick<TeamCalendarEvent, "start" | "end" | "allDay">,
  day: Date,
): { topPercent: number; heightPercent: number } | null {
  if (event.allDay) return null
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), DAY_START_HOUR, 0, 0, 0)
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), DAY_END_HOUR, 0, 0, 0)
  const start = new Date(event.start)
  const end = new Date(event.end)
  const clippedStart = start < dayStart ? dayStart : start
  const clippedEnd = end > dayEnd ? dayEnd : end
  if (clippedEnd <= dayStart || clippedStart >= dayEnd) return null
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60
  const startMinutes = (clippedStart.getTime() - dayStart.getTime()) / 60000
  const durationMinutes = Math.max(15, (clippedEnd.getTime() - clippedStart.getTime()) / 60000)
  return {
    topPercent: (startMinutes / totalMinutes) * 100,
    heightPercent: (durationMinutes / totalMinutes) * 100,
  }
}

export function groupEventsByDate(events: TeamCalendarEvent[]): Map<string, TeamCalendarEvent[]> {
  const grouped = new Map<string, TeamCalendarEvent[]>()
  for (const event of events) {
    const key = eventDateKey(event)
    grouped.set(key, [...(grouped.get(key) || []), event])
  }
  for (const [key, list] of grouped) {
    grouped.set(key, [...list].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      return a.start.localeCompare(b.start)
    }))
  }
  return grouped
}

export function currentTimePercent(now = new Date()): number | null {
  const minutes = now.getHours() * 60 + now.getMinutes()
  const start = DAY_START_HOUR * 60
  const end = DAY_END_HOUR * 60
  if (minutes < start || minutes > end) return null
  return ((minutes - start) / (end - start)) * 100
}

export function formatClock(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || undefined,
  }).format(date)
}
