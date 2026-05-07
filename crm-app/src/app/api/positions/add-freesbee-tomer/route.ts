import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"

/**
 * הוספת משרת הנהלת חשבונות עד מאזן ל-FREESBEE
 * מגייס: תומר (FREESBEE) - talmaz@freesbe.com
 *
 *   GET /api/positions/add-freesbee-tomer?key=twenty2freesbee2026
 *
 * • מיקום: פארק ראם / בני עי"ש
 * • שכר: עד 12K ב-2-3 שנות ניסיון, גג עד 14K לבעלי ניסיון רב (לא לפרסום)
 * • הערה ללקוח: "אם יש הנה"ח ספקים/לקוחות אין לי בעיה לראות אבל שכר עד 12"
 * • תיוגים: ≥40 לכל משרה (back-office, לא רכב)
 */

const RECRUITER_EMAIL = 'talmaz@freesbe.com'
const RECRUITER_NAME = 'תומר (FREESBEE)'

const POSITION_TITLE = 'הנהלת חשבונות עד מאזן - פארק ראם'
const LOCATION = 'פארק ראם'

// ---- תיוגים מותאמים ל-back-office (≥40 ייחודיים אחרי dedupe) ----
const TAG_COLORS: Record<string, string> = {
  'FREESBEE': '#EF4444',
  'הנהלת חשבונות': '#1F2937',
  'הנה"ח': '#1F2937',
  'הנה"ח סוג 2': '#0EA5E9',
  'הנה"ח סוג 3': '#3B82F6',
  'עד מאזן': '#7C3AED',
  'תפנית': '#10B981',
  'Excel': '#22C55E',
  'משרה מלאה': '#22C55E',
  'פארק ראם': '#06B6D4',
  'בני עי"ש': '#0891B2',
  'דרום': '#0284C7',
  'שפלה': '#0369A1',
  'מימון': '#F59E0B',
  'מע"מ': '#EAB308',
  'ניכויים': '#EAB308',
  'מקדמות מס הכנסה': '#EAB308',
  'רשויות המס': '#F97316',
}

const BASE_TAGS = [
  // מעסיק
  'FREESBEE',
  // תפקיד עיקרי
  'הנהלת חשבונות', 'הנה"ח', 'עד מאזן', 'הנהלת חשבונות עד מאזן',
  'מנהלת חשבונות', 'מנהל חשבונות', 'הנה"ח עד מאזן',
  // סיווגים מקצועיים
  'הנה"ח סוג 2', 'הנה"ח סוג 3', 'הנהלת חשבונות סוג 2', 'הנהלת חשבונות סוג 3',
  // משימות יומיומיות
  'ספקים', 'לקוחות', 'הנה"ח ספקים', 'הנה"ח לקוחות',
  'התאמות בנקים', 'התאמות כרטיסי אשראי', 'התאמות',
  'פקודות יומן', 'כרטסות', 'ניתוח כרטסות', 'רכוש קבוע',
  // דיווחים לרשויות
  'דיווחים לרשויות המס', 'רשויות המס', 'מע"מ', 'ניכויים',
  'מקדמות מס הכנסה', 'דיווח מע"מ', 'דיווח ניכויים',
  // תחומים נוספים
  'מימון', 'כספים', 'חשבות',
  // תוכנות
  'Excel', 'אקסל', 'תפנית', 'מערכת תפנית',
  // תנאים
  'משרה מלאה', "א'-ה'", 'ימי א-ה', 'פארק ראם', 'בני עי"ש',
  'דרום', 'שפלה', 'מישור החוף',
  // ניסיון
  '2-3 שנות ניסיון', 'ניסיון קודם בתפקיד דומה', 'ניסיון בהנה"ח',
  // soft skills
  'יחסי אנוש מעולים', 'אסרטיביות', 'עבודה עצמאית', 'עבודה בצוות',
  'דיוק', 'סדר וארגון', 'אחריות', 'אמינות',
]

const FALLBACK_TAGS = [...BASE_TAGS]

const PUBLIC_DESCRIPTION = `📍 הנהלת חשבונות עד מאזן

🏢 חברת FREESBEE מחפשת מנהל/ת חשבונות עד מאזן למשרדים בפארק ראם (בני עי"ש).

🎯 התפקיד כולל:
• עבודה שוטפת מול ספקים, כולל מענה מקצועי וביצוע התאמות
• טיפול ברכוש קבוע
• התאמות בנקים וכרטיסי אשראי
• ביצוע פקודות יומן וניתוח כרטסות
• דיווחים לרשויות המס – מע"מ, ניכויים, מקדמות מס הכנסה

📋 דרישות התפקיד:
• הנה"ח סוג 2 ומעלה (סוג 3 – יתרון)
• רקע במימון – יתרון
• ניסיון קודם בתפקיד דומה – לפחות 2-3 שנים
• שליטה ב-Excel
• היכרות עם מערכת "תפנית" – יתרון משמעותי
• יחסי אנוש מעולים, אסרטיביות, יכולת עבודה עצמאית ובצוות

⏰ משרה מלאה, ימים א'-ה'
📍 מיקום המשרה: פארק ראם, בני עי"ש

💼 למעוניינים: נא לציין צפי שכר במייל החזרה.`

