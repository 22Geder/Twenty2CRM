import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🏷️ השלמת תגיות למשרות עם פחות מ-20
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== 'complete2026tags') {
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

    // תגיות מורחבות לפי סוג משרה
    const tagSets: Record<string, string[]> = {
      'נציג קבלה': [
        'נציג קבלה', 'נציגת קבלה', 'קבלת לקוחות', 'שירות לקוחות', 'פרונטלי',
        'GAC', 'UNION', 'יוניון', 'אולם תצוגה', 'שואורום',
        'יחסי אנוש', 'תקשורת', 'חווית לקוח', 'קבלת פנים', 'הכוונה',
        'מענה ללקוחות', 'שירות', 'תודעת שירות', 'נראות', 'מסמכים',
        'תיאום', 'רכב', 'יבואן רכב', 'מכירות', 'סיוע'
      ],
      'מנהל סוכנות': [
        'מנהל סוכנות', 'מנהלת סוכנות', 'ניהול', 'סוכנות רכב', 'אולם תצוגה',
        'UNION', 'יוניון', 'GAC', 'צוות מכירות', 'צוות שירות',
        'יעדים', 'ניהול אנשים', 'אחריות', 'מקסום מכירות', 'תפעול',
        'שואורום', 'לקוחות', 'חווית לקוח', 'שביעות רצון', 'דוחות',
        'תוצאות', 'הובלה', 'מנהיגות', 'ניסיון ניהולי', 'רכב'
      ],
      'יועץ מכירות': [
        'יועץ מכירות', 'יועצת מכירות', 'מכירות רכב', 'ייעוץ', 'לקוחות',
        'GAC', 'GEELY', 'UNION', 'יוניון', 'אולם תצוגה',
        'תהליך מכירה', 'סגירת עסקאות', 'מו"מ', 'הצעות מחיר', 'ליווי לקוח',
        'רכב חדש', 'מימון', 'ליסינג', 'טרייד אין', 'ביטוח',
        'יעדים', 'בונוסים', 'עמלות', 'שירות', 'מקצועיות'
      ],
      'נסיעות מבחן': [
        'נסיעות מבחן', 'נסיעות התרשמות', 'טסט דרייב', 'test drive', 'נהיגה',
        'GAC', 'UNION', 'יוניון', 'רכב', 'לקוחות',
        'הדגמה', 'תצוגה', 'חווית נהיגה', 'רכב חדש', 'מסירות',
        'שירות', 'ליווי', 'הסברים', 'טכנולוגיה', 'דגמים',
        'שטח', 'כביש', 'רישיון', 'נהג', 'חווית לקוח'
      ],
      'מנהל אולם תצוגה': [
        'מנהל אולם תצוגה', 'מנהלת אולם', 'ניהול', 'אולם תצוגה', 'שואורום',
        'GAC', 'GEELY', 'UNION', 'יוניון', 'צוות',
        'מכירות', 'שירות', 'יעדים', 'ביצועים', 'לקוחות',
        'ניהול צוות', 'אחריות', 'דוחות', 'תוצאות', 'תפעול',
        'שיווק', 'נראות', 'סטנדרטים', 'איכות', 'מצוינות'
      ],
      'יועץ שירות': [
        'יועץ שירות', 'יועצת שירות', 'שירות לקוחות', 'מרכז שירות', 'מוסך',
        'GAC', 'UNION', 'יוניון', 'תיאום', 'לקוחות',
        'טיפולים', 'תיקונים', 'אחריות', 'תורים', 'הזמנות',
        'תקשורת', 'מעקב', 'שביעות רצון', 'חווית שירות', 'איכות',
        'מחשב', 'מערכות', 'דוחות', 'ממשקים', 'צוות טכני'
      ]
    };

    // מציאת משרות עם פחות מ-20 תגיות
    const positions = await prisma.position.findMany({
      where: { employerId: unionEmployer.id },
      include: { tags: true }
    });

    const tagColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

    for (const position of positions) {
      if (position.tags.length >= 20) {
        results.push(`⏭️ ${position.title}: כבר יש ${position.tags.length} תגיות`);
        continue;
      }

      const title = position.title.toLowerCase();
      let tagsToAdd: string[] = [];

      // זיהוי סוג המשרה
      if (title.includes('נציג קבלה') || title.includes('נציגת קבלה')) {
        tagsToAdd = [...tagSets['נציג קבלה']];
      } else if (title.includes('מנהל סוכנות') || title.includes('מנהלת סוכנות')) {
        tagsToAdd = [...tagSets['מנהל סוכנות']];
      } else if (title.includes('יועץ מכירות') || title.includes('יועצת מכירות')) {
        tagsToAdd = [...tagSets['יועץ מכירות']];
      } else if (title.includes('נסיעות') || title.includes('מבחן')) {
        tagsToAdd = [...tagSets['נסיעות מבחן']];
      } else if (title.includes('מנהל') && (title.includes('אולם') || title.includes('תצוגה'))) {
        tagsToAdd = [...tagSets['מנהל אולם תצוגה']];
      } else if (title.includes('יועץ שירות') || title.includes('יועצת שירות')) {
        tagsToAdd = [...tagSets['יועץ שירות']];
      }

      // הוספת תגיות כלליות לכל משרה
      tagsToAdd.push(
        'UNION', 'יוניון', 'משרה פתוחה', 'גיוס', 'עבודה',
        'קריירה', 'הזדמנות', 'תעסוקה', 'רכב', 'תחום הרכב'
      );

      // תגיות לפי מיקום
      if (position.location) {
        const loc = position.location;
        if (loc.includes('רעננה')) tagsToAdd.push('רעננה', 'מרכז', 'גוש דן');
        if (loc.includes('אשדוד')) tagsToAdd.push('אשדוד', 'דרום', 'שפלה');
        if (loc.includes('ראשון')) tagsToAdd.push('ראשון לציון', 'מרכז', 'גוש דן');
        if (loc.includes('נתניה')) tagsToAdd.push('נתניה', 'שרון', 'מרכז');
        if (loc.includes('חיפה')) tagsToAdd.push('חיפה', 'צפון', 'קריות');
        if (loc.includes('תל אביב')) tagsToAdd.push('תל אביב', 'מרכז', 'גוש דן');
        if (loc.includes('ירושלים')) tagsToAdd.push('ירושלים', 'אזור ירושלים');
      }

      // תגיות לפי מותג
      if (title.includes('gac') || position.description?.toLowerCase().includes('gac')) {
        tagsToAdd.push('GAC', 'יבואן רכב', 'רכב סיני');
      }
      if (title.includes('geely') || position.description?.toLowerCase().includes('geely')) {
        tagsToAdd.push('GEELY', 'ג\'ילי', 'יבואן רכב');
      }

      // הסרת כפילויות
      const uniqueTags = [...new Set(tagsToAdd)];

      // עדכון keywords
      const currentKeywords = position.keywords ? position.keywords.split(',').map(k => k.trim()) : [];
      const allKeywords = [...new Set([...currentKeywords, ...uniqueTags])];
      
      await prisma.position.update({
        where: { id: position.id },
        data: { keywords: allKeywords.join(', ') }
      });

      // הוספת תגיות
      let addedCount = 0;
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
          
          await prisma.position.update({
            where: { id: position.id },
            data: { tags: { connect: { id: tag.id } } }
          });
          addedCount++;
        } catch (e) { }
      }

      results.push(`✅ ${position.title}: +${addedCount} תגיות (סה"כ ${position.tags.length + addedCount})`);
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: unknown) {
    console.error('Error completing tags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
