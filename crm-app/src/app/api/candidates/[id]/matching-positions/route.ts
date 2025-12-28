import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/candidates/[id]/matching-positions - מציאת משרות מתאימות למועמד
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
    const candidateId = resolvedParams.id

    // קבלת פרטי המועמד עם התגיות שלו
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        tags: true,
        applications: {
          include: {
            position: {
              include: {
                employer: true,
              },
            },
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // רשימת חברות שהמועמד כבר עבד בהן (לא לשלוח אליהן)
    const previousCompanies: string[] = []
    if (candidate.currentCompany) {
      previousCompanies.push(candidate.currentCompany.toLowerCase())
    }
    
    // חברות מהאפליקציות הקודמות
    const appliedEmployerNames: string[] = candidate.applications
      .map(app => app.position?.employer?.name?.toLowerCase())
      .filter((name): name is string => Boolean(name))

    // אם למועמד אין תגיות, נחזיר משרות פעילות כלליות
    if (!candidate.tags || candidate.tags.length === 0) {
      const positions = await prisma.position.findMany({
        where: {
          active: true,
          employer: {
            name: {
              notIn: previousCompanies.length > 0 ? previousCompanies : undefined,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        include: {
          employer: true,
          tags: true,
          applications: {
            where: {
              candidateId: candidateId,
            },
            select: {
              id: true,
              status: true,
            },
          },
        },
      })

      const positionsWithScore = positions.map(position => ({
        ...position,
        matchScore: 0,
        matchingTags: [],
        hasApplied: position.applications.length > 0,
        scoreBreakdown: {
          tags: 0,
          partial: 0,
          experience: 0,
          rating: 0,
          location: 0,
          title: 0,
          freshness: 0,
          contact: 0,
          resume: 0,
          linkedin: 0,
        },
      }))

      return NextResponse.json({
        positions: positionsWithScore,
        candidateTags: [],
        totalCount: positionsWithScore.length,
      })
    }

    // חיפוש משרות פעילות עם תגיות תואמות
    const candidateTagIds = candidate.tags.map(tag => tag.id)

    const positions = await prisma.position.findMany({
      where: {
        active: true,
        tags: {
          some: {
            id: {
              in: candidateTagIds,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        employer: true,
        tags: true,
        applications: {
          where: {
            candidateId: candidateId,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    // חישוב ציון התאמה לכל משרה
    const positionsWithScore = positions.map(position => {
      let matchScore = 0
      const scoreBreakdown = {
        tags: 0,
        partial: 0,
        experience: 0,
        rating: 0,
        location: 0,
        title: 0,
        freshness: 0,
        contact: 0,
        resume: 0,
        linkedin: 0,
      }

      // 1. התאמת תגיות בסיסית (40 נקודות)
      const positionTagIds = position.tags.map(t => t.id)
      const matchingTagIds = candidateTagIds.filter(id => positionTagIds.includes(id))
      const matchingTags = candidate.tags.filter(t => matchingTagIds.includes(t.id))
      
      if (positionTagIds.length > 0) {
        const tagMatchPercentage = (matchingTagIds.length / positionTagIds.length) * 100
        scoreBreakdown.tags = Math.round((tagMatchPercentage / 100) * 40)
        matchScore += scoreBreakdown.tags
      }

      // 2. התאמה חלקית של תגיות (10 נקודות)
      const candidateTagNames = candidate.tags.map(t => t.name.toLowerCase())
      const positionTagNames = position.tags.map(t => t.name.toLowerCase())
      let partialMatches = 0
      
      candidateTagNames.forEach(canTag => {
        positionTagNames.forEach(posTag => {
          if (canTag.includes(posTag) || posTag.includes(canTag)) {
            if (!matchingTagIds.includes(candidate.tags.find(t => t.name.toLowerCase() === canTag)?.id || '')) {
              partialMatches++
            }
          }
        })
      })
      
      if (partialMatches > 0) {
        scoreBreakdown.partial = Math.min(10, partialMatches * 3)
        matchScore += scoreBreakdown.partial
      }

      // 3. ניסיון (15 נקודות)
      if (candidate.yearsOfExperience) {
        if (candidate.yearsOfExperience >= 5) {
          scoreBreakdown.experience = 15
        } else if (candidate.yearsOfExperience >= 3) {
          scoreBreakdown.experience = 10
        } else if (candidate.yearsOfExperience >= 1) {
          scoreBreakdown.experience = 5
        } else {
          scoreBreakdown.experience = 2
        }
        matchScore += scoreBreakdown.experience
      }

      // 4. דירוג (10 נקודות)
      if (candidate.rating) {
        scoreBreakdown.rating = Math.round((candidate.rating / 5) * 10)
        matchScore += scoreBreakdown.rating
      }

      // 5. מיקום (5 נקודות)
      if (candidate.city && position.location) {
        const candidateCity = candidate.city.toLowerCase()
        const positionLocation = position.location.toLowerCase()
        
        if (positionLocation.includes(candidateCity) || candidateCity.includes(positionLocation)) {
          scoreBreakdown.location = 5
          matchScore += 5
        } else {
          // בדיקה אזורית
          const tlvArea = ['תל אביב', 'רמת גן', 'גבעתיים', 'חולון', 'בת ים']
          const haifaArea = ['חיפה', 'קריות', 'נהריה', 'עכו']
          const jlmArea = ['ירושלים', 'בית שמש', 'מעלה אדומים']
          
          const inSameRegion = 
            (tlvArea.some(c => positionLocation.includes(c)) && tlvArea.some(c => candidateCity.includes(c))) ||
            (haifaArea.some(c => positionLocation.includes(c)) && haifaArea.some(c => candidateCity.includes(c))) ||
            (jlmArea.some(c => positionLocation.includes(c)) && jlmArea.some(c => candidateCity.includes(c)))
          
          if (inSameRegion) {
            scoreBreakdown.location = 3
            matchScore += 3
          }
        }
      }

      // 6. תואר התפקיד (10 נקודות)
      if (candidate.currentTitle && position.title) {
        const candidateTitle = candidate.currentTitle.toLowerCase()
        const positionTitle = position.title.toLowerCase()
        
        const candidateTitleWords = candidateTitle.split(' ')
        const positionTitleWords = positionTitle.split(' ')
        
        const matchingWords = candidateTitleWords.filter(word => 
          positionTitleWords.some(pWord => pWord.includes(word) || word.includes(pWord))
        ).length
        
        if (matchingWords > 0) {
          scoreBreakdown.title = Math.min(10, matchingWords * 3)
          matchScore += scoreBreakdown.title
        }
      }

      // 7. עדכניות משרה (5 נקודות)
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(position.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceCreated <= 7) {
        scoreBreakdown.freshness = 5
        matchScore += 5
      } else if (daysSinceCreated <= 14) {
        scoreBreakdown.freshness = 3
        matchScore += 3
      } else if (daysSinceCreated <= 21) {
        scoreBreakdown.freshness = 1
        matchScore += 1
      }

      // 8. פרטי התקשרות (2 נקודות)
      if (candidate.email && candidate.phone) {
        scoreBreakdown.contact = 2
        matchScore += 2
      } else if (candidate.email || candidate.phone) {
        scoreBreakdown.contact = 1
        matchScore += 1
      }

      // 9. קורות חיים (2 נקודות)
      if (candidate.resumeUrl) {
        scoreBreakdown.resume = 2
        matchScore += 2
      }

      // 10. פרופיל LinkedIn (1 נקודה)
      if (candidate.linkedinUrl) {
        scoreBreakdown.linkedin = 1
        matchScore += 1
      }

      // סינון חברות שהמועמד כבר עבד בהן
      const employerName = position.employer?.name?.toLowerCase() || ''
      const blockedByPreviousEmployer = previousCompanies.some(company => 
        employerName.includes(company) || company.includes(employerName)
      )
      
      const blockedByApplication = appliedEmployerNames.some(name => 
        name && (employerName.includes(name) || name.includes(employerName))
      )

      return {
        ...position,
        matchScore: Math.min(100, matchScore),
        matchingTags,
        hasApplied: position.applications.length > 0,
        scoreBreakdown,
        blockedByPreviousEmployer,
        blockedByApplication,
        isBlocked: blockedByPreviousEmployer || blockedByApplication,
      }
    })

    // מיון לפי ציון התאמה
    positionsWithScore.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      positions: positionsWithScore,
      candidateTags: candidate.tags,
      totalCount: positionsWithScore.length,
      previousCompanies,
    })

  } catch (error: any) {
    console.error("Error finding matching positions:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
