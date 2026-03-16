import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// תגיות לפי סוג משרה
const tellerTags = [
  'טלר', 'טלרית', 'קופאי', 'קופאית', 'בנק', 'בנקאות', 'שירות לקוחות', 'קופה',
  'פעולות בנקאיות', 'הפקדות', 'משיכות', 'שיקים', 'מזומן', 'עבודה מול קהל',
  'ללא ניסיון', 'ג\'וניור', 'junior', 'מתחילים', 'הכשרה', 'קבלת קהל',
  'עמידה בתור', 'עבודה בסניף', 'bank teller', 'cashier', 'פרונט'
];

const bankerTags = [
  'בנקאי', 'בנקאית', 'בנק', 'בנקאות', 'יועץ פיננסי', 'ייעוץ פיננסי',
  'שירות לקוחות מתקדם', 'פתיחת חשבונות', 'הלוואות', 'משכנתאות', 'אשראי',
  'ייעוץ השקעות', 'ניהול תיקים', 'מכירות', 'יעדים', 'עמידה ביעדים',
  'banker', 'financial advisor', 'עבודה מול קהל', 'ניסיון בשירות'
];

const liveTags = [
  'בנקאי דיגיטלי', 'בנקאות דיגיטלית', 'LIVE', 'לייב', 'שירות מרחוק',
  'צאט', 'וידאו', 'שירות לקוחות טלפוני', 'מוקד', 'קול סנטר', 'call center',
  'משמרות', 'עבודה בבית', 'היברידי', 'digital banking', 'remote service',
  'טכנולוגיה', 'אפליקציה', 'online banking', 'עבודה במרכז שירות'
];

