import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 🧠 AI Match V3 - סריקה אנושית חכמה
 * עובר על כל משרה אחת אחת כמו מגייס אנושי
 * מתעדף מיקום קרוב למועמד!
 */
export async function POST(request: Request) {
  try {
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

    // שליפת כל המשרות הפעילות
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: { employer: true, tags: true }
    })

    if (positions.length === 0) {
      return NextResponse.json({ matches: [], message: "אין משרות פעילות" })
    }

    // מיקום המועמד
    const candidateCity = (candidate.city || '').trim().toLowerCase()
    
    // מיון ראשוני לפי מיקום - משרות קרובות למועמד קודם!
    const sortedPositions = positions.sort((a, b) => {
      const locA = (a.location || '').toLowerCase()
      const locB = (b.location || '').toLowerCase()
      
      const matchA = candidateCity && (locA.includes(candidateCity) || candidateCity.includes(locA.split(' ')[0]))
      const matchB = candidateCity && (locB.includes(candidateCity) || candidateCity.includes(locB.split(' ')[0]))
      
      if (matchA && !matchB) return -1
      if (!matchA && matchB) return 1
      return 0
    })

    // אם נבחרה משרה ספציפית
    if (positionId) {
      const position = positions.find(p => p.id === positionId)
      if (!position) {
        return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 })
      }
      const result = await analyzeMatchV3(candidate, position, candidateCity)
      return NextResponse.json(result)
    }

    // 🚀 סריקה מהירה במקביל - 5 משרות בו-זמנית!
    const BATCH_SIZE = 5
    const matches: any[] = []
    
    for (let i = 0; i < sortedPositions.length; i += BATCH_SIZE) {
      const batch = sortedPositions.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (position) => {
          try {
            return await analyzeMatchV3(candidate, position, candidateCity)
          } catch (error) {
            console.error(`Error analyzing position ${position.id}:`, error)
            return createErrorMatch(position)
          }
        })
      )
      matches.push(...batchResults)
    }

    // מיון סופי: קודם לפי בונוס מיקום, אחרי זה לפי ציון
    matches.sort((a, b) => {
      // משרות עם בונוס מיקום קודמות
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
      // אחרי זה לפי ציון
      return b.score - a.score
    })

    // סינון - רק משרות עם סיכוי סביר
    const relevantMatches = matches.filter(m => m.score >= 30 || m.locationMatch)
    const notRelevant = matches.filter(m => m.score < 30 && !m.locationMatch)

    return NextResponse.json({ 
      matches: relevantMatches,
      notRelevant: notRelevant.length,
      totalScanned: positions.length,
      candidateCity: candidate.city || 'לא צוין'
    })

  } catch (error) {
    console.error("Error in AI Match V3:", error)
    return NextResponse.json({ error: "שגיאה בסריקה" }, { status: 500 })
  }
}

