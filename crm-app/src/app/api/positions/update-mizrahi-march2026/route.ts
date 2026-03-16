import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/positions/update-mizrahi-march2026
 * עדכון מלא של משרות מזרחי טפחות - מרץ 2026
 */

// תגיות בנקאות
const BANK_TAGS = [
  'בנקאות', 'banking', 'בנק', 'מזרחי טפחות', 'Mizrahi Tefahot',
  'טלר', 'teller', 'קופאי', 'שירות לקוחות', 'customer service',
  'פיננסי', 'finance', 'כספים', 'תואר אקדמי', 'כלכלה', 'מנהל עסקים'
]

const MORTGAGE_TAGS = [
  'משכנתאות', 'mortgage', 'הלוואות', 'נדלן', 'real estate',
  'ייעוץ פיננסי', 'מו"מ', 'negotiation', 'אנליטי', 'מכירות'
]

const BUSINESS_TAGS = [
  'בנקאי עסקי', 'business banking', 'לקוחות עסקיים', 'SMB',
  'אשראי עסקי', 'ניהול תיק לקוחות'
]

// פונקציה ליצירת/עדכון משרה
async function upsertPosition(
  employerId: string, 
  title: string, 
  data: {
    description: string
    requirements: string
    location: string
    salaryRange: string
  },
  tagIds: string[]
) {
  const existing = await prisma.position.findFirst({
    where: { employerId, title }
  })

  if (existing) {
    return prisma.position.update({
      where: { id: existing.id },
      data: {
        ...data,
        active: true,
        contactEmail: '', // לא לשלוח מייל ישירות למעסיק
        tags: { set: tagIds.map(id => ({ id })) }
      }
    })
  } else {
    return prisma.position.create({
      data: {
        title,
        ...data,
        active: true,
        employerId,
        contactEmail: '', // לא לשלוח מייל ישירות למעסיק
        tags: { connect: tagIds.map(id => ({ id })) }
      }
    })
  }
}

