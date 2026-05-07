import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"
import { buildFreesbeeTags, colorForFreesbeeTag, type FreesbeeBrand } from "@/lib/freesbee-tags"

/**
 * הוספת 4 משרות מכירות רכב ל-FREESBEE - מגייסת: Odelle A. (ManpowerGroup)
 *
 *   GET /api/positions/add-freesbee-odelle?key=twenty2freesbee2026
 *
 * • צ'רי שורק (דיסקרטי)
 * • ניסאן רעננה
 * • צ'רי מודיעין
 * • צ'רי אשדוד (דחוף)
 *
 * • תיאור הציבור ללא שכר/שעות מפורטים (לפי בקשת הלקוח)
 * • Gemini מייצר תגיות + פרופיל AI לכל משרה
 * • שכר/שעות נשמרים ב-aiProfile._internal בלבד
 */

const RECRUITER_EMAIL = 'OdelleA@manpowergroup.co.il'
const RECRUITER_NAME = 'Odelle A. (ManpowerGroup)'

const COMMON_REQUIREMENTS = `• ניסיון במכירות - חובה
• כושר שכנוע, גמישות ופתיחות מחשבתית
• נכונות לעבודה במשרה מלאה כולל ימי שישי`

const COMMON_WORK_HOURS = "א'-ה' 08:30-18:00, שישי 08:30-13:00 (שישי קבוע, חצי יום חופש באמצ\"ש)"

const COMMON_AVERAGE = '15,000-16,000 ₪ ברוטו (כולל פרמיות)'

const TAG_COLORS: Record<string, string> = {
  'מכירות': '#3B82F6',
  'רכב': '#10B981',
  'רנו': '#FCC200',
  'צ\'רי': '#DC2626',
  'ניסאן': '#C0392B',
  'אולם תצוגה': '#8B5CF6',
  'נתניה': '#06B6D4',
  'רעננה': '#0EA5E9',
  'מודיעין': '#0891B2',
  'אשדוד': '#0284C7',
  'שורק': '#0369A1',
  'משרה מלאה': '#22C55E',
  'שירות לקוחות': '#EC4899',
  'משא ומתן': '#F59E0B',
  'עמלות': '#EAB308',
  'דחוף': '#EF4444',
  'דיסקרטי': '#7C3AED',
  'FREESBEE': '#EF4444',
}

const FALLBACK_TAGS = [
  'מכירות', 'נציג מכירות', 'איש מכירות', 'אשת מכירות',
  'מכירת רכבים', 'רכב', 'אולם תצוגה',
  'משרה מלאה', 'שישי',
  'שירות לקוחות', 'משא ומתן', 'כושר שכנוע',
  'עמידה ביעדים', 'Up sale', 'חוויית לקוח',
]

type PositionDef = {
  title: string
  brand: FreesbeeBrand     // 'רנו' / 'צ\'רי' / 'ניסאן'
  city: string
  isUrgent?: boolean
  isDiscreet?: boolean
  guaranteeText: string  // טקסט הגנת שכר (לפנימי)
  extraBenefits?: string // למשל "סיבוס" - לפנימי
  extraTags?: string[]
}

const POSITIONS: PositionDef[] = [
  {
    title: "נציג/ת מכירות צ'רי שורק - דיסקרטי",
    brand: "צ'רי",
    city: 'שורק',
    isDiscreet: true,
    guaranteeText: '2,500 ש"ח הגנת שכר 3 חודשים',
    extraTags: ['דיסקרטי'],
  },
  {
    title: 'נציג/ת מכירות ניסאן - רעננה',
    brand: 'ניסאן',
    city: 'רעננה',
    guaranteeText: '2,500 ש"ח הגנת שכר חודשיים ראשונים',
  },
  {
    title: "נציג/ת מכירות צ'רי - מודיעין",
    brand: "צ'רי",
    city: 'מודיעין',
    guaranteeText: '2,500 ש"ח הגנת שכר 3 חודשים ראשונים',
    extraBenefits: 'סיבוס',
  },
  {
    title: "נציג/ת מכירות צ'רי אשדוד - דחוף",
    brand: "צ'רי",
    city: 'אשדוד',
    isUrgent: true,
    guaranteeText: '2,500 ש"ח הגנת שכר 3 חודשים ראשונים',
    extraBenefits: 'סיבוס',
    extraTags: ['דחוף'],
  },
]

