import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ──────────────────────────────────────────────────────────────
// נתוני קבוצת מאיר — 15 משרות
// ──────────────────────────────────────────────────────────────

const BENEFITS_STANDARD = `חדר אוכל - ארוחות צהריים מסובסדות
ביטוח רפואי פרטי במימון החברה
ביגוד
חניה`

const BENEFITS_WITH_BONUS = `חדר אוכל - ארוחות צהריים מסובסדות
ביטוח רפואי פרטי במימון החברה
ביגוד
חניה
מענק התמדה במשך שנתיים`

const HOURS_FULL = 'משרה מלאה 5 ימים בשבוע, 7:30–16:30, ימי שישי לסירוגין 7:30–12:00'
const HOURS_MOBILE = 'עבודה מהשעה 7:30 עד 14:00 במרכז השירות ולאחר מכן כוננות, ימי שישי לסירוגין כולל כוננות'

const SERVICE_ADVISOR_KW = JSON.stringify([
  'יועץ שירות','שירות לקוחות','תודעת שירות','קשרי לקוחות','מענה ללקוחות',
  'ליווי לקוח','פתרון תקלות','CRM','ממשקים פנימיים','עבודה מול לקוחות',
  'כרטיסי עבודה','ניהול תורים','קבלת קהל','עבודה בצוות','תקשורת בינאישית',
  'ניסיון בשירות','שירות פרונטלי','ריבוי משימות','אקסל','מחשב',
  'אסרטיביות','סבלנות','מרכז שירות','רכב','משרה מלאה',
])

const DIAGNOSTICS_KW = JSON.stringify([
  'דיאגנוסטיקה','אבחון תקלות','טכנאי רכב','מחשב רכב','OBD',
  'קריאת קודי שגיאה','אנגלית טכנית','ציוד דיאגנוסטי','מכונאות',
  'חשמל רכב','מנוע','גיר','מערכות בלימה','מערכות היגוי',
  'עבודה עצמאית','ניסיון בשטח','ידע בחשמל','פתרון בעיות',
  'מרכז שירות','רכב','משרה מלאה','טכנאות','חשמלאי רכב','ניסיון טכני',
])

const MECHANIC_KW = JSON.stringify([
  'מכונאי','מכונאות','טכנאי רכב','תחזוקת רכב','תיקון רכב',
  'שמן','בלמים','מתלים','גיר','מנוע','חלפים','חלקי חילוף',
  'עבודת ידיים','כלי עבודה','ניסיון מכוני','מרכז שירות',
  'רכב','משרה מלאה','עבודה פיזית','ניסיון בשטח','דיוק',
  'אחריות','עבודה בצוות','תחזוקה מניעתית','תקלות','ניסיון טכני',
])

const MOBILE_MECHANIC_KW = JSON.stringify([
  'מכונאי','ניידת שירות','שירות שטח','עבודה בשטח','כוננות',
  'תיקון בשטח','נסיעות','רישיון ג','רכב שטח','ציוד נייד',
  'זמינות גבוהה','מוסכנות','תחזוקת רכב','חלקי חילוף',
  'עצמאות','פתרון בעיות','אחריות','גמישות','זמינות שישי',
  'מרכז שירות','רכב','משרה מלאה','ניסיון טכני','חשמל רכב',
])

const HEAVY_MECHANIC_KW = JSON.stringify([
  'צמ"ה','ציוד מכני הנדסי','מכונות כבדות','עגורנאות','שיפלה',
  'מלגזה','טרקטור','מחפר','מכונאי כבד','רישיון כבד',
  'רישיון 15 טון','מכונאות','תחזוקה','חלקי חילוף כבד',
  'שימון','עבודה בשטח','ניסיון מכוני','גמישות','אחריות',
  'מרכז שירות','משרה מלאה','עבודה פיזית','כרטיסי עבודה',
  'ניסיון ב-5 שנים',
])

