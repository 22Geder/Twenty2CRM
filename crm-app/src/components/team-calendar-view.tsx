"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Sparkles,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CalendarViewMode,
  TeamCalendarEvent,
  VIEW_LABELS,
  WEEK_DAY_LABELS,
  currentTimePercent,
  dateKey,
  daysInRange,
  eventLayout,
  formatClock,
  groupEventsByDate,
  hourSlots,
  monthGrid,
  shiftAnchor,
  startOfDay,
  viewTitle,
  visibleRange,
  yearMonths,
} from "@/lib/team-calendar-views"

type CalendarEvent = TeamCalendarEvent

const EVENT_PALETTES = [
  { chip: "bg-blue-100 text-blue-800", bar: "bg-blue-500", panel: "bg-blue-50 border-blue-100" },
  { chip: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500", panel: "bg-emerald-50 border-emerald-100" },
  { chip: "bg-violet-100 text-violet-800", bar: "bg-violet-500", panel: "bg-violet-50 border-violet-100" },
  { chip: "bg-amber-100 text-amber-800", bar: "bg-amber-500", panel: "bg-amber-50 border-amber-100" },
  { chip: "bg-rose-100 text-rose-800", bar: "bg-rose-500", panel: "bg-rose-50 border-rose-100" },
  { chip: "bg-cyan-100 text-cyan-800", bar: "bg-cyan-500", panel: "bg-cyan-50 border-cyan-100" },
]

const VIEW_ORDER: CalendarViewMode[] = ["day", "fourDays", "week", "workWeek", "month", "agenda", "year"]

function paletteFor(event: CalendarEvent) {
  const seed = (event.calendarEmails[0] || event.id || event.title)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return EVENT_PALETTES[seed % EVENT_PALETTES.length]
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return "כל היום"
  return formatClock(new Date(event.start))
}

function formatEventRange(event: CalendarEvent): string {
  if (event.allDay) return "כל היום"
  return `${formatClock(new Date(event.start))} – ${formatClock(new Date(event.end))}`
}

function formatEventDateRange(event: CalendarEvent): string {
  const start = new Date(event.allDay ? `${event.start.slice(0, 10)}T12:00:00` : event.start)
  const date = start.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  return event.allDay ? `${date} · כל היום` : `${date} · ${formatEventRange(event)}`
}

function EventChip({ event, onSelect }: { event: CalendarEvent; onSelect: (event: CalendarEvent) => void }) {
  const palette = paletteFor(event)
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      title={`${event.title} (${event.calendarEmails.join(", ")})`}
      aria-label={`פתיחת פרטי האירוע ${event.title}`}
      className={`flex w-full items-center gap-1 truncate rounded-lg px-1.5 py-1 text-right text-[11px] font-medium transition hover:ring-2 hover:ring-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${palette.chip}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${palette.bar}`} />
      <span className="truncate">
        {event.allDay ? "" : `${formatEventTime(event)} `}
        {event.title}
      </span>
    </button>
  )
}

function TimedEventBlock({ event, onSelect }: { event: CalendarEvent; onSelect: (event: CalendarEvent) => void }) {
  const palette = paletteFor(event)
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-label={`פתיחת פרטי האירוע ${event.title}`}
      className={`h-full w-full overflow-hidden rounded-md px-1.5 py-1 text-right text-[11px] font-semibold shadow-sm transition hover:ring-2 hover:ring-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${palette.chip}`}
    >
      <div className="truncate">{event.title}</div>
      <div className="truncate text-[10px] opacity-80">{formatEventRange(event)}</div>
    </button>
  )
}

