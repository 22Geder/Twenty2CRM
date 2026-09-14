import type { Content } from "@google/generative-ai"
import { z } from "zod"
import type { AvigdorPageContext } from "./avigdor-page-context"

export const AVIGDOR_CHAT_LIMITS = {
  messageLength: 500,
  historyMessages: 12,
  historyContentLength: 2000,
  clientTimeoutMs: 50_000,
  rateWindowMs: 60_000,
  requestsPerWindow: 10,
  concurrentRequestsPerUser: 1,
  rateLimitUsers: 1000,
  modelRounds: 5,
  toolCalls: 8,
  totalTimeoutMs: 45_000,
  modelTimeoutMs: 15_000,
  toolTimeoutMs: 5_000,
  maxOutputTokens: 2048,
  positions: 80,
  candidates: 200,
} as const

export type HistoryMessage = { role: "user" | "assistant"; content: string }

// חוזה משותף לפאנל ולנתיב; אין כאן תלות במודולי שרת או מפתחות API.
export const avigdorChatBodySchema = z.object({
  message: z.string().trim().min(1).max(AVIGDOR_CHAT_LIMITS.messageLength),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(AVIGDOR_CHAT_LIMITS.historyContentLength),
  })).max(AVIGDOR_CHAT_LIMITS.historyMessages).optional().default([]),
  pageContext: z.object({
    type: z.enum(["candidate", "position"]),
    id: z.string().uuid(),
  }).optional().nullable(),
})

export function buildAvigdorPayload(
  history: readonly HistoryMessage[],
  message: string,
  pageContext?: AvigdorPageContext | null
): z.infer<typeof avigdorChatBodySchema> {
  const currentMessage = message.trim()
  const prior = history
    .map(({ role, content }) => ({ role, content: content.trim() }))
    .filter((entry) => entry.content.length > 0)
  const last = prior[prior.length - 1]
  // תומך גם בקורא שכבר הוסיף את השאלה להיסטוריה, בלי למחוק חזרות מתורים קודמים.
  if (last?.role === "user" && last.content === currentMessage) prior.pop()

  return avigdorChatBodySchema.parse({
    // לא מקצרים בשקט את השאלה הנוכחית; קלט ארוך מדי דורש תיקון מפורש.
    message: currentMessage,
    history: prior.slice(-AVIGDOR_CHAT_LIMITS.historyMessages).map(({ role, content }) => ({
      role,
      content: content.slice(0, AVIGDOR_CHAT_LIMITS.historyContentLength),
    })),
    pageContext,
  })
}

export function getAvigdorChatErrorMessage(status: number): string {
  switch (status) {
    case 400: return "הבקשה לא תקינה או ארוכה מדי. קצר את ההודעה ונסה שוב."
    case 401: return "יש להתחבר מחדש לחשבון כדי להמשיך בשיחה עם אביגדור."
    case 403: return "אין לחשבון הרשאה להשתמש באביגדור. יש לפנות למנהל המערכת."
    case 429: return "נשלחו יותר מדי בקשות או שכבר מתבצעת בקשה לחשבון זה. המתן מעט ונסה שוב."
    case 503: return "שירות אביגדור אינו זמין כרגע. נסה שוב מאוחר יותר."
    case 504: return "הבקשה ארכה זמן רב מדי ולא התקבלה תשובה. נסה שוב."
    case 0: return "לא התקבלה תשובה מאביגדור. בדוק את החיבור ונסה שוב."
    default: return "אירעה תקלה בשירות אביגדור ולא התקבלה תשובה. נסה שוב."
  }
}

export class AvigdorChatResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AvigdorChatResponseError"
  }
}

const replySchema = z.object({
  reply: z.string().trim().min(1),
  error: z.never().optional(),
  success: z.literal(true).optional(),
})

export async function readAvigdorChatReply(response: Response): Promise<string> {
  // לא מציגים גוף שגיאה גולמי, גם אם הוא כולל שדה reply או פרטי שרת רגישים.
  if (!response.ok) throw new AvigdorChatResponseError(getAvigdorChatErrorMessage(response.status))
  try {
    const body: unknown = await response.json()
    return replySchema.parse(body).reply
  } catch {
    throw new AvigdorChatResponseError("התקבלה תשובה לא תקינה מאביגדור. נסה שוב.")
  }
}

type ChatRequestPermit = { release: () => void } | {
  status: 429 | 503
  code: "CHAT_BUSY" | "CHAT_RATE_LIMITED" | "CHAT_CAPACITY"
  retryAfterSeconds: number
}

// מגבלת עלות מקומית למופע שרת יחיד בלבד: לא מבוזרת, ומתאפסת בהפעלתו מחדש.
// אין שמירת תוכן שיחה. לא מפנים מכסה פעילה כדי להכניס משתמש חדש ולעקוף הגבלה.
export class AvigdorChatRequestLimiter {
  private readonly users = new Map<string, { resetAt: number; requests: number; active: number }>()

