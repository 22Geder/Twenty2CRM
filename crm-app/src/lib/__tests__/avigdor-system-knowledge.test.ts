import { describe, it, expect } from "vitest"
import { lookupCrmHowTo } from "../avigdor-system-knowledge"

describe("lookupCrmHowTo", () => {
  it("מחזיר מדריך העלאת קו\"ח לפי מילות מפתח", () => {
    const hits = lookupCrmHowTo('איך מעלה קורות חיים')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(3)
    expect(hits.some((h) => h.answer.includes("העלאה המונית"))).toBe(true)
    expect(hits.every((h) => !h.answer.includes("@") && !h.answer.toLowerCase().includes("password"))).toBe(true)
  })

  it("מחזיר סקירת מסכים כשאין התאמה", () => {
    const hits = lookupCrmHowTo("שאלה בלי קשר בכלל xyz123")
    expect(hits).toHaveLength(1)
    expect(hits[0].topic).toBe("מסכי המערכת")
    expect(hits[0].answer).toContain("/dashboard")
  })

  it.each([
    ["איפה מסמנים שהתקבל", "/dashboard/candidates/", "התקבל"],
    ["איך מעלים קוח", "/dashboard/upload", "אביגדור"],
    ["איפה רואים מגייסים", "/dashboard", "מגייסים"],
    ["סטטוס שנתי", "/dashboard/monthly-status", "שנה"],
  ])("מפנה למסך הנכון עבור %s", (question, path, hint) => {
    const hits = lookupCrmHowTo(question)
    expect(hits.length).toBeGreaterThan(0)
    const answers = hits.map((h) => h.answer).join(" ")
    expect(answers).toContain(path)
    expect(answers).toContain(hint)
    expect(hits.every((h) => !h.answer.includes("@") && !h.answer.toLowerCase().includes("password"))).toBe(true)
  })
})
