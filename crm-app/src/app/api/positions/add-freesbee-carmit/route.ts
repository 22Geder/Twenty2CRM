import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescriptionWithGemini } from "@/lib/gemini-ai"

/**
 * הוספת משרת רכז/ת גיוס ל-FREESBEE
 * מגייסת: כרמית (FREESBEE) - carmitshu@freesbe.com
 *
 *   GET /api/positions/add-freesbee-carmit?key=twenty2freesbee2026
 *
 * • מיקום: פארק ראם / בני עי"ש
 * • שכר: 10K + 2K ממוצע בונוסים (לא לפרסום)
 * • שעות: א'-ה' 8-17 (אין גמישות)
 * • תיוגים: ≥40 לכל משרה (HR / גיוס - לא רכב)
 */

const RECRUITER_EMAIL = 'carmitshu@freesbe.com'
const RECRUITER_NAME = 'כרמית (FREESBEE)'

const POSITION_TITLE = 'רכז/ת גיוס - פארק ראם'
const LOCATION = 'פארק ראם'

const TAG_COLORS: Record<string, string> = {
  'FREESBEE': '#EF4444',
  'גיוס': '#7C3AED',
  'רכז גיוס': '#8B5CF6',
  'רכזת גיוס': '#8B5CF6',
  'רכז/ת גיוס': '#8B5CF6',
  'משאבי אנוש': '#A855F7',
  'HR': '#A855F7',
  'Recruiter': '#A855F7',
  'Talent Acquisition': '#9333EA',
  'LinkedIn': '#0EA5E9',
  'Facebook': '#1877F2',
  'אינסטגרם': '#E1306C',
  'משרה מלאה': '#22C55E',
  'תואר ראשון': '#3B82F6',
  'אקדמאי': '#3B82F6',
  'פארק ראם': '#06B6D4',
  'בני עי"ש': '#0891B2',
  'דרום': '#0284C7',
  'שפלה': '#0369A1',
}

const BASE_TAGS = [
  // מעסיק
  'FREESBEE',
  // תפקיד
  'גיוס', 'רכז גיוס', 'רכזת גיוס', 'רכז/ת גיוס', 'גיוס עובדים',
  'משאבי אנוש', 'HR', 'Recruiter', 'Talent Acquisition',
  'גיוס וסורסינג', 'גיוס ובחירה',
  // תהליכי גיוס
  'תהליכי גיוס', 'איתור מועמדים', 'סורסינג', 'sourcing',
  'ראיונות', 'ראיונות טלפוניים', 'ראיונות פרונטליים',
  'מיון מועמדים', 'קליטת עובדים', 'On-boarding',
  // ערוצי פרסום
  'פרסום משרות', 'רשתות חברתיות', 'LinkedIn', 'Facebook', 'אינסטגרם',
  'ATS', 'מערכות גיוס',
  // השכלה
  'תואר ראשון', 'אקדמאי', 'B.A',
  // ניסיון
  'שנת ניסיון בגיוס', 'ניסיון בגיוס', 'ניסיון קודם בגיוס',
  // מיקום
  'פארק ראם', 'בני עי"ש', 'דרום', 'שפלה', 'מישור החוף',
  // תנאים
  'משרה מלאה', "א'-ה'", '8-17', 'שעות קבועות', 'ללא גמישות',
  // soft skills
  'יחסי אנוש', 'תקשורת בין אישית', 'אסרטיביות', 'יוזמה', 'אנרגטיות',
  'עבודה עצמאית', 'עבודה בצוות', 'סדר וארגון', 'ריבוי משימות',
  'אוריינטציה לאנשים', 'תודעת שירות',
]

const FALLBACK_TAGS = [...BASE_TAGS]

const PUBLIC_DESCRIPTION = `📍 רכז/ת גיוס

🏢 חברת FREESBEE מחפשת רכז/ת גיוס למשרדים בפארק ראם (בני עי"ש).

🎯 התפקיד כולל:
• הובלת תהליכי גיוס משלב איתור המועמד ועד לקליטה
• ביצוע ראיונות טלפוניים ופרונטליים
• פרסום משרות ברשתות החברתיות

📋 דרישות התפקיד:
• ניסיון קודם בגיוס של שנה – חובה
• תואר ראשון – חובה

⏰ ימי עבודה: א'-ה' 08:00-17:00 (אין גמישות בשעות)
📍 מיקום המשרה: פארק ראם, בני עי"ש

💼 למעוניינים: נא לציין צפי שכר במייל החזרה.`

const REQUIREMENTS = `• ניסיון קודם בגיוס של שנה – חובה
• תואר ראשון – חובה
• יחסי אנוש מעולים, אסרטיביות, יוזמה, אנרגטיות
• יכולת עבודה בצוות וריבוי משימות`

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
          description: 'FREESBEE - גיוס לחברות. גיוס דרך מנפאואר וצוות פנימי.',
        },
      })
      employerCreated = true
    }

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

    const aiProfile = {
      role: 'רכז/ת גיוס',
      industry: 'משאבי אנוש / גיוס',
      seniority: 'JUNIOR',
      requiredSkills: gem?.requiredSkills || [
        'גיוס', 'ראיונות טלפוניים', 'ראיונות פרונטליים',
        'פרסום משרות', 'סורסינג', 'יחסי אנוש',
      ],
      requiredExperience: gem?.requiredExperience ?? 1,
      industries: gem?.industries || ['משאבי אנוש', 'גיוס'],
      keyRequirements: gem?.keyRequirements || [
        'שנת ניסיון בגיוס',
        'תואר ראשון',
      ],
      keywords: tagNames,
      location: LOCATION,
      employer: 'FREESBEE',
      // 🔒 פנימי בלבד - לא לפרסום
      _internal: {
        salary: {
          base: 10000,
          averageBonus: 2000,
          totalAverage: 12000,
          publishSalary: false,
          notes: 'שכר בסיס 10K + 2K ממוצע בונוסים – לא לפרסום',
        },
        workHours: "א'-ה' 08:00-17:00",
        scheduleFlexibility: 'אין גמישות בשעות',
        publishHours: true,
        recruiterEmail: RECRUITER_EMAIL,
        recruiterName: RECRUITER_NAME,
      },
    }

    const existing = await prisma.position.findFirst({
      where: { title: POSITION_TITLE, employerId: employer.id },
    })

    const data = {
      title: POSITION_TITLE,
      location: LOCATION,
      description: PUBLIC_DESCRIPTION,
      requirements: REQUIREMENTS,
      salaryRange: 'לא לפרסום',
      workHours: "א'-ה' 08:00-17:00",
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
    console.error('[FREESBEE/carmit] Error:', error)
    return NextResponse.json(
      { error: 'Failed', message: error?.message, stack: error?.stack?.split('\n').slice(0, 5) },
      { status: 500 },
    )
  }
}
