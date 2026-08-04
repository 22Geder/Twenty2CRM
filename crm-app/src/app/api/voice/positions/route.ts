import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 🔒 Endpoint מאובטח לבוט הקולי (OpenAI Realtime).
// מוגן ב-API key ייעודי (VOICE_API_KEY) - לא דורש session כי הבוט לא "מתחבר".
// לא חושף PII של מגייסים/מיילים - רק מידע ציבורי על משרות.

const querySchema = z.object({
  search: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  id: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
})

function safeParseKeywords(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : []
  } catch {
    return []
  }
}

// מנקה טקסט ארוך לתמצית מתאימה להקראה בקול
function summarize(text: string | null, maxLen = 400): string | null {
  if (!text) return null
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + "…" : clean
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth - API key ייעודי לבוט הקולי
    const apiKey = request.headers.get("x-api-key")
    const expected = process.env.VOICE_API_KEY
    if (!expected) {
      console.error("[voice/positions] VOICE_API_KEY not configured")
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
    if (!apiKey || apiKey !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Validate query
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      search: searchParams.get("search") || undefined,
      location: searchParams.get("location") || undefined,
      id: searchParams.get("id") || undefined,
      limit: searchParams.get("limit") || undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { search, location, id, limit } = parsed.data

    // 3. פרטי משרה בודדת לפי id
    if (id) {
      const position = await prisma.position.findFirst({
        where: { id, active: true },
        include: { employer: { select: { name: true } } },
      })
      if (!position) {
        return NextResponse.json({ error: "Position not found" }, { status: 404 })
      }
      return NextResponse.json({
        position: {
          id: position.id,
          title: position.title,
          employer: position.employer?.name ?? null,
          location: position.location,
          description: summarize(position.description),
          requirements: summarize(position.requirements),
          salaryRange: position.salaryRange,
          employmentType: position.employmentType,
          workHours: position.workHours,
          benefits: summarize(position.benefits, 200),
          transportation: position.transportation,
          openings: position.openings,
        },
      })
    }

    // 4. חיפוש משרות פעילות
    const where: any = { active: true }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { keywords: { contains: search, mode: "insensitive" } },
      ]
    }
    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    const positions = await prisma.position.findMany({
      where,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { employer: { select: { name: true } } },
    })

    return NextResponse.json({
      count: positions.length,
      positions: positions.map((p) => ({
        id: p.id,
        title: p.title,
        employer: p.employer?.name ?? null,
        location: p.location,
        salaryRange: p.salaryRange,
        employmentType: p.employmentType,
        keywords: safeParseKeywords(p.keywords).slice(0, 8),
      })),
    })
  } catch (error) {
    console.error("[voice/positions] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
