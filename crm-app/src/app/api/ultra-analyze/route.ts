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
  type HumanReadingResult
} from "@/lib/advanced-matching"

/**
 * 🧠 ULTRA AI Analyzer API
 * ניתוח AI מתקדם לקורות חיים ומשרות עבור לוח הגיוס והמועמדים
 */

// POST /api/ultra-analyze - ניתוח קורות חיים ULTRA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, includeMatching = true, candidateId, saveToCandidate = false } = body

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json(
        { error: "נדרש טקסט קורות חיים (מינימום 20 תווים)" },
        { status: 400 }
      )
    }

    console.log("🧠 ULTRA AI: Starting CV analysis...")

    // ניתוח עמוק של קורות החיים
    const resumeAnalysis = await analyzeResumeDeep(resumeText)
    
    console.log("✅ CV Analysis complete:", resumeAnalysis.personalInfo.fullName)

    // אם צריך לשמור למועמד קיים או ליצור חדש
    if (saveToCandidate) {
      try {
        if (candidateId) {
          // עדכון מועמד קיים
          await prisma.candidate.update({
            where: { id: candidateId },
            data: {
              name: resumeAnalysis.personalInfo.fullName || undefined,
              phone: resumeAnalysis.personalInfo.phone !== 'לא צוין' ? resumeAnalysis.personalInfo.phone : undefined,
              email: resumeAnalysis.personalInfo.email !== 'לא צוין' ? resumeAnalysis.personalInfo.email : undefined,
              city: resumeAnalysis.personalInfo.city !== 'לא צוין' ? resumeAnalysis.personalInfo.city : undefined,
              currentTitle: resumeAnalysis.workExperience.currentTitle || undefined,
              skills: resumeAnalysis.skills.technical.concat(resumeAnalysis.skills.professional).join(', '),
              resume: resumeText,
              aiProfile: JSON.stringify({
                deepAnalysis: resumeAnalysis,
                analyzedAt: new Date().toISOString()
              })
            }
          })
          console.log("✅ Updated candidate:", candidateId)
        }
      } catch (error) {
        console.error("Error saving to candidate:", error)
      }
    }

    // אם צריך גם התאמות למשרות
    let matches: any[] = []
    if (includeMatching) {
      const positions = await prisma.position.findMany({
        where: { active: true },
        include: { employer: true }
      })

      console.log(`🔍 Matching against ${positions.length} active positions...`)

      for (const position of positions) {
        try {
          // בדוק אם יש כבר ניתוח שמור למשרה
          let positionAnalysis: DeepPositionAnalysis
          let existingProfile: any = null
          try {
            if (position.aiProfile) {
              existingProfile = JSON.parse(position.aiProfile as string)
            }
          } catch (e) {
            existingProfile = null
          }
          
          if (existingProfile?.deepAnalysis) {
            positionAnalysis = existingProfile.deepAnalysis as DeepPositionAnalysis
          } else {
            positionAnalysis = await analyzePositionDeep(
              position.title,
              position.description || "",
              position.requirements || "",
              position.employer?.name || "",
              position.location || ""
            )
            
            // שמור ברקע
            const newProfile = {
              ...(existingProfile || {}),
              deepAnalysis: positionAnalysis,
              lastAnalyzed: new Date().toISOString()
            }
            prisma.position.update({
              where: { id: position.id },
              data: {
                aiProfile: JSON.stringify(newProfile)
              }
            }).catch(() => {})
          }

          // חישוב התאמה מתקדם
          const matchResult = await calculateAdvancedMatch(resumeAnalysis, positionAnalysis, resumeText)

          matches.push({
            positionId: position.id,
            positionTitle: position.title,
            employerName: position.employer?.name || 'לא צוין',
            location: position.location || 'לא צוין',
            score: matchResult.totalScore,
            breakdown: matchResult.breakdown,
            shouldProceed: matchResult.recommendation.shouldProceed,
            confidence: matchResult.recommendation.confidence,
            matchedSkills: matchResult.details.matchedSkills.slice(0, 5),
            missingSkills: matchResult.details.missingSkills.slice(0, 5),
            strengths: matchResult.details.strengthPoints.slice(0, 5),
            risks: matchResult.details.riskPoints.slice(0, 3),
            humanInsights: matchResult.details.humanInsights || [],
            humanReading: {
              whoIsThisPerson: matchResult.humanReading?.candidateUnderstanding?.whoIsThisPerson || '',
              psychologicalProfile: matchResult.humanReading?.candidateUnderstanding?.psychologicalProfile || '',
              fitScore: matchResult.humanReading?.jobFitAnalysis?.fitScore || 5,
              fitExplanation: matchResult.humanReading?.jobFitAnalysis?.fitExplanation || '',
              jobHoppingRisk: matchResult.humanReading?.currentStatus?.jobHoppingRisk || 'unknown',
              overqualifiedRisk: matchResult.humanReading?.jobFitAnalysis?.overqualifiedRisk || 'none',
              underqualifiedRisk: matchResult.humanReading?.jobFitAnalysis?.underqualifiedRisk || 'none',
              greenFlags: matchResult.humanReading?.flags?.greenFlags || [],
              yellowFlags: matchResult.humanReading?.flags?.yellowFlags || [],
              redFlags: matchResult.humanReading?.flags?.redFlags || [],
              hiddenSignals: matchResult.humanReading?.flags?.hiddenSignals || [],
              questionsToAsk: matchResult.humanReading?.jobFitAnalysis?.questionsToAsk || [],
              uniqueValue: matchResult.humanReading?.jobFitAnalysis?.uniqueValue || '',
              longevityPrediction: matchResult.humanReading?.jobFitAnalysis?.longevityPrediction || '',
              humanSummary: matchResult.humanReading?.humanSummary || '',
              recommendation: matchResult.humanReading?.recruiterRecommendation || ''
            },
            recruiterSummary: matchResult.recommendation.summaryForRecruiter,
            employerSummary: matchResult.recommendation.summaryForEmployer
          })
        } catch (error) {
          console.error(`Error matching position ${position.id}:`, error)
        }
      }

      // מיון לפי ציון
      matches.sort((a, b) => b.score - a.score)
      console.log(`✅ Found ${matches.length} matches`)
    }

    return NextResponse.json({
      success: true,
      resumeAnalysis: {
        personalInfo: resumeAnalysis.personalInfo,
        workExperience: resumeAnalysis.workExperience,
        education: resumeAnalysis.education,
        skills: resumeAnalysis.skills,
        industries: resumeAnalysis.industries,
        summary: resumeAnalysis.summary,
        seniorityLevel: resumeAnalysis.seniorityLevel,
        hotKeywords: resumeAnalysis.hotKeywords,
        matchedTags: resumeAnalysis.matchedTags
      },
      topMatches: matches.slice(0, 10),
      allMatches: matches.length,
      analyzedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("🔴 ULTRA Analysis error:", error)
    return NextResponse.json(
      { error: "שגיאה בניתוח ULTRA AI", details: String(error) },
      { status: 500 }
    )
  }
}

