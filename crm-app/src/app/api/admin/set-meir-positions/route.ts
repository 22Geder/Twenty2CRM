import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET  /api/admin/set-meir-positions  → preview
 * POST /api/admin/set-meir-positions  → execute
 *
 * מסנכרן את משרות "קבוצת מאיר" לרשימה הקנונית (16 משרות).
 * - מוצא משרה קיימת לפי (titleMatch + locationHint) → מעדכן location/notes
 * - אם אין התאמה → יוצר חדש
 * - משרה של מאיר שלא ברשימה → active=false (לא נמחקת)
 */

const HOURS_FULL =
  `עבודה במשרה מלאה, ימים א'-ה' 7:30-16:30, שישי לסירוגין 7:30-12:00 (משולם כש"נ)`
const HOURS_MOBILE =
  `עבודה מהשעה 7:30 עד 14:00 במרכז השירות ולאחר מכן כוננות, ימי שישי לסירוגין כולל כוננות (משולם כש"נ)`

const BENEFITS_STANDARD = [
  'קליטה ישירה למאיר, עובד חברה מהיום הראשון',
  'ק"ה לאחר שנתיים',
  'ביטוח רפואי פרטי במימון החברה',
  'חדר אוכל - ארוחות צהריים מסובסדות',
  'חניה',
].join('\n')

const BENEFITS_WITH_BONUS = BENEFITS_STANDARD + '\nמענק התמדה במשך שנתיים'

// ── הרשימה הקנונית ──────────────────────────────────────────────
type Spec = {
  key: string                 // מזהה לוגי
  title: string               // כותרת רצויה
  titleMatch: RegExp          // למציאת משרה קיימת
  locationHint?: RegExp       // לפתרון אי-בהירות (כמה משרות עם אותה כותרת)
  location: string            // עיר רצויה
  division?: string           // רכב כבד / AFTERSALE
  notes?: string              // הערות אקסטרא לתיאור
  isMobile?: boolean          // ניידת? → שעות שונות
  bonus?: boolean             // מענק התמדה?
}

