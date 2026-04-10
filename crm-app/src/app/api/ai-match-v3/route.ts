import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { calculateLocationScore } from "@/lib/israel-distance"
import { 
  normalizeLocality, 
  extractLocalityFromAddress, 
  areLocationsNearby,
  getNearbyLocalities,
  ALL_LOCALITIES,
  TOTAL_LOCALITIES
} from "@/lib/israel-locations"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 🧠 AI Match V3 - סריקה אנושית חכמה מהירה במיוחד!
 * שלב 1: סינון מהיר בלי AI לכל המשרות (אלפיות שניה!)
 * שלב 2: AI מעמיק רק על ה-25 המתאימים ביותר
 * תוצאה: מהירות X10 בלי לפספס שום משרה!
 */
export async function POST(request: Request) {
  try {
    const startTime = Date.now()
    const body = await request.json()
    const { candidateId, positionId } = body

    if (!candidateId) {
      return NextResponse.json({ error: "חסר מזהה מועמד" }, { status: 400 })
    }

    // שליפת המועמד עם כל המידע
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: "מועמד לא נמצא" }, { status: 404 })
    }

    // 🚀 שליפת משרות מהירה - כולל כל השדות לוואטסאפ!
    const positions = await prisma.position.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        location: true,
        description: true,
        requirements: true,
        salaryRange: true,
        employmentType: true,
        workHours: true,       // 🆕 שעות עבודה
        benefits: true,        // 🆕 תנאים נלווים
        transportation: true,  // 🆕 אופן הגעה
        keywords: true,        // 🆕 מילות מפתח
        openings: true,        // 🆕 מספר משרות פתוחות
        contactName: true,     // 🆕 שם איש קשר
        employer: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } }
      }
    })

    if (positions.length === 0) {
      return NextResponse.json({ matches: [], message: "אין משרות פעילות" })
    }

    // 🗺️ מיקום המועמד - עם נרמול מאגר יישובים מלא!
    const rawCandidateCity = (candidate.city || '').trim()
    const candidateCity = normalizeLocality(rawCandidateCity)
    const candidateCityExtracted = extractLocalityFromAddress(rawCandidateCity)
    const finalCandidateCity = candidateCityExtracted || candidateCity
    
    console.log(`🗺️ מועמד: ${candidate.name}, עיר: "${finalCandidateCity}", משרות: ${positions.length}`)

    // אם נבחרה משרה ספציפית - AI מלא
    if (positionId) {
      const position = positions.find(p => p.id === positionId)
      if (!position) {
        return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 })
      }
      const result = await analyzeMatchV3(candidate, position, finalCandidateCity)
      return NextResponse.json(result)
    }

    // ========================================
    // 🏦 פילטר בנקאים: רק אם יש למועמד תואר אקדמי!
    // טלרים - עוברים רגיל ללא מגבלת תואר
    // ========================================
    const hasDegree = candidateHasDegree(candidate)
    const positionsForScan = positions.filter(pos => {
      if (isBankerPosition(pos) && !hasDegree) {
        return false // 🚫 בנקאי ללא תואר - לא מציגים
      }
      return true
    })
    const filteredBankerCount = positions.length - positionsForScan.length
    if (filteredBankerCount > 0) {
      console.log(`🏦 סונן: ${filteredBankerCount} משרות בנקאיות (למועמד אין תואר)`)
    }

    // ⚡ שלב 1: סינון מהיר בלי AI - עובר על כל המשרות!
    console.log(`⚡ התחלת סינון מהיר ל-${positionsForScan.length} משרות...`)
    const quickScanStart = Date.now()
    
    const quickResults = positionsForScan.map(position => {
      // חישוב מקומי מהיר - אין קריאות רשת!
      // GPS מדויק + תמיכה בכמה ערים בשדה location
      const locResult = calculateLocationScore(candidate.city || '', position.location || '')
      const locationMatch = locResult.score >= 30
      const quickMatch = smartFallbackMatch(candidate, position, finalCandidateCity, locationMatch)
      return { ...quickMatch, _quickScore: quickMatch.score, _locationScore: locResult.score, _isExactCity: locResult.isExactCity }
    })
    
    console.log(`⚡ סינון מהיר הושלם ב-${Date.now() - quickScanStart}ms`)

    // מיון לפי מיקום GPS מדויק + ציון
    quickResults.sort((a, b) => {
      // אותה עיר קודם!
      if (a._isExactCity && !b._isExactCity) return -1
      if (!a._isExactCity && b._isExactCity) return 1
      // אחר כך לפי ציון מיקום GPS
      if (a._locationScore !== b._locationScore) return b._locationScore - a._locationScore
      return b._quickScore - a._quickScore
    })

    // 🧠 שלב 2: AI רק על ה-25 הטובים ביותר (בבאצ'ים של 15!)
    const TOP_FOR_AI = 25
    const BATCH_SIZE = 15
    const topCandidates = quickResults.slice(0, TOP_FOR_AI)
    const restResults = quickResults.slice(TOP_FOR_AI)
    
    console.log(`🧠 מריץ AI על ${topCandidates.length} משרות מובילות...`)
    const aiStart = Date.now()
    
    const aiResults: any[] = []
    for (let i = 0; i < topCandidates.length; i += BATCH_SIZE) {
      const batch = topCandidates.slice(i, i + BATCH_SIZE)
      const batchPositions = batch.map(r => positionsForScan.find(p => p.id === r.positionId)!)
      
      const batchResults = await Promise.all(
        batchPositions.map(async (position) => {
          try {
            return await analyzeMatchV3(candidate, position, finalCandidateCity)
          } catch (error) {
            // במקרה של שגיאה - השתמש בתוצאה המהירה
            const quickResult = batch.find(b => b.positionId === position.id)
            return quickResult || createErrorMatch(position)
          }
        })
      )
      aiResults.push(...batchResults)
    }
    
    console.log(`🧠 AI הושלם ב-${Date.now() - aiStart}ms`)

    // איחוד התוצאות: AI results + quick results לשאר
    const allMatches = [...aiResults, ...restResults]

    // מיון סופי - אותה עיר ראשון, אחר כך ציון מיקום GPS, אחר כך ציון כולל
    allMatches.sort((a, b) => {
      // אותה עיר קודם כל!
      const aExact = (a as any)._isExactCity === true
      const bExact = (b as any)._isExactCity === true
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      // אחר כך מיקום קרוב
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
      // ואז לפי ציון כולל
      return b.score - a.score
    })

    // 🔍 Debug: הצגת טווח הציונים
    const scores = allMatches.map(m => m.score).sort((a, b) => b - a)
    console.log(`📊 ציונים: מקס=${scores[0]}, מין=${scores[scores.length-1]}, מיקום=${allMatches.filter(m => m.locationMatch).length}`)

    // ========================================
    // 🚗 עדיפות למשרות קרובות - אם אין רכב במשרה
    // ========================================
    const positionsWithCar = new Set<string>()
    for (const match of allMatches) {
      const position = positions.find(p => p.id === match.positionId)
      if (position) {
        const hasCarBenefit = /רכב צמוד|רכב חברה|רכב|הסעה|הסעות/i.test(
          (position.description || '') + ' ' + (position.salaryRange || '')
        )
        if (hasCarBenefit) positionsWithCar.add(match.positionId)
      }
    }
    
    // סינון חכם - חלוקה לפי מיקום ורכב
    const nearbyMatches = allMatches.filter(m => m.locationMatch)
    const farWithCarMatches = allMatches.filter(m => !m.locationMatch && positionsWithCar.has(m.positionId))
    const farWithoutCarMatches = allMatches.filter(m => !m.locationMatch && !positionsWithCar.has(m.positionId))

    // מיון לפי ציון בתוך כל קבוצה
    nearbyMatches.sort((a, b) => b.score - a.score)
    farWithCarMatches.sort((a, b) => b.score - a.score)
    farWithoutCarMatches.sort((a, b) => b.score - a.score)

    // ✅ הצג את כל המשרות מעל 50% + מינימום 15 משרות
    // אלגוריתם: 50% מיקום | 25% תגיות | 25% AI
    const MIN_RESULTS = 15
    const allSortedByScore = [...allMatches].sort((a, b) => b.score - a.score)
    const above50 = allSortedByScore.filter(m => m.score >= 50)
    const below50 = allSortedByScore.filter(m => m.score < 50)

    let relevantMatches: typeof allMatches = [...above50]

    // אם פחות מ-15 משרות מעל 50% - השלם עד 15 עם הציונים הגבוהים הבאים
    if (relevantMatches.length < MIN_RESULTS) {
      const needed = MIN_RESULTS - relevantMatches.length
      relevantMatches.push(...below50.slice(0, needed))
    }

    // 🏦 הגבלת טלרים - לא יותר מ-5 ברשימה (בנקאים כבר פוסלו מוקדם אם אין תואר)
    const MAX_TELLERS = 5
    const TELLER_REGEX = /טלר|טלרית/i
    let tellerCount = 0
    const cappedMatches: typeof relevantMatches = []
    const removedTellers: typeof relevantMatches = []

    for (const match of relevantMatches) {
      const pos = positions.find(p => p.id === match.positionId)
      const isTeller = pos && TELLER_REGEX.test(pos.title || '')
      if (isTeller && tellerCount >= MAX_TELLERS) {
        removedTellers.push(match)
      } else {
        if (isTeller) tellerCount++
        cappedMatches.push(match)
      }
    }

    // אם הוסרו טלרים - מלא את המקומות מהמשרות הטובות הבאות
    if (removedTellers.length > 0) {
      const inList = new Set(cappedMatches.map(m => m.positionId))
      const removedIds = new Set(removedTellers.map(m => m.positionId))
      const fillFrom = allMatches.filter(m => !inList.has(m.positionId) && !removedIds.has(m.positionId))
      cappedMatches.push(...fillFrom.slice(0, removedTellers.length))
      cappedMatches.sort((a, b) => {
        if (a.locationMatch && !b.locationMatch) return -1
        if (!a.locationMatch && b.locationMatch) return 1
        return b.score - a.score
      })
      console.log(`🏦 הוגבלו ${removedTellers.length} טלרים (נשארו ${tellerCount}), מולאו ${Math.min(removedTellers.length, fillFrom.length)} משרות אחרות`)
    }

    relevantMatches = cappedMatches

    console.log(`📋 לפני: ${allMatches.length} משרות, אחרי סינון: ${relevantMatches.length}`)
    console.log(`  📍 קרובות: ${nearbyMatches.length}, 🚗 עם רכב: ${farWithCarMatches.length}, 🚶 בלי רכב: ${farWithoutCarMatches.length}`)
    
    const notRelevant = allMatches.filter(m => !relevantMatches.includes(m))

    const totalTime = Date.now() - startTime
    console.log(`✅ סריקה הושלמה ב-${totalTime}ms | ${positions.length} משרות | ${aiResults.length} עם AI`)

    return NextResponse.json({ 
      matches: relevantMatches,
      notRelevant: notRelevant.length,
      totalScanned: positions.length,
      aiAnalyzed: aiResults.length,
      scanTimeMs: totalTime,
      candidateCity: candidate.city || 'לא צוין',
      normalizedCity: finalCandidateCity,
      locationDatabase: TOTAL_LOCALITIES
    })

  } catch (error) {
    console.error("Error in AI Match V3:", error)
    return NextResponse.json({ error: "שגיאה בסריקה" }, { status: 500 })
  }
}

