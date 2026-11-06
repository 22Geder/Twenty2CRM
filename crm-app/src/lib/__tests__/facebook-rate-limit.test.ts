import { describe, it, expect, vi, afterEach } from "vitest"
import { isRateLimited } from "../facebook-rate-limit"

describe("isRateLimited", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("מאפשר עד limit בקשות בחלון הזמן ואז חוסם", () => {
    const key = `test-${Math.random()}`
    expect(isRateLimited(key, 3, 60_000)).toBe(false)
    expect(isRateLimited(key, 3, 60_000)).toBe(false)
    expect(isRateLimited(key, 3, 60_000)).toBe(false)
    expect(isRateLimited(key, 3, 60_000)).toBe(true)
  })

  it("מפתחות שונים אינם משפיעים זה על זה", () => {
    const keyA = `a-${Math.random()}`
    const keyB = `b-${Math.random()}`
    expect(isRateLimited(keyA, 1, 60_000)).toBe(false)
    expect(isRateLimited(keyB, 1, 60_000)).toBe(false)
    expect(isRateLimited(keyA, 1, 60_000)).toBe(true)
  })

  it("לאחר חלוף חלון הזמן - מאפשר שוב", () => {
    const key = `window-${Math.random()}`
    let now = 1_000_000
    vi.spyOn(Date, "now").mockImplementation(() => now)

    expect(isRateLimited(key, 1, 1_000)).toBe(false)
    expect(isRateLimited(key, 1, 1_000)).toBe(true)

    now += 1_001
    expect(isRateLimited(key, 1, 1_000)).toBe(false)
  })
})
