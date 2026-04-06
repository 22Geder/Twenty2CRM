import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { normalizeLocality, extractLocalityFromAddress, areLocationsNearby, NEARBY_GROUPS } from "@/lib/israel-locations"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 🔍 AI Candidate Search
 * אלגוריתם: 50% מיקום | 25% תגיות | 25% AI Gemini
 *
 * POST body: { query: string, city?: string, tags?: string[] }
 *
 * שלב 1: ניקוד מהיר לכולם: locationScore(50) + tagsScore(25)
 * שלב 2: Gemini על ה-30 הטובים → ציון 0-100 → מוכפל ב-0.25 → aiScore(25)
 * שלב 3: finalScore = locationScore + tagsScore + aiScore
 */
export async function POST(request: Request) {
  try {
    const startTime = Date.now()
    const body = await request.json()
    const { query, city, tags: selectedTags = [] } = body

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
    // 🗺️ עיר: קודם שדה עיר, אחר כך חילוץ מהשאילתה
    // ========================================
    const queryLower = query.toLowerCase()
    const normalizedQueryCity = city
      ? (extractLocalityFromAddress(city) || normalizeLocality(city))
      : extractCityFromQuery(queryLower)

    // מילות מפתח מהשאילתה (לחישוב תגיות)
    const queryKeywords: string[] = (queryLower
      .replace(/[,\.;:!?]/g, ' ')
      .split(/\s+/) as string[])
      .filter((w: string) => w.length > 2)
      .filter((w: string) => !STOP_WORDS.has(w))

    // ========================================
    // ⚡ שלב 1: ניקוד מהיר — 50% מיקום + 25% תגיות
    // ========================================
    interface QuickResult {
      candidate: typeof candidates[0]
      locationScore: number
      tagsScore: number
      cityMatch: boolean
      cityProximity: 'exact' | 'nearby' | 'none'
      quickTotal: number
    }

    const quickResults: QuickResult[] = candidates.map(candidate => {
      const candidateCityNorm =
        extractLocalityFromAddress(candidate.city || '') ||
        normalizeLocality(candidate.city || '')

      // 📍 מיקום — 50 נקודות מקסימום
      let locationScore = 0
      let cityMatch = false
      let cityProximity: 'exact' | 'nearby' | 'none' = 'none'

      if (normalizedQueryCity && candidateCityNorm) {
        // דיוק: אותה עיר ממש
        if (isSameCity(normalizedQueryCity, candidateCityNorm)) {
          locationScore = 50
          cityMatch = true
          cityProximity = 'exact'
        // קרוב: עד 20 ק"מ (אותה קבוצה)
        } else if (areLocationsNearby(normalizedQueryCity, candidateCityNorm)) {
          locationScore = 35
          cityMatch = true
          cityProximity = 'nearby'
        }
        // רחוק → locationScore = 0, cityMatch = false
      } else if (!normalizedQueryCity) {
        locationScore = 25 // לא צוינה עיר → ניטרלי
      }

      // 🏷️ תגיות — 25 נקודות מקסימום
      const candidateTagNames = candidate.tags.map(t => t.name.toLowerCase())
      let tagMatches = 0

      // תגיות שנבחרו ידנית
      for (const tag of selectedTags as string[]) {
        if (candidateTagNames.some(ct =>
          ct.includes(tag.toLowerCase()) || tag.toLowerCase().includes(ct)
        )) {
          tagMatches++
        }
      }

      // מילות השאילתה שמופיעות בתגיות המועמד
      for (const keyword of queryKeywords) {
        if (candidateTagNames.some(ct =>
          ct.includes(keyword) || keyword.includes(ct)
        )) {
          tagMatches++
        }
      }

      // 5 נקודות לכל תגית, מקס 25 (5 תגיות)
      const tagsScore = Math.min(25, tagMatches * 5)
      const quickTotal = locationScore + tagsScore

      return { candidate, locationScore, tagsScore, cityMatch, cityProximity, quickTotal }
    })

    // מיון: exact קודם, אחר כך nearby, אחר כך ניקוד
    quickResults.sort((a, b) => {
      const proximityOrder = { exact: 0, nearby: 1, none: 2 }
      const pa = proximityOrder[a.cityProximity]
      const pb = proximityOrder[b.cityProximity]
      if (pa !== pb) return pa - pb
      return b.quickTotal - a.quickTotal
    })

    // ========================================
    // 🧠 שלב 2: Gemini על ה-30 הטובים ביותר
    // ========================================
    const TOP_FOR_AI = 30
    const topCandidates = quickResults.slice(0, TOP_FOR_AI)

    const aiResults = await Promise.all(
      topCandidates.map(({ candidate, locationScore, tagsScore, cityMatch, cityProximity }) =>
        scoreCandidateWithAlgo(candidate, query, cityMatch, cityProximity, locationScore, tagsScore)
      )
    )

    // מיון סופי: exact → nearby → none, בתוך כל קבוצה לפי ציון
    aiResults.sort((a, b) => {
      const proximityOrder = { exact: 0, nearby: 1, none: 2 }
      const pa = proximityOrder[(a.cityProximity as 'exact'|'nearby'|'none')] ?? 2
      const pb = proximityOrder[(b.cityProximity as 'exact'|'nearby'|'none')] ?? 2
      if (pa !== pb) return pa - pb
      return b.score - a.score
    })

    // סף: אם יש עיר — הצג רק עד 20 ק"מ + קצת ניקוד, אחרת הצג הכל
    const MIN_SCORE = 5
    const relevant = normalizedQueryCity
      ? aiResults.filter(r => r.cityProximity !== 'none' || r.score >= 15)
      : aiResults.filter(r => r.score >= MIN_SCORE)

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
// 🤖 ניקוד מועמד עם האלגוריתם המלא
// 50% מיקום | 25% תגיות | 25% AI Gemini
// ========================================
async function scoreCandidateWithAlgo(
  candidate: any,
  query: string,
  cityMatch: boolean,
  cityProximity: 'exact' | 'nearby' | 'none',
  locationScore: number,
  tagsScore: number
): Promise<any> {
  const tagList = candidate.tags?.map((t: any) => t.name).join(', ') || 'אין'
  const resumeSnippet = (candidate.resume || '').substring(0, 1500)
  const hasResume = resumeSnippet.trim().length > 50

  // Gemini — מנתח רק ניסיון + כישורים + רלוונטיות (לא מיקום — הוא כבר בחישוב)
  const prompt = `אתה מגייס מקצועי. הערך כמה המועמד מתאים לניסיון ולכישורים הנדרשים.

🔍 מה מחפשים: "${query}"

👤 מועמד: ${candidate.name}
• תפקיד: ${candidate.currentTitle || 'לא צוין'}
• חברה: ${candidate.currentCompany || 'לא צוין'}
• עיר: ${candidate.city || 'לא צוין'}
• ניסיון: ${candidate.yearsOfExperience ?? 'לא צוין'} שנים
• כישורים: ${candidate.skills || 'לא צוין'}
• תגיות: ${tagList}
${hasResume ? `📄 קורות חיים:\n${resumeSnippet}` : '❌ אין קורות חיים'}

⚠️ אל תתחשב במיקום — הוא מחושב בנפרד.
דרג רק לפי: ניסיון, כישורים ורלוונטיות לתפקיד.

החזר JSON בלבד:
{"score": ציון 0-100, "match_reason": "משפט קצר", "highlights": ["חוזק 1", "חוזק 2"]}

JSON בלבד:`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON")

    const analysis = JSON.parse(jsonMatch[0])
    const geminiScore = Math.min(100, Math.max(0, Number(analysis.score) || 0))

    // 🔥 אלגוריתם: 50% מיקום | 25% תגיות | 25% AI
    const aiScore = Math.round(geminiScore * 0.25) // 0-100 → 0-25
    const finalScore = Math.min(100, locationScore + tagsScore + aiScore)

    return buildResult(
      candidate, finalScore, cityMatch, cityProximity,
      analysis.match_reason || '', analysis.highlights || [],
      locationScore, tagsScore, aiScore
    )
  } catch {
    // Fallback: מיקום + תגיות + ניקוד בסיסי
    const aiScore = 8
    const finalScore = Math.min(100, locationScore + tagsScore + aiScore)
    return buildResult(
      candidate, finalScore, cityMatch, cityProximity,
      cityMatch ? 'התאמה גיאוגרפית' : 'ניתוח חלקי', [],
      locationScore, tagsScore, aiScore
    )
  }
}

function buildResult(
  candidate: any,
  score: number,
  cityMatch: boolean,
  cityProximity: 'exact' | 'nearby' | 'none',
  matchReason: string,
  highlights: string[],
  locationScore: number,
  tagsScore: number,
  aiScore: number
) {
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
    score,
    cityMatch,
    cityProximity,
    matchReason,
    highlights,
    scoreBreakdown: { location: locationScore, tags: tagsScore, ai: aiScore },
  }
}

// ========================================
// 🛠️ פונקציות עזר
// ========================================

function isSameCity(city1: string, city2: string): boolean {
  if (!city1 || !city2) return false
  const n1 = normalizeLocality(city1)
  const n2 = normalizeLocality(city2)
  return n1 === n2 || n1.includes(n2) || n2.includes(n1)
}

function extractCityFromQuery(query: string): string | null {
  // תבניות: "מלוד", "מאזור לוד", "בלוד", "באזור ת\"א"
  const CITY_PATTERNS = [
    /(?:מאזור|באזור)\s+([\u0590-\u05FF"']{2,15})/,
    /\b(?:מ|ב)([\u0590-\u05FF"']{2,15})(?:\s|$|,|\.)/,
  ]
  for (const pattern of CITY_PATTERNS) {
    const m = query.match(pattern)
    if (m) {
      const city = m[1].trim()
      const extracted = extractLocalityFromAddress(city) || normalizeLocality(city)
      if (extracted) return extracted
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
