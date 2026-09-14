import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getCalendarEventCrmLinks } from "@/lib/calendar-event-crm-link"
import { CalendarListEvent, listCalendarEvents } from "@/lib/google-calendar"
import { HIRING_CALENDAR_EMAILS } from "@/lib/hired-candidate-calendar"
import { canSeeAllRecruiters } from "@/lib/recruiter-stats"
import { prisma } from "@/lib/prisma"

const MAX_RANGE_MS = 370 * 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const from = new Date(request.nextUrl.searchParams.get("from") || "")
    const to = new Date(request.nextUrl.searchParams.get("to") || "")
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) ||
        to <= from || to.getTime() - from.getTime() > MAX_RANGE_MS) {
      return NextResponse.json({ error: "Invalid calendar range" }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        role: true,
        googleCalendarEmail: true,
        googleCalendarRefreshToken: true,
      },
    })
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const calendarUsers = canSeeAllRecruiters(currentUser)
      ? await prisma.user.findMany({
          where: {
            googleCalendarEmail: { in: [...HIRING_CALENDAR_EMAILS] },
            googleCalendarRefreshToken: { not: null },
          },
          select: { googleCalendarEmail: true, googleCalendarRefreshToken: true },
        })
      : [currentUser]

    const calendars = calendarUsers.filter(user =>
      user.googleCalendarEmail && user.googleCalendarRefreshToken
    )
    const results = await Promise.allSettled(calendars.map(async user => ({
      email: user.googleCalendarEmail!,
      events: await listCalendarEvents(user.googleCalendarRefreshToken!, from, to),
    })))

    const merged = new Map<string, CalendarListEvent & {
      calendarEmails: string[]
    }>()

    for (const result of results) {
      if (result.status !== "fulfilled") continue
      for (const event of result.value.events) {
        const key = `${event.title}|${event.start}|${event.end}`
        const existing = merged.get(key)
        if (existing) {
          existing.calendarEmails.push(result.value.email)
        } else {
          merged.set(key, { ...event, calendarEmails: [result.value.email] })
        }
      }
    }

    const mergedEvents = [...merged.values()]
    const interviewLinks = await getCalendarEventCrmLinks(mergedEvents.map(event => event.id))

    return NextResponse.json({
      events: mergedEvents.map(event => ({
        ...event,
        interview: interviewLinks.get(event.id) || null,
      })),
      connectedCalendars: calendars.map(user => user.googleCalendarEmail),
    })
  } catch (error) {
    console.error("Calendar events error:", error)
    return NextResponse.json({ error: "Failed to load calendar events" }, { status: 500 })
  }
}