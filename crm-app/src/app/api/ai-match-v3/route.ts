import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
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

    // 🚀 שליפת משרות מהירה - רק שדות הכרחיים!
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

    // ⚡ שלב 1: סינון מהיר בלי AI - עובר על כל המשרות!
    console.log(`⚡ התחלת סינון מהיר ל-${positions.length} משרות...`)
    const quickScanStart = Date.now()
    
    const quickResults = positions.map(position => {
      // חישוב מקומי מהיר - אין קריאות רשת!
      const positionLocality = extractLocalityFromAddress(position.location || '') || normalizeLocality(position.location || '')
      const locationMatch = !!(finalCandidateCity && positionLocality && areLocationsNearby(finalCandidateCity, positionLocality))
      const quickMatch = smartFallbackMatch(candidate, position, finalCandidateCity, locationMatch)
      return { ...quickMatch, _quickScore: quickMatch.score }
    })
    
    console.log(`⚡ סינון מהיר הושלם ב-${Date.now() - quickScanStart}ms`)

    // מיון לפי ציון מהיר + מיקום
    quickResults.sort((a, b) => {
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
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
      const batchPositions = batch.map(r => positions.find(p => p.id === r.positionId)!)
      
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

    // מיון סופי
    allMatches.sort((a, b) => {
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
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

    // 🎯 בניית רשימת 15 המשרות הטובות ביותר
    // עדיפות: 1) קרובות, 2) רחוקות עם רכב, 3) רחוקות בלי רכב (רק אם ציון גבוה)
    const MAX_RESULTS = 15
    let relevantMatches: typeof allMatches = []
    
    // קודם - כל המשרות הקרובות (עד MAX_RESULTS)
    relevantMatches.push(...nearbyMatches.slice(0, MAX_RESULTS))
    
    // אם יש מקום - הוסף משרות עם רכב (רחוקות אבל עם הסעה/רכב צמוד)
    if (relevantMatches.length < MAX_RESULTS) {
      const remaining = MAX_RESULTS - relevantMatches.length
      relevantMatches.push(...farWithCarMatches.slice(0, remaining))
    }
    
    // אם עדיין יש מקום - הוסף משרות רחוקות בלי רכב רק אם ציון גבוה (50+)
    if (relevantMatches.length < MAX_RESULTS) {
      const remaining = MAX_RESULTS - relevantMatches.length
      const highScoreFar = farWithoutCarMatches.filter(m => m.score >= 50)
      relevantMatches.push(...highScoreFar.slice(0, remaining))
    }
    
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

async function analyzeMatchV3(candidate: any, position: any, candidateCity: string) {
  // 🗺️ נרמול מיקום המשרה עם מאגר יישובים מלא!
  const rawPositionLocation = position.location || ''
  const positionLocality = extractLocalityFromAddress(rawPositionLocation) || normalizeLocality(rawPositionLocation)
  
  // בדיקת התאמת מיקום - עם מאגר כל היישובים בישראל!
  const locationMatch = !!(candidateCity && positionLocality && areLocationsNearby(candidateCity, positionLocality))

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
    // 🆕 חישוב ציון סופי לפי המשקולות החדשים:
    // 65% מיקום + 35% AI (תגיות + קריאה אנושית)
    // ========================================
    
    // הציון מה-AI מייצג 35% מהציון הסופי (תגיות + קריאה אנושית)
    let aiScore = Math.round((analysis.score || 0) * 0.35)
    
    // בונוס מיקום - 65% מהציון הסופי
    let locationBonus = 0
    if (locationMatch) {
      locationBonus = 65
    }

    let finalScore = locationBonus + aiScore
    finalScore = Math.min(100, finalScore)
    
    // הפחתת ציון אם אין קורות חיים (מתוך החלק של ה-AI)
    if (!hasResume) {
      finalScore = Math.max(20, finalScore - 10)
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
      score: finalScore,
      locationMatch,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendation: analysis.recommendation || '',
      shouldProceed: finalScore >= 50 || locationMatch
    }
  } catch (error) {
    console.error("Gemini error for position", position.id, error)
    return smartFallbackMatch(candidate, position, candidateCity, locationMatch)
  }
}

// התאמה חכמה בלי AI
// 🆕 משקולות חדשים: 65% מיקום, 35% תגיות+קריאה אנושית (20% תגיות, 15% קריאה אנושית)
function smartFallbackMatch(candidate: any, position: any, candidateCity: string, locationMatch: boolean) {
  const candidateText = buildCandidateText(candidate).toLowerCase()
  const positionTitle = (position.title || '').toLowerCase()
  const positionDesc = ((position.description || '') + ' ' + (position.requirements || '')).toLowerCase()
  
  // ציון בסיסי
  let locationScore = 0
  let tagsScore = 0      // 20 נקודות מקסימום
  let humanScore = 0     // 15 נקודות מקסימום
  const strengths: string[] = []
  const weaknesses: string[] = []

  // ========================================
  // 🗺️ בונוס מיקום - 65 נקודות מקסימום (65%)
  // ========================================
  if (locationMatch) {
    locationScore = 65
    strengths.push(`📍 מיקום מתאים: ${candidate.city || 'לא צוין'}`)
  } else if (candidate.city && position.location) {
    // בדיקה נוספת למיקום קרוב עם המאגר המלא
    const positionLocality = extractLocalityFromAddress(position.location) || normalizeLocality(position.location)
    if (areLocationsNearby(candidateCity, positionLocality)) {
      locationScore = 55
      strengths.push(`מיקום קרוב: ${position.location}`)
    } else {
      locationScore = 0
      weaknesses.push(`מרחק: המועמד ב${candidate.city}, המשרה ב${position.location}`)
    }
  }

  // ========================================
  // 🏷️ תגיות - 20 נקודות מקסימום (20%)
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
  tagsScore = Math.min(20, tagMatches * 7) // עד 20 נקודות מתגיות

  // ========================================
  // 🧠 קריאה אנושית - 15 נקודות מקסימום (15%)
  // ========================================
  let hasHumanMatch = false

  // התאמת תפקיד (עד 8 נקודות)
  const titleWords = positionTitle.split(/\s+/).filter((w: string) => w.length > 2)
  let titleMatches = 0
  for (const word of titleWords) {
    if (candidateText.includes(word)) {
      titleMatches++
      hasHumanMatch = true
    }
  }
  if (titleMatches > 0) {
    humanScore += Math.min(8, titleMatches * 3)
    strengths.push(`התאמה לתפקיד ${position.title}`)
  }

  // כישורים מקורות חיים (עד 5 נקודות)
  const skills = (candidate.skills || '').toLowerCase().split(',')
  let skillMatches = 0
  for (const skill of skills) {
    if (skill.trim() && skill.trim().length > 2 && positionDesc.includes(skill.trim())) {
      skillMatches++
      hasHumanMatch = true
    }
  }
  humanScore += Math.min(5, skillMatches * 2)

  // ניסיון (עד 2 נקודות)
  const years = candidate.yearsOfExperience || 0
  if (years >= 5) {
    humanScore += 2
    strengths.push(`${years} שנות ניסיון`)
    hasHumanMatch = true
  } else if (years >= 2) {
    humanScore += 1
    strengths.push(`${years} שנות ניסיון`)
    hasHumanMatch = true
  }

  humanScore = Math.min(15, humanScore) // מקסימום 15 נקודות

  // 🆕 אם אין כישורים כלל - בונוס מינימלי
  if (!hasHumanMatch && tagMatches === 0) {
    humanScore = Math.max(humanScore, 15)
    strengths.push('התאמה כללית - יש לבדוק ידנית')
  }

  // ========================================
  // ציון סופי: 65% מיקום + 20% תגיות + 15% קריאה אנושית
  // ========================================
  let score = locationScore + tagsScore + humanScore
  score = Math.min(100, Math.round(score))
  
  // 🔍 Debug - for first 3 positions
  if (Math.random() < 0.05) {
    console.log(`🎯 ${position.title}: מיקום=${locationScore}, תגיות=${tagsScore}, קריאה=${humanScore}, סה"כ=${score}`)
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
    score,
    locationMatch,
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