function buildPublicDescription(p: PositionDef): string {
  const flagLine = p.isUrgent ? '⚡ דחוף לאיוש!\n\n' : (p.isDiscreet ? '🔒 גיוס דיסקרטי\n\n' : '')
  return `📍 ${p.title}

🏢 חברת FREESBEE מחפשת נציג/ת מכירות לאולם תצוגה ${p.brand} ב${p.city}.
${flagLine ? '\n' + flagLine : ''}
🎯 התפקיד כולל:
• מכירת רכבים חדשים באולם התצוגה ועמידה ביעדים
• בניית פתרונות מכירה ברורים המותאמים למותג וללקוח, והגדלת Up sale באמצעות מגוון פתרונות אפשריים
• אחריות על חוויית לקוח קצבית, מגוונת ובהירה

📋 דרישות התפקיד:
• ניסיון במכירות - חובה
• כושר שכנוע, גמישות ופתיחות מחשבתית
• נכונות לעבודה במשרה מלאה כולל ימי שישי

⏰ ימי עבודה: א'-ה' + ימי שישי קבוע (יש חצי יום חופש באמצ"ש)

💼 למעוניינים: נא לציין צפי שכר במייל החזרה.`
}

async function ensureTag(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return null
  let tag = await prisma.tag.findFirst({ where: { name: trimmed } })
  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name: trimmed,
        color: TAG_COLORS[trimmed] || colorForFreesbeeTag(trimmed),
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

    // 1) FREESBEE employer - find or create
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
          description: 'FREESBEE - גיוס לחברות רכב. גיוס דרך מנפאואר - 8 מגייסים שונים.',
        },
      })
      employerCreated = true
    }

    const results: any[] = []

    // 2) ליצור כל משרה
    for (const p of POSITIONS) {
      const description = buildPublicDescription(p)

      // 2a) Gemini analysis
      let geminiTags: string[] = []
      let gem: any = null
      let geminiOk = false
      try {
        gem = await analyzeJobDescriptionWithGemini(description)
        geminiOk = true
        if (Array.isArray(gem.jobTags)) geminiTags = gem.jobTags
      } catch (err) {
        console.warn(`[FREESBEE/${p.title}] Gemini failed:`, (err as Error).message)
      }

      // 2b) merge tags - 40+ תגיות לכל משרה
      const tagNames = buildFreesbeeTags({
        role: 'SALES',
        brand: p.brand,
        city: p.city,
        geminiTags,
        isUrgent: p.isUrgent,
        isDiscreet: p.isDiscreet,
        extraTags: p.extraTags,
      })

      const tagMap: Record<string, any> = {}
      for (const name of tagNames) {
        const t = await ensureTag(name)
        if (t) tagMap[name] = t
      }

      // 2c) aiProfile
      const aiProfile = {
        role: gem?.role || 'נציג/ת מכירות רכבים',
        industry: 'רכב ותחבורה',
        brand: p.brand,
        seniority: gem?.seniority || 'MID',
        requiredSkills: gem?.requiredSkills || [
          'מכירות', 'משא ומתן', 'שירות לקוחות', 'כושר שכנוע', 'עמידה ביעדים',
        ],
        requiredExperience: gem?.requiredExperience ?? 1,
        industries: gem?.industries || ['רכב', 'מכירות'],
        keyRequirements: gem?.keyRequirements || [
          'ניסיון במכירות',
          'נכונות לעבודה בימי שישי',
          'כושר שכנוע',
        ],
        keywords: tagNames,
        location: p.city,
        employer: 'FREESBEE',
        urgent: !!p.isUrgent,
        discreet: !!p.isDiscreet,
        // 🔒 פרטים פנימיים בלבד - לא לפרסום
        _internal: {
          salary: {
            baseGross: 7500,
            baseLabel: '7,500 ש"ח ברוטו גלובלי',
            guarantee: p.guaranteeText,
            averageTotal: COMMON_AVERAGE,
            extraBenefits: p.extraBenefits || null,
          },
          workHours: COMMON_WORK_HOURS,
          publishSalary: false,
          publishHours: false,
          recruiterEmail: RECRUITER_EMAIL,
          recruiterName: RECRUITER_NAME,
          recruiterAgency: 'ManpowerGroup',
        },
      }

      // 2d) create/update position
      const existing = await prisma.position.findFirst({
        where: { title: p.title, employerId: employer.id },
      })

      const data = {
        title: p.title,
        location: p.city,
        description,
        requirements: COMMON_REQUIREMENTS,
        salaryRange: 'לא לפרסום',
        workHours: 'לא לפרסום',
        employmentType: 'משרה מלאה',
        keywords: JSON.stringify(tagNames.slice(0, 60)),
        aiProfile: JSON.stringify(aiProfile),
        contactEmail: RECRUITER_EMAIL,
        contactName: RECRUITER_NAME,
        priority: p.isUrgent ? 10 : 0,
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
  } catch (error) {
    console.error('[FREESBEE/Odelle] Error:', error)
    return NextResponse.json(
      { error: 'Failed to add FREESBEE/Odelle positions', details: String(error) },
      { status: 500 },
    )
  }
}
