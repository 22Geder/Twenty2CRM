import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const model = () => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  })
  return {
    prisma: {
      facebookModuleSettings: model(),
      facebookAccount: model(),
      facebookSchedule: model(),
      facebookPublishLog: model(),
      facebookPost: model(),
      facebookGroup: model(),
      user: model(),
      notification: model(),
    },
    decryptFacebookSession: vi.fn(() => "{}"),
    launchFacebookBrowser: vi.fn(),
    createFacebookContext: vi.fn(),
    publishPostToGroup: vi.fn(),
    randomDelayMs: vi.fn(() => 0),
    sleep: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/facebook-session-crypto", () => ({ decryptFacebookSession: mocks.decryptFacebookSession }))
vi.mock("@/lib/facebook-playwright", () => ({
  launchFacebookBrowser: mocks.launchFacebookBrowser,
  createFacebookContext: mocks.createFacebookContext,
  publishPostToGroup: mocks.publishPostToGroup,
  randomDelayMs: mocks.randomDelayMs,
  sleep: mocks.sleep,
}))

import { GET } from "@/app/api/cron/facebook-publish/route"

function makeRequest(secretHeader?: string) {
  return new NextRequest("http://localhost/api/cron/facebook-publish", {
    headers: secretHeader !== undefined ? { "X-Cron-Secret": secretHeader } : {},
  })
}

const settings = { active: true, dailyPublishLimit: 45, delayMinSeconds: 45, delayMaxSeconds: 180, maxGroupsPerRun: 15, maxRunDurationMinutes: 20 }
const connectedAccount = {
  id: "acc-1", status: "CONNECTED", encryptedSession: "v1.a.b.c", isPublishing: false, publishingLockedAt: null,
  publishesToday: 0, publishCounterDate: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = "test-cron-secret"
  mocks.sleep.mockResolvedValue(undefined)
  mocks.randomDelayMs.mockReturnValue(0)
})

afterEach(() => {
  delete process.env.CRON_SECRET
})

