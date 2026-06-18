import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * הוספת משרת נציג/ת מכירות טלפוניות לטחנת האבן קואופ בע"מ
 *   GET /api/positions/add-stone-mill-sales?key=twenty2stonemill2026
 *
 * • מיקום: רחובות
 * • שכר: בסיס 8,000 + עמלות עד 7,000
 * • ימי עבודה: א'-ה' 8:00-17:00
 */

const EMPLOYER_NAME = 'טחנת האבן קואופ בע"מ'
const POSITION_TITLE = 'נציג/ת מכירות טלפוניות'
const LOCATION = 'רחובות'

const TAG_COLORS: Record<string, string> = {
  'טחנת האבן': '#1F2937',
  'Stone Mill': '#1F2937',
  'מכירות טלפוניות': '#EF4444',
  'נציג מכירות': '#EF4444',
  'נציגת מכירות': '#EF4444',
  'טלמרקטינג': '#DC2626',
  'שיחות יוצאות': '#B91C1C',
  'שיחות נכנסות': '#B91C1C',
  'שירות לקוחות': '#3B82F6',
  'ניהול לקוחות': '#2563EB',
  'שימור לקוחות': '#1D4ED8',
  'קמעונאות מזון': '#22C55E',
  'תעשיית מזון': '#16A34A',
  'ספקי מזון': '#15803D',
  'מוצרי מזון': '#14532D',
  'מכירות פרונטליות': '#F97316',
  'כושר שכנוע': '#EA580C',
  'יכולת וורבלית': '#C2410C',
  'משא ומתן': '#9A3412',
  'יחסי אנוש': '#8B5CF6',
  'עבודה תחת לחץ': '#7C3AED',
  'סביבה דינמית': '#6D28D9',
  'רחובות': '#06B6D4',
  'מרכז': '#0891B2',
  'מישור החוף': '#0284C7',
  'משרה מלאה': '#10B981',
  "א'-ה'": '#059669',
  'בסיס + עמלות': '#F59E0B',
  'עמלות מכירה': '#D97706',
  'פנסיה מהיום הראשון': '#EC4899',
  'קליטה כעובד חברה': '#DB2777',
  '18 ימי חופש': '#BE185D',
  'סעיף 14': '#9D174D',
}

