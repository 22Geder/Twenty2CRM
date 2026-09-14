import { prisma } from "@/lib/prisma"

export type CalendarEventCrmLink = {
  interviewId: string
  candidateId: string
  candidateName?: string
  interviewTitle?: string
}

export type CalendarEventInterviewRow = {
  id: string
  title: string
  googleCalendarEventId: string | null
  candidateId: string
  candidate: {
    id: string
    name: string
  }
}

export function mapInterviewsByGoogleEventId(
  interviews: CalendarEventInterviewRow[],
): Map<string, CalendarEventCrmLink> {
  const links = new Map<string, CalendarEventCrmLink>()

  for (const interview of interviews) {
    if (!interview.googleCalendarEventId || links.has(interview.googleCalendarEventId)) continue
    links.set(interview.googleCalendarEventId, {
      interviewId: interview.id,
      candidateId: interview.candidateId,
      candidateName: interview.candidate.name || undefined,
      interviewTitle: interview.title || undefined,
    })
  }

  return links
}

export async function getCalendarEventCrmLinks(
  googleEventIds: string[],
): Promise<Map<string, CalendarEventCrmLink>> {
  const eventIds = [...new Set(googleEventIds.filter(Boolean))]
  if (eventIds.length === 0) return new Map()

  const interviews = await prisma.interview.findMany({
    where: { googleCalendarEventId: { in: eventIds } },
    select: {
      id: true,
      title: true,
      googleCalendarEventId: true,
      candidateId: true,
      candidate: { select: { id: true, name: true } },
    },
  })

  return mapInterviewsByGoogleEventId(interviews)
}