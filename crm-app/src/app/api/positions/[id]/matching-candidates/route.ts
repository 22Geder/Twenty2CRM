import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/positions/[id]/matching-candidates - חיפוש מועמדים מתאימים
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const positionId = resolvedParams.id

    // קבלת פרטי המשרה עם התגיות שלה
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        tags: true,
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    // חישוב תאריך לפני 21 יום
    const twentyOneDaysAgo = new Date()
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

    // אם למשרה אין תגיות, נחפש מועמדים חדשים כלליים
    if (!position.tags || position.tags.length === 0) {
      const candidates = await prisma.candidate.findMany({
        where: {
          createdAt: {
            gte: twentyOneDaysAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // מגבלה של 50 מועמדים
        include: {
          tags: true,
          applications: {
            select: {
              id: true,
              status: true,
              positionId: true,
            },
          },
        },
      })

      return NextResponse.json({
        candidates,
        matchedTags: [],
        totalCount: candidates.length,
      })
    }

    // חיפוש מועמדים עם תגיות תואמות מה-21 ימים האחרונים
    const positionTagIds = position.tags.map(tag => tag.id)

    const candidates = await prisma.candidate.findMany({
      where: {
        createdAt: {
          gte: twentyOneDaysAgo,
        },
        tags: {
          some: {
            id: {
              in: positionTagIds,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // מגבלה של 100 מועמדים
      include: {
        tags: true,
        applications: {
          where: {
            positionId: positionId,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    // 🔥 אלגוריתם חכם מתקדם - 10 שיטות לחישוב התאמה מדויקת
    const candidatesWithScore = candidates.map(candidate => {
      const candidateTagIds = candidate.tags.map(tag => tag.id)
      const candidateTagNames = candidate.tags.map(tag => tag.name.toLowerCase())
      const positionTagNames = position.tags.map(tag => tag.name.toLowerCase())
      
      // שיטה 1: התאמת תגיות בסיסית (40 נקודות)
      const matchingTags = position.tags.filter(tag => 
        candidateTagIds.includes(tag.id)
      )
      const basicTagScore = (matchingTags.length / position.tags.length) * 40

      // שיטה 2: התאמה חלקית של תגיות (10 נקודות)
      let partialMatchScore = 0
      positionTagNames.forEach(posTag => {
        candidateTagNames.forEach(canTag => {
          if (canTag.includes(posTag) || posTag.includes(canTag)) {
            partialMatchScore += 1
          }
        })
      })
      partialMatchScore = Math.min(partialMatchScore, 10)

      // שיטה 3: ניסיון רלוונטי (15 נקודות)
      let experienceScore = 0
      if (candidate.yearsOfExperience) {
        if (candidate.yearsOfExperience >= 5) experienceScore = 15
        else if (candidate.yearsOfExperience >= 3) experienceScore = 12
        else if (candidate.yearsOfExperience >= 1) experienceScore = 8
        else experienceScore = 5
      }

      // שיטה 4: דירוג מועמד (10 נקודות)
      const ratingScore = candidate.rating ? (candidate.rating / 5) * 10 : 5

      // שיטה 5: התאמת מיקום (5 נקודות)
      let locationScore = 0
      if (position.location && candidate.city) {
        const posLocation = position.location.toLowerCase()
        const canLocation = candidate.city.toLowerCase()
        if (posLocation.includes(canLocation) || canLocation.includes(posLocation)) {
          locationScore = 5
        } else if (
          (posLocation.includes('תל אביב') && canLocation.includes('גוש דן')) ||
          (posLocation.includes('ירושלים') && canLocation.includes('מרכז')) ||
          (posLocation.includes('חיפה') && canLocation.includes('צפון'))
        ) {
          locationScore = 3
        }
      }

      // שיטה 6: התאמת תפקיד נוכחי (10 נקודות)
      let titleScore = 0
      if (candidate.currentTitle && position.title) {
        const canTitle = candidate.currentTitle.toLowerCase()
        const posTitle = position.title.toLowerCase()
        const titleWords = posTitle.split(' ')
        const matchingWords = titleWords.filter(word => 
          canTitle.includes(word) && word.length > 2
        )
        titleScore = Math.min((matchingWords.length / titleWords.length) * 10, 10)
      }

      // שיטה 7: רלוונטיות לפי זמן (5 נקודות) - מועמדים חדשים יותר
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      const freshnessScore = daysSinceCreated <= 7 ? 5 : daysSinceCreated <= 14 ? 3 : 1

      // שיטה 8: עדיפות למועמדים עם פרטי קשר מלאים (2 נקודות)
      let contactScore = 0
      if (candidate.email) contactScore += 1
      if (candidate.phone || candidate.alternatePhone) contactScore += 1

      // שיטה 9: עדיפות למועמדים עם קורות חיים (2 נקודות)
      const resumeScore = candidate.resumeUrl ? 2 : 0

      // שיטה 10: בונוס למועמדים עם לינקדאין (1 נקודה)
      const linkedinScore = candidate.linkedinUrl ? 1 : 0

      // חישוב ציון סופי (מקסימום 100)
      const finalScore = Math.min(
        Math.round(
          basicTagScore + 
          partialMatchScore + 
          experienceScore + 
          ratingScore + 
          locationScore + 
          titleScore + 
          freshnessScore + 
          contactScore + 
          resumeScore + 
          linkedinScore
        ),
        100
      )

      return {
        ...candidate,
        matchingTags,
        matchScore: finalScore,
        hasApplied: candidate.applications.length > 0,
        scoreBreakdown: {
          tags: Math.round(basicTagScore),
          partial: partialMatchScore,
          experience: experienceScore,
          rating: Math.round(ratingScore),
          location: locationScore,
          title: Math.round(titleScore),
          freshness: freshnessScore,
          contact: contactScore,
          resume: resumeScore,
          linkedin: linkedinScore,
        }
      }
    })

    // מיון לפי ציון התאמה (גבוה לנמוך) ואז לפי תאריך יצירה
    candidatesWithScore.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      candidates: candidatesWithScore,
      positionTags: position.tags,
      totalCount: candidatesWithScore.length,
      daysBack: 21,
    })
  } catch (error) {
    console.error("Error fetching matching candidates:", error)
    return NextResponse.json(
      { error: "Failed to fetch matching candidates" },
      { status: 500 }
    )
  }
}
