import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🏷️ הרחבת תגיות למשרות UNION - מינימום 20 תגיות לכל משרה
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== 'tags2026expand') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    // מציאת מעסיק UNION
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

    // הגדרות תגיות מורחבות לכל משרה
    const positionTags: Record<string, string[]> = {
      'תומך טכני': [
        'תומך טכני', 'תמיכה טכנית', 'טכנאי', 'הנדסאי רכב', 'הנדסאי חשמל', 
        'אלקטרוניקה', 'מוסך', 'מאבחן תקלות', 'אבחון', 'PDI', 
        'הכנה למסירה', 'קריאות שירות', 'GEELY', 'ZEEKR', 'FARIZON', 
        'GAC', 'UNION', 'יוניון', 'בני עיש', 'ראם', 
        'פארק תעשיות', 'רכב', 'יבואן רכב', 'דיווח תקלות', 'איכות',
        'תיקון רכב', 'שירות', 'צוות טכני', 'מתקינים', 'אביזרים'
      ],
      'בוחן רכב': [
        'בוחן רכב', 'בוחן', 'רישוי', 'תעודת בוחן', 'בדיקת רכב',
        'זיהוי פיזי', 'תיקי רישוי', 'ווי גרירה', 'שינויי מבנה', 'נכה',
        'מנגנוני נכה', 'כרטיסי עבודה', 'UNION', 'יוניון', 'ראם',
        'פארק תעשיות', 'בדיקה', 'אישור', 'רכב', 'מסמכים',
        'חתימה', 'תיק רישוי', 'התקנה', 'בדיקת התקנה', 'ניסיון 5 שנים'
      ],
      'דייל': [
        'דייל שירות', 'דיילת שירות', 'דייל', 'דיילת', 'שירות לקוחות',
        'אולם תצוגה', 'קבלת לקוחות', 'חווית לקוח', 'הסברים', 'דגמים',
        'זיהוי צרכים', 'הכוונה', 'נראות', 'סטנדרט מותג', 'פרונטלי',
        'שירות פרונטלי', 'אדמיניסטרטיבי', 'תודעת שירות', 'משמרות', 'זמני',
        'UNION', 'יוניון', 'ביג פאשן', 'גלילות', 'תל אביב',
        'BIG', 'שעתי', 'שבת', 'שישי', 'גמישות'
      ],
      'נסיעות התרשמות': [
        'נסיעות התרשמות', 'נסיעת מבחן', 'טסט דרייב', 'מסירת רכב', 'מסירה',
        'רכב חדש', 'רכב משומש', 'לקוחות', 'אולם תצוגה', 'שטח',
        'משימות חוץ', 'תפעול', 'לידים', 'קבלה', 'שירות',
        'GAC', 'UNION', 'יוניון', 'רעננה', 'כושר ביטוי',
        'יחסי אנוש', 'רכב', 'הגנת שכר', 'פרמיות', 'בונוסים'
      ],
      'יועץ שירות': [
        'יועץ שירות', 'יועצת שירות', 'מרכז שירות', 'חווית שירות', 'שביעות רצון',
        'מכירות', 'שימור לקוחות', 'פוטנציאל מכירה', 'לקוחות', 'OFFICE',
        'הבנה טכנית', 'טכני', 'פריים מוטורס', 'חיפה', 'UNION',
        'יוניון', 'בונוסים', 'שירות לקוחות', 'ייעוץ', 'תיאום',
        'קשר לקוחות', 'מענה', 'פתרון בעיות', 'מקצועיות', 'ניסיון שירות'
      ],
      'נציג מכירות': [
        'נציג מכירות', 'נציגת מכירות', 'מכירות', 'מכירות רכב', 'תהליך מכירה',
        'חוויית לקוח', 'רכישה', 'ליווי לקוח', 'מסירה', 'סגירת עסקה',
        'GAC', 'GEELY', 'UNION', 'יוניון', 'רעננה',
        'אולם תצוגה', 'Office', 'כושר ביטוי', 'בונוסים', 'עמלות',
        'יעדים', 'לקוחות', 'שירות', 'מקצה לקצה', 'B2C'
      ],
      'מנהל אולם': [
        'מנהל אולם תצוגה', 'מנהלת אולם תצוגה', 'ניהול', 'אולם תצוגה', 'צוות מכירות',
        'צוות שירות', 'יעדי מכירות', 'שביעות רצון', 'ניהול שוטף', 'GEELY',
        'אשדוד', 'תל אביב', 'UNION', 'יוניון', 'מכירות רכב',
        'ארגון', 'יחסי אנוש', 'הובלת צוות', 'ניהול אנשים', 'אחריות',
        'ניסיון ניהולי', 'רכב', 'שואורום', 'תצוגה', 'לקוחות'
      ],
      'אחזקה': [
        'אחזקה', 'איש אחזקה', 'אשת אחזקה', 'תחזוקה', 'עבודות אחזקה',
        'קמפוס', 'טויוטה', 'שורק', 'UNION', 'יוניון',
        'יציב', 'עבודה יציבה', 'א-ה', 'ימים א-ה', 'תיקונים',
        'שיפוצים', 'תחזוקת מבנה', 'עבודה פיזית', 'כללי', 'טכני'
      ],
      'ציי רכב': [
        'מנהל תיק לקוח', 'ציי רכב', 'מכירות B2B', 'לקוחות מוסדיים', 'מו"מ',
        'משא ומתן', 'חוזים', 'הצעות ערך', 'גורמים בכירים', 'מנהלי רכש',
        'מנהלי תחבורה', 'ממשקים', 'שירות', 'תפעול', 'כספים',
        'יעדי מכירות', 'GAC', 'UNION', 'יוניון', 'רעננה',
        'שטח', 'רכב צמוד', 'עמלות', 'Excel', 'רישיון נהיגה',
        'ניהול פרויקטים', 'תקשורת', 'אסרטיביות', 'הנדסת מכירות', 'ארגוני'
      ],
      'רפרנט תפעול': [
        'רפרנט', 'תפעול', 'אביזרים', 'לוגיסטיקה', 'ניהול מלאי',
        'הזמנות', 'ספקים', 'תיאום', 'מעקב', 'דוחות',
        'UNION', 'יוניון', 'אדמיניסטרציה', 'משרד', 'Excel',
        'ארגון', 'סדר', 'דיוק', 'עבודה מול ספקים', 'רכב'
      ]
    };

    // מציאת כל משרות UNION
    const positions = await prisma.position.findMany({
      where: { employerId: unionEmployer.id },
      include: { tags: true }
    });

    for (const position of positions) {
      // זיהוי סוג המשרה לפי הכותרת
      let tagsToAdd: string[] = [];
      const title = position.title.toLowerCase();

      // בחירת תגיות לפי סוג המשרה
      if (title.includes('תומך טכני') || title.includes('טכני')) {
        tagsToAdd = [...positionTags['תומך טכני']];
      } else if (title.includes('בוחן רכב') || title.includes('בוחן')) {
        tagsToAdd = [...positionTags['בוחן רכב']];
      } else if (title.includes('דייל') || title.includes('דיילת')) {
        tagsToAdd = [...positionTags['דייל']];
      } else if (title.includes('נסיעות התרשמות')) {
        tagsToAdd = [...positionTags['נסיעות התרשמות']];
      } else if (title.includes('יועץ שירות') || title.includes('יועצת שירות')) {
        tagsToAdd = [...positionTags['יועץ שירות']];
      } else if (title.includes('נציג מכירות') || title.includes('נציגת מכירות')) {
        tagsToAdd = [...positionTags['נציג מכירות']];
      } else if (title.includes('מנהל אולם') || title.includes('מנהלת אולם')) {
        tagsToAdd = [...positionTags['מנהל אולם']];
      } else if (title.includes('אחזקה')) {
        tagsToAdd = [...positionTags['אחזקה']];
      } else if (title.includes('ציי רכב') || title.includes('תיק לקוח')) {
        tagsToAdd = [...positionTags['ציי רכב']];
      } else if (title.includes('רפרנט')) {
        tagsToAdd = [...positionTags['רפרנט תפעול']];
      }

      // הוספת תגיות ממיקום
      if (position.location) {
        const loc = position.location;
        if (loc.includes('רעננה')) tagsToAdd.push('רעננה');
        if (loc.includes('חיפה')) tagsToAdd.push('חיפה');
        if (loc.includes('אשדוד')) tagsToAdd.push('אשדוד');
        if (loc.includes('תל אביב')) tagsToAdd.push('תל אביב');
        if (loc.includes('גלילות')) tagsToAdd.push('גלילות');
        if (loc.includes('שורק')) tagsToAdd.push('שורק');
        if (loc.includes('ראם')) tagsToAdd.push('ראם', 'פארק תעשיות');
        if (loc.includes('בני עי')) tagsToAdd.push('בני עיש');
        if (loc.includes('שטח')) tagsToAdd.push('עבודת שטח', 'שטח');
      }

      // הוספת תגיות מהתיאור
      if (position.description) {
        const desc = position.description;
        if (desc.includes('B2B')) tagsToAdd.push('B2B', 'מכירות עסקיות');
        if (desc.includes('B2C')) tagsToAdd.push('B2C', 'מכירות פרטיות');
        if (desc.includes('Excel')) tagsToAdd.push('Excel', 'מחשב');
        if (desc.includes('Office') || desc.includes('OFFICE')) tagsToAdd.push('Office', 'מחשב');
        if (desc.includes('רכב צמוד')) tagsToAdd.push('רכב צמוד', 'הטבות');
        if (desc.includes('בונוס') || desc.includes('עמלות') || desc.includes('פרמיות')) {
          tagsToAdd.push('בונוסים', 'עמלות', 'שכר גבוה');
        }
        if (desc.includes('דחוף') || desc.includes('דחוף!')) tagsToAdd.push('דחוף', 'גיוס מיידי');
        if (desc.includes('זמני')) tagsToAdd.push('זמני', 'קצר מועד');
        if (desc.includes('שבת')) tagsToAdd.push('עבודה בשבת');
        if (desc.includes('שישי')) tagsToAdd.push('שישי');
        if (desc.includes('גמישות') || desc.includes('גמיש')) tagsToAdd.push('גמישות', 'שעות גמישות');
        if (desc.includes('ניסיון')) tagsToAdd.push('ניסיון נדרש');
        if (desc.includes('יתרון')) tagsToAdd.push('ניסיון יתרון');
        if (desc.includes('חובה')) tagsToAdd.push('דרישות חובה');
      }

      // הוספת תגיות כלליות
      tagsToAdd.push('UNION', 'יוניון', 'משרה פתוחה', 'גיוס');

      // הוספת תגיות לפי סוג העסקה
      if (position.employmentType === 'FULL_TIME') {
        tagsToAdd.push('משרה מלאה', 'full time');
      } else if (position.employmentType === 'PART_TIME') {
        tagsToAdd.push('משרה חלקית', 'part time');
      }

      // הוספת תגיות לפי עדיפות
      if (position.priority === 1) {
        tagsToAdd.push('עדיפות גבוהה', 'דחוף');
      }

      // הסרת כפילויות
      const uniqueTags = [...new Set(tagsToAdd)];

      // עדכון keywords
      const keywordsString = uniqueTags.join(', ');
      await prisma.position.update({
        where: { id: position.id },
        data: { keywords: keywordsString }
      });

      // יצירת והוספת תגיות
      const tagColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
      
      for (const tagName of uniqueTags) {
        try {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            create: { 
              name: tagName, 
              color: tagColors[Math.floor(Math.random() * tagColors.length)]
            },
            update: {}
          });
          
          // חיבור התגית למשרה
          await prisma.position.update({
            where: { id: position.id },
            data: { tags: { connect: { id: tag.id } } }
          });
        } catch (e) { 
          // התעלם משגיאות כפילות
        }
      }

      results.push(`✅ ${position.title}: ${uniqueTags.length} תגיות`);
    }

    return NextResponse.json({
      success: true,
      totalPositions: positions.length,
      results
    });

  } catch (error: unknown) {
    console.error('Error expanding tags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
