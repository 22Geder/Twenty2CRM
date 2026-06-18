import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 🧠 AI Match Simple - ניתוח התאמה פשוט וחכם
 * POST: candidateId + positionId (אופציונלי) או analyzeAll=true
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { candidateId, positionId, analyzeAll } = body

    if (!candidateId) {
      return NextResponse.json({ error: "חסר מזהה מועמד" }, { status: 400 })
    }

    // שליפת המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: "מועמד לא נמצא" }, { status: 404 })
    }

    // הכנת טקסט המועמד
    const candidateText = `
שם: ${candidate.name}
תפקיד נוכחי: ${candidate.currentTitle || 'לא צוין'}
חברה נוכחית: ${candidate.currentCompany || 'לא צוין'}
שנות ניסיון: ${candidate.yearsOfExperience || 'לא צוין'}
עיר: ${candidate.city || 'לא צוין'}
כישורים: ${candidate.skills || 'לא צוין'}
תגיות: ${candidate.tags?.map((t: any) => t.name).join(', ') || 'אין'}
קורות חיים:
${candidate.resume || candidate.notes || 'אין מידע נוסף'}
`.trim()

    // אם נבחרה משרה ספציפית
    if (positionId) {
      const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: { employer: true, tags: true }
      })

      if (!position) {
        return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 })
      }

      const result = await analyzeMatch(candidateText, position)
      return NextResponse.json(result)
    }

    // אם רוצים לנתח את כל המשרות
    if (analyzeAll) {
      const positions = await prisma.position.findMany({
        where: { active: true },
        include: { employer: true, tags: true }
      })

      if (positions.length === 0) {
        return NextResponse.json({ matches: [], message: "אין משרות פעילות" })
      }

      const matches = []
      
      for (const position of positions) {
        try {
          const result = await analyzeMatch(candidateText, position)
          matches.push(result)
        } catch (error) {
          console.error(`Error analyzing position ${position.id}:`, error)
          // המשך לבא גם אם נכשל
          matches.push({
            positionId: position.id,
            positionTitle: position.title,
            employerName: position.employer?.name || 'לא צוין',
            location: position.location || 'לא צוין',
            score: 0,
            strengths: [],
            weaknesses: ['שגיאה בניתוח'],
            recommendation: 'לא ניתן לנתח משרה זו',
            shouldProceed: false
          })
        }
      }

      // מיון לפי ציון
      matches.sort((a, b) => b.score - a.score)

      return NextResponse.json({ matches })
    }

    return NextResponse.json({ error: "חסר positionId או analyzeAll" }, { status: 400 })

  } catch (error) {
    console.error("Error in AI Match Simple:", error)
    return NextResponse.json(
      { error: "שגיאה בניתוח" },
      { status: 500 }
    )
  }
}

async function analyzeMatch(candidateText: string, position: any) {
  const positionText = `
משרה: ${position.title}
מעסיק: ${position.employer?.name || 'לא צוין'}
מיקום: ${position.location || 'לא צוין'}
תיאור: ${position.description || 'לא צוין'}
דרישות: ${position.requirements || 'לא צוין'}
תגיות: ${position.tags?.map((t: any) => t.name).join(', ') || 'אין'}
`.trim()

  const prompt = `אתה מגייס מקצועי עם 20 שנות ניסיון. נתח התאמה בין מועמד למשרה.

=== מועמד ===
${candidateText}

=== משרה ===
${positionText}

החזר JSON בפורמט הבא בלבד (ללא טקסט נוסף):
{
  "score": [מספר 0-100 - אחוז התאמה],
  "strengths": ["יתרון 1", "יתרון 2", "יתרון 3"],
  "weaknesses": ["חיסרון 1", "חיסרון 2"],
  "recommendation": "המלצה קצרה בעברית",
  "shouldProceed": [true/false - האם להמשיך עם המועמד]
}

הנחיות:
- score מעל 70 = מתאים מאוד
- score 50-70 = מתאים חלקית
- score מתחת 50 = לא מתאים
- בדוק התאמת ניסיון, כישורים, מיקום
- היה ישיר וברור`

  try {
    const model = genAI.getGenerativeModel({ model: (process.env.GEMINI_MODEL || "gemini-2.5-flash") })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // חילוץ JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response")
    }

    const analysis = JSON.parse(jsonMatch[0])

    return {
      positionId: position.id,
      positionTitle: position.title,
      employerName: position.employer?.name || 'לא צוין',
      location: position.location || 'לא צוין',
      score: analysis.score || 0,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendation: analysis.recommendation || '',
      shouldProceed: analysis.shouldProceed || false
    }
  } catch (error) {
    console.error("AI Analysis error:", error)
    
    // ניתוח פשוט בלי AI
    return simpleMatch(candidateText, position)
  }
}

// ניתוח פשוט כ-fallback
function simpleMatch(candidateText: string, position: any) {
  const candidateLower = candidateText.toLowerCase()
  const positionTitle = position.title?.toLowerCase() || ''
  const positionDesc = position.description?.toLowerCase() || ''
  const positionReqs = position.requirements?.toLowerCase() || ''
  
  // ציון בסיסי - כל משרה מקבלת לפחות 10 נקודות
  let score = 10
  const strengths: string[] = []
  const weaknesses: string[] = []

  // בדיקת תואם כותרת
  const titleWords = positionTitle.split(' ')
  for (const word of titleWords) {
    if (word.length > 2 && candidateLower.includes(word)) {
      score += 15
      strengths.push(`התאמה לתפקיד: ${word}`)
    }
  }

  // בדיקת התאמת תגיות
  const candidateTags = candidateText.match(/תגיות:\s*([^\n]+)/)?.[1] || ''
  const positionTags = position.tags?.map((t: any) => t.name.toLowerCase()) || []
  
  for (const tag of positionTags) {
    if (candidateTags.toLowerCase().includes(tag)) {
      score += 10
      strengths.push(`תגית תואמת: ${tag}`)
    } else {
      weaknesses.push(`חסרה תגית: ${tag}`)
    }
  }

  // בדיקת מיקום
  const candidateCity = candidateText.match(/עיר:\s*([^\n]+)/)?.[1]?.trim() || ''
  const positionLocation = position.location || ''
  if (candidateCity && positionLocation && 
      (candidateCity.includes(positionLocation) || positionLocation.includes(candidateCity))) {
    score += 20
    strengths.push(`📍 מיקום מתאים: ${candidateCity}`)
  }

  // בדיקת ניסיון
  const yearsMatch = candidateText.match(/שנות ניסיון:\s*(\d+)/)
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1])
    if (years >= 3) {
      score += 20
      strengths.push(`${years} שנות ניסיון`)
    } else if (years >= 1) {
      score += 10
      strengths.push(`${years} שנות ניסיון`)
    }
  }

  // וידוא שהציון לא עובר 100
  score = Math.min(score, 100)

  // המלצה חכמה
  let recommendation = ''
  let shouldProceed = false

  if (score >= 60) {
    recommendation = '⭐ מועמד פוטנציאלי - מומלץ לבדוק'
    shouldProceed = true
  } else if (score >= 40) {
    recommendation = '✅ יש התאמה - כדאי לשקול'
    shouldProceed = true
  } else if (score >= 25) {
    recommendation = '🔍 התאמה חלקית'
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
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 3),
    recommendation,
    shouldProceed
  }
}


