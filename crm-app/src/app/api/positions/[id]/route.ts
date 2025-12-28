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

// GET /api/positions/[id] - קבלת משרה ספציפית
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        employer: true,
        department: true,
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        applications: {
          include: {
            candidate: true,
          },
          orderBy: { appliedAt: "desc" },
        },
        interviews: {
          include: {
            candidate: true,
            scheduler: true,
          },
          orderBy: { scheduledAt: "desc" },
        },
        tags: true,
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(position)
  } catch (error) {
    console.error("Error fetching position:", error)
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 }
    )
  }
}

// PUT /api/positions/[id] - עדכון משרה
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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
      closedAt,
    } = body

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
    })

    if (!existingPosition) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    const position = await prisma.position.update({
      where: { id },
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
        active,
        ruTitle,
        ruDescription,
        openings: openings ? parseInt(openings) : undefined,
        priority: priority ? parseInt(priority) : undefined,
        closedAt: closedAt ? new Date(closedAt) : undefined,
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    return NextResponse.json(position)
  } catch (error) {
    console.error("Error updating position:", error)
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    )
  }
}

// DELETE /api/positions/[id] - מחיקת משרה
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if position exists
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    // Warning if position has applications
    if (position._count.applications > 0) {
      const forceDelete = request.headers.get("x-force-delete") === "true"
      if (!forceDelete) {
        return NextResponse.json(
          {
            error: "Position has applications",
            message: `This position has ${position._count.applications} application(s). Use force delete to proceed.`,
            applicationsCount: position._count.applications,
          },
          { status: 409 }
        )
      }
    }

    // Delete position (cascade will delete related records)
    await prisma.position.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Position deleted successfully" })
  } catch (error) {
    console.error("Error deleting position:", error)
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    )
  }
}
