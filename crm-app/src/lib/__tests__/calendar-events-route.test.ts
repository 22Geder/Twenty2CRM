import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  listEvents: vi.fn(),
}))

vi.mock("next-auth", () => ({ getServerSession: mocks.session }))
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique, findMany: mocks.findMany } },
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
  mocks.findUnique.mockResolvedValue({
    email: "office@hr22group.com",
    role: "ADMIN",
    googleCalendarEmail: "office@hr22group.com",
    googleCalendarRefreshToken: "private-current-token",
  })
  mocks.findMany.mockResolvedValue([
    { googleCalendarEmail: "office@hr22group.com", googleCalendarRefreshToken: "private-office-token" },
    { googleCalendarEmail: "22geder@gmail.com", googleCalendarRefreshToken: "private-geder-token" },
  ])
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
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("rejects invalid or oversized date ranges", async () => {
    expect((await request("invalid", "2026-10-01T00:00:00.000Z")).status).toBe(400)
    expect((await request("2025-01-01T00:00:00.000Z", "2026-10-01T00:00:00.000Z")).status).toBe(400)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("merges matching events from both admin calendars without exposing tokens", async () => {
    const response = await request()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.listEvents).toHaveBeenCalledTimes(2)
    expect(body.events).toEqual([expect.objectContaining({
      title: "התקבל/ה: ישראל ישראלי",
      calendarEmails: ["office@hr22group.com", "22geder@gmail.com"],
    })])
    expect(JSON.stringify(body)).not.toContain("private-")
  })

  it("shows a non-admin only their own connected calendar", async () => {
    mocks.session.mockResolvedValue({ user: { email: "recruiter@example.test" } })
    mocks.findUnique.mockResolvedValue({
      email: "recruiter@example.test",
      role: "RECRUITER",
      googleCalendarEmail: "recruiter@gmail.test",
      googleCalendarRefreshToken: "private-recruiter-token",
    })

    const response = await request()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.findMany).not.toHaveBeenCalled()
    expect(body.connectedCalendars).toEqual(["recruiter@gmail.test"])
    expect(JSON.stringify(body)).not.toContain("private-recruiter-token")
  })
})