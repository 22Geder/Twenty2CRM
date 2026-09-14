import { syncTaggedCalendarEvent } from "@/lib/google-calendar"
import { HIRING_CALENDAR_EMAILS } from "@/lib/hired-candidate-calendar"
import { prisma } from "@/lib/prisma"

type CandidateInterviewCalendarInput = {
  candidateId: string
  candidateName: string
  interviewDate: Date | null
  positionTitle?: string | null
  employerName?: string | null
}

export async function syncCandidateInterviewToTeamCalendars(
  input: CandidateInterviewCalendarInput
): Promise<void> {
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

  const calendars = connectedUsers.flatMap(user =>
    user.googleCalendarEmail && user.googleCalendarRefreshToken
      ? [{
          email: user.googleCalendarEmail.toLowerCase(),
          refreshToken: user.googleCalendarRefreshToken,
        }]
      : []
  )
  if (calendars.length === 0) return

  const description = [
    input.positionTitle && `משרה: ${input.positionTitle}`,
    input.employerName && `מעסיק: ${input.employerName}`,
    process.env.NEXTAUTH_URL && `${process.env.NEXTAUTH_URL}/dashboard/candidates/${input.candidateId}`,
  ].filter(Boolean).join("\n")

  const results = await Promise.allSettled(calendars.map(calendar =>
    syncTaggedCalendarEvent(
      calendar.refreshToken,
      `candidate-interview-${input.candidateId}`,
      input.interviewDate
        ? {
            title: `ראיון עבודה: ${input.candidateName}`,
            description: description || undefined,
            startTime: input.interviewDate,
            durationMinutes: 60,
            attendeeEmails: calendars.length === 1
              ? HIRING_CALENDAR_EMAILS.filter(email => email !== calendar.email)
              : [],
            organizerEmail: calendar.email,
          }
        : null
    )
  ))

  const failures = results.filter(result => result.status === "rejected")
  if (failures.length > 0) {
    throw new Error(`Failed to sync ${failures.length} candidate interview calendar event(s)`)
  }
}