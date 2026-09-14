import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  interviewFindMany: vi.fn(),
  listEvents: vi.fn(),
}))

vi.mock("next-auth", () => ({ getServerSession: mocks.session }))
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, findMany: mocks.userFindMany },
    interview: { findMany: mocks.interviewFindMany },
  },
}))
vi.mock("@/lib/google-calendar", () => ({
  listCalendarEvents: mocks.listEvents,
  createAllDayCalendarEvent: vi.fn(),
}))

import { GET } from "@/app/api/calendar/events/route"

function request(from = "2026-09-01T00:00:00.000Z", to = "2026-10-01T00:00:00.000Z") {
  return GET(new NextRequest(`https://crm.example.test/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`))
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.mockResolvedValue({ user: { email: "office@hr22group.com" } })
  mocks.userFindUnique.mockResolvedValue({
    email: "office@hr22group.com",
    role: "ADMIN",
    googleCalendarEmail: "office@hr22group.com",
    googleCalendarRefreshToken: "private-current-token",
  })
  mocks.userFindMany.mockResolvedValue([
    { googleCalendarEmail: "office@hr22group.com", googleCalendarRefreshToken: "private-office-token" },
    { googleCalendarEmail: "22geder@gmail.com", googleCalendarRefreshToken: "private-geder-token" },
  ])
  mocks.interviewFindMany.mockResolvedValue([])
  mocks.listEvents.mockResolvedValue([{
    id: "event-1",
    title: "התקבל/ה: ישראל ישראלי",
    start: "2026-09-14",
    end: "2026-09-15",
    allDay: true,
  }])
})

describe("GET /api/calendar/events", () => {
  it("rejects unauthenticated requests before database access", async () => {
    mocks.session.mockResolvedValue(null)

    const response = await request()

    expect(response.status).toBe(401)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it("rejects invalid or oversized date ranges", async () => {
    expect((await request("invalid", "2026-10-01T00:00:00.000Z")).status).toBe(400)
    expect((await request("2025-01-01T00:00:00.000Z", "2026-10-01T00:00:00.000Z")).status).toBe(400)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it("merges matching events with a null interview without exposing tokens", async () => {
    const response = await request()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.listEvents).toHaveBeenCalledTimes(2)
    expect(body.events).toEqual([expect.objectContaining({
      title: "התקבל/ה: ישראל ישראלי",
      calendarEmails: ["office@hr22group.com", "22geder@gmail.com"],
      interview: null,
    })])
    expect(mocks.interviewFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { googleCalendarEventId: { in: ["event-1"] } },
    }))
    expect(JSON.stringify(body)).not.toContain("private-")
  })

  it("attaches a matching CRM interview and candidate link", async () => {
    mocks.interviewFindMany.mockResolvedValue([{
      id: "interview-1",
      title: "ראיון מקצועי",
      googleCalendarEventId: "event-1",
      candidateId: "candidate-1",
      candidate: { id: "candidate-1", name: "ישראל ישראלי" },
    }])

    const response = await request()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.events[0].interview).toEqual({
      interviewId: "interview-1",
      candidateId: "candidate-1",
      candidateName: "ישראל ישראלי",
      interviewTitle: "ראיון מקצועי",
    })
    expect(JSON.stringify(body)).not.toContain("private-")
  })

  it("shows a non-admin only their own connected calendar", async () => {
    mocks.session.mockResolvedValue({ user: { email: "recruiter@example.test" } })
    mocks.userFindUnique.mockResolvedValue({
      email: "recruiter@example.test",
      role: "RECRUITER",
      googleCalendarEmail: "recruiter@gmail.test",
      googleCalendarRefreshToken: "private-recruiter-token",
    })

    const response = await request()
    const body = await response.json()

    expect(response.status).toBe(200)
  expect(mocks.userFindMany).not.toHaveBeenCalled()
    expect(body.connectedCalendars).toEqual(["recruiter@gmail.test"])
    expect(JSON.stringify(body)).not.toContain("private-recruiter-token")
  })
})