const INSPECTOR_KW = JSON.stringify([
  'בוחן','בחינת רכבים','נסיעות מבחן','בדיקה מכאנית','בדיקה מקצועית',
  'כרטיסי עבודה','ממשקי מחשב','ידע מכונאי','רישיון B','ניסיון מכוני',
  'אחריות','דיוק','תשומת לב לפרטים','בור','ניידה',
  'מרכז שירות','רכב','משרה מלאה','עבודה בצוות','תקשורת',
  'בדיקות בטיחות','ניסיון בשטח','ידע ברכב','שיפוט מקצועי',
])

const WAREHOUSE_KW = JSON.stringify([
  'מחסנאי','מחסן','ליקוט','אריזה','חלקי חילוף','חלפים',
  'מלאי','ספירת מלאי','ניהול מלאי','WMS','מחשב','EXCEL',
  'סדר וניקיון','דיוק','אחריות','תפעול מחסן','קבלת סחורה',
  'שיגור סחורה','ניהול מחסן','עבודה עצמאית','גמישות',
  'משרה מלאה','עבודה פיזית','מרכז שירות','קטלוג חלקים',
  'חלפי רכב',
])

const DRIVER_KW = JSON.stringify([
  'נהג','נהיגה מקצועית','שינוע','רישיון B','רישיון D',
  'רישיון E','משאיות','רכב כבד','אוטובוסים','מסירות',
  'נסיעות מבחן','ניווט','שעות נסיעה','ניסיון נהיגה',
  'שקדנות','אחריות','אמינות','גמישות','משרה מלאה',
  'עבודה עצמאית','ידיעת הדרכים','לוגיסטיקה','מסמכי משלוח',
])

const SMITH_KW = JSON.stringify([
  'מסגר','מסגרות','עבודת מתכת','ריתוך','ריתוך MIG','ריתוך TIG',
  'כלי עבודה','עבודת ידיים','שרטוטים','חיתוך מתכת',
  'מדידה','דיוק','קריאת שרטוטים','ניסיון מסגרות',
  'משרה מלאה','עבודה פיזית','אחריות','מרכז שירות',
  'כשרון טכני','ייצור','עיבוד מתכת','תשומת לב לפרטים',
])

const BODYWORK_KW = JSON.stringify([
  'פחח','פחחות','תיקון פגמים','קרוסרי','מרכב','כינוס',
  'ייישור מרכב','ריתוך','תיקון נזקי תאונה','גיהוץ',
  'עבודת ידיים','ניסיון פחחות','דיוק',
  'תשומת לב לפרטים','משרה מלאה','עבודה פיזית','מרכז שירות',
  'כלי עבודה','שחזור','תיקון פגושים','ניסיון ב-3 שנים',
])

