import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * עדכון/הוספת משרות סלע לוגיסטיקה - מאי 2026
 *
 *   GET /api/positions/add-sela-may2026?key=twenty2sela2026
 *
 * רשימת המשרות מבוססת על העדכון מ-Pninit Roitman + Dana Shapiro.
 * upsert לפי (title, employerId) - לא מוחק משרות קיימות אחרות.
 */

const VALID_KEYS = ['twenty2sela2026', 'twenty2sela', 'sela2026']

const RECRUITER_PNINIT = {
  name: 'Pninit Roitman',
  email: 'pninit@selabonded.co.il',
}
const RECRUITER_DANA = {
  name: 'Dana Shapiro',
  email: 'dana@selabonded.co.il',
}

// ---- תגיות בסיס משותפות לוגיסטיקה ----
const BASE_TAGS = [
  'סלע לוגיסטיקה', 'לוגיסטיקה', 'logistics', 'מחסן', 'מחסנים', 'warehouse',
  'מרלוג', 'מרכז לוגיסטי', 'שרשרת אספקה', 'supply chain',
  'הפצה', 'distribution', 'הובלה', 'משלוחים', 'שינוע', 'תובלה',
  'סחורה', 'מלאי', 'inventory', 'אחסון', 'אחסנה', 'קליטת סחורה',
  'הזמנות', 'תעודות משלוח',
  'משטח', 'משטחים', 'pallet', 'רמפה', 'רמפות', 'dock',
  'מסופון', 'סורק', 'ברקוד', 'barcode', 'WMS',
  'משמרות', 'משמרת', 'שכר שעתי', 'עבודה פיזית', 'כושר גופני',
  'אחריות', 'סדר וארגון', 'עבודת צוות', 'דיוק', 'בטיחות',
  'אזור תעשייה', 'industrial',
]

// ---- הגדרת המשרות ----
type PositionDef = {
  title: string
  location: string
  workHours: string
  salaryRange: string
  description: string
  requirements: string
  benefits: string
  transportation: string
  contactName: string
  contactEmail: string
  priority: number
  extraTags: string[]
}

