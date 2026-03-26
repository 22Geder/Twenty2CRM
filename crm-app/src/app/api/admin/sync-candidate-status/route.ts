import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// POST /api/admin/sync-candidate-status
// מסנכרן בין inProcessPositionId לבין employmentStatus לכל המועמדים
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. מועמדים עם inProcessPositionId אבל בלי employmentStatus = IN_PROCESS
    //    (לא EMPLOYED ולא REJECTED - כלומר "נתקעו" בלי סטטוס תקין)
    const needsInProcess = await prisma.candidate.findMany({
      where: {
        inProcessPositionId: { not: null },
        NOT: {
          employmentStatus: { in: ['EMPLOYED', 'REJECTED', 'IN_PROCESS'] }
        }
      },
      select: { id: true, name: true }
    })

    // 2. מועמדים עם employmentStatus = IN_PROCESS אבל בלי inProcessPositionId
    //    (קיבלו סטטוס ידני אבל לא שויכו למשרה - נחפש אם יש להם application פעיל)
    const inProcessNoPosition = await prisma.candidate.findMany({
      where: {
        employmentStatus: 'IN_PROCESS',
        inProcessPositionId: null,
      },
      select: {
        id: true,
        name: true,
        applications: {
          where: { status: { in: ['IN_PROCESS', 'SCREENING', 'NEW'] } },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { positionId: true }
        }
      }
    })

    // ביצוע עדכונים
    let updatedToInProcess = 0
    let updatedPosition = 0

    // עדכון קבוצה 1: הוספת employmentStatus = IN_PROCESS
    if (needsInProcess.length > 0) {
      const result = await prisma.candidate.updateMany({
        where: {
          id: { in: needsInProcess.map(c => c.id) }
        },
        data: { employmentStatus: 'IN_PROCESS' }
      })
      updatedToInProcess = result.count
    }

    // עדכון קבוצה 2: הוספת inProcessPositionId מה-application הפעיל
    for (const c of inProcessNoPosition) {
      const positionId = c.applications[0]?.positionId
      if (positionId) {
        await prisma.candidate.update({
          where: { id: c.id },
          data: {
            inProcessPositionId: positionId,
            inProcessAt: new Date(),
          }
        })
        updatedPosition++
      }
    }

    // סיכום מצב נוכחי אחרי תיקון
    const [totalInProcess, totalWithPosition, totalEmployed, totalRejected] = await Promise.all([
      prisma.candidate.count({ where: { employmentStatus: 'IN_PROCESS' } }),
      prisma.candidate.count({ where: { inProcessPositionId: { not: null } } }),
      prisma.candidate.count({ where: { employmentStatus: 'EMPLOYED' } }),
      prisma.candidate.count({ where: { employmentStatus: 'REJECTED' } }),
    ])

    return NextResponse.json({
      success: true,
      fixed: {
        addedInProcessStatus: updatedToInProcess,
        fixedPosition: updatedPosition,
        affectedCandidates: needsInProcess.map(c => c.name),
      },
      currentState: {
        totalInProcess,
        totalWithPositionId: totalWithPosition,
        totalEmployed,
        totalRejected,
      }
    })
  } catch (error) {
    console.error("Error syncing candidate status:", error)
    return NextResponse.json(
      { error: "Failed to sync" },
      { status: 500 }
    )
  }
}

// GET - להציג כמה מועמדים צריכים תיקון
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const needsInProcess = await prisma.candidate.count({
      where: {
        inProcessPositionId: { not: null },
        NOT: {
          employmentStatus: { in: ['EMPLOYED', 'REJECTED', 'IN_PROCESS'] }
        }
      }
    })

    const [totalInProcess, totalWithPosition] = await Promise.all([
      prisma.candidate.count({ where: { employmentStatus: 'IN_PROCESS' } }),
      prisma.candidate.count({ where: { inProcessPositionId: { not: null } } }),
    ])

    return NextResponse.json({
      needsSync: needsInProcess,
      currentState: {
        totalInProcess,
        totalWithPositionId: totalWithPosition,
        gap: totalWithPosition - totalInProcess,
      }
    })
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({ error: "Failed to check" }, { status: 500 })
  }
}
