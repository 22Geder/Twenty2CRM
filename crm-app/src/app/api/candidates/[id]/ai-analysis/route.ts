import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/candidates/[id]/ai-analysis - ניתוח AI מעמיק של מועמד למשרה ספציפית
export async function POST(
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
    const { positionId } = await request.json()

    if (!positionId) {
      return NextResponse.json(
        { error: "positionId is required" },
        { status: 400 }
      )
    }

    // שליפת המועמד והמשרה עם כל המידע
    const [candidate, position] = await Promise.all([
      prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          tags: true,
        },
      }),
      prisma.position.findUnique({
        where: { id: positionId },
        include: {
          employer: true,
          tags: true,
        },
      }),
    ])

    if (!candidate || !position) {
      return NextResponse.json(
        { error: "Candidate or Position not found" },
        { status: 404 }
      )
    }

    // 🔥 ניתוח AI מעמיק עם Gemini - קורא את הקורות חיים כמו אנושי!
    const aiAnalysis = await analyzeWithGeminiAI(candidate, position)

    // בדיקה אם המועמד עבד בחברה זו בעבר
    let workedAtCompanyBefore = false
    const employerName = position.employer?.name?.toLowerCase() || ''
    const candidateCompany = candidate.currentCompany?.toLowerCase() || ''
    
    if (employerName && candidateCompany && (
      employerName.includes(candidateCompany) || 
      candidateCompany.includes(employerName)
    )) {
      workedAtCompanyBefore = true
    }

    return NextResponse.json({
      matchScore: aiAnalysis.matchScore,
      strengths: aiAnalysis.strengths,
      weaknesses: aiAnalysis.weaknesses,
      candidateName: candidate.name,
      positionTitle: position.title,
      employerName: position.employer?.name,
      workedAtCompanyBefore,
      recommendation: aiAnalysis.recommendation,
      aiInsights: aiAnalysis.insights,
    })

  } catch (error: any) {
    console.error("Error analyzing candidate:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// 🧠 ניתוח AI מלא עם Gemini - קורא קורות חיים כמו מגייס אנושי
async function analyzeWithGeminiAI(candidate: any, position: any): Promise<{
  matchScore: number
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  insights: string
}> {
  try {
    const model = genAI.getGenerativeModel({ model: (process.env.GEMINI_MODEL || "gemini-2.5-flash") })

    // 📋 הכנת מידע מלא על המועמד
    const candidateTags = candidate.tags?.map((t: any) => t.name).join(', ') || 'לא צוינו'
    const positionTags = position.tags?.map((t: any) => t.name).join(', ') || 'לא צוינו'
    
    // 🔥 קריאת קורות החיים המלאים!
    const resumeText = candidate.resume || ''
    const hasResume = resumeText.trim().length > 50

    const prompt = `אתה מגייס בכיר עם 15 שנות ניסיון. קרא את כל המידע בעיון רב ונתח את ההתאמה.

═══════════════════════════════════════════════════════════════════════════════
📄 קורות החיים המלאים של המועמד (קרא בעיון!):
═══════════════════════════════════════════════════════════════════════════════
${hasResume ? resumeText : '❌ לא הועלו קורות חיים - יש להסתמך על המידע המובנה בלבד'}

═══════════════════════════════════════════════════════════════════════════════
👤 פרטי המועמד המובנים במערכת:
═══════════════════════════════════════════════════════════════════════════════
• שם מלא: ${candidate.name || 'לא צוין'}
• עיר מגורים: ${candidate.city || 'לא צוין'}
• טלפון: ${candidate.phone || 'לא צוין'}
• אימייל: ${candidate.email || 'לא צוין'}
• תפקיד נוכחי: ${candidate.currentTitle || 'לא צוין'}
• חברה נוכחית: ${candidate.currentCompany || 'לא צוין'}
• שנות ניסיון: ${candidate.yearsOfExperience || 'לא צוין'}
• כישורים: ${candidate.skills || 'לא צוינו'}
• תגיות/התמחויות: ${candidateTags}
• ציפיות שכר: ${candidate.expectedSalary || 'לא צוין'}
• תקופת הודעה מוקדמת: ${candidate.noticePeriod || 'לא צוין'}
• דירוג במערכת: ${candidate.rating ? `${candidate.rating}/5` : 'לא דורג'}
• קישור לקורות חיים: ${candidate.resumeUrl ? '✅ יש' : '❌ אין'}
• קישור ל-LinkedIn: ${candidate.linkedinUrl ? '✅ יש' : '❌ אין'}
• הערות: ${candidate.notes || 'אין'}

═══════════════════════════════════════════════════════════════════════════════
💼 פרטי המשרה:
═══════════════════════════════════════════════════════════════════════════════
• שם המשרה: ${position.title}
• חברה: ${position.employer?.name || 'לא צוין'}
• מיקום: ${position.location || 'לא צוין'}
• סוג משרה: ${position.employmentType || 'לא צוין'}
• טווח שכר: ${position.salaryRange || 'לא צוין'}
• תגיות/דרישות: ${positionTags}
• תיאור המשרה: ${position.description || 'לא צוין'}
• דרישות: ${position.requirements || 'לא צוין'}
• אמצעי הגעה: ${position.transportation || 'לא צוין'}
• הטבות: ${position.benefits || 'לא צוין'}
• שעות עבודה: ${position.workHours || 'לא צוין'}

═══════════════════════════════════════════════════════════════════════════════
📊 משימתך - ניתוח מעמיק כמו מגייס אנושי:
═══════════════════════════════════════════════════════════════════════════════
1. קרא את קורות החיים המלאים ומצא מידע ספציפי
2. בדוק התאמה אמיתית בין הניסיון לדרישות המשרה
3. שים לב לפערים בין מה שכתוב לבין מה שנדרש
4. אל תמציא מידע - אם משהו חסר, ציין זאת כחולשה

החזר JSON בפורמט הבא (בעברית!):
{
  "matchScore": מספר 0-100 (ציון התאמה מדויק),
  "strengths": [
    "✅ נקודה חזקה 1 - עם פרטים ספציפיים מקורות החיים",
    "✅ נקודה חזקה 2 - עם פרטים ספציפיים מקורות החיים",
    "✅ נקודה חזקה 3 - עם פרטים ספציפיים מקורות החיים",
    "✅ נקודה חזקה 4 - עם פרטים ספציפיים מקורות החיים",
    "✅ נקודה חזקה 5 - עם פרטים ספציפיים מקורות החיים"
  ],
  "weaknesses": [
    "⚠️ נקודה לשיפור 1 - עם הסבר מדויק",
    "⚠️ נקודה לשיפור 2 - עם הסבר מדויק",
    "⚠️ נקודה לשיפור 3 - עם הסבר מדויק",
    "⚠️ נקודה לשיפור 4 - עם הסבר מדויק",
    "⚠️ נקודה לשיפור 5 - עם הסבר מדויק"
  ],
  "recommendation": "המלצה קצרה (מועמדות מומלצת/טובה/חלשה) עם הסבר",
  "insights": "תובנה אנושית של מגייס - מה עולה מקריאת הקורות חיים? מה מרשים? מה מדאיג?"
}

═══════════════════════════════════════════════════════════════════════════════
⚠️ כללים חשובים:
═══════════════════════════════════════════════════════════════════════════════
1. היה ספציפי! אל תכתוב "ניסיון מתאים" - ציין איפה עבד ומה עשה בדיוק
2. אם אין קורות חיים - ציין זאת כחולשה משמעותית
3. בדוק התאמת מיקום - ${candidate.city || 'לא צוין'} מול ${position.location || 'לא צוין'}
4. בדוק התאמת ניסיון - האם התפקידים הקודמים רלוונטיים?
5. אם יש תגיות תואמות (${candidateTags} מול ${positionTags}) - ציין זאת כחוזקה
6. הציון צריך לשקף התאמה אמיתית - אל תתן ציון גבוה אם אין מידע או אם ההתאמה חלקית
7. כל נקודה חייבת להיות שונה ומבוססת על מידע אמיתי!

החזר JSON בלבד, ללא טקסט נוסף.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // פרסור התשובה
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Invalid JSON from Gemini:", text)
      return fallbackAnalysis(candidate, position)
    }

    const analysis = JSON.parse(jsonMatch[0])

    // וידוא שיש בדיוק 5 נקודות חזקות ו-5 נקודות לשיפור
    const strengths = ensureExactFive(analysis.strengths || [], '✅', candidate, position, true)
    const weaknesses = ensureExactFive(analysis.weaknesses || [], '⚠️', candidate, position, false)

    return {
      matchScore: Math.max(0, Math.min(100, analysis.matchScore || 50)),
      strengths,
      weaknesses,
      recommendation: analysis.recommendation || getDefaultRecommendation(analysis.matchScore || 50),
      insights: analysis.insights || 'לא התקבלו תובנות נוספות',
    }

  } catch (error) {
    console.error("Gemini AI error:", error)
    return fallbackAnalysis(candidate, position)
  }
}

// וידוא שיש בדיוק 5 נקודות
function ensureExactFive(
  items: string[], 
  prefix: string, 
  candidate: any, 
  position: any, 
  isStrength: boolean
): string[] {
  const result: string[] = []
  
  // הוספת הנקודות שהתקבלו מ-AI
  for (const item of items) {
    if (result.length >= 5) break
    if (item && item.trim().length > 10) {
      // וידוא שמתחיל עם הפרפיקס הנכון
      const cleanItem = item.replace(/^[✅⚠️💡🔴🟢•\-\*\s]+/, '').trim()
      result.push(`${prefix} ${cleanItem}`)
    }
  }
  
  // השלמת נקודות חסרות
  if (isStrength) {
    const defaultStrengths = [
      candidate.tags?.length > 0 ? `${prefix} תגיות מקצועיות: ${candidate.tags.slice(0, 3).map((t: any) => t.name).join(', ')}` : null,
      candidate.yearsOfExperience ? `${prefix} ${candidate.yearsOfExperience} שנות ניסיון בתחום` : null,
      candidate.currentTitle ? `${prefix} תפקיד נוכחי: ${candidate.currentTitle}${candidate.currentCompany ? ` ב-${candidate.currentCompany}` : ''}` : null,
      candidate.city && position.location && candidate.city.toLowerCase().includes(position.location.toLowerCase().split(' ')[0]) ? `${prefix} מיקום מתאים - ${candidate.city}` : null,
      candidate.skills ? `${prefix} כישורים: ${candidate.skills.split(',').slice(0, 3).join(', ')}` : null,
      candidate.linkedinUrl ? `${prefix} פרופיל LinkedIn קיים` : null,
      candidate.resumeUrl || candidate.resume ? `${prefix} קורות חיים זמינים` : null,
      `${prefix} זמינות לריאיון והתקדמות בתהליך`,
    ].filter(Boolean) as string[]

    for (const s of defaultStrengths) {
      if (result.length >= 5) break
      if (!result.some(r => r.includes(s.substring(2, 20)))) {
        result.push(s)
      }
    }
  } else {
    const defaultWeaknesses = [
      !candidate.resume ? `${prefix} חסרים קורות חיים מפורטים - לא ניתן להעריך את מלוא הניסיון` : null,
      !candidate.yearsOfExperience ? `${prefix} לא צוינו שנות ניסיון - יש לברר בראיון` : null,
      candidate.city && position.location && !candidate.city.toLowerCase().includes(position.location.toLowerCase().split(' ')[0]) 
        ? `${prefix} מרחק גיאוגרפי - המועמד ב-${candidate.city}, המשרה ב-${position.location}` : null,
      !candidate.noticePeriod ? `${prefix} תקופת הודעה מוקדמת לא ידועה` : null,
      !candidate.expectedSalary && position.salaryRange ? `${prefix} ציפיות שכר לא צוינו - יש לוודא התאמה` : null,
      !candidate.linkedinUrl ? `${prefix} אין פרופיל LinkedIn - אין אפשרות לאמת מידע` : null,
      `${prefix} מומלץ שיחת סינון טלפונית לפני שליחה למעסיק`,
      `${prefix} יש לבדוק רפרנסים מתפקידים קודמים`,
    ].filter(Boolean) as string[]

    for (const w of defaultWeaknesses) {
      if (result.length >= 5) break
      if (!result.some(r => r.includes(w.substring(2, 20)))) {
        result.push(w)
      }
    }
  }

  return result.slice(0, 5)
}

// ניתוח גיבוי אם Gemini נכשל
function fallbackAnalysis(candidate: any, position: any): {
  matchScore: number
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  insights: string
} {
  const candidateTagIds = candidate.tags?.map((t: any) => t.id) || []
  const positionTagIds = position.tags?.map((t: any) => t.id) || []
  const matchingTagIds = candidateTagIds.filter((id: string) => positionTagIds.includes(id))
  
  let matchScore = positionTagIds.length > 0 
    ? Math.round((matchingTagIds.length / positionTagIds.length) * 100)
    : 50

  const strengths: string[] = []
  const weaknesses: string[] = []

  // חוזקות
  if (matchingTagIds.length > 0) {
    const matchedTags = candidate.tags.filter((t: any) => matchingTagIds.includes(t.id))
    strengths.push(`✅ ${matchingTagIds.length} תגיות תואמות: ${matchedTags.slice(0, 3).map((t: any) => t.name).join(', ')}`)
  }
  if (candidate.yearsOfExperience) {
    strengths.push(`✅ ${candidate.yearsOfExperience} שנות ניסיון מקצועי`)
  }
  if (candidate.currentTitle) {
    strengths.push(`✅ תפקיד נוכחי: ${candidate.currentTitle}${candidate.currentCompany ? ` ב-${candidate.currentCompany}` : ''}`)
  }
  if (candidate.resume) {
    strengths.push(`✅ קורות חיים מלאים זמינים במערכת`)
  }
  strengths.push(`✅ פרטים מלאים במערכת - ניתן ליצור קשר`)

  // חולשות
  if (!candidate.resume) {
    weaknesses.push(`⚠️ לא הועלו קורות חיים מפורטים - לא ניתן להעריך ניסיון`)
  }
  if (candidate.city && position.location) {
    const canCity = candidate.city.toLowerCase()
    const posLoc = position.location.toLowerCase()
    if (!posLoc.includes(canCity) && !canCity.includes(posLoc.split(' ')[0])) {
      weaknesses.push(`⚠️ מרחק גיאוגרפי: המועמד ב-${candidate.city}, המשרה ב-${position.location}`)
    }
  }
  if (!candidate.yearsOfExperience) {
    weaknesses.push(`⚠️ שנות ניסיון לא צוינו - יש לברר בראיון`)
  }
  if (positionTagIds.length > 0 && matchingTagIds.length < positionTagIds.length / 2) {
    const missingTags = position.tags.filter((t: any) => !candidateTagIds.includes(t.id))
    weaknesses.push(`⚠️ כישורים חסרים: ${missingTags.slice(0, 3).map((t: any) => t.name).join(', ')}`)
  }
  weaknesses.push(`⚠️ מומלץ שיחת סינון טלפונית לפני שליחה למעסיק`)

  return {
    matchScore,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    recommendation: getDefaultRecommendation(matchScore),
    insights: 'ניתוח AI לא זמין - הציון מבוסס על התאמת תגיות בלבד',
  }
}

function getDefaultRecommendation(score: number): string {
  if (score >= 70) return "מועמדות מומלצת - שלח למעסיק"
  if (score >= 50) return "מועמדות טובה - מומלץ ראיון טלפוני תחילה"
  return "מועמדות חלשה - בדוק אלטרנטיבות"
}
