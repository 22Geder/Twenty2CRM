import { createAllDayCalendarEvent } from "@/lib/google-calendar"
import { prisma } from "@/lib/prisma"

export const HIRING_CALENDAR_EMAILS = [
  "office@hr22group.com",
  "22geder@gmail.com",
] as const

type HiredCandidateCalendarInput = {
  candidateId: string
  candidateName: string
  hiredAt: Date
  positionTitle?: string | null
  employerName?: string | null
}

export async function addHiredCandidateToTeamCalendars(
  input: HiredCandidateCalendarInput
): Promise<void> {
  try {
    const connectedUsers = await prisma.user.findMany({
      where: {
        googleCalendarEmail: { in: [...HIRING_CALENDAR_EMAILS] },
        googleCalendarRefreshToken: { not: null },
      },
      select: {
        googleCalendarEmail: true,
        googleCalendarRefreshToken: true,
      },
    })

    const calendars = new Map(
      connectedUsers
        .filter(user => user.googleCalendarEmail && user.googleCalendarRefreshToken)
        .map(user => [user.googleCalendarEmail!.toLowerCase(), user.googleCalendarRefreshToken!])
    )

    if (calendars.size === 0) return

    const details = [
      input.positionTitle && `משרה: ${input.positionTitle}`,
      input.employerName && `מעסיק: ${input.employerName}`,
      process.env.NEXTAUTH_URL && `${process.env.NEXTAUTH_URL}/dashboard/candidates/${input.candidateId}`,
    ].filter(Boolean).join("\n")

    await Promise.allSettled(
      [...calendars.entries()].map(([calendarEmail, refreshToken]) =>
        createAllDayCalendarEvent(refreshToken, {
          title: `התקבל/ה: ${input.candidateName}`,
          description: details || undefined,
          date: input.hiredAt,
          attendeeEmails: calendars.size === 1
            ? HIRING_CALENDAR_EMAILS.filter(email => email !== calendarEmail)
            : undefined,
        })
      )
    )
  } catch (error) {
    console.error("Failed to add hired candidate to team calendars:", error)
  }
}