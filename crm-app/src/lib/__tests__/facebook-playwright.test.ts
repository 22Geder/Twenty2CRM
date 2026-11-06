import { describe, it, expect, vi } from "vitest"
import { isBlockedIndicatorUrl, randomDelayMs, publishPostToGroup } from "../facebook-playwright"

describe("isBlockedIndicatorUrl", () => {
  it("מזהה checkpoint/login/captcha/דו-שלבי ב-URL", () => {
    expect(isBlockedIndicatorUrl("https://www.facebook.com/checkpoint/1501092")).toBe(true)
    expect(isBlockedIndicatorUrl("https://www.facebook.com/login/?next=...")).toBe(true)
    expect(isBlockedIndicatorUrl("https://www.facebook.com/captcha/")).toBe(true)
    expect(isBlockedIndicatorUrl("https://www.facebook.com/two_factor/")).toBe(true)
  })

  it("לא מזהה URL תקין של קבוצה כחסום", () => {
    expect(isBlockedIndicatorUrl("https://www.facebook.com/groups/123456789/")).toBe(false)
  })
})

describe("randomDelayMs", () => {
  it("מחזיר ערך בטווח min-max (במילישניות)", () => {
    for (let i = 0; i < 50; i++) {
      const ms = randomDelayMs(45, 180)
      expect(ms).toBeGreaterThanOrEqual(45_000)
      expect(ms).toBeLessThanOrEqual(180_000)
    }
  })

  it("מתמודד עם min/max הפוכים בלי לזרוק שגיאה", () => {
    const ms = randomDelayMs(180, 45)
    expect(ms).toBeGreaterThanOrEqual(45_000)
    expect(ms).toBeLessThanOrEqual(180_000)
  })
})

function makeMockPage(overrides: Partial<Record<string, unknown>> = {}) {
  const page = {
    url: vi.fn(() => "https://www.facebook.com/groups/123/"),
    goto: vi.fn().mockResolvedValue(undefined),
    getByText: vi.fn(() => ({ first: () => ({ click: vi.fn().mockResolvedValue(undefined) }) })),
    getByRole: vi.fn(() => ({
      first: () => ({ click: vi.fn().mockResolvedValue(undefined), fill: vi.fn().mockResolvedValue(undefined) }),
      last: () => ({ click: vi.fn().mockResolvedValue(undefined) }),
    })),
    locator: vi.fn(() => ({ first: () => ({ setInputFiles: vi.fn().mockResolvedValue(undefined) }) })),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return page
}

describe("publishPostToGroup", () => {
  it("מחזיר success:true כאשר כל השלבים עוברים בלי סימני חסימה", async () => {
    const page = makeMockPage()
    const context = { newPage: vi.fn().mockResolvedValue(page) } as any

    const result = await publishPostToGroup(context, "https://www.facebook.com/groups/123/", "תוכן לדוגמה")

    expect(result.success).toBe(true)
    expect(page.close).toHaveBeenCalled()
  })

  it("מחזיר blocked:true אם ה-URL אחרי הניווט מכיל סימן חסימה", async () => {
    const page = makeMockPage({ url: vi.fn(() => "https://www.facebook.com/checkpoint/123") })
    const context = { newPage: vi.fn().mockResolvedValue(page) } as any

    const result = await publishPostToGroup(context, "https://www.facebook.com/groups/123/", "תוכן לדוגמה")

    expect(result.success).toBe(false)
    expect(result.blocked).toBe(true)
  })

  it("תופס שגיאה בלתי צפויה ומחזיר success:false עם error", async () => {
    const page = makeMockPage({
      getByText: vi.fn(() => ({
        first: () => ({ click: vi.fn().mockRejectedValue(new Error("timeout")) }),
      })),
    })
    const context = { newPage: vi.fn().mockResolvedValue(page) } as any

    const result = await publishPostToGroup(context, "https://www.facebook.com/groups/123/", "תוכן לדוגמה")

    expect(result.success).toBe(false)
    expect(result.error).toBe("timeout")
  })
})
