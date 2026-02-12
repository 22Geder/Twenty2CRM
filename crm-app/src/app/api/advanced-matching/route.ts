import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import {
  analyzeResumeDeep,
  analyzePositionDeep,
  calculateAdvancedMatch,
  type DeepResumeAnalysis,
  type DeepPositionAnalysis,
  type AdvancedMatchResult
} from "@/lib/advanced-matching"

/**
 * 🚀 Advanced Matching V2 API
 * ניתוח מתקדם של מועמד מול משרה או מול כל המשרות
 */

// GET /api/advanced-matching?candidateId=X&positionId=Y (אופציונלי)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const candidateId = searchParams.get("candidateId")
  const positionId = searchParams.get("positionId") // אופציונלי
  const forceRefresh = searchParams.get("refresh") === "true"

  if (!candidateId) {
    return NextResponse.json({ error: "Missing candidateId" }, { status: 400 })
  }

  try {
    // קבל את המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // ניתוח עמוק של קורות החיים
    let resumeAnalysis: DeepResumeAnalysis
    
    // בדיקה אם יש ניתוח מתקדם שמור - aiProfile הוא String, צריך לפרסר
    let existingProfile: any = null
    try {
      if (candidate.aiProfile) {
        existingProfile = JSON.parse(candidate.aiProfile as string)
      }
    } catch (e) {
      existingProfile = null
    }
    
    if (existingProfile?.deepAnalysis && !forceRefresh) {
      resumeAnalysis = existingProfile.deepAnalysis as DeepResumeAnalysis
    } else {
      // ניתוח חדש
      resumeAnalysis = await analyzeResumeDeep(candidate.resume || "")
      
      // שמירה - צריך להמיר ל-JSON string
      const newProfile = {
        ...(existingProfile || {}),
        deepAnalysis: resumeAnalysis,
        lastAnalyzed: new Date().toISOString()
      }
      
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          aiProfile: JSON.stringify(newProfile)
        }
      })
    }

    // אם ביקשו משרה ספציפית
    if (positionId) {
      const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: { employer: true }
      })

      if (!position) {
        return NextResponse.json({ error: "Position not found" }, { status: 404 })
      }

      // ניתוח עמוק של המשרה
      let positionAnalysis: DeepPositionAnalysis
      let existingPosProfile: any = null
      try {
        if (position.aiProfile) {
          existingPosProfile = JSON.parse(position.aiProfile as string)
        }
      } catch (e) {
        existingPosProfile = null
      }
      
      if (existingPosProfile?.deepAnalysis && !forceRefresh) {
        positionAnalysis = existingPosProfile.deepAnalysis as DeepPositionAnalysis
      } else {
        positionAnalysis = await analyzePositionDeep(
          position.title,
          position.description || "",
          position.requirements || "",
          position.employer?.name || "",
          position.location || ""
        )
        
        const newPosProfile = {
          ...(existingPosProfile || {}),
          deepAnalysis: positionAnalysis,
          lastAnalyzed: new Date().toISOString()
        }
        
        await prisma.position.update({
          where: { id: positionId },
          data: {
            aiProfile: JSON.stringify(newPosProfile)
          }
        })
      }

      // חישוב התאמה מתקדם - עם טקסט קורות החיים לקריאה אנושית
      const matchResult = await calculateAdvancedMatch(resumeAnalysis, positionAnalysis, candidate.resume || '')

      return NextResponse.json({
        candidateId,
        candidateName: candidate.name,
        positionId,
        positionTitle: position.title,
        employerName: position.employer?.name,
        
        // ניתוח מועמד
        resumeAnalysis,
        
        // ניתוח משרה
        positionAnalysis,
        
        // תוצאת התאמה
        matchResult,
        
        // סיכום מהיר
        summary: {
          totalScore: matchResult.totalScore,
          shouldProceed: matchResult.recommendation.shouldProceed,
          confidence: matchResult.recommendation.confidence,
          topStrengths: matchResult.details.strengthPoints.slice(0, 3),
          topRisks: matchResult.details.riskPoints.slice(0, 3)
        }
      })
    }

    // אם לא ביקשו משרה ספציפית - התאמה מול כל המשרות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: { employer: true }
    })

    if (positions.length === 0) {
      return NextResponse.json({
        candidateId,
        candidateName: candidate.name,
        resumeAnalysis,
        matches: [],
        message: "No active positions available"
      })
    }

    // חישוב התאמות לכל המשרות
    const allMatches: Array<{
      positionId: string
      positionTitle: string
      employerName: string
      location: string
      matchResult: AdvancedMatchResult
    }> = []

    for (const position of positions) {
      try {
        // ניתוח משרה
        let positionAnalysis: DeepPositionAnalysis
        let existingPosProfile: any = null
        try {
          if (position.aiProfile) {
            existingPosProfile = JSON.parse(position.aiProfile as string)
          }
        } catch (e) {
          existingPosProfile = null
        }
        
        if (existingPosProfile?.deepAnalysis) {
          positionAnalysis = existingPosProfile.deepAnalysis as DeepPositionAnalysis
        } else {
          positionAnalysis = await analyzePositionDeep(
            position.title,
            position.description || "",
            position.requirements || "",
            position.employer?.name || "",
            position.location || ""
          )
          
          // שמור ברקע
          const newPosProfile = {
            ...(existingPosProfile || {}),
            deepAnalysis: positionAnalysis,
            lastAnalyzed: new Date().toISOString()
          }
          prisma.position.update({
            where: { id: position.id },
            data: {
              aiProfile: JSON.stringify(newPosProfile)
            }
          }).catch(() => {})
        }

        // חישוב התאמה - עם טקסט קורות החיים לקריאה אנושית
        const matchResult = await calculateAdvancedMatch(resumeAnalysis, positionAnalysis, candidate.resume || '')

        allMatches.push({
          positionId: position.id,
          positionTitle: position.title,
          employerName: position.employer?.name || 'לא צוין',
          location: position.location || 'לא צוין',
          matchResult
        })
      } catch (error) {
        console.error(`Error matching position ${position.id}:`, error)
      }
    }

    // מיון לפי ציון
    allMatches.sort((a, b) => b.matchResult.totalScore - a.matchResult.totalScore)

    return NextResponse.json({
      candidateId,
      candidateName: candidate.name,
      resumeAnalysis,
      totalPositions: positions.length,
      matchedPositions: allMatches.length,
      topMatches: allMatches.slice(0, 10).map(m => ({
        positionId: m.positionId,
        positionTitle: m.positionTitle,
        employerName: m.employerName,
        location: m.location,
        score: m.matchResult.totalScore,
        breakdown: m.matchResult.breakdown,
        shouldProceed: m.matchResult.recommendation.shouldProceed,
        confidence: m.matchResult.recommendation.confidence,
        matchedSkills: m.matchResult.details.matchedSkills.slice(0, 5),
        strengths: m.matchResult.details.strengthPoints.slice(0, 3),
        risks: m.matchResult.details.riskPoints.slice(0, 2),
        // 🧠 הוספת קריאה אנושית
        humanInsights: m.matchResult.details.humanInsights || [],
        humanReading: m.matchResult.humanReading || null
      })),
      allMatches
    })

  } catch (error) {
    console.error("Error in advanced matching:", error)
    return NextResponse.json(
      { error: "Failed to perform advanced matching" },
      { status: 500 }
    )
  }
}

// POST /api/advanced-matching - ניתוח טקסט קורות חיים חדש
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { resumeText, positionId } = body

    if (!resumeText) {
      return NextResponse.json(
        { error: "resumeText is required" },
        { status: 400 }
      )
    }

    // ניתוח עמוק של הטקסט
    const resumeAnalysis = await analyzeResumeDeep(resumeText)

    // אם יש משרה ספציפית
    if (positionId) {
      const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: { employer: true }
      })

      if (position) {
        const positionAnalysis = await analyzePositionDeep(
          position.title,
          position.description || "",
          position.requirements || "",
          position.employer?.name || "",
          position.location || ""
        )

        const matchResult = await calculateAdvancedMatch(resumeAnalysis, positionAnalysis, resumeText)

        return NextResponse.json({
          resumeAnalysis,
          positionAnalysis,
          matchResult,
          summary: {
            totalScore: matchResult.totalScore,
            shouldProceed: matchResult.recommendation.shouldProceed,
            explanation: matchResult.explanation
          }
        })
      }
    }

    // רק ניתוח קורות חיים
    return NextResponse.json({
      resumeAnalysis,
      message: "Resume analyzed successfully"
    })

  } catch (error) {
    console.error("Error in advanced matching POST:", error)
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    )
  }
}
