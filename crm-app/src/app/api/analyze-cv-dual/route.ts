import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * 🤖 Dual-Layer CV Analysis API - גרסה משופרת
 * מנתח קורות חיים לפי תחום, תגיות, וניסיון
 * מבצע התאמה מדויקת בלבד!
 */

// הגדרת תחומים וקטגוריות
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'לוגיסטיקה': ['מחסן', 'לוגיסטיקה', 'ליקוט', 'הפצה', 'שינוע', 'אחסנה', 'מלגזן', 'מכולות', 'נהג', 'סחר', 'יבוא', 'יצוא', 'רכש', 'supply chain', 'warehouse'],
  'אוטומוטיב': [
    // בסיסי רכב
    'רכב', 'מכונאי', 'מכונית', 'מוסך', 'צמיגים', 'רכבים', 'אוטו', 'מכירות רכב', 'ליסינג', 'השכרת רכב',
    // מאבחנים וטכנאים - קריטי!
    'מאבחן', 'דיאגנוסטיקה', 'אבחון', 'אבחון תקלות', 'מאבחן רכב', 'מאבחן תקלות',
    'חשמלאי רכב', 'טכנאי רכב', 'חשמל רכב', 'אוטוטרוניקה', 'הנדסאי רכב',
    'PDI', 'בוחן רכב', 'בקר רכב', 'תקלות', 'טיפולי רכב',
    // מותגים
    'טויוטה', 'לקסוס', 'יונדאי', 'GEELY', 'GAC', 'ZEEKR', 'ג\'ילי',
    // חברות
    'UNION', 'יוניון', 'UMI', 'AVIS', 'אביס'
  ],
  'מכירות': ['מכירות', 'מכירה', 'נציג מכירות', 'איש מכירות', 'סוכן מכירות', 'קמעונאות', 'שיווק', 'sales', 'B2B', 'B2C', 'שטח'],
  'שירות לקוחות': [
    // בסיסי
    'שירות', 'מוקד', 'תמיכה', 'call center', 'לקוחות', 'שימור', 'helpdesk', 'סאפורט', 'support', 'CSR', 'שירותיות',
    'נציג שירות', 'נציגת שירות', 'מוקדן', 'מוקדנית', 'טלמרקטינג', 'שיחות יוצאות', 'שיחות נכנסות',
    // ניסיון קודם רלוונטי - קופאיות ומכירות
    'קופאי', 'קופאית', 'קופה', 'קמעונאות', 'חנות', 'סופר', 'ייצור', 'יצור', 'אריזה', 'אורזת', 'עבודה מול לקוחות',
    // שפות - קריטי לשירות לקוחות!
    'עברית', 'ערבית', 'אנגלית', 'רוסית', 'אמהרית', 'צרפתית', 'ספרדית', 
    'דובר ערבית', 'דוברת ערבית', 'שפת אם', 'רמה גבוהה',
    // מחשבים
    'Office', 'אופיס', 'מחשב', 'אקסל', 'וורד', 'CRM',
    // כישורים רכים
    'תקשורת', 'סבלנות', 'יחסי אנוש', 'תודעת שירות', 'שירותיות', 'כושר ביטוי', 'אחראית', 'יוזמה',
    // מיקומים - נגב ודרום
    'באר שבע', 'אשדוד', 'נשר', 'רהט', 'לקייה', 'נגב', 'דרום'
  ],
  'בנקאות': ['בנק', 'בנקאות', 'פיננסי', 'אשראי', 'חשבון', 'טלר', 'יעוץ פיננסי', 'השקעות', 'ביטוח', 'פנסיה'],
  'הייטק': ['תכנות', 'פיתוח', 'software', 'developer', 'מתכנת', 'QA', 'בדיקות', 'DevOps', 'cloud', 'python', 'java', 'react', 'node', 'IT', 'טכני'],
  'מזון': ['מזון', 'מסעדה', 'מטבח', 'שף', 'טבח', 'אפייה', 'קונדיטוריה', 'מלצר', 'ברמן', 'קפה', 'מזנון'],
  'ייצור': ['ייצור', 'מפעל', 'תעשייה', 'production', 'עובד ייצור', 'אריזה', 'מכונות', 'הרכבה', 'פס ייצור', 'בקרת איכות'],
  'ניהול': ['מנהל', 'ניהול', 'management', 'team leader', 'supervisor', 'ראש צוות', 'ניהול פרויקטים', 'PM', 'מנכ"ל'],
  'משרדי': ['אדמיניסטרציה', 'מזכירות', 'office', 'קבלה', 'משרד', 'רכז', 'רכזת', 'תפעול', 'קלדנות', 'excel']
}