const BASE_TAGS = [
  // מעסיק
  'טחנת האבן', 'Stone Mill', 'טחנת האבן קואופ',
  // תפקיד עיקרי
  'מכירות טלפוניות', 'נציג מכירות', 'נציגת מכירות',
  'טלמרקטינג', 'מכירות טלפון', 'מכירות פנים',
  // סוגי שיחות
  'שיחות יוצאות', 'שיחות נכנסות', 'מענה טלפוני',
  // ניהול לקוחות
  'שירות לקוחות', 'ניהול לקוחות', 'שימור לקוחות',
  'ניהול תיקי לקוחות', 'מכירות ללקוחות קיימים',
  // תחום
  'קמעונאות מזון', 'תעשיית מזון', 'ספקי מזון', 'מוצרי מזון',
  // כישורים
  'מכירות פרונטליות', 'כושר שכנוע', 'יכולת וורבלית', 'משא ומתן',
  'יחסי אנוש', 'יחסי אנוש טובים', 'עבודה תחת לחץ', 'סביבה דינמית',
  'שירותיות', 'סבלנות', 'גמישות',
  // מיקום
  'רחובות', 'מרכז', 'מישור החוף', 'שפלה',
  // תנאי משרה
  'משרה מלאה', "א'-ה'", '8:00-17:00',
  // שכר והטבות
  'בסיס + עמלות', 'עמלות מכירה',
  'פנסיה מהיום הראשון', 'קליטה כעובד חברה', '18 ימי חופש', 'סעיף 14',
  // תיאור נוסף
  'תגבור סוכנים', 'גיבוי סוכנים', 'זיהוי צרכי לקוח',
  'התאמת מוצרים', 'מכירות B2B', 'מכירות לעסקים',
  'אחריות', 'יוזמה', 'מוטיבציה',
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

const PUBLIC_DESCRIPTION = `🏢 טחנת האבן קואופ בע"מ – רחובות
"הבית של אמני המזון"

מחפשים נציג/ת מכירות טלפוניות להצטרף לצוות מכירות מוביל בחברת מזון מובילה.

🎯 תיאור התפקיד:
• ביצוע שיחות טלפון יוצאות/נכנסות ללקוחות הקיימים בחברה, ללא איתור לקוחות פוטנציאלים
• תגבור סוכני מכירות מול לקוחות שלא מספיקים להגיע אליהם
• זיהוי צרכי הלקוח והתאמת המוצרים
• ניהול תיקי לקוחות ושמירה על קשר עם לקוחות קיימים
• מתן מענה לשאלות ובקשות של לקוחות
• גיבוי סוכנים בעת היעדרות

📋 דרישות התפקיד:
• ניסיון במכירות טלפוניות או פרונטליות – יתרון
• ידע בתחום קמעונאות המזון – יתרון
• יחסי אנוש טובים
• יכולת עבודה בסביבה דינמית ותחת לחץ
• יכולת וורבלית וניהול משא ומתן
• נכונות לעבודה מגוונת, מאומצת ומאתגרת

⏰ היקף משרה: משרה מלאה, א'-ה' 8:00-17:00
📍 מיקום: רחובות`

const REQUIREMENTS = `• ניסיון במכירות טלפוניות או פרונטליות – יתרון
• ידע בתחום קמעונאות המזון – יתרון
• יחסי אנוש טובים
• יכולת עבודה בסביבה דינמית ותחת לחץ
• יכולת וורבלית וניהול משא ומתן
• נכונות לעבודה מגוונת, מאומצת ומאתגרת תוך שמירה על סבלנות ושירותיות מקסימליות`

const BENEFITS = `• ימי חופש: 18 (ולא 12 ע"פ חוק)
• פנסיה מהיום הראשון
• קליטה כעובד חברה מהיום הראשון
• סעיף 14`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const validKeys = ['twenty2stonemill2026', 'twenty2stone', 'stonemill2026']
    if (!key || !validKeys.includes(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // מציאה/יצירת מעסיק
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'טחנת האבן', mode: 'insensitive' } },
          { name: { contains: 'Stone Mill', mode: 'insensitive' } },
        ],
      },
    })
    let employerCreated = false
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: EMPLOYER_NAME,
          email: 'info@StoneMillCoop.com',
          phone: '',
          description: 'טחנת האבן קואופ בע"מ - הבית של אמני המזון. אזור התעשייה בני-דרום.',
          website: 'https://www.StoneMillCoop.com',
        },
      })
      employerCreated = true
    }

    // יצירת תגיות
    const tagSet = new Set<string>(BASE_TAGS)
    const tagNames = Array.from(tagSet)
      .map(t => (t || '').trim())
      .filter(t => t.length >= 2 && t.length <= 60)

    const tagMap: Record<string, any> = {}
    for (const name of tagNames) {
      const t = await ensureTag(name)
      if (t) tagMap[name] = t
    }

    // בדיקה אם המשרה קיימת
    const existing = await prisma.position.findFirst({
      where: { title: POSITION_TITLE, employerId: employer.id },
    })

    const data = {
      title: POSITION_TITLE,
      location: LOCATION,
      description: PUBLIC_DESCRIPTION,
      requirements: REQUIREMENTS,
      benefits: BENEFITS,
      salaryRange: 'בסיס 8,000 + עמלות עד 7,000',
      workHours: "א'-ה' 8:00-17:00",
      employmentType: 'משרה מלאה',
      keywords: JSON.stringify(tagNames.slice(0, 60)),
      contactName: 'טחנת האבן קואופ',
      priority: 1,
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

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name,
        created: employerCreated,
      },
      position: {
        id: position.id,
        title: POSITION_TITLE,
        location: LOCATION,
        created,
        tagsCount: position.tags.length,
        tagsAtLeast40: position.tags.length >= 40,
        tags: position.tags.map((t: any) => t.name),
        salary: data.salaryRange,
        workHours: data.workHours,
        link: `/dashboard/positions/${position.id}`,
      },
    })
  } catch (error: any) {
    console.error('[StoneMill] Error:', error)
    return NextResponse.json(
      { error: 'Failed', message: error?.message },
      { status: 500 },
    )
  }
}
