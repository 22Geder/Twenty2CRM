import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import {
  GoogleGenerativeAI,
  FunctionDeclarationSchemaType,
  type FunctionDeclaration,
  type Content,
  type Part,
} from "@google/generative-ai"
import { z } from "zod"

// 🦁 "אביגדור" - עוזר ה-AI הפנימי של 22JOBS בתוך ה-CRM.
// אותה אישיות/מוח כמו הבוט הטלפוני/וואטסאפ - אבל כאן משמש את הצוות הפנימי (מגייסים).
// כאן הוא סוכן חכם עם "כלים" (function-calling): הוא מחליט בעצמו באילו כלים להשתמש,
// שולף מידע חי מכל המערכת (משרות, מועמדים, מעסיקים, ראיונות, סטטיסטיקות) ומנסח תשובה.
// גישה לקריאה בלבד - אינו יוצר/מעדכן/מוחק כלום. מוגן ב-session (משתמש מחובר בלבד).

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
דבר עברית טבעית, קצרה, ידידותית ומקצועית, בגוף זכר.

יש לך גישה לכלים (functions) ששולפים מידע חי מהמערכת. תמיד השתמש בכלים כדי לענות - אל תמציא נתונים.
- אם שואלים על משרות פנויות/מועמדים/מעסיקים - חפש עם הכלי המתאים.
- אם שואלים "כמה", "מה המצב", "סטטוס", "סיכום" וכו' - השתמש ב-get_stats.
- אם שואלים על ראיונות קרובים - השתמש ב-list_upcoming_interviews.
- אתה יכול לקרוא לכמה כלים ברצף כדי להרכיב תשובה מלאה (למשל לחפש מועמד ואז להביא פרטים מלאים).
- אם רוצים פרטים מלאים על משרה/מועמד ספציפי - קרא ל-get_position_details / get_candidate_details עם ה-id שקיבלת מחיפוש.

