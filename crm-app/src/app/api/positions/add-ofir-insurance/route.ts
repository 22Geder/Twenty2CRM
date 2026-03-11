import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/positions/add-ofir-insurance
 * הוספת מעסיק ומשרה חדשים - אופיר סוכנויות לביטוח
 * סוכן/ת מכירות ביטוח - אשדוד
 */

// תגיות למשרת מכירות ביטוח
const INSURANCE_SALES_TAGS = [
  'מכירות', 'sales', 'ביטוח', 'insurance', 'סוכן ביטוח',
  'ביטוח חיים', 'ביטוח בריאות', 'ביטוח משכנתא', 'פוליסות',
  'מכירות טלפוניות', 'telesales', 'לידים', 'leads',
  'עמלות', 'commission', 'יעדים', 'targets',
  'שכנוע', 'תודעת שירות', 'יחסי אנוש',
  'פיננסי', 'finance', 'פנסיה', 'pension',
  'אשדוד', 'דרום', 'משרה מלאה',
  'קידום', 'פרילנסר', 'אווירה משפחתית'
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
    
    if (adminKey !== 'twenty2ofir2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🛡️ מוסיף מעסיק ומשרה - אופיר סוכנויות לביטוח...')

    // מציאת או יצירת מעסיק
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'אופיר' } },
          { name: { contains: 'Ofir' } }
        ]
      }
    })

    if (!employer) {
      console.log('⚠️ יוצר מעסיק חדש: אופיר סוכנויות לביטוח')
      employer = await prisma.employer.create({
        data: {
          name: 'אופיר סוכנויות לביטוח',
          email: '',
          phone: '',
          description: '🛡️ סוכנות ביטוח מובילה באשדוד. התמחות בביטוחי חיים, בריאות ומשכנתא. אווירה משפחתית ותנאים מעולים!'
        }
      })
    }

    console.log(`✅ נמצא/נוצר מעסיק: ${employer.name} (ID: ${employer.id})`)

    // יצירת תגיות
    const tags = await Promise.all(
      INSURANCE_SALES_TAGS.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    )
    const tagIds = tags.map(t => t.id)

    const createdPositions = []

    // משרת סוכן/ת מכירות ביטוח
    const salesPosition = await upsertPosition(
      employer.id,
      'סוכן/ת מכירות ביטוח',
      {
        description: `🛡️ סוכנות ביטוח מובילה באשדוד מגייסת תותחי/ות מכירות לנבחרת מנצחת!

🎯 תיאור התפקיד:
• מכירת פוליסות ביטוח חיים, בריאות ומשכנתא
• עבודה עם לידים איכותיים וחמים בלבד!
• ניהול תהליך המכירה מקצה לקצה
• ליווי ותמיכה מקצועית צמודה
• סביבה דינמית, צעירה ואנרגטית

💰 שכר ותנאים מפנקים:
• פוטנציאל שכר: 15,000-20,000 ₪ ומעלה! 🚀
• לידים איכותיים ללא הגבלה
• ערבי צוות וטיסות לחו"ל!
• אווירה משפחתית ותומכת
• אופק קידום עד לניהול תיק פרילנסר

⏰ שעות עבודה: א'-ה' 09:30-16:00
(איזון מושלם בין עבודה לבית!)`,
        requirements: `✅ דרישות:
• ניסיון מוכח במכירות טלפוניות - חובה!
• ניסיון בביטוחי חיים/בריאות/משכנתא - יתרון משמעותי
• תודעת שירות גבוהה
• יכולת שכנוע ו"ראש גדול"
• רעב להצלחה והישגיות
• אוריינטציה מכירתית חזקה
• יכולת עמידה ביעדים

🔥 מחפשים אנשים עם רעב להצליח!`,
        location: 'אשדוד - דרום',
        salaryRange: '15,000-20,000 ₪ + עמלות (ללא תקרה!)'
      },
      tagIds
    )
    createdPositions.push(salesPosition)
    console.log(`✅ נוצרה משרה: ${salesPosition.title}`)

    return NextResponse.json({
      success: true,
      message: `נוצר מעסיק חדש ונוספה משרה לאופיר סוכנויות לביטוח`,
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
    console.error('❌ Error adding Ofir Insurance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add Ofir Insurance', details: errorMessage },
      { status: 500 }
    )
  }
}
