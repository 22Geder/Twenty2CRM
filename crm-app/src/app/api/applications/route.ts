import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/applications - קבלת כל הבקשות
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const candidateId = searchParams.get("candidateId")
    const positionId = searchParams.get("positionId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (candidateId) {
      where.candidateId = candidateId
    }

    if (positionId) {
      where.positionId = positionId
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: "desc" },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              rating: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              location: true,
              employer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              interviews: true,
              communications: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ])

    return NextResponse.json({
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

// POST /api/applications - יצירת בקשה חדשה
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, positionId, status, coverLetter } = body

    // Validation
    if (!candidateId || !positionId) {
      return NextResponse.json(
        { error: "Candidate ID and Position ID are required" },
        { status: 400 }
      )
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // Check if position exists
    const position = await prisma.position.findUnique({
      where: { id: positionId },
    })

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    // Check if application already exists
    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateId_positionId: {
          candidateId,
          positionId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "Application already exists for this candidate and position" },
        { status: 409 }
      )
    }

    const application = await prisma.application.create({
      data: {
        candidateId,
        positionId,
        status: status || "NEW",
        coverLetter,
      },
      include: {
        candidate: true,
        position: {
          include: {
            employer: true,
          },
        },
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        type: "CANDIDATE_APPLIED",
        description: `${candidate.name} applied for ${position.title}`,
        applicationId: application.id,
        userId: (session.user as any)?.id,
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    )
  }
}