interface DualLayerResult {
  candidateCard: {
    fullName: string
    city: string
    age: string
    phone: string
    email: string
    hotTags: string[]
    currentTitle: string
    yearsExperience: number
    detectedIndustry: string[]
  }
  bestMatch: {
    positionId: string
    positionTitle: string
    employerName: string
    location: string
    weightedScore: number
    matchReason: string
    dualAnalysis: {
      technicalMatch: {
        score: number
        matched: string[]
        missing: string[]
        explanation: string
      }
      aiLogicMatch: {
        score: number
        explanation: string
        relevanceAssessment: string
      }
    }
    prosCons: {
      pros: string[]
      cons: string[]
    }
    recommendation: {
      shouldProceed: boolean
      summaryForEmployer: string
    }
  } | null
  topMatches: Array<{
    positionId: string
    positionTitle: string
    employerName: string
    location: string
    score: number
    matchReason: string
  }>
  analysisTimestamp: string
}

function ensureFiveItems(items: string[], prefix: string): string[] {
  const result = Array.isArray(items) ? items.slice(0, 5) : []
  while (result.length < 5) {
    result.push(`${prefix} ${result.length + 1} - לא זוהה`)
  }
  return result
}

/**
 * מזהה את התחומים הראשיים של המועמד מתוך ה-CV
 */
function detectIndustries(text: string): string[] {
  const lowText = text.toLowerCase()
  const detected: { industry: string; count: number }[] = []
  
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    let count = 0
    for (const keyword of keywords) {
      const regex = new RegExp(keyword.toLowerCase(), 'gi')
      const matches = lowText.match(regex)
      if (matches) count += matches.length
    }
    if (count > 0) {
      detected.push({ industry, count })
    }
  }
  
  // מיון לפי כמות התאמות ולקיחת עד 3 תחומים מובילים
  return detected
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(d => d.industry)
}

// 🗺️ מיפוי ערים קרובות - לחישוב מיקום 50%
const NEARBY_CITIES: Record<string, string[]> = {
  'תל אביב': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'יפו', 'רמת השרון', 'הרצליה', 'פתח תקווה'],
  'חיפה': ['קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נשר', 'טירת כרמל', 'עכו', 'נהריה', 'כרמיאל', 'יקנעם', 'שפרעם', 'טמרה', 'נוף הגליל', 'נצרת'],
  'ירושלים': ['בית שמש', 'מעלה אדומים', 'מבשרת ציון', 'מודיעין', 'גוש עציון'],
  'באר שבע': ['אופקים', 'נתיבות', 'שדרות', 'דימונה', 'ערד', 'רהט'],
  'אשדוד': ['אשקלון', 'קריית גת', 'גדרה', 'יבנה', 'קריית מלאכי', 'שדרות', 'נס ציונה', 'רחובות'],
  'אשקלון': ['אשדוד', 'קריית גת', 'שדרות', 'נתיבות'],
  'נתניה': ['חדרה', 'כפר יונה', 'פרדס חנה', 'הרצליה', 'כפר סבא', 'רעננה'],
  'ראשון לציון': ['נס ציונה', 'רחובות', 'יבנה', 'חולון', 'בת ים', 'אשדוד', 'גדרה'],
  'פתח תקווה': ['כפר סבא', 'רעננה', 'הוד השרון', 'ראש העין', 'רמת גן', 'בני ברק'],
  'רחובות': ['נס ציונה', 'ראשון לציון', 'יבנה', 'גדרה', 'אשדוד'],
  'כפר סבא': ['רעננה', 'הוד השרון', 'פתח תקווה', 'ראש העין', 'נתניה', 'הרצליה'],
  'הרצליה': ['רעננה', 'כפר סבא', 'רמת השרון', 'תל אביב', 'נתניה'],
}