const POSITIONS: PositionDef[] = [
  // --- בני דרום ---
  {
    title: 'מחסנאי/ת - בני דרום',
    location: 'בני דרום',
    workHours: '08:00-17:00',
    salaryRange: '40 ₪/שעה',
    description: 'עבודות מחסן כלליות - שרינקים, סידור סחורה, עבודה עם ג׳ק חשמלי',
    requirements: 'רישיון נהיגה - חובה',
    benefits: 'ארוחות חמות, הסעה מאשדוד ואשקלון',
    transportation: 'הסעה מאשדוד ואשקלון',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 1,
    extraTags: ['מחסנאי', 'מחסנאית', 'עובד מחסן', 'ג׳ק חשמלי', 'ג׳ק', 'שרינקים',
      'סידור סחורה', 'רישיון נהיגה', 'בני דרום', 'אשדוד', 'אשקלון', 'דרום',
      'הסעה', 'הסעות', 'ארוחות חמות'],
  },
  {
    title: 'מלגזן היגש - בני דרום',
    location: 'בני דרום',
    workHours: '08:00-17:00',
    salaryRange: '47 ₪/שעה',
    description: 'עבודה על הגש וליקוטים',
    requirements: 'רישיון מלגזה, ניסיון על הגש ורצון לעבוד',
    benefits: 'ארוחות חמות, הסעה מאשדוד ואשקלון',
    transportation: 'הסעה מאשדוד ואשקלון',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 2,
    extraTags: ['מלגזן', 'מלגזנים', 'מלגזה', 'reach truck', 'forklift',
      'מלגזת היגש', 'היגש', 'reach', 'רישיון מלגזה',
      'ליקוט', 'מלקט', 'picking', 'בני דרום', 'אשדוד', 'אשקלון', 'דרום',
      'הסעה', 'ארוחות חמות'],
  },

  // --- אשדוד המדע 2 ---
  {
    title: 'מלקט/ת - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '08:00-17:00',
    salaryRange: '38 ₪/שעה',
    description: 'ליקוט סחורה והכנת הזמנות, עבודה עם מסופון',
    requirements: 'נכונות למשרה מלאה, ראש גדול, ניסיון בליקוט - יתרון',
    benefits: 'ארוחות, הסעה מאשקלון',
    transportation: 'הסעה מאשקלון',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 1,
    extraTags: ['מלקט', 'מלקטת', 'ליקוט', 'picking', 'picker', 'order picking',
      'מסופון', 'סורק', 'הזמנות', 'אשדוד', 'המדע 2', 'אשקלון',
      'משרה מלאה', 'ראש גדול', 'הסעה', 'ארוחות'],
  },
  {
    title: 'מלגזן היגש יום - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '08:00-17:00',
    salaryRange: '47 ₪/שעה',
    description: 'ניסיון על מלגזת היגש / נכונות ללמוד עבודה על מלגזת היגש. נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן',
    requirements: 'רישיון למלגזה - חובה',
    benefits: 'הגעה עצמית, ארוחות',
    transportation: 'עצמאית',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 2,
    extraTags: ['מלגזן', 'מלגזה', 'מלגזת היגש', 'היגש', 'reach truck', 'forklift',
      'רישיון מלגזה', 'משמרת בוקר', 'יום',
      'אשדוד', 'המדע 2', 'מחסן', 'משימות מחסן', 'ארוחות'],
  },
  {
    title: 'מלגזן מחסנאי לילה - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '18:00-03:00',
    salaryRange: '48 ₪/שעה',
    description: 'עבודה על מלגזה + ליקוט',
    requirements: 'רישיון על מלגזה - חובה. ניסיון על מלגזת היגש - יתרון. נכונות לעבוד עם מסופון וללקט',
    benefits: 'תוספת לילה, ארוחות',
    transportation: 'עצמאית',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 2,
    extraTags: ['מלגזן', 'מלגזה', 'מלגזת היגש', 'היגש', 'reach truck',
      'מחסנאי', 'מלקט', 'ליקוט', 'picking', 'מסופון',
      'משמרת לילה', 'לילה', 'תוספת לילה',
      'רישיון מלגזה', 'אשדוד', 'המדע 2'],
  },
  {
    title: 'מחסנאי/ת יום - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '08:00-17:00',
    salaryRange: '40 ₪/שעה',
    description: 'עבודות מחסן כלליות - הזזת קרטונים, שרינקים ועוד',
    requirements: 'נכונות לעבודה פיזית',
    benefits: 'ארוחות חמות',
    transportation: 'עצמאית',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 1,
    extraTags: ['מחסנאי', 'מחסנאית', 'עובד מחסן', 'warehouse',
      'הזזת קרטונים', 'קרטונים', 'שרינקים', 'עבודה פיזית',
      'משמרת בוקר', 'יום', 'אשדוד', 'המדע 2', 'ארוחות חמות'],
  },
  {
    title: 'מחסנאי/ת ערב - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '16:30-01:30',
    salaryRange: '42 ₪/שעה',
    description: 'עבודות מחסן כלליות - הזזת קרטונים, שרינקים ועוד',
    requirements: 'נכונות לעבודה פיזית',
    benefits: 'הסעה בחזור לאשדוד',
    transportation: 'הסעה בחזור לאשדוד',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 1,
    extraTags: ['מחסנאי', 'מחסנאית', 'עובד מחסן', 'warehouse',
      'הזזת קרטונים', 'קרטונים', 'שרינקים', 'עבודה פיזית',
      'משמרת ערב', 'ערב', 'אשדוד', 'המדע 2', 'הסעה'],
  },

  // --- בית שמש - אזור תעשייה ברוש ---
  {
    title: 'רפרנט/ית שטח - בית שמש (ברוש)',
    location: 'בית שמש - אזור תעשייה ברוש',
    workHours: '06:00-15:00',
    salaryRange: '50 ₪/שעה',
    description: 'תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות',
    requirements: 'ניסיון בתפעול מערך הפצה - חובה. יכולת רתימת עובדים, יכולת התנהלות עם חשבוניות ומסמכים מרובים, סדר וארגון, אסרטיביות - חובה. ניידות - חובה',
    benefits: 'בית שמש',
    transportation: 'עצמאית',
    contactName: RECRUITER_DANA.name,
    contactEmail: RECRUITER_DANA.email,
    priority: 2,
    extraTags: ['רפרנט', 'רפרנטית', 'רפרנט שטח', 'שטח', 'תפעול',
      'ניהול נהגים', 'נהגים', 'הפצה', 'מערך הפצה',
      'תעודות', 'חשבוניות', 'נזקים', 'אי אספקות',
      'אסרטיביות', 'ניידות', 'רישיון נהיגה',
      'בית שמש', 'הר טוב', 'ברוש', 'משמרת בוקר'],
  },
  {
    title: 'סדרן הפצה - בית שמש (ברוש)',
    location: 'בית שמש - אזור תעשייה ברוש',
    workHours: '06:00-16:00',
    salaryRange: '13,000 ₪/חודש',
    description: 'ניהול קבלנים, הכנת קווי הפצה, מעקב הובלות ועמידה בזמנים, טיפול בהעמסה והחזרות, הנפקת דוחות, מענה שוטף לפניות הנהגים',
    requirements: 'ניסיון מוכח בתכנון קווי הפצה רבים - חובה. חשיבה לוגית ופתרון בעיות, תפקוד מעולה תחת לחץ, ניידות - חובה',
    benefits: 'הגעה עצמית, ארוחות. תקן אחד בבית שמש',
    transportation: 'עצמאית',
    contactName: RECRUITER_DANA.name,
    contactEmail: RECRUITER_DANA.email,
    priority: 3,
    extraTags: ['סדרן', 'סדרן הפצה', 'תכנון קווי הפצה', 'route planning',
      'קבלנים', 'הובלות', 'משאיות', 'נהגים',
      'דוחות', 'הנפקת דוחות', 'פתרון בעיות', 'עבודה תחת לחץ',
      'ניידות', 'בית שמש', 'הר טוב', 'ברוש',
      'שכר חודשי', 'משרה מלאה'],
  },
  {
    title: 'מלגזן בוקר/ערב - בית שמש (ברוש)',
    location: 'בית שמש - אזור תעשייה ברוש',
    workHours: '06:00-17:00 / 12:00-21:00',
    salaryRange: '55 ₪/שעה',
    description: 'מלגזן מחסנאי, שינוע מוצרי חשמל. יש אופציה לעבוד את משמרת הבוקר או הערב, המשמרת קבועה (רק בוקר או רק ערב)',
    requirements: 'ניסיון - חובה. רישיון למלגזה - חובה',
    benefits: 'ארוחות חמות',
    transportation: 'עצמאית',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 2,
    extraTags: ['מלגזן', 'מלגזה', 'מחסנאי', 'forklift',
      'רישיון מלגזה', 'מוצרי חשמל', 'שינוע',
      'משמרת בוקר', 'משמרת ערב', 'משמרת קבועה',
      'בית שמש', 'הר טוב', 'ברוש', 'ארוחות חמות'],
  },

  // --- מטה סלע ---
  {
    title: 'עובד אחזקה - מטה סלע',
    location: 'מטה סלע משרדים - עבודה בכלל מתקני החברה',
    workHours: '08:00-17:00',
    salaryRange: '50 ₪/שעה',
    description: 'עבודת תחזוקה ושיפוצים - עובד כללי, חרוץ, רציני. פירוק ובנייה במשרדים',
    requirements: 'עבודה פיזית. מועמד חרוץ ורציני עם נכונות לעבוד בידיים',
    benefits: 'ארוחות',
    transportation: 'עצמאית',
    contactName: RECRUITER_PNINIT.name,
    contactEmail: RECRUITER_PNINIT.email,
    priority: 1,
    extraTags: ['אחזקה', 'תחזוקה', 'maintenance', 'שיפוצים',
      'עובד כללי', 'עובד אחזקה', 'פירוק ובנייה', 'בנייה',
      'עבודה פיזית', 'עבודה בידיים',
      'משרדים', 'מטה', 'ארוחות', 'משרה מלאה'],
  },
]

