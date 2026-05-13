import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * תיוג אוטומטי של כל משרות קבוצת מאיר.
 * לכל משרה מבטיחים לפחות 35 תגיות.
 *
 *   GET  /api/admin/tag-meir-positions   → preview (לא משנה כלום)
 *   POST /api/admin/tag-meir-positions   → ביצוע בפועל
 *
 * עדכון תגיות בלבד (`tags.set/connect`). לא נוגע ב-title/location/benefits/workHours.
 */

const TAG_COLORS: Record<string, string> = {
  'קבוצת מאיר': '#1E40AF',
  'מאיר': '#1E40AF',
  'יבואן רכב': '#1E40AF',
  'רכב': '#10B981',
  'ענף הרכב': '#10B981',
  'מוסך': '#06B6D4',
  'מרכז שירות': '#06B6D4',
  'משרה מלאה': '#22C55E',
  "א'-ה'": '#0891B2',
  '7:30-16:30': '#0891B2',
  'שישי לסירוגין': '#F59E0B',
  'מענק התמדה': '#EAB308',
  'קליטה ישירה': '#22C55E',
  'ביטוח רפואי': '#22C55E',
  'מכונאי רכב': '#06B6D4',
  'דיאגנוסטיקה': '#0EA5E9',
  'יועץ שירות': '#7C3AED',
  'פחח': '#F97316',
  'מסגר': '#F97316',
  'בוחן': '#0EA5E9',
  'מחסנאי': '#F59E0B',
  'נהג': '#84CC16',
  'מתאמת שירות': '#7C3AED',
  'חיפה': '#0EA5E9',
  'נתניה': '#0EA5E9',
  'חדרה': '#0EA5E9',
  'רמלה': '#0EA5E9',
  'אשדוד': '#0EA5E9',
  'באר שבע': '#0EA5E9',
  'ראשון לציון': '#0EA5E9',
  'רעננה': '#0EA5E9',
  'דרום': '#0EA5E9',
  'צפון': '#0EA5E9',
  'מרכז': '#0EA5E9',
}

// ──────────────────────────────────────────────────────────────
// תגיות בסיס שמשותפות לכל משרה של מאיר (~24 תגיות)
// ──────────────────────────────────────────────────────────────
const COMMON_TAGS = [
  'קבוצת מאיר', 'מאיר', 'יבואן רכב', 'מאיר מוטורס',
  'רכב', 'ענף הרכב', 'תחבורה', 'מכוניות',
  'מוסך', 'מוסך מורשה', 'מרכז שירות', 'תחזוקת רכב',
  'משרה מלאה', "א'-ה'", '7:30-16:30', 'שעות בוקר',
  'שישי לסירוגין', 'שישי בסבב',
  'קליטה ישירה', 'עובד חברה', 'ביטוח רפואי',
  'חדר אוכל', 'ארוחות מסובסדות', 'חניה',
  'אחריות', 'אמינות', 'יחסי אנוש',
]

// ──────────────────────────────────────────────────────────────
// מיפוי עיר → תגיות אזוריות
// ──────────────────────────────────────────────────────────────
const LOCATION_TAGS: Record<string, string[]> = {
  'חיפה': ['חיפה', 'צפון', 'צפון הארץ', 'מפרץ חיפה', 'קריות'],
  'נתניה': ['נתניה', 'השרון', 'מרכז', 'עמק חפר'],
  'חדרה': ['חדרה', 'עמק חפר', 'צפון השרון'],
  'נתניה / חדרה': ['נתניה', 'חדרה', 'עמק חפר', 'השרון', 'מרכז'],
  'רמלה': ['רמלה', 'לוד', 'מרכז', 'השפלה'],
  'אשדוד': ['אשדוד', 'דרום', 'דרום הארץ', 'השפלה הדרומית'],
  'באר שבע': ['באר שבע', 'דרום', 'דרום הארץ', 'הנגב'],
  'ראשון לציון': ['ראשון לציון', 'ראשל"צ', 'מרכז', 'גוש דן'],
  'רעננה': ['רעננה', 'השרון', 'מרכז', 'גוש דן'],
}

function locationTagsFor(loc: string | null | undefined): string[] {
  if (!loc) return []
  if (LOCATION_TAGS[loc]) return LOCATION_TAGS[loc]
  // fallback - הכנס את המחרוזת עצמה כתגית
  return [loc]
}

