import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  createAllDayCalendarEvent,
  listCalendarEvents,
} from "@/lib/google-calendar"
import { HIRING_CALENDAR_EMAILS } from "@/lib/hired-candidate-calendar"
import { prisma } from "@/lib/prisma"
import { canSeeAllRecruiters } from "@/lib/recruiter-stats"

const ISRAEL_TIME_ZONE = "Asia/Jerusalem"

function israelDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function dateAtIsraelMidnight(date: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12))
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(noonUtc)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  )
  const offsetMs = representedAsUtc - noonUtc.getTime()
  return new Date(Date.UTC(year, month - 1, day) - offsetMs)
}

function todayInIsrael(now = new Date()): { date: string; start: Date; end: Date } {
  const date = israelDate(now)
  const [year, month, day] = date.split("-").map(Number)
  const nextDate = israelDate(new Date(Date.UTC(year, month - 1, day + 1, 12)))
  return {
    date,
    start: dateAtIsraelMidnight(date),
    end: dateAtIsraelMidnight(nextDate),
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { email: true, role: true },
    })
    if (!currentUser || !canSeeAllRecruiters(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const today = todayInIsrael()
    const [calendarUsers, candidates] = await Promise.all([
      prisma.user.findMany({
        where: {
          googleCalendarEmail: { in: [...HIRING_CALENDAR_EMAILS] },
          googleCalendarRefreshToken: { not: null },
        },
        select: {
          googleCalendarEmail: true,
          googleCalendarRefreshToken: true,
        },
      }),
      prisma.candidate.findMany({
        where: {
          OR: [
            {
              employmentStatus: "IN_PROCESS",
              inProcessAt: { gte: today.start, lt: today.end },
            },
            { hiredAt: { gte: today.start, lt: today.end } },
          ],
        },
        select: {
          id: true,
          name: true,
          employmentStatus: true,
          inProcessAt: true,
          hiredAt: true,
          inProcessPosition: {
            select: {
              title: true,
              employer: { select: { name: true } },
            },
          },
          hiredToEmployer: { select: { name: true } },
          applications: {
            where: { status: { in: ["HIRED", "ACCEPTED"] } },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              position: {
                select: {
                  title: true,
                  employer: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
    ])

    const calendars = calendarUsers.flatMap(user =>
      user.googleCalendarEmail && user.googleCalendarRefreshToken
        ? [{
            email: user.googleCalendarEmail.toLowerCase(),
            refreshToken: user.googleCalendarRefreshToken,
          }]
        : []
    )
    if (calendars.length === 0) {
      return NextResponse.json({ error: "No connected team calendar" }, { status: 409 })
    }

    const entries = candidates.flatMap(candidate => {
      const isHiredToday = candidate.hiredAt &&
        candidate.hiredAt >= today.start && candidate.hiredAt < today.end
      const status = isHiredToday ? "hired" : "in-process"
      const position = isHiredToday
        ? candidate.applications[0]?.position
        : candidate.inProcessPosition
      const employerName = isHiredToday
        ? candidate.hiredToEmployer?.name || position?.employer?.name
        : position?.employer?.name

      return [{
        title: `${status === "hired" ? "התקבל/ה" : "בתהליך"}: ${candidate.name}`,
        date: isHiredToday ? candidate.hiredAt! : candidate.inProcessAt!,
        description: [
          position?.title && `משרה: ${position.title}`,
          employerName && `מעסיק: ${employerName}`,
          process.env.NEXTAUTH_URL && `${process.env.NEXTAUTH_URL}/dashboard/candidates/${candidate.id}`,
        ].filter(Boolean).join("\n"),
        status,
      }]
    })

    let created = 0
    let skipped = 0
    let failed = 0

    await Promise.all(calendars.map(async calendar => {
      const existing = await listCalendarEvents(calendar.refreshToken, today.start, today.end)
      const existingTitles = new Set(existing.map(event => event.title))

      for (const entry of entries) {
        if (existingTitles.has(entry.title)) {
          skipped++
          continue
        }

        try {
          await createAllDayCalendarEvent(calendar.refreshToken, {
            title: entry.title,
            description: entry.description || undefined,
            date: entry.date,
            attendeeEmails: calendars.length === 1
              ? HIRING_CALENDAR_EMAILS.filter(email => email !== calendar.email)
              : undefined,
          })
          existingTitles.add(entry.title)
          created++
        } catch (error) {
          failed++
          console.error("Calendar daily sync item failed:", error)
        }
      }
    }))

    return NextResponse.json({
      success: failed === 0,
      date: today.date,
      candidates: {
        inProcess: entries.filter(entry => entry.status === "in-process").length,
        hired: entries.filter(entry => entry.status === "hired").length,
      },
      calendars: calendars.length,
      created,
      skipped,
      failed,
    }, { status: failed === 0 ? 200 : 207 })
  } catch (error) {
    console.error("Calendar daily sync failed:", error)
    return NextResponse.json({ error: "Failed to sync today's calendar" }, { status: 500 })
  }
}