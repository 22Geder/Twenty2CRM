import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"
import { buildFreesbeeTags, colorForFreesbeeTag } from "@/lib/freesbee-tags"

/**
 * הוספת משרות XPENG (מותג חשמלי) ל-FREESBEE
 * מגייסת: Shahd O. (ManpowerGroup)
 *
 *   GET /api/positions/add-freesbee-shahd?key=twenty2freesbee2026
 *
 * משרות:
 *  • מומחה/ית עסקה XPENG - שורק ראשון לציון
 *  • מומחה/ית עסקה XPENG - הרצליה
 *  • מומחה/ית מוצר XPENG - הרצליה (פחות ניסיון במכירות, אוריינטציה לעולם הרכב)
 *
 * • description ציבורי - בלי שכר/שעות (לפי בקשת הלקוח)
 * • Gemini מייצר תגיות + פרופיל AI
 * • שכר/שעות + הערה על הסוציאלי - ב-aiProfile._internal בלבד
 */

const RECRUITER_EMAIL = 'ShahdO@manpowergroup.co.il'
const RECRUITER_NAME = 'Shahd O. (ManpowerGroup)'

const COMMON_REQUIREMENTS_SALES = `• ניסיון במכירות - חובה
• כושר שכנוע, גמישות ופתיחות מחשבתית
• נכונות לעבודה במשרה מלאה כולל ימי שישי`

const COMMON_REQUIREMENTS_PRODUCT = `• אוריינטציה ועניין בעולם הרכב - חשוב
• שירותיות ויחסי אנוש מצוינים
• כושר שכנוע, גמישות ופתיחות מחשבתית
• נכונות לעבודה במשרה מלאה כולל ימי שישי
• ניסיון במכירות - יתרון (לא חובה)`

const COMMON_WORK_HOURS = "א'-ה' 08:30-18:00, שישי 08:30-13:00 (שישי קבוע, חצי יום חופש באמצ\"ש)"
const COMMON_AVERAGE = '15,000-16,000 ₪ ברוטו (כולל פרמיות)'

const TAG_COLORS: Record<string, string> = {
  'מכירות': '#3B82F6',
  'רכב': '#10B981',
  'רכב חשמלי': '#22C55E',
  'XPENG': '#0EA5E9',
  'אקספנג': '#0EA5E9',
  'אולם תצוגה': '#8B5CF6',
  'הרצליה': '#06B6D4',
  'ראשון לציון': '#0891B2',
  'שורק': '#0369A1',
  'משרה מלאה': '#22C55E',
  'שירות לקוחות': '#EC4899',
  'משא ומתן': '#F59E0B',
  'מומחה עסקה': '#7C3AED',
  'מומחה מוצר': '#A855F7',
  'FREESBEE': '#EF4444',
}

const FALLBACK_TAGS_SALES = [
  'מכירות', 'נציג מכירות', 'איש מכירות', 'אשת מכירות',
  'מומחה עסקה', 'מכירת רכבים', 'רכב', 'רכב חשמלי',
  'אולם תצוגה', 'משרה מלאה', 'שירות לקוחות', 'משא ומתן',
  'כושר שכנוע', 'עמידה ביעדים', 'Up sale',
]

const FALLBACK_TAGS_PRODUCT = [
  'מומחה מוצר', 'יועץ רכב', 'רכב', 'רכב חשמלי', 'XPENG',
  'אולם תצוגה', 'שירות לקוחות', 'יחסי אנוש', 'משרה מלאה',
  'אוריינטציה לרכב', 'הסבר טכני',
]

type PositionDef = {
  title: string
  city: string
  variant: 'SALES' | 'PRODUCT'
  extraTags?: string[]
}

const POSITIONS: PositionDef[] = [
  {
    title: 'מומחה/ית עסקה XPENG - שורק ראשון לציון (רכב חשמלי)',
    city: 'ראשון לציון',
    variant: 'SALES',
    extraTags: ['שורק', 'מומחה עסקה'],
  },
  {
    title: 'מומחה/ית עסקה XPENG - הרצליה (רכב חשמלי)',
    city: 'הרצליה',
    variant: 'SALES',
    extraTags: ['מומחה עסקה'],
  },
  {
    title: 'מומחה/ית מוצר XPENG - הרצליה (רכב חשמלי)',
    city: 'הרצליה',
    variant: 'PRODUCT',
    extraTags: ['מומחה מוצר', 'יועץ רכב'],
  },
]

