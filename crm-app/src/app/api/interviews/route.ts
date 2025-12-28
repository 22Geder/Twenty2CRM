import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/interviews - קבלת כל הראיונות
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
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
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

    if (fromDate || toDate) {
      where.scheduledAt = {}
      if (fromDate) {
        where.scheduledAt.gte = new Date(fromDate)
      }
      if (toDate) {
        where.scheduledAt.lte = new Date(toDate)
      }
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: "asc" },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              employer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          scheduler: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          application: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.interview.count({ where }),
    ])

    return NextResponse.json({
      interviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    )
  }
}

// POST /api/interviews - יצירת ראיון חדש
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      type,
      scheduledAt,
      duration,
      location,
      meetingUrl,
      notes,
      applicationId,
      positionId,
      candidateId,
      schedulerId,
      status,
    } = body

    // Validation
    if (!title || !type || !scheduledAt || !applicationId || !positionId || !candidateId || !schedulerId) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    const interview = await prisma.interview.create({
      data: {
        title,
        type,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration) || 60,
        location,
        meetingUrl,
        notes,
        applicationId,
        positionId,
        candidateId,
        schedulerId,
        status: status || "SCHEDULED",
      },
      include: {
        candidate: true,
        position: {
          include: {
            employer: true,
          },
        },
        scheduler: true,
        application: true,
      },
    })

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    console.error("Error creating interview:", error)
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    )
  }
}
