import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/positions/add-boutik-march2026
 * הוספת משרות חדשות לבוטיק הפיתה - מרץ 2026
 * 1. מנהלת חשבונות
 * 2. חשבת שכר
 * 3. מחסנאי ממוחשב
 */

// תגיות למנהלת חשבונות
const ACCOUNTANT_TAGS = [
  'הנהלת חשבונות', 'accounting', 'חשבונאות', 'רואה חשבון',
  'הנהח', 'חשבוניות', 'מע"מ', 'ביטוח לאומי', 'מס הכנסה',
  'אקסל', 'excel', 'פריוריטי', 'חשבשבת', 'סאפ', 'SAP',
  'דוחות כספיים', 'התאמות בנק', 'ספקים', 'לקוחות',
  'תשלומים', 'גבייה', 'finance', 'פיננסי', 'כספים',
  'אשדוד', 'חיפה', 'מזון', 'אפייה', 'מאפייה'
]

// תגיות לחשבת שכר
const PAYROLL_TAGS = [
  'חשבת שכר', 'payroll', 'שכר', 'משכורות', 'תלושי שכר',
  'ביטוח לאומי', 'מס הכנסה', 'פנסיה', 'קרן השתלמות',
  'נוכחות', 'שעות נוספות', 'חופשות', 'מחלות', 'הפרשות',
  'עובדים', 'HR', 'משאבי אנוש', 'תנאי העסקה',
  'קומפי', 'מיכפל', 'הרמוניה', 'חילן', 'מלם שכר',
  'דיווחים', 'אקסל', 'excel', 'דיוק', 'סדר',
  'אשדוד', 'חיפה', 'מזון', 'אפייה', 'מאפייה'
]

// תגיות למחסנאי ממוחשב
const WAREHOUSE_TAGS = [
  'מחסנאי', 'warehouse', 'מחסן', 'לוגיסטיקה', 'logistics',
  'ממוחשב', 'מערכת ניהול מלאי', 'WMS', 'פריוריטי', 'SAP',
  'סריקה', 'ברקוד', 'מלאי', 'קבלת סחורה', 'הכנת הזמנות',
  'משמרות', 'לילה', 'משמרת לילה', 'שעות גמישות',
  'סידור מדפים', 'ליקוט', 'אריזה', 'משלוחים',
  'כוח פיזי', 'עבודה עומדת', 'מלגזה', 'סבלות',
  'אשדוד', 'חיפה', 'מזון', 'אפייה', 'מאפייה', 'קירור'
]

