import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('🔧 מסנכרן משרות מוסך צמרת...')

    // מצא או צור את המעסיק
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'צמרת', mode: 'insensitive' } },
          { name: { contains: 'מוסך צמרת', mode: 'insensitive' } }
        ]
      }
    })

    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'מוסך צמרת',
          email: 'musach-tsameret@twenty2.co.il',
          phone: '',
        }
      })
      console.log('✅ נוצר מעסיק חדש: מוסך צמרת')
    }

    console.log(`✅ נמצא מעסיק: ${employer.name} (${employer.id})`)

    const positions = [
      {
        title: 'נהג/ת צמוד/ה למנהל עבודה - מוסך צמרת אשדוד',
        location: 'אשדוד',
        workHours: '07:30-16:30 א׳-ה׳ (שישי לסירוגין)',
        salaryRange: '45 ₪/שעה',
        description: `🚗 דרוש/ה נהג/ת צמוד/ה למנהל עבודה למוסך מוביל – עבודה יציבה וסביבה מעולה!

לקבוצת 2טו-גדר דרוש/ה נהג/ת לעבודה דינמית וצמודה למנהל עבודה במוסך מקצועי ואיכותי באשדוד.
זוהי הזדמנות מצוינת להשתלב במקום עבודה מסודר, עם אווירה חמה ואנשים שפשוט כיף לעבוד איתם!

📌 במסגרת התפקיד:
• נהיגה ועבודה בכפיפות ישירה למנהל העבודה במקום

⏰ ימי עבודה: א׳-ה׳ בין השעות 07:30-16:30
📅 ימי שישי לסירוגין

💰 45 ש"ח ברוטו לשעה
✅ תנאים סוציאליים מלאים כחוק`,
        requirements: `רישיון נהיגה מסוג B (בתוקף) - חובה
אחריות, אמינות ומוסר עבודה גבוה
הגעה עצמית לאשדוד`,
        keywords: [
          'נהג', 'נהגת', 'נהיגה', 'רישיון נהיגה', 'רישיון B', 'נהג צמוד', 'driver',
          'מוסך', 'רכב', 'רכבים', 'מכונאות', 'automotive', 'garage', 'תיקון רכב',
          'אשדוד', 'דרום', 'שפלה', 'אזור אשדוד',
          'מנהל עבודה', 'כפיפות', 'עבודה דינמית', 'עבודה יציבה',
          'שעתי', 'תנאים סוציאליים', 'משרה מלאה', 'א-ה',
          'אחריות', 'אמינות', 'מוסר עבודה', 'הגעה עצמית',
          'סביבת עבודה', 'מקצועי'
        ]
      }
    ]

    const newTitles = positions.map(p => p.title)
    const results: { position: string; action: string; keywords: number }[] = []

    // בטל משרות שלא ברשימה
    const deactivated = await prisma.position.updateMany({
      where: {
        employerId: employer.id,
        title: { notIn: newTitles },
        active: true
      },
      data: { active: false }
    })

    // עדכן או צור משרות
    for (const pos of positions) {
      const existing = await prisma.position.findFirst({
        where: { employerId: employer.id, title: pos.title }
      })

      if (existing) {
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            location: pos.location,
            description: pos.description,
            requirements: pos.requirements,
            salaryRange: pos.salaryRange,
            keywords: JSON.stringify(pos.keywords),
            employmentType: 'משרה מלאה',
            active: true,
            priority: 5
          }
        })
        results.push({ position: pos.title, action: '🔄 עודכן', keywords: pos.keywords.length })
      } else {
        await prisma.position.create({
          data: {
            title: pos.title,
            location: pos.location,
            description: pos.description,
            requirements: pos.requirements,
            salaryRange: pos.salaryRange,
            keywords: JSON.stringify(pos.keywords),
            employerId: employer.id,
            employmentType: 'משרה מלאה',
            active: true,
            openings: 1,
            priority: 5
          }
        })
        results.push({ position: pos.title, action: '✅ נוצר', keywords: pos.keywords.length })
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ משרות מוסך צמרת סונכרנו בהצלחה!',
      employer: employer.name,
      stats: { deactivated: deactivated.count, total: results.length },
      positions: results
    })

  } catch (error) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json(
      { error: 'שגיאה בסנכרון משרות', details: String(error) },
      { status: 500 }
    )
  }
}
