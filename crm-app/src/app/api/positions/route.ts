import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

function generatePositionKeywords(input: string, maxKeywords = 30): string[] {
  const stopwords = new Set([
    // Hebrew
    'של', 'עם', 'על', 'אל', 'את', 'אני', 'אנחנו', 'הוא', 'היא', 'הם', 'הן',
    'זה', 'זו', 'אלה', 'כמו', 'גם', 'או', 'אם', 'כי', 'אבל', 'יותר', 'פחות',
    'ניסיון', 'שנים', 'שנה', 'תפקיד', 'תפקידים', 'עבודה', 'משרה', 'משרות',
    'דרישות', 'אחריות', 'יתרון', 'חובה', 'כולל', 'כוללת', 'מתאים', 'מתאימה',
    // English
    'and', 'or', 'the', 'a', 'an', 'to', 'in', 'for', 'with', 'on', 'of', 'as',
    'experience', 'years', 'year', 'requirements', 'responsibilities', 'role', 'work',
  ])

  const tokens = (input || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stopwords.has(t))

  const counts = new Map<string, number>()
  for (const tok of tokens) counts.set(tok, (counts.get(tok) || 0) + 1)

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .filter((t, idx, arr) => arr.indexOf(t) === idx)
    .slice(0, maxKeywords)
}

// GET /api/positions - קבלת כל המשרות
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const active = searchParams.get("active")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ]
    }

    if (active !== null && active !== undefined) {
      where.active = active === "true"
    }

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          employer: true,
          department: true,
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
              interviews: true,
            },
          },
        },
      }),
      prisma.position.count({ where }),
    ])

    return NextResponse.json({
      positions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching positions:", error)
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    )
  }
}

// POST /api/positions - יצירת משרה חדשה
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      requirements,
      location,
      salaryRange,
      employmentType,
      departmentId,
      employerId,
      recruiterId,
      imageUrl,
      active,
      ruTitle,
      ruDescription,
      openings,
      priority,
    } = body

    // Validation
    if (!title || !employerId) {
      return NextResponse.json(
        { error: "Title and employer are required" },
        { status: 400 }
      )
    }

    // Check if employer exists
    const employer = await prisma.employer.findUnique({
      where: { id: employerId },
    })

    if (!employer) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 }
      )
    }

    const position = await prisma.position.create({
      data: {
        title,
        description,
        requirements,
        location,
        salaryRange,
        employmentType,
        departmentId,
        employerId,
        recruiterId,
        imageUrl,
        active: active || false,
        ruTitle,
        ruDescription,
        openings: openings ? parseInt(openings) : 1,
        priority: priority ? parseInt(priority) : 0,
      },
      include: {
        employer: true,
        department: true,
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    console.error("Error creating position:", error)
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    )
  }
}
