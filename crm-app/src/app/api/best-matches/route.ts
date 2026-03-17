import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import {
  normalizeLocality,
  extractLocalityFromAddress,
  areLocationsNearby,
} from "@/lib/israel-locations"

/**
 * 🎯 GET /api/best-matches
 * מחזיר את 20 ההתאמות הטובות ביותר לכל משרה פעילה
 * ממוין לפי ציון התאמה - הגבוה ביותר ראשון!
 * רק מועמדים שלא בתהליך כלל!
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("🎯 Best Matches API - Starting...")
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

    // 3️⃣ לכל משרה - מצא את 20 המועמדים הכי מתאימים (ממוין לפי ציון גבוה!)
    const positionsWithMatches = []

    for (const position of positions) {
      const positionTagIds = position.tags.map(t => t.id)
      const positionTagNames = position.tags.map(t => t.name.toLowerCase())
      const positionLocation = extractLocalityFromAddress(position.location || '') || normalizeLocality(position.location || '')

      // חישוב ציון לכל מועמד
      const candidatesWithScores = candidatesNotInProcess.map(candidate => {
        let score = 0
        const candidateTagIds = candidate.tags.map(t => t.id)
        const candidateTagNames = candidate.tags.map(t => t.name.toLowerCase())

        // 1. התאמת תגיות מלאה (50 נקודות)
        const matchingTagIds = candidateTagIds.filter(id => positionTagIds.includes(id))
        if (positionTagIds.length > 0) {
          const tagMatchPercent = (matchingTagIds.length / positionTagIds.length) * 100
          score += Math.round((tagMatchPercent / 100) * 50)
        }

        // 2. התאמת תגיות חלקית - שם דומה (15 נקודות)
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
        score += Math.min(15, partialMatches * 5)

        // 3. התאמת מיקום (25 נקודות)
        const candidateLocation = extractLocalityFromAddress(candidate.city || '') || normalizeLocality(candidate.city || '')
        let locationMatch = false
        if (candidateLocation && positionLocation) {
          if (areLocationsNearby(candidateLocation, positionLocation)) {
            score += 25
            locationMatch = true
          }
        }

        // 4. דירוג המועמד (10 נקודות)
        if (candidate.rating) {
          score += (candidate.rating / 5) * 10
        }

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          city: candidate.city,
          currentTitle: candidate.currentTitle,
          yearsOfExperience: candidate.yearsOfExperience,
          rating: candidate.rating,
          tags: candidate.tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
          matchingTags: candidate.tags.filter(t => positionTagIds.includes(t.id)),
          score: Math.round(score),
          locationMatch,
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

    // מיון לפי מספר התאמות (משרות עם יותר התאמות ראשונות)
    positionsWithMatches.sort((a, b) => b.totalMatches - a.totalMatches)

    const endTime = Date.now()
    console.log(`✅ Best Matches completed in ${endTime - startTime}ms`)

    return NextResponse.json({
      success: true,
      positions: positionsWithMatches,
      totalPositions: positions.length,
      positionsWithMatches: positionsWithMatches.length,
      totalCandidatesNotInProcess: candidatesNotInProcess.length,
      processingTime: endTime - startTime,
    })

  } catch (error: any) {
    console.error("❌ Error in best-matches:", error)
    return NextResponse.json(
      { error: "Failed to get best matches", details: error.message },
      { status: 500 }
    )
  }
}