/**
 * בדיקת התאמת מיקום תומכת בכמה ערים מופרדות בפסיק (למשל: 'לוד, אשקלון')
 */
function checkLocationMatch(candidateCity: string, positionLocation: string): boolean {
  if (!candidateCity || !positionLocation) return false
  const parts = positionLocation.split(/[,،\/]+/).map(p => p.trim()).filter(Boolean)
  return parts.some(part => {
    const posLoc = extractLocalityFromAddress(part) || normalizeLocality(part)
    return !!(posLoc && areLocationsNearby(candidateCity, posLoc))
  })
}

async function analyzeMatchV3(candidate: any, position: any, candidateCity: string) {
  // 🗺️ נרמול מיקום המשרה עם מאגר יישובים מלא!
  const rawPositionLocation = position.location || ''
  const positionLocality = extractLocalityFromAddress(rawPositionLocation) || normalizeLocality(rawPositionLocation)
  
  // בדיקת התאמת מיקום - GPS מדויק + תמיכה בכמה ערים
  const locResult = calculateLocationScore(candidate.city || '', rawPositionLocation)
  const locationMatch = locResult.score >= 30  // עיר קרובה = match

  // 🔥 הכנת מידע מלא על המועמד כולל קורות חיים!
  const resumeText = candidate.resume || ''
  const hasResume = resumeText.trim().length > 50
  const candidateTags = candidate.tags?.map((t: any) => t.name).join(', ') || ''
  const positionTags = position.tags?.map((t: any) => t.name).join(', ') || ''

  const prompt = `אתה מגייס מקצועי. נתח התאמה ספציפית.

👤 מועמד: ${candidate.name}
• תפקיד נוכחי: ${candidate.currentTitle || 'לא צוין'}
• חברה: ${candidate.currentCompany || 'לא צוין'}
• עיר: ${candidate.city || 'לא צוין'}
• ניסיון: ${candidate.yearsOfExperience || 'לא צוין'} שנים
• כישורים: ${candidate.skills || 'לא צוין'}
• תגיות: ${candidateTags || 'לא צוין'}
${hasResume ? `📄 קורות חיים:\n${resumeText.substring(0, 2000)}` : '❌ אין קורות חיים'}

💼 משרה: ${position.title}
• מעסיק: ${position.employer?.name || 'לא צוין'}
• מיקום: ${position.location || 'לא צוין'}
• דרישות: ${position.requirements || 'לא צוין'}
• תגיות: ${positionTags || 'לא צוין'}

התאמת מיקום: ${locationMatch ? '✅ קרוב' : '❌ מרוחק'}

החזר JSON:
{
  "score": ציון 0-100 מדויק,
  "strengths": ["יתרון ספציפי מהמידע", "יתרון ספציפי מהמידע"],
  "weaknesses": ["חיסרון ספציפי", "חיסרון ספציפי"],
  "recommendation": "המלצה קצרה",
  "shouldProceed": true/false
}

כללים: 1) אל תמציא - אם אין מידע, ציין זאת 2) ציון נמוך אם אין קורות חיים 3) בדוק התאמה אמיתית

JSON בלבד:`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON")
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // ========================================
    // 🔥 אלגוריתם מאוחד (מרץ 2026):
    // 50% מיקום | 25% תגיות | 25% AI GEMINI
    // בדיוק כמו matching-candidates!
    // ========================================
    
    // בדיקה אם זו משרת מכירות שטח (לא דורשת מיקום)
    const positionText = `${position.title} ${position.description || ''} ${position.requirements || ''}`.toLowerCase()
    const isFieldSales = /מכירות שטח|סוכן.*(שטח|מכירות)|field sales|b2b.*(שטח|sales)|סוכנ.*(מכירות|שטח)/.test(positionText)
    
    // ========================================
    // 📍 מיקום - 50 נקודות מקסימום (50%)
    // שימוש ב-GPS Haversine לדיוק מקסימלי!
    // ========================================
    let locationScore = 0
    if (isFieldSales) {
      locationScore = 50 // סוכני שטח לא תלויים במיקום
    } else if (candidateCity && rawPositionLocation) {
      // חישוב GPS מדויק עם תמיכה במיקום מרובה ערים
      const locResult = calculateLocationScore(candidate.city || '', rawPositionLocation)
      locationScore = locResult.score
    } else if (!candidate.city) {
      locationScore = 5 // אין מידע על מיקום המועמד
    } else {
      locationScore = 0
    }
    
    // ========================================
    // 🏷️ תגיות - 25 נקודות מקסימום (25%)
    // 5 תגיות תואמות = 25 נקודות!
    // ========================================
    const candidateTagNames = candidate.tags?.map((t: any) => t.name.toLowerCase()) || []
    const positionTagNames = position.tags?.map((t: any) => t.name.toLowerCase()) || []
    let tagMatchCount = 0
    for (const pTag of positionTagNames) {
      if (candidateTagNames.some((ct: string) => ct.includes(pTag) || pTag.includes(ct))) {
        tagMatchCount++
      }
    }
    // 5 נקודות לכל תגית, מקסימום 25 (5 תגיות)
    const tagsScore = Math.min(tagMatchCount * 5, 25)
    
    // ========================================
    // 🤖 AI GEMINI - 25 נקודות מקסימום (25%)
    // קריאת CV והתאמה חכמה!
    // ========================================
    // המרת ציון Gemini (0-100) ל-0-25
    const aiScore = Math.round((analysis.score || 0) * 0.25)
    
    // ציון סופי = מיקום + תגיות + AI
    let finalScore = locationScore + tagsScore + aiScore
    finalScore = Math.min(100, finalScore)

    return {
      positionId: position.id,
      positionTitle: position.title,
      employerName: position.employer?.name || 'לא צוין',
      location: position.location || 'לא צוין',
      description: position.description || '',
      requirements: position.requirements || '',
      salaryRange: position.salaryRange || '',
      employmentType: position.employmentType || '',
      workHours: position.workHours || '',       // 🆕
      benefits: position.benefits || '',         // 🆕
      transportation: position.transportation || '', // 🆕
      keywords: position.keywords || '',         // 🆕 מילות מפתח
      openings: position.openings || 1,          // 🆕 מספר משרות
      contactName: position.contactName || '',   // 🆕 שם איש קשר
      score: finalScore,
      locationMatch,
      isFieldSales,  // 🆕 האם משרת שטח
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendation: analysis.recommendation || '',
      shouldProceed: finalScore >= 40 || locationMatch || isFieldSales
    }
  } catch (error) {
    console.error("Gemini error for position", position.id, error)
    return smartFallbackMatch(candidate, position, candidateCity, locationMatch)
  }
}

