import { syncTaggedAllDayCalendarEvent } from "@/lib/google-calendar"
import { prisma } from "@/lib/prisma"

export const TEAM_CALENDAR_EMAILS = [
  "office@hr22group.com",
  "22geder@gmail.com",
] as const

export type CandidateCalendarStatus = "IN_PROCESS" | "EMPLOYED" | "REJECTED"

const STATUS_EVENT_META: Record<CandidateCalendarStatus, { label: string; colorId: string }> = {
  IN_PROCESS: { label: "בתהליך", colorId: "9" },
  EMPLOYED: { label: "התקבל/ה", colorId: "10" },
  REJECTED: { label: "לא התקבל/ה", colorId: "11" },
}

type CandidateStatusCalendarInput = {
  candidateId: string
  candidateName: string
  status: CandidateCalendarStatus
  statusDate: Date
  positionTitle?: string | null
  employerName?: string | null
  notifyPartner?: boolean
}

export async function syncCandidateStatusToTeamCalendars(
  input: CandidateStatusCalendarInput
): Promise<void> {
  const connectedUsers = await prisma.user.findMany({
    where: {
      googleCalendarEmail: { in: [...TEAM_CALENDAR_EMAILS] },
      googleCalendarRefreshToken: { not: null },
    },
    select: {
      googleCalendarEmail: true,
      googleCalendarRefreshToken: true,
    },
  })

  const calendars = [...new Map(connectedUsers.flatMap(user =>
    user.googleCalendarEmail && user.googleCalendarRefreshToken
      ? [[user.googleCalendarEmail.toLowerCase(), user.googleCalendarRefreshToken] as const]
      : []
  )).entries()].map(([email, refreshToken]) => ({ email, refreshToken }))
  if (calendars.length === 0) return

  const details = [
    input.positionTitle && `משרה: ${input.positionTitle}`,
    input.employerName && `מעסיק: ${input.employerName}`,
    process.env.NEXTAUTH_URL && `${process.env.NEXTAUTH_URL}/dashboard/candidates/${input.candidateId}`,
  ].filter(Boolean).join("\n")
  const meta = STATUS_EVENT_META[input.status]

  const results = await Promise.allSettled(calendars.map(calendar =>
    syncTaggedAllDayCalendarEvent(
      calendar.refreshToken,
      `candidate-in-process-${input.candidateId}`,
      {
        title: `${meta.label}: ${input.candidateName}`,
        description: details || undefined,
        date: input.statusDate,
        colorId: meta.colorId,
        attendeeEmails: input.notifyPartner !== false && calendars.length === 1
          ? TEAM_CALENDAR_EMAILS.filter(email => email !== calendar.email)
          : undefined,
        organizerEmail: calendar.email,
      }
    )
  ))

  const failures = results.filter(result => result.status === "rejected")
  if (failures.length > 0) {
    throw new Error(`Failed to sync ${failures.length} candidate status calendar event(s)`)
  }
}