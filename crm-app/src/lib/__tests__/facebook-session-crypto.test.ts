import { describe, it, expect } from "vitest"
import { encryptFacebookSession, decryptFacebookSession } from "../facebook-session-crypto"

const ORIGINAL_SECRET = process.env.NEXTAUTH_SECRET

describe("facebook-session-crypto", () => {
  it("round-trip: הפענוח מחזיר בדיוק את מה שהוצפן", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    const original = JSON.stringify({ cookies: [{ name: "c_user", value: "123" }], origins: [] })
    const encrypted = encryptFacebookSession(original)
    expect(decryptFacebookSession(encrypted)).toBe(original)
  })

  it("הפלט המוצפן אינו מכיל את התוכן המקורי בטקסט גלוי", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    const original = JSON.stringify({ secretToken: "very-sensitive-cookie-value" })
    const encrypted = encryptFacebookSession(original)
    expect(encrypted).not.toContain("very-sensitive-cookie-value")
  })

  it("מתחיל בגרסה v1 ומורכב מ-4 חלקים מופרדים בנקודה", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    const encrypted = encryptFacebookSession("{}")
    const parts = encrypted.split(".")
    expect(parts).toHaveLength(4)
    expect(parts[0]).toBe("v1")
  })

  it("tamper detection: שינוי ב-ciphertext גורם לכשל בפענוח", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    const encrypted = encryptFacebookSession(JSON.stringify({ a: 1 }))
    const [version, iv, tag, ciphertext] = encrypted.split(".")
    const tampered = [version, iv, tag, ciphertext.slice(0, -2) + (ciphertext.slice(-2) === "AA" ? "BB" : "AA")].join(".")
    expect(() => decryptFacebookSession(tampered)).toThrow()
  })

  it("tamper detection: שינוי ב-authTag גורם לכשל בפענוח", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    const encrypted = encryptFacebookSession(JSON.stringify({ a: 1 }))
    const [version, iv, tag, ciphertext] = encrypted.split(".")
    const tamperedTag = [version, iv, tag.slice(0, -2) + (tag.slice(-2) === "AA" ? "BB" : "AA"), ciphertext].join(".")
    expect(() => decryptFacebookSession(tamperedTag)).toThrow()
  })

  it("פורמט לא תקין (חסרים חלקים) נדחה במפורש", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    expect(() => decryptFacebookSession("not-a-valid-format")).toThrow("Invalid Facebook session format")
  })

  it("גרסה לא מוכרת נדחית", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-value-1234567890"
    const encrypted = encryptFacebookSession("{}")
    const parts = encrypted.split(".")
    parts[0] = "v2"
    expect(() => decryptFacebookSession(parts.join("."))).toThrow("Invalid Facebook session format")
  })

  it("ללא NEXTAUTH_SECRET מוגדר - זורק שגיאה ברורה ולא נופל ל-plaintext", () => {
    delete process.env.NEXTAUTH_SECRET
    expect(() => encryptFacebookSession("{}")).toThrow("Facebook session encryption is not configured")
    process.env.NEXTAUTH_SECRET = ORIGINAL_SECRET
  })
})