// התאמה חכמה בלי AI - Fallback
// 🔥 אלגוריתם מאוחד (מרץ 2026): 50% מיקום | 25% תגיות | 25% קריאת CV
function smartFallbackMatch(candidate: any, position: any, candidateCity: string, locationMatch: boolean) {
  const candidateText = buildCandidateText(candidate).toLowerCase()
  const positionTitle = (position.title || '').toLowerCase()
  const positionDesc = ((position.description || '') + ' ' + (position.requirements || '')).toLowerCase()
  
  // בדיקה אם זו משרת מכירות שטח (פטור ממיקום)
  const positionFullText = `${position.title} ${position.description || ''} ${position.requirements || ''}`.toLowerCase()
  const isFieldSales = /מכירות שטח|סוכן.*(שטח|מכירות)|field sales|b2b.*(שטח|sales)|סוכנ.*(מכירות|שטח)/.test(positionFullText)
  
  // ========================================
  // 🔥 אלגוריתם מאוחד: 50% מיקום | 25% תגיות | 25% קריאה
  // ========================================
  let locationScore = 0    // 50 נקודות מקסימום
  let tagsScore = 0        // 25 נקודות מקסימום
  let readingScore = 0     // 25 נקודות מקסימום (במקום AI)
  const strengths: string[] = []
  const weaknesses: string[] = []

  // ========================================
  // 🗺️ מיקום - 50 נקודות מקסימום (50%)
  // GPS Haversine לדיוק מקסימלי!
  // ⚠️ סוכני מכירות שטח מקבלים מלא!
  // ========================================
  if (isFieldSales) {
    locationScore = 50
    strengths.push(`🚗 משרת שטח - מיקום גמיש`)
  } else if (candidate.city && position.location) {
    const locResult = calculateLocationScore(candidate.city || '', position.location || '')
    locationScore = locResult.score
    if (locResult.isExactCity) {
      strengths.push(`📍 אותה עיר: ${candidate.city}`)
    } else if (locResult.score >= 30) {
      strengths.push(`📍 מיקום קרוב: ${position.location}`)
    } else if (locResult.score > 0) {
      weaknesses.push(`מרחק: ${locResult.distanceKm ? Math.round(locResult.distanceKm) + ' ק"מ' : 'מרוחק'}`)
    } else {
      weaknesses.push(`מרחק: המועמד ב${candidate.city}, המשרה ב${position.location}`)
    }
  }

  // ========================================
  // 🏷️ תגיות - 25 נקודות מקסימום (25%)
  // ========================================
  const candidateTags = candidate.tags?.map((t: any) => t.name.toLowerCase()) || []
  const positionTags = position.tags?.map((t: any) => t.name.toLowerCase()) || []
  
  let tagMatches = 0
  for (const tag of positionTags) {
    if (candidateTags.some((ct: string) => ct.includes(tag) || tag.includes(ct))) {
      tagMatches++
      strengths.push(`תגית: ${tag}`)
    }
  }
  tagsScore = positionTags.length > 0 
    ? Math.min(25, Math.round((tagMatches / positionTags.length) * 25))
    : 0

  // ========================================
  // � קריאת CV (במקום AI) - 25 נקודות מקסימום (25%)
  // ========================================
  let hasMatch = false

  // התאמת תפקיד (עד 12 נקודות)
  const titleWords = positionTitle.split(/\s+/).filter((w: string) => w.length > 2)
  let titleMatches = 0
  for (const word of titleWords) {
    if (candidateText.includes(word)) {
      titleMatches++
      hasMatch = true
    }
  }
  if (titleMatches > 0) {
    readingScore += Math.min(12, titleMatches * 4)
    strengths.push(`התאמה לתפקיד ${position.title}`)
  }

  // כישורים מקורות חיים (עד 13 נקודות)
  const skills = (candidate.skills || '').toLowerCase().split(',')
  let skillMatches = 0
  for (const skill of skills) {
    if (skill.trim() && skill.trim().length > 2 && positionDesc.includes(skill.trim())) {
      skillMatches++
      hasMatch = true
    }
  }
  readingScore += Math.min(13, skillMatches * 4)

  readingScore = Math.min(25, readingScore) // מקסימום 25 נקודות

  // ניסיון - למידע בלבד (לא משפיע על הציון)
  const years = candidate.yearsOfExperience || 0
  if (years >= 2) {
    strengths.push(`${years} שנות ניסיון`)
  }

  // 🆕 אם אין התאמה כלל
  if (!hasMatch && tagMatches === 0 && !isFieldSales) {
    weaknesses.push('לא נמצאה התאמה ברורה - יש לבדוק ידנית')
  }

  // ========================================
  // ציון סופי: 50% מיקום + 25% תגיות + 25% קריאה
  // ========================================
  let score = locationScore + tagsScore + readingScore
  score = Math.min(100, Math.round(score))
  
  // 🔍 Debug
  if (Math.random() < 0.05) {
    console.log(`🎯 ${position.title}: מיקום=${locationScore}${isFieldSales ? '(שטח)' : ''}, תגיות=${tagsScore}, קריאה=${readingScore}, סה"כ=${score}`)
  }

  // קביעת המלצה חכמה
  let recommendation = ''
  let shouldProceed = false

  if (score >= 70) {
    recommendation = '⭐ התאמה מצוינת - מומלץ מאוד לפנות'
    shouldProceed = true
  } else if (score >= 50) {
    recommendation = '✅ התאמה טובה - כדאי לבדוק'
    shouldProceed = true
  } else if (isFieldSales) {
    recommendation = '🚗 משרת שטח - מיקום גמיש'
    shouldProceed = true
  } else if (locationMatch) {
    recommendation = '📍 המיקום מתאים - שווה לבדוק'
    shouldProceed = true
  } else if (score >= 30) {
    recommendation = '🔍 התאמה חלקית - לשיקולך'
    shouldProceed = false
  } else if (score >= 15) {
    recommendation = '🔍 התאמה בסיסית - לבדיקה'
    shouldProceed = false
  } else {
    recommendation = '⚠️ התאמה נמוכה'
    shouldProceed = false
  }

  return {
    positionId: position.id,
    positionTitle: position.title,
    employerName: position.employer?.name || 'לא צוין',
    location: position.location || 'לא צוין',
    description: position.description || '',
    requirements: position.requirements || '',
    salaryRange: position.salaryRange || '',
    employmentType: position.employmentType || '',
    workHours: position.workHours || '',       // 🆕
    benefits: position.benefits || '',         // 🆕
    transportation: position.transportation || '', // 🆕
    keywords: position.keywords || '',         // 🆕 מילות מפתח
    openings: position.openings || 1,          // 🆕 מספר משרות
    contactName: position.contactName || '',   // 🆕 שם איש קשר
    score,
    locationMatch,
    isFieldSales,  // 🆕 האם משרת שטח
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 3),
    recommendation,
    shouldProceed
  }
}