async function ensureTag(name: string) {
  const trimmed = (name || '').trim()
  if (!trimmed) return null
  let tag = await prisma.tag.findFirst({ where: { name: trimmed } })
  if (!tag) {
    tag = await prisma.tag.create({
      data: { name: trimmed, color: '#64748B', category: 'position' },
    })
  }
  return tag
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const key = body?.key ?? ''
    if (!key || !VALID_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ----- מציאת/יצירת מעסיק סלע -----
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'סלע' } },
          { email: { contains: 'sela' } },
        ],
      },
    })
    let employerCreated = false
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'סלע לוגיסטיקה',
          email: 'sela@selabonded.co.il',
          phone: '',
          description: 'סלע לוגיסטיקה - שירותי מרלו"ג והפצה',
        },
      })
      employerCreated = true
    }

    const results: Array<{
      title: string
      positionId: string
      created: boolean
      tagsCount: number
      tagsAtLeast40: boolean
    }> = []

    for (const pos of POSITIONS) {
      // בניית רשימת תגיות (≥40)
      const tagSet = new Set<string>(BASE_TAGS)
      for (const t of pos.extraTags) tagSet.add(t)
      tagSet.add(pos.location)
      const tagNames = Array.from(tagSet)
        .map(t => (t || '').trim())
        .filter(t => t.length >= 2 && t.length <= 40)
        .slice(0, 60)

      const tagRecords: { id: string }[] = []
      for (const name of tagNames) {
        const t = await ensureTag(name)
        if (t) tagRecords.push({ id: t.id })
      }

      const aiProfile = {
        role: pos.title,
        industry: 'לוגיסטיקה / מחסנים',
        seniority: 'JUNIOR',
        keywords: tagNames,
        location: pos.location,
        employer: 'סלע לוגיסטיקה',
        recruiter: { name: pos.contactName, email: pos.contactEmail },
      }

      const data = {
        title: pos.title,
        location: pos.location,
        description: pos.description,
        requirements: pos.requirements,
        salaryRange: pos.salaryRange,
        workHours: pos.workHours,
        employmentType: 'משרה מלאה',
        keywords: JSON.stringify(tagNames),
        aiProfile: JSON.stringify(aiProfile),
        benefits: pos.benefits,
        transportation: pos.transportation,
        contactEmail: pos.contactEmail,
        contactName: pos.contactName,
        priority: pos.priority,
        employerId: employer.id,
        active: true,
      }

      const existing = await prisma.position.findFirst({
        where: { title: pos.title, employerId: employer.id },
      })

      let position
      let created = false
      if (existing) {
        position = await prisma.position.update({
          where: { id: existing.id },
          data: {
            ...data,
            tags: { set: [], connect: tagRecords },
          },
          include: { tags: true },
        })
      } else {
        position = await prisma.position.create({
          data: {
            ...data,
            tags: { connect: tagRecords },
          },
          include: { tags: true },
        })
        created = true
      }

      results.push({
        title: pos.title,
        positionId: position.id,
        created,
        tagsCount: position.tags.length,
        tagsAtLeast40: position.tags.length >= 40,
      })
    }

    return NextResponse.json({
      success: true,
      employer: { id: employer.id, name: employer.name, created: employerCreated },
      totalPositions: results.length,
      positionsCreated: results.filter(r => r.created).length,
      positionsUpdated: results.filter(r => !r.created).length,
      results,
    })
  } catch (error: any) {
    console.error('[sela-may2026] Error:', error)
    return NextResponse.json(
      { error: 'Failed', message: error?.message, stack: error?.stack?.split('\n').slice(0, 5) },
      { status: 500 },
    )
  }
}
