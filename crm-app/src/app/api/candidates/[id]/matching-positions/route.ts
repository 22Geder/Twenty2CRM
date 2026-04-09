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
      .map((app: any) => app.position?.employer?.name?.toLowerCase())
      .filter((name: any): name is string => Boolean(name))

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

      // מיון לפי תאריך ולקיחת 20 הראשונים
      const top20 = positionsWithScore.slice(0, 20)

      return NextResponse.json({
        positions: top20,
        candidateTags: [],
        totalCount: positions.length,
      })
    }

    // חיפוש כל המשרות הפעילות - סריקה מלאה!
    const candidateTagIds = candidate.tags.map(tag => tag.id)

    const positions = await prisma.position.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
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

    // 🆕 אזורים גיאוגרפיים מורחבים לחישוב מיקום
    const locationRegions = {
      tlvArea: ['תל אביב', 'רמת גן', 'גבעתיים', 'חולון', 'בת ים', 'בני ברק', 'אור יהודה', 'רמת השרון', 'הרצליה'],
      gushDan: ['פתח תקווה', 'ראשון לציון', 'רחובות', 'נס ציונה', 'לוד', 'רמלה', 'יהוד', 'מודיעין', 'ראש העין', 'כפר סבא', 'רעננה', 'הוד השרון', 'נתניה'],
      haifaArea: ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית ים', 'קריית מוצקין', 'נשר', 'טירת כרמל', 'קריות', 'עכו', 'נהריה'],
      northArea: ['עפולה', 'נצרת', 'טבריה', 'כרמיאל', 'צפת', 'מגדל העמק', 'בית שאן', 'קצרין'],
      jlmArea: ['ירושלים', 'בית שמש', 'מעלה אדומים', 'מבשרת ציון'],
      southArea: ['באר שבע', 'אשדוד', 'אשקלון', 'דימונה', 'ערד', 'אופקים', 'קריית גת', 'שדרות', 'אילת'],
    }

    // פונקציית עזר - מצא באיזה אזור עיר נמצאת
    const getRegion = (city: string): string | null => {
      const cityLower = city.toLowerCase()
      for (const [region, cities] of Object.entries(locationRegions)) {
        if (cities.some(c => cityLower.includes(c) || c.includes(cityLower))) {
          return region
        }
      }
      return null
    }

    // פונקציית עזר - אזורים סמוכים (מרכז = tlv + gushDan, צפון = haifa + north)
    const areNearbyRegions = (r1: string | null, r2: string | null): boolean => {
      if (!r1 || !r2) return false
      const nearby: Record<string, string[]> = {
        tlvArea: ['gushDan'],
        gushDan: ['tlvArea', 'jlmArea'],
        haifaArea: ['northArea'],
        northArea: ['haifaArea'],
        jlmArea: ['gushDan'],
        southArea: [],
      }
      return (nearby[r1] || []).includes(r2) || (nearby[r2] || []).includes(r1)
    }

    // 🎯 חישוב ציון התאמה - אלגוריתם 50/25/25 (מיקום/תגיות/AI)
    const positionsWithScore = positions.map(position => {
      const scoreBreakdown = {
        location: 0,
        tags: 0,
        partial: 0,
        experience: 0,
        rating: 0,
        title: 0,
        freshness: 0,
        contact: 0,
        resume: 0,
        linkedin: 0,
      }

      const positionTagIds = position.tags.map(t => t.id)
      const matchingTagIds = candidateTagIds.filter(id => positionTagIds.includes(id))
      const matchingTags = candidate.tags.filter(t => matchingTagIds.includes(t.id))

      // ═══════════════════════════════════════
      // 📍 מיקום - 50 נקודות (50%)
      // ═══════════════════════════════════════
      let locationMatch = false
      if (candidate.city && position.location) {
        const candidateCity = candidate.city.toLowerCase()
        const positionLocation = position.location.toLowerCase()
        
        // התאמה מדויקת - 50 נקודות
        if (positionLocation.includes(candidateCity) || candidateCity.includes(positionLocation)) {
          scoreBreakdown.location = 50
          locationMatch = true
        } else {
          const candidateRegion = getRegion(candidateCity)
          const positionRegion = getRegion(positionLocation)
          
          if (candidateRegion && positionRegion && candidateRegion === positionRegion) {
            // אותו אזור - 35 נקודות
            scoreBreakdown.location = 35
            locationMatch = true
          } else if (areNearbyRegions(candidateRegion, positionRegion)) {
            // אזורים סמוכים - 20 נקודות
            scoreBreakdown.location = 20
            locationMatch = true
          }
        }
      }

      // ═══════════════════════════════════════
      // 🏷️ תגיות - 25 נקודות (25%)
      // ═══════════════════════════════════════
      // התאמה מדויקת - עד 20 נקודות
      if (positionTagIds.length > 0) {
        const tagMatchPercentage = matchingTagIds.length / positionTagIds.length
        scoreBreakdown.tags = Math.round(tagMatchPercentage * 20)
      }

      // התאמה חלקית - עד 5 נקודות
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
        scoreBreakdown.partial = Math.min(5, partialMatches * 2)
      }

      // ═══════════════════════════════════════
      // 🤖 AI/פרופיל - 25 נקודות (25%)
      // ═══════════════════════════════════════
      // תואר תפקיד - עד 10 נקודות
      if (candidate.currentTitle && position.title) {
        const candidateTitle = candidate.currentTitle.toLowerCase()
        const posTitle = position.title.toLowerCase()
        const candidateTitleWords = candidateTitle.split(' ').filter((w: string) => w.length > 2)
        const positionTitleWords = posTitle.split(' ').filter((w: string) => w.length > 2)
        
        const matchingWords = candidateTitleWords.filter((word: string) => 
          positionTitleWords.some((pWord: string) => pWord.includes(word) || word.includes(pWord))
        ).length
        
        if (matchingWords > 0) {
          scoreBreakdown.title = Math.min(10, matchingWords * 4)
        }
      }

      // ניסיון - עד 8 נקודות
      if (candidate.yearsOfExperience) {
        if (candidate.yearsOfExperience >= 5) scoreBreakdown.experience = 8
        else if (candidate.yearsOfExperience >= 3) scoreBreakdown.experience = 6
        else if (candidate.yearsOfExperience >= 1) scoreBreakdown.experience = 3
        else scoreBreakdown.experience = 1
      }

      // דירוג - עד 5 נקודות
      if (candidate.rating) {
        scoreBreakdown.rating = Math.round((candidate.rating / 5) * 5)
      }

      // קו"ח + לינקדאין - עד 2 נקודות
      if (candidate.resumeUrl) scoreBreakdown.resume = 1
      if (candidate.linkedinUrl) scoreBreakdown.linkedin = 1

      // ═══════════════════════════════════════
      // 📊 סיכום סופי
      // ═══════════════════════════════════════
      const locationScore = scoreBreakdown.location                                    // עד 50
      const tagsScore = scoreBreakdown.tags + scoreBreakdown.partial                   // עד 25
      const aiScore = scoreBreakdown.title + scoreBreakdown.experience + scoreBreakdown.rating + scoreBreakdown.resume + scoreBreakdown.linkedin // עד 25
      const matchScore = Math.min(100, locationScore + tagsScore + aiScore)

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
        matchScore,
        matchingTags,
        hasApplied: position.applications.length > 0,
        locationMatch,
        scoreBreakdown: {
          ...scoreBreakdown,
          locationMaxPossible: 50,
          tagsMaxPossible: 25,
          geminiAI: aiScore,
          geminiMaxPossible: 25,
        },
        blockedByPreviousEmployer,
        blockedByApplication,
        isBlocked: blockedByPreviousEmployer || blockedByApplication,
      }
    })

    // מיון: מיקום קודם כל, אחר כך ציון כולל
    positionsWithScore.sort((a, b) => {
      // קודם לפי מיקום (התאמה מדויקת > אזורית > ללא)
      if (b.scoreBreakdown.location !== a.scoreBreakdown.location) {
        return b.scoreBreakdown.location - a.scoreBreakdown.location
      }
      // אחר כך ציון כולל
      return b.matchScore - a.matchScore
    })

    // החזרת 20 המשרות הטובות ביותר מתוך כל המשרות שנסרקו
    const top20 = positionsWithScore.slice(0, 20)

    return NextResponse.json({
      positions: top20,
      candidateTags: candidate.tags,
      totalCount: positions.length,
      totalScanned: positions.length,
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
