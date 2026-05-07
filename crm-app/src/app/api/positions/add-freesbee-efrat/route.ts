import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"

/**
 * הוספת 2 משרות ל-FREESBEE - מגייסת: אפרת לוי
 *
 *   GET /api/positions/add-freesbee-efrat?key=twenty2freesbee2026
 *
 * • מנהל/ת סניף - מכירת רכב כמו חדש
 * • מאבחן/ת רכב
 *
 * efratle@freesbe.com
 * תיוגים: ≥40 לכל משרה
 */

const RECRUITER_EMAIL = 'efratle@freesbe.com'
const RECRUITER_NAME = 'אפרת לוי (FREESBEE)'

const TAG_COLORS: Record<string, string> = {
  'FREESBEE': '#EF4444',
  'רכב': '#10B981',
  'מנהל סניף': '#7C3AED',
  'ניהול סניף': '#7C3AED',
  'ניהול צוות': '#8B5CF6',
  'מכירות': '#3B82F6',
  'מכירת רכבים': '#3B82F6',
  'רכב כמו חדש': '#22C55E',
  'מגרש רכב': '#10B981',
  'מאבחן רכב': '#0EA5E9',
  'מאבחנת רכב': '#0EA5E9',
  'אבחון רכב': '#0EA5E9',
  'חשמלאי רכב': '#F59E0B',
  'הנדסאי רכב': '#A855F7',
  'מוסך': '#06B6D4',
  'משרה מלאה': '#22C55E',
  "א'-ו'": '#0891B2',
  'דחוף': '#EF4444',
}

// ===== משרה 1: מנהל סניף =====
const MGR_TITLE = 'מנהל/ת סניף - מכירת רכב כמו חדש'
const MGR_DESCRIPTION = `📍 מנהל/ת סניף

🏢 חברת FREESBEE מחפשת מנהל/ת סניף למכירת רכב "כמו חדש" במגרשי החברה.

🎯 איך ייראה היומיום שלך?
• אחריות על מכירת רכב "כמו חדש" במגרשי החברה
• מתן שירות והצעות מחיר ללקוחות המגיעים לסניף המכירה
• ניהול נציגי השינוע והמכירה בסניף
• וידוא כי המגרש מדוגם ומדוגל בהתאם לנהלים
• מתן אישור לעסקאות המוצעות על ידי אנשי המכירות
• גביית כספים מהלקוח והנפקת קבלה
• עמידה וניהול יעדי מכירה חודשיים ושנתיים

📋 מה תביא/י איתך?
• ניהול עם דרייב ובקצב בלתי פוסק ביחד עם צוות המכירות
• ניסיון בתפקיד ניהול מתחום המכירות
• ידע והבנה בעולם הרכב
• נכונות למשרה מלאה א'-ו'

🎁 מה אנחנו ניתן לך?
• ארוחות מסובסדות / סיבוס
• ימי גיבוש, טיולים ונופשי חברה בחו"ל
• קה"ש וביטוח בריאות
• עבודה באווירה משפחתית, נעימה ומגובשת

⏰ משרה מלאה - א'-ו'

💼 למעוניינים: נא לציין צפי שכר במייל החזרה.`

const MGR_REQUIREMENTS = `• ניסיון בתפקיד ניהול מתחום המכירות - חובה
• ידע והבנה בעולם הרכב - חובה
• ניהול עם דרייב ובקצב בלתי פוסק
• נכונות למשרה מלאה א'-ו'`

const MGR_BASE_TAGS = [
  'FREESBEE',
  // תפקיד
  'מנהל סניף', 'מנהלת סניף', 'מנהל/ת סניף', 'ניהול סניף',
  'ניהול צוות מכירות', 'ניהול צוות', 'ניהול אנשי מכירות',
  'ניהול עסקי', 'ניהול תפעולי', 'תפעול סניף',
  // ענף
  'רכב', 'מכוניות', 'ענף הרכב', 'רכב כמו חדש', 'רכב יד שנייה',
  'מגרש רכב', 'מגרשי רכב', 'אולם תצוגה',
  // מכירות
  'מכירות', 'מכירת רכבים', 'איש מכירות', 'אנשי מכירות',
  'הצעות מחיר', 'משא ומתן', 'אישור עסקאות', 'גביית כספים',
  'הנפקת קבלות', 'יעדי מכירה', 'עמידה ביעדים',
  // ניהול
  'ניהול נציגי שינוע', 'ניהול שטח', 'הובלת צוות', 'אחריות ניהולית',
  'אכיפת נהלים', 'בקרה ופיקוח',
  // תנאים
  'משרה מלאה', "א'-ו'", 'ימי שישי', 'סיבוס', 'ארוחות מסובסדות',
  'ביטוח בריאות', 'קה"ש', 'נופשי חברה',
  // soft
  'דרייב', 'יוזמה', 'אנרגטיות', 'אסרטיביות', 'יחסי אנוש',
  'אוריינטציה ליעדים', 'ראייה עסקית', 'תודעת שירות', 'שירות לקוחות',
]

