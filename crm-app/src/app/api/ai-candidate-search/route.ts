import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { normalizeLocality, extractLocalityFromAddress, areLocationsNearby } from "@/lib/israel-locations"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 🔍 AI Candidate Search
 * משתמש כותב מה הוא מחפש → AI סורק את כל המועמדים ומחזיר את המתאימים ביותר
 * 
 * POST body: { query: string, city?: string, tags?: string[] }
 * 
 * שלב 1: סינון מהיר בלי AI לפי מילות מפתח ועיר
 * שלב 2: Gemini מדרג את ה-30 המובילים
 */
export async function POST(request: Request) {
  try {
    const startTime = Date.now()
    const body = await request.json()
    const { query, city, tags = [] } = body

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: "נא להזין שאילתת חיפוש" }, { status: 400 })
    }

    // שליפת כל המועמדים עם תגיות
    const candidates = await prisma.candidate.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        currentTitle: true,
        currentCompany: true,
        city: true,
        yearsOfExperience: true,
        skills: true,
        resume: true,
        rating: true,
        noticePeriod: true,
        hiredAt: true,
        createdAt: true,
        tags: { select: { id: true, name: true, color: true } },
        _count: { select: { applications: true, interviews: true } }
      }
    })

    if (candidates.length === 0) {
      return NextResponse.json({ results: [], total: 0 })
    }

    // ========================================
    // 🗺️ חיפוש עיר בתוך השאילתה
    // ========================================
    const queryLower = query.toLowerCase()
    const normalizedQueryCity = city ? normalizeLocality(city) : extractCityFromQuery(queryLower)

    // ========================================
    // ⚡ שלב 1: סינון מהיר בלי AI
    // ========================================
    const queryWords: string[] = (queryLower
      .replace(/[,\.;:!?]/g, ' ')
      .split(/\s+/) as string[])
      .filter((w: string) => w.length > 2)
      .filter((w: string) => !STOP_WORDS.has(w))

    interface QuickResult {
      candidate: typeof candidates[0]
      quickScore: number
      cityMatch: boolean
    }

    const quickResults: QuickResult[] = candidates.map(candidate => {
      const candidateText = buildCandidateSearchText(candidate).toLowerCase()
      const candidateCity = normalizeLocality(candidate.city || '')
      const candidateCityExtracted = extractLocalityFromAddress(candidate.city || '') || candidateCity

      // בדיקת עיר
      let cityMatch = false
      if (normalizedQueryCity) {
        cityMatch = !!(
          candidateCityExtracted &&
          areLocationsNearby(normalizedQueryCity, candidateCityExtracted)
        )
      }

      // בדיקת תגיות שנבחרו
      const candidateTagNames = candidate.tags.map(t => t.name.toLowerCase())
      let tagScore = 0
      for (const tag of tags) {
        if (candidateTagNames.some(ct => ct.includes(tag.toLowerCase()) || tag.toLowerCase().includes(ct))) {
          tagScore += 10
        }
      }

      // ניקוד מילות מפתח
      let keywordScore = 0
      for (const word of queryWords) {
        if (candidateText.includes(word)) {
          keywordScore += 5
        }
      }

      // ניקוד מקצוע מהתואר הנוכחי
      const titleWords = (candidate.currentTitle || '').toLowerCase().split(/\s+/)
      for (const titleWord of titleWords) {
        if (titleWord.length > 2 && queryLower.includes(titleWord)) {
          keywordScore += 8
        }
      }

      const quickScore = keywordScore + tagScore + (cityMatch ? 20 : 0)

      return { candidate, quickScore, cityMatch }
    })

    // מיון לפי ניקוד מהיר + עיר
    quickResults.sort((a, b) => {
      if (a.cityMatch && !b.cityMatch) return -1
      if (!a.cityMatch && b.cityMatch) return 1
      return b.quickScore - a.quickScore
    })

    // ========================================
    // 🧠 שלב 2: Gemini על ה-30 הטובים ביותר
    // ========================================
    const TOP_FOR_AI = 30
    const topCandidates = quickResults.slice(0, TOP_FOR_AI)

    const aiResults = await Promise.all(
      topCandidates.map(({ candidate, cityMatch }) =>
        scoreCandidate(candidate, query, normalizedQueryCity, cityMatch)
      )
    )

    // מיון סופי לפי ציון AI
    aiResults.sort((a, b) => b.score - a.score)

    // החזר רק מועמדים שעברו את הסף המינימלי
    const MIN_SCORE = 20
    const relevant = aiResults.filter(r => r.score >= MIN_SCORE)

    const totalTime = Date.now() - startTime
    console.log(`🔍 AI Candidate Search: "${query}" → ${relevant.length} תוצאות מתוך ${candidates.length} (${totalTime}ms)`)

    return NextResponse.json({
      results: relevant,
      total: candidates.length,
      found: relevant.length,
      searchTimeMs: totalTime,
      parsedCity: normalizedQueryCity || null,
    })

  } catch (error) {
    console.error("Error in AI candidate search:", error)
    return NextResponse.json({ error: "שגיאה בחיפוש" }, { status: 500 })
  }
}