  acquire(userId: string): ChatRequestPermit {
    const now = Date.now()
    for (const [id, entry] of this.users) {
      if (entry.active === 0 && entry.resetAt <= now) this.users.delete(id)
    }
    let entry = this.users.get(userId)
    if (entry && entry.active >= AVIGDOR_CHAT_LIMITS.concurrentRequestsPerUser) {
      return { status: 429, code: "CHAT_BUSY", retryAfterSeconds: 1 }
    }
    if (entry && entry.requests >= AVIGDOR_CHAT_LIMITS.requestsPerWindow) {
      return {
        status: 429, code: "CHAT_RATE_LIMITED",
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      }
    }
    if (!entry) {
      if (this.users.size >= AVIGDOR_CHAT_LIMITS.rateLimitUsers) {
        return { status: 503, code: "CHAT_CAPACITY", retryAfterSeconds: Math.ceil(AVIGDOR_CHAT_LIMITS.rateWindowMs / 1000) }
      }
      entry = { resetAt: now + AVIGDOR_CHAT_LIMITS.rateWindowMs, requests: 0, active: 0 }
      this.users.set(userId, entry)
    }
    entry.requests++
    entry.active++
    const acquired = entry
    let released = false
    return { release: () => {
      if (!released) {
        acquired.active--
        released = true
      }
    } }
  }
}

export function buildAvigdorContents(
  history: readonly HistoryMessage[],
  message: string,
  userMessage = message
): Content[] {
  const prior = history
    .map((entry) => ({ ...entry, content: entry.content.trim() }))
    .filter((entry) => entry.content.length > 0)
  const last = prior[prior.length - 1]
  // מסירים רק עותק זהה של ההודעה הנוכחית, לפני הוספת הקשר המסך.
  if (last?.role === "user" && last.content === message.trim()) prior.pop()

  const contents: Content[] = []
  for (const entry of [...prior, { role: "user", content: userMessage.trim() }]) {
    if (!entry.content) continue
    const role = entry.role === "user" ? "user" : "model"
    if (!contents.length && role === "model") continue
    const previous = contents[contents.length - 1]
    // שומרים תוכן של תורים רצופים מאותו דובר בלי לשלוח רצף תפקידים לא תקין.
    if (previous?.role === role) previous.parts.push({ text: entry.content })
    else contents.push({ role, parts: [{ text: entry.content }] })
  }
  return contents
}

const idSchema = z.string().trim().uuid()
const searchSchema = z.string().trim().max(200).nullable().optional()
const locationSchema = z.string().trim().max(100).nullable().optional()
const searchArgsSchema = z.object({ search: searchSchema, location: locationSchema }).strict()

// גם ארגומנטים שהמודל יוצר הם קלט לא מהימן; אין המרות שקטות לחיפוש לא מסונן.
export const avigdorToolCallSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("search_positions"), args: searchArgsSchema }),
  z.object({ name: z.literal("get_position_details"), args: z.object({ id: idSchema }).strict() }),
  z.object({ name: z.literal("search_candidates"), args: searchArgsSchema }),
  z.object({ name: z.literal("get_candidate_details"), args: z.object({ id: idSchema }).strict() }),
  z.object({ name: z.literal("search_employers"), args: z.object({ search: searchSchema }).strict() }),
  z.object({
    name: z.literal("list_upcoming_interviews"),
    args: z.object({ limit: z.number().int().min(1).max(10).optional() }).strict(),
  }),
  z.object({ name: z.literal("get_stats"), args: z.object({}).strict() }),
  z.object({ name: z.literal("match_candidate_to_positions"), args: z.object({ candidateId: idSchema }).strict() }),
  z.object({ name: z.literal("match_position_to_candidates"), args: z.object({ positionId: idSchema }).strict() }),
  z.object({
    name: z.literal("explain_crm"),
    args: z.object({ question: z.string().trim().min(1).max(500) }).strict(),
  }),
])

export type AvigdorToolCall = z.infer<typeof avigdorToolCallSchema>

export function getAvigdorMatchingNotice(tools: readonly string[]): string {
  const scopes: string[] = []
  if (tools.includes("match_candidate_to_positions")) {
    scopes.push(`עד ${AVIGDOR_CHAT_LIMITS.positions} משרות פעילות לפי עדיפות ותאריך יצירה`)
  }
  if (tools.includes("match_position_to_candidates")) {
    scopes.push(`עד ${AVIGDOR_CHAT_LIMITS.candidates} מועמדים לפי ציון קיים ותאריך יצירה`)
  }
  if (!scopes.length) return ""
  return `הבהרה: המאצ'ינג מוגבל ל-${scopes.join("; ")}, ואינו סריקה מלאה של המאגר. הציון הוא דירוג היוריסטי מ-0 עד 100, לא אחוז התאמה סטטיסטי ולא הסתברות להצלחה.`
}

export class AvigdorChatTimeoutError extends Error {
  constructor() {
    super("Avigdor chat timed out")
    this.name = "AvigdorChatTimeoutError"
  }
}

export class AvigdorChatBudget {
  private readonly deadline = Date.now() + AVIGDOR_CHAT_LIMITS.totalTimeoutMs
  private expired = false

  remainingMs(maxMs: number = AVIGDOR_CHAT_LIMITS.totalTimeoutMs): number {
    const remaining = Math.min(maxMs, this.deadline - Date.now())
    if (this.expired || remaining <= 0) {
      this.expired = true
      throw new AvigdorChatTimeoutError()
    }
    return remaining
  }

  async run<T>(
    operation: (timeoutMs: number) => T | PromiseLike<T>,
    maxMs: number = AVIGDOR_CHAT_LIMITS.totalTimeoutMs
  ): Promise<T> {
    const timeoutMs = this.remainingMs(maxMs)
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race([
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            this.expired = true
            reject(new AvigdorChatTimeoutError())
          }, timeoutMs)
        }),
        Promise.resolve().then(() => {
          this.remainingMs()
          return operation(timeoutMs)
        }),
      ])
      this.remainingMs()
      return result
    } finally {
      if (timer !== undefined) clearTimeout(timer)
    }
  }
}