// ──────────────────────────────────────────────────────────────
// מיפוי תפקיד → תגיות ייעודיות (כל אחת ~15-20 תגיות)
// ──────────────────────────────────────────────────────────────
const ROLE_PROFILES: Array<{
  match: RegExp
  bonus?: boolean
  tags: string[]
}> = [
  // יועץ שירות
  {
    match: /יועץ\s*שירות|יועצת\s*שירות/,
    tags: [
      'יועץ שירות', 'יועצת שירות', 'יועץ/ת שירות',
      'שירות לקוחות', 'תודעת שירות', 'קשרי לקוחות',
      'מענה ללקוחות', 'ליווי לקוח', 'פתרון תקלות',
      'CRM', 'ממשקי מחשב', 'כרטיסי עבודה',
      'ניהול תורים', 'קבלת קהל', 'תקשורת בינאישית',
      'שירות פרונטלי', 'ריבוי משימות', 'אסרטיביות',
      'סבלנות', 'אקסל',
    ],
  },
  // דיאגנוסטיקה
  {
    match: /דיאגנוסטיק/,
    bonus: true,
    tags: [
      'דיאגנוסטיקה', 'דיאגנוסטיקת רכב', 'אבחון רכב',
      'אבחון תקלות', 'אבחון תקלות רכב',
      'טכנאי אבחון', 'טכנאי רכב', 'טכנאית רכב',
      'מחשב רכב', 'OBD', 'OBD2',
      'קריאת קודי שגיאה', 'תוכנות אבחון', 'תוכנות יצרן',
      'אנגלית טכנית', 'חשמל רכב', 'חשמלאי רכב',
      'מערכות הרכב', 'מערכות חשמל', 'מנוע', 'גיר',
      'פתרון בעיות', 'יכולת אנליטית', 'דיוק',
      'מענק התמדה',
    ],
  },
  // מכונאי ניידת / שירות דרכים
  {
    match: /ניידת/,
    bonus: true,
    tags: [
      'מכונאי ניידת', 'ניידת שירות', 'שירות דרכים',
      'שירות שטח', 'עבודה בשטח', 'כוננות',
      'תיקון בשטח', 'נסיעות', 'רישיון נהיגה',
      'ציוד נייד', 'זמינות גבוהה', 'גמישות',
      'מכונאי רכב', 'תחזוקת רכב', 'תיקון רכב',
      'חלפים', 'עצמאות', 'אחריות', 'פתרון בעיות',
      'עבודה בלילה', 'כוננות שישי', 'מענק התמדה',
    ],
  },
  // מכונאי צמ"ה / כבד
  {
    match: /צמ"ה|צמ״ה|צמה|כבד/,
    bonus: true,
    tags: [
      'מכונאי צמ"ה', 'צמ"ה', 'ציוד מכני הנדסי',
      'מכונות כבדות', 'מכונאי כבד', 'מכונאי רכב כבד',
      'מלגזה', 'מחפר', 'טרקטור', 'שיפלה',
      'רישיון כבד', 'רישיון 15 טון',
      'תחזוקה', 'חלקי חילוף', 'שימון',
      'מכונאי רכב', 'מכונאות', 'תיקון רכב',
      'עבודה פיזית', 'מענק התמדה',
    ],
  },
  // מכונאי אוטובוסים
  {
    match: /אוטובוס/,
    bonus: true,
    tags: [
      'מכונאי אוטובוסים', 'אוטובוסים', 'רכב כבד',
      'תחבורה ציבורית', 'מכונאי רכב כבד',
      'מכונאי רכב', 'מכונאות', 'תיקון רכב',
      'בלמים', 'מתלים', 'מנוע', 'גיר',
      'תחזוקת רכב', 'עבודה פיזית', 'מענק התמדה',
    ],
  },
  // בוחן
  {
    match: /בוחן/,
    tags: [
      'בוחן', 'בוחן רכב', 'בחינת רכבים',
      'נסיעות מבחן', 'בדיקה מכאנית', 'בדיקה מקצועית',
      'כרטיסי עבודה', 'ממשקי מחשב', 'ידע מכונאי',
      'רישיון B', 'תשומת לב לפרטים',
      'בדיקות בטיחות', 'שיפוט מקצועי', 'דיוק',
      'מכונאי רכב', 'תיקון רכב', 'תחזוקת רכב',
    ],
  },
  // מכונאי גנרי - חייב להיות אחרי הספציפיים
  {
    match: /מכונאי|מכונאות/,
    bonus: true,
    tags: [
      'מכונאי רכב', 'מכונאית רכב', 'מכונאי/ת רכב',
      'מכונאות רכב', 'מכונאות', 'מכונאי',
      'טכנאי רכב', 'תחזוקת רכב', 'תיקון רכב',
      'טיפולים תקופתיים', 'החלפת חלקים',
      'תיקון מנוע', 'מערכת בלמים', 'מערכת מתלים',
      'מערכת היגוי', 'מערכת קירור', 'תיבת הילוכים',
      'חלפים', 'חלקי חילוף', 'עבודה פיזית',
      'עבודת ידיים', 'דיוק', 'יסודיות',
      'מענק התמדה',
    ],
  },
  // מסגר
  {
    match: /מסגר/,
    tags: [
      'מסגר', 'מסגרות', 'מסגרות רכב',
      'עבודת מתכת', 'ריתוך', 'ריתוך MIG', 'ריתוך TIG',
      'חיתוך מתכת', 'עיבוד מתכת',
      'קריאת שרטוטים', 'שרטוטים',
      'כלי עבודה', 'עבודת ידיים', 'דיוק',
      'מדידה', 'עבודה פיזית', 'כשרון טכני',
    ],
  },
  // פחח
  {
    match: /פחח/,
    tags: [
      'פחח', 'פחחות', 'פחחות רכב',
      'תיקון פגמים', 'תיקון נזקי תאונה',
      'קרוסרי', 'מרכב', 'יישור מרכב',
      'כינוס', 'גיהוץ', 'ריתוך',
      'עבודת ידיים', 'דיוק', 'אסתטיקה',
      'עבודה פיזית', 'כלי עבודה',
    ],
  },
  // מחסנאי
  {
    match: /מחסנאי|מחסן/,
    tags: [
      'מחסנאי', 'מחסן', 'ניהול מחסן',
      'ליקוט', 'אריזה', 'קבלת סחורה', 'שיגור סחורה',
      'חלפים', 'חלקי חילוף', 'חלפי רכב', 'קטלוג חלקים',
      'מלאי', 'ספירת מלאי', 'ניהול מלאי',
      'WMS', 'Excel', 'מחשב',
      'סדר וניקיון', 'דיוק', 'עבודה פיזית',
    ],
  },
  // נהג
  {
    match: /נהג|חלפים נהג/,
    tags: [
      'נהג', 'נהיגה מקצועית', 'נהג חלפים', 'שינוע',
      'רישיון B', 'רישיון C', 'רישיון D', 'רישיון E',
      'משאיות', 'רכב כבד', 'מסירות', 'לוגיסטיקה',
      'ניווט', 'ידיעת הדרכים', 'מסמכי משלוח',
      'אמינות', 'שקדנות', 'עצמאות',
    ],
  },
  // מתאמת שירות
  {
    match: /מתאמת|מתאם\s*שירות/,
    tags: [
      'מתאמת שירות', 'מתאם שירות', 'מתאם/ת שירות',
      'תיאום פגישות', 'תיאום תורים', 'מענה טלפוני',
      'קבלת קהל', 'שירות לקוחות', 'מערכת CRM',
      'אקסל', 'Office', 'מחשב',
      'ריבוי משימות', 'סבלנות', 'יחסי אנוש',
      'תקשורת בינאישית', 'אסרטיביות', 'מזכירות',
      'אדמיניסטרציה',
    ],
  },
  // מנהל מ"ש / מנהל מרכז שירות
  {
    match: /מנהל\s*מ"ש|מנהל\s*מרכז|מנהל\s*מ״ש/,
    tags: [
      'מנהל מרכז שירות', 'מנהל מ"ש', 'ניהול מרכז שירות',
      'ניהול צוות', 'ניהול עובדים',
      'P&L', 'אחריות תקציבית', 'KPI',
      'ניהול לקוחות', 'תודעת שירות',
      'ניסיון ניהולי', 'מנהיגות', 'יחסי אנוש',
      'תקשורת בינאישית', 'פתרון בעיות',
      'יכולת אנליטית', 'מערכות מידע', 'CRM',
    ],
  },
]