const SPEC: Spec[] = [
  // ── רכב כבד ──
  {
    key: 'diag-haifa',
    title: 'דיאגנוסטיקה',
    titleMatch: /^דיאגנוסטיקה$/,
    locationHint: /חיפה|צפון/,
    location: 'חיפה',
    division: 'רכב כבד',
    bonus: true,
  },
  {
    key: 'svc-advisor-netanya',
    title: 'יועץ שירות',
    titleMatch: /^יועץ\s*שירות$/,
    locationHint: /נתניה|חדרה|עמק\s*חפר/,
    location: 'נתניה',
    division: 'רכב כבד',
    notes: 'בעל ניסיון רלוונטי',
  },
  {
    key: 'diag-netanya',
    title: 'דיאגנוסטיקה',
    titleMatch: /^דיאגנוסטיקה$/,
    locationHint: /נתניה|חדרה|עמק\s*חפר/,
    location: 'נתניה',
    division: 'רכב כבד',
    notes: 'מועמד ברמה טובה מאוד',
    bonus: true,
  },
  {
    key: 'svc-mgr-emek-hefer',
    title: 'מנהל מרכז שירות',
    titleMatch: /מנהל\s*מרכז\s*שירות|מנהל\s*מ["']?ש/,
    location: 'מרכז שירות עמק חפר',
    division: 'רכב כבד',
  },
  {
    key: 'bus-mech-ashdod',
    title: 'מכונאי אוטובוסים',
    titleMatch: /מכונאי\s*אוטובוס|אוטובוס/,
    location: 'אשדוד',
    division: 'רכב כבד',
    bonus: true,
  },
  {
    key: 'inspector-ashdod',
    title: 'בוחן',
    titleMatch: /^בוחן$/,
    locationHint: /אשדוד/,
    location: 'מרכז שירות אשדוד',
    division: 'רכב כבד',
    notes: 'בעל ניסיון בחינה בבור (ולא בוחן רישוי)',
  },
  {
    key: 'mobile-247-ashdod',
    title: 'מכונאי ניידת שירות 24/7',
    titleMatch: /מכונאי\s*ניידת\s*שירות\s*24\/?7|ניידת\s*24\/?7/,
    location: 'אשדוד',
    division: 'רכב כבד',
    isMobile: true,
    bonus: true,
  },
  {
    key: 'mech-ashdod',
    title: 'מכונאי',
    titleMatch: /^מכונאי$/,
    locationHint: /אשדוד/,
    location: 'אשדוד',
    division: 'רכב כבד',
    bonus: true,
  },
  {
    key: 'metalworker-ashdod',
    title: 'מסגר',
    titleMatch: /^מסגר$/,
    location: 'אשדוד',
    division: 'רכב כבד',
  },
  {
    key: 'panel-ashdod',
    title: 'פחח',
    titleMatch: /^פחח$/,
    location: 'אשדוד',
    division: 'רכב כבד',
  },
  {
    key: 'warehouse-ashdod',
    title: 'מחסנאי',
    titleMatch: /^מחסנאי$/,
    locationHint: /אשדוד/,
    location: 'אשדוד',
    division: 'רכב כבד',
  },
  {
    key: 'diag-beer-sheva',
    title: 'דיאגנוסטיקה',
    titleMatch: /^דיאגנוסטיקה$/,
    locationHint: /באר\s*שבע|דרום/,
    location: 'באר שבע',
    division: 'רכב כבד',
    bonus: true,
  },
  {
    key: 'mech-beer-sheva',
    title: 'מכונאי',
    titleMatch: /^מכונאי$/,
    locationHint: /באר\s*שבע|דרום/,
    location: 'באר שבע',
    division: 'רכב כבד',
    bonus: true,
  },
  // ── AFTERSALE ──
  {
    key: 'car-mech-rishon',
    title: 'מכונאי רכב',
    titleMatch: /מכונאי\s*רכב/,
    locationHint: /ראשל|ראשון/,
    location: 'מרכז שירות ראשל"צ',
    division: 'AFTERSALE',
    bonus: true,
  },
  {
    key: 'svc-coordinator-raanana',
    title: 'מתאמת שירות',
    titleMatch: /מתאמת\s*שירות/,
    location: 'מרכז שירות רעננה',
    division: 'AFTERSALE',
  },
  {
    key: 'parts-driver-merlog',
    title: 'נהג חלפים',
    titleMatch: /נהג\s*חלפים|נהג/,
    location: 'מרלו"ג',
    division: 'AFTERSALE',
    notes: 'רישיון C',
  },
]

// ── עזר ─────────────────────────────────────────────────────────
async function findMeirEmployer() {
  return prisma.employer.findFirst({
    where: {
      OR: [
        { email: 'hr@meirgroup.co.il' },
        { name: { contains: 'מאיר' } },
      ],
    },
  })
}

type ExistingPosition = {
  id: string
  title: string
  location: string | null
  description: string | null
  active: boolean
}

function pickMatch(
  spec: Spec,
  pool: ExistingPosition[],
  takenIds: Set<string>,
): ExistingPosition | null {
  // candidates by title
  const byTitle = pool.filter(
    (p) => !takenIds.has(p.id) && spec.titleMatch.test(p.title),
  )
  if (byTitle.length === 0) return null
  if (byTitle.length === 1) return byTitle[0]
  // disambiguate by locationHint
  if (spec.locationHint) {
    const hinted = byTitle.filter(
      (p) => p.location && spec.locationHint!.test(p.location),
    )
    if (hinted.length > 0) return hinted[0]
  }
  // fallback: first untaken
  return byTitle[0]
}

function buildDescription(spec: Spec, existing: string | null): string {
  if (!spec.notes) return existing ?? ''
  if (!existing) return spec.notes
  // append note אם עדיין לא נמצא
  if (existing.includes(spec.notes)) return existing
  return existing.trimEnd() + '\n\n' + spec.notes
}

type Action =
  | { kind: 'update'; id: string; title: string; before: { location: string | null }; after: { location: string; notesAdded: boolean } }
  | { kind: 'create'; title: string; location: string }
  | { kind: 'deactivate'; id: string; title: string; location: string | null }

async function buildPlan() {
  const employer = await findMeirEmployer()
  if (!employer) return { employer: null, actions: [] as Action[] }

  const pool = await prisma.position.findMany({
    where: { employerId: employer.id, active: true },
    select: { id: true, title: true, location: true, description: true, active: true },
  })

  const taken = new Set<string>()
  const actions: Action[] = []

  for (const spec of SPEC) {
    const match = pickMatch(spec, pool, taken)
    if (match) {
      taken.add(match.id)
      const notesAdded = !!spec.notes && !(match.description ?? '').includes(spec.notes)
      actions.push({
        kind: 'update',
        id: match.id,
        title: spec.title,
        before: { location: match.location },
        after: { location: spec.location, notesAdded },
      })
    } else {
      actions.push({ kind: 'create', title: spec.title, location: spec.location })
    }
  }

  // משרות פעילות שלא נתפסו → deactivate
  for (const p of pool) {
    if (!taken.has(p.id)) {
      actions.push({ kind: 'deactivate', id: p.id, title: p.title, location: p.location })
    }
  }

  return { employer: { id: employer.id, name: employer.name }, actions }
}

// ── GET preview ─────────────────────────────────────────────────
export async function GET() {
  try {
    const { employer, actions } = await buildPlan()
    if (!employer) {
      return NextResponse.json(
        { success: false, error: 'לא נמצא מעסיק "קבוצת מאיר"' },
        { status: 404 },
      )
    }
    const summary = {
      updates: actions.filter((a) => a.kind === 'update').length,
      creates: actions.filter((a) => a.kind === 'create').length,
      deactivations: actions.filter((a) => a.kind === 'deactivate').length,
    }
    return NextResponse.json({
      success: true,
      mode: 'preview',
      employer,
      summary,
      actions,
      hint: 'POST לאותו endpoint כדי לבצע',
    })
  } catch (error) {
    console.error('❌ set-meir-positions preview:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

// ── POST execute ────────────────────────────────────────────────
export async function POST() {
  try {
    const { employer, actions } = await buildPlan()
    if (!employer) {
      return NextResponse.json(
        { success: false, error: 'לא נמצא מעסיק "קבוצת מאיר"' },
        { status: 404 },
      )
    }

    const results: Array<Record<string, unknown>> = []

    for (let i = 0; i < SPEC.length; i++) {
      const spec = SPEC[i]
      const action = actions[i] // אותה הזמנה
      const benefits = spec.bonus ? BENEFITS_WITH_BONUS : BENEFITS_STANDARD
      const workHours = spec.isMobile ? HOURS_MOBILE : HOURS_FULL

      if (action.kind === 'update') {
        const existing = await prisma.position.findUnique({
          where: { id: action.id },
          select: { description: true },
        })
        const desc = buildDescription(spec, existing?.description ?? null)
        await prisma.position.update({
          where: { id: action.id },
          data: {
            title: spec.title,
            location: spec.location,
            description: desc,
            workHours,
            benefits,
            active: true,
          },
        })
        results.push({ key: spec.key, action: 'updated', id: action.id, title: spec.title, location: spec.location })
      } else if (action.kind === 'create') {
        const created = await prisma.position.create({
          data: {
            title: spec.title,
            employerId: employer.id,
            location: spec.location,
            employmentType: 'Full-time',
            active: true,
            openings: 1,
            priority: 1,
            description: spec.notes ?? '',
            requirements: '',
            workHours,
            benefits,
          },
        })
        results.push({ key: spec.key, action: 'created', id: created.id, title: spec.title, location: spec.location })
      }
    }

    // deactivations
    let deactivated = 0
    for (const a of actions) {
      if (a.kind === 'deactivate') {
        await prisma.position.update({
          where: { id: a.id },
          data: { active: false },
        })
        deactivated++
        results.push({ action: 'deactivated', id: a.id, title: a.title, oldLocation: a.location })
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'execute',
      employer,
      summary: {
        updated: results.filter((r) => r.action === 'updated').length,
        created: results.filter((r) => r.action === 'created').length,
        deactivated,
      },
      results,
    })
  } catch (error) {
    console.error('❌ set-meir-positions execute:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
