import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  candidateFindMany: vi.fn(),
  listEvents: vi.fn(),
  createEvent: vi.fn(),
}))

vi.mock("next-auth", () => ({ getServerSession: mocks.session }))
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, findMany: mocks.userFindMany },
    candidate: { findMany: mocks.candidateFindMany },
  },
}))
vi.mock("@/lib/google-calendar", () => ({
  listCalendarEvents: mocks.listEvents,
  createAllDayCalendarEvent: mocks.createEvent,
}))

import { POST } from "@/app/api/calendar/sync-today/route"

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-09-14T12:00:00.000Z"))
  mocks.session.mockResolvedValue({ user: { email: "office@hr22group.com" } })
  mocks.userFindUnique.mockResolvedValue({ email: "office@hr22group.com", role: "ADMIN" })
  mocks.userFindMany.mockResolvedValue([{
    googleCalendarEmail: "22geder@gmail.com",
    googleCalendarRefreshToken: "private-token",
  }])
  mocks.candidateFindMany.mockResolvedValue([
    {
      id: "candidate-process",
      name: "מועמד בתהליך",
      employmentStatus: "IN_PROCESS",
      inProcessAt: new Date("2026-09-14T08:00:00.000Z"),
      hiredAt: null,
      inProcessPosition: { title: "נציג/ה", employer: { name: "חברה" } },
      hiredToEmployer: null,
      applications: [],
    },
    {
      id: "candidate-hired",
      name: "מועמד שהתקבל",
      employmentStatus: "EMPLOYED",
      inProcessAt: null,
      hiredAt: new Date("2026-09-14T09:00:00.000Z"),
      inProcessPosition: null,
      hiredToEmployer: { name: "מעסיק" },
      applications: [{ position: { title: "מנהל/ת", employer: { name: "מעסיק" } } }],
    },
  ])
  mocks.listEvents.mockResolvedValue([{
    id: "existing",
    title: "התקבל/ה: מועמד שהתקבל",
    start: "2026-09-14",
    end: "2026-09-15",
    allDay: true,
  }])
  mocks.createEvent.mockResolvedValue("created-event")
})

describe("POST /api/calendar/sync-today", () => {
  it("rejects unauthenticated and non-admin users", async () => {
    mocks.session.mockResolvedValueOnce(null)
    expect((await POST()).status).toBe(401)

    mocks.userFindUnique.mockResolvedValueOnce({ email: "recruiter@example.test", role: "RECRUITER" })
    expect((await POST()).status).toBe(403)
    expect(mocks.candidateFindMany).not.toHaveBeenCalled()
  })

  it("creates only missing events and reports the daily totals", async () => {
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.createEvent).toHaveBeenCalledExactlyOnceWith(
      "private-token",
      expect.objectContaining({
        title: "בתהליך: מועמד בתהליך",
        attendeeEmails: ["office@hr22group.com"],
      })
    )
    expect(body).toEqual(expect.objectContaining({
      success: true,
      date: "2026-09-14",
      candidates: { inProcess: 1, hired: 1 },
      created: 1,
      skipped: 1,
      failed: 0,
    }))
    expect(JSON.stringify(body)).not.toContain("private-token")
  })
})