describe("GET /api/cron/facebook-publish", () => {
  it("401 כאשר X-Cron-Secret חסר/שגוי ו-CRON_SECRET מוגדר", async () => {
    const response = await GET(makeRequest("wrong-secret"))
    expect(response.status).toBe(401)
  })

  it("MODULE_DISABLED - מדלג אם settings.active=false", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce({ ...settings, active: false })
    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()
    expect(body.skipped).toBe(true)
    expect(body.reason).toBe("MODULE_DISABLED")
  })

  it("NOT_CONNECTED - מדלג אם אין חשבון מחובר", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce(settings)
    mocks.prisma.facebookAccount.findFirst.mockResolvedValueOnce(null)
    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()
    expect(body.reason).toBe("NOT_CONNECTED")
  })

  it("ALREADY_RUNNING - מדלג אם isPublishing=true ועדיין בתוך חלון הזמן", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce(settings)
    mocks.prisma.facebookAccount.findFirst.mockResolvedValueOnce({ ...connectedAccount, isPublishing: true, publishingLockedAt: new Date() })
    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()
    expect(body.reason).toBe("ALREADY_RUNNING")
  })

  it("DAILY_LIMIT_REACHED - מדלג אם publishesToday >= dailyPublishLimit", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce(settings)
    mocks.prisma.facebookAccount.findFirst.mockResolvedValueOnce({ ...connectedAccount, publishesToday: 45 })
    mocks.prisma.facebookAccount.update.mockResolvedValueOnce({})
    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()
    expect(body.reason).toBe("DAILY_LIMIT_REACHED")
  })

  it("NO_SCHEDULE_DUE - מדלג אם אין schedule שממתין", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce(settings)
    mocks.prisma.facebookAccount.findFirst.mockResolvedValueOnce(connectedAccount)
    mocks.prisma.facebookSchedule.findFirst.mockResolvedValueOnce(null)
    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()
    expect(body.reason).toBe("NO_SCHEDULE_DUE")
  })

  it("מצליח לפרסם לקבוצה אחת, מעדכן מכסה ומסמן ONCE כ-COMPLETED", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce(settings)
    mocks.prisma.facebookAccount.findFirst.mockResolvedValueOnce(connectedAccount)
    mocks.prisma.facebookSchedule.findFirst.mockResolvedValueOnce({
      id: "sched-1", postId: "post-1", groupIds: JSON.stringify(["group-1"]), type: "ONCE",
      recurrenceRule: null,
      post: { id: "post-1", originalContent: "תוכן מקורי", enhancedContent: null, useEnhanced: false, mediaUrls: null },
    })
    mocks.prisma.facebookAccount.update.mockResolvedValue({})
    mocks.prisma.facebookSchedule.update.mockResolvedValue({})
    mocks.prisma.facebookPublishLog.findMany.mockResolvedValueOnce([])
    mocks.prisma.facebookGroup.findMany.mockResolvedValueOnce([{ id: "group-1", url: "https://www.facebook.com/groups/group-1/" }])
    mocks.prisma.facebookPublishLog.create.mockResolvedValue({})
    mocks.prisma.facebookPublishLog.updateMany.mockResolvedValue({})
    mocks.prisma.facebookPost.update.mockResolvedValue({})

    const context = {}
    mocks.launchFacebookBrowser.mockResolvedValueOnce({ close: vi.fn().mockResolvedValue(undefined) })
    mocks.createFacebookContext.mockResolvedValueOnce(context)
    mocks.publishPostToGroup.mockResolvedValueOnce({ success: true })

    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()

    expect(body.successCount).toBe(1)
    expect(body.allDone).toBe(true)
    expect(mocks.prisma.facebookSchedule.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) })
    )
  })

  it("עוצר מיידית ומשבית הכל כאשר מתגלה סימן חסימה", async () => {
    mocks.prisma.facebookModuleSettings.findFirst.mockResolvedValueOnce(settings)
    mocks.prisma.facebookAccount.findFirst.mockResolvedValueOnce(connectedAccount)
    mocks.prisma.facebookSchedule.findFirst.mockResolvedValueOnce({
      id: "sched-2", postId: "post-2", groupIds: JSON.stringify(["group-1", "group-2"]), type: "ONCE",
      recurrenceRule: null,
      post: { id: "post-2", originalContent: "תוכן", enhancedContent: null, useEnhanced: false, mediaUrls: null },
    })
    mocks.prisma.facebookAccount.update.mockResolvedValue({})
    mocks.prisma.facebookSchedule.update.mockResolvedValue({})
    mocks.prisma.facebookSchedule.updateMany.mockResolvedValue({})
    mocks.prisma.facebookPublishLog.findMany.mockResolvedValueOnce([])
    mocks.prisma.facebookGroup.findMany.mockResolvedValueOnce([
      { id: "group-1", url: "https://www.facebook.com/groups/group-1/" },
      { id: "group-2", url: "https://www.facebook.com/groups/group-2/" },
    ])
    mocks.prisma.facebookPublishLog.create.mockResolvedValue({})
    mocks.prisma.facebookPublishLog.updateMany.mockResolvedValue({})
    mocks.prisma.user.findMany.mockResolvedValueOnce([{ id: "admin-1" }])
    mocks.prisma.notification.create.mockResolvedValue({})

    mocks.launchFacebookBrowser.mockResolvedValueOnce({ close: vi.fn().mockResolvedValue(undefined) })
    mocks.createFacebookContext.mockResolvedValueOnce({})
    mocks.publishPostToGroup.mockResolvedValueOnce({ success: false, blocked: true, error: "BLOCKED_INDICATOR" })

    const response = await GET(makeRequest("test-cron-secret"))
    const body = await response.json()

    expect(body.blocked).toBe(true)
    expect(mocks.publishPostToGroup).toHaveBeenCalledTimes(1) // לא ממשיך לקבוצה השנייה
    expect(mocks.prisma.facebookAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUSPECTED_BLOCKED" }) })
    )
    expect(mocks.prisma.notification.create).toHaveBeenCalled()
  })
})
