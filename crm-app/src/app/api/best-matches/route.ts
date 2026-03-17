import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

/**
 * 🎯 GET /api/best-matches
 * מחזיר את 20 ההתאמות הטובות ביותר לכל משרה פעילה
 * 
 * ⚠️ משתמש באותו אלגוריתם בדיוק כמו matching-positions!
 * תגיות 40 + חלקי 10 + ניסיון 15 + דירוג 10 + מיקום 5 + תפקיד 10 + עדכניות 5 + קשר 2 + קו"ח 2 + לינקדאין 1 = 100
 * 
 * רק מועמדים שלא בתהליך כלל!
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("🎯 Best Matches API - Starting... (אלגוריתם אחיד עם matching-positions)")
    const startTime = Date.now()

    // 1️⃣ שליפת כל המשרות הפעילות עם תגיות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: {
        employer: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`📋 Found ${positions.length} active positions`)

    if (positions.length === 0) {
      return NextResponse.json({
        success: true,
        positions: [],
        message: "אין משרות פעילות",
      })
    }

    // 2️⃣ שליפת מועמדים שלא בתהליך - רק מועמדים ללא applications בסטטוסים פעילים
    const candidatesNotInProcess = await prisma.candidate.findMany({
      where: {
        // אין לו מועמדויות בסטטוסים פעילים
        NOT: {
          applications: {
            some: {
              status: {
                in: ['PENDING', 'REVIEWING', 'INTERVIEW', 'OFFER', 'HIRED']
              }
            }
          }
        },
        // לא התקבל לעבודה
        hiredAt: null,
      },
      include: {
        tags: true,
        applications: {
          select: {
            id: true,
            status: true,
            positionId: true,
          }
        }
      },
    })

    console.log(`👥 Found ${candidatesNotInProcess.length} candidates not in process`)

    // 3️⃣ לכל משרה - מצא את 20 המועמדים הכי מתאימים
    // 🔥 אותו אלגוריתם בדיוק כמו matching-positions!
    // תגיות 40 + חלקי 10 + ניסיון 15 + דירוג 10 + מיקום 5 + תפקיד 10 + עדכניות 5 + קשר 2 + קו"ח 2 + לינקדאין 1 = 100
    const positionsWithMatches = []

    for (const position of positions) {
      const positionTagIds = position.tags.map(t => t.id)
      const positionTagNames = position.tags.map(t => t.name.toLowerCase())
      const positionLocation = (position.location || '').toLowerCase()
      const positionTitle = (position.title || '').toLowerCase()
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(position.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      // חישוב ציון לכל מועמד - אותו אלגוריתם כמו matching-positions!
      const candidatesWithScores = candidatesNotInProcess.map(candidate => {
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

        const candidateTagIds = candidate.tags.map(t => t.id)
        const candidateTagNames = candidate.tags.map(t => t.name.toLowerCase())
        const candidateCity = (candidate.city || '').toLowerCase()
        const candidateTitle = ((candidate as any).currentTitle || '').toLowerCase()

        // 1. התאמת תגיות בסיסית (40 נקודות)
        const matchingTagIds = candidateTagIds.filter(id => positionTagIds.includes(id))
        const matchingTags = candidate.tags.filter(t => positionTagIds.includes(t.id))
        
        if (positionTagIds.length > 0) {
          const tagMatchPercentage = (matchingTagIds.length / positionTagIds.length) * 100
          scoreBreakdown.tags = Math.round((tagMatchPercentage / 100) * 40)
          matchScore += scoreBreakdown.tags
        }

        // 2. התאמה חלקית של תגיות (10 נקודות)
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
        const yearsExp = (candidate as any).yearsOfExperience
        if (yearsExp) {
          if (yearsExp >= 5) {
            scoreBreakdown.experience = 15
          } else if (yearsExp >= 3) {
            scoreBreakdown.experience = 10
          } else if (yearsExp >= 1) {
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
        let locationMatch = false
        if (candidateCity && positionLocation) {
          if (positionLocation.includes(candidateCity) || candidateCity.includes(positionLocation)) {
            scoreBreakdown.location = 5
            matchScore += 5
            locationMatch = true
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
              locationMatch = true
            }
          }
        }

        // 6. תואר התפקיד (10 נקודות)
        if (candidateTitle && positionTitle) {
          const candidateTitleWords = candidateTitle.split(' ')
          const positionTitleWords = positionTitle.split(' ')
          
          const matchingWords = candidateTitleWords.filter(word => 
            word.length > 2 && positionTitleWords.some(pWord => pWord.includes(word) || word.includes(pWord))
          ).length
          
          if (matchingWords > 0) {
            scoreBreakdown.title = Math.min(10, matchingWords * 3)
            matchScore += scoreBreakdown.title
          }
        }

        // 7. עדכניות משרה (5 נקודות)
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
        if ((candidate as any).resumeUrl) {
          scoreBreakdown.resume = 2
          matchScore += 2
        }

        // 10. פרופיל LinkedIn (1 נקודה)
        if ((candidate as any).linkedinUrl) {
          scoreBreakdown.linkedin = 1
          matchScore += 1
        }

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          city: candidate.city,
          currentTitle: (candidate as any).currentTitle,
          yearsOfExperience: (candidate as any).yearsOfExperience,
          rating: candidate.rating,
          tags: candidate.tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
          matchingTags: matchingTags.map(t => ({ id: t.id, name: t.name, color: t.color })),
          score: Math.min(100, matchScore),
          locationMatch,
          scoreBreakdown,
        }
      })

      // 🎯 מיון לפי ציון - הגבוה ביותר ראשון! (מיקום רק כשוברי שוויון)
      candidatesWithScores.sort((a, b) => {
        // קודם כל לפי ציון - הגבוה ביותר ראשון!
        if (b.score !== a.score) return b.score - a.score
        // שוברי שוויון: מיקום
        if (a.locationMatch && !b.locationMatch) return -1
        if (!a.locationMatch && b.locationMatch) return 1
        // שוברי שוויון: דירוג
        return (b.rating || 0) - (a.rating || 0)
      })

      // 🔢 לקיחת 20 הראשונים עם ציון מעל 20
      const topCandidates = candidatesWithScores
        .filter(c => c.score >= 20)
        .slice(0, 20)

      if (topCandidates.length > 0) {
        positionsWithMatches.push({
          position: {
            id: position.id,
            title: position.title,
            location: position.location,
            employmentType: position.employmentType,
            salaryRange: position.salaryRange,
            employer: {
              id: position.employer.id,
              name: position.employer.name,
            },
            tags: position.tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
          },
          candidates: topCandidates,
          totalMatches: candidatesWithScores.filter(c => c.score >= 20).length,
        })
      }
    }

    // מיון משרות לפי הציון הממוצע הגבוה ביותר (לא רק כמות)
    positionsWithMatches.sort((a, b) => {
      const avgA = a.candidates.reduce((sum: number, c: any) => sum + c.score, 0) / a.candidates.length
      const avgB = b.candidates.reduce((sum: number, c: any) => sum + c.score, 0) / b.candidates.length
      return avgB - avgA
    })

    const endTime = Date.now()
    console.log(`✅ Best Matches completed in ${endTime - startTime}ms (אותו אלגוריתם כמו matching-positions)`)

    return NextResponse.json({
      success: true,
      positions: positionsWithMatches,
      totalPositions: positions.length,
      positionsWithMatches: positionsWithMatches.length,
      totalCandidatesNotInProcess: candidatesNotInProcess.length,
      processingTime: endTime - startTime,
      algorithm: 'תגיות 40 + חלקי 10 + ניסיון 15 + דירוג 10 + מיקום 5 + תפקיד 10 + עדכניות 5 + קשר 2 + קו"ח 2 + לינקדאין 1',
    })

  } catch (error: any) {
    console.error("❌ Error in best-matches:", error)
    return NextResponse.json(
      { error: "Failed to get best matches", details: error.message },
      { status: 500 }
    )
  }
}
