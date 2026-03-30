import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TAGS = [
  // מחסנאי
  'מחסנאי', 'מחסן', 'קבלת סחורה', 'ספירת מלאי', 'פיקינג',
  'אריזה', 'העמסה ופריקה', 'ניהול מלאי', 'ספרי מלאי', 'רישיון מלגזה',
  // שירות לקוחות
  'שירות לקוחות', 'עבודה מול לקוחות', 'קבלת קהל', 'מכירות בדלפק',
  'מכירות', 'מכירות פנים', 'הצעות מחיר', 'תמיכה טלפונית',
  'תיאום ואדמיניסטרציה',
  // תחום ברזל ובניה
  'חומרי בניה', 'מוצרי פלדה', 'ברזל', 'מסחר', 'עבודה פיזית', 'עבודה בשטח',
  // כללי
  'עובד דלפק', 'עובד מחסן', 'משמרות', 'גמישות בשעות', 'אשדוד',
]

export async function POST() {
  try {
    // 1. מעסיק
    const employer = await prisma.employer.upsert({
      where: { name: 'ברוש סחר בברזל' },
      update: { city: 'אשדוד', industry: 'סחר ותעשייה' },
      create: { name: 'ברוש סחר בברזל', city: 'אשדוד', industry: 'סחר ותעשייה', active: true },
    })

    const tagConnects = {
      connectOrCreate: TAGS.map(tag => ({
        where: { name: tag },
        create: { name: tag, color: '#6366f1' },
      })),
    }

    const positionData = {
      title: 'עובד/ת דלפק ומחסן',
      description: 'עבודה בדלפק מכירות ומחסן – קבלת לקוחות, הוצאת סחורה, ספירת מלאי וסיוע בהעמסה. תחום ברזל וחומרי בניה.',
      requirements: 'נסיון בשירות לקוחות או מחסן יתרון. עבודה פיזית. גמישות בשעות.',
      salaryRange: '45-50 ₪ לשעה',
      workHours: 'משמרות, ימים א-ה',
      location: 'אשדוד',
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
