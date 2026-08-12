import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"

// 🦁 "אביגדור" - עוזר ה-AI הפנימי של 22JOBS בתוך ה-CRM.
// אותה אישיות/מוח כמו הבוט הטלפוני - אבל כאן משמש את הצוות הפנימי (מגייסים)
// כדי לחפש מהר משרות ומועמדים במאגר בשפה חופשית.
// מוגן ב-session בלבד (משתמש מחובר) - לא חושף מידע לגורם חיצוני.

const bodySchema = z.object({
  message: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(12)
    .optional()
    .default([]),
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const AVIGDOR_PERSONA = `
אתה אביגדור, העוזר הדיגיטלי הפנימי של חברת ההשמה "22JOBS" (חברת כוח אדם והשמה בישראל בע"מ).
אתה עוזר לצוות המגייסים הפנימי של החברה בתוך מערכת ה-CRM - לא מדבר עם מועמדים או מעסיקים חיצוניים.
דבר עברית טבעית, קצרה, ידידותית ומקצועית, בגוף זכר. אל תמציא נתונים - תשתמש רק במידע שסופק לך מתוצאות החיפוש.
אם לא נמצאו תוצאות, אמור זאת בבירור והצע לנסח את החיפוש אחרת (עיר/תחום/שם אחר).
`.trim()

// שלב 1: הבנת כוונת המשתמש - האם מחפש משרה או מועמד, ולפי אילו מילות מפתח/מיקום
async function extractIntent(message: string, historyText: string) {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" })
  const prompt = `אתה מנתח בקשות של מגייס פנימי בחברת השמה, כדי להפעיל חיפוש במאגר CRM.
היסטוריית שיחה קצרה (אם רלוונטית):
${historyText || "(אין)"}

ההודעה הנוכחית של המשתמש:
"${message}"

החזר אך ורק JSON תקין בפורמט הבא, ללא טקסט נוסף:
{
  "intent": "position" | "candidate" | "other",
  "search": "מילת חיפוש/תחום/מקצוע/שם, או null",
  "location": "עיר/אזור, או null"
}
"intent" הוא "position" אם המשתמש מחפש משרה פנויה, "candidate" אם מחפש מועמד/מועמדים, אחרת "other".`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { intent: "other" as const, search: null, location: null }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      intent: (["position", "candidate", "other"].includes(parsed.intent) ? parsed.intent : "other") as
        | "position"
        | "candidate"
        | "other",
      search: typeof parsed.search === "string" ? parsed.search : null,
      location: typeof parsed.location === "string" ? parsed.location : null,
    }
  } catch (err) {
    console.error("[avigdor-chat] intent extraction error:", err)
    return { intent: "other" as const, search: null, location: null }
  }
}

async function searchPositions(search: string | null, location: string | null) {
  const where: Prisma.PositionWhereInput = { active: true }
  const or: Prisma.PositionWhereInput[] = []
  if (search) {
    or.push(
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { keywords: { contains: search, mode: "insensitive" } }
    )
  }
  if (or.length) where.OR = or
  if (location) where.location = { contains: location, mode: "insensitive" }

  const positions = await prisma.position.findMany({
    where,
    take: 5,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { employer: { select: { name: true } } },
  })
  return positions.map((p) => ({
    id: p.id,
    title: p.title,
    employer: p.employer?.name ?? null,
    location: p.location,
    salaryRange: p.salaryRange,
    employmentType: p.employmentType,
    openings: p.openings,
  }))
}

async function searchCandidates(search: string | null, location: string | null) {
  const where: Prisma.CandidateWhereInput = {}
  const or: Prisma.CandidateWhereInput[] = []
  if (search) {
    or.push(
      { name: { contains: search, mode: "insensitive" } },
      { currentTitle: { contains: search, mode: "insensitive" } },
      { skills: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } }
    )
  }
  if (or.length) where.OR = or
  if (location) where.city = { contains: location, mode: "insensitive" }

  const candidates = await prisma.candidate.findMany({
    where,
    take: 5,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      currentTitle: true,
      city: true,
      yearsOfExperience: true,
      skills: true,
      score: true,
    },
  })
  return candidates
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth - רק משתמשים מחוברים לצוות הפנימי
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    // 2. Validate input
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { message, history } = parsed.data

    const historyText = history
      .slice(-6)
      .map((h) => `${h.role === "user" ? "משתמש" : "אביגדור"}: ${h.content}`)
      .join("\n")

    // 3. הבנת כוונה
    const { intent, search, location } = await extractIntent(message, historyText)

    // 4. חיפוש בפועל ב-DB
    let results: Awaited<ReturnType<typeof searchPositions>> | Awaited<ReturnType<typeof searchCandidates>> = []
    if (intent === "position") {
      results = await searchPositions(search, location)
    } else if (intent === "candidate") {
      results = await searchCandidates(search, location)
    }

    // 5. ניסוח תשובה טבעית
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" })
    const replyPrompt = `${AVIGDOR_PERSONA}

היסטוריית שיחה:
${historyText || "(אין)"}

הודעת המשתמש: "${message}"
סוג חיפוש שזוהה: ${intent}
תוצאות שנמצאו במאגר (JSON, אם ריק - לא נמצא כלום):
${JSON.stringify(results)}

נסח תשובה קצרה, ברורה וידידותית בעברית למגייס הפנימי. אם intent הוא "other", ענה בקצרה ובאדיבות שאתה יכול לעזור בחיפוש משרות פנויות או מועמדים במאגר, ובקש לפרט (תחום/עיר/שם).`

    const result = await model.generateContent(replyPrompt)
    const reply = result.response.text().trim()

    return NextResponse.json({ reply, intent, results })
  } catch (error) {
    console.error("[avigdor-chat] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