// רשימת המשרות המעודכנת
const POSITIONS_DATA = [
  // מרחב מרכז JB-107
  {
    title: 'טלר בסניף חצרות יפו - תל אביב',
    location: 'תל אביב - חצרות יפו',
    type: 'רצוף',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר בסניף קרית עתידים רמת החייל - דחוף!',
    location: 'תל אביב - רמת החייל',
    type: 'רצוף',
    status: 'תקן קבוע - דחוף! טלר יחיד בסניף',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר במרכז עסקים תל אביב',
    location: 'תל אביב - מרכז עסקים',
    type: 'רצוף + תורנות שישי',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר 50% במרכז עסקים תל אביב - לסטודנטים',
    location: 'תל אביב - מרכז עסקים',
    type: 'רצוף',
    status: '50% משרה - מתאים לסטודנטים',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר בסניף סקיי טאוור תל אביב',
    location: 'תל אביב - סקיי טאוור',
    type: 'רצוף',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר במרכז עסקים המגדל בורסה רמת גן',
    location: 'רמת גן - הבורסה',
    type: 'רצוף',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר בסניף לב דיזנגוף תל אביב',
    location: 'תל אביב - דיזנגוף',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר במרכז עסקים יהלומים בורסה רמת גן',
    location: 'רמת גן - הבורסה',
    type: 'רצוף',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'טלר מתנייד - תל אביב, רמת גן, בת ים',
    location: 'תל אביב, רמת גן, בת ים',
    type: 'מתנייד',
    status: 'תקן קבוע - אפשרי גם 3 ימים בשבוע',
    code: 'JB-107',
    area: 'מרכז'
  },
  {
    title: 'בנקאי מתנייד - תל אביב, רמת גן, בת ים',
    location: 'תל אביב, רמת גן, בת ים',
    type: 'מתנייד',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true
  },
  {
    title: 'בנקאי עסקי במרכז עסקים המגדל בורסה רמת גן',
    location: 'רמת גן - הבורסה',
    type: 'רצוף',
    status: 'החלפת חל"ד',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true,
    isBusiness: true
  },
  {
    title: 'בנקאי עסקי בסניף גן העיר תל אביב',
    location: 'תל אביב - גן העיר',
    type: 'רצוף',
    status: 'החלפת חל"ד',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true,
    isBusiness: true
  },
  {
    title: 'בנקאי עסקי בסניף כיכר המדינה',
    location: 'תל אביב - כיכר המדינה',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true,
    isBusiness: true
  },
  {
    title: 'בנקאי משכנתאות מתנייד - תל אביב, רמת גן, בת ים',
    location: 'תל אביב, רמת גן, בת ים',
    type: 'מתנייד',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true,
    isMortgage: true
  },
  {
    title: 'בנקאי משכנתאות בסניף חשמונאים תל אביב',
    location: 'תל אביב - חשמונאים',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true,
    isMortgage: true
  },
  {
    title: 'בנקאי משכנתאות בסניף בת ים',
    location: 'בת ים',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true,
    isMortgage: true
  },
  {
    title: 'בנקאי לקוחות במרכז עסקים תל אביב',
    location: 'תל אביב - מרכז עסקים',
    type: 'רצוף',
    status: 'תקן קבוע',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true
  },
  {
    title: 'בנקאי לסניף הפעילות הבינלאומית - צרפתית',
    location: 'תל אביב - סניף בינלאומי',
    type: 'מפוצל ב\'-ו\'',
    status: 'תקן קבוע - נדרש צרפתית, אנגלית ועברית',
    code: 'JB-107',
    area: 'מרכז',
    isBanker: true
  },

  // מרחב דן JB-110
  {
    title: 'טלר בסניף פארק עסקים חולון',
    location: 'חולון - פארק עסקים',
    type: 'רצוף',
    status: 'תקן זמני',
    code: 'JB-110',
    area: 'דן'
  },
  {
    title: 'טלר בסניף כפר קאסם',
    location: 'כפר קאסם',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-110',
    area: 'דן'
  },
  {
    title: 'טלר בסניף קרית אונו',
    location: 'קרית אונו',
    type: 'מפוצל ב\'-ו\'',
    status: 'החלפת חל"ד',
    code: 'JB-110',
    area: 'דן'
  },
  {
    title: 'טלר בסניף גבעתיים',
    location: 'גבעתיים',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-110',
    area: 'דן'
  },
  {
    title: 'טלר מתנייד מרחב דן',
    location: 'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין',
    type: 'מתנייד',
    status: 'תקן קבוע',
    code: 'JB-110',
    area: 'דן'
  },
  {
    title: 'בנקאי לקוחות בסניף קרית אילון חולון',
    location: 'חולון - קרית אילון',
    type: 'מפוצל ב\'-ו\'',
    status: 'תקן קבוע',
    code: 'JB-110',
    area: 'דן',
    isBanker: true
  },
  {
    title: 'בנקאי עסקי בסניף בר אילן',
    location: 'בני ברק - בר אילן',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-110',
    area: 'דן',
    isBanker: true,
    isBusiness: true
  },

  // מרחב יהודה JB-109
  {
    title: 'טלר מתנייד ירושלים - 40-50% משרה',
    location: 'ירושלים והסביבה',
    type: 'מתנייד',
    status: '40-50% משרה - מתאים לסטודנטים',
    code: 'JB-109',
    area: 'יהודה'
  },
  {
    title: 'בנקאי משכנתאות מרחבי ירושלים',
    location: 'ירושלים והסביבה',
    type: 'מתנייד - בעיקר מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-109',
    area: 'יהודה',
    isBanker: true,
    isMortgage: true
  },
  {
    title: 'טלר בסניף קרית עסקים ירושלים',
    location: 'ירושלים - קרית עסקים',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-109',
    area: 'יהודה'
  },
  {
    title: 'טלר בסניף רוממה ירושלים',
    location: 'ירושלים - רוממה',
    type: 'מפוצל ב\'-ו\'',
    status: 'החלפת חל"ד',
    code: 'JB-109',
    area: 'יהודה'
  },
  {
    title: 'בנקאי לקוחות בסניף מלכי ישראל ירושלים',
    location: 'ירושלים - מלכי ישראל',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-109',
    area: 'יהודה',
    isBanker: true
  },
  {
    title: 'בנקאי עסקי בסניף קש"ת אירפורט סיטי',
    location: 'אירפורט סיטי - קרית שדה התעופה',
    type: 'רצוף',
    status: 'תקן קבוע',
    code: 'JB-109',
    area: 'יהודה',
    isBanker: true,
    isBusiness: true
  },
  {
    title: 'בנקאי משכנתאות בסניף מודיעין',
    location: 'מודיעין',
    type: 'מפוצל ב\'-ו\'',
    status: 'החלפת חל"ד',
    code: 'JB-109',
    area: 'יהודה',
    isBanker: true,
    isMortgage: true
  },
  {
    title: 'טלר בסניף מט"ל לוד',
    location: 'לוד - אזור תעשייה צפוני',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-109',
    area: 'יהודה'
  },
  {
    title: 'טלר בסניף בית שמש',
    location: 'בית שמש',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-109',
    area: 'יהודה'
  },

  // מרחב LIVE JB-4100
  {
    title: 'בנקאי LIVE - סניף וירטואלי לוד',
    location: 'לוד - מט"ל (רמלה, מודיעין, שוהם, ראשל"צ, רחובות, אשדוד)',
    type: 'משמרות 7:00-20:00',
    status: 'החלפת חל"ד - קליטה בתקן קבוע',
    code: 'JB-4100',
    area: 'LIVE',
    isBanker: true,
    isLive: true
  },

  // מרחב דרום JB-111
  {
    title: 'טלר בסניף ערד',
    location: 'ערד',
    type: 'מפוצל',
    status: 'תקן קבוע',
    code: 'JB-111',
    area: 'דרום'
  },
  {
    title: 'טלר בסניף דימונה',
    location: 'דימונה',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-111',
    area: 'דרום'
  },
  {
    title: 'טלר בסניף אזור תעשייה ראשון לציון',
    location: 'ראשון לציון - אזור תעשייה',
    type: 'רצוף',
    status: 'החלפת חל"ד',
    code: 'JB-111',
    area: 'דרום'
  },
  {
    title: 'טלר בסניף רחובות',
    location: 'רחובות',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-111',
    area: 'דרום'
  },
  {
    title: 'טלר מתנייד ראשל"צ, רחובות, נס ציונה, יבנה',
    location: 'ראשון לציון, רחובות, נס ציונה, יבנה',
    type: 'מתנייד - רוב מפוצלים',
    status: 'תקן זמני',
    code: 'JB-111',
    area: 'דרום'
  },
  {
    title: 'טלר מתנייד באר שבע, ערד, דימונה',
    location: 'באר שבע, ערד, דימונה (אופקים, נתיבות במידת הצורך)',
    type: 'מתנייד - רוב מפוצלים',
    status: 'תקן קבוע',
    code: 'JB-111',
    area: 'דרום'
  },

  // מרחב צפון JB-113
  {
    title: 'טלר לימי שני 50% בסניף הדר חיפה - לסטודנטים',
    location: 'חיפה - הדר',
    type: 'מפוצל',
    status: 'תקן קבוע 50% - מתאים לסטודנטים',
    code: 'JB-113',
    area: 'צפון'
  },
  {
    title: 'טלר מתנייד קריות',
    location: 'קריות והסביבה (עד 40 ק"מ)',
    type: 'מתנייד',
    status: 'החלפת חל"ד - עדיפות לבעלי רכב',
    code: 'JB-113',
    area: 'צפון'
  },
  {
    title: 'טלר מתנייד כרמיאל',
    location: 'כרמיאל והסביבה (עד 40 ק"מ)',
    type: 'מתנייד',
    status: 'החלפת חל"ד - עדיפות לבעלי רכב',
    code: 'JB-113',
    area: 'צפון'
  },
  {
    title: 'בנקאי משכנתאות מתנייד נוף הגליל/נצרת',
    location: 'נוף הגליל, נצרת, עפולה, יוקנעם, מגדל העמק, שפרעם, סכנין',
    type: 'מתנייד',
    status: 'תקן קבוע - נדרש רכב ותואר כלכלה/מנה"ס',
    code: 'JB-113',
    area: 'צפון',
    isBanker: true,
    isMortgage: true
  },

  // מרחב שרון JB-108
  {
    title: 'טלר בסניף אזור תעשייה כפר סבא',
    location: 'כפר סבא - אזור תעשייה',
    type: 'רצוף',
    status: 'החלפת חל"ד',
    code: 'JB-108',
    area: 'שרון'
  },
  {
    title: 'טלר בסניף ויצמן כפר סבא',
    location: 'כפר סבא - ויצמן',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-108',
    area: 'שרון'
  },
  {
    title: 'בנקאי משכנתאות באחוזה מערב רעננה',
    location: 'רעננה - אחוזה מערב',
    type: 'מפוצל ב\'-ו\'',
    status: 'תקן קבוע',
    code: 'JB-108',
    area: 'שרון',
    isBanker: true,
    isMortgage: true
  },
  {
    title: 'טלר בסניף כיכר המושבה הוד השרון',
    location: 'הוד השרון - כיכר המושבה',
    type: 'מפוצל',
    status: 'תקן זמני',
    code: 'JB-108',
    area: 'שרון'
  },
  {
    title: 'טלר בסניף באקה אל גרביה',
    location: 'באקה אל גרביה',
    type: 'מפוצל',
    status: 'החלפת חל"ד',
    code: 'JB-108',
    area: 'שרון'
  },
  {
    title: 'טלר בסניף שטמפפר נתניה',
    location: 'נתניה - שטמפפר',
    type: 'מפוצל ב\'-ו\'',
    status: 'תקן זמני',
    code: 'JB-108',
    area: 'שרון'
  },
  {
    title: 'טלר מתנייד מרחב שרון דרומי',
    location: 'נתניה, רעננה, הרצליה, כפר סבא, רמת השרון, הוד השרון',
    type: 'מתנייד',
    status: 'תקן קבוע',
    code: 'JB-108',
    area: 'שרון'
  }
]

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()
    
    if (adminKey !== 'twenty2mizrahi2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🏦 מעדכן משרות מזרחי טפחות - מרץ 2026...')

    // מציאת מעסיק מזרחי
    let employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'מזרחי' } },
          { name: { contains: 'Mizrahi' } }
        ]
      }
    })

    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'בנק מזרחי טפחות',
          email: '',
          phone: '',
          description: '🏦 בנק מזרחי טפחות - מהבנקים המובילים בישראל. סניפים ברחבי הארץ.'
        }
      })
    }

    // כיבוי כל המשרות הקיימות של מזרחי
    await prisma.position.updateMany({
      where: { employerId: employer.id },
      data: { active: false }
    })

    // יצירת תגיות
    const bankTags = await Promise.all(
      BANK_TAGS.map(tagName => 
        prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } })
      )
    )
    const mortgageTags = await Promise.all(
      MORTGAGE_TAGS.map(tagName => 
        prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } })
      )
    )
    const businessTags = await Promise.all(
      BUSINESS_TAGS.map(tagName => 
        prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } })
      )
    )

    const createdPositions = []

    for (const pos of POSITIONS_DATA) {
      // בחירת תגיות לפי סוג המשרה
      let tagIds = bankTags.map(t => t.id)
      if (pos.isMortgage) {
        tagIds = [...tagIds, ...mortgageTags.map(t => t.id)]
      }
      if (pos.isBusiness) {
        tagIds = [...tagIds, ...businessTags.map(t => t.id)]
      }

      // שכר לפי סוג העסקה
      let salary = ''
      if (pos.isLive) {
        salary = 'חודשי: 9,700 ₪ | ממוצע שנתי: 11,100 ₪'
      } else if (pos.isBanker) {
        if (pos.type.includes('רצוף')) {
          salary = 'חודשי: 8,400 ₪ | ממוצע שנתי: 9,800 ₪ (כולל 10 ש"נ ונסיעות)'
        } else {
          salary = 'חודשי: 9,600 ₪ | ממוצע שנתי: 10,900 ₪ (כולל 8 פיצולים, 10 ש"נ ונסיעות)'
        }
        if (pos.area === 'מרכז' && pos.location.includes('תל אביב')) {
          salary += ' | אפשרי עד 10,000 ₪ חודשי למתאימים'
        }
      } else {
        // טלר
        if (pos.type.includes('רצוף')) {
          salary = 'חודשי: 8,200 ₪ | ממוצע שנתי: 9,500 ₪ (כולל 10 ש"נ ונסיעות)'
        } else {
          salary = 'חודשי: 9,300 ₪ | ממוצע שנתי: 10,700 ₪ (כולל 8 פיצולים, 10 ש"נ ונסיעות)'
        }
        // מענק התמדה לטלרים
        if (pos.area === 'מרכז' && pos.location.includes('תל אביב')) {
          salary += ' + מענק התמדה 13,000 ₪ (3 חודשים: 3,000₪, 6 חודשים: 5,000₪, שנה: 5,000₪)'
        } else {
          salary += ' + מענק התמדה 7,000 ₪ (חצי שנה: 3,500₪, שנה: 3,500₪)'
        }
      }

      // תיאור המשרה
      let description = `🏦 ${pos.title}

📍 מיקום: ${pos.location}
📋 סוג סניף: ${pos.type}
📊 סטטוס: ${pos.status}
🔢 קוד משרה: ${pos.code}
🗺️ מרחב: ${pos.area}`

      if (pos.isLive) {
        description += `

⏰ עבודה במשמרות:
• בוקר: 7:00-15:00
• ביניים: 8:00-16:00 / 9:00-17:00 / 10:00-18:00
• ערב: 11:00-20:00
• 2 משמרות ערב בשבוע
• שישי: אחת ל-3 שבועות

💼 מהות העבודה:
בנקאי לקוחות בסניף וירטואלי - מתן שירות טלפוני בשימוש מעטפת דיגיטלית וכלים מתקדמים.`
      }

      // דרישות
      let requirements = `✅ דרישות:
• תודעת שירות גבוהה ויכולות מכירה
• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול
• ניסיון בתפקידי שירות ו/או מכירה - יתרון משמעותי`

      if (pos.isMortgage) {
        requirements += `
• תואר פיננסי - חובה (לצורך למידת התחום)
• יכולת מכירתית גבוהה וניהול מו"מ
• יכולת אנליטית ווורבלית
• סדר וארגון קפדני`
      }

      if (pos.status.includes('מתאים לסטודנטים')) {
        requirements += `

📚 מתאים לסטודנטים! יש לציין ימי ושעות לימודים.`
      }

      const position = await upsertPosition(
        employer.id,
        pos.title,
        {
          description,
          requirements,
          location: pos.location,
          salaryRange: salary
        },
        tagIds
      )
      createdPositions.push(position)
    }

    return NextResponse.json({
      success: true,
      message: `עודכנו ${createdPositions.length} משרות במזרחי טפחות`,
      employer: { id: employer.id, name: employer.name },
      positionsCount: createdPositions.length,
      areas: {
        'מרכז JB-107': POSITIONS_DATA.filter(p => p.code === 'JB-107').length,
        'דן JB-110': POSITIONS_DATA.filter(p => p.code === 'JB-110').length,
        'יהודה JB-109': POSITIONS_DATA.filter(p => p.code === 'JB-109').length,
        'LIVE JB-4100': POSITIONS_DATA.filter(p => p.code === 'JB-4100').length,
        'דרום JB-111': POSITIONS_DATA.filter(p => p.code === 'JB-111').length,
        'צפון JB-113': POSITIONS_DATA.filter(p => p.code === 'JB-113').length,
        'שרון JB-108': POSITIONS_DATA.filter(p => p.code === 'JB-108').length
      }
    })

  } catch (error) {
    console.error('❌ Error updating Mizrahi positions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update positions', details: errorMessage },
      { status: 500 }
    )
  }
}
