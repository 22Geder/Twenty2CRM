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

// =========================================================================
// GET - sync Oshpir tags (piggybacked on this route to avoid deploy caching)
// Usage: GET /api/admin/sync-barosh-iron?oshpir=1
// =========================================================================
const OSHPIR_TAGS = [
  'שילוח בינלאומי', 'יבוא', 'יצוא', 'מכס', 'סוכן מכס', 'ספנות',
  'תיאום שילוח', 'אנגלית', 'אנגלית ברמה גבוהה', 'פוקוס', 'תוכנת פוקוס',
  'תיאום', 'אדמיניסטרציה', 'עבודה מול ספקים', 'עבודה מול לקוחות',
  'תיעוד', 'חיפה', 'צפון', 'משרה מלאה',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('oshpir') !== '1') {
    return NextResponse.json({ error: 'use ?oshpir=1' }, { status: 400 })
  }

  try {
    const employer = await prisma.employer.findFirst({
      where: { name: { contains: 'אושפיר', mode: 'insensitive' } },
    })
    if (!employer) return NextResponse.json({ error: 'אושפיר לא נמצא' }, { status: 404 })

    const positions = await prisma.position.findMany({
      where: { employerId: employer.id },
      include: { tags: true },
    })
    if (positions.length === 0) return NextResponse.json({ error: 'אין משרות' }, { status: 404 })

    const tagConnects = {
      connectOrCreate: OSHPIR_TAGS.map(tag => ({
        where: { name: tag },
        create: { name: tag, color: '#0ea5e9' },
      })),
    }

    const updated: string[] = []
    for (const pos of positions) {
      const isImport = pos.title.includes('יבוא')
      await prisma.position.update({
        where: { id: pos.id },
        data: {
          active: true,
          workHours: 'משרה מלאה',
          contactName: 'ריקי כהן',
          contactEmail: 'oshpir@oshpir.co.il',
          keywords: JSON.stringify(
            isImport
              ? ['שילוח בינלאומי', 'יבוא', 'מכס', 'ספנות', 'אנגלית', 'פוקוס', 'חיפה', 'תיאום', 'Import coordinator']
              : ['שילוח בינלאומי', 'יצוא', 'מכס', 'ספנות', 'אנגלית', 'פוקוס', 'חיפה', 'תיאום', 'Export coordinator']
          ),
          tags: tagConnects,
        },
      })
      updated.push(pos.title)
    }

    return NextResponse.json({
      success: true,
      employer: employer.name,
      updated: updated.length,
      positions: updated,
      tagsAdded: OSHPIR_TAGS.length,
      tags: OSHPIR_TAGS,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