כללי זהב:
- ענה אך ורק על סמך המידע שחזר מהכלים. אם כלי החזיר רשימה ריקה - אמור בבירור שלא נמצא, והצע לנסח אחרת (עיר/תחום/שם).
- אל תחשוף מיילים/טלפונים של מועמדים אלא אם המגייס ביקש זאת במפורש.
- תשובות קצרות וברורות. כשמונים פריטים - הצג עד 5 בכל פעם והצע להראות עוד.
`.trim()

// ────────────────────────────────────────────────────────────────
//  כלים (קריאה בלבד) - Function declarations עבור Gemini
// ────────────────────────────────────────────────────────────────
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "search_positions",
    description:
      "מחפש משרות פעילות במאגר לפי תחום/מקצוע/תפקיד (search) ו/או מיקום (location). מחזיר רשימה תמציתית עם id לכל משרה.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        search: { type: FunctionDeclarationSchemaType.STRING, description: "תחום/מקצוע/תפקיד. למשל: נהג, מכירות, אבטחה." },
        location: { type: FunctionDeclarationSchemaType.STRING, description: "עיר או אזור. למשל: אשדוד, תל אביב." },
      },
    },
  },
  {
    name: "get_position_details",
    description: "מחזיר פרטים מלאים על משרה בודדת לפי id שהתקבל מ-search_positions.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: { id: { type: FunctionDeclarationSchemaType.STRING, description: "מזהה המשרה (id)." } },
      required: ["id"],
    },
  },
  {
    name: "search_candidates",
    description:
      "מחפש מועמדים במאגר לפי שם/תפקיד נוכחי/כישורים (search) ו/או עיר (location). מחזיר רשימה תמציתית עם id לכל מועמד.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        search: { type: FunctionDeclarationSchemaType.STRING, description: "שם/מקצוע/כישור. למשל: יוסי, מלגזן, React." },
        location: { type: FunctionDeclarationSchemaType.STRING, description: "עיר מגורים. למשל: חיפה, נתניה." },
      },
    },
  },
  {
    name: "get_candidate_details",
    description: "מחזיר פרופיל מלא של מועמד בודד לפי id שהתקבל מ-search_candidates.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: { id: { type: FunctionDeclarationSchemaType.STRING, description: "מזהה המועמד (id)." } },
      required: ["id"],
    },
  },
  {
    name: "search_employers",
    description:
      "מחפש מעסיקים/לקוחות של החברה לפי שם (search, אופציונלי). מחזיר לכל מעסיק את מספר המשרות הפעילות שלו.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        search: { type: FunctionDeclarationSchemaType.STRING, description: "שם המעסיק (אופציונלי). אם ריק - מחזיר את המובילים." },
      },
    },
  },
  {
    name: "list_upcoming_interviews",
    description: "מחזיר רשימת ראיונות עתידיים מתוזמנים (מהיום והלאה), ממוינים לפי תאריך.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        limit: { type: FunctionDeclarationSchemaType.NUMBER, description: "כמה ראיונות להחזיר (ברירת מחדל 5, מקסימום 10)." },
      },
    },
  },
  {
    name: "get_stats",
    description:
      "מחזיר סטטיסטיקות חיות של המערכת: משרות פעילות, סה\"כ מועמדים, מועמדויות לפי שלב, ראיונות עתידיים, ומועמדים שהתקבלו החודש. שימושי לשאלות 'כמה' / 'מה המצב' / 'סיכום'.",
    parameters: { type: FunctionDeclarationSchemaType.OBJECT, properties: {} },
  },
]

// ────────────────────────────────────────────────────────────────
//  מימוש הכלים - Prisma, קריאה בלבד
// ────────────────────────────────────────────────────────────────
async function searchPositions(search?: string | null, location?: string | null) {
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
    take: 8,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { employer: { select: { name: true } } },
  })
  return {
    count: positions.length,
    positions: positions.map((p) => ({
      id: p.id,
      title: p.title,
      employer: p.employer?.name ?? null,
      location: p.location,
      salaryRange: p.salaryRange,
      employmentType: p.employmentType,
      openings: p.openings,
    })),
  }
}

async function getPositionDetails(id: string) {
  const p = await prisma.position.findUnique({
    where: { id },
    include: {
      employer: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  })
  if (!p) return { found: false }
  return {
    found: true,
    position: {
      id: p.id,
      title: p.title,
      employer: p.employer?.name ?? null,
      location: p.location,
      description: p.description,
      requirements: p.requirements,
      salaryRange: p.salaryRange,
      employmentType: p.employmentType,
      workHours: p.workHours,
      benefits: p.benefits,
      transportation: p.transportation,
      openings: p.openings,
      active: p.active,
      applicationsCount: p._count.applications,
    },
  }
}

async function searchCandidates(search?: string | null, location?: string | null) {
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
    take: 8,
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
  return { count: candidates.length, candidates }
}

async function getCandidateDetails(id: string) {
  const c = await prisma.candidate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      currentTitle: true,
      currentCompany: true,
      city: true,
      country: true,
      yearsOfExperience: true,
      skills: true,
      expectedSalary: true,
      noticePeriod: true,
      rating: true,
      score: true,
      source: true,
      employmentStatus: true,
      notes: true,
      manualSummary: true,
      applications: {
        take: 5,
        orderBy: { appliedAt: "desc" },
        select: {
          status: true,
          stage: true,
          matchScore: true,
          position: { select: { title: true } },
        },
      },
    },
  })
  if (!c) return { found: false }
  return {
    found: true,
    candidate: {
      ...c,
      applications: c.applications.map((a) => ({
        position: a.position?.title ?? null,
        status: a.status,
        stage: a.stage,
        matchScore: a.matchScore,
      })),
    },
  }
}

async function searchEmployers(search?: string | null) {
  const where: Prisma.EmployerWhereInput = {}
  if (search) where.name = { contains: search, mode: "insensitive" }

  const employers = await prisma.employer.findMany({
    where,
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      website: true,
      positions: { where: { active: true }, select: { id: true } },
    },
  })
  return {
    count: employers.length,
    employers: employers.map((e) => ({
      id: e.id,
      name: e.name,
      website: e.website,
      activePositions: e.positions.length,
    })),
  }
}

async function listUpcomingInterviews(limit?: number) {
  const take = Math.min(Math.max(Number(limit) || 5, 1), 10)
  const interviews = await prisma.interview.findMany({
    where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
    take,
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      scheduledAt: true,
      location: true,
      candidate: { select: { name: true } },
      position: { select: { title: true } },
    },
  })
  return {
    count: interviews.length,
    interviews: interviews.map((i) => ({
      id: i.id,
      title: i.title,
      type: i.type,
      scheduledAt: i.scheduledAt,
      location: i.location,
      candidate: i.candidate?.name ?? null,
      position: i.position?.title ?? null,
    })),
  }
}

async function getStats() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [activePositions, totalCandidates, upcomingInterviews, hiredThisMonth, byStage] =
    await Promise.all([
      prisma.position.count({ where: { active: true } }),
      prisma.candidate.count(),
      prisma.interview.count({
        where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
      }),
      prisma.candidate.count({ where: { hiredAt: { gte: startOfMonth } } }),
      prisma.application.groupBy({ by: ["stage"], _count: { _all: true } }),
    ])

  return {
    activePositions,
    totalCandidates,
    upcomingInterviews,
    hiredThisMonth,
    applicationsByStage: byStage.map((s) => ({ stage: s.stage, count: s._count._all })),
  }
}

type ToolArgs = Record<string, unknown>

async function runTool(name: string, args: ToolArgs): Promise<object> {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
  try {
    switch (name) {
      case "search_positions":
        return await searchPositions(str(args.search), str(args.location))
      case "get_position_details": {
        const id = str(args.id)
        return id ? await getPositionDetails(id) : { error: "missing id" }
      }
      case "search_candidates":
        return await searchCandidates(str(args.search), str(args.location))
      case "get_candidate_details": {
        const id = str(args.id)
        return id ? await getCandidateDetails(id) : { error: "missing id" }
      }
      case "search_employers":
        return await searchEmployers(str(args.search))
      case "list_upcoming_interviews":
        return await listUpcomingInterviews(
          typeof args.limit === "number" ? args.limit : undefined
        )
      case "get_stats":
        return await getStats()
      default:
        return { error: "unknown tool" }
    }
  } catch (err) {
    console.error(`[avigdor-chat] tool "${name}" failed:`, err)
    return { error: "tool execution failed" }
  }
}

// ────────────────────────────────────────────────────────────────
//  בניית היסטוריית שיחה תקינה ל-Gemini (מתחילה ב-user ומתחלפת)
// ────────────────────────────────────────────────────────────────
function buildHistory(history: { role: "user" | "assistant"; content: string }[]): Content[] {
  const mapped: Content[] = history.map((h) => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.content }],
  }))
  // Gemini דורש שההיסטוריה תתחיל בתור "user" - מסירים הודעות פתיחה של המודל
  while (mapped.length && mapped[0].role === "model") mapped.shift()
  return mapped
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

    // ההודעה האחרונה בהיסטוריה היא ההודעה הנוכחית - לא כוללים אותה בהיסטוריית העבר
    const priorHistory = history.length && history[history.length - 1].role === "user"
      ? history.slice(0, -1)
      : history

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: AVIGDOR_PERSONA,
      tools: [{ functionDeclarations }],
    })

    const contents: Content[] = [
      ...buildHistory(priorHistory),
      { role: "user", parts: [{ text: message }] },
    ]

    // 3. לולאת סוכן: מריצים את המודל, מבצעים כלים שהוא מבקש, ומחזירים לו את התוצאות
    const usedTools: string[] = []
    let reply = ""

    for (let round = 0; round < 5; round++) {
      const result = await model.generateContent({ contents })
      const response = result.response
      const calls = response.functionCalls()

      if (calls && calls.length > 0) {
        // מוסיפים את תור המודל (בקשות הכלים) להקשר
        contents.push({
          role: "model",
          parts: calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })) as Part[],
        })

        // מריצים את כל הכלים ומחזירים תוצאות
        const responseParts: Part[] = []
        for (const call of calls) {
          usedTools.push(call.name)
          const data = await runTool(call.name, (call.args as ToolArgs) || {})
          responseParts.push({ functionResponse: { name: call.name, response: data } })
        }
        contents.push({ role: "function", parts: responseParts })
        continue // חוזרים למודל עם תוצאות הכלים
      }

      reply = response.text().trim()
      break
    }

    if (!reply) {
      reply = "מצטער, לא הצלחתי להרכיב תשובה כרגע. נסה לנסח את השאלה אחרת."
    }

    return NextResponse.json({ reply, tools: usedTools })
  } catch (error) {
    console.error("[avigdor-chat] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