// ========================================
// 🤖 ניקוד מועמד אחד עם Gemini
// ========================================
async function scoreCandidate(
  candidate: any,
  query: string,
  queryCity: string | null,
  cityMatch: boolean
): Promise<any> {
  const tagList = candidate.tags?.map((t: any) => t.name).join(', ') || 'אין'
  const resumeSnippet = (candidate.resume || '').substring(0, 1500)
  const hasResume = resumeSnippet.trim().length > 50

  const prompt = `אתה מגייס מקצועי. בדוק אם המועמד הזה מתאים לדרישת החיפוש.

🔍 מה מחפשים: "${query}"

👤 מועמד: ${candidate.name}
• תפקיד: ${candidate.currentTitle || 'לא צוין'}
• חברה: ${candidate.currentCompany || 'לא צוין'}
• עיר: ${candidate.city || 'לא צוין'}
• ניסיון: ${candidate.yearsOfExperience || 'לא צוין'} שנים
• כישורים: ${candidate.skills || 'לא צוין'}
• תגיות: ${tagList}
${hasResume ? `📄 קורות חיים:\n${resumeSnippet}` : '❌ אין קורות חיים'}

התאמת מיקום: ${cityMatch ? '✅ קרוב' : '❌ מרוחק או לא צוין'}

דרג 0-100 כמה המועמד מתאים לחיפוש. התחשב ב:
1. תפקיד/ניסיון רלוונטי לחיפוש
2. מיקום גיאוגרפי
3. כישורים/תגיות ספציפיות שנדרשו
4. שנות ניסיון

החזר JSON בלבד:
{
  "score": ציון 0-100,
  "match_reason": "סיבה קצרה למה מתאים/לא מתאים",
  "highlights": ["נקודה חזקה 1", "נקודה חזקה 2"]
}

JSON בלבד, ללא הסברים:`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON")

    const analysis = JSON.parse(jsonMatch[0])
    const finalScore = Math.min(100, Math.max(0, Number(analysis.score) || 0))

    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      currentTitle: candidate.currentTitle,
      currentCompany: candidate.currentCompany,
      city: candidate.city,
      yearsOfExperience: candidate.yearsOfExperience,
      skills: candidate.skills,
      rating: candidate.rating,
      tags: candidate.tags,
      hiredAt: candidate.hiredAt,
      _count: candidate._count,
      score: finalScore,
      matchReason: analysis.match_reason || '',
      highlights: analysis.highlights || [],
      cityMatch,
    }
  } catch {
    // fallback quick score
    const quickScore = cityMatch ? 30 : 10
    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      currentTitle: candidate.currentTitle,
      currentCompany: candidate.currentCompany,
      city: candidate.city,
      yearsOfExperience: candidate.yearsOfExperience,
      skills: candidate.skills,
      rating: candidate.rating,
      tags: candidate.tags,
      hiredAt: candidate.hiredAt,
      _count: candidate._count,
      score: quickScore,
      matchReason: cityMatch ? 'התאמה גיאוגרפית' : 'לא ניתן לנתח',
      highlights: [],
      cityMatch,
    }
  }
}

// ========================================
// 🛠️ פונקציות עזר
// ========================================

function buildCandidateSearchText(candidate: any): string {
  const parts = [
    candidate.name || '',
    candidate.currentTitle || '',
    candidate.currentCompany || '',
    candidate.city || '',
    candidate.skills || '',
    candidate.resume?.substring(0, 500) || '',
    ...(candidate.tags?.map((t: any) => t.name) || []),
  ]
  return parts.join(' ')
}

function extractCityFromQuery(query: string): string | null {
  const CITY_PATTERNS = [
    // תבניות: "מ..." / "ב..." / "באזור..." / "מאזור..."
    /\b(?:מ|מאזור|ב|באזור)\s+([\u0590-\u05FF\s]{2,15})(?:\s|$|,|\.)/,
    // עיר לבד - נורמליזציה
  ]
  for (const pattern of CITY_PATTERNS) {
    const m = query.match(pattern)
    if (m) {
      const city = m[1].trim()
      const normalized = normalizeLocality(city)
      if (normalized) return normalized
    }
  }
  return null
}

// מילות עצירה - לא לחפש לפיהן
const STOP_WORDS = new Set([
  'של', 'עם', 'לי', 'הוא', 'היא', 'הם', 'מה', 'כן', 'לא',
  'את', 'אני', 'אתה', 'אנחנו', 'יש', 'אין', 'כמה', 'רוצה',
  'מחפש', 'מחפשת', 'צריך', 'צריכה', 'שיהיה', 'שיש',
  'the', 'and', 'or', 'for', 'with', 'in', 'at', 'of',
])