// ===== משרה 2: מאבחן רכב =====
const DIAG_TITLE = 'מאבחן/ת רכב'
const DIAG_DESCRIPTION = `📍 מאבחן/ת רכב

🏢 חברת FREESBEE מחפשת מאבחן/ת רכב למוסך החברה.

🎯 תיאור התפקיד:
• אבחון תקלות ברכב
• ניהול ממשק שוטף עם המכונאים במחלקה, במהלך תיקון התקלות
• תפעול ושימוש בכלי אבחון

📋 דרישות התפקיד:
• ניסיון קודם כמאבחן/ת / חשמלאי/ת - חובה
• הנדסאי/ת רכב - יתרון
• אנגלית טכנית ברמה גבוהה

⏰ משרה מלאה

💼 למעוניינים: נא לציין צפי שכר במייל החזרה.`

const DIAG_REQUIREMENTS = `• ניסיון קודם כמאבחן/ת רכב או חשמלאי/ת רכב - חובה
• הנדסאי/ת רכב - יתרון
• אנגלית טכנית ברמה גבוהה
• עבודה מול צוות מכונאים`

const DIAG_BASE_TAGS = [
  'FREESBEE',
  // תפקיד
  'מאבחן רכב', 'מאבחנת רכב', 'מאבחן/ת רכב', 'אבחון רכב',
  'אבחון תקלות', 'אבחון תקלות רכב', 'דיאגנוסטיקה',
  'דיאגנוסטיקת רכב', 'טכנאי אבחון',
  // קשר
  'חשמלאי רכב', 'חשמלאית רכב', 'חשמלאי/ת רכב',
  'מכונאי רכב', 'מכונאות רכב', 'הנדסאי רכב', 'הנדסאית רכב',
  'הנדסאי/ת רכב', 'טכנאי רכב', 'טכנאי/ת רכב',
  // ענף
  'רכב', 'מכוניות', 'ענף הרכב', 'מוסך', 'מוסך מורשה',
  'תיקון רכב', 'תחזוקת רכב',
  // כלים וידע
  'כלי אבחון', 'מערכות אבחון', 'OBD', 'OBD2', 'תוכנות אבחון',
  'מערכות חשמל ברכב', 'מערכות הרכב', 'ידע טכני ברכב',
  // שפה
  'אנגלית טכנית', 'אנגלית ברמה גבוהה', 'קריאה טכנית',
  // עבודה
  'עבודה בצוות', 'עבודה עם מכונאים', 'ממשק עם צוות מוסך',
  'פתרון בעיות', 'יכולת אנליטית',
  // תנאים
  'משרה מלאה', "א'-ה'", 'ניסיון נדרש',
  // soft
  'דיוק', 'יסודיות', 'עצמאות בעבודה', 'אחריות', 'אמינות',
  'יוזמה', 'תודעת שירות',
]

const FALLBACK_MGR = [...MGR_BASE_TAGS]
const FALLBACK_DIAG = [...DIAG_BASE_TAGS]

type PositionDef = {
  title: string
  location: string
  description: string
  requirements: string
  baseTags: string[]
  fallback: string[]
  workHours: string
  employmentType: string
  internal: any
  aiProfileExtras: any
}

const POSITIONS: PositionDef[] = [
  {
    title: MGR_TITLE,
    location: 'מגרשי החברה',
    description: MGR_DESCRIPTION,
    requirements: MGR_REQUIREMENTS,
    baseTags: MGR_BASE_TAGS,
    fallback: FALLBACK_MGR,
    workHours: "א'-ו' משרה מלאה",
    employmentType: 'משרה מלאה',
    internal: {
      salary: {
        baseGross: 7448,
        baseLabel: '7,448 ש"ח בסיס (6,248 בסיס + 1,200 שנ"ג)',
        guarantee: '1,500 ש"ח הגנת שכר לחודשיים',
        averageTotal: '18,000-20,000 ₪ ברוטו (כולל פרמיות)',
        publishSalary: false,
        notes: 'בבקשה לא לפרסם שכר',
      },
      benefits: ['ארוחות מסובסדות / סיבוס', 'ימי גיבוש', 'טיולים', 'נופשי חברה בחו"ל', 'קה"ש', 'ביטוח בריאות'],
      workHours: "א'-ו' משרה מלאה",
      publishHours: true,
    },
    aiProfileExtras: {
      role: 'מנהל/ת סניף - מכירת רכב כמו חדש',
      industry: 'רכב ותחבורה',
      seniority: 'SENIOR',
      requiredSkills: ['ניהול צוות מכירות', 'מכירת רכבים', 'ניהול תפעולי', 'יעדי מכירה'],
      requiredExperience: 3,
    },
  },
  {
    title: DIAG_TITLE,
    location: 'מוסך החברה',
    description: DIAG_DESCRIPTION,
    requirements: DIAG_REQUIREMENTS,
    baseTags: DIAG_BASE_TAGS,
    fallback: FALLBACK_DIAG,
    workHours: "א'-ה' משרה מלאה",
    employmentType: 'משרה מלאה',
    internal: {
      salary: {
        baseGross: 10000,
        baseLabel: '10,000-12,000 ש"ח בסיס',
        bonuses: 'עד 1,400 ש"ח פרמיות',
        averageTotal: '11,400-13,400 ₪ ברוטו',
        publishSalary: false,
        notes: 'לא לפרסם שכר. השכר נקבע בהתאם לניסיון.',
      },
      workHours: "א'-ה' משרה מלאה",
      publishHours: true,
    },
    aiProfileExtras: {
      role: 'מאבחן/ת רכב',
      industry: 'רכב ותחבורה / מוסך',
      seniority: 'MID',
      requiredSkills: ['אבחון תקלות', 'כלי אבחון', 'אנגלית טכנית', 'מערכות חשמל ברכב'],
      requiredExperience: 2,
    },
  },
]

