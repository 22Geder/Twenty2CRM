import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import {
  GoogleGenerativeAI,
  FunctionDeclarationSchemaType,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai"
import { scoreCandidateAgainstPosition } from "@/lib/avigdor-fast-match"
import { lookupCrmHowTo } from "@/lib/avigdor-system-knowledge"
import {
  AVIGDOR_CHAT_LIMITS,
  AvigdorChatBudget,
  AvigdorChatRequestLimiter,
  AvigdorChatTimeoutError,
  avigdorChatBodySchema,
  avigdorToolCallSchema,
  buildAvigdorContents,
  getAvigdorMatchingNotice,
  type AvigdorToolCall,
} from "@/lib/avigdor-chat-helpers"

// 🦁 "אביגדור" - עוזר ה-AI הפנימי של 22JOBS בתוך ה-CRM.
// אותה אישיות/מוח כמו הבוט הטלפוני/וואטסאפ - אבל כאן משמש את הצוות הפנימי (מגייסים).
// כאן הוא סוכן חכם עם "כלים" (function-calling): הוא מחליט בעצמו באילו כלים להשתמש,
// שולף מידע חי מכל המערכת (משרות, מועמדים, מעסיקים, ראיונות, סטטיסטיקות, מאצ'ינג) ומנסח תשובה.
// גישה לקריאה בלבד - אינו יוצר/מעדכן/מוחק כלום. נדרש חשבון פעיל ולא נעול בכל בקשה.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
// לכל משתמש: 10 בקשות בדקה ואחת במקביל, בזיכרון המופע בלבד (לא מגבלה מבוזרת).
const chatRequestLimiter = new AvigdorChatRequestLimiter()

const AVIGDOR_PERSONA = `
אתה אביגדור, העוזר הדיגיטלי הפנימי של חברת ההשמה "22JOBS" (חברת כוח אדם והשמה בישראל בע"מ).
אתה עוזר לצוות המגייסים הפנימי של החברה בתוך מערכת ה-CRM - לא מדבר עם מועמדים או מעסיקים חיצוניים.
דבר עברית טבעית, קצרה, ידידותית ומקצועית, בגוף זכר.

יש לך גישה לכלים (functions) ששולפים מידע חי מהמערכת, וגם כלי הסבר על איך המערכת עובדת. תמיד השתמש בכלים כדי לענות - אל תמציא נתונים.
- אם שואלים איך משתמשים ב-CRM / איפה מסך / איך מעלים קו"ח / איך מסמנים התקבל / סטטוס חודשי או שנתי / איפה רואים מגייסים / איך עושים מאצ'ינג בממשק - השתמש ב-explain_crm. הכלי הזה לא שולף נתונים חיים.
- אם שואלים על משרות פנויות/מועמדים/מעסיקים - חפש עם הכלי המתאים.
- אם שואלים "כמה", "מה המצב", "סטטוס", "סיכום" וכו' - השתמש ב-get_stats.
- אם שואלים על ראיונות קרובים - השתמש ב-list_upcoming_interviews.
- אם שואלים על התאמה / מאצ'ינג / "משרות למועמד" / "מי מתאים למשרה" על נתונים חיים - השתמש ב-match_candidate_to_positions או match_position_to_candidates.
- אתה יכול לקרוא לכמה כלים ברצף כדי להרכיב תשובה מלאה (למשל לחפש מועמד ואז להביא פרטים מלאים או מאצ'ינג).
- אם רוצים פרטים מלאים על משרה/מועמד ספציפי - קרא ל-get_position_details / get_candidate_details עם ה-id שקיבלת מחיפוש.
- אם בהודעה יש "הקשר מסך" עם id של מועמד/משרה - זה מה שהמגייס רואה עכשיו. "המועמד הזה" / "המשרה הזאת" / "תתאים אותו" מתייחס ל-id הזה. אל תבקש id מחדש.

כללי זהב:
- ענה אך ורק על סמך המידע שחזר מהכלים. אם כלי החזיר רשימה ריקה - אמור בבירור שלא נמצא, והצע לנסח אחרת (עיר/תחום/שם).
- שגיאת כלי אינה רשימה ריקה: אמור שהבדיקה לא הושלמה, ואל תמציא תוצאה.
- מאצ'ינג בודק לכל היותר ${AVIGDOR_CHAT_LIMITS.positions} משרות פעילות או ${AVIGDOR_CHAT_LIMITS.candidates} מועמדים לפי סדר המיון הקיים, לא את כל המאגר. ציון 0-100 הוא דירוג היוריסטי ולא אחוז התאמה סטטיסטי או הסתברות להצלחה.
- אל תחשוף מיילים/טלפונים של מועמדים אלא אם המגייס ביקש זאת במפורש.
- אל תמציא סיסמאות, מיילים או טלפונים.
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
  {
    name: "match_candidate_to_positions",
    description:
      `מאצ'ינג מהיר מתוך עד ${AVIGDOR_CHAT_LIMITS.positions} משרות פעילות לפי עדיפות ותאריך יצירה, לא מכל המאגר: התאמה למועמד לפי id (מיקום + תגיות + תפקיד + כישורים). מחזיר עד 5 משרות עם דירוג היוריסטי 0-100, לא אחוז סטטיסטי. השתמש כששואלים 'תתאים אותו', 'משרות למועמד', 'מה מתאים ל...'.`,
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        candidateId: { type: FunctionDeclarationSchemaType.STRING, description: "מזהה המועמד (uuid)." },
      },
      required: ["candidateId"],
    },
  },
  {
    name: "match_position_to_candidates",
    description:
      `מאצ'ינג מהיר מתוך עד ${AVIGDOR_CHAT_LIMITS.candidates} מועמדים לפי ציון קיים ותאריך יצירה, לא מכל המאגר: התאמה למשרה לפי id (מיקום + תגיות + תפקיד + כישורים). מחזיר עד 5 מועמדים עם דירוג היוריסטי 0-100, לא אחוז סטטיסטי, בלי טלפון/מייל. השתמש כששואלים 'מי מתאים למשרה', 'תמצא מועמדים למשרה הזאת'.`,
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        positionId: { type: FunctionDeclarationSchemaType.STRING, description: "מזהה המשרה (uuid)." },
      },
      required: ["positionId"],
    },
  },
  {
    name: "explain_crm",
    description:
      "מסביר איך להשתמש במערכת ה-CRM (מסכים, העלאת קו\"ח, מאצ'ינג, תהליכי עבודה). לא שולף נתונים חיים.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        question: {
          type: FunctionDeclarationSchemaType.STRING,
          description: "שאלת המגייס על שימוש במערכת. למשל: איך מעלים קו\"ח, איפה המשרות, איך עושים מאצ'ינג.",
        },
      },
      required: ["question"],
    },
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