function buildCandidateText(candidate: any) {
  return `
שם: ${candidate.name}
תפקיד: ${candidate.currentTitle || 'לא צוין'}
חברה: ${candidate.currentCompany || 'לא צוין'}
ניסיון: ${candidate.yearsOfExperience || 0} שנים
מיקום: ${candidate.city || 'לא צוין'}
כישורים: ${candidate.skills || 'לא צוין'}
תגיות: ${candidate.tags?.map((t: any) => t.name).join(', ') || 'אין'}
קורות חיים: ${candidate.resume || candidate.notes || 'אין'}`.trim()
}

function buildPositionText(position: any) {
  return `
משרה: ${position.title}
מעסיק: ${position.employer?.name || 'לא צוין'}
מיקום: ${position.location || 'לא צוין'}
תיאור: ${position.description || 'לא צוין'}
דרישות: ${position.requirements || 'לא צוין'}
תגיות: ${position.tags?.map((t: any) => t.name).join(', ') || 'אין'}`.trim()
}

function createErrorMatch(position: any) {
  return {
    positionId: position.id,
    positionTitle: position.title,
    employerName: position.employer?.name || 'לא צוין',
    location: position.location || 'לא צוין',
    description: position.description || '',
    requirements: position.requirements || '',
    salaryRange: position.salaryRange || '',
    employmentType: position.employmentType || '',
    score: 0,
    locationMatch: false,
    strengths: [],
    weaknesses: ['שגיאה בניתוח'],
    recommendation: 'לא ניתן לנתח',
    shouldProceed: false
  }
}