function roleTagsFor(title: string): { tags: string[]; bonus: boolean } {
  for (const profile of ROLE_PROFILES) {
    if (profile.match.test(title)) {
      return { tags: profile.tags, bonus: profile.bonus === true }
    }
  }
  return { tags: [], bonus: false }
}

// ──────────────────────────────────────────────────────────────
// פיל-אפ: תגיות "soft" שמשמשות כ-fallback אם פחות מ-35
// ──────────────────────────────────────────────────────────────
const SOFT_TAGS = [
  'עבודה בצוות', 'עבודה עצמאית', 'יסודיות',
  'יוזמה', 'מוטיבציה', 'גמישות', 'התמדה',
  'דיוק', 'אחריות אישית', 'תקשורת',
  'פתרון בעיות', 'חשיבה אנליטית',
  'עברית רהוטה', 'ידיים טובות', 'זריזות',
]

function buildTagsFor(title: string, location: string | null | undefined): {
  tags: string[]
  bonus: boolean
} {
  const role = roleTagsFor(title)
  const set = new Set<string>()

  for (const t of COMMON_TAGS) set.add(t)
  for (const t of locationTagsFor(location)) set.add(t)
  for (const t of role.tags) set.add(t)

  // אם פחות מ-35 — נוסיף soft
  for (const t of SOFT_TAGS) {
    if (set.size >= 40) break
    set.add(t)
  }

  // המרה למערך + סינון
  const arr = Array.from(set)
    .map(t => (t || '').trim())
    .filter(t => t.length >= 2 && t.length <= 40)

  return { tags: arr, bonus: role.bonus }
}

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