const REQUIREMENTS = `• הנה"ח סוג 2 ומעלה (סוג 3 – יתרון)
• רקע במימון – יתרון
• ניסיון קודם בתפקיד דומה – לפחות 2-3 שנים
• שליטה ב-Excel
• היכרות עם מערכת "תפנית" – יתרון משמעותי
• יחסי אנוש מעולים, אסרטיביות, עבודה עצמאית ובצוות`

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

    // FREESBEE employer (אותו מעסיק כמו שאר משרות freesbee)
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
          description: 'FREESBEE - גיוס לחברות. גיוס דרך מנפאואר וצוות פנימי.',
        },
      })
      employerCreated = true
    }

    // Gemini analysis (best-effort)
    let geminiTags: string[] = []
    let gem: any = null
    let geminiOk = false
    try {
      gem = await analyzeJobDescriptionWithGemini(PUBLIC_DESCRIPTION)
      geminiOk = true
      if (Array.isArray(gem.jobTags)) geminiTags = gem.jobTags
    } catch (err) {
      console.warn(`[FREESBEE/${POSITION_TITLE}] Gemini failed:`, (err as Error).message)
    }

    // merge tags - dedupe + filter (≥40)
    const tagSet = new Set<string>()
    for (const t of BASE_TAGS) tagSet.add(t)
    for (const t of geminiTags) tagSet.add(t)
    if (tagSet.size < 30) {
      for (const t of FALLBACK_TAGS) tagSet.add(t)
    }
    const tagNames = Array.from(tagSet)
      .map(t => (t || '').trim())
      .filter(t => t.length >= 2 && t.length <= 40)

    const tagMap: Record<string, any> = {}
    for (const name of tagNames) {
      const t = await ensureTag(name)
      if (t) tagMap[name] = t
    }

    // aiProfile
    const aiProfile = {
      role: 'מנהל/ת חשבונות עד מאזן',
      industry: 'הנהלת חשבונות / כספים',
      seniority: 'MID',
      requiredSkills: gem?.requiredSkills || [
        'הנה"ח סוג 2', 'הנהלת חשבונות עד מאזן', 'התאמות בנקים',
        'פקודות יומן', 'דיווחים לרשויות המס', 'Excel', 'תפנית',
      ],
      requiredExperience: gem?.requiredExperience ?? 2,
      industries: gem?.industries || ['כספים', 'הנהלת חשבונות'],
      keyRequirements: gem?.keyRequirements || [
        'הנה"ח סוג 2 ומעלה',
        '2-3 שנות ניסיון',
        'שליטה ב-Excel',
      ],
      keywords: tagNames,
      location: LOCATION,
      employer: 'FREESBEE',
      // 🔒 פנימי בלבד - לא לפרסום
      _internal: {
        salary: {
          range: 'עד 12K ב-2-3 שנות ניסיון; עד 14K לבעלי ניסיון רב',
          maxBase: 12000,
          maxStretch: 14000,
          publishSalary: false,
          notes: 'אם יש מועמדים מעבר לזה אבל עם ניסיון רב גג עד 14. בבקשה לא לפרסם את השכר. אם יש הנה"ח ספקים/לקוחות אין לי בעיה לראות אבל שכר עד 12.',
        },
        workHours: "א'-ה' משרה מלאה",
        publishHours: true,
        recruiterEmail: RECRUITER_EMAIL,
        recruiterName: RECRUITER_NAME,
      },
    }

    // create or update
    const existing = await prisma.position.findFirst({
      where: { title: POSITION_TITLE, employerId: employer.id },
    })

    const data = {
      title: POSITION_TITLE,
      location: LOCATION,
      description: PUBLIC_DESCRIPTION,
      requirements: REQUIREMENTS,
      salaryRange: 'לא לפרסום',
      workHours: "א'-ה' משרה מלאה",
      employmentType: 'משרה מלאה',
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

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name,
        created: employerCreated,
      },
      recruiter: { name: RECRUITER_NAME, email: RECRUITER_EMAIL },
      position: {
        title: POSITION_TITLE,
        positionId: position.id,
        created,
        tagsCount: position.tags.length,
        tagsAtLeast40: position.tags.length >= 40,
        gemini: { ok: geminiOk, tagsFromGemini: geminiTags.length },
      },
    })
  } catch (error: any) {
    console.error('[FREESBEE/tomer] Error:', error)
    return NextResponse.json(
      { error: 'Failed', message: error?.message, stack: error?.stack?.split('\n').slice(0, 5) },
      { status: 500 },
    )
  }
}
