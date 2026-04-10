import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { calculateLocationScore } from "@/lib/israel-distance"

/**
 * 🎯 GET /api/best-matches
 * מחזיר את 20 ההתאמות הטובות ביותר לכל משרה פעילה
 * 
 * 🆕 אלגוריתם מאוחד 50/25/25:
 * מיקום 50 + תגיות 25 + AI/פרופיל 25 = 100
 * 
 * רק מועמדים שלא בתהליך כלל!
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("🎯 Best Matches API - Starting... (אלגוריתם 50/25/25 - מיקום/תגיות/AI)")
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
    // 🆕 אלגוריתם 50/25/25: מיקום 50 (כל 10 ק"מ -15%) + תגיות 25 + AI/פרופיל 25 = 100
    const positionsWithMatches = []

    for (const position of positions) {
      const positionTagIds = position.tags.map(t => t.id)
      const positionTagNames = position.tags.map(t => t.name.toLowerCase())
      const positionLocation = position.location || ''
      const positionTitle = (position.title || '').toLowerCase()
      const positionTitleWords = positionTitle.split(' ').filter(w => w.length > 2)

      // חישוב ציון לכל מועמד - אלגוריתם 50/25/25 עם מרחק בק"מ
      const candidatesWithScores = candidatesNotInProcess.map(candidate => {
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

        const candidateTagIds = candidate.tags.map(t => t.id)
        const candidateTagNames = candidate.tags.map(t => t.name.toLowerCase())
        const candidateCity = candidate.city || ''
        const candidateTitle = ((candidate as any).currentTitle || '').toLowerCase()

        // ═══════════════════════════════════════
        // 📍 מיקום - 50 נקודות (50%)
        // GPS מדויק + תמיכה בכמה ערים
        // ═══════════════════════════════════════
        let locationMatch = false
        let distanceKm: number | null = null
        let isExactCity = false
        
        const locResult = calculateLocationScore(candidateCity, positionLocation)
        scoreBreakdown.location = locResult.score
        distanceKm = locResult.distanceKm
        locationMatch = locResult.score > 0
        isExactCity = locResult.isExactCity

        // ═══════════════════════════════════════
        // 🏷️ תגיות - 25 נקודות (25%)
        // ═══════════════════════════════════════
        const matchingTagIds = candidateTagIds.filter(id => positionTagIds.includes(id))
        const matchingTags = candidate.tags.filter(t => positionTagIds.includes(t.id))
        
        if (positionTagIds.length > 0) {
          const tagMatchPercentage = matchingTagIds.length / positionTagIds.length
          scoreBreakdown.tags = Math.round(tagMatchPercentage * 20)
        }

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
        if (candidateTitle && positionTitle) {
          const candidateTitleWords = candidateTitle.split(' ').filter((w: string) => w.length > 2)
          const matchingWords = candidateTitleWords.filter((word: string) => 
            positionTitleWords.some((pWord: string) => pWord.includes(word) || word.includes(pWord))
          ).length
          
          if (matchingWords > 0) {
            scoreBreakdown.title = Math.min(10, matchingWords * 4)
          }
        }

        // ניסיון - עד 8 נקודות
        const yearsExp = (candidate as any).yearsOfExperience
        if (yearsExp) {
          if (yearsExp >= 5) scoreBreakdown.experience = 8
          else if (yearsExp >= 3) scoreBreakdown.experience = 6
          else if (yearsExp >= 1) scoreBreakdown.experience = 3
          else scoreBreakdown.experience = 1
        }

        // דירוג - עד 5 נקודות
        if (candidate.rating) {
          scoreBreakdown.rating = Math.round((candidate.rating / 5) * 5)
        }

        // קו"ח + לינקדאין - עד 2 נקודות
        if ((candidate as any).resumeUrl) scoreBreakdown.resume = 1
        if ((candidate as any).linkedinUrl) scoreBreakdown.linkedin = 1

        // ═══════════════════════════════════════
        // 📊 סיכום סופי
        // ═══════════════════════════════════════
        const locationScore = scoreBreakdown.location
        const tagsScore = scoreBreakdown.tags + scoreBreakdown.partial
        const aiScore = scoreBreakdown.title + scoreBreakdown.experience + scoreBreakdown.rating + scoreBreakdown.resume + scoreBreakdown.linkedin
        const score = Math.min(100, locationScore + tagsScore + aiScore)

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
          score,
          locationMatch,
          isExactCity,
          distanceKm,
          scoreBreakdown: {
            ...scoreBreakdown,
            locationMaxPossible: 50,
            tagsMaxPossible: 25,
            geminiAI: aiScore,
            geminiMaxPossible: 25,
          },
        }
      })

      // 🎯 מיון: אותה עיר קודם, אחר כך מיקום GPS, ציון כולל
      candidatesWithScores.sort((a, b) => {
        // 🏆 אותה עיר בראש!
        if (a.isExactCity && !b.isExactCity) return -1
        if (!a.isExactCity && b.isExactCity) return 1
        // ציון מיקום GPS
        if (b.scoreBreakdown.location !== a.scoreBreakdown.location) {
          return b.scoreBreakdown.location - a.scoreBreakdown.location
        }
        if (b.score !== a.score) return b.score - a.score
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
    console.log(`✅ Best Matches completed in ${endTime - startTime}ms (אלגוריתם 50/25/25)`)

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