// 🗺️ פונקציות מיקום הועברו ל-lib/israel-locations.ts עם מאגר יישובים מלא של ישראל!

// ========================================
// 🏦 זיהוי משרת בנקאי (לא טלר!) + בדיקת תואר
// ========================================

/**
 * משרת בנקאי = כותרת/תיאור מכיל בנקאי/בנקאות אך לא נופל תחת טלר/קופאי
 * דוגמאות: יועץ בנקאי, מנהל בנקאות, בנקאי בכיר
 * לא: טלר בנקאי, קופאי בנק (אלה ≠ תפקידי בנקאות)
 */
function isBankerPosition(position: any): boolean {
  const title = (position.title || '').toLowerCase()
  const desc = ((position.description || '') + ' ' + (position.requirements || '')).toLowerCase()
  const fullText = title + ' ' + desc

  // זיהוי מפורש של טלר/קופאי
  const isTeller = /טלר|טלרית|קופאי|קופאית|teller/i.test(title)
  if (isTeller) return false

  // זיהוי בנקאי
  return /בנקאי|בנקאות|יועץ\s*בנקאי|מנהל\s*בנקאות|מנהל\s*סניף\s*בנק|יועץ\s*פיננסי\s*בנק|יועץ\s*השקעות\s*בנק/i.test(fullText)
}