// 🗺️ אזורים כלליים
const REGIONS: Record<string, string[]> = {
  'מרכז': ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'פתח תקווה', 'ראשון לציון', 'הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'ראש העין', 'לוד', 'רמלה', 'רחובות', 'נס ציונה', 'יבנה', 'מודיעין'],
  'צפון': ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נשר', 'טירת כרמל', 'עכו', 'נהריה', 'כרמיאל', 'נצרת', 'עפולה', 'יקנעם', 'מגדל העמק', 'טבריה', 'צפת', 'שפרעם', 'טמרה', 'נוף הגליל'],
  'דרום': ['באר שבע', 'אשדוד', 'אשקלון', 'קריית גת', 'דימונה', 'ערד', 'אופקים', 'נתיבות', 'שדרות', 'גדרה', 'קריית מלאכי', 'אילת'],
  'ירושלים': ['ירושלים', 'בית שמש', 'מעלה אדומים', 'מבשרת ציון', 'גוש עציון'],
  'שרון': ['נתניה', 'חדרה', 'כפר יונה', 'פרדס חנה', 'רמת השרון'],
}

/**
 * 🗺️ חילוץ עיר מטקסט קורות חיים
 */
function extractCityFromCV(cvText: string): string {
  const lowText = cvText.toLowerCase()
  
  // רשימת כל הערים בישראל
  const allCities = [
    'תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 'באר שבע', 'בני ברק',
    'חולון', 'רמת גן', 'אשקלון', 'רחובות', 'בת ים', 'הרצליה', 'כפר סבא', 'מודיעין', 'נצרת',
    'רעננה', 'לוד', 'רמלה', 'הוד השרון', 'ראש העין', 'קריית גת', 'גבעתיים', 'אור יהודה',
    'נס ציונה', 'יבנה', 'גדרה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים',
    'עכו', 'נהריה', 'כרמיאל', 'צפת', 'טבריה', 'עפולה', 'מגדל העמק', 'יקנעם', 'נשר', 'טירת כרמל',
    'דימונה', 'ערד', 'אופקים', 'נתיבות', 'שדרות', 'אילת', 'קריית מלאכי', 'בית שמש',
    'מעלה אדומים', 'מבשרת ציון', 'שפרעם', 'טמרה', 'נוף הגליל', 'כפר יונה', 'פרדס חנה',
    // יישובים ערביים
    'אום אל פחם', 'סחנין', 'עראבה', 'דיר חנא', 'מגאר', 'כאבול', 'טייבה', 'טירה', 'קלנסווה',
    'כפר קאסם', 'באקה אל גרבייה', 'ערערה', 'כפר קרע', 'דאלית אל כרמל', 'עוספיא', 'ריינה', 'כפר כנא',
    // בדואים
    'רהט', 'כסייפה', 'לקייה', 'תל שבע', 'שגב שלום',
  ]
  
  // מיון לפי אורך (ערים ארוכות קודם)
  const sortedCities = allCities.sort((a, b) => b.length - a.length)
  
  for (const city of sortedCities) {
    if (lowText.includes(city.toLowerCase())) {
      return city
    }
  }
  return ''
}

/**
 * 🗺️ בדיקת קרבת מיקום בין מועמד למשרה
 * מחזיר ציון 0-50 (50% מהציון הכולל!)
 */