function buildPublicDescription(p: PositionDef): string {
  if (p.variant === 'PRODUCT') {
    return `📍 ${p.title}

🏢 חברת FREESBEE מחפשת מומחה/ית מוצר ל-XPENG (מותג רכב חשמלי) באולם התצוגה ב${p.city}.
⚡ תפקיד מצוין למי שאוהב/ת את עולם הרכב — ניסיון מכירות הוא יתרון אך לא חובה!

🎯 התפקיד כולל:
• הצגת מוצרי המותג ללקוחות באולם התצוגה
• מתן ייעוץ והסבר על תכונות הרכב, טכנולוגיה ושימוש
• מתן חוויית לקוח שירותית, מגוונת ובהירה
• עבודה בצוות לקידום המכירות באולם

📋 דרישות התפקיד:
• אוריינטציה ועניין בעולם הרכב - חשוב
• שירותיות ויחסי אנוש מצוינים
• כושר שכנוע, גמישות ופתיחות מחשבתית
• נכונות לעבודה במשרה מלאה כולל ימי שישי
• ניסיון במכירות - יתרון (לא חובה)

⏰ ימי עבודה: א'-ה' + ימי שישי קבוע (יש חצי יום חופש באמצ"ש)

💼 למעוניינים: נא לציין צפי שכר במייל החזרה.`
  }

  // SALES (מומחה/ית עסקה)
  return `📍 ${p.title}

🏢 חברת FREESBEE מחפשת מומחה/ית עסקה ל-XPENG (מותג רכב חשמלי) באולם התצוגה ב${p.city}.

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

    // 1) FREESBEE employer
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
      const requirements = p.variant === 'PRODUCT' ? COMMON_REQUIREMENTS_PRODUCT : COMMON_REQUIREMENTS_SALES

      // 2a) Gemini
      let geminiTags: string[] = []
      let gem: any = null
      let geminiOk = false
      try {
        gem = await analyzeJobDescriptionWithGemini(description)
        geminiOk = true
        if (Array.isArray(gem.jobTags)) geminiTags = gem.jobTags
      } catch (err) {
        console.warn(`[FREESBEE/Shahd/${p.title}] Gemini failed:`, (err as Error).message)
      }

      // 2b) merge tags - 40+ תגיות לכל משרה
      const tagNames = buildFreesbeeTags({
        role: p.variant,
        brand: 'XPENG',
        city: p.city,
        geminiTags,
        extraTags: p.extraTags,
      })

      const tagMap: Record<string, any> = {}
      for (const name of tagNames) {
        const t = await ensureTag(name)
        if (t) tagMap[name] = t
      }

      // 2c) aiProfile
      const aiProfile = {
        role: gem?.role || (p.variant === 'PRODUCT' ? 'מומחה/ית מוצר רכב' : 'מומחה/ית עסקה - מכירות רכבים'),
        industry: 'רכב חשמלי / EV',
        brand: 'XPENG',
        seniority: p.variant === 'PRODUCT' ? 'JUNIOR' : (gem?.seniority || 'MID'),
        requiredSkills: gem?.requiredSkills || (
          p.variant === 'PRODUCT'
            ? ['שירות לקוחות', 'יחסי אנוש', 'אוריינטציה לרכב', 'הסבר טכני', 'יכולת לימוד']
            : ['מכירות', 'משא ומתן', 'שירות לקוחות', 'כושר שכנוע', 'עמידה ביעדים']
        ),
        requiredExperience: p.variant === 'PRODUCT' ? 0 : (gem?.requiredExperience ?? 1),
        industries: gem?.industries || ['רכב', 'רכב חשמלי', 'מכירות'],
        keyRequirements: gem?.keyRequirements || (
          p.variant === 'PRODUCT'
            ? ['אוריינטציה לרכב', 'שירותיות', 'נכונות לימי שישי']
            : ['ניסיון במכירות', 'נכונות לעבודה בימי שישי', 'כושר שכנוע']
        ),
        keywords: tagNames,
        location: p.city,
        employer: 'FREESBEE',
        productType: p.variant, // SALES / PRODUCT
        // 🔒 פרטים פנימיים בלבד - לא לפרסום
        _internal: {
          salary: {
            baseGross: 7500,
            baseLabel: '7,500 ש"ח ברוטו גלובלי',
            baseBreakdown: 'בסיס 6,500 + 1,000 שנ"ג',
            socialNote: 'יש לוודא מול המגייסת אם השנ"ג נכלל לסוציאלי במותג זה (במייל המקור היה ציון מעורפל)',
            guarantee: '2,500 ש"ח הגנת שכר ל-3 חודשים (תקף לצ\'רי + XPENG בלבד)',
            travel: 'נסיעות לפי תחבורה ציבורית',
            averageTotal: COMMON_AVERAGE,
          },
          workHours: COMMON_WORK_HOURS,
          publishSalary: false,
          publishHours: false,
          recruiterEmail: RECRUITER_EMAIL,
          recruiterName: RECRUITER_NAME,
          recruiterAgency: 'ManpowerGroup',
        },
      }

      // 2d) create/update
      const existing = await prisma.position.findFirst({
        where: { title: p.title, employerId: employer.id },
      })

      const data = {
        title: p.title,
        location: p.city,
        description,
        requirements,
        salaryRange: 'לא לפרסום',
        workHours: 'לא לפרסום',
        employmentType: 'משרה מלאה',
        keywords: JSON.stringify(tagNames.slice(0, 60)),
        aiProfile: JSON.stringify(aiProfile),
        contactEmail: RECRUITER_EMAIL,
        contactName: RECRUITER_NAME,
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
    console.error('[FREESBEE/Shahd] Error:', error)
    return NextResponse.json(
      { error: 'Failed to add FREESBEE/Shahd positions', details: String(error) },
      { status: 500 },
    )
  }
}
