import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/applications/[id] - קבלת בקשה ספציפית
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
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            documents: true,
            tags: true,
          },
        },
        position: {
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
          },
        },
        interviews: {
          include: {
            scheduler: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { scheduledAt: "desc" },
        },
        communications: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

// PUT /api/applications/[id] - עדכון בקשה
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
    const { status, coverLetter, rejectionReason } = body

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        position: true,
      },
    })

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      coverLetter,
    }

    if (status) {
      updateData.status = status
      
      // If status is REJECTED, set rejection timestamp
      if (status === "REJECTED") {
        updateData.rejectedAt = new Date()
        updateData.rejectionReason = rejectionReason
      }
    }

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        candidate: true,
        position: {
          include: {
            employer: true,
          },
        },
      },
    })

    // Create activity log if status changed
    if (status && status !== existingApplication.status) {
      await prisma.activityLog.create({
        data: {
          type: "STATUS_CHANGED",
          description: `Application status changed from ${existingApplication.status} to ${status}`,
          applicationId: application.id,
          userId: (session.user as any)?.id,
        },
      })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

// DELETE /api/applications/[id] - מחיקת בקשה
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

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Delete application (cascade will delete related records)
    await prisma.application.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Application deleted successfully" })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    )
  }
}
