import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      },
      {
        title: 'נהג/ת שינוע רכבים - מוסך צמרת אשדוד',
        location: 'אשדוד',
        workHours: '07:30-16:30 א׳-ה׳ (שישי לסירוגין)',
        salaryRange: '45 ₪/שעה',
        description: `🚗 דרוש/ה נהג/ת לשינוע רכבים למוסך מוביל באשדוד!

לקבוצת 2טו-גדר דרוש/ה נהג/ת לשינוע רכבי לקוחות בין המוסך למוקדי שירות שונים (בדיקות, טסטים, מוסכי חוץ וכו').
עבודה יציבה, סביבה מקצועית ואווירה נעימה.

📌 במסגרת התפקיד:
• שינוע רכבים ממקום למקום לפי הנחיית מנהל העבודה
• שמירה קפדנית על הרכבים המשונעים

⏰ ימי עבודה: א׳-ה׳ בין השעות 07:30-16:30
📅 ימי שישי לסירוגין

💰 45 ש"ח ברוטו לשעה
✅ תנאים סוציאליים מלאים כחוק`,
        requirements: `גיל 24 ומעלה - חובה
רישיון נהיגה מסוג B (בתוקף) לפחות שנתיים - חובה
אחריות, אמינות ומוסר עבודה גבוה
הגעה עצמית לאשדוד`,
        keywords: [
          'נהג', 'נהגת', 'נהיגה', 'רישיון נהיגה', 'רישיון B', 'שינוע רכבים', 'driver',
          'מוסך', 'רכב', 'רכבים', 'automotive', 'garage',
          'אשדוד', 'דרום', 'שפלה', 'אזור אשדוד',
          'גיל 24', 'ותק נהיגה', 'שעתי', 'תנאים סוציאליים', 'משרה מלאה', 'א-ה',
          'אחריות', 'אמינות', 'מוסר עבודה', 'הגעה עצמית'
        ]
      },
      {
        title: 'מכונאי/ת רכב - מוסך צמרת אשדוד',
        location: 'אשדוד',
        workHours: 'א׳-ה׳ (שישי לסירוגין)',
        salaryRange: 'לפי ניסיון',
        description: `🔧 דרוש/ה מכונאי/ת רכב למוסך מוביל באשדוד!

לקבוצת 2טו-גדר דרוש/ה מכונאי/ת רכב - מקצועי/ת או בעל/ת רקע טכני, למוסך רכב והשכרה מוביל באשדוד.
מתאים גם למי שמגיע מרקע טכני אחר ומעוניין/ת להשתלב בתחום המוסכים.

📌 במסגרת התפקיד:
• אבחון ותיקון תקלות ברכבים
• עבודה שוטפת מול צוות המוסך ומנהל העבודה

✅ תנאים סוציאליים מלאים כחוק`,
        requirements: `ניסיון כמכונאי/ת רכב - יתרון משמעותי
רקע טכני / הנדסאי רכב - יתרון
נכונות ללמידה והשתלבות בעבודה מעשית
אחריות ומוסר עבודה גבוה`,
        keywords: [
          'מכונאי', 'מכונאית', 'מכונאי רכב', 'mechanic', 'automotive',
          'מוסך', 'רכב', 'רכבים', 'תיקון רכב', 'אבחון תקלות', 'טכני', 'רקע טכני', 'הנדסאי רכב',
          'אשדוד', 'דרום', 'שפלה', 'אזור אשדוד',
          'תנאים סוציאליים', 'משרה מלאה', 'א-ה'
        ]
      },
      {
        title: 'יועץ/ת שירות - מוסך צמרת אשדוד',
        location: 'אשדוד',
        workHours: 'א׳-ה׳ (שישי לסירוגין)',
        salaryRange: 'לפי ניסיון',
        description: `🤝 דרוש/ה יועץ/ת שירות למוסך מוביל באשדוד!

לקבוצת 2טו-גדר דרוש/ה יועץ/ת שירות שיודע/ת ללוות את הלקוח לאורך כל התהליך.
לא צריך להיות "תותח מכירות" - הכי חשוב זה יחס אישי, סבלנות ויכולת ליווי לקוח אמיתית.

📌 במסגרת התפקיד:
• קבלת פניות לקוחות וליווי אישי מתחילת התהליך ועד סופו
• מתן הסברים ברורים על העבודות והטיפולים הנדרשים ברכב
• תיאום מול צוות המוסך

✅ תנאים סוציאליים מלאים כחוק`,
        requirements: `יכולת שירות ותקשורת בין-אישית גבוהה
ניסיון בשירות לקוחות - יתרון
ניסיון בתחום הרכב / מוסכים - יתרון
אחריות ומוסר עבודה גבוה`,
        keywords: [
          'יועץ שירות', 'יועצת שירות', 'שירות לקוחות', 'ליווי לקוח', 'customer service',
          'מוסך', 'רכב', 'רכבים', 'automotive', 'garage',
          'אשדוד', 'דרום', 'שפלה', 'אזור אשדוד',
          'תקשורת בין אישית', 'סבלנות', 'יחס אישי',
          'תנאים סוציאליים', 'משרה מלאה', 'א-ה'
        ]
      },
      {
        title: 'מנהל/ת מחלקת חשמל - מוסך צמרת אשדוד',
        location: 'אשדוד',
        workHours: 'א׳-ה׳ (שישי לסירוגין)',
        salaryRange: 'לפי ניסיון',
        description: `⚡ דרוש/ה מנהל/ת מחלקת חשמל למוסך מוביל באשדוד!

לקבוצת 2טו-גדר דרוש/ה מנהל/ת מחלקת חשמל לניהול צוות טכנאי חשמל רכב במוסך רכב והשכרה מוביל באשדוד.

📌 במסגרת התפקיד:
• ניהול צוות טכנאי חשמל רכב
• אבחון ותיקון תקלות חשמל מורכבות ברכבים
• פיקוח על איכות העבודה ולוחות זמנים

✅ תנאים סוציאליים מלאים כחוק`,
        requirements: `ניסיון כטכנאי/מנהל חשמל רכב - חובה
ניסיון בניהול צוות - יתרון משמעותי
יכולת אבחון תקלות חשמל מורכבות
אחריות ומוסר עבודה גבוה`,
        keywords: [
          'מנהל מחלקת חשמל', 'טכנאי חשמל רכב', 'חשמלאי רכב', 'electrician', 'automotive electrics',
          'ניהול צוות', 'מוסך', 'רכב', 'רכבים', 'automotive', 'garage', 'אבחון תקלות חשמל',
          'אשדוד', 'דרום', 'שפלה', 'אזור אשדוד',
          'תנאים סוציאליים', 'משרה מלאה', 'א-ה'
        ]
      },
      {
        title: 'מחסנאי/ת - מוסך צמרת אשדוד',
        location: 'אשדוד',
        workHours: 'א׳-ה׳ (שישי לסירוגין)',
        salaryRange: 'לפי ניסיון',
        description: `📦 דרוש/ה מחסנאי/ת למוסך מוביל באשדוד!

לקבוצת 2טו-גדר דרוש/ה מחסנאי/ת רגיל/ה למוסך רכב והשכרה מוביל באשדוד.

📌 במסגרת התפקיד:
• קבלה, סידור וניהול מלאי חלקי חילוף ומוצרים במחסן
• הכנת הזמנות ומעקב מלאי שוטף
• עבודה מול צוות המוסך

✅ תנאים סוציאליים מלאים כחוק`,
        requirements: `ניסיון בעבודת מחסן - יתרון
סדר, ארגון ואחריות
מוסר עבודה גבוה`,
        keywords: [
          'מחסנאי', 'מחסנאית', 'מחסן', 'ניהול מלאי', 'warehouse', 'עוזר מחסנאי',
          'מוסך', 'רכב', 'רכבים', 'חלקי חילוף', 'automotive', 'garage',
          'אשדוד', 'דרום', 'שפלה', 'אזור אשדוד',
          'תנאים סוציאליים', 'משרה מלאה', 'א-ה'
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