// הגדרת אזורים ומשרות
const regions = {
  'מרכז': {
    code: 'JB-107',
    locations: 'תל אביב, רמת גן, בת ים והסביבה',
    positions: [
      { type: 'טלר', location: 'תל אביב', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '13,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'תל אביב', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '13,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'רמת גן', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'רמת גן', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'בת ים', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'בת ים', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'בנקאי', location: 'תל אביב', schedule: 'רצוף', salary: '10,000 ₪ + 11,500 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'תל אביב', schedule: 'מפוצל', salary: '10,000 ₪ + 11,500 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'רמת גן', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'רמת גן', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'בת ים', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'בת ים', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
    ]
  },
  'דן': {
    code: 'JB-110',
    locations: 'חולון, גבעתיים, בני ברק, פתח תקווה והסביבה',
    positions: [
      { type: 'טלר', location: 'חולון/גבעתיים', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'בני ברק/פתח תקווה', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'חולון/גבעתיים', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'בני ברק/פתח תקווה', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'בנקאי', location: 'חולון/גבעתיים', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'בני ברק/פתח תקווה', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'מרחב דן', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
    ]
  },
  'יהודה': {
    code: 'JB-109',
    locations: 'ירושלים, מודיעין, לוד, בית שמש והסביבה',
    positions: [
      { type: 'טלר', location: 'ירושלים', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'ירושלים', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'מודיעין/לוד', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'בית שמש', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'בנקאי', location: 'ירושלים', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'ירושלים', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'מודיעין/לוד', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'בית שמש', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'מרחב יהודה', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
    ]
  },
  'LIVE': {
    code: 'JB-4100',
    locations: 'עבודה היברידית - מרכז שירות',
    positions: [
      { type: 'בנקאי דיגיטלי', location: 'מרכז שירות LIVE', schedule: 'משמרות', salary: '9,700 ₪ + 11,100 ₪ שכר 13', bonus: '' },
    ]
  },
  'דרום': {
    code: 'JB-111',
    locations: 'ראשון לציון, רחובות, באר שבע, ערד והסביבה',
    positions: [
      { type: 'טלר', location: 'ראשון לציון/רחובות', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'באר שבע/ערד', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'מרחב דרום', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'בנקאי', location: 'ראשון לציון/רחובות', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'באר שבע/ערד', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'מרחב דרום', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
    ]
  },
  'צפון': {
    code: 'JB-113',
    locations: 'חיפה, קריות, כרמיאל, נוף הגליל והסביבה',
    positions: [
      { type: 'טלר', location: 'חיפה/קריות', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'כרמיאל/נוף הגליל', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'בנקאי', location: 'חיפה/קריות', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'כרמיאל/נוף הגליל', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
    ]
  },
  'שרון': {
    code: 'JB-108',
    locations: 'כפר סבא, רעננה, נתניה, הוד השרון והסביבה',
    positions: [
      { type: 'טלר', location: 'כפר סבא/רעננה', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'נתניה/הוד השרון', schedule: 'רצוף', salary: '8,200 ₪ + 9,500 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'טלר', location: 'מרחב שרון', schedule: 'מפוצל', salary: '9,300 ₪ + 10,700 ₪ שכר 13', bonus: '7,000 ₪ מענק התמדה' },
      { type: 'בנקאי', location: 'כפר סבא/רעננה', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'נתניה/הוד השרון', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'מרחב שרון', schedule: 'מפוצל', salary: '9,600 ₪ + 10,900 ₪ שכר 13', bonus: '' },
      { type: 'בנקאי', location: 'הרצליה/הוד השרון', schedule: 'רצוף', salary: '8,400 ₪ + 9,800 ₪ שכר 13', bonus: '' },
    ]
  }
};

export async function GET() {
  try {
    const results: any[] = [];
    
    // חיפוש/יצירת מעסיק מזרחי טפחות
    let employer = await prisma.employer.findFirst({
      where: { name: { contains: 'מזרחי' } }
    });
    
    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'מזרחי טפחות',
          industry: 'בנקאות',
          contactPerson: '',
          email: '', // ללא מייל - לא לשלוח התראות
          phone: '',
          address: 'ישראל'
        }
      });
    } else {
      // עדכון המעסיק ללא מייל
      await prisma.employer.update({
        where: { id: employer.id },
        data: { email: '' }
      });
    }

    // מחיקת משרות מזרחי קיימות
    const deleted = await prisma.position.deleteMany({
      where: { employerId: employer.id }
    });
    results.push({ action: 'deleted', count: deleted.count });

    // יצירת משרות חדשות
    let positionCount = 0;
    
    for (const [regionName, regionData] of Object.entries(regions)) {
      for (const pos of regionData.positions) {
        const isTeller = pos.type === 'טלר';
        const isLive = pos.type === 'בנקאי דיגיטלי';
        const tags = isLive ? liveTags : (isTeller ? tellerTags : bankerTags);
        
        const scheduleHebrew = pos.schedule === 'רצוף' ? 'יום עבודה רצוף' : 
                              pos.schedule === 'מפוצל' ? 'יום עבודה מפוצל' : 'משמרות';
        
        const title = isLive 
          ? `${pos.type} - ${regionData.code}`
          : `${pos.type}/ית סניף ${pos.schedule} - ${pos.location} - ${regionData.code}`;
        
        let description = `**${pos.type} בבנק מזרחי טפחות**\n\n`;
        description += `📍 מיקום: ${pos.location}\n`;
        description += `⏰ סוג משרה: ${scheduleHebrew}\n`;
        description += `💰 שכר: ${pos.salary}\n`;
        if (pos.bonus) description += `🎁 ${pos.bonus}\n`;
        description += `\n**דרישות:**\n`;
        
        if (isTeller) {
          description += `• ללא ניסיון קודם - הכשרה מלאה\n`;
          description += `• יכולת עבודה מול קהל\n`;
          description += `• דיוק ואחריות\n`;
          description += `• זמינות מיידית\n`;
        } else if (isLive) {
          description += `• ניסיון בשירות לקוחות - יתרון\n`;
          description += `• יכולת עבודה במשמרות\n`;
          description += `• אוריינטציה טכנולוגית\n`;
          description += `• יכולת מולטי-טאסקינג\n`;
        } else {
          description += `• ניסיון בשירות לקוחות - יתרון\n`;
          description += `• יכולות מכירה ושכנוע\n`;
          description += `• יחסי אנוש מעולים\n`;
          description += `• יכולת עבודה בלחץ\n`;
        }
        
        description += `\n**תנאים:**\n`;
        description += `• משרה מלאה, ימים א'-ה'\n`;
        description += `• שכר בסיס + שכר 13\n`;
        description += `• הכשרה מקצועית מקיפה\n`;
        description += `• קידום מהיר\n`;
        description += `• תנאים סוציאליים מלאים מיום ראשון\n`;

        await prisma.position.create({
          data: {
            title,
            description,
            location: regionData.locations,
            requirements: isTeller ? 'ללא ניסיון, הכשרה מלאה' : 'ניסיון בשירות לקוחות - יתרון',
            salary: pos.salary,
            jobType: 'משרה מלאה',
            isActive: true,
            employerId: employer.id,
            contactEmail: '', // ללא מייל - לא לשלוח התראות
            tags: tags,
            source: 'מזרחי טפחות',
            externalId: `${regionData.code}-${pos.type}-${pos.location}-${pos.schedule}`.replace(/\s+/g, '-')
          }
        });
        positionCount++;
      }
    }

    results.push({ action: 'created', count: positionCount });

    return NextResponse.json({
      success: true,
      message: `עודכנו ${positionCount} משרות מזרחי טפחות`,
      results,
      employer: employer.name
    });

  } catch (error) {
    console.error('Error updating Mizrahi positions:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