const ALL_POSITIONS = [
  // 1. יועץ שירות – עמק חפר
  {
    title: 'יועץ שירות',
    location: 'מרכז שירות עמק חפר',
    description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.
מתן מענה מקצועי ללקוחות החברה.
עבודה עם ממשקים`,
    requirements: `ניסיון בשירות לקוחות – חובה
תודעה גבוהה למתן שירות`,
    workHours: HOURS_FULL,
    benefits: BENEFITS_STANDARD,
    keywords: SERVICE_ADVISOR_KW,
    openings: 1,
  },
  // 2. דיאגנוסטיקה – עמק חפר
  {
    title: 'דיאגנוסטיקה',
    location: 'מרכז שירות עמק חפר',
    description: 'אבחון תקלות ברכבים באמצעות ציוד דיאגנוסטי',
    requirements: `ניסיון בדיאגנוסטיקה ברמה טובה מאוד
אנגלית טכנית`,
    workHours: HOURS_FULL,
    benefits: BENEFITS_WITH_BONUS,
    keywords: DIAGNOSTICS_KW,
    openings: 1,
  },
  // 3. מכונאי ניידת – רמלה
  {
    title: 'מכונאי ניידת',
    location: 'מרכז שירות רמלה',
    description: 'עבודת מכונאות בשטח – ניידת שירות',
    requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
    workHours: HOURS_MOBILE,
    benefits: BENEFITS_WITH_BONUS,
    keywords: MOBILE_MECHANIC_KW,
    openings: 1,
  },
  // 4. מכונאי צמ"ה – אשדוד
  {
    title: 'מכונאי צמ"ה',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת מכונאות על ציוד מכני הנדסי (צמ"ה)',
    requirements: `ניסיון כמכונאי ברמה טובה מאוד
רישיון נהיגה מעל 15 טון`,
    workHours: HOURS_FULL,
    benefits: BENEFITS_WITH_BONUS,
    keywords: HEAVY_MECHANIC_KW,
    openings: 1,
  },
  // 5. בוחן – אשדוד
  {
    title: 'בוחן',
    location: 'מרכז שירות אשדוד',
    description: `בחינת רכבים של לקוחות מרכז השירות
בדיקה מכאנית של תקלות
נסיעות מבחן
עדכון כרטיסי עבודה לאחר בחינה`,
    requirements: 'ניסיון בבחינה בבור (לא במכון רישוי)',
    workHours: HOURS_FULL,
    benefits: BENEFITS_STANDARD,
    keywords: INSPECTOR_KW,
    openings: 1,
  },
  // 6. מכונאי ניידת שירות 24/7 – אשדוד
  {
    title: 'מכונאי ניידת שירות 24/7',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת מכונאות בשטח בכוננות 24/7 – ניידת שירות',
    requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
    workHours: HOURS_MOBILE,
    benefits: BENEFITS_WITH_BONUS,
    keywords: MOBILE_MECHANIC_KW,
    openings: 1,
  },
  // 7. מכונאים (4) – אשדוד
  {
    title: 'מכונאי',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת מכונאות במרכז שירות',
    requirements: 'ניסיון כמכונאי ברמה טובה מאוד',
    workHours: HOURS_FULL,
    benefits: BENEFITS_WITH_BONUS,
    keywords: MECHANIC_KW,
    openings: 4,
  },
  // 8. נהג – אשדוד
  {
    title: 'נהג',
    location: 'מרכז שירות אשדוד',
    description: 'נהג/ת שינוע משאיות ואוטובוסים ונסיעות מבחן',
    requirements: 'רישיון נהיגה E+D – חובה',
    workHours: HOURS_FULL,
    benefits: BENEFITS_STANDARD,
    keywords: DRIVER_KW,
    openings: 1,
  },
  // 9. מחסנאים (2) – אשדוד
  {
    title: 'מחסנאי',
    location: 'מרכז שירות אשדוד',
    description: `עבודת מחסן בסביבת עבודה ממוחשבת
ליקוט חלפים
סידור וספירות מלאי`,
    requirements: 'הבנה בחלקי חילוף לרכב – יתרון משמעותי',
    workHours: HOURS_FULL,
    benefits: BENEFITS_STANDARD,
    keywords: WAREHOUSE_KW,
    openings: 2,
  },
  // 10. מסגר – אשדוד
  {
    title: 'מסגר',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת מסגרות במרכז שירות',
    requirements: 'ניסיון כמסגר',
    workHours: HOURS_FULL,
    benefits: BENEFITS_STANDARD,
    keywords: SMITH_KW,
    openings: 1,
  },
  // 11. פחח – אשדוד
  {
    title: 'פחח',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת פחחות במרכז שירות',
    requirements: 'ניסיון כפחח',
    workHours: HOURS_FULL,
    benefits: BENEFITS_STANDARD,
    keywords: BODYWORK_KW,
    openings: 1,
  },
  // 12. מכונאי ניידת שירות – אשדוד
  {
    title: 'מכונאי ניידת שירות',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת מכונאות בשטח – ניידת שירות',
    requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
    workHours: HOURS_FULL,
    benefits: BENEFITS_WITH_BONUS,
    keywords: MOBILE_MECHANIC_KW,
    openings: 1,
  },
  // 13. מכונאי ניידת צמ"ה – אשדוד
  {
    title: 'מכונאי ניידת צמ"ה',
    location: 'מרכז שירות אשדוד',
    description: 'עבודת מכונאות בשטח על ציוד מכני הנדסי – ניידת שירות',
    requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
    workHours: HOURS_FULL,
    benefits: BENEFITS_WITH_BONUS,
    keywords: HEAVY_MECHANIC_KW,
    openings: 1,
  },
  // 14. דיאגנוסטיקה – מרכז שירות דרום
  {
    title: 'דיאגנוסטיקה',
    location: 'מרכז שירות דרום',
    description: 'אבחון תקלות ברכבים באמצעות ציוד דיאגנוסטי',
    requirements: 'ניסיון בדיאגנוסטיקה ברמה טובה מאוד',
    workHours: HOURS_FULL,
    benefits: BENEFITS_WITH_BONUS,
    keywords: DIAGNOSTICS_KW,
    openings: 1,
  },
  // 15. יועץ שירות – מרכז שירות דרום
  {
    title: 'יועץ שירות',
    location: 'מרכז שירות דרום',
    description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.
מתן מענה מקצועי ללקוחות החברה.
עבודה עם ממשקים`,
    requirements: `ניסיון בשירות לקוחות – חובה
תודעה גבוהה למתן שירות`,
    workHours: HOURS_FULL,
    benefits: `ביגוד
חניה`,
    keywords: SERVICE_ADVISOR_KW,
    openings: 1,
  },
]

// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('🏢 מסנכרן משרות קבוצת מאיר\n')

  try {
    // מציאת או יצירת מעסיק
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'מאיר' } },
          { email: 'hr@meirgroup.co.il' },
        ],
      },
    })

    if (!employer) {
      console.log('⚠️ יוצר מעסיק קבוצת מאיר...')
      employer = await prisma.employer.create({
        data: {
          name: 'קבוצת מאיר',
          email: 'hr@meirgroup.co.il',
          phone: '',
          description: 'קבוצת מאיר - מרכזי שירות רכב',
        },
      })
    } else {
      await prisma.employer.update({
        where: { id: employer.id },
        data: { name: 'קבוצת מאיר' },
      })
    }
    console.log(`✅ מעסיק: ${employer.name}`)

    const existingPositions = await prisma.position.findMany({
      where: { employerId: employer.id },
    })
    console.log(`📋 משרות קיימות: ${existingPositions.length}`)

    let created = 0
    let updated = 0

    for (const pos of ALL_POSITIONS) {
      // התאמה לפי כותרת + מיקום (כי יש יועץ שירות בשני מיקומים)
      const existing = existingPositions.find(
        (p) => p.title === pos.title && p.location === pos.location
      )

      const data = {
        title: pos.title,
        location: pos.location,
        description: `${pos.description}\n\nדרישות התפקיד:\n${pos.requirements}\n\nשעות עבודה:\n${pos.workHours}\n\nתנאים סוציאליים:\n${pos.benefits}`,
        requirements: pos.requirements,
        workHours: pos.workHours,
        benefits: pos.benefits,
        employmentType: 'Full-time',
        keywords: pos.keywords,
        openings: pos.openings,
        active: true,
        contactEmail: 'hr@meirgroup.co.il',
        contactName: 'מחלקת גיוס – קבוצת מאיר',
      }

      if (existing) {
        await prisma.position.update({
          where: { id: existing.id },
          data,
        })
        updated++
        console.log(`🔄 עודכן: ${pos.title} – ${pos.location}`)
      } else {
        await prisma.position.create({
          data: { ...data, employerId: employer.id },
        })
        created++
        console.log(`✨ נוצר: ${pos.title} – ${pos.location}`)
      }
    }

    const result = {
      success: true,
      message: 'משרות קבוצת מאיר סונכרנו בהצלחה!',
      employer: employer.name,
      stats: { created, updated, total: ALL_POSITIONS.length },
    }
    console.log('\n📊 סיכום:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to sync Meir Group positions',
    positionsCount: ALL_POSITIONS.length,
    locations: ['מרכז שירות עמק חפר', 'מרכז שירות רמלה', 'מרכז שירות אשדוד', 'מרכז שירות דרום'],
  })
}
