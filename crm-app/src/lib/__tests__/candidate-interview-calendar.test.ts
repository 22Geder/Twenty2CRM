import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  syncEvent: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: mocks.findMany } },
}))
vi.mock("@/lib/google-calendar", () => ({
  syncTaggedCalendarEvent: mocks.syncEvent,
}))

import { syncCandidateInterviewToTeamCalendars } from "@/lib/candidate-interview-calendar"

beforeEach(() => {
  vi.resetAllMocks()
  mocks.syncEvent.mockResolvedValue(undefined)
  mocks.findMany.mockResolvedValue([{
    googleCalendarEmail: "22geder@gmail.com",
    googleCalendarRefreshToken: "private-token",
  }])
})

describe("syncCandidateInterviewToTeamCalendars", () => {
  it("syncs a timed interview and invites the missing team calendar", async () => {
    const interviewDate = new Date("2026-09-15T07:30:00.000Z")

    await syncCandidateInterviewToTeamCalendars({
      candidateId: "candidate-1",
      candidateName: "ישראל ישראלי",
      interviewDate,
      positionTitle: "מנהל/ת סניף",
      employerName: "חברה",
    })

    expect(mocks.syncEvent).toHaveBeenCalledExactlyOnceWith(
      "private-token",
      "candidate-interview-candidate-1",
      expect.objectContaining({
        title: "ראיון עבודה: ישראל ישראלי",
        startTime: interviewDate,
        durationMinutes: 60,
        attendeeEmails: ["office@hr22group.com"],
      })
    )
  })

  it("removes the tagged event when the interview is cleared", async () => {
    await syncCandidateInterviewToTeamCalendars({
      candidateId: "candidate-1",
      candidateName: "ישראל ישראלי",
      interviewDate: null,
    })

    expect(mocks.syncEvent).toHaveBeenCalledExactlyOnceWith(
      "private-token",
      "candidate-interview-candidate-1",
      null
    )
  })
})