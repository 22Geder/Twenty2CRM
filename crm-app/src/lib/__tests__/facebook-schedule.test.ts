import { describe, it, expect } from "vitest"
import { computeNextRunAt } from "../facebook-schedule"

describe("computeNextRunAt", () => {
  it("DAILY: מחזיר היום אם השעה עוד לא עברה (שעון ישראל)", () => {
    // 2026-03-10 הוא לפני תחילת שעון הקיץ בישראל (סוף מרץ) - עדיין UTC+2
    const from = new Date(Date.UTC(2026, 2, 10, 8, 0))
    const next = computeNextRunAt({ frequency: "DAILY", time: "18:00", timezone: "Asia/Jerusalem" }, from)
    // 18:00 שעון חורף (UTC+2) = 16:00 UTC, באותו יום
    expect(next.getUTCFullYear()).toBe(2026)
    expect(next.getUTCMonth()).toBe(2)
    expect(next.getUTCDate()).toBe(10)
    expect(next.getUTCHours()).toBe(16)
  })

  it("DAILY: עובר למחר אם השעה כבר עברה היום", () => {
    const from = new Date(Date.UTC(2026, 2, 10, 17, 0)) // 19:00 שעון ישראל (חורף)
    const next = computeNextRunAt({ frequency: "DAILY", time: "08:00", timezone: "Asia/Jerusalem" }, from)
    expect(next.getUTCDate()).toBe(11)
    expect(next.getUTCHours()).toBe(6) // 08:00 שעון חורף = 06:00 UTC
  })

  it("WEEKLY: בוחר את היום הקרוב מבין daysOfWeek", () => {
    // 2026-03-10 הוא יום שלישי (2). daysOfWeek: [0, 4] (ראשון, חמישי)
    const from = new Date(Date.UTC(2026, 2, 10, 6, 0))
    const next = computeNextRunAt(
      { frequency: "WEEKLY", time: "09:00", daysOfWeek: [0, 4], timezone: "Asia/Jerusalem" },
      from
    )
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", weekday: "short" }).format(next)
    expect(["Sun", "Thu"]).toContain(weekday)
    expect(next.getTime()).toBeGreaterThan(from.getTime())
  })

  it("WEEKLY: תוצאה תמיד עתידית ביחס ל-from", () => {
    const from = new Date()
    const next = computeNextRunAt({ frequency: "WEEKLY", time: "12:00", daysOfWeek: [1, 3, 5] }, from)
    expect(next.getTime()).toBeGreaterThan(from.getTime())
  })

  it("מחשב מחדש ביחס ל-now בסיום (לא drift ביחס ל-nextRunAt הקודם) - קריאה כפולה עם from שונה נותנת תוצאות עקביות", () => {
    const first = computeNextRunAt({ frequency: "DAILY", time: "10:00" }, new Date(Date.UTC(2026, 0, 1, 0, 0)))
    const second = computeNextRunAt({ frequency: "DAILY", time: "10:00" }, first)
    expect(second.getTime()).toBeGreaterThan(first.getTime())
    expect(second.getUTCDate()).not.toBe(first.getUTCDate())
  })
})
