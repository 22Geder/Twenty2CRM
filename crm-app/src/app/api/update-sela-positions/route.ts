import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// 🏷️ 30 תגיות מותאמות לכל משרה
const POSITION_KEYWORDS: Record<string, string[]> = {
  'אחראי/ת החזרות - בני דרום': [
    'אחראי החזרות', 'מיון', 'סידור ארגזים', 'עבודה פיזית', 'החזרות', 'לוגיסטיקה',
    'מחסן', 'מרלוג', 'סחורה', 'ארגזים', 'סדר וארגון', 'תשומת לב לפרטים',
    'בני דרום', 'אשדוד', 'דרום', 'עבודת שטח', 'אחסנה', 'הפצה',
    'מלאי', 'שרשרת אספקה', 'קליטת סחורה', 'בדיקה', 'מיון סחורה',
    'עבודת כפיים', 'ארוחות', 'החזר נסיעות', 'משמרת בוקר', 'שעתי', 'מחסנים', 'אזור תעשייה'
  ],
  'מלגזן היגש - בני דרום': [
    'מלגזן', 'מלגזה', 'היגש', 'מלגזת היגש', 'רישיון מלגזה', 'forklift', 'reach truck',
    'ליקוט', 'מלקט', 'מחסן', 'לוגיסטיקה', 'בני דרום', 'אשדוד', 'דרום',
    'הסעה', 'הסעות', 'העמסה', 'פריקה', 'משטחים', 'pallet',
    'שינוע', 'סחורה', 'מרלוג', 'מדפים', 'גובה', 'מחסנים',
    'עבודה פיזית', 'משמרת בוקר', 'שעתי', 'אזור תעשייה'
  ],
  'מלקט/ת - אשדוד המדע 2': [
    'מלקט', 'ליקוט', 'ליקוט סחורה', 'הכנת הזמנות', 'מסופון', 'סורק', 'ברקוד',
    'מחסן', 'לוגיסטיקה', 'אשדוד', 'המדע', 'דרום', 'סחורה', 'הזמנות',
    'picker', 'picking', 'warehouse', 'מרלוג', 'מלאי', 'אחסנה',
    'עבודה פיזית', 'משרה מלאה', 'ארוחות', 'שעתי', 'הגעה עצמאית',
    'שרשרת אספקה', 'מחסנים', 'אזור תעשייה', 'הפצה', 'קליטת סחורה'
  ],
  'מחסנאי/ת לילה - אשדוד המדע 2': [
    'מחסנאי', 'מחסן', 'משמרת לילה', 'לילה', 'עבודות מחסן', 'קרונים', 'שרינקים',
    'לוגיסטיקה', 'אשדוד', 'המדע', 'דרום', 'עבודה פיזית', 'warehouse',
    'שינוע', 'סחורה', 'מרלוג', 'מלאי', 'אחסנה', 'סידור',
    'ארגון', 'קליטת סחורה', 'הזזה', 'משמרות', 'ערב',
    'שעתי', 'מחסנים', 'אזור תעשייה', 'הפצה', 'שרשרת אספקה', 'הגעה עצמאית'
  ],
  'מלגזן היגש - אשדוד המדע 2': [
    'מלגזן', 'מלגזה', 'היגש', 'מלגזת היגש', 'רישיון מלגזה', 'forklift', 'reach truck',
    'מחסן', 'לוגיסטיקה', 'אשדוד', 'המדע', 'דרום', 'סחורה',
    'ליקוט', 'משטחים', 'pallet', 'העמסה', 'פריקה', 'מדפים',
    'גובה', 'שינוע', 'מרלוג', 'warehouse', 'מחסנים',
    'עבודה פיזית', 'משמרת בוקר', 'שעתי', 'אזור תעשייה', 'הגעה עצמאית', 'מלאי'
  ],
  'מלגזן היגש - סלע 3 המתכת 5 אשדוד': [
    'מלגזן', 'מלגזה', 'היגש', 'מלגזת היגש', 'רישיון מלגזה', 'forklift', 'reach truck',
    'ליקוט', 'מסופון', 'מחסן', 'לוגיסטיקה', 'אשדוד', 'המתכת', 'דרום',
    'סחורה', 'משטחים', 'pallet', 'העמסה', 'פריקה', 'מדפים',
    'גובה', 'שינוע', 'מרלוג', 'warehouse', 'מחסנים',
    'עבודה פיזית', 'משמרת בוקר', 'שעתי', 'אזור תעשייה', 'סלע'
  ],
  'בקר/ית סחורה בוקר וערב - בית שמש ברוש': [
    'בקר', 'בקרה', 'בקר סחורה', 'בדיקה', 'מסופון', 'סורק', 'ברקוד',
    'הזמנות', 'הפצה', 'משאיות', 'העמסה', 'פריטים', 'מחסן', 'לוגיסטיקה',
    'בית שמש', 'ברוש', 'אזור תעשייה', 'דיוק', 'תשומת לב', 'אחריות',
    'quality control', 'QC', 'סריקה', 'בדיקת סחורה', 'רמפה',
    'ארוחות חמות', 'משמרות', 'בוקר', 'ערב', 'שעתי', 'עבודה תחת לחץ'
  ],
  'מלגזן מחסנאי לילה - בית שמש ברוש': [
    'מלגזן', 'מחסנאי', 'מלגזה', 'רישיון מלגזה', 'forklift', 'שינוע', 'מוצרי חשמל',
    'מחסן', 'לוגיסטיקה', 'בית שמש', 'ברוש', 'אזור תעשייה',
    'משמרת לילה', 'ערב', 'משמרות', 'עבודה פיזית', 'warehouse',
    'סחורה', 'משטחים', 'pallet', 'העמסה', 'פריקה', 'מרלוג',
    'מדפים', 'גובה', 'ארוחות חמות', 'שעתי', 'ניסיון', 'מלאי', 'אחסנה', 'הפצה'
  ],
  'רפרנט/ית שטח - בית שמש ברוש': [
    'רפרנט', 'רפרנט שטח', 'ניהול נהגים', 'תעודות', 'תקלות', 'העמסה', 'נזקים',
    'אי אספקות', 'תפעול', 'הפצה', 'לוגיסטיקה', 'בית שמש', 'ברוש', 'אזור תעשייה',
    'driver management', 'operations', 'ניידות', 'אסרטיביות', 'סדר וארגון',
    'חשבוניות', 'מסמכים', 'ניהול', 'פתרון בעיות', 'שטח',
    'שעתי', 'משמרת בוקר', 'רתימת עובדים', 'מערך הפצה', 'שרשרת אספקה', 'tracking'
  ],
  'סדרן הפצה - בית שמש': [
    'סדרן', 'סדרן הפצה', 'הפצה', 'קווי הפצה', 'ניהול קבלנים', 'הובלות', 'זמנים',
    'העמסה', 'החזרות', 'דוחות', 'נהגים', 'לוגיסטיקה', 'בית שמש', 'אשדוד',
    'ברוש', 'אזור תעשייה', 'route planning', 'distribution', 'trucks',
    'ניהול זמן', 'תכנון', 'חשיבה לוגית', 'פתרון בעיות', 'לחץ',
    'ניידות', 'גלובלי', 'ארוחות', 'תפעול', 'operations', 'שרשרת אספקה'
  ],
  'אחמש/ית מוקד - אשדוד המדע 2': [
    'אחמש', 'ניהול משמרת', 'מוקד', 'מוקד שירות', 'שירות לקוחות', 'חלוקת עבודה',
    'ניתוב שיחות', 'עומסים', 'תיעדוף', 'שיחות', 'בקרה', 'איכות שירות',
    'תפעול', 'בעיות תפעוליות', 'לוגיסטיקה', 'אשדוד', 'המדע', 'דרום',
    'customer service', 'ניסיון מוקד', 'הובלת צוות', 'אסרטיביות', 'יחסי אנוש',
    'מערכות מוקד', 'שעתי', 'משמרת בוקר', 'ניהול', 'operations', 'פתרון בעיות', 'אזור תעשייה'
  ]
}

