// עזרים להצעות מייל: קורות חיים -> מועמד חדש, ושרשור מייל -> ראיון. הכול מוצע בלבד ודורש אישור.
export type SenderInfo = { name: string | null; email: string | null }

export type ParsedCandidateInfo = {
  name: string | null
  email: string | null
  phone: string | null
  city: string | null
  currentTitle: string | null
  yearsOfExperience: number | null
  skills: string[]
  summary: string | null
}

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const PHONE_RE = /(?<!\d)(?:\+972[-\s]?|972[-\s]?|0)5\d[-\s]?\d{3}[-\s]?\d{4}(?!\d)/g
const NO_REPLY_RE = /(no-?reply|donotreply|mailer-daemon|postmaster|notifications?@)/i
const CV_WORDS = new Set([
  "קורות", "חיים", "קו\"ח", "קוח", "resume", "cv", "curriculum", "vitae", "פרטים", "אישיים",
  "שם", "טלפון", "נייד", "מייל", "אימייל", "email", "phone", "mobile", "כתובת", "תאריך", "לידה",
])

export function parseSender(from: string | null | undefined): SenderInfo {
  const value = (from || "").trim()
  if (!value) return { name: null, email: null }
  const email = value.match(EMAIL_RE)?.[0]?.toLowerCase() || null
  const name = value.replace(/<[^>]*>/g, "").replace(/["']/g, "").replace(EMAIL_RE, "").trim()
  return { name: name || null, email }
}

export function extractEmailAddresses(text: string | null | undefined): string[] {
  const found = (text || "").match(EMAIL_RE) || []
  return Array.from(new Set(found.map((item) => item.toLowerCase())))
}

export function normalizeIsraeliPhone(raw: string | null | undefined): string | null {
  const digits = (raw || "").replace(/[^\d]/g, "")
  let local = digits
  if (local.startsWith("972")) local = `0${local.slice(3)}`
  return /^05\d{8}$/.test(local) ? local : null
}

export function extractPhone(text: string | null | undefined): string | null {
  for (const match of (text || "").match(PHONE_RE) || []) {
    const phone = normalizeIsraeliPhone(match)
    if (phone) return phone
  }
  return null
}

function looksLikePersonName(value: string): boolean {
  const words = value.trim().split(/\s+/)
  if (words.length < 2 || words.length > 4) return false
  return words.every((word) => /^[\u0590-\u05FFA-Za-z'-]{2,20}$/.test(word) && !CV_WORDS.has(word.toLowerCase()))
}

export function guessCandidateName(resumeText: string, senderName: string | null): string | null {
  if (senderName && !NO_REPLY_RE.test(senderName) && looksLikePersonName(senderName)) return senderName.trim()
  const tokens = resumeText.split(/\s+/).filter(Boolean).slice(0, 14)
  const start = tokens.findIndex((token) => !CV_WORDS.has(token.toLowerCase()))
  if (start === -1) return null
  const candidate = tokens.slice(start, start + 2).join(" ")
  return looksLikePersonName(candidate) ? candidate : null
}

export function parseCandidateFromResumeText(input: {
  text: string
  from: string | null | undefined
  excludeEmails?: string[]
}): ParsedCandidateInfo {
  const sender = parseSender(input.from)
  const excluded = new Set((input.excludeEmails || []).map((email) => email.toLowerCase()))
  const resumeEmail = extractEmailAddresses(input.text).find((email) => !excluded.has(email) && !NO_REPLY_RE.test(email))
  const senderEmail = sender.email && !excluded.has(sender.email) && !NO_REPLY_RE.test(sender.email) ? sender.email : null
  return {
    name: guessCandidateName(input.text, sender.name),
    email: resumeEmail || senderEmail,
    phone: extractPhone(input.text),
    city: null,
    currentTitle: null,
    yearsOfExperience: null,
    skills: [],
    summary: null,
  }
}

export function serializeParsedCandidate(info: ParsedCandidateInfo): string {
  return JSON.stringify(info)
}

export function deserializeParsedCandidate(value: string | null | undefined): ParsedCandidateInfo {
  const empty: ParsedCandidateInfo = {
    name: null, email: null, phone: null, city: null, currentTitle: null, yearsOfExperience: null, skills: [], summary: null,
  }
  try {
    const parsed = JSON.parse(value || "{}")
    if (!parsed || typeof parsed !== "object") return empty
    const text = (field: unknown) => (typeof field === "string" && field.trim() ? field.trim().slice(0, 500) : null)
    return {
      name: text(parsed.name),
      email: text(parsed.email),
      phone: text(parsed.phone),
      city: text(parsed.city),
      currentTitle: text(parsed.currentTitle),
      yearsOfExperience: Number.isInteger(parsed.yearsOfExperience) ? parsed.yearsOfExperience : null,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s: unknown): s is string => typeof s === "string").slice(0, 30)
        : [],
      summary: text(parsed.summary),
    }
  } catch {
    return empty
  }
}

export function safeResumeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^\w.\u0590-\u05FF-]+/g, "_").replace(/_{2,}/g, "_").slice(-120)
  return cleaned || "resume"
}

