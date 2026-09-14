"use client"

import { useEffect, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  calendarEmails: string[]
}

const weekDays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function eventDateKey(event: CalendarEvent): string {
  if (event.allDay) return event.start.slice(0, 10)
  return dateKey(new Date(event.start))
}

function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function TeamCalendarView() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [connectedCalendars, setConnectedCalendars] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const days = monthGrid(month)

  useEffect(() => {
    const controller = new AbortController()
    const loadEvents = async () => {
      setLoading(true)
      setError(false)
      try {
        const from = days[0].toISOString()
        const toDate = new Date(days[days.length - 1])
        toDate.setDate(toDate.getDate() + 1)
        const response = await fetch(`/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(toDate.toISOString())}`, {
          signal: controller.signal,
        })
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
  }, [month])

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const key = eventDateKey(event)
    eventsByDate.set(key, [...(eventsByDate.get(key) || []), event])
  }

  const moveMonth = (offset: number) => {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden" aria-label="יומן Google">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            היומן שלנו
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {connectedCalendars.length > 0
              ? connectedCalendars.join(" · ")
              : "לא נמצא יומן מחובר"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => moveMonth(1)} title="החודש הבא">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-36 text-center font-semibold text-slate-700">
            {month.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}
          </div>
          <Button variant="outline" size="icon" onClick={() => moveMonth(-1)} title="החודש הקודם">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            היום
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDays.map(day => <div key={day} className="p-2 text-center text-xs font-bold text-slate-500">{day}</div>)}
          </div>
          <div className="relative grid grid-cols-7">
            {days.map(day => {
              const key = dateKey(day)
              const dayEvents = eventsByDate.get(key) || []
              const isCurrentMonth = day.getMonth() === month.getMonth()
              const isToday = key === dateKey(new Date())
              return (
                <div key={key} className={`min-h-28 border-b border-l border-slate-100 p-1.5 ${isCurrentMonth ? "bg-white" : "bg-slate-50/70"}`}>
                  <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-blue-600 font-bold text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div key={`${event.id}-${event.start}`} title={`${event.title} (${event.calendarEmails.join(", ")})`} className="truncate rounded bg-emerald-100 px-1.5 py-1 text-[11px] font-medium text-emerald-800">
                        {event.allDay ? "" : `${new Date(event.start).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} `}{event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="px-1 text-[10px] text-slate-500">+{dayEvents.length - 3} נוספים</div>}
                  </div>
                </div>
              )
            })}
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}
          </div>
        </div>
      </div>
      {error && <div className="border-t border-red-100 bg-red-50 p-3 text-sm text-red-700">לא ניתן לטעון את היומן כרגע.</div>}
    </section>
  )
}