// פונקציה ליצירה/עדכון משרה
async function upsertPosition(
  employerId: string, 
  title: string, 
  data: {
    description: string
    requirements: string
    location: string
    salaryRange: string
  },
  tagIds: string[]
) {
  const existing = await prisma.position.findFirst({
    where: { employerId, title }
  })

  if (existing) {
    return prisma.position.update({
      where: { id: existing.id },
      data: {
        ...data,
        active: true,
        tags: { set: tagIds.map(id => ({ id })) }
      }
    })
  } else {
    return prisma.position.create({
      data: {
        title,
        ...data,
        active: true,
        employerId,
        tags: { connect: tagIds.map(id => ({ id })) }
      }
    })
  }
}

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()
    
    if (adminKey !== 'twenty2boutik2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🥙 מוסיף משרות חדשות לבוטיק הפיתה - מרץ 2026...')

    // מציאת מעסיק בוטיק הפיתה
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'בוטיק הפיתה' } },
          { name: { contains: 'Boutik' } },
          { name: { contains: 'פיתה' } }
        ]
      }
    })

    if (!employer) {
      console.log('⚠️ יוצר מעסיק חדש: בוטיק הפיתה')
      employer = await prisma.employer.create({
        data: {
          name: 'בוטיק הפיתה',
          email: '',
          phone: '',
          description: '🥙 מאפיית בוטיק איכותית. סניפים באשדוד וחיפה. מוצרי אפייה טריים ואיכותיים!'
        }
      })
    }

    console.log(`✅ נמצא/נוצר מעסיק: ${employer.name} (ID: ${employer.id})`)

    // יצירת תגיות
    const accountantTags = await Promise.all(
      ACCOUNTANT_TAGS.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    )
    const accountantTagIds = accountantTags.map(t => t.id)

    const payrollTags = await Promise.all(
      PAYROLL_TAGS.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    )
    const payrollTagIds = payrollTags.map(t => t.id)

    const warehouseTags = await Promise.all(
      WAREHOUSE_TAGS.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    )
    const warehouseTagIds = warehouseTags.map(t => t.id)

    const createdPositions = []

    // 1. מנהלת חשבונות
    const accountantPosition = await upsertPosition(
      employer.id,
      'מנהל/ת חשבונות',
      {
        description: `📊 מנהל/ת חשבונות לרשת בוטיק הפיתה!

🏢 אודות התפקיד:
• ניהול מלא של מערך הנהלת החשבונות
• הפקת דוחות כספיים ומעקב תזרימי
• עבודה מול רואה חשבון ויועצי מס
• ניהול ספקים, לקוחות והתאמות בנק
• הכנת דוחות מע"מ וביטוח לאומי
• עבודה עם מערכות ERP (פריוריטי/חשבשבת)

💼 מה מציעים?
• סביבת עבודה נעימה ומשפחתית
• יציבות תעסוקתית בחברה מבוססת
• אפשרויות קידום והתפתחות
• עבודה בשעות נוחות

⏰ שעות עבודה: 8:00-16:00 (א'-ה')`,
        requirements: `✅ דרישות:
• ניסיון של 3+ שנים בהנהלת חשבונות - חובה
• שליטה באקסל ברמה גבוהה
• ניסיון במערכות ERP (פריוריטי/חשבשבת/SAP)
• ידע בחוקי מס ותקנות
• דיוק, אחריות ויכולת עבודה עצמאית
• יחסי אנוש טובים ועבודת צוות

📍 מיקום: אשדוד / חיפה`,
        location: 'אשדוד, חיפה והסביבה',
        salaryRange: '12,000-13,000 ₪'
      },
      accountantTagIds
    )
    createdPositions.push(accountantPosition)
    console.log(`✅ נוצרה משרה: ${accountantPosition.title}`)

    // 2. חשבת שכר
    const payrollPosition = await upsertPosition(
      employer.id,
      'חשב/ת שכר',
      {
        description: `💰 חשב/ת שכר לרשת בוטיק הפיתה!

🏢 אודות התפקיד:
• ניהול שכר מלא ל-230 עובדים
• הפקת תלושי שכר חודשיים
• חישוב שעות נוספות, חופשות ומחלות
• דיווחים לביטוח לאומי ומס הכנסה
• ניהול הפרשות פנסיה וקרן השתלמות
• מענה לעובדים בנושאי שכר

💼 מה מציעים?
• גמישות בשעות העבודה!
• סביבת עבודה נעימה ומשפחתית
• יציבות תעסוקתית
• עבודה מול צוות HR תומך

⏰ שעות עבודה: 8:00-14:00 (גמישות בשעות!)`,
        requirements: `✅ דרישות:
• ניסיון של 2+ שנים כחשב/ת שכר - חובה
• ניסיון בניהול שכר ל-100+ עובדים - יתרון
• שליטה בתוכנות שכר (מיכפל/הרמוניה/חילן)
• ידע בחוקי עבודה ותקנות שכר
• דיוק קפדני ויכולת עמידה בלוחות זמנים
• שליטה באקסל
• סדר וארגון

📍 מיקום: אשדוד / חיפה`,
        location: 'אשדוד, חיפה והסביבה',
        salaryRange: '12,000 ₪'
      },
      payrollTagIds
    )
    createdPositions.push(payrollPosition)
    console.log(`✅ נוצרה משרה: ${payrollPosition.title}`)

    // 3. מחסנאי ממוחשב
    const warehousePosition = await upsertPosition(
      employer.id,
      'מחסנאי/ת ממוחשב/ת',
      {
        description: `📦 מחסנאי/ת ממוחשב/ת לבוטיק הפיתה!

🏭 אודות התפקיד:
• ניהול מלאי במערכת ממוחשבת
• קבלת סחורה וסידור במחסן
• ליקוט והכנת הזמנות
• סריקת ברקודים ועדכון מערכת
• שמירה על סדר וניקיון במחסן
• עבודה בסביבת קירור (מוצרי מזון)

💰 תנאים מעולים:
• שעות יום: 50 ₪ לשעה
• שעות לילה: 75 ₪ לשעה! 🌙
• תנאים סוציאליים מלאים

⏰ משמרות גמישות - יום ולילה`,
        requirements: `✅ דרישות:
• ניסיון במחסנאות - יתרון
• יכולת עבודה עם מחשב ומערכות ניהול מלאי
• כושר פיזי טוב ויכולת עבודה עומדת
• נכונות לעבודה במשמרות (כולל לילה)
• אחריות, דיוק וסדר
• יכולת עבודה בסביבת קירור

📍 מיקום: אשדוד / חיפה`,
        location: 'אשדוד, חיפה והסביבה',
        salaryRange: '50 ₪/שעה (יום) | 75 ₪/שעה (לילה)'
      },
      warehouseTagIds
    )
    createdPositions.push(warehousePosition)
    console.log(`✅ נוצרה משרה: ${warehousePosition.title}`)

    return NextResponse.json({
      success: true,
      message: `נוספו ${createdPositions.length} משרות חדשות לבוטיק הפיתה`,
      employer: {
        id: employer.id,
        name: employer.name
      },
      positions: createdPositions.map(p => ({
        id: p.id,
        title: p.title,
        location: p.location,
        salaryRange: p.salaryRange
      }))
    })

  } catch (error) {
    console.error('❌ Error adding Boutik positions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add Boutik positions', details: errorMessage },
      { status: 500 }
    )
  }
}
