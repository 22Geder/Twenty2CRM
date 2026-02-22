import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// API להוספת לקוח קשרי גל ים ומשרת טלימאן
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (key !== 'twenty2galyam2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. חיפוש או יצירת המעסיק
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'קשרי גל ים' } },
          { name: { contains: 'גל ים' } }
        ]
      }
    })

    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'קשרי גל ים',
          email: 'jobs@kishreygalyam.co.il',
          phone: '',
          description: 'חברת קשרי גל ים - שירותי לוגיסטיקה ונמל חיפה'
        }
      })
    }

    // 2. יצירת/מציאת תגיות
    const tagNames = [
      'לוגיסטיקה', 'נמל', 'חיפה', 'משאיות', 'רישום', 
      'תפעול', 'משרה מלאה', 'ללא ניסיון'
    ]

    const tags: { [key: string]: any } = {}
    const tagColors: { [key: string]: string } = {
      'לוגיסטיקה': '#3B82F6',
      'נמל': '#0EA5E9',
      'חיפה': '#10B981',
      'משאיות': '#F59E0B',
      'רישום': '#8B5CF6',
      'תפעול': '#EC4899',
      'משרה מלאה': '#22C55E',
      'ללא ניסיון': '#14B8A6'
    }

    for (const tagName of tagNames) {
      let tag = await prisma.tag.findFirst({ where: { name: tagName } })
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: tagName, color: tagColors[tagName] || '#6B7280' }
        })
      }
      tags[tagName] = tag
    }

    // 3. יצירת המשרה - טלימאן
    const existingPosition = await prisma.position.findFirst({
      where: {
        title: { contains: 'טלימאן' },
        employerId: employer.id
      }
    })

    const description = `טלימאן/ית בנמל חיפה - קשרי גל ים

📍 מיקום: נמל חיפה

תיאור התפקיד:
אחריות על רישום ותיעוד משאיות שכורות הנכנסות ויוצאות מהנמל.

תחומי אחריות:
• רישום משאיות שכורות הנכנסות לנמל
• תיעוד פרטי המשאית, הנהג והמטען
• מעקב אחר תנועת משאיות בשטח הנמל
• עבודה מול מערכות ממוחשבות
• קשר עם נהגים וחברות ההובלה
• דיווח ותיעוד שוטף

טלימאן הוא תפקיד מרכזי בתפעול הנמלי, המבטיח שכל משאית שכורה שנכנסת לנמל מתועדת כראוי ועומדת בתקנות.`

    const requirements = `דרישות התפקיד:
• דייקנות ואחריות
• יכולת עבודה עם מחשב
• סדר וארגון
• יכולת עבודה בסביבה דינמית
• עברית - שפת אם
• ניסיון בתפקיד דומה - יתרון
• רישיון נהיגה - יתרון`

    const aiProfile = {
      role: 'טלימאן/ית - רישום משאיות',
      industry: 'לוגיסטיקה ונמלים',
      skills: ['רישום', 'תיעוד', 'עבודה עם מחשב', 'דייקנות', 'סדר וארגון'],
      experience: 'ניסיון בתפקיד דומה - יתרון',
      location: 'נמל חיפה',
      workDays: 'א-ה',
      benefits: ['תנאים טובים', 'סביבת עבודה דינמית'],
      keywords: ['טלימאן', 'נמל חיפה', 'משאיות', 'רישום', 'לוגיסטיקה', 'תפעול נמלי', 'גל ים']
    }

    let position
    if (existingPosition) {
      position = await prisma.position.update({
        where: { id: existingPosition.id },
        data: {
          active: true,
          description,
          requirements,
          location: 'נמל חיפה',
          salaryRange: 'לפי סיכום',
          employmentType: 'משרה מלאה',
          keywords: JSON.stringify(['טלימאן', 'נמל חיפה', 'משאיות', 'רישום', 'לוגיסטיקה', 'גל ים', 'שכירת משאיות', 'תפעול נמלי']),
          benefits: 'תנאים טובים, סביבת עבודה דינמית',
          aiProfile: JSON.stringify(aiProfile)
        },
        include: { employer: true }
      })
    } else {
      position = await prisma.position.create({
        data: {
          title: 'טלימאן/ית - רישום משאיות שכורות',
          description,
          requirements,
          location: 'נמל חיפה',
          salaryRange: 'לפי סיכום',
          employmentType: 'משרה מלאה',
          employerId: employer.id,
          active: true,
          keywords: JSON.stringify(['טלימאן', 'נמל חיפה', 'משאיות', 'רישום', 'לוגיסטיקה', 'גל ים', 'שכירת משאיות', 'תפעול נמלי']),
          benefits: 'תנאים טובים, סביבת עבודה דינמית',
          aiProfile: JSON.stringify(aiProfile),
          tags: {
            connect: Object.values(tags).map((t: any) => ({ id: t.id }))
          }
        },
        include: { employer: true }
      })
    }

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        name: employer.name
      },
      position: {
        id: position.id,
        title: position.title,
        location: position.location,
        active: position.active
      },
      tagsCreated: Object.keys(tags).length
    })
  } catch (error) {
    console.error('Error adding Kishrey Gal Yam:', error)
    return NextResponse.json(
      { error: 'Failed to add employer/position', details: String(error) },
      { status: 500 }
    )
  }
}
