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

    // 🎯 בניית רשימת 20 המשרות הטובות ביותר
    // עדיפות: 1) קרובות, 2) רחוקות עם רכב, 3) רחוקות בלי רכב (רק אם ציון גבוה)
    const MAX_RESULTS = 20
    let relevantMatches: typeof allMatches = []
    
    // קודם - כל המשרות הקרובות (עד MAX_RESULTS)
    relevantMatches.push(...nearbyMatches.slice(0, MAX_RESULTS))
    
    // אם יש מקום - הוסף משרות עם רכב (רחוקות אבל עם הסעה/רכב צמוד)
    if (relevantMatches.length < MAX_RESULTS) {
      const remaining = MAX_RESULTS - relevantMatches.length
      relevantMatches.push(...farWithCarMatches.slice(0, remaining))
    }
    
    // אם עדיין יש מקום - הוסף משרות רחוקות בלי רכב
    // 🔧 תיקון: הורדת הסף מ-50 ל-25 כי ללא התאמת מיקום (65%) מקסימום הציון הוא 35%
    // זה מאפשר למועמדי מכירות להתאים למשרות מכירות גם בערים שונות
    if (relevantMatches.length < MAX_RESULTS) {
      const remaining = MAX_RESULTS - relevantMatches.length
      const highScoreFar = farWithoutCarMatches.filter(m => m.score >= 25)
      relevantMatches.push(...highScoreFar.slice(0, remaining))
    }

    // 🏦 הגבלת טלרים/בנקאים - לא יותר מ-5 ביחד ברשימת 20 המשרות
    const MAX_TELLERS = 5
    const TELLER_REGEX = /טלר|בנקאי/i
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
      console.log(`🏦 הוגבלו ${removedTellers.length} טלרים/בנקאים (נשארו ${tellerCount}), מולאו ${Math.min(removedTellers.length, fillFrom.length)} משרות אחרות`)
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
    // 🔥 אלגוריתם מאוחד (מרץ 2026):
    // 50% מיקום | 25% תגיות | 25% AI GEMINI
    // בדיוק כמו matching-candidates!
    // ========================================
    
    // בדיקה אם זו משרת מכירות שטח (לא דורשת מיקום)
    const positionText = `${position.title} ${position.description || ''} ${position.requirements || ''}`.toLowerCase()
    const isFieldSales = /מכירות שטח|סוכן.*(שטח|מכירות)|field sales|b2b.*(שטח|sales)|סוכנ.*(מכירות|שטח)/.test(positionText)
    
    // ========================================
    // 📍 מיקום - 50 נקודות מקסימום (50%)
    // ========================================
    let locationScore = 0
    if (isFieldSales) {
      locationScore = 50 // סוכני שטח לא תלויים במיקום
    } else if (locationMatch) {
      locationScore = 50 // התאמה מושלמת
    } else if (candidateCity && positionLocality) {
      // בדיקת קרבה - ערים קרובות = 40, אזור = 30
      const nearbyCheck = areLocationsNearby(candidateCity, positionLocality)
      if (nearbyCheck) {
        locationScore = 40 // קרוב
      } else {
        locationScore = 0 // רחוק
      }
    } else {
      locationScore = 15 // אין מידע
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
  // ⚠️ סוכני מכירות שטח מקבלים מלא!
  // ========================================
  if (isFieldSales) {
    locationScore = 50
    strengths.push(`🚗 משרת שטח - מיקום גמיש`)
  } else if (locationMatch) {
    locationScore = 50
    strengths.push(`📍 מיקום מתאים: ${candidate.city || 'לא צוין'}`)
  } else if (candidate.city && position.location) {
    const positionLocality = extractLocalityFromAddress(position.location) || normalizeLocality(position.location)
    if (areLocationsNearby(candidateCity, positionLocality)) {
      locationScore = 40
      strengths.push(`מיקום קרוב: ${position.location}`)
    } else {
      locationScore = 0
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