// ----- זיהוי ראיון -----

const TZ = "Asia/Jerusalem"
const INTERVIEW_RE = /(ראיון|ריאיון|שיחת\s+היכרות|שיחה\s+עם|זימון|interview)/i
const WEEKDAYS: Record<string, number> = { "ראשון": 0, "שני": 1, "שלישי": 2, "רביעי": 3, "חמישי": 4, "שישי": 5, "שבת": 6 }

export function mentionsInterview(...texts: Array<string | null | undefined>): boolean {
  return INTERVIEW_RE.test(texts.filter(Boolean).join(" "))
}

type IsraelParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

function israelParts(date: Date): IsraelParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  })
  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) parts[part.type] = part.value
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday)
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), weekday,
  }
}

export function israelLocalToDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute)
  let guess = target
  for (let i = 0; i < 2; i += 1) {
    const p = israelParts(new Date(guess))
    guess = target - (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess)
  }
  return new Date(guess)
}

function addDays(year: number, month: number, day: number, days: number) {
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

function parseTime(text: string): { hour: number; minute: number } | null {
  const colon = text.match(/(?<!\d)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/)
  if (colon) return { hour: Number(colon[1]), minute: Number(colon[2]) }
  const hourOnly = text.match(/(?:בשעה|ב-?שעה|at)\s*([01]?\d|2[0-3])(?![\d:])/i)
  return hourOnly ? { hour: Number(hourOnly[1]), minute: 0 } : null
}

export function parseInterviewDateTime(text: string, now: Date = new Date()): Date | null {
  const time = parseTime(text)
  if (!time) return null
  const today = israelParts(now)

  const numeric = text.match(/(?<!\d)(0?[1-9]|[12]\d|3[01])[/.-](0?[1-9]|1[0-2])(?:[/.-](\d{4}|\d{2}))?(?![\d:])/)
  if (numeric) {
    const day = Number(numeric[1])
    const month = Number(numeric[2])
    let year = numeric[3] ? Number(numeric[3]) : today.year
    if (year < 100) year += 2000
    let result = israelLocalToDate(year, month, day, time.hour, time.minute)
    if (!numeric[3] && result.getTime() < now.getTime() - 24 * 3600 * 1000) {
      result = israelLocalToDate(year + 1, month, day, time.hour, time.minute)
    }
    return result
  }

  const offset = /מחרתיים/.test(text) ? 2 : /מחר/.test(text) ? 1 : /(?<![\u0590-\u05FF])היום(?![\u0590-\u05FF])/.test(text) ? 0 : null
  if (offset !== null) {
    const d = addDays(today.year, today.month, today.day, offset)
    return israelLocalToDate(d.year, d.month, d.day, time.hour, time.minute)
  }

  const weekday = text.match(/יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/)
  if (weekday) {
    const diff = ((WEEKDAYS[weekday[1]] - today.weekday + 7) % 7) || 7
    const d = addDays(today.year, today.month, today.day, diff)
    return israelLocalToDate(d.year, d.month, d.day, time.hour, time.minute)
  }
  return null
}

export function isPlausibleInterviewDate(date: Date | null, now: Date = new Date()): date is Date {
  if (!date || Number.isNaN(date.getTime())) return false
  const ahead = date.getTime() - now.getTime()
  return ahead > -3600 * 1000 && ahead < 90 * 24 * 3600 * 1000
}

export function extractLocationHint(text: string): string | null {
  const match = text.match(/(?:כתובת|מיקום|location|address)\s*[:：-]\s*([^\n.]{3,120})/i)
  return match ? match[1].trim() : null
}
