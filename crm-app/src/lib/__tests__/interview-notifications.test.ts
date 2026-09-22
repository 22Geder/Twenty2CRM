import { describe, expect, it } from "vitest"
import {
  buildInterviewReminderMessage,
  buildInterviewWhatsAppUrl,
  getLocalDayKey,
  normalizeIsraeliPhoneForWhatsApp,
} from "../interview-notifications"

describe("interview notifications", () => {
  it("normalizes supported Israeli mobile numbers", () => {
    expect(normalizeIsraeliPhoneForWhatsApp("050-123-4567")).toBe("972501234567")
    expect(normalizeIsraeliPhoneForWhatsApp("+972 50 123 4567")).toBe("972501234567")
    expect(normalizeIsraeliPhoneForWhatsApp("03-1234567")).toBeNull()
  })

  it("builds an encoded WhatsApp reminder link", () => {
    const input = {
      candidateName: "ישראל ישראלי",
      phone: "0501234567",
      scheduledAt: "2026-09-22T07:30:00.000Z",
      positionTitle: "מנהל מחסן",
      employerName: "חברה לדוגמה",
      location: "חיפה",
    }

    const message = buildInterviewReminderMessage(input)
    const url = buildInterviewWhatsAppUrl(input)

    expect(message).toContain("ישראל ישראלי")
    expect(message).toContain("מנהל מחסן")
    expect(message).toContain("חיפה")
    expect(url).toBe(`https://wa.me/972501234567?text=${encodeURIComponent(message)}`)
  })

  it("creates a stable local day key", () => {
    expect(getLocalDayKey(new Date(2026, 8, 22, 7, 0))).toBe("2026-09-22")
  })
})