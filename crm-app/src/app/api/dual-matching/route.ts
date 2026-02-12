import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { performDualLayerMatching, generateCandidateQuickCard, CandidateCard, DualLayerMatchResult } from "@/lib/gemini-ai"

/**
 * 🎯 Dual-Layer Matching API
 * POST: מבצע ניתוח התאמה כפול עבור מועמד מול כל המשרות הפתוחות
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidateId, positionIds } = body

    if (!candidateId) {
      return NextResponse.json(
        { error: "חסר מזהה מועמד" },
        { status: 400 }
      )
    }

    // שליפת המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        tags: true,
        applications: {
          include: {
            position: {
              include: {
                employer: true
              }
            }
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "מועמד לא נמצא" },
        { status: 404 }
      )
    }

    // שליפת המשרות הפתוחות
    let positions
    if (positionIds && positionIds.length > 0) {
      // משרות ספציפיות
      positions = await prisma.position.findMany({
        where: {
          id: { in: positionIds },
          active: true
        },
        include: {
          employer: true,
          tags: true
        }
      })
    } else {
      // כל המשרות הפתוחות
      positions = await prisma.position.findMany({
        where: { active: true },
        include: {
          employer: true,
          tags: true
        }
      })
    }

    if (positions.length === 0) {
      return NextResponse.json(
        { 
          error: "אין משרות פתוחות",
          candidateCard: {
            fullName: candidate.name,
            city: candidate.city || 'לא צוין',
            age: 'לא צוין',
            phone: candidate.phone || 'לא צוין',
            email: candidate.email || 'לא צוין',
            hotTags: candidate.tags?.map((t: { name: string }) => t.name) || [],
            currentTitle: candidate.currentTitle || 'לא צוין',
            yearsExperience: candidate.yearsOfExperience || 0
          },
          bestMatch: null,
          allMatches: []
        },
        { status: 200 }
      )
    }

    // הכנת הדאטה לניתוח
    const candidateData = {
      name: candidate.name,
      phone: candidate.phone || undefined,
      email: candidate.email || undefined,
      city: candidate.city || undefined,
      age: undefined, // לא קיים בסכמה
      currentTitle: candidate.currentTitle || undefined,
      yearsOfExperience: candidate.yearsOfExperience || undefined,
      resumeText: candidate.resume || candidate.notes || '',
      skills: candidate.skills ? candidate.skills.split(',').map(s => s.trim()) : []
    }

    const positionsData = positions.map(pos => ({
      id: pos.id,
      title: pos.title,
      description: pos.description || undefined,
      requirements: pos.requirements || undefined,
      employerName: pos.employer?.name || undefined,
      location: pos.location || undefined,
      tags: pos.tags?.map((t: { name: string }) => t.name) || []
    }))

    // ביצוע הניתוח הכפול
    const result = await performDualLayerMatching(candidateData, positionsData)

    // שמירת הניתוח בלוג (אופציונלי)
    try {
      await prisma.activityLog.create({
        data: {
          type: 'dual_matching',
          description: `ניתוח התאמה כפול: ${candidate.name} - ${result.bestMatch?.positionTitle || 'אין התאמה'}`,
          metadata: JSON.stringify({
            candidateId: candidate.id,
            bestMatchScore: result.bestMatch?.weightedScore || 0,
            bestMatchPosition: result.bestMatch?.positionId || null,
            totalPositionsAnalyzed: positions.length
          })
        }
      })
    } catch (logError) {
      console.log("Could not log activity:", logError)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Dual matching API error:", error)
    return NextResponse.json(
      { error: "שגיאה בניתוח התאמה", details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET: שליפת כרטיס מועמד מהיר
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json(
        { error: "חסר מזהה מועמד" },
        { status: 400 }
      )
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "מועמד לא נמצא" },
        { status: 404 }
      )
    }

    // שליפת כל התגיות הזמינות
    const allTags = await prisma.tag.findMany({
      select: { name: true }
    })

    const candidateCard: CandidateCard = await generateCandidateQuickCard(
      {
        name: candidate.name,
        phone: candidate.phone || undefined,
        email: candidate.email || undefined,
        city: candidate.city || undefined,
        resumeText: candidate.resume || candidate.notes || ''
      },
      allTags.map(t => t.name)
    )

    return NextResponse.json({
      candidateCard,
      existingTags: candidate.tags?.map((t: { name: string }) => t.name) || []
    })

  } catch (error) {
    console.error("Get candidate card error:", error)
    return NextResponse.json(
      { error: "שגיאה בשליפת נתונים" },
      { status: 500 }
    )
  }
}