// GET /api/ultra-analyze?candidateId=X - ניתוח מועמד קיים
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const candidateId = searchParams.get("candidateId")

  if (!candidateId) {
    return NextResponse.json({ error: "Missing candidateId" }, { status: 400 })
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // בדוק אם יש ניתוח קיים - aiProfile הוא String
    let existingProfile: any = null
    try {
      if (candidate.aiProfile) {
        existingProfile = JSON.parse(candidate.aiProfile as string)
      }
    } catch (e) {
      existingProfile = null
    }
    
    if (existingProfile?.deepAnalysis) {
      return NextResponse.json({
        success: true,
        resumeAnalysis: existingProfile.deepAnalysis,
        analyzedAt: existingProfile.analyzedAt || 'unknown',
        fromCache: true
      })
    }

    // אם אין - בצע ניתוח חדש
    if (!candidate.resume || candidate.resume.length < 20) {
      return NextResponse.json({
        error: "אין קורות חיים לניתוח",
        candidateName: candidate.name
      }, { status: 400 })
    }

    const resumeAnalysis = await analyzeResumeDeep(candidate.resume)

    // שמור
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        aiProfile: JSON.stringify({
          deepAnalysis: resumeAnalysis,
          analyzedAt: new Date().toISOString()
        })
      }
    })

    return NextResponse.json({
      success: true,
      resumeAnalysis,
      analyzedAt: new Date().toISOString(),
      fromCache: false
    })

  } catch (error) {
    console.error("Error in ULTRA GET:", error)
    return NextResponse.json(
      { error: "שגיאה בניתוח" },
      { status: 500 }
    )
  }
}