function calculateLocationScore(candidateCity: string, positionLocation: string): { score: number; type: string } {
  if (!candidateCity || !positionLocation) {
    return { score: 15, type: 'unknown' } // ציון בסיסי אם אין מידע
  }
  
  const candLower = candidateCity.toLowerCase()
  const posLower = positionLocation.toLowerCase()
  
  // 1. התאמה מדויקת - 50 נקודות!
  if (posLower.includes(candLower) || candLower.includes(posLower)) {
    return { score: 50, type: 'exact' }
  }
  
  // 2. ערים קרובות - 40 נקודות
  for (const [mainCity, nearby] of Object.entries(NEARBY_CITIES)) {
    const isCandiateInGroup = candLower.includes(mainCity.toLowerCase()) || nearby.some(n => candLower.includes(n.toLowerCase()))
    const isPositionInGroup = posLower.includes(mainCity.toLowerCase()) || nearby.some(n => posLower.includes(n.toLowerCase()))
    
    if (isCandiateInGroup && isPositionInGroup) {
      return { score: 40, type: 'nearby' }
    }
  }
  
  // 3. אותו אזור - 30 נקודות
  for (const [region, cities] of Object.entries(REGIONS)) {
    const isCandidateInRegion = cities.some(c => candLower.includes(c.toLowerCase()))
    const isPositionInRegion = cities.some(c => posLower.includes(c.toLowerCase()))
    
    if (isCandidateInRegion && isPositionInRegion) {
      return { score: 30, type: 'region' }
    }
  }
  
  // 4. לא באותו אזור - 0 נקודות
  return { score: 0, type: 'far' }
}

/**
 * 🎯 מחשב ציון התאמה: 50% מיקום + 25% תגיות + 25% AI (יחושב מאוחר יותר)
 */
