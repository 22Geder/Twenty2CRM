import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// POST /api/candidates/[id]/add-positions - הוספת מועמד למספר משרות בתהליך
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: candidateId } = await params
    const { positionIds } = await request.json()

    if (!positionIds || !Array.isArray(positionIds) || positionIds.length === 0) {
      return NextResponse.json(
        { error: "positionIds array is required" },
        { status: 400 }
      )
    }

    // בדיקה שהמועמד קיים
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // בדיקה שכל המשרות קיימות
    const positions = await prisma.position.findMany({
      where: { id: { in: positionIds } },
    })

    if (positions.length !== positionIds.length) {
      return NextResponse.json(
        { error: "Some positions not found" },
        { status: 404 }
      )
    }

    // יצירת/עדכון applications לכל משרה
    const results = []
    for (const positionId of positionIds) {
      try {
        // בדיקה אם כבר קיימת application
        const existing = await prisma.application.findUnique({
          where: {
            candidateId_positionId: {
              candidateId,
              positionId,
            },
          },
        })

        if (existing) {
          // עדכון הסטטוס אם כבר קיים
          const updated = await prisma.application.update({
            where: { id: existing.id },
            data: {
              status: "IN_PROCESS",
              stage: "IN_PROCESS",
              updatedAt: new Date(),
            },
            include: {
              position: {
                include: {
                  employer: true,
                },
              },
            },
          })
          results.push({ positionId, action: "updated", application: updated })
        } else {
          // יצירת application חדש
          const created = await prisma.application.create({
            data: {
              candidateId,
              positionId,
              status: "IN_PROCESS",
              stage: "IN_PROCESS",
              source: "MANUAL",
            },
            include: {
              position: {
                include: {
                  employer: true,
                },
              },
            },
          })
          results.push({ positionId, action: "created", application: created })
        }
      } catch (err: any) {
        results.push({ positionId, action: "error", error: err.message })
      }
    }

    // עדכון המועמד - שינוי לסטטוס "בתהליך" עם המשרה הראשונה
    const firstPositionId = positionIds[0]
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        employmentStatus: 'IN_PROCESS', // 🆕 עדכון סטטוס המועמד לבתהליך!
        inProcessPositionId: candidate.inProcessPositionId || firstPositionId,
        inProcessAt: candidate.inProcessAt || new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      addedCount: results.filter(r => r.action === "created").length,
      updatedCount: results.filter(r => r.action === "updated").length,
      results,
    })
  } catch (error) {
    console.error("Error adding positions:", error)
    return NextResponse.json(
      { error: "Failed to add positions" },
      { status: 500 }
    )
  }
}

// GET /api/candidates/[id]/add-positions - שליפת כל המשרות שהמועמד בתהליך עבורן
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: candidateId } = await params

    // שליפת כל ה-applications שהמועמד בתהליך עבורן
    const applications = await prisma.application.findMany({
      where: {
        candidateId,
        OR: [
          { status: "IN_PROCESS" },
          { stage: "IN_PROCESS" },
        ],
      },
      include: {
        position: {
          include: {
            employer: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    })

    return NextResponse.json({
      positions: applications.map(app => ({
        id: app.position.id,
        title: app.position.title,
        employer: app.position.employer,
        appliedAt: app.appliedAt,
        applicationId: app.id,
      })),
    })
  } catch (error) {
    console.error("Error fetching in-process positions:", error)
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    )
  }
}

// DELETE /api/candidates/[id]/add-positions - הסרת מועמד ממשרה בתהליך
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: candidateId } = await params
    const { positionId } = await request.json()

    if (!positionId) {
      return NextResponse.json(
        { error: "positionId is required" },
        { status: 400 }
      )
    }

    // מחיקת ה-application
    await prisma.application.deleteMany({
      where: {
        candidateId,
        positionId,
      },
    })

    // אם זו המשרה הראשית, מעדכנים לאחת אחרת או מנקים
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (candidate && candidate.inProcessPositionId === positionId) {
      // מחפשים משרה אחרת בתהליך
      const nextApplication = await prisma.application.findFirst({
        where: {
          candidateId,
          OR: [
            { status: "IN_PROCESS" },
            { stage: "IN_PROCESS" },
          ],
        },
      })

      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          inProcessPositionId: nextApplication?.positionId || null,
          inProcessAt: nextApplication ? candidate.inProcessAt : null,
          // 🔄 אם אין יותר משרות בתהליך - נקה את סטטוס IN_PROCESS
          ...((!nextApplication && candidate.employmentStatus === 'IN_PROCESS') && {
            employmentStatus: null,
          }),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing position:", error)
    return NextResponse.json(
      { error: "Failed to remove position" },
      { status: 500 }
    )
  }
}
