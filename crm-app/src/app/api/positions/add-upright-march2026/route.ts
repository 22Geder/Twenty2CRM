import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/positions/add-upright-march2026
 * הוספת משרות חדשות לאופרייט - מרץ 2026
 * 1. נציג/ת שירות לקוחות - מוקד ארצי חיפה
 * 2. נציג/ת מכירות יד ראשונה - גלילות, אשדוד, באר שבע
 */

// תגיות למשרת שירות לקוחות
const SERVICE_TAGS = [
  'שירות לקוחות', 'customer service', 'מוקד שירות', 'call center',
  'נציג שירות', 'מענה טלפוני', 'תקשורת', 'סבלנות',
  'רכב', 'automotive', 'אווירה משפחתית', 'בונוסים',
  'משמרות', 'סיבוס', 'חיפה', 'קריות', 'לב המפרץ'
]

// תגיות למשרת מכירות
const SALES_TAGS = [
  'מכירות', 'sales', 'נציג מכירות', 'מכירות פרונטליות',
  'עמלות', 'יעדים', 'רכב', 'automotive', 'יד ראשונה',
  'משא ומתן', 'שכנוע', 'אנרגטי', 'מוטיבציה',
  'גלילות', 'אשדוד', 'באר שבע', 'ליסינג'
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
  // חיפוש משרה קיימת
  const existing = await prisma.position.findFirst({
    where: { employerId, title }
  })

  if (existing) {
    // עדכון משרה קיימת
    return prisma.position.update({
      where: { id: existing.id },
      data: {
        ...data,
        active: true,
        tags: { set: tagIds.map(id => ({ id })) }
      }
    })
  } else {
    // יצירת משרה חדשה
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
    
    if (adminKey !== 'twenty2upright2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚗 מוסיף משרות חדשות לאופרייט - מרץ 2026...')

    // מציאת מעסיק אופרייט
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'אופרייט' } },
          { name: { contains: 'Operait' } }
        ]
      }
    })

    if (!employer) {
      console.log('⚠️ יוצר מעסיק חדש: אופרייט')
      employer = await prisma.employer.create({
        data: {
          name: 'אופרייט - יד ראשונה (Operait)',
          email: 'liatg@opl.co.il',
          phone: '',
          description: '🚘 מכירת רכבים וליסינג פרטי. סניפים ברחבי הארץ. עמלות גבוהות ותנאים מעולים!'
        }
      })
    }

    console.log(`✅ נמצא/נוצר מעסיק: ${employer.name} (ID: ${employer.id})`)

    // יצירת/עדכון תגיות שירות
    const serviceTags = await Promise.all(
      SERVICE_TAGS.map(async (tagName) => {
        return prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      })
    )
    const serviceTagIds = serviceTags.map(t => t.id)

    // יצירת/עדכון תגיות מכירות
    const salesTags = await Promise.all(
      SALES_TAGS.map(async (tagName) => {
        return prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      })
    )
    const salesTagIds = salesTags.map(t => t.id)

    const createdPositions = []

    // 1. משרת שירות לקוחות - מוקד ארצי חיפה
    const servicePosition = await upsertPosition(
      employer.id,
      'נציג/ת שירות לקוחות - מוקד ארצי',
      {
        description: `מוקד השירות הארצי שלנו ממוקם מול לב המפרץ (חיפה) 🏢
מוקד משפחתי המונה כ-23 נציגים באווירה חמה ותומכת.

📞 במסגרת התפקיד:
• מענה טלפוני ללקוחות בנוגע לתפעול ואחזקת הרכבים
• טיפול בפניות לקוחות ומתן מענה מקצועי
• עבודה בסביבה דינמית ומשפחתית

💰 תנאים מעולים:
• שכר בסיס: 7,000 ₪ ברוטו
• ש"נ בימי שישי (לסירוגין)
• בונוסים על יעדי שירות: 1,000-2,000 ₪ בחודש!
• סיבוס לקניית ארוחות
• מענק 7,000 ₪ בתום שנת עבודה ראשונה!
• נופשים בארץ ובחו"ל פעם בשנה
• מתנות בחגים וימי הולדת

🚖 מונית הביתה לאחר משמרת ערב על חשבון החברה!`,
        requirements: `✅ דרישות:
• זמינות למשרה מלאה
• משמרות בוקר: 7:00-16:00 או 8:00-17:00
• משמרת ערב אחת בשבוע: 14:00-23:00
• ניסיון במוקדי שירות לקוחות - יתרון משמעותי
• יכולת עבודה בצוות ואווירה משפחתית
• סבלנות ויחס אישי ללקוחות

📍 מועמדים מהקריות וחיפה - בעדיפות!`,
        location: 'חיפה - לב המפרץ, קריות והסביבה',
        salaryRange: '7,000 ₪ + בונוסים 1,000-2,000 ₪ + מענק שנתי 7,000 ₪'
      },
      serviceTagIds
    )
    createdPositions.push(servicePosition)
    console.log(`✅ נוצרה משרה: ${servicePosition.title}`)

    // תבנית לתיאור משרת מכירות
    const salesDescription = `🚗 מחפשים נציגי/ות מכירות מצוינים וחרוצים להובלת תהליכי מכירה מלאים!

🎯 מה אנחנו מחפשים?
• רעב להצליח עם הרבה מוטיבציה!
• אנרגטיים ואקטיביים
• יכולת להוביל תהליך מכירה מ-א' עד ת'

💰 תנאים מעולים - אין תקרה!
• שכר חודשי: 14,000-17,000 ₪ ברוטו (ויותר!)
• עמלה ממוצעת למכירת רכב: 640 ₪ (בדרך כלל יותר!)
• תגמול מהרכב הראשון!
• הגנת שכר 8,000 ₪ ב-3 חודשים ראשונים (במידת הצורך)
• ממוצע: 15 רכבים לנציג בחודש
• 3-5 נציגים בסניף

📅 שעות עבודה:
• א'-ה': 8:30-18:00
• ו': 8:30-13:30`

    const salesRequirements = `✅ דרישות:
• ניסיון במכירות פרונטליות - חובה!
• ניסיון מענף הרכב - יתרון משמעותי
• יכולת משא ומתן ושכנוע
• אנרגיה גבוהה ומוטיבציה להצלחה
• נכונות לעבודה 6 ימים בשבוע`

    const salesSalary = '14,000-17,000 ₪ + עמלות גבוהות (אין תקרה!)'

    // 2. משרת מכירות - גלילות
    const salesGalilot = await upsertPosition(
      employer.id,
      'נציג/ת מכירות יד ראשונה - סניף גלילות',
      {
        description: salesDescription,
        requirements: salesRequirements,
        location: 'גלילות - מרכז',
        salaryRange: salesSalary
      },
      salesTagIds
    )
    createdPositions.push(salesGalilot)
    console.log(`✅ נוצרה משרה: ${salesGalilot.title}`)

    // 3. משרת מכירות - אשדוד
    const salesAshdod = await upsertPosition(
      employer.id,
      'נציג/ת מכירות יד ראשונה - סניף אשדוד',
      {
        description: salesDescription,
        requirements: salesRequirements,
        location: 'אשדוד - דרום',
        salaryRange: salesSalary
      },
      salesTagIds
    )
    createdPositions.push(salesAshdod)
    console.log(`✅ נוצרה משרה: ${salesAshdod.title}`)

    // 4. משרת מכירות - באר שבע
    const salesBeerSheva = await upsertPosition(
      employer.id,
      'נציג/ת מכירות יד ראשונה - סניף באר שבע',
      {
        description: salesDescription,
        requirements: salesRequirements,
        location: 'באר שבע - דרום',
        salaryRange: salesSalary
      },
      salesTagIds
    )
    createdPositions.push(salesBeerSheva)
    console.log(`✅ נוצרה משרה: ${salesBeerSheva.title}`)

    return NextResponse.json({
      success: true,
      message: `נוספו ${createdPositions.length} משרות חדשות לאופרייט`,
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
    console.error('❌ Error adding Upright positions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add Upright positions', details: errorMessage },
      { status: 500 }
    )
  }
}
