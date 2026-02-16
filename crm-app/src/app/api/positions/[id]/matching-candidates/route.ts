import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { 
  findMatchingTags, 
  getUniqueCategories, 
  calculateTagMatchScore,
  findRelatedCategories 
} from "@/lib/recruitment-tags"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/positions/[id]/matching-candidates - חיפוש מועמדים מתאימים עם מוח AI מלא
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const positionId = resolvedParams.id

    // קבלת פרטי המשרה עם התגיות שלה
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        tags: true,
        employer: true,
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    // חישוב תאריך לפני 21 יום
    const twentyOneDaysAgo = new Date()
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

    // 🧠 חילוץ מילות מפתח מהמשרה
    const positionText = `${position.title} ${position.description || ''} ${position.requirements || ''} ${position.location || ''}`
    const positionRecruitmentTags = findMatchingTags(positionText)
    const positionCategories = getUniqueCategories(positionRecruitmentTags)
    const positionTagKeywords = positionRecruitmentTags.map(t => t.keyword)
    const positionLocation = (position.location || '').toLowerCase()

    // שליפת כל המועמדים מה-21 ימים האחרונים
    const candidates = await prisma.candidate.findMany({
      where: {
        createdAt: {
          gte: twentyOneDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200, // יותר מועמדים כדי למצוא התאמות טובות יותר
      include: {
        tags: true,
        applications: {
          where: {
            positionId: positionId,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    // 🔥🧠 אלגוריתם AI ULTRA - מוח מלא של המערכת
    const candidatesWithScore = await Promise.all(candidates.map(async (candidate) => {
      const candidateTagIds = candidate.tags.map(tag => tag.id)
      const candidateTagNames = candidate.tags.map(tag => tag.name.toLowerCase())
      const positionTagNames = position.tags.map(tag => tag.name.toLowerCase())
      const positionTagIds = position.tags.map(tag => tag.id)
      const candidateCity = (candidate.city || '').toLowerCase()

      // 🆕 חילוץ תגיות גיוס מהמועמד
      const candidateText = `${candidate.name} ${candidate.currentTitle || ''} ${candidate.skills || ''} ${candidate.resume || ''}`
      const candidateRecruitmentTags = findMatchingTags(candidateText)
      const candidateCategories = getUniqueCategories(candidateRecruitmentTags)
      const candidateTagKeywords = candidateRecruitmentTags.map(t => t.keyword)

      // 🧠 שיטה 1: התאמת תגיות בסיסית (15 נקודות - הופחת מ-25)
      const matchingTags = position.tags.filter(tag => 
        candidateTagIds.includes(tag.id)
      )
      const basicTagScore = position.tags.length > 0 
        ? (matchingTags.length / position.tags.length) * 15 
        : 6

      // 🧠 שיטה 2: התאמת תגיות גיוס חכמות (10 נקודות - הופחת מ-20)
      const recruitmentTagMatch = calculateTagMatchScore(candidateTagKeywords, positionTagKeywords)
      const recruitmentTagScore = recruitmentTagMatch.score * 0.1

      // 🧠 שיטה 3: התאמת קטגוריות מקצועיות (5 נקודות - הופחת מ-10)
      const categoryOverlap = candidateCategories.filter(c => positionCategories.includes(c))
      const categoryScore = Math.min(categoryOverlap.length * 1.7, 5)

      // 🧠 שיטה 4: התאמה חלקית של תגיות (3 נקודות - הופחת מ-5)
      let partialMatchScore = 0
      positionTagNames.forEach(posTag => {
        candidateTagNames.forEach(canTag => {
          if (canTag.includes(posTag) || posTag.includes(canTag)) {
            partialMatchScore += 0.3
          }
        })
      })
      partialMatchScore = Math.min(partialMatchScore, 3)

      // 🧠🔥 שיטה 5: התאמת מיקום (40 נקודות! - 40% מסך הציון!)
      let locationScore = 0
      let locationMatch = false
      let locationMatchType = 'none'
      
      if (positionLocation && candidateCity) {
        // התאמה מושלמת - אותה עיר
        if (positionLocation.includes(candidateCity) || candidateCity.includes(positionLocation)) {
          locationScore = 40
          locationMatch = true
          locationMatchType = 'exact'
        } 
        // ערים קרובות מאוד (עד 15 דקות נסיעה)
        else if (areNearbyLocations(candidateCity, positionLocation)) {
          locationScore = 32
          locationMatch = true
          locationMatchType = 'nearby'
        } 
        // אותו אזור כללי (עד 30 דקות)
        else if (areSameRegion(candidateCity, positionLocation)) {
          locationScore = 20
          locationMatchType = 'region'
        }
        // אזור סמוך (עד 45 דקות)
        else if (areAdjacentRegions(candidateCity, positionLocation)) {
          locationScore = 10
          locationMatchType = 'adjacent'
        }
      } else if (!candidateCity && positionLocation) {
        // אם אין מיקום למועמד - ניתן ציון בסיסי
        locationScore = 5
        locationMatchType = 'unknown'
      }

      // 🧠 שיטה 6: ניסיון רלוונטי (10 נקודות)
      let experienceScore = 0
      if (candidate.yearsOfExperience) {
        if (candidate.yearsOfExperience >= 5) experienceScore = 10
        else if (candidate.yearsOfExperience >= 3) experienceScore = 8
        else if (candidate.yearsOfExperience >= 1) experienceScore = 5
        else experienceScore = 3
      }

      // 🧠 שיטה 7: דירוג מועמד (5 נקודות)
      const ratingScore = candidate.rating ? (candidate.rating / 5) * 5 : 2.5

      // 🧠 שיטה 8: התאמת תפקיד נוכחי (5 נקודות)
      let titleScore = 0
      if (candidate.currentTitle && position.title) {
        const canTitle = candidate.currentTitle.toLowerCase()
        const posTitle = position.title.toLowerCase()
        const titleWords = posTitle.split(' ')
        const matchingWords = titleWords.filter(word => 
          canTitle.includes(word) && word.length > 2
        )
        titleScore = Math.min((matchingWords.length / titleWords.length) * 5, 5)
      }

      // 🧠 שיטה 9: רלוונטיות לפי זמן (1 נקודה - הורדנו)
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      const freshnessScore = daysSinceCreated <= 7 ? 1 : daysSinceCreated <= 14 ? 0.5 : 0

      // 🧠 שיטה 10: פרטי קשר ומסמכים (1 נקודה - הורדנו)
      let contactScore = 0
      if (candidate.email) contactScore += 0.25
      if (candidate.phone || candidate.alternatePhone) contactScore += 0.25
      if (candidate.resumeUrl) contactScore += 0.25
      if (candidate.linkedinUrl) contactScore += 0.25

      // 🎓 חילוץ מצב השכלה מקורות החיים
      const resumeText = (candidate.resume || '').toLowerCase()
      const educationStatus = extractEducationStatus(resumeText)

      // 🔑 יצירת עד 30 תגיות השוואה
      const comparisonTags = generateComparisonTags(
        candidate, 
        position, 
        candidateRecruitmentTags,
        matchingTags,
        categoryOverlap,
        educationStatus
      )

      // 📝 יצירת הסבר למה מתאים
      const whySuitable = generateWhySuitable(
        candidate,
        position,
        matchingTags,
        categoryOverlap,
        locationMatch,
        educationStatus,
        candidateRecruitmentTags
      )

      // חישוב ציון סופי (מקסימום 100)
      const rawScore = 
        basicTagScore + 
        recruitmentTagScore + 
        categoryScore +
        partialMatchScore + 
        locationScore +
        experienceScore + 
        ratingScore + 
        titleScore + 
        freshnessScore + 
        contactScore

      const finalScore = Math.min(Math.round(rawScore), 100)

      return {
        ...candidate,
        matchingTags,
        matchScore: finalScore,
        hasApplied: candidate.applications.length > 0,
        locationMatch,
        locationMatchType, // 🆕 סוג התאמת מיקום
        extractedCity: candidateCity, // 🆕 עיר שחולצה
        // 🆕 מידע מתגיות גיוס
        candidateCategories,
        categoryOverlap,
        recruitmentTagMatch: recruitmentTagMatch.matchedTags.length,
        // 🆕 מידע חדש!
        educationStatus,
        comparisonTags,
        whySuitable,
        candidateRecruitmentTags: candidateRecruitmentTags.slice(0, 15).map(t => t.keyword),
        scoreBreakdown: {
          tags: Math.round(basicTagScore),
          recruitmentTags: Math.round(recruitmentTagScore),
          categories: Math.round(categoryScore),
          partial: Math.round(partialMatchScore),
          location: Math.round(locationScore),
          locationMaxPossible: 40, // 🆕 הציון המקסימלי למיקום
          experience: experienceScore,
          rating: Math.round(ratingScore),
          title: Math.round(titleScore),
          freshness: freshnessScore,
          contact: Math.round(contactScore),
        }
      }
    }))

    // מיון - קודם לפי ציון התאמה, אחר כך לפי מיקום
    candidatesWithScore.sort((a, b) => {
      // קודם כל לפי ציון - המועמדים עם האחוז הגבוה ביותר קודמים
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      // אם הציון זהה - מועמדים עם התאמת מיקום קודמים
      if (a.locationMatch && !b.locationMatch) return -1
      if (!a.locationMatch && b.locationMatch) return 1
      // אם גם הציון וגם המיקום זהים - לפי תאריך
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // סינון - רק מועמדים עם ציון סביר
    const relevantCandidates = candidatesWithScore.filter(c => c.matchScore >= 20 || c.locationMatch)

    return NextResponse.json({
      candidates: relevantCandidates.slice(0, 100),
      positionTags: position.tags,
      positionCategories,
      totalCount: relevantCandidates.length,
      daysBack: 21,
      aiPowered: true,
    })
  } catch (error) {
    console.error("Error fetching matching candidates:", error)
    return NextResponse.json(
      { error: "Failed to fetch matching candidates" },
      { status: 500 }
    )
  }
}

// פונקציה לבדיקת קרבת מיקומים
function areNearbyLocations(city1: string, city2: string): boolean {
  const nearbyGroups = [
    ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'יפו', 'רמת השרון', 'הרצליה'],
    ['ירושלים', 'בית שמש', 'מעלה אדומים', 'גוש עציון', 'מבשרת ציון'],
    ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נשר', 'טירת כרמל'],
    ['ראשון לציון', 'נס ציונה', 'רחובות', 'יבנה', 'אשדוד', 'גדרה'],
    ['פתח תקווה', 'כפר סבא', 'רעננה', 'הוד השרון', 'ראש העין', 'רמת השרון'],
    ['נתניה', 'חדרה', 'כפר יונה', 'פרדס חנה'],
    ['באר שבע', 'אופקים', 'נתיבות', 'שדרות', 'דימונה', 'ערד'],
    ['אשדוד', 'אשקלון', 'קריית גת', 'שדרות'],
  ]
  
  for (const group of nearbyGroups) {
    const normalizedGroup = group.map(g => g.toLowerCase())
    const match1 = normalizedGroup.some(g => city1.includes(g) || g.includes(city1))
    const match2 = normalizedGroup.some(g => city2.includes(g) || g.includes(city2))
    if (match1 && match2) return true
  }
  return false
}

// פונקציה לבדיקת אותו אזור כללי
function areSameRegion(city1: string, city2: string): boolean {
  const regions: Record<string, string[]> = {
    'מרכז': ['תל אביב', 'רמת גן', 'פתח תקווה', 'ראשון לציון', 'חולון', 'בת ים', 'הרצליה', 'רעננה', 'כפר סבא', 'נתניה', 'רחובות', 'נס ציונה', 'יבנה', 'לוד', 'רמלה', 'הוד השרון', 'ראש העין', 'גבעתיים', 'בני ברק', 'אור יהודה', 'קריית אונו', 'גני תקווה', 'כפר קאסם', 'אזור', 'גלילות', 'אירפורט סיטי', 'סקיי טאוור', 'מגדל', 'בורסה'],
    'צפון': ['חיפה', 'קריות', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'עפולה', 'נצרת', 'כרמיאל', 'נהריה', 'עכו', 'טבריה', 'צפת', 'קריית שמונה', 'מגדל העמק', 'יקנעם', 'נשר', 'טירת כרמל', 'עתלית', 'חדרה', 'פרדס חנה'],
    'דרום': ['באר שבע', 'אשדוד', 'אשקלון', 'קריית גת', 'אילת', 'דימונה', 'ערד', 'אופקים', 'נתיבות', 'שדרות', 'נמל אשדוד', 'ממגורות', 'בני דרום', 'חפץ חיים', 'מבקיעים', 'גדרה', 'יבנה'],
    'ירושלים': ['ירושלים', 'בית שמש', 'מעלה אדומים', 'מבשרת ציון', 'מודיעין', 'גוש עציון', 'אפרת', 'בית חיליקה'],
    'שרון': ['נתניה', 'חדרה', 'כפר סבא', 'רעננה', 'הרצליה', 'הוד השרון', 'כפר יונה', 'פרדס חנה', 'רמת השרון', 'גלילות'],
  }
  
  for (const [region, cities] of Object.entries(regions)) {
    const normalizedCities = cities.map(c => c.toLowerCase())
    const match1 = normalizedCities.some(c => city1.includes(c) || c.includes(city1))
    const match2 = normalizedCities.some(c => city2.includes(c) || c.includes(city2))
    if (match1 && match2) return true
  }
  return false
}

// 🆕 פונקציה לבדיקת אזורים סמוכים (בין אזורים שונים)
function areAdjacentRegions(city1: string, city2: string): boolean {
  const adjacentPairs = [
    // מרכז <-> שרון
    [['תל אביב', 'רמת השרון', 'הרצליה', 'רעננה', 'כפר סבא'], ['נתניה', 'חדרה', 'הוד השרון']],
    // מרכז <-> ירושלים
    [['מודיעין', 'לוד', 'רמלה'], ['ירושלים', 'בית שמש']],
    // מרכז <-> דרום
    [['ראשון לציון', 'רחובות', 'יבנה', 'נס ציונה'], ['אשדוד', 'גדרה', 'קריית גת']],
    // שרון <-> צפון
    [['נתניה', 'חדרה', 'פרדס חנה'], ['חיפה', 'קריות']],
  ]
  
  for (const [region1, region2] of adjacentPairs) {
    const norm1 = region1.map(c => c.toLowerCase())
    const norm2 = region2.map(c => c.toLowerCase())
    
    const inRegion1_city1 = norm1.some(c => city1.includes(c) || c.includes(city1))
    const inRegion2_city1 = norm2.some(c => city1.includes(c) || c.includes(city1))
    const inRegion1_city2 = norm1.some(c => city2.includes(c) || c.includes(city2))
    const inRegion2_city2 = norm2.some(c => city2.includes(c) || c.includes(city2))
    
    // אחד באזור 1 ואחד באזור 2
    if ((inRegion1_city1 && inRegion2_city2) || (inRegion2_city1 && inRegion1_city2)) {
      return true
    }
  }
  return false
}

// 🆕 חילוץ עיר מקורות חיים
function extractCityFromResume(resumeText: string): string {
  const lowerText = resumeText.toLowerCase()
  
  // רשימת כל הערים בישראל למציאה
  const allCities = [
    // מרכז
    'תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'ראשון לציון', 
    'פתח תקווה', 'הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'ראש העין', 'לוד', 
    'רמלה', 'רחובות', 'נס ציונה', 'יבנה', 'אור יהודה', 'קריית אונו', 'גני תקווה',
    // צפון
    'חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נצרת', 
    'עפולה', 'כרמיאל', 'נהריה', 'עכו', 'טבריה', 'צפת', 'מגדל העמק', 'יקנעם',
    'נשר', 'טירת כרמל', 'חדרה',
    // דרום
    'באר שבע', 'אשדוד', 'אשקלון', 'קריית גת', 'אילת', 'דימונה', 'ערד', 
    'אופקים', 'נתיבות', 'שדרות', 'גדרה', 'קריית מלאכי',
    // ירושלים
    'ירושלים', 'בית שמש', 'מודיעין', 'מעלה אדומים', 'מבשרת ציון',
    // שרון
    'נתניה', 'רמת השרון', 'כפר יונה', 'פרדס חנה',
  ]
  
  // מיון לפי אורך (כדי שערים ארוכות יתאימו קודם - כמו "קריית אתא" לפני "קריית")
  const sortedCities = allCities.sort((a, b) => b.length - a.length)
  
  // מילות מפתח שמרמזות על מגורים
  const residencePatterns = [
    'מתגורר ב', 'גר ב', 'מגורים:', 'עיר:', 'כתובת:', 'מ-', 'תושב', 'תושבת',
    'מתגוררת ב', 'גרה ב', 'מאזור', 'באזור'
  ]
  
  // חיפוש עיר ליד מילות מפתח של מגורים
  for (const pattern of residencePatterns) {
    const idx = lowerText.indexOf(pattern)
    if (idx !== -1) {
      const vicinity = lowerText.substring(idx, idx + 50)
      for (const city of sortedCities) {
        if (vicinity.includes(city.toLowerCase())) {
          return city.toLowerCase()
        }
      }
    }
  }
  
  // חיפוש כללי - עיר בכל מקום בטקסט
  for (const city of sortedCities) {
    if (lowerText.includes(city.toLowerCase())) {
      return city.toLowerCase()
    }
  }
  
  return ''
}

// 🎓 חילוץ מצב השכלה
function extractEducationStatus(text: string): {
  level: string
  isStudying: boolean
  details: string
} {
  const lowerText = text.toLowerCase()
  
  // בדיקה אם עדיין לומד
  const studyingPatterns = [
    'סטודנט', 'לומד', 'בלימודים', 'שנה א', 'שנה ב', 'שנה ג', 'שנה ד',
    'עדיין לומד', 'בתהליך לימודים', 'לומדת', 'סטודנטית', 'student'
  ]
  const isStudying = studyingPatterns.some(p => lowerText.includes(p))
  
  // זיהוי רמת השכלה
  let level = ''
  let details = ''
  
  // דוקטורט
  if (lowerText.includes('דוקטור') || lowerText.includes('phd') || lowerText.includes('ph.d')) {
    level = 'דוקטורט'
    details = 'תואר שלישי (דוקטורט)'
  }
  // תואר שני
  else if (lowerText.includes('תואר שני') || lowerText.includes('מוסמך') || lowerText.includes('ma ') || 
           lowerText.includes('m.a') || lowerText.includes('mba') || lowerText.includes('m.sc') ||
           lowerText.includes('msc') || lowerText.includes('master')) {
    level = 'תואר שני'
    details = 'תואר שני (מוסמך)'
  }
  // תואר ראשון
  else if (lowerText.includes('תואר ראשון') || lowerText.includes('בוגר') || lowerText.includes('ba ') || 
           lowerText.includes('b.a') || lowerText.includes('b.sc') || lowerText.includes('bsc') ||
           lowerText.includes('bachelor') || lowerText.includes('ll.b') || lowerText.includes('llb')) {
    level = 'תואר ראשון'
    details = 'תואר ראשון (בוגר)'
  }
  // הנדסאי / טכנאי
  else if (lowerText.includes('הנדסאי') || lowerText.includes('טכנאי') || lowerText.includes('מכללה')) {
    level = 'על תיכונית'
    details = 'השכלה על תיכונית (הנדסאי/טכנאי)'
  }
  // תעודה מקצועית
  else if (lowerText.includes('תעודה') || lowerText.includes('קורס') || lowerText.includes('הסמכה')) {
    level = 'הכשרה מקצועית'
    details = 'הכשרה מקצועית / קורס'
  }
  // בגרות
  else if (lowerText.includes('בגרות') || lowerText.includes('תיכון') || lowerText.includes('12 שנות')) {
    level = 'תיכונית'
    details = 'השכלה תיכונית (בגרות)'
  }

  // אם עדיין לומד, נוסיף את זה
  if (isStudying && level) {
    details = `${level} (עדיין לומד)`
  } else if (isStudying && !level) {
    level = 'לומד'
    details = 'עדיין בלימודים'
  }
  
  return { level, isStudying, details }
}

// 🔑 יצירת עד 30 תגיות השוואה
function generateComparisonTags(
  candidate: any,
  position: any,
  candidateRecruitmentTags: any[],
  matchingTags: any[],
  categoryOverlap: string[],
  educationStatus: { level: string; isStudying: boolean; details: string }
): Array<{ name: string; type: 'match' | 'skill' | 'education' | 'location' | 'experience' | 'category'; color: string }> {
  const tags: Array<{ name: string; type: 'match' | 'skill' | 'education' | 'location' | 'experience' | 'category'; color: string }> = []
  
  // 1. תגיות תואמות (ירוק)
  matchingTags.slice(0, 8).forEach(tag => {
    tags.push({ name: `✓ ${tag.name}`, type: 'match', color: '#22C55E' })
  })
  
  // 2. קטגוריות מקצועיות תואמות (כחול)
  categoryOverlap.slice(0, 4).forEach(cat => {
    tags.push({ name: `📂 ${cat}`, type: 'category', color: '#3B82F6' })
  })
  
  // 3. כישורים מזוהים (סגול)
  candidateRecruitmentTags.slice(0, 6).forEach(tag => {
    if (!tags.some(t => t.name.includes(tag.keyword))) {
      tags.push({ name: tag.keyword, type: 'skill', color: '#8B5CF6' })
    }
  })
  
  // 4. השכלה (כתום)
  if (educationStatus.level) {
    tags.push({ 
      name: `🎓 ${educationStatus.details || educationStatus.level}`, 
      type: 'education', 
      color: '#F59E0B' 
    })
  }
  
  // 5. מיקום (טורקיז)
  if (candidate.city) {
    tags.push({ name: `📍 ${candidate.city}`, type: 'location', color: '#06B6D4' })
  }
  
  // 6. ניסיון (ורוד)
  if (candidate.yearsOfExperience) {
    tags.push({ 
      name: `⏱️ ${candidate.yearsOfExperience} שנות ניסיון`, 
      type: 'experience', 
      color: '#EC4899' 
    })
  }
  
  // 7. תפקיד נוכחי (אפור)
  if (candidate.currentTitle) {
    tags.push({ name: `💼 ${candidate.currentTitle}`, type: 'skill', color: '#6B7280' })
  }
  
  // 8. כישורים מפורטים (מכישורים של המועמד)
  if (candidate.skills) {
    const skills = candidate.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 1)
    skills.slice(0, 5).forEach((skill: string) => {
      if (!tags.some(t => t.name.toLowerCase().includes(skill.toLowerCase()))) {
        tags.push({ name: skill, type: 'skill', color: '#8B5CF6' })
      }
    })
  }
  
  // מגבלה של 30 תגיות
  return tags.slice(0, 30)
}

// 📝 יצירת הסבר למה מתאים
function generateWhySuitable(
  candidate: any,
  position: any,
  matchingTags: any[],
  categoryOverlap: string[],
  locationMatch: boolean,
  educationStatus: { level: string; isStudying: boolean; details: string },
  candidateRecruitmentTags: any[]
): string[] {
  const reasons: string[] = []
  
  // 1. תגיות תואמות
  if (matchingTags.length > 0) {
    reasons.push(`✅ ${matchingTags.length} תגיות תואמות: ${matchingTags.slice(0, 3).map(t => t.name).join(', ')}`)
  }
  
  // 2. קטגוריה מקצועית
  if (categoryOverlap.length > 0) {
    reasons.push(`📂 מתאים לתחום: ${categoryOverlap.join(', ')}`)
  }
  
  // 3. מיקום
  if (locationMatch) {
    reasons.push(`📍 מתגורר באזור המשרה: ${candidate.city}`)
  } else if (candidate.city && position.location) {
    reasons.push(`📍 מתגורר ב${candidate.city}`)
  }
  
  // 4. השכלה
  if (educationStatus.details) {
    reasons.push(`🎓 ${educationStatus.details}`)
  }
  
  // 5. ניסיון
  if (candidate.yearsOfExperience) {
    if (candidate.yearsOfExperience >= 5) {
      reasons.push(`⭐ ניסיון עשיר: ${candidate.yearsOfExperience} שנים`)
    } else if (candidate.yearsOfExperience >= 2) {
      reasons.push(`💼 ניסיון: ${candidate.yearsOfExperience} שנים`)
    } else {
      reasons.push(`🌱 מתחיל עם ${candidate.yearsOfExperience} שנות ניסיון`)
    }
  }
  
  // 6. תפקיד נוכחי רלוונטי
  if (candidate.currentTitle && position.title) {
    const canTitle = candidate.currentTitle.toLowerCase()
    const posTitle = position.title.toLowerCase()
    const titleWords = posTitle.split(' ')
    const hasMatch = titleWords.some((word: string) => canTitle.includes(word) && word.length > 2)
    if (hasMatch) {
      reasons.push(`💼 תפקיד נוכחי רלוונטי: ${candidate.currentTitle}`)
    }
  }
  
  // 7. כישורים מזוהים
  if (candidateRecruitmentTags.length > 0) {
    const topSkills = candidateRecruitmentTags.slice(0, 4).map(t => t.keyword)
    reasons.push(`🔧 כישורים: ${topSkills.join(', ')}`)
  }
  
  // 8. דירוג
  if (candidate.rating && candidate.rating >= 4) {
    reasons.push(`⭐ דירוג גבוה: ${candidate.rating}/5`)
  }
  
  return reasons.slice(0, 8)
}