export function TeamCalendarView() {
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [view, setView] = useState<CalendarViewMode>("month")
  const [slotMinutes, setSlotMinutes] = useState<15 | 30 | 60>(30)
  const [secondaryTimeZone, setSecondaryTimeZone] = useState("UTC")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([])
  const [hiddenCalendars, setHiddenCalendars] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const range = useMemo(() => visibleRange(anchor, view), [anchor, view])
  const rangeDays = useMemo(() => daysInRange(range.from, range.to), [range.from, range.to])
  const todayKey = dateKey(now)
  const nowPercent = currentTimePercent(now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedEvent(null)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [selectedEvent])

  useEffect(() => {
    const controller = new AbortController()
    const loadEvents = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch(
          `/api/calendar/events?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("Calendar request failed")
        const data = await response.json()
        setEvents(data.events || [])
        setConnectedCalendars(data.connectedCalendars || [])
      } catch (fetchError) {
        if (!(fetchError instanceof DOMException && fetchError.name === "AbortError")) setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadEvents()
    return () => controller.abort()
  }, [range.from.getTime(), range.to.getTime()])

  const visibleEvents = events.filter(event =>
    event.calendarEmails.some(email => !hiddenCalendars.includes(email)) || event.calendarEmails.length === 0,
  )
  const eventsByDate = groupEventsByDate(visibleEvents)
  const monthEventCount = visibleEvents.length
  const slots = hourSlots(slotMinutes)
  const timedViews: CalendarViewMode[] = ["day", "fourDays", "week", "workWeek"]

  const goToday = () => setAnchor(startOfDay(new Date()))
  const toggleCalendar = (email: string) => {
    setHiddenCalendars(current =>
      current.includes(email) ? current.filter(item => item !== email) : [...current, email],
    )
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]" aria-label="יומן Google">
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-700 via-indigo-600 to-sky-500 px-5 py-5 text-white">
        <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              יומן צוות
            </div>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <CalendarDays className="h-6 w-6" />
              היומן שלנו
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              {connectedCalendars.length > 0 ? connectedCalendars.join(" · ") : "לא נמצא יומן מחובר"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-black leading-none">{monthEventCount}</div>
              <div className="mt-1 text-[11px] text-white/75">אירועים בטווח</div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-black leading-none">{connectedCalendars.length}</div>
              <div className="mt-1 text-[11px] text-white/75">יומנים מחוברים</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setAnchor(current => shiftAnchor(current, view, 1))} title="הבא">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="min-w-48 text-center text-lg font-black text-slate-800">{viewTitle(anchor, view)}</div>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setAnchor(current => shiftAnchor(current, view, -1))} title="הקודם">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {VIEW_ORDER.map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${view === mode ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
          {timedViews.includes(view) && (
            <select
              value={slotMinutes}
              onChange={event => setSlotMinutes(Number(event.target.value) as 15 | 30 | 60)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
              aria-label="רזולוציית שעות"
            >
              <option value={15}>15 דק׳</option>
              <option value={30}>30 דק׳</option>
              <option value={60}>60 דק׳</option>
            </select>
          )}
          <Button variant="outline" className="rounded-xl border-blue-200 bg-white text-blue-700 hover:bg-blue-50" onClick={goToday}>
            היום
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-white px-4 py-3">
        {connectedCalendars.map(email => {
          const hidden = hiddenCalendars.includes(email)
          return (
            <button
              key={email}
              type="button"
              onClick={() => toggleCalendar(email)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${hidden ? "bg-slate-100 text-slate-400 line-through" : "bg-blue-50 text-blue-700"}`}
            >
              {email}
            </button>
          )
        })}
        <div className="mr-auto flex items-center gap-2 text-xs text-slate-500">
          <Globe className="h-3.5 w-3.5" />
          ישראל {formatClock(now, "Asia/Jerusalem")}
          <select
            value={secondaryTimeZone}
            onChange={event => setSecondaryTimeZone(event.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
            aria-label="אזור זמן משני"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/London">לונדון</option>
            <option value="Europe/Berlin">ברלין</option>
            <option value="America/New_York">ניו יורק</option>
          </select>
          {formatClock(now, secondaryTimeZone)}
        </div>
      </div>

      <div className="relative">
        {view === "month" && (
          <MonthView
            anchor={anchor}
            eventsByDate={eventsByDate}
            todayKey={todayKey}
            onSelectDay={day => {
              setAnchor(startOfDay(day))
              setView("day")
            }}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {timedViews.includes(view) && (
          <TimedGridView
            days={rangeDays}
            eventsByDate={eventsByDate}
            slots={slots}
            todayKey={todayKey}
            nowPercent={nowPercent}
            onSelectDay={day => {
              setAnchor(startOfDay(day))
              setView("day")
            }}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            days={rangeDays}
            eventsByDate={eventsByDate}
            todayKey={todayKey}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {view === "year" && (
          <YearView
            anchor={anchor}
            eventsByDate={eventsByDate}
            todayKey={todayKey}
            onSelectMonth={month => {
              setAnchor(startOfDay(month))
              setView("month")
            }}
          />
        )}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              טוען יומן...
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="border-t border-red-100 bg-red-50 p-3 text-sm text-red-700">
          לא ניתן לטעון את היומן כרגע.
        </div>
      )}
      {selectedEvent && (
        <EventDetailsDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </section>
  )
}

function MonthView({
  anchor,
  eventsByDate,
  todayKey,
  onSelectDay,
  onSelectEvent,
}: {
  anchor: Date
  eventsByDate: Map<string, CalendarEvent[]>
  todayKey: string
  onSelectDay: (day: Date) => void
  onSelectEvent: (event: CalendarEvent) => void
}) {
  const days = monthGrid(anchor)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-white">
          {WEEK_DAY_LABELS.map((day, index) => (
            <div key={day} className={`p-2.5 text-center text-xs font-black ${index >= 5 ? "text-rose-400" : "text-slate-500"}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const key = dateKey(day)
            const dayEvents = eventsByDate.get(key) || []
            const isCurrentMonth = day.getMonth() === anchor.getMonth()
            const isToday = key === todayKey
            const isWeekend = day.getDay() === 5 || day.getDay() === 6
            return (
              <div
                key={key}
                className={`min-h-28 border-b border-l border-slate-100 p-1.5 text-right transition ${
                  isCurrentMonth
                    ? isWeekend ? "bg-rose-50/40" : "bg-white"
                    : "bg-slate-50/80 text-slate-400"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    aria-label={`מעבר ליום ${day.toLocaleDateString("he-IL")}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition hover:ring-2 hover:ring-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isToday ? "bg-blue-600 font-black text-white shadow-sm" : isCurrentMonth ? "font-semibold text-slate-700 hover:bg-blue-50" : "text-slate-400 hover:bg-slate-200"}`}
                  >
                    {day.getDate()}
                  </button>
                  {dayEvents.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">{dayEvents.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <EventChip key={`${event.id}-${event.start}`} event={event} onSelect={onSelectEvent} />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="px-1 text-[10px] font-medium text-slate-500">+{dayEvents.length - 3} נוספים</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TimedGridView({
  days,
  eventsByDate,
  slots,
  todayKey,
  nowPercent,
  onSelectDay,
  onSelectEvent,
}: {
  days: Date[]
  eventsByDate: Map<string, CalendarEvent[]>
  slots: { hour: number; minute: number; label: string }[]
  todayKey: string
  nowPercent: number | null
  onSelectDay: (day: Date) => void
  onSelectEvent: (event: CalendarEvent) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="border-b border-slate-100 bg-slate-50 p-2 text-[10px] font-bold text-slate-400">שעה</div>
          {days.map(day => {
            const key = dateKey(day)
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`border-b border-l border-slate-100 p-2 text-center ${key === todayKey ? "bg-blue-50" : "bg-white"}`}
              >
                <div className="text-[11px] font-bold text-slate-400">{WEEK_DAY_LABELS[day.getDay()]}</div>
                <div className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${key === todayKey ? "bg-blue-600 text-white" : "text-slate-800"}`}>
                  {day.getDate()}
                </div>
              </button>
            )
          })}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div>
            {slots.map(slot => (
              <div key={slot.label} className="h-12 border-b border-slate-100 px-2 text-[11px] font-semibold text-slate-400">
                {slot.minute === 0 ? slot.label : ""}
              </div>
            ))}
          </div>
          {days.map(day => {
            const key = dateKey(day)
            const dayEvents = eventsByDate.get(key) || []
            const timed = dayEvents.filter(event => !event.allDay)
            const allDay = dayEvents.filter(event => event.allDay)
            return (
              <div key={key} className="relative border-l border-slate-100">
                {allDay.length > 0 && (
                  <div className="absolute inset-x-1 top-1 z-10 space-y-1">
                    {allDay.map(event => (
                      <EventChip key={`${event.id}-${event.start}`} event={event} onSelect={onSelectEvent} />
                    ))}
                  </div>
                )}
                {slots.map(slot => (
                  <div key={`${key}-${slot.label}`} className="h-12 border-b border-slate-50" />
                ))}
                {timed.map(event => {
                  const layout = eventLayout(event, day)
                  if (!layout) return null
                  return (
                    <div
                      key={`${event.id}-${event.start}`}
                      className="absolute inset-x-1"
                      style={{ top: `${layout.topPercent}%`, height: `${layout.heightPercent}%` }}
                    >
                      <TimedEventBlock event={event} onSelect={onSelectEvent} />
                    </div>
                  )
                })}
                {key === todayKey && nowPercent !== null && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: `${nowPercent}%` }}>
                    <div className="h-0.5 bg-red-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AgendaView({
  days,
  eventsByDate,
  todayKey,
  onSelectEvent,
}: {
  days: Date[]
  eventsByDate: Map<string, CalendarEvent[]>
  todayKey: string
  onSelectEvent: (event: CalendarEvent) => void
}) {
  return (
    <div className="space-y-3 p-4">
      {days.map(day => {
        const key = dateKey(day)
        const dayEvents = eventsByDate.get(key) || []
        return (
          <div key={key} className={`rounded-2xl border p-4 ${key === todayKey ? "border-blue-200 bg-blue-50/50" : "border-slate-100 bg-white"}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-slate-800">
                {day.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <span className="text-xs font-bold text-slate-400">{dayEvents.length} אירועים</span>
            </div>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-slate-400">אין אירועים</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map(event => {
                  const palette = paletteFor(event)
                  return (
                    <button
                      key={`${event.id}-${event.start}`}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      aria-label={`פתיחת פרטי האירוע ${event.title}`}
                      className={`w-full rounded-2xl border p-3 text-right transition hover:border-blue-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${palette.panel}`}
                    >
                      <p className="font-bold text-slate-800">{event.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        {formatEventRange(event)}
                      </p>
                      {event.calendarEmails.length > 0 && (
                        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-500">
                          <Mail className="h-3.5 w-3.5" />
                          {event.calendarEmails.join(", ")}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EventDetailsDialog({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
        dir="rtl"
        onClick={clickEvent => clickEvent.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-right shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="סגירת פרטי האירוע"
          title="סגור"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pl-12">
          <p className="text-xs font-bold text-blue-600">פרטי אירוע</p>
          <h2 id="calendar-event-title" className="mt-1 text-xl font-black text-slate-900">{event.title}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 shrink-0" />
            {formatEventDateRange(event)}
          </p>
        </div>

        <div className="mt-6 space-y-5 border-t border-slate-100 pt-5 text-sm">
          <section>
            <h3 className="mb-2 font-bold text-slate-800">יומנים</h3>
            <div className="flex flex-wrap gap-2">
              {event.calendarEmails.map(email => (
                <span key={email} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{email}</span>
              ))}
            </div>
          </section>

          {event.location && (
            <p className="flex items-start gap-2 text-slate-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{event.location}</span>
            </p>
          )}

          {event.description && (
            <section>
              <h3 className="mb-2 font-bold text-slate-800">תיאור</h3>
              <p className="whitespace-pre-wrap break-words leading-6 text-slate-600">{event.description}</p>
            </section>
          )}

          <section>
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-800">
              <Users className="h-4 w-4 text-slate-400" />
              משתתפים
            </h3>
            {event.attendeeEmails?.length ? (
              <ul className="space-y-1 text-slate-600">
                {event.attendeeEmails.map(email => <li key={email}>{email}</li>)}
              </ul>
            ) : (
              <p className="text-slate-400">אין משתתפים רשומים</p>
            )}
          </section>

          {(event.meetingUrl || event.htmlLink) && (
            <div className="flex flex-wrap gap-2">
              {event.meetingUrl && (
                <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700">
                  <Video className="h-4 w-4" />
                  פתיחת פגישה
                </a>
              )}
              {event.htmlLink && (
                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                  <ExternalLink className="h-4 w-4" />
                  פתיחה ב-Google Calendar
                </a>
              )}
            </div>
          )}

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {event.interview ? (
              <div>
                <h3 className="font-bold text-slate-800">קישור ל-CRM</h3>
                <p className="mt-1 text-slate-600">
                  {event.interview.interviewTitle || event.title}
                  {event.interview.candidateName ? ` · ${event.interview.candidateName}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/dashboard/interviews/${event.interview.interviewId}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white hover:bg-slate-800">
                    <BriefcaseBusiness className="h-4 w-4" />
                    צפייה בראיון
                  </Link>
                  <Link href={`/dashboard/candidates/${event.interview.candidateId}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100">
                    <UserRound className="h-4 w-4" />
                    צפייה במועמד
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">אין ראיון מקושר ב-CRM</p>
            )}
          </section>
        </div>

        <div className="mt-6 flex justify-start">
          <Button type="button" variant="outline" onClick={onClose}>סגור</Button>
        </div>
      </div>
    </div>
  )
}

function YearView({
  anchor,
  eventsByDate,
  todayKey,
  onSelectMonth,
}: {
  anchor: Date
  eventsByDate: Map<string, CalendarEvent[]>
  todayKey: string
  onSelectMonth: (month: Date) => void
}) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {yearMonths(anchor).map(month => {
        const days = monthGrid(month).filter(day => day.getMonth() === month.getMonth())
        const count = days.reduce((sum, day) => sum + (eventsByDate.get(dateKey(day))?.length || 0), 0)
        return (
          <button
            key={month.getMonth()}
            type="button"
            onClick={() => onSelectMonth(month)}
            className="rounded-2xl border border-slate-100 bg-white p-3 text-right hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-black text-slate-800">{month.toLocaleDateString("he-IL", { month: "long" })}</span>
              <span className="text-[11px] font-bold text-slate-400">{count} אירועים</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const key = dateKey(day)
                const busy = (eventsByDate.get(key)?.length || 0) > 0
                return (
                  <span
                    key={key}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                      key === todayKey ? "bg-blue-600 font-bold text-white" : busy ? "bg-blue-100 font-semibold text-blue-700" : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                )
              })}
            </div>
          </button>
        )
      })}
    </div>
  )
}