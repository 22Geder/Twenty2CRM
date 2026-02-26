import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🚗 הוספת משרות לקסוס חדשות ל-UNION
export async function GET(request: NextRequest) {
  try {
    const results: string[] = [];

    // מציאת מעסיק UNION
    const unionEmployer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'UNION' } },
          { name: { contains: 'יוניון' } },
          { name: { contains: 'לקסוס' } }
        ]
      }
    });

    if (!unionEmployer) {
      return NextResponse.json({ error: 'לא נמצא מעסיק UNION' }, { status: 404 });
    }

    results.push(`✅ מצאתי: ${unionEmployer.name}`);

    // משרות חדשות
    const newPositions = [
      {
        title: 'יועצ/ת שירות - לקסוס',
        description: `🚗 יצירת חווית לקוח ושירות ברמה גבוהה ויוקרתית, אירוח Omotenashi

📋 תיאור התפקיד:
• קבלת הלקוחות המגיעים למרכז השירות ופתיחת כרטיסים במערכת
• ליווי הלקוחות מרגע כניסתם ועד לסיום העבודות ברכב ושחרורים
• הכנת הצעות מחיר ללקוח, כולל קידום מכירות תוספתיים

✅ דרישות:
• ניסיון בעולמות השירות / מכירה – שנה
• ניסיון בתפקיד דומה בעולם הרכב – יתרון משמעותי
• יכולות שירות ותקשורתיות גבוהות

⏰ שעות: א-ה 7:00/7:30-16:30 + ימי ו לסירוגין חובה`,
        requirements: 'ניסיון בשירות/מכירה שנה, יכולות תקשורת גבוהות, ניסיון בעולם הרכב - יתרון משמעותי',
        salaryRange: '10,000 ₪ + עמלות (כ-5,000 ₪)',
        location: 'פתח תקווה',
        keywords: 'יועץ שירות, לקסוס, UNION, מרכז שירות, קבלת לקוחות, Omotenashi, שירות לקוחות, מכירות, עמלות, רכב, אולם תצוגה, lexus, יוקרתי',
        priority: 2
      },
      {
        title: 'נציג/ת מוקד VIP - לקסוס',
        description: `📞 מוקד שירות VIP לקסוס - לקוחות יוקרתיים!

📋 תיאור התפקיד:
• מענה ראשוני לפניות של לקוחות במגוון תחומים
• הוצאת שיחות יזומות
• מענה של שירותי קונסייז' ו-VIP ללקוחות יוקרתיים
• עמידה ביעדי המוקד ו-SLA

✅ דרישות:
• עבודה בתפקיד דומה במוקד שירות לקוחות – יתרון משמעותי
• יכולת עבודה על מערכות ממוחשבות
• יכולות שירות ותקשורת גבוהות
• אוריינטציה מכירתית – יתרון

⏰ אפשרויות:
• משרת סטודנט – 3-5 ימים באמצ"ש + שישי חובה
• משרת אם – א-ה 8:30-15:30 ללא שישי
• משרה מלאה – א-ה 7:30/8:00-16:30/17:00 + ימי ו לסירוגין`,
        requirements: 'ניסיון במוקד שירות לקוחות - יתרון, שליטה במחשב, יכולות תקשורת, אוריינטציה מכירתית',
        salaryRange: 'שכר שעתי 45 ₪ + עמלות 1,000-2,000 (משרה מלאה = 10,000 ₪)',
        location: 'פתח תקווה',
        keywords: 'מוקד VIP, לקסוס, UNION, קול סנטר, שירות לקוחות, קונסייז, יוקרתי, מוקדן, מוקדנית, סטודנט, משרת אם, lexus, טלפוני, SLA',
        priority: 2
      }
    ];

    // תגיות למשרות
    const serviceAdvisorTags = [
      'שירות לקוחות', 'מכירות', 'רכב', 'לקסוס', 'VIP', 
      'עמלות', 'קבלת קהל', 'יועץ שירות', 'UNION'
    ];

    const vipCallCenterTags = [
      'מוקד', 'שירות לקוחות', 'VIP', 'לקסוס', 'קול סנטר',
      'מוקדן', 'מוקדנית', 'סטודנט', 'משרת אם', 'UNION'
    ];

    for (const posData of newPositions) {
      // בדיקה אם המשרה כבר קיימת
      const existing = await prisma.position.findFirst({
        where: {
          title: posData.title,
          employerId: unionEmployer.id
        }
      });

      if (existing) {
        // עדכון המשרה הקיימת
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            description: posData.description,
            requirements: posData.requirements,
            salaryRange: posData.salaryRange,
            location: posData.location,
            keywords: posData.keywords,
            priority: posData.priority,
            active: true
          }
        });
        results.push(`🔄 עודכנה: ${posData.title}`);
      } else {
        // יצירת משרה חדשה
        const tags = posData.title.includes('מוקד') ? vipCallCenterTags : serviceAdvisorTags;
        
        await prisma.position.create({
          data: {
            title: posData.title,
            description: posData.description,
            requirements: posData.requirements,
            salaryRange: posData.salaryRange,
            location: posData.location,
            keywords: posData.keywords,
            priority: posData.priority,
            employerId: unionEmployer.id,
            active: true,
            tags: {
              connectOrCreate: tags.map(tag => ({
                where: { name: tag },
                create: { name: tag }
              }))
            }
          }
        });
        results.push(`✅ נוספה: ${posData.title}`);
      }
    }

    // סך הכל משרות UNION
    const totalPositions = await prisma.position.count({
      where: { employerId: unionEmployer.id, active: true }
    });

    return NextResponse.json({
      success: true,
      results,
      totalUnionPositions: totalPositions
    });

  } catch (error) {
    console.error('Error adding Lexus positions:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
