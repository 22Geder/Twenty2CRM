import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"
import { buildFreesbeeTags, colorForFreesbeeTag } from "@/lib/freesbee-tags"

/**
 * הוספת לקוח FREESBEE + משרת נציג/ת מכירות רנו - נתניה
 *
 * שימוש (מהדפדפן או curl):
 *   GET /api/positions/add-freesbee-renault-netanya?key=twenty2freesbee2026
 *
 * • תיאור המשרה אינו כולל שכר/שעות מפורטים (לפי בקשת הלקוח)
 * • Gemini מחלץ תגיות + פרופיל AI אוטומטית
 * • פרטי שכר/שעות נשמרים פנימית ב-aiProfile._internal בלבד
 */

const PUBLIC_DESCRIPTION = `📍 נציג/ת מכירות רנו - נתניה

🏢 חברת FREESBEE מחפשת נציג/ת מכירות לאולם תצוגה רנו בנתניה.

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

const REQUIREMENTS = `• ניסיון במכירות - חובה
• כושר שכנוע, גמישות ופתיחות מחשבתית
• נכונות לעבודה במשרה מלאה כולל ימי שישי`

// 🔒 פרטי שכר ושעות פנימיים - לא לפרסום!
const INTERNAL_SALARY = {
  baseGross: 7500,
  baseBreakdown: 'בסיס 6,500 + 1,000 שנ"ג',
  notes: 'השנ"ג לא לסוציאלי',
  guarantee: '2,500 ש"ח הגנת שכר חודשיים ראשונים',
  travel: '236 ש"ח נסיעות',
  averageTotal: '15,000-16,000 ₪ ברוטו (כולל פרמיות)',
}

const INTERNAL_WORK_HOURS = "א'-ה' 08:30-18:00, שישי 08:30-13:00 (שישי קבוע, חצי יום חופש באמצ\"ש)"

// תגיות ברירת מחדל אם Gemini לא זמין
const FALLBACK_TAGS = [
  'מכירות', 'נציג מכירות', 'איש מכירות', 'אשת מכירות',
  'מכירת רכבים', 'רכב', 'רנו', 'אולם תצוגה',
  'נתניה', 'משרה מלאה', 'שישי',
  'שירות לקוחות', 'משא ומתן', 'כושר שכנוע',
  'עמידה ביעדים', 'Up sale', 'חוויית לקוח',
]

const TAG_COLORS: Record<string, string> = {
  'מכירות': '#3B82F6',
  'רכב': '#10B981',
  'רנו': '#FCC200',
  'אולם תצוגה': '#8B5CF6',
  'נתניה': '#06B6D4',
  'משרה מלאה': '#22C55E',
  'שירות לקוחות': '#EC4899',
  'משא ומתן': '#F59E0B',
  'עמלות': '#EAB308',
  'FREESBEE': '#EF4444',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key !== 'twenty2freesbee2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) חיפוש/יצירת מעסיק FREESBEE
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
          // המייל של מנפאואר משמש כמייל ברירת מחדל ליצירת קשר עם המעסיק
          email: 'EdenB@manpowergroup.co.il',
          phone: '',
          description: 'FREESBEE - גיוס לחברות רכב (כולל רנו). גיוס דרך מנפאואר - 8 מגייסים שונים.',
        },
      })
      employerCreated = true
    }

    // 2) ניתוח Gemini
    let geminiTags: string[] = []
    let geminiResult: any = null
    let geminiOk = false
    try {
      geminiResult = await analyzeJobDescriptionWithGemini(PUBLIC_DESCRIPTION)
      geminiOk = true
      if (Array.isArray(geminiResult.jobTags)) geminiTags = geminiResult.jobTags
    } catch (err) {
      console.warn('[FREESBEE] Gemini failed, using fallback tags:', err)
    }

    // איחוד תגיות עשיר (40+ תגיות מובטחות)
    const tagNames = buildFreesbeeTags({
      role: 'SALES',
      brand: 'רנו',
      city: 'נתניה',
      geminiTags,
    })

    // 3) יצירת/חיבור תגיות
    const tagMap: Record<string, any> = {}
    for (const name of tagNames) {
      let tag = await prisma.tag.findFirst({ where: { name } })
      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name,
            color: TAG_COLORS[name] || colorForFreesbeeTag(name),
            category: 'position',
          },
        })
      }
      tagMap[name] = tag
    }

    // 4) בניית aiProfile
    const aiProfile = {
      role: geminiResult?.role || 'נציג/ת מכירות רכבים',
      industry: 'רכב ותחבורה',
      brand: 'רנו',
      seniority: geminiResult?.seniority || 'MID',
      requiredSkills: geminiResult?.requiredSkills || [
        'מכירות', 'משא ומתן', 'שירות לקוחות', 'כושר שכנוע', 'עמידה ביעדים',
      ],
      requiredExperience: geminiResult?.requiredExperience ?? 1,
      industries: geminiResult?.industries || ['רכב', 'מכירות'],
      keyRequirements: geminiResult?.keyRequirements || [
        'ניסיון במכירות',
        'נכונות לעבודה בימי שישי',
        'כושר שכנוע',
      ],
      keywords: tagNames,
      location: 'נתניה',
      employer: 'FREESBEE',
      // 🔒 פרטים פנימיים - לא לפרסום
      _internal: {
        salary: INTERNAL_SALARY,
        workHours: INTERNAL_WORK_HOURS,
        publishSalary: false,
        publishHours: false,
        recruiterEmail: 'EdenB@manpowergroup.co.il',
        recruiterAgency: 'ManpowerGroup',
      },
    }

    // 5) יצירה/עדכון של המשרה
    const POSITION_TITLE = 'נציג/ת מכירות רנו - נתניה'

    const existing = await prisma.position.findFirst({
      where: { title: POSITION_TITLE, employerId: employer.id },
    })

    let position
    let positionCreated = false

    const data = {
      title: POSITION_TITLE,
      location: 'נתניה',
      description: PUBLIC_DESCRIPTION,
      requirements: REQUIREMENTS,
      // ⚠️ "לא לפרסום" - לפי בקשת הלקוח
      salaryRange: 'לא לפרסום',
      workHours: 'לא לפרסום',
      employmentType: 'משרה מלאה',
      keywords: JSON.stringify(tagNames.slice(0, 60)),
      aiProfile: JSON.stringify(aiProfile),
      contactEmail: 'EdenB@manpowergroup.co.il',
      contactName: 'Eden B. (ManpowerGroup)',
      employerId: employer.id,
      active: true,
    }

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
        include: { employer: true, tags: true },
      })
    } else {
      position = await prisma.position.create({
        data: {
          ...data,
          tags: {
            connect: Object.values(tagMap).map((t: any) => ({ id: t.id })),
          },
        },
        include: { employer: true, tags: true },
      })
      positionCreated = true
    }

    return NextResponse.json({
      success: true,
      gemini: { ok: geminiOk, tagsFromGemini: geminiTags.length },
      employer: {
        id: employer.id,
        name: employer.name,
        created: employerCreated,
      },
      position: {
        id: position.id,
        title: position.title,
        location: position.location,
        active: position.active,
        created: positionCreated,
        tagsCount: position.tags.length,
      },
      tagsTotal: tagNames.length,
      tagsAtLeast40: tagNames.length >= 40,
    })
  } catch (error) {
    console.error('[FREESBEE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to add FREESBEE position', details: String(error) },
      { status: 500 },
    )
  }
}
