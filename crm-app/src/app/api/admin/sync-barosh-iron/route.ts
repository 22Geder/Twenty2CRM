import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TAGS = [
  // מחסנאי
  'מחסנאי', 'מחסן', 'קבלת סחורה', 'ספירת מלאי', 'פיקינג',
  'אריזה', 'העמסה ופריקה', 'ניהול מלאי', 'ספרי מלאי',
  // שירות לקוחות - ללא ניסיון
  'שירות לקוחות', 'עבודה מול לקוחות', 'קבלת קהל', 'מכירות בדלפק',
  'מכירות', 'מכירות פנים', 'הצעות מחיר', 'תמיכה טלפונית',
  'תיאום ואדמיניסטרציה', 'ללא ניסיון', 'מתחילים מוזמנים',
  'הכשרה במקום', 'כניסה לתחום', 'עבודה ראשונה',
  // תחום ברזל ובניה
  'חומרי בניה', 'מוצרי פלדה', 'ברזל', 'מסחר', 'עבודה פיזית', 'עבודה בשטח',
  // כללי / מיקום
  'עובד דלפק', 'עובד מחסן', 'משמרות', 'גמישות בשעות',
  'אשדוד', 'דרום', 'קרית גת', 'שפלה',
]

const KEYWORDS = 'עובד דלפק, מחסנאי, שירות לקוחות, קבלת קהל, מכירות בדלפק, מכירות פנים, עבודה מול לקוחות, ספירת מלאי, קבלת סחורה, פיקינג, אריזה, העמסה, חומרי בניה, ברזל, מוצרי פלדה, הצעות מחיר, ללא ניסיון, מתחילים מוזמנים, הכשרה במקום, כניסה לתחום, עבודה פיזית, גמישות בשעות, אשדוד, 45-50 לשעה, שכר שעתי, משרה מלאה, דרום'

export async function POST() {
  try {
    // 1. מעסיק
    let employer = await prisma.employer.findFirst({
      where: { name: { contains: 'ברוש', mode: 'insensitive' } },
    })
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'ברוש סחר בברזל',
          email: 'jobs@barosh-iron.co.il',
          description: 'ברוש סחר בברזל - אשדוד. חומרי בניה ומוצרי פלדה.',
        },
      })
    }

    const tagConnects = {
      connectOrCreate: TAGS.map(tag => ({
        where: { name: tag },
        create: { name: tag, color: '#6366f1' },
      })),
    }

    const positionData = {
      title: 'עובד/ת דלפק ומחסן',
      description: `עבודה בדלפק מכירות ומחסן – קבלת לקוחות, הוצאת סחורה, ספירת מלאי וסיוע בהעמסה.\nתחום ברזל וחומרי בניה.\n\n✅ לא נדרש ניסיון קודם! הכשרה מלאה במקום.\nמתאים גם למתחילים ולמחפשי עבודה ראשונה.`,
      requirements: `• ניסיון בשירות לקוחות או מחסן — יתרון בלבד, לא חובה!\n• נכונות לעבודה פיזית\n• גמישות בשעות\n• תושב/ת אשדוד והסביבה — יתרון`,
      salaryRange: '45-50 ₪ לשעה',
      workHours: 'משמרות, ימים א-ה',
      location: 'אשדוד',
      keywords: KEYWORDS,
      active: true,
      employerId: employer.id,
    }

    // 2. משרה — מצא קיים או צור חדש
    const existing = await prisma.position.findFirst({
      where: { title: positionData.title, employerId: employer.id },
    })

    let position
    let action: string
    if (existing) {
      position = await prisma.position.update({
        where: { id: existing.id },
        data: { ...positionData, tags: tagConnects },
        include: { tags: true },
      })
      action = 'updated'
    } else {
      position = await prisma.position.create({
        data: { ...positionData, tags: tagConnects },
        include: { tags: true },
      })
      action = 'created'
    }

    const totalActive = await prisma.position.count({ where: { active: true } })

    return NextResponse.json({
      success: true,
      employer: employer.name,
      position: position.title,
      location: position.location,
      salaryRange: position.salaryRange,
      tagsCount: position.tags.length,
      action,
      totalActivePositions: totalActive,
    })
  } catch (error: any) {
    console.error('sync-barosh-iron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
