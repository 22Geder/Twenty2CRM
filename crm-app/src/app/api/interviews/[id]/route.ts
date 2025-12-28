import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/interviews/[id] - קבלת ראיון ספציפי
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
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            applications: {
              where: {
                positionId: undefined, // Will be filtered by the application relation
              },
            },
          },
        },
        position: {
          include: {
            employer: true,
            department: true,
          },
        },
        scheduler: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        application: {
          include: {
            activityLogs: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    })

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(interview)
  } catch (error) {
    console.error("Error fetching interview:", error)
    return NextResponse.json(
      { error: "Failed to fetch interview" },
      { status: 500 }
    )
  }
}

// PUT /api/interviews/[id] - עדכון ראיון
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
      type,
      scheduledAt,
      duration,
      location,
      meetingUrl,
      notes,
      feedback,
      rating,
      status,
    } = body

    // Check if interview exists
    const existingInterview = await prisma.interview.findUnique({
      where: { id },
    })

    if (!existingInterview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      )
    }

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        title,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        location,
        meetingUrl,
        notes,
        feedback,
        rating: rating ? parseInt(rating) : undefined,
        status,
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

    return NextResponse.json(interview)
  } catch (error) {
    console.error("Error updating interview:", error)
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    )
  }
}

// DELETE /api/interviews/[id] - מחיקת ראיון
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

    // Check if interview exists
    const interview = await prisma.interview.findUnique({
      where: { id },
    })

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      )
    }

    // Delete interview
    await prisma.interview.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Interview deleted successfully" })
  } catch (error) {
    console.error("Error deleting interview:", error)
    return NextResponse.json(
      { error: "Failed to delete interview" },
      { status: 500 }
    )
  }
}
