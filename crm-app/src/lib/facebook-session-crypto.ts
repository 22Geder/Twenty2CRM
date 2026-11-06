import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto"

// נגזרת מפתח ייעודית מתוך NEXTAUTH_SECRET הקיים - אין צורך במשתנה סביבה נוסף.
// ה-info string מבדיל בין המפתח הזה למפתחות אחרים שנגזרים מאותו secret (כמו ב-gmail-mailboxes.ts).
function secret(): Buffer {
  const value = process.env.NEXTAUTH_SECRET
  if (!value) throw new Error("Facebook session encryption is not configured")
  return createHmac("sha256", value).update("twenty2crm-facebook-session-v1").digest()
}

// מצפין את ה-storageState (cookies+localStorage) של סשן פייסבוק לפני שמירה ב-DB.
// פורמט: "v1.<iv>.<authTag>.<ciphertext>" (base64url) - תואם למוסכמה הקיימת ב-gmail-mailboxes.ts.
export function encryptFacebookSession(storageStateJson: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", secret(), iv)
  const encrypted = Buffer.concat([cipher.update(storageStateJson, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".")
}

// מפענח בזיכרון בלבד, רגע לפני שימוש ב-Playwright. לעולם לא לכתוב את התוצאה לדיסק/לוג/response.
export function decryptFacebookSession(value: string): string {
  const [version, iv, tag, encrypted] = value.split(".")
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Invalid Facebook session format")
  const decipher = createDecipheriv("aes-256-gcm", secret(), Buffer.from(iv, "base64url"))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  // setAuthTag + final() זורק אוטומטית אם ה-ciphertext/tag נפגמו (tamper detection מובנה ב-GCM).
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}