// POST /api/update-sela-positions
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 מסנכרן משרות סלע לוגיסטיקה - עדכון יולי 2025...')

    // מצא את המעסיק סלע לוגיסטיקה
    let selaEmployer = await prisma.employer.findFirst({
      where: { 
        OR: [
          { name: { contains: 'סלע', mode: 'insensitive' } },
          { email: { contains: 'sela', mode: 'insensitive' } },
          { email: { contains: 'pninit', mode: 'insensitive' } }
        ]
      }
    })

    if (!selaEmployer) {
      selaEmployer = await prisma.employer.create({
        data: {
          name: 'סלע לוגיסטיקה',
          email: 'pninit@selabonded.co.il',
          phone: '',
          company: 'סלע לוגיסטיקה',
          status: 'active'
        }
      })
      console.log('✅ נוצר מעסיק חדש: סלע לוגיסטיקה')
    }

    console.log(`✅ נמצא מעסיק: ${selaEmployer.name} (${selaEmployer.id})`)

    // ================================
    // 📋 משרות פנינית רויטמן - pninit@selabonded.co.il
    // ================================
    const pninitPositions = [
      {
        title: 'אחראי/ת החזרות - בני דרום',
        location: 'בני דרום',
        workHours: '06:00-15:00',
        salaryRange: '45 ₪/שעה',
        description: `📦 אחראי/ת החזרות - סלע לוגיסטיקה בני דרום

מיון וסידור ארגזים שחוזרים בהחזרות.
עבודה פיזית בחוץ, לא משרדית.

🍽️ ארוחות
🚗 החזר נסיעות

📞 איש קשר: פנינית רויטמן`,
        requirements: `בעל יכולת סדר וארגון ותשומת לב לפרטים
הבנה בסיסית בלוגיסטיקה`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'אחראי/ת החזרות - בני דרום'
      },
      {
        title: 'מלגזן היגש - בני דרום',
        location: 'בני דרום',
        workHours: '08:00-17:00',
        salaryRange: '47 ₪/שעה',
        description: `🏭 מלגזן היגש - סלע לוגיסטיקה בני דרום

עבודה על מלגזת היגש וליקוטים.

🚌 הסעה

📞 איש קשר: פנינית רויטמן`,
        requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
רצון לעבוד`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'מלגזן היגש - בני דרום'
      },
      {
        title: 'מלקט/ת - אשדוד המדע 2',
        location: 'אשדוד - המדע 2',
        workHours: '08:00-17:00',
        salaryRange: '38 ₪/שעה',
        description: `📦 מלקט/ת - סלע לוגיסטיקה אשדוד

ליקוט סחורה והכנת הזמנות, עבודה עם מסופון.

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: פנינית רויטמן`,
        requirements: `נכונות למשרה מלאה
ראש גדול
ניסיון בליקוט - יתרון`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'מלקט/ת - אשדוד המדע 2'
      },
      {
        title: 'מחסנאי/ת לילה - אשדוד המדע 2',
        location: 'אשדוד - המדע 2',
        workHours: '16:30-01:30',
        salaryRange: '42 ₪/שעה',
        description: `🌙 מחסנאי/ת לילה - סלע לוגיסטיקה אשדוד

עבודות מחסן כלליות:
• הזזת קרונים
• שרינקים
• ועוד

משמרת לילה!

📞 איש קשר: פנינית רויטמן`,
        requirements: `נכונות לעבודה פיזית`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'מחסנאי/ת לילה - אשדוד המדע 2'
      },
      {
        title: 'מלגזן היגש - אשדוד המדע 2',
        location: 'אשדוד - המדע 2',
        workHours: '08:00-17:00',
        salaryRange: '47 ₪/שעה',
        description: `🏭 מלגזן היגש - סלע לוגיסטיקה אשדוד

ניסיון על מלגזת היגש / נכונות ללמוד עבודה על מלגזת היגש.
נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן.

📞 איש קשר: פנינית רויטמן`,
        requirements: `רישיון למלגזה - חובה`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'מלגזן היגש - אשדוד המדע 2'
      },
      {
        title: 'מלגזן היגש - סלע 3 המתכת 5 אשדוד',
        location: 'אשדוד - סלע 3, המתכת 5',
        workHours: '06:00-16:00',
        salaryRange: '47 ₪/שעה',
        description: `🏭 מלגזן היגש - סלע לוגיסטיקה אשדוד (סלע 3)

עבודה על מלגזה + ליקוט.

📞 איש קשר: פנינית רויטמן`,
        requirements: `רישיון על מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבוד עם מסופון וללקט`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'מלגזן היגש - סלע 3 המתכת 5 אשדוד'
      },
      {
        title: 'בקר/ית סחורה בוקר וערב - בית שמש ברוש',
        location: 'בית שמש - אזור תעשייה ברוש',
        workHours: '06:00-12:00 / 12:00-21:00',
        salaryRange: '42 ₪/שעה',
        description: `🔍 בקר/ית סחורה - סלע לוגיסטיקה בית שמש

בקרה ובדיקה של ההזמנות לפני ההפצה.
בדיקה מוקפדת של פריטים לפני העמסתם למשאיות.
הבדיקה מתבצעת עם מסופון לפי מקט על הפריט ומול ההזמנה.

משמרת בוקר: 06:00-12:00
משמרת ערב: 12:00-21:00

🍽️ ארוחות חמות

📞 איש קשר: פנינית רויטמן`,
        requirements: `אחריות ורצינות
עבודה עם מסופון - חובה
דיוק ותשומת לב לפרטים קטנים
יכולת עבודה תחת לחץ`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'בקר/ית סחורה בוקר וערב - בית שמש ברוש'
      },
      {
        title: 'מלגזן מחסנאי לילה - בית שמש ברוש',
        location: 'בית שמש - אזור תעשייה ברוש',
        workHours: '12:00-21:00',
        salaryRange: '55 ₪/שעה',
        description: `🌙 מלגזן מחסנאי - סלע לוגיסטיקה בית שמש

מלגזן מחסנאי, שינוע מוצרי חשמל.

🍽️ ארוחות חמות

📞 איש קשר: פנינית רויטמן`,
        requirements: `ניסיון - חובה
רישיון למלגזה - חובה`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il',
        keywordsKey: 'מלגזן מחסנאי לילה - בית שמש ברוש'
      }
    ]

    // ================================
    // 📋 משרות דנה שפירו - danav@selabonded.co.il
    // ================================
    const danaPositions = [
      {
        title: 'רפרנט/ית שטח - בית שמש ברוש',
        location: 'בית שמש - אזור תעשייה ברוש (לוגיסטים)',
        workHours: '06:00-15:00',
        salaryRange: '50 ₪/שעה',
        description: `🚛 רפרנט/ית שטח - לוגיסטים בית שמש

תפקיד שטח:
• ניהול מערך נהגים
• טיפול בתעודות חתומות
• פתרון תקלות בהעמסה ונזקים
• דיווח על אי אספקות

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון בתפעול מערך הפצה - חובה
יכולת רתימת עובדים
יכולת התנהלות עם חשבוניות ומסמכים מרובים
סדר וארגון
אסרטיביות - חובה
ניידות - חובה`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il',
        keywordsKey: 'רפרנט/ית שטח - בית שמש ברוש'
      },
      {
        title: 'סדרן הפצה - בית שמש',
        location: 'בית שמש - אזור תעשייה ברוש (לוגיסטים)',
        workHours: '06:00-16:00',
        salaryRange: '13,000 ₪ גלובלי',
        description: `📋 סדרן הפצה - לוגיסטים בית שמש

• ניהול קבלנים
• הכנת קווי הפצה
• מעקב הובלות ועמידה בזמנים
• טיפול בהעמסה והחזרות
• הנפקת דוחות
• מענה שוטף לפניות הנהגים

תקן אחד באשדוד ותקן אחד בבית שמש!

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון מוכח בתכנון קווי הפצה רבים - חובה
חשיבה לוגית ופתרון בעיות
תפקוד מעולה תחת לחץ
ניידות - חובה`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il',
        keywordsKey: 'סדרן הפצה - בית שמש'
      },
      {
        title: 'אחמש/ית מוקד - אשדוד המדע 2',
        location: 'אשדוד - המדע 2 (לוגיסטים)',
        workHours: '08:00-17:00',
        salaryRange: '55 ₪/שעה',
        description: `📞 אחמש/ית מוקד - לוגיסטים אשדוד

ניהול משמרת בפועל:
• חלוקת עבודה
• ניתוב שיחות
• ניהול עומסים ותיעדוף לפי חשיבות
• מענה לשיחות מנהל
• פניות מורכבות ובקרה של איכות השירות
• טיפול בבעיות תפעוליות בזמן אמת

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון קודם במוקד שירות ללקוחות - חובה
ניסיון כאחמש/ית - חובה
שליטה במערכות מוקד - יתרון
יחסי אנוש מעולים
יכולת הובלת צוות
אסרטיביות`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il',
        keywordsKey: 'אחמש/ית מוקד - אשדוד המדע 2'
      }
    ]

    const allNewPositions = [...pninitPositions, ...danaPositions]
    const newTitles = allNewPositions.map(p => p.title)
    const results: { position: string; action: string; keywords: number }[] = []

    // 1️⃣ בטל משרות שלא ברשימה החדשה
    const deactivated = await prisma.position.updateMany({
      where: {
        employerId: selaEmployer.id,
        title: { notIn: newTitles },
        active: true
      },
      data: { active: false }
    })
    console.log(`🔴 ${deactivated.count} משרות הועברו ללא פעילות`)

    // 2️⃣ עדכן או צור את כל המשרות החדשות
    for (const pos of allNewPositions) {
      const keywords = POSITION_KEYWORDS[pos.keywordsKey] || []

      const existing = await prisma.position.findFirst({
        where: {
          employerId: selaEmployer.id,
          title: pos.title
        }
      })

      if (existing) {
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            location: pos.location,
            description: pos.description,
            requirements: pos.requirements,
            salaryRange: pos.salaryRange,
            contactName: pos.contactName,
            contactEmail: pos.contactEmail,
            keywords: JSON.stringify(keywords),
            employmentType: 'עצמאית',
            active: true,
            priority: 5
          }
        })
        results.push({ position: pos.title, action: '🔄 עודכן', keywords: keywords.length })
      } else {
        await prisma.position.create({
          data: {
            title: pos.title,
            location: pos.location,
            description: pos.description,
            requirements: pos.requirements,
            salaryRange: pos.salaryRange,
            contactName: pos.contactName,
            contactEmail: pos.contactEmail,
            keywords: JSON.stringify(keywords),
            employerId: selaEmployer.id,
            employmentType: 'עצמאית',
            active: true,
            openings: 1,
            priority: 5
          }
        })
        results.push({ position: pos.title, action: '✅ נוצר', keywords: keywords.length })
      }
    }

    // 3️⃣ סטטיסטיקות
    const pninitCount = pninitPositions.length
    const danaCount = danaPositions.length

    return NextResponse.json({
      success: true,
      message: '✅ משרות סלע לוגיסטיקה סונכרנו בהצלחה!',
      employer: selaEmployer.name,
      stats: {
        deactivated: deactivated.count,
        total: results.length,
        pninitPositions: pninitCount,
        danaPositions: danaCount
      },
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