/**
 * בדיקת תואר אקדמי - שולפים מכל שדות הטקסט של המועמד
 * מחפש: תואר, B.A, M.Sc, MBA, אוניברסיטה + בוגר, וכו'
 */
function candidateHasDegree(candidate: any): boolean {
  // איסוף כל הטקסט הרלוונטי
  const textSources = [
    candidate.skills || '',
    candidate.notes || '',
    candidate.resume || '',
    candidate.currentTitle || '',
    candidate.aiProfile || '',
    candidate.tags?.map((t: any) => t.name).join(' ') || '',
  ].join(' ').toLowerCase()

  // ביטויים המעידים על תואר אקדמי
  const degreePatterns = [
    /תואר/,               // תואר ראשון/שני/שלישי
    /b\.?a\.?\b/,         // B.A / BA
    /b\.?sc\.?\b/,        // B.Sc / BSc
    /m\.?a\.?\b/,         // M.A / MA
    /m\.?sc\.?\b/,        // M.Sc / MSc
    /mba/,                // MBA
    /llb|עו"ד|עורך\s*דין/, // משפטים
    /בוגר\s*(אוניברסיטה|מכללה|הנדסה)/,
    /אקדמי/,              // לימודים אקדמיים
    /אוניברסיטה/,         // למד/בוגר אוניברסיטה
    /מוסמך/,              // תואר מוסמך
    /דוקטורט|phd/,        // דוקטורט
  ]

  return degreePatterns.some(pattern => pattern.test(textSources))
}