async function analyzeMatchV3(candidate: any, position: any, candidateCity: string) {
  const positionLocation = (position.location || '').toLowerCase()
  
  // בדיקת התאמת מיקום
  const locationMatch = candidateCity && positionLocation && (
    positionLocation.includes(candidateCity) || 
    candidateCity.includes(positionLocation.split(' ')[0]) ||
    areNearbyLocations(candidateCity, positionLocation)
  )

  // הכנת טקסט לAI - קצר יותר לזריזות
  const candidateText = `${candidate.name}|${candidate.currentTitle||''}|${candidate.city||''}|${candidate.yearsOfExperience||0}שנים|${candidate.skills||''}`
  const positionText = `${position.title}|${position.employer?.name||''}|${position.location||''}|${position.tags?.map((t:any)=>t.name).join(',')}`

  const prompt = `התאמת מועמד למשרה. החזר JSON בלבד.
מועמד: ${candidateText}
משרה: ${positionText}
{"score":0-100,"strengths":["יתרון"],"weaknesses":["חיסרון"],"recommendation":"קצר","shouldProceed":true/false}`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON")
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // חישוב ציון סופי עם בונוס מיקום
    let finalScore = analysis.score || 0
    if (locationMatch) {
      finalScore = Math.min(100, finalScore + 25)
    } else if (analysis.locationBonus) {
      finalScore = Math.min(100, finalScore + analysis.locationBonus)
    }

    return {
      positionId: position.id,
      positionTitle: position.title,
      employerName: position.employer?.name || 'לא צוין',
      location: position.location || 'לא צוין',
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
function smartFallbackMatch(candidate: any, position: any, candidateCity: string, locationMatch: boolean) {
  const candidateText = buildCandidateText(candidate).toLowerCase()
  const positionTitle = (position.title || '').toLowerCase()
  const positionDesc = ((position.description || '') + ' ' + (position.requirements || '')).toLowerCase()
  
  // ציון בסיסי - כל משרה מקבלת לפחות 10 נקודות
  let score = 10
  const strengths: string[] = []
  const weaknesses: string[] = []

  // בונוס מיקום - 25 נקודות!
  if (locationMatch) {
    score += 25
    strengths.push(`📍 מיקום מתאים: ${candidate.city || 'לא צוין'}`)
  } else if (candidate.city && position.location) {
    // בדיקה נוספת למיקום קרוב
    const candidateCityLower = candidate.city.toLowerCase()
    const positionLocationLower = position.location.toLowerCase()
    if (candidateCityLower.includes(positionLocationLower) || positionLocationLower.includes(candidateCityLower)) {
      score += 20
      strengths.push(`מיקום קרוב: ${position.location}`)
    } else {
      weaknesses.push(`מרחק: המועמד ב${candidate.city}, המשרה ב${position.location}`)
    }
  }

  // התאמת תפקיד
  const titleWords = positionTitle.split(/\s+/).filter((w: string) => w.length > 2)
  let titleMatches = 0
  for (const word of titleWords) {
    if (candidateText.includes(word)) {
      titleMatches++
    }
  }
  if (titleMatches > 0) {
    const titleScore = Math.min(30, titleMatches * 15)
    score += titleScore
    strengths.push(`התאמה לתפקיד ${position.title}`)
  }

  // התאמת תגיות
  const candidateTags = candidate.tags?.map((t: any) => t.name.toLowerCase()) || []
  const positionTags = position.tags?.map((t: any) => t.name.toLowerCase()) || []
  
  let tagMatches = 0
  for (const tag of positionTags) {
    if (candidateTags.some((ct: string) => ct.includes(tag) || tag.includes(ct))) {
      tagMatches++
      strengths.push(`תגית: ${tag}`)
    }
  }
  score += Math.min(20, tagMatches * 10)

  // ניסיון
  const years = candidate.yearsOfExperience || 0
  if (years >= 5) {
    score += 15
    strengths.push(`${years} שנות ניסיון`)
  } else if (years >= 2) {
    score += 10
    strengths.push(`${years} שנות ניסיון`)
  } else if (years >= 1) {
    score += 5
    strengths.push(`${years} שנת ניסיון`)
  }

  // כישורים
  const skills = (candidate.skills || '').toLowerCase().split(',')
  let skillMatches = 0
  for (const skill of skills) {
    if (skill.trim() && skill.trim().length > 2 && positionDesc.includes(skill.trim())) {
      skillMatches++
    }
  }
  score += Math.min(15, skillMatches * 5)

  // חיפוש מילות מפתח בקורות חיים
  const resume = (candidate.resume || candidate.notes || '').toLowerCase()
  if (resume.length > 50) {
    // מילות מפתח נפוצות
    const keywords = positionTitle.split(/\s+/).filter((w: string) => w.length > 2)
    let keywordMatches = 0
    for (const word of keywords) {
      if (resume.includes(word)) {
        keywordMatches++
      }
    }
    if (keywordMatches > 0) {
      score += Math.min(10, keywordMatches * 3)
      if (keywordMatches >= 2) {
        strengths.push(`קורות חיים תואמים למשרה`)
      }
    }
  }

  score = Math.min(100, score)

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
  } else {
    recommendation = '⚠️ התאמה נמוכה'
    shouldProceed = false
  }

  return {
    positionId: position.id,
    positionTitle: position.title,
    employerName: position.employer?.name || 'לא צוין',
    location: position.location || 'לא צוין',
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
    score: 0,
    locationMatch: false,
    strengths: [],
    weaknesses: ['שגיאה בניתוח'],
    recommendation: 'לא ניתן לנתח',
    shouldProceed: false
  }
}

// בדיקת ערים קרובות בישראל
function areNearbyLocations(city1: string, city2: string): boolean {
  const nearbyGroups = [
    ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'רמת השרון', 'הרצליה', 'פתח תקווה'],
    ['ירושלים', 'בית שמש', 'מעלה אדומים', 'מודיעין'],
    ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נשר'],
    ['באר שבע', 'אופקים', 'נתיבות', 'דימונה'],
    ['אשדוד', 'אשקלון', 'קרית גת'],
    ['נתניה', 'כפר סבא', 'רעננה', 'הוד השרון', 'הרצליה'],
    ['ראשון לציון', 'נס ציונה', 'רחובות', 'יבנה'],
    ['פתח תקווה', 'ראש העין', 'כפר קאסם', 'יהוד'],
    ['עפולה', 'נצרת', 'נוף הגליל', 'מגדל העמק']
  ]

  for (const group of nearbyGroups) {
    const c1Match = group.some(c => city1.includes(c) || c.includes(city1))
    const c2Match = group.some(c => city2.includes(c) || c.includes(city2))
    if (c1Match && c2Match) return true
  }
  
  return false
}