async function findMeirEmployer() {
  return prisma.employer.findFirst({
    where: {
      OR: [
        { name: { contains: 'מאיר' } },
        { email: 'hr@meirgroup.co.il' },
      ],
    },
  })
}

// ──────────────────────────────────────────────────────────────
// GET — preview (לא מבצע שום שינוי)
// ──────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const employer = await findMeirEmployer()
    if (!employer) {
      return NextResponse.json(
        { error: 'מעסיק "קבוצת מאיר" לא נמצא' },
        { status: 404 },
      )
    }

    const positions = await prisma.position.findMany({
      where: { employerId: employer.id },
      include: { tags: true },
      orderBy: { createdAt: 'asc' },
    })

    const preview = positions.map(p => {
      const built = buildTagsFor(p.title, p.location)
      return {
        id: p.id,
        title: p.title,
        location: p.location,
        active: p.active,
        currentTagsCount: p.tags.length,
        plannedTagsCount: built.tags.length,
        bonusEligible: built.bonus,
        sampleTags: built.tags.slice(0, 15),
      }
    })

    return NextResponse.json({
      mode: 'preview',
      employer: { id: employer.id, name: employer.name },
      positionsCount: positions.length,
      positions: preview,
      note: 'POST על אותו URL יבצע את העדכון בפועל.',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'unknown error' },
      { status: 500 },
    )
  }
}

// ──────────────────────────────────────────────────────────────
// POST — ביצוע בפועל
// ──────────────────────────────────────────────────────────────
export async function POST() {
  try {
    const employer = await findMeirEmployer()
    if (!employer) {
      return NextResponse.json(
        { error: 'מעסיק "קבוצת מאיר" לא נמצא' },
        { status: 404 },
      )
    }

    const positions = await prisma.position.findMany({
      where: { employerId: employer.id },
      include: { tags: true },
      orderBy: { createdAt: 'asc' },
    })

    const results: any[] = []

    for (const pos of positions) {
      const built = buildTagsFor(pos.title, pos.location)

      const tagRecords: { id: string }[] = []
      for (const name of built.tags) {
        const t = await ensureTag(name)
        if (t) tagRecords.push({ id: t.id })
      }

      const updated = await prisma.position.update({
        where: { id: pos.id },
        data: {
          tags: {
            set: [],
            connect: tagRecords,
          },
        },
        include: { tags: true },
      })

      results.push({
        id: pos.id,
        title: pos.title,
        location: pos.location,
        before: pos.tags.length,
        after: updated.tags.length,
        atLeast35: updated.tags.length >= 35,
        bonusEligible: built.bonus,
      })
    }

    const okCount = results.filter(r => r.atLeast35).length

    return NextResponse.json({
      success: true,
      employer: { id: employer.id, name: employer.name },
      positionsUpdated: results.length,
      positionsWithAtLeast35Tags: okCount,
      results,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'unknown error' },
      { status: 500 },
    )
  }
}
