import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/update-meir-locations  (preview)
 * POST /api/admin/update-meir-locations  (execute)
 *
 * מעדכן רק את המשרות הקיימות של קבוצת מאיר:
 *   1. location: "מרכז שירות X" -> שם העיר בלבד
 *   2. workHours: נוסח חדש כולל "(משולם כש"נ)"
 *   3. benefits:  תנאים חדשים (קליטה ישירה, ק"ה, ביטוח, ארוחות, חניה,
 *                 + מענק התמדה למכונאים/דיאגנוסטיקה)
 *
 * אינו יוצר/מוחק משרות. אינו נוגע בכותרת/תיאור/דרישות/מילות מפתח.
 */

// ── מיפוי מיקום ─────────────────────────────────────────────
const LOCATION_MAP: { re: RegExp; city: string }[] = [
  { re: /מרכז\s*שירות\s*עמק\s*חפר/, city: 'נתניה / חדרה' },
  { re: /מרכז\s*שירות\s*ראשל["']?צ/, city: 'ראשון לציון' },
  { re: /מרכז\s*שירות\s*ראשון\s*לציון/, city: 'ראשון לציון' },
  { re: /מרכז\s*שירות\s*רעננה/, city: 'רעננה' },
  { re: /מרכז\s*שירות\s*רמלה/, city: 'רמלה' },
  { re: /מרכז\s*שירות\s*אשדוד/, city: 'אשדוד' },
  { re: /מרכז\s*שירות\s*צפון/, city: 'חיפה' },
  { re: /מרכז\s*שירות\s*דרום/, city: 'באר שבע' },
]

function mapLocation(loc: string | null): string | null {
  if (!loc) return null
  for (const { re, city } of LOCATION_MAP) {
    if (re.test(loc)) return city
  }
  return null
}

// ── שעות עבודה ──────────────────────────────────────────────
const HOURS_FULL =
  `עבודה במשרה מלאה, ימים א'-ה' 7:30-16:30, שישי לסירוגין 7:30-12:00 (משולם כש"נ)`
const HOURS_MOBILE =
  `עבודה מהשעה 7:30 עד 14:00 במרכז השירות ולאחר מכן כוננות, ימי שישי לסירוגין כולל כוננות (משולם כש"נ)`

function newWorkHours(title: string, oldHours: string | null): string {
  // משרות ניידת -> שעות ניידת
  if (/ניידת/.test(title)) return HOURS_MOBILE
  // אחרת -> משרה מלאה
  return HOURS_FULL
}

// ── תנאים נלווים ────────────────────────────────────────────
const BENEFITS_STANDARD = [
  'קליטה ישירה למאיר, עובד חברה מהיום הראשון',
  'ק"ה לאחר שנתיים',
  'ביטוח רפואי פרטי במימון החברה',
  'חדר אוכל - ארוחות צהריים מסובסדות',
  'חניה',
].join('\n')

const BENEFITS_WITH_BONUS = BENEFITS_STANDARD + '\n' + 'מענק התמדה במשך שנתיים'

// מי מקבל מענק התמדה? מכונאים ואנשי דיאגנוסטיקה
function newBenefits(title: string): string {
  const t = title.toLowerCase()
  const isMechanic = /מכונאי/.test(title)
  const isDiagnostics = /דיאגנוסטיק/.test(title)
  return isMechanic || isDiagnostics ? BENEFITS_WITH_BONUS : BENEFITS_STANDARD
}

// ──────────────────────────────────────────────────────────────

type Plan = {
  id: string
  title: string
  changes: {
    location?: { from: string | null; to: string }
    workHours?: { from: string | null; to: string }
    benefits?: { from: string | null; to: string }
  }
}

async function buildPlan() {
  const employer = await prisma.employer.findFirst({
    where: {
      OR: [
        { email: 'hr@meirgroup.co.il' },
        { name: { contains: 'מאיר' } },
      ],
    },
  })

  if (!employer) {
    return { employer: null, plan: [] as Plan[] }
  }

  const positions = await prisma.position.findMany({
    where: { employerId: employer.id },
    select: { id: true, title: true, location: true, workHours: true, benefits: true },
    orderBy: { title: 'asc' },
  })

  const plan: Plan[] = []

  for (const p of positions) {
    const newLoc = mapLocation(p.location)
    const newHours = newWorkHours(p.title, p.workHours)
    const newBen = newBenefits(p.title)

    const changes: Plan['changes'] = {}
    if (newLoc && newLoc !== p.location) {
      changes.location = { from: p.location, to: newLoc }
    }
    if (newHours !== p.workHours) {
      changes.workHours = { from: p.workHours, to: newHours }
    }
    if (newBen !== p.benefits) {
      changes.benefits = { from: p.benefits, to: newBen }
    }

    if (Object.keys(changes).length > 0) {
      plan.push({ id: p.id, title: p.title, changes })
    }
  }

  return { employer: { id: employer.id, name: employer.name }, plan }
}

// ── GET: תצוגה מקדימה ──────────────────────────────────────
export async function GET() {
  try {
    const { employer, plan } = await buildPlan()
    if (!employer) {
      return NextResponse.json(
        { success: false, error: 'לא נמצא מעסיק "קבוצת מאיר"' },
        { status: 404 },
      )
    }
    return NextResponse.json({
      success: true,
      mode: 'preview',
      employer,
      plannedUpdates: plan.length,
      plan,
      hint: 'POST לאותו endpoint כדי לבצע את העדכון',
    })
  } catch (error) {
    console.error('❌', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
  }
}

// ── POST: ביצוע ─────────────────────────────────────────────
export async function POST() {
  try {
    const { employer, plan } = await buildPlan()
    if (!employer) {
      return NextResponse.json(
        { success: false, error: 'לא נמצא מעסיק "קבוצת מאיר"' },
        { status: 404 },
      )
    }

    console.log(`🏢 קבוצת מאיר: מעדכן ${plan.length} משרות`)

    let updated = 0
    for (const item of plan) {
      const data: {
        location?: string
        workHours?: string
        benefits?: string
      } = {}
      if (item.changes.location) data.location = item.changes.location.to
      if (item.changes.workHours) data.workHours = item.changes.workHours.to
      if (item.changes.benefits) data.benefits = item.changes.benefits.to

      await prisma.position.update({
        where: { id: item.id },
        data,
      })
      updated++
      console.log(`✏️  ${item.title}: ${Object.keys(item.changes).join(', ')}`)
    }

    return NextResponse.json({
      success: true,
      mode: 'execute',
      employer,
      updated,
      plan,
    })
  } catch (error) {
    console.error('❌', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
  }
}