async function ensureTag(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return null
  let tag = await prisma.tag.findFirst({ where: { name: trimmed } })
  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name: trimmed,
        color: TAG_COLORS[trimmed] || '#64748B',
        category: 'position',
      },
    })
  }
  return tag
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key') || request.nextUrl.searchParams.get('key')
    const validKeys = ['twenty2freesbee2026', 'twenty2freesbee', 'freesbee2026']
    if (!key || !validKeys.includes(key)) {
      return NextResponse.json({
        error: 'Unauthorized',
        debug: { receivedKey: key, url: request.url },
      }, { status: 401 })
    }

    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'FREESBEE', mode: 'insensitive' } },
          { name: { contains: 'freesbee', mode: 'insensitive' } },
          { name: { contains: 'פריזבי' } },
        ],
      },
    })
    let employerCreated = false
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'FREESBEE',
          email: RECRUITER_EMAIL,
          phone: '',
          description: 'FREESBEE - גיוס לחברות.',
        },
      })
      employerCreated = true
    }

    const results: any[] = []

    for (const p of POSITIONS) {
      // Gemini
      let geminiTags: string[] = []
      let gem: any = null
      let geminiOk = false
      try {
        gem = await analyzeJobDescriptionWithGemini(p.description)
        geminiOk = true
        if (Array.isArray(gem.jobTags)) geminiTags = gem.jobTags
      } catch (err) {
        console.warn(`[FREESBEE/efrat/${p.title}] Gemini failed:`, (err as Error).message)
      }

      // merge tags ≥40
      const tagSet = new Set<string>()
      for (const t of p.baseTags) tagSet.add(t)
      for (const t of geminiTags) tagSet.add(t)
      if (tagSet.size < 30) {
        for (const t of p.fallback) tagSet.add(t)
      }
      const tagNames = Array.from(tagSet)
        .map(t => (t || '').trim())
        .filter(t => t.length >= 2 && t.length <= 40)

      const tagMap: Record<string, any> = {}
      for (const name of tagNames) {
        const t = await ensureTag(name)
        if (t) tagMap[name] = t
      }

      const aiProfile = {
        ...p.aiProfileExtras,
        industries: gem?.industries || ['רכב'],
        keyRequirements: gem?.keyRequirements || [],
        keywords: tagNames,
        location: p.location,
        employer: 'FREESBEE',
        _internal: {
          ...p.internal,
          recruiterEmail: RECRUITER_EMAIL,
          recruiterName: RECRUITER_NAME,
        },
      }

      const existing = await prisma.position.findFirst({
        where: { title: p.title, employerId: employer.id },
      })

      const data = {
        title: p.title,
        location: p.location,
        description: p.description,
        requirements: p.requirements,
        salaryRange: 'לא לפרסום',
        workHours: p.workHours,
        employmentType: p.employmentType,
        keywords: JSON.stringify(tagNames.slice(0, 60)),
        aiProfile: JSON.stringify(aiProfile),
        contactEmail: RECRUITER_EMAIL,
        contactName: RECRUITER_NAME,
        priority: 0,
        employerId: employer.id,
        active: true,
      }

      let position
      let created = false
      if (existing) {
        position = await prisma.position.update({
          where: { id: existing.id },
          data: {
            ...data,
            tags: {
              set: [],
              connect: Object.values(tagMap).map((t: any) => ({ id: t.id })),
            },
          },
          include: { tags: true },
        })
      } else {
        position = await prisma.position.create({
          data: {
            ...data,
            tags: {
              connect: Object.values(tagMap).map((t: any) => ({ id: t.id })),
            },
          },
          include: { tags: true },
        })
        created = true
      }

      results.push({
        title: p.title,
        positionId: position.id,
        created,
        tagsCount: position.tags.length,
        tagsAtLeast40: position.tags.length >= 40,
        gemini: { ok: geminiOk, tagsFromGemini: geminiTags.length },
      })
    }

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name,
        created: employerCreated,
      },
      recruiter: { name: RECRUITER_NAME, email: RECRUITER_EMAIL },
      positions: results,
      total: results.length,
    })
  } catch (error: any) {
    console.error('[FREESBEE/efrat] Error:', error)
    return NextResponse.json(
      { error: 'Failed', message: error?.message, stack: error?.stack?.split('\n').slice(0, 5) },
      { status: 500 },
    )
  }
}