async function matchCandidateToPositions(candidateId: string, budget: AvigdorChatBudget) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      name: true,
      currentTitle: true,
      city: true,
      yearsOfExperience: true,
      skills: true,
      tags: { select: { id: true, name: true } },
    },
  })
  if (!candidate) return { found: false }

  // Prisma אינו מבטל שאילתה שכבר נשלחה; אחרי timeout לא מתחילים את הקריאה הבאה.
  budget.remainingMs()
  const positions = await prisma.position.findMany({
    where: { active: true },
    take: AVIGDOR_CHAT_LIMITS.positions,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      location: true,
      description: true,
      requirements: true,
      salaryRange: true,
      employmentType: true,
      employer: { select: { name: true } },
      tags: { select: { id: true, name: true } },
    },
  })

  budget.remainingMs()
  const candidateTagIds = candidate.tags.map((t) => t.id)

  const matches = positions
    .map((p) => {
      const scored = scoreCandidateAgainstPosition({
        candidateCity: candidate.city,
        candidateTitle: candidate.currentTitle,
        candidateSkills: candidate.skills,
        candidateTagIds,
        candidateTags: candidate.tags,
        position: p,
      })
      return {
        id: p.id,
        title: p.title,
        employer: p.employer?.name ?? null,
        location: p.location,
        salaryRange: p.salaryRange,
        employmentType: p.employmentType,
        score: scored.score,
        distanceKm: scored.distanceKm,
        matchingTags: scored.matchingTags,
      }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return {
    found: true,
    candidate: {
      id: candidate.id,
      name: candidate.name,
      currentTitle: candidate.currentTitle,
      city: candidate.city,
      yearsOfExperience: candidate.yearsOfExperience,
    },
    count: matches.length,
    matches,
    matchingScope: {
      limit: AVIGDOR_CHAT_LIMITS.positions,
      evaluated: positions.length,
      notice: getAvigdorMatchingNotice(["match_candidate_to_positions"]),
    },
  }
}

async function matchPositionToCandidates(positionId: string, budget: AvigdorChatBudget) {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    select: {
      id: true,
      title: true,
      location: true,
      description: true,
      requirements: true,
      employer: { select: { name: true } },
      tags: { select: { id: true, name: true } },
    },
  })
  if (!position) return { found: false }

  budget.remainingMs()
  const candidates = await prisma.candidate.findMany({
    take: AVIGDOR_CHAT_LIMITS.candidates,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      currentTitle: true,
      city: true,
      yearsOfExperience: true,
      skills: true,
      score: true,
      tags: { select: { id: true, name: true } },
    },
  })

  budget.remainingMs()
  const matches = candidates
    .map((c) => {
      const scored = scoreCandidateAgainstPosition({
        candidateCity: c.city,
        candidateTitle: c.currentTitle,
        candidateSkills: c.skills,
        candidateTagIds: c.tags.map((t) => t.id),
        candidateTags: c.tags,
        position,
      })
      return {
        id: c.id,
        name: c.name,
        currentTitle: c.currentTitle,
        city: c.city,
        yearsOfExperience: c.yearsOfExperience,
        score: scored.score,
        distanceKm: scored.distanceKm,
        matchingTags: scored.matchingTags,
      }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return {
    found: true,
    position: {
      id: position.id,
      title: position.title,
      employer: position.employer?.name ?? null,
      location: position.location,
    },
    count: matches.length,
    matches,
    matchingScope: {
      limit: AVIGDOR_CHAT_LIMITS.candidates,
      evaluated: candidates.length,
      notice: getAvigdorMatchingNotice(["match_position_to_candidates"]),
    },
  }
}

async function runTool(call: AvigdorToolCall, budget: AvigdorChatBudget): Promise<object> {
  try {
    switch (call.name) {
      case "search_positions":
        return await searchPositions(call.args.search, call.args.location)
      case "get_position_details":
        return await getPositionDetails(call.args.id)
      case "search_candidates":
        return await searchCandidates(call.args.search, call.args.location)
      case "get_candidate_details":
        return await getCandidateDetails(call.args.id)
      case "search_employers":
        return await searchEmployers(call.args.search)
      case "list_upcoming_interviews":
        return await listUpcomingInterviews(call.args.limit)
      case "get_stats":
        return await getStats()
      case "match_candidate_to_positions":
        return await matchCandidateToPositions(call.args.candidateId, budget)
      case "match_position_to_candidates":
        return await matchPositionToCandidates(call.args.positionId, budget)
      case "explain_crm":
        return { snippets: lookupCrmHowTo(call.args.question) }
    }
  } catch (err) {
    if (err instanceof AvigdorChatTimeoutError) throw err
    // השם נלקח מרשימה מאומתת; לא רושמים שגיאות SDK/Prisma, ארגומנטים או PII.
    console.error("[avigdor-chat] Tool execution failed", { tool: call.name })
    return { error: "tool execution failed", code: "TOOL_EXECUTION_FAILED" }
  }
}

export async function POST(request: NextRequest) {
  const budget = new AvigdorChatBudget()
  let releaseRequest: (() => void) | undefined
  try {
    // 1. בודקים חשבון עדכני, לא רק JWT שעלול להישאר תקף אחרי חסימה/מחיקה.
    const auth = await budget.run(() => requireApiUser())
    if ("response" in auth) return auth.response

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    // 2. Validate input
    const parsed = avigdorChatBodySchema.safeParse(await budget.run(() => request.json().catch(() => null)))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { message, history, pageContext } = parsed.data

    const permit = chatRequestLimiter.acquire(auth.user.id)
    if (!("release" in permit)) {
      return NextResponse.json({ error: "Chat request limit reached", code: permit.code }, {
        status: permit.status,
        headers: { "Retry-After": String(permit.retryAfterSeconds), "Cache-Control": "private, no-store" },
      })
    }
    releaseRequest = permit.release

    let userMessage = message
    if (pageContext) {
      const kind = pageContext.type === "candidate" ? "מועמד" : "משרה"
      userMessage =
        `[הקשר מסך: המגייס צופה כרגע ב${kind} id=${pageContext.id}. ` +
        `אם אומר "הזה/הזאת/אותו/אותה/תתאים" - זה ה-id לשימוש בכלים.]\n${message}`
    }

    const modelParams = {
      // 🔒 מודל ייעודי לאביגדור עם ברירת מחדל בטוחה ומוכחת (gemini-2.5-flash).
      // מכוון: לא נופלים ל-GEMINI_MODEL הגלובלי, כדי שהחלפת מודל גלובלית (למשל ל-3.x
      // לניתוח קו"ח) לא תשבור את לולאת ה-function-calling הרב-שלבית של אביגדור -
      // מודלי Gemini 3.x אינם תואמים ל-SDK v0.11.5 בסבב תוצאות-כלי (role לא נתמך).
      model: process.env.AVIGDOR_MODEL || "gemini-2.5-flash",
      systemInstruction: AVIGDOR_PERSONA,
      tools: [{ functionDeclarations }],
      generationConfig: { maxOutputTokens: AVIGDOR_CHAT_LIMITS.maxOutputTokens },
    }

    const contents = buildAvigdorContents(history, message, userMessage)

    // 3. לולאת סוכן: מריצים את המודל, מבצעים כלים שהוא מבקש, ומחזירים לו את התוצאות
    const usedTools: string[] = []
    let toolCalls = 0
    let reply = ""

    for (let round = 0; round < AVIGDOR_CHAT_LIMITS.modelRounds; round++) {
      const result = await budget.run((timeoutMs) => {
        // SDK 0.11.5: RequestOptions הוא הארגומנט השני; ה-SDK מבטל fetch שפג זמנו.
        const model = genAI.getGenerativeModel(modelParams, { timeout: timeoutMs })
        return model.generateContent({ contents })
      }, AVIGDOR_CHAT_LIMITS.modelTimeoutMs)
      const response = result.response
      const calls = response.functionCalls()

      if (calls && calls.length > 0) {
        // אין ביצוע חלקי של אצווה, או קריאות שלא נשאר סבב מודל לעבד את תוצאותיהן.
        if (calls.length > AVIGDOR_CHAT_LIMITS.toolCalls - toolCalls || round === AVIGDOR_CHAT_LIMITS.modelRounds - 1) {
          reply = "הגעתי למגבלת הקריאות לבקשה זו; הבדיקה לא הושלמה. נסה בקשה ממוקדת יותר."
          break
        }
        toolCalls += calls.length
        // מוסיפים את תור המודל (בקשות הכלים) להקשר
        contents.push({
          role: "model",
          parts: calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })) as Part[],
        })

        // מריצים את כל הכלים ומחזירים תוצאות
        const responseParts: Part[] = []
        for (const call of calls) {
          budget.remainingMs()
          const parsedCall = avigdorToolCallSchema.safeParse({
            name: call.name,
            args: call.args === undefined ? {} : call.args,
          })
          let data: object = { error: "Invalid tool arguments", code: "INVALID_TOOL_CALL" }
          if (parsedCall.success) {
            usedTools.push(parsedCall.data.name)
            data = await budget.run(
              () => runTool(parsedCall.data, budget),
              AVIGDOR_CHAT_LIMITS.toolTimeoutMs
            )
          }
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

    // ההבהרה נשמרת גם אם המודל השמיט אותה; חוזה התשובה נשאר reply + tools.
    const matchingNotice = getAvigdorMatchingNotice(usedTools)
    if (matchingNotice) reply += `\n\n${matchingNotice}`
    return NextResponse.json({ reply, tools: usedTools })
  } catch (error) {
    if (error instanceof AvigdorChatTimeoutError) {
      console.error("[avigdor-chat] Request timed out")
      return NextResponse.json({ error: "Request timed out", code: "CHAT_TIMEOUT" }, { status: 504 })
    }
    console.error("[avigdor-chat] Request failed")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    // גם שגיאה/timeout משחררים מקביליות, אך לא מוחקים את מכסת הבקשות בדקה.
    releaseRequest?.()
  }
}
