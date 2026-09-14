import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createEvent: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: mocks.findMany } },
}))
vi.mock("@/lib/google-calendar", () => ({
  createAllDayCalendarEvent: mocks.createEvent,
}))

import { addHiredCandidateToTeamCalendars } from "@/lib/hired-candidate-calendar"

const hiredCandidate = {
  candidateId: "candidate-1",
  candidateName: "ישראל ישראלי",
  hiredAt: new Date("2026-09-14T08:00:00.000Z"),
  positionTitle: "מנהל/ת סניף",
  employerName: "חברה לדוגמה",
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.createEvent.mockResolvedValue("event-1")
})

describe("addHiredCandidateToTeamCalendars", () => {
  it("creates one event in each connected team calendar without duplicate invitations", async () => {
    mocks.findMany.mockResolvedValue([
      { googleCalendarEmail: "office@hr22group.com", googleCalendarRefreshToken: "office-token" },
      { googleCalendarEmail: "22geder@gmail.com", googleCalendarRefreshToken: "geder-token" },
    ])

    await addHiredCandidateToTeamCalendars(hiredCandidate)

    expect(mocks.createEvent).toHaveBeenCalledTimes(2)
    expect(mocks.createEvent).toHaveBeenCalledWith("office-token", expect.objectContaining({
      title: "התקבל/ה: ישראל ישראלי",
      date: hiredCandidate.hiredAt,
      attendeeEmails: undefined,
    }))
    expect(mocks.createEvent).toHaveBeenCalledWith("geder-token", expect.objectContaining({
      attendeeEmails: undefined,
    }))
  })

  it("invites the missing team calendar when only one account is connected", async () => {
    mocks.findMany.mockResolvedValue([
      { googleCalendarEmail: "office@hr22group.com", googleCalendarRefreshToken: "office-token" },
    ])

    await addHiredCandidateToTeamCalendars(hiredCandidate)

    expect(mocks.createEvent).toHaveBeenCalledExactlyOnceWith("office-token", expect.objectContaining({
      attendeeEmails: ["22geder@gmail.com"],
    }))
  })

  it("does nothing when neither team calendar is connected", async () => {
    mocks.findMany.mockResolvedValue([])

    await addHiredCandidateToTeamCalendars(hiredCandidate)

    expect(mocks.createEvent).not.toHaveBeenCalled()
  })
})