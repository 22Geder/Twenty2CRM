import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import {
  analyzeResumeWithGemini,
  analyzeJobDescriptionWithGemini,
  calculateMatchScoreWithGemini,
  improveMatchingWithFeedback,
} from "@/lib/gemini-ai"
import { 
  findMatchingTags, 
  getUniqueCategories, 
  calculateTagMatchScore,
  findRelatedCategories,
  RECRUITMENT_TAGS,
  type MatchedTag 
} from "@/lib/recruitment-tags"
import {
  analyzeResumeDeep,
  analyzePositionDeep,
  calculateAdvancedMatch,
  type DeepResumeAnalysis,
  type DeepPositionAnalysis
} from "@/lib/advanced-matching"

/**
 * GET /api/smart-matching/matches?candidateId=X
 * מחזיר התאמות אוטומטיות למועמד מול כל המשרות במערכת
 */
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
    // קבל את המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // קבל את כל המשרות הפעילות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: { employer: true },
    })

    if (positions.length === 0) {
      return NextResponse.json({
        candidateName: candidate.name,
        matches: [],
        message: "No active positions available",
      })
    }

    // ניתוח קורות חיים של המועמד (אם עדיין לא נעשה)
    let candidateProfile: any = null
    try {
      if (candidate.aiProfile) {
        candidateProfile = JSON.parse(candidate.aiProfile as string)
      }
    } catch (e) {
      candidateProfile = null
    }

    if (!candidateProfile) {
      candidateProfile = await analyzeResumeWithGemini(candidate.resume || "")
      // שמור את הפרופיל
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { aiProfile: JSON.stringify(candidateProfile) },
      })
    }

    // עבור כל משרה, חשב התאמה
    const matches = []

    // 🆕 Calculate candidate's recruitment tags once
    const candidateText = `${candidate.name} ${candidate.currentTitle || ''} ${candidate.skills || ''} ${candidate.resume || ''}`
    const candidateRecruitmentTags = findMatchingTags(candidateText)
    const candidateCategories = getUniqueCategories(candidateRecruitmentTags)
    const candidateTagKeywords = candidateRecruitmentTags.map(t => t.keyword)

    for (const position of positions) {
      try {
        // ניתוח תיאור המשרה (אם עדיין לא נעשה)
        let jobProfile: any = null
        try {
          if (position.aiProfile) {
            jobProfile = JSON.parse(position.aiProfile as string)
          }
        } catch (e) {
          jobProfile = null
        }

        if (!jobProfile) {
          jobProfile = await analyzeJobDescriptionWithGemini(position.description || "")
          // שמור את הפרופיל
          await prisma.position.update({
            where: { id: position.id },
            data: { aiProfile: JSON.stringify(jobProfile) },
          })
        }

        // 🆕 Calculate position's recruitment tags
        const positionText = `${position.title} ${position.description || ''} ${position.requirements || ''}`
        const positionRecruitmentTags = findMatchingTags(positionText)
        const positionCategories = getUniqueCategories(positionRecruitmentTags)
        const positionTagKeywords = positionRecruitmentTags.map(t => t.keyword)

        // 🆕 Calculate tag-based match score
        const tagMatch = calculateTagMatchScore(candidateTagKeywords, positionTagKeywords)
        
        // חשב ניקוד התאמה
        const matchResult = await calculateMatchScoreWithGemini(candidateProfile, jobProfile)

        // 🆕 Combine AI score with tag score (weight: 70% AI, 30% tags)
        const combinedScore = Math.round(
          (matchResult.score * 0.7) + (tagMatch.score * 0.3)
        )

        // 🆕 Check for category match bonus
        const categoryOverlap = candidateCategories.filter(c => positionCategories.includes(c))
        const categoryBonus = categoryOverlap.length > 0 ? 5 : 0

        matches.push({
          positionId: position.id,
          positionTitle: position.title,
          employerName: position.employer?.name,
          matchScore: Math.min(100, combinedScore + categoryBonus),
          reasoning: matchResult.reasoning,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          experienceFit: matchResult.experienceFit,
          // 🆕 Add tag-based matching info
          tagMatchScore: tagMatch.score,
          matchedTags: tagMatch.matchedTags,
          missingTags: tagMatch.missingTags,
          candidateCategories,
          positionCategories,
          categoryOverlap,
        })
      } catch (error) {
        console.error(`Error matching candidate ${candidateId} with position ${position.id}:`, error)
      }
    }

    // מיין לפי ניקוד התאמה (הגבוה ביותר קודם)
    matches.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      candidateName: candidate.name,
      candidateTags: candidate.tags.map((t) => t.name),
      // 🆕 Add recruitment tags info
      candidateRecruitmentTags: candidateRecruitmentTags,
      candidateCategories: candidateCategories,
      relatedCategories: findRelatedCategories(candidateCategories),
      totalMatches: matches.length,
      topMatches: matches.slice(0, 10),
      allMatches: matches,
    })
  } catch (error) {
    console.error("Error in smart matching:", error)
    return NextResponse.json(
      { error: "Error performing smart matching" },
      { status: 500 }
    )
  }
}

// POST /api/smart-matching - התאמה חכמה מועמד למשרות
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, resumeText } = body

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      )
    }

    // קבל את המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        tags: true,
        applications: {
          include: {
            position: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // ניתוח קורות חיים בעזרת Gemini
    let detectedSkills: string[] = []
    if (resumeText || candidate.resume) {
      const profile = await analyzeResumeWithGemini(resumeText || candidate.resume || "")
      detectedSkills = profile.tags
      
      // הוסף תגיות חדשות למועמד
      const existingTags = await prisma.tag.findMany({
        where: {
          name: {
            in: detectedSkills
          }
        }
      })

      const existingTagNames = existingTags.map(tag => tag.name)
      const newSkills = detectedSkills.filter(skill => !existingTagNames.includes(skill))
      
      // צור תגיות חדשות
      for (const skill of newSkills) {
        await prisma.tag.create({
          data: {
            name: skill,
            type: "SKILL",
            color: getRandomColor()
          }
        })
      }

      // קשר תגיות למועמד
      const allTags = await prisma.tag.findMany({
        where: {
          name: {
            in: detectedSkills
          }
        }
      })

      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          tags: {
            connect: allTags.map(tag => ({ id: tag.id }))
          },
          aiProfile: JSON.stringify(profile)
        }
      })
    }

    // קבל את כל המשרות הפעילות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: {
        tags: true,
        employer: true,
        applications: {
          where: {
            candidateId: candidateId
          }
        }
      }
    })

    // סנן משרות שהמועמד כבר התמודד עליהן
    const availablePositions = positions.filter(pos => pos.applications.length === 0)

    // חשב התאמות לכל משרה זמינה
    const matches = []
    for (const position of availablePositions) {
      try {
        let candidateProfile: any = null
        try {
          if (candidate.aiProfile) {
            candidateProfile = JSON.parse(candidate.aiProfile as string)
          }
        } catch (e) {
          candidateProfile = null
        }
        if (!candidateProfile) {
          candidateProfile = await analyzeResumeWithGemini(candidate.resume || "")
        }

        let jobProfile: any = null
        try {
          if (position.aiProfile) {
            jobProfile = JSON.parse(position.aiProfile as string)
          }
        } catch (e) {
          jobProfile = null
        }
        if (!jobProfile) {
          jobProfile = await analyzeJobDescriptionWithGemini(position.description || "")
          await prisma.position.update({
            where: { id: position.id },
            data: { aiProfile: JSON.stringify(jobProfile) }
          })
        }

        const matchResult = await calculateMatchScoreWithGemini(candidateProfile, jobProfile)
        
        matches.push({
          position,
          score: matchResult.score,
          matchedSkills: matchResult.matchedSkills,
          reasoning: matchResult.reasoning
        })
      } catch (error) {
        console.log(`Skip matching for position ${position.id}`)
      }
    }

    // מיין לפי ניקוד התאמה
    matches.sort((a, b) => b.score - a.score)

    // צור מועמדויות אוטומטיות למשרות הטובות ביותר (75% התאמה ומעלה)
    const createdApplications = []
    for (const match of matches.slice(0, 5)) {
      if (match.score >= 75) {
        try {
          const application = await prisma.application.create({
            data: {
              candidateId,
              positionId: match.position.id,
              status: "NEW",
              matchScore: match.score,
              coverLetter: `התאמה אוטומטית - ${Math.round(match.score)}% התאמה\n\nכישורים תואמים: ${match.matchedSkills.join(", ")}`
            },
            include: {
              position: {
                include: {
                  employer: true
                }
              }
            }
          })
          createdApplications.push(application)
        } catch (error) {
          console.log(`Application already exists for candidate ${candidateId} and position ${match.position.id}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      candidateId,
      detectedSkills,
      matchingPositions: matches.length,
      autoApplications: createdApplications.length,
      applications: createdApplications,
      topMatches: matches.slice(0, 5).map(match => ({
        positionId: match.position.id,
        position: match.position.title,
        employer: match.position.employer?.name,
        score: Math.round(match.score),
        matchedSkills: match.matchedSkills.slice(0, 3)
      }))
    })

  } catch (error) {
    console.error("Error in smart matching:", error)
    return NextResponse.json(
      { error: "Failed to perform smart matching" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/smart-matching/feedback
 * שיפור מתמשך של התאמות בהתאם לתוצאות הגיוס
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { feedback } = body

    if (!Array.isArray(feedback)) {
      return NextResponse.json({ error: "Missing feedback array" }, { status: 400 })
    }

    // שיפור התאמות בהתאם לתוצאות
    const improvements = await improveMatchingWithFeedback(feedback)

    // שמור את השיפורים כהיסטוריה
    try {
      await prisma.smartMatchingFeedback.createMany({
        data: feedback.map((f) => ({
          candidateName: f.candidateName,
          jobTitle: f.jobTitle,
          initialScore: f.initialScore,
          hiringOutcome: f.hiringOutcome,
          reason: f.reason,
        })),
      })
    } catch (e) {
      // אם הטבלה לא קיימת, תתעלם
      console.log("SmartMatchingFeedback table not available")
    }

    return NextResponse.json({
      message: "Feedback recorded successfully",
      improvements,
    })
  } catch (error) {
    console.error("Error recording feedback:", error)
    return NextResponse.json(
      { error: "Error recording feedback" },
      { status: 500 }
    )
  }
}

// קבל צבע רנדומלי לתגית
function getRandomColor(): string {
  const colors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", 
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}