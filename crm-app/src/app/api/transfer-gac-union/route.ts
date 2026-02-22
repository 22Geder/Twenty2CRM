import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔧 העברת משרות GAC ל-UNION והוספת משרה חדשה
export async function POST(request: NextRequest) {
  try {
    // סודי פשוט לביצוע חד פעמי
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== 'gac2union2026') {
      return NextResponse.json({ error: 'Unauthorized - use secret param' }, { status: 401 });
    }

    const results: string[] = [];

    // 1. מציאת מעסיקים
    let gacEmployer = await prisma.employer.findFirst({
      where: { name: { contains: 'GAC' } }
    });

    const unionEmployer = await prisma.employer.findFirst({
      where: { 
        OR: [
          { name: { contains: 'UNION' } },
          { name: { contains: 'יוניון' } }
        ]
      }
    });

    if (!unionEmployer) {
      return NextResponse.json({ error: 'לא נמצא מעסיק UNION' }, { status: 404 });
    }

    results.push(`מצאתי UNION: ${unionEmployer.name}`);

    // 2. הוספת המשרה החדשה ל-UNION
    const existingPosition = await prisma.position.findFirst({
      where: { 
        AND: [
          { title: { contains: 'מנהל' } },
          { title: { contains: 'ציי רכב' } }
        ]
      }
    });

    if (!existingPosition) {
      const newPosition = await prisma.position.create({
        data: {
          employerId: unionEmployer.id,
          title: 'מנהל/ת תיק לקוח ציי רכב - GAC',
          location: 'רעננה + שטח (יש רכב)',
          description: `🚗 GAC - מנהל/ת תיק לקוח ציי רכב

📍 מיקום: רעננה + שטח ארצי (יש רכב צמוד)

📋 תיאור התפקיד:
• ניהול שוטף של תיקי לקוחות מוסדיים וציי רכב בהיקפים גדולים
• איתור וגיוס לקוחות חדשים והרחבת פעילות קיימת
• הובלת תהליכי מכירה מקצה לקצה – החל משלב המו"מ ועד חתימה על חוזים
• בניית והצגת הצעות ערך מותאמות לצורכי הלקוח
• עבודה מול גורמים בכירים בארגונים, מנהלי רכש ומנהלי תחבורה
• תיאום ממשקים פנימיים בחברה (שירות, תפעול, כספים)
• עמידה ביעדי מכירות וביעדי שביעות רצון לקוחות

✅ דרישות התפקיד:
• ניסיון מוכח של כשנה במכירות B2B - חובה!
• ניסיון מתחום הרכב - יתרון משמעותי
• יכולת גבוהה לניהול מו"מ מורכב
• רקע והבנה עסקית-מסחרית רחבה
• יכולת ניהול מספר פרויקטים ולקוחות במקביל
• כישורי תקשורת בין-אישית מצוינים ויחסי אנוש מעולים
• יכולת ניהול ממשקים פנים וחוץ ארגוניים
• HANDS ON ויכולת עבודה בצוות
• שליטה מלאה ביישומי מחשב ו-Excel

🎯 מה אנחנו מחפשים?
• בעלי ניסיון של שנה בעולם המכירות B2B
• וורבליים, רמה אישית סופר גבוהה, אסרטיביים - הדגש הוא אישיותי!
• התנסחות מעולה, יכולת מו"מ עם גורמים בכירים

⏰ שעות עבודה:
• ימים א'-ה' 8:00-17:00
• שישי רק במקרה הצורך
• נדרשת גמישות (פגישות שטח עם לקוחות)

💰 תנאים:
• בסיס: 8,000 ₪ (לבעלי ניסיון אזור 8-9K)
• עמלות: 4,000-5,000 ₪
• רכב צמוד + פלאפון`,
          requirements: `• ניסיון מוכח של כשנה במכירות B2B - חובה!
• ניסיון מתחום הרכב - יתרון משמעותי
• יכולת גבוהה לניהול מו"מ מורכב
• רקע והבנה עסקית-מסחרית רחבה
• יכולת ניהול מספר פרויקטים ולקוחות במקביל
• כישורי תקשורת בין-אישית מצוינים
• שליטה מלאה ביישומי מחשב ו-Excel
• רישיון נהיגה - חובה`,
          salaryRange: 'בסיס 8,000 ₪ + עמלות 4-5K',
          employmentType: 'FULL_TIME',
          isActive: true,
          priority: 3,
          keywords: 'מכירות B2B, ציי רכב, מנהל לקוחות, מו"מ, ניהול תיקים, רכב, GAC, UNION, יוניון, רעננה, שטח, גמישות, עמלות, רישיון נהיגה, לקוחות מוסדיים, תיאום, שירות, Excel'
        }
      });

      results.push(`✅ נוספה משרה חדשה: ${newPosition.title}`);

      // הוספת תגיות
      const tags = [
        'מכירות B2B', 'ציי רכב', 'מנהל לקוחות', 'מו"מ', 
        'רעננה', 'שטח', 'GAC', 'UNION', 'יוניון',
        'רכב', 'לקוחות מוסדיים', 'גמישות', 'עמלות',
        'משרה מלאה', 'ניסיון נדרש'
      ];

      for (const tagName of tags) {
        try {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            create: { name: tagName, color: getTagColor(tagName) },
            update: {}
          });
          
          await prisma.position.update({
            where: { id: newPosition.id },
            data: { tags: { connect: { id: tag.id } } }
          });
        } catch (e) { /* ignore */ }
      }
      results.push('🏷️ הוספו תגיות למשרה');
    } else {
      results.push('⚠️ המשרה כבר קיימת');
    }

    // 3. העברת כל משרות GAC ל-UNION
    if (gacEmployer) {
      const gacPositions = await prisma.position.findMany({
        where: { employerId: gacEmployer.id }
      });

      results.push(`📦 מעביר ${gacPositions.length} משרות מ-GAC ל-UNION`);

      for (const position of gacPositions) {
        await prisma.position.update({
          where: { id: position.id },
          data: { 
            employerId: unionEmployer.id,
            title: position.title.includes('GAC') ? position.title : `${position.title} - GAC`
          }
        });
        results.push(`✅ הועבר: ${position.title}`);
      }
    } else {
      results.push('⚠️ לא נמצא מעסיק GAC להעברה');
    }

    // 4. סיכום
    const totalUnionPositions = await prisma.position.count({
      where: { employerId: unionEmployer.id }
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        unionId: unionEmployer.id,
        unionName: unionEmployer.name,
        totalUnionPositions
      }
    });

  } catch (error: any) {
    console.error('Transfer error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

function getTagColor(tagName: string): string {
  const colors: Record<string, string> = {
    'מכירות B2B': '#3B82F6',
    'ציי רכב': '#10B981',
    'מנהל לקוחות': '#8B5CF6',
    'מו"מ': '#F59E0B',
    'רעננה': '#EC4899',
    'שטח': '#06B6D4',
    'GAC': '#EF4444',
    'UNION': '#0EA5E9',
    'יוניון': '#0EA5E9',
    'רכב': '#10B981',
    'לקוחות מוסדיים': '#8B5CF6',
    'גמישות': '#F97316',
    'עמלות': '#22C55E',
    'משרה מלאה': '#6366F1',
    'ניסיון נדרש': '#F43F5E'
  };
  return colors[tagName] || '#6B7280';
}
