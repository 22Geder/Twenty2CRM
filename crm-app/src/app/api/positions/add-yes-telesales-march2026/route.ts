import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// תגיות למשרת מכירות טלפוניות YES - לפחות 30 תגיות
const telesalesTags = [
  // מכירות
  'מכירות', 'מכירות טלפוניות', 'telesales', 'טלמרקטינג', 'telemarketing',
  'נציג מכירות', 'נציגת מכירות', 'איש מכירות', 'אשת מכירות', 'sales',
  
  // מוקד ושירות
  'מוקד', 'מוקד מכירות', 'call center', 'קול סנטר', 'שירות לקוחות',
  'שימור לקוחות', 'retention', 'customer service',
  
  // כישורים
  'שכנוע', 'סגירת עסקאות', 'closing', 'יעדים', 'עמידה ביעדים', 'targets',
  'לידים', 'לידים קרים', 'cold calling', 'פניה יזומה', 'outbound',
  
  // תנאים
  'עמלות', 'בונוסים', 'תגמול גבוה', 'פרסים', 'תחרויות',
  
  // טכני
  'עבודה ממוחשבת', 'CRM', 'מערכות מידע', 'אוריינטציה מכירתית',
  
  // מיקום וחברה
  'באר שבע', 'צפון הנגב', 'דרום', 'YES', 'סלקום', 'תקשורת', 'טלוויזיה',
  
  // כללי
  'משרה מלאה', 'ללא ניסיון', 'מתחילים', 'הכשרה', 'קידום'
];

export async function GET() {
  try {
    const results: any[] = [];
    
    // חיפוש מעסיק YES
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'YES' } },
          { name: { contains: 'yes' } },
          { name: { contains: 'יס' } }
        ]
      }
    });
    
    if (!employer) {
      // יצירת מעסיק YES אם לא קיים
      employer = await prisma.employer.create({
        data: {
          name: 'YES - יס',
          email: 'yes-jobs@twenty2jobs.co.il',
          phone: '',
          description: 'חברת טלוויזיה ותקשורת'
        }
      });
      results.push({ action: 'employer_created', name: employer.name });
    } else {
      results.push({ action: 'employer_found', name: employer.name });
    }

    const title = 'נציג/ת מכירות טלפוניות - YES באר שבע';
    const location = 'באר שבע וצפון הנגב';
    
    const description = `**נציג/ת מכירות טלפוניות ב-YES**

📍 מיקום: באר שבע וצפון הנגב
🏢 מעסיק: YES

**תיאור התפקיד:**
• פניה יזומה ללקוחות פוטנציאלים וביצוע מכירה טלפונית
• טיפול מקצה לקצה בתהליך המכירה עד לסגירתו
• נכונות לעמידה ביעדי מכירות ואקטיבציות
• פוטנציאל תגמול גבוה, תחרויות ופרסים

**מה אנחנו מציעים:**
• שכר בסיס + עמלות גבוהות
• בונוסים ופרסים
• תחרויות מכירה
• הכשרה מקצועית מלאה
• אפשרויות קידום

**דרישות:**
• ניסיון בעבודה במוקדי שירות / שימור / מכירה - יתרון משמעותי
• ניסיון קודם בעבודה על מאגר לידים קרים - יתרון משמעותי
• ניסיון עבודה בסביבה ממוחשבת - חובה
• אוריינטציה מכירתית - חובה
• יכולות שכנוע ותקשורת בין-אישית מעולות
• נכונות לעבודה מאומצת ועמידה ביעדים`;

    const requirements = 'ניסיון במוקדים (יתרון), עבודה ממוחשבת (חובה), אוריינטציה מכירתית (חובה)';

    // יצירת/מציאת תגיות
    const tags = await Promise.all(
      telesalesTags.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    );
    const tagIds = tags.map(t => ({ id: t.id }));

    // יצירת המשרה
    const position = await prisma.position.create({
      data: {
        title,
        description,
        location,
        requirements,
        employmentType: 'משרה מלאה',
        active: true,
        employerId: employer.id,
        contactEmail: '',
        tags: { connect: tagIds },
        workHours: 'משמרות, ימים א-ה',
        benefits: 'עמלות גבוהות, בונוסים, פרסים, תחרויות מכירה'
      },
      include: { tags: true }
    });

    results.push({ 
      action: 'position_created', 
      title: position.title,
      tagsCount: position.tags.length 
    });

    return NextResponse.json({
      success: true,
      message: `נוצרה משרת מכירות טלפוניות YES בבאר שבע עם ${position.tags.length} תגיות`,
      results,
      employer: employer.name,
      position: {
        id: position.id,
        title: position.title,
        location: position.location,
        tagsCount: position.tags.length
      }
    });

  } catch (error) {
    console.error('Error creating YES telesales position:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