function calculateMatchScore(
  cvText: string,
  cvIndustries: string[],
  candidateCity: string,
  position: { title: string; description: string | null; requirements: string | null; location: string | null; tags: { name: string }[] }
): { score: number; matchedTags: string[]; reason: string; locationScore: number; tagScore: number } {
  const lowCv = cvText.toLowerCase()
  const positionText = `${position.title} ${position.description || ''} ${position.requirements || ''}`.toLowerCase()
  
  // ============================================
  // 📍 מיקום - 50 נקודות מקסימום (50%)
  // ============================================
  const locationResult = calculateLocationScore(candidateCity, position.location || '')
  const locationScore = locationResult.score
  
  // ============================================
  // 🏷️ תגיות - 25 נקודות מקסימום (25%)
  // ============================================
  const matchedTags: string[] = []
  const positionTags = position.tags.map(t => t.name.toLowerCase())
  
  for (const tag of positionTags) {
    if (lowCv.includes(tag)) {
      matchedTags.push(tag)
    }
  }
  
  // 5 תגיות תואמות = 25 נקודות (5 נק' לכל תגית)
  const tagScore = Math.min(matchedTags.length * 5, 25)
  
  // ============================================
  // 🧠 תחום (בונוס) - לא נספר בציון, אבל לסינון
  // ============================================
  let industryMatch = false
  for (const industry of cvIndustries) {
    const industryKeywords = INDUSTRY_KEYWORDS[industry] || []
    if (industryKeywords.some(kw => positionText.includes(kw.toLowerCase()))) {
      industryMatch = true
      break
    }
  }
  
  // ציון ראשוני = מיקום + תגיות (AI יוסיף עוד 25 נקודות)
  const preliminaryScore = locationScore + tagScore
  
  // בונוס קטן על התאמת תחום
  const industryBonus = industryMatch ? 5 : 0
  
  const totalScore = Math.min(preliminaryScore + industryBonus, 80) // מקסימום 80, השאר יגיע מ-AI
  
  const locationTypeHebrew: Record<string, string> = {
    'exact': 'מדויק',
    'nearby': 'קרוב',
    'region': 'אזורי',
    'far': 'מרוחק',
    'unknown': 'לא ידוע'
  }
  
  return {
    score: totalScore,
    matchedTags,
    reason: `מיקום: ${locationTypeHebrew[locationResult.type]} (${locationScore}/50), תגיות: ${matchedTags.length} (${tagScore}/25)`,
    locationScore,
    tagScore
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cvText } = body

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "יש להזין קורות חיים (לפחות 50 תווים)" },
        { status: 400 }
      )
    }

    // 🆕 זיהוי ג'יבריש מהעתקה של PDF עם פונטים מוטבעים
    let readable = 0, total = 0
    for (const ch of cvText as string) {
      const code = ch.codePointAt(0) || 0
      if (code <= 32) continue
      total++
      if ((code >= 0x0590 && code <= 0x05FF) || // Hebrew
          (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A) || // English
          (code >= 0x30 && code <= 0x39) || // digits
          (code >= 0x00C0 && code <= 0x024F) || // Latin extended
          '.,;:!?"\'()[]{}@#$%&*+-=/\\|_~`<>'.includes(ch)) {
        readable++
      }
    }
    const readableRatio = total > 0 ? readable / total : 1
    if (readableRatio < 0.4) {
      return NextResponse.json(
        { error: "הטקסט מכיל תווים לא קריאים (ג'יבריש). סביר להניח שהעתקת מ-PDF עם פונט מוטבע. העלה את הקובץ ישירות במקום להעתיק." },
        { status: 400 }
      )
    }

    // 🔍 שלב 1: זיהוי התחומים של המועמד
    const candidateIndustries = detectIndustries(cvText)
    console.log('Detected industries:', candidateIndustries)
    
    // 🗺️ שלב 1.5: חילוץ עיר המועמד מה-CV
    const candidateCity = extractCityFromCV(cvText)
    console.log('Detected city:', candidateCity)

    // 📊 שלב 2: שליפת כל המשרות הפתוחות
    const dbPositions = await prisma.position.findMany({
      where: { active: true },
      include: {
        employer: true,
        tags: true
      }
    })

    console.log(`Found ${dbPositions.length} active positions`)

    // 📈 שלב 3: חישוב ציון התאמה לכל משרה (50% מיקום + 25% תגיות + 25% AI)
    const scoredPositions = dbPositions.map(p => {
      const { score, matchedTags, reason, locationScore, tagScore } = calculateMatchScore(
        cvText, 
        candidateIndustries,
        candidateCity,
        {
          title: p.title,
          description: p.description,
          requirements: p.requirements,
          location: p.location,
          tags: p.tags
        }
      )
      return {
        ...p,
        matchScore: score,
        matchedTags,
        matchReason: reason,
        locationScore,
        tagScore
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)

    // 🏆 שלב 4: לקיחת רק המשרות הרלוונטיות (ציון מינימלי 20)
    const relevantPositions = scoredPositions.filter(p => p.matchScore >= 20).slice(0, 10)
    
    console.log(`Relevant positions (score >= 20): ${relevantPositions.length}`)
    relevantPositions.forEach(p => console.log(`  - ${p.title}: ${p.matchScore} (${p.matchReason})`))

    // אם אין משרות רלוונטיות - נחזיר תוצאה ריקה
    if (relevantPositions.length === 0) {
      return NextResponse.json({
        candidateCard: {
          fullName: 'לא זוהה',
          city: 'לא צוין',
          age: 'לא צוין',
          phone: 'לא צוין',
          email: 'לא צוין',
          hotTags: [],
          currentTitle: 'לא צוין',
          yearsExperience: 0,
          detectedIndustry: candidateIndustries
        },
        bestMatch: null,
        topMatches: [],
        analysisTimestamp: new Date().toISOString(),
        message: `לא נמצאו משרות מתאימות. תחומים שזוהו: ${candidateIndustries.join(', ') || 'לא זוהה תחום ספציפי'}`
      })
    }

    // 🤖 שלב 5: שליחה ל-AI רק עם המשרות הרלוונטיות
    const positionsContext = relevantPositions.map((p, i) => 
      `[${i + 1}] ID: ${p.id}
📌 משרה: ${p.title}
🏢 מעסיק: ${p.employer?.name || 'חברה'}
📍 מיקום: ${p.location || 'לא צוין'}
📝 תיאור: ${p.description || 'לא צוין'}
✅ דרישות: ${p.requirements || 'לא צוין'}
🏷️ תגיות המשרה: ${p.tags?.map(t => t.name).join(', ') || 'לא צוינו'}
💰 משכורת: ${p.salaryRange || 'לא צוין'}
⚡ ציון התאמה ראשוני: ${p.matchScore}/100
🔗 תגיות תואמות: ${p.matchedTags.join(', ') || 'אין'}`
    ).join('\n\n---\n\n')

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `אתה מנהל הגיוס הבכיר ביותר של חברת "2טו-גדר" (Twenty2Geder).
אתה מומחה בהתאמת מועמדים למשרות, מנתח דאטה מהשורה הראשונה.

⚠️ חשוב מאוד: כבר סיננתי עבורך את המשרות הרלוונטיות בלבד!
המשרות שלפניך עברו סינון ראשוני לפי תחום וכישורים.
התחומים שזוהו אצל המועמד: ${candidateIndustries.join(', ') || 'כללי'}

🎯 המשימה שלך:
1. חלץ פרטים אישיים מקורות החיים
2. בחר את המשרה הטובה ביותר מהרשימה שלפניך (כבר מסוננת!)
3. נתח לעומק את ההתאמה

📄 קורות חיים של המועמד:
${cvText}

📋 המשרות הרלוונטיות ביותר (כבר מסוננות לפי תחום!):
${positionsContext}

---

📋 פורמט פלט מחייב (JSON בלבד):

{
  "candidateCard": {
    "fullName": "השם המלא מה-CV",
    "city": "העיר מה-CV",
    "age": "הגיל אם מופיע, אחרת 'לא צוין'",
    "phone": "מספר הטלפון מה-CV",
    "email": "האימייל מה-CV",
    "hotTags": ["מילות מפתח מה-CV שרלוונטיות לתחום העבודה - לפחות 5!"],
    "currentTitle": "התפקיד הנוכחי/האחרון מה-CV",
    "yearsExperience": מספר_שנות_ניסיון_בתחום
  },
  "bestMatch": {
    "positionId": "ID של המשרה - חייב להיות מהרשימה למעלה!",
    "positionTitle": "שם המשרה בדיוק כפי שמופיע",
    "employerName": "שם המעסיק בדיוק כפי שמופיע",
    "location": "מיקום",
    "weightedScore": ציון_60_עד_100,
    "matchReason": "הסבר קצר למה זו ההתאמה הטובה ביותר",
    "dualAnalysis": {
      "technicalMatch": {
        "score": ציון_60_עד_100,
        "matched": ["כישור תואם 1 מה-CV שמופיע בדרישות", "כישור 2", "כישור 3"],
        "missing": ["דרישה מהמשרה שחסרה ב-CV", "דרישה נוספת"],
        "explanation": "הסבר: מה התגיות והכישורים המשותפים?"
      },
      "aiLogicMatch": {
        "score": ציון_60_עד_100,
        "explanation": "ניתוח: האם הניסיון מתאים לאופי העבודה?",
        "relevanceAssessment": "הערכה: מה יכול להיות אתגר?"
      }
    },
    "prosCons": {
      "pros": ["יתרון ספציפי 1", "יתרון 2", "יתרון 3", "יתרון 4", "יתרון 5"],
      "cons": ["חיסרון/אתגר 1", "אתגר 2", "אתגר 3", "אתגר 4", "אתגר 5"]
    },
    "recommendation": {
      "shouldProceed": true,
      "summaryForEmployer": "פסקה שמסכמת למה כדאי לראיין את המועמד הזה"
    }
  },
  "topMatches": [
    {"positionId": "ID", "positionTitle": "שם", "employerName": "מעסיק", "location": "מיקום", "score": 85, "matchReason": "סיבה"},
    {"positionId": "ID", "positionTitle": "שם", "employerName": "מעסיק", "location": "מיקום", "score": 75, "matchReason": "סיבה"},
    {"positionId": "ID", "positionTitle": "שם", "employerName": "מעסיק", "location": "מיקום", "score": 70, "matchReason": "סיבה"}
  ]
}

⚠️ הוראות קריטיות:
1. ה-positionId חייב להיות מהרשימה למעלה - אחרת הציון לא תקין!
2. ציון משוקלל = 60% טכני + 40% לוגי (מינימום 60 אם יש התאמת תחום)
3. חובה 5 יתרונות ו-5 חסרונות ספציפיים
4. הכל בעברית!
5. JSON בלבד

החזר JSON בלבד:`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // חילוץ ה-JSON מהתשובה
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Gemini response:", text)
      return NextResponse.json(
        { error: "תגובת AI לא תקינה - נסה שוב" },
        { status: 500 }
      )
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error("JSON parse error:", e, "Response:", jsonMatch[0])
      return NextResponse.json(
        { error: "שגיאה בפרסור תגובת AI" },
        { status: 500 }
      )
    }

    // ✅ שלב 6: אימות שהמשרה שנבחרה באמת קיימת ברשימה
    const validPositionIds = relevantPositions.map(p => p.id)
    if (parsed.bestMatch && !validPositionIds.includes(parsed.bestMatch.positionId)) {
      // אם AI בחר משרה לא קיימת - לקחת את הראשונה ברשימה
      console.log('AI returned invalid position ID, using first relevant position')
      const first = relevantPositions[0]
      parsed.bestMatch.positionId = first.id
      parsed.bestMatch.positionTitle = first.title
      parsed.bestMatch.employerName = first.employer?.name || 'חברה'
      parsed.bestMatch.location = first.location
    }

    // עיבוד התוצאות
    const finalResult: DualLayerResult = {
      candidateCard: {
        fullName: parsed.candidateCard?.fullName || 'לא זוהה',
        city: parsed.candidateCard?.city || 'לא צוין',
        age: parsed.candidateCard?.age || 'לא צוין',
        phone: parsed.candidateCard?.phone || 'לא צוין',
        email: parsed.candidateCard?.email || 'לא צוין',
        hotTags: Array.isArray(parsed.candidateCard?.hotTags) ? parsed.candidateCard.hotTags : [],
        currentTitle: parsed.candidateCard?.currentTitle || 'לא צוין',
        yearsExperience: typeof parsed.candidateCard?.yearsExperience === 'number' ? parsed.candidateCard.yearsExperience : 0,
        detectedIndustry: candidateIndustries
      },
      bestMatch: parsed.bestMatch ? {
        positionId: parsed.bestMatch.positionId || '',
        positionTitle: parsed.bestMatch.positionTitle || '',
        employerName: parsed.bestMatch.employerName || '',
        location: parsed.bestMatch.location || '',
        weightedScore: Math.max(0, Math.min(100, parsed.bestMatch.weightedScore || 0)),
        matchReason: parsed.bestMatch.matchReason || '',
        dualAnalysis: {
          technicalMatch: {
            score: parsed.bestMatch.dualAnalysis?.technicalMatch?.score || 0,
            matched: parsed.bestMatch.dualAnalysis?.technicalMatch?.matched || [],
            missing: parsed.bestMatch.dualAnalysis?.technicalMatch?.missing || [],
            explanation: parsed.bestMatch.dualAnalysis?.technicalMatch?.explanation || ''
          },
          aiLogicMatch: {
            score: parsed.bestMatch.dualAnalysis?.aiLogicMatch?.score || 0,
            explanation: parsed.bestMatch.dualAnalysis?.aiLogicMatch?.explanation || '',
            relevanceAssessment: parsed.bestMatch.dualAnalysis?.aiLogicMatch?.relevanceAssessment || ''
          }
        },
        prosCons: {
          pros: ensureFiveItems(parsed.bestMatch.prosCons?.pros || [], 'יתרון'),
          cons: ensureFiveItems(parsed.bestMatch.prosCons?.cons || [], 'אתגר')
        },
        recommendation: {
          shouldProceed: parsed.bestMatch.recommendation?.shouldProceed ?? false,
          summaryForEmployer: parsed.bestMatch.recommendation?.summaryForEmployer || ''
        }
      } : null,
      topMatches: Array.isArray(parsed.topMatches) 
        ? parsed.topMatches
            .filter((m: any) => validPositionIds.includes(m.positionId)) // רק משרות תקינות
            .map((m: any) => ({
              positionId: m.positionId || '',
              positionTitle: m.positionTitle || '',
              employerName: m.employerName || '',
              location: m.location || '',
              score: m.score || 0,
              matchReason: m.matchReason || ''
            }))
        : [],
      analysisTimestamp: new Date().toISOString()
    }

    return NextResponse.json(finalResult)

  } catch (error) {
    console.error("Dual CV Analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "שגיאה בניתוח" },
      { status: 500 }
    )
  }
}


