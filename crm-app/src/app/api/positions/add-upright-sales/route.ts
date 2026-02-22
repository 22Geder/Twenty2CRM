import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/positions/add-upright-sales
 * הוספת משרות מכירות לאופרייט - יד ראשונה
 */

const SALES_KEYWORDS = [
  'מכירות', 'רכב', 'יד ראשונה', 'עמלות', 'שירות לקוחות', 
  'מכירת רכבים', 'סוכן מכירות', 'יועץ מכירות', 'אנשי מכירות',
  'אופרייט', 'operait', 'משא ומתן', 'יעדים', 'עמלה',
  'מכירות שטח', 'מכירות רכבים', 'תחום הרכב', 'אולם תצוגה'
]

const NEW_POSITIONS = [
  {
    title: 'איש/אשת מכירות רכבים - יד ראשונה גלילות',
    location: 'גלילות',
    description: `🚗 למחלקת יד ראשונה דרוש/ה איש/אשת מכירות לסניף גלילות!

📋 תחומי אחריות:
• מכירת רכבים חדשים ללקוחות פרטיים
• ייעוץ וליווי לקוחות בתהליך הרכישה
• עמידה ביעדי מכירות
• שירות לקוחות מצוין
• בניית קשרי לקוחות ארוכי טווח

📊 נתונים:
• ממוצע מכירות לנציג: 15-18 רכבים בחודש

💰 שכר ותנאים:
• שכר בסיס: 6,050 ₪
• עמלה: 640 ₪ לרכב (מהרכב הראשון!)
• הגנת שכר: 8,000 ₪ ב-3 חודשים ראשונים!
• ממוצע שכר: 8,000-15,000 ₪
• שעות נוספות משולמות

⏰ שעות עבודה:
• א'-ה' + שישי בוקר`,
    requirements: `📋 דרישות התפקיד:
• ניסיון במכירות - יתרון משמעותי
• יכולת עבודה בצוות
• שירותיות ויחסי אנוש מעולים
• יכולת משא ומתן
• נכונות לעבודה בימי שישי
• רישיון נהיגה - יתרון`,
    salaryRange: '8,000-15,000 ₪ (עמלה 640 ₪ לרכב)',
    employmentType: 'משרה מלאה',
    keywords: [...SALES_KEYWORDS, 'גלילות'].join(', '),
  },
  {
    title: 'איש/אשת מכירות רכבים - יד ראשונה חדרה',
    location: 'חדרה',
    description: `🚗 למחלקת יד ראשונה דרוש/ה איש/אשת מכירות לסניף חדרה!

📋 תחומי אחריות:
• מכירת רכבים חדשים ללקוחות פרטיים
• ייעוץ וליווי לקוחות בתהליך הרכישה
• עמידה ביעדי מכירות
• שירות לקוחות מצוין
• בניית קשרי לקוחות ארוכי טווח

📊 נתונים:
• ממוצע מכירות לנציג: 15-18 רכבים בחודש

💰 שכר ותנאים:
• שכר בסיס: 6,050 ₪
• עמלה: 640 ₪ לרכב (מהרכב הראשון!)
• הגנת שכר: 8,000 ₪ ב-3 חודשים ראשונים!
• ממוצע שכר: 8,000-15,000 ₪
• שעות נוספות משולמות

⏰ שעות עבודה:
• א'-ה' + שישי בוקר`,
    requirements: `📋 דרישות התפקיד:
• ניסיון במכירות - יתרון משמעותי
• יכולת עבודה בצוות
• שירותיות ויחסי אנוש מעולים
• יכולת משא ומתן
• נכונות לעבודה בימי שישי
• רישיון נהיגה - יתרון`,
    salaryRange: '8,000-15,000 ₪ (עמלה 640 ₪ לרכב)',
    employmentType: 'משרה מלאה',
    keywords: [...SALES_KEYWORDS, 'חדרה', 'צפון', 'שרון'].join(', '),
  }
]

export async function POST(request: NextRequest) {
  // בדיקת הרשאות
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('key')
  
  if (adminKey !== 'twenty2upright2026') {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    console.log('🚗 מוסיף משרות מכירות לאופרייט - יד ראשונה...')

    // מציאת מעסיק אופרייט
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'אופרייט' } },
          { name: { contains: 'operait', mode: 'insensitive' } },
          { name: { contains: 'יד ראשונה' } },
        ]
      }
    })

    if (!employer) {
      console.log('⚠️ יוצר מעסיק חדש: אופרייט - יד ראשונה')
      employer = await prisma.employer.create({
        data: {
          name: 'אופרייט - יד ראשונה (Operait)',
          contactEmail: 'liatg@opl.co.il',
          contactName: 'ליאת',
          phone: '',
          notes: `חברת יד ראשונה - מכירת רכבים וליסינג
סניפים: גלילות, חולון, חדרה

תנאים לאנשי מכירות:
• שכר בסיס: 6,050 ₪
• עמלה: 640 ₪ לרכב (מהראשון!)
• הגנת שכר: 8,000 ₪ ל-3 חודשים
• ממוצע מכירות: 15-18 רכבים/חודש`
        }
      })
    }
    console.log(`✅ מעסיק: ${employer.name} (ID: ${employer.id})`)

    const createdPositions: string[] = []
    const skippedPositions: string[] = []

    // יצירת המשרות
    for (const pos of NEW_POSITIONS) {
      // בדיקה אם המשרה כבר קיימת
      const existing = await prisma.position.findFirst({
        where: {
          title: pos.title,
          employerId: employer.id
        }
      })

      if (existing) {
        console.log(`⚠️ משרה כבר קיימת: ${pos.title}`)
        skippedPositions.push(pos.title)
        continue
      }

      await prisma.position.create({
        data: {
          title: pos.title,
          location: pos.location,
          description: pos.description,
          requirements: pos.requirements,
          salaryRange: pos.salaryRange,
          employmentType: pos.employmentType,
          keywords: pos.keywords,
          active: true,
          employerId: employer.id,
          contactEmail: 'liatg@opl.co.il',
          contactName: 'ליאת',
        }
      })

      console.log(`✅ נוצרה משרה: ${pos.title}`)
      createdPositions.push(pos.title)
    }

    return NextResponse.json({
      success: true,
      message: `נוספו ${createdPositions.length} משרות מכירות לאופרייט`,
      employer: employer.name,
      created: createdPositions,
      skipped: skippedPositions,
      totalNew: createdPositions.length
    })

  } catch (error: unknown) {
    console.error('❌ שגיאה:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add Upright sales positions', details: errorMessage },
      { status: 500 }
    )
  }
}

// GET לנוחות
export async function GET(request: NextRequest) {
  return POST(request)
}
