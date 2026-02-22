import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 🏷️ תגיות לוגיסטיקה מקיפות - 60+ תגיות לכל משרה
const LOGISTICS_BASE_KEYWORDS = [
  // עברית - לוגיסטיקה כללי
  'לוגיסטיקה', 'מחסן', 'מחסנים', 'מרלוג', 'מרכז לוגיסטי', 'שרשרת אספקה', 'supply chain',
  'הפצה', 'הובלה', 'משלוחים', 'שינוע', 'תובלה', 'סחורה', 'מלאי', 'מלאים', 'inventory',
  'אחסון', 'אחסנה', 'קליטה', 'קליטת סחורה', 'הזמנות', 'הזמנה', 'תעודות משלוח',
  // ציוד ומערכות
  'מלגזה', 'מלגזן', 'מלגזנים', 'היגש', 'מלגזת היגש', 'רייצ\'ר', 'reach truck', 'forklift',
  'מסופון', 'סורק', 'ברקוד', 'barcode', 'WMS', 'מערכת ניהול מחסן', 'ERP', 'SAP',
  'פלטה', 'משטח', 'משטחים', 'pallet', 'רמפה', 'רמפות', 'dock', 'מטען', 'מטענים',
  // תפקידים
  'ליקוט', 'מלקט', 'picker', 'picking', 'פקיד מחסן', 'מחסנאי', 'warehouse', 'עובד מחסן',
  'בקר', 'בקרה', 'בקר סחורה', 'quality control', 'QC', 'בדיקה', 'סריקה',
  'סדרן', 'סדרן הפצה', 'רפרנט', 'רפרנט שטח', 'תפעול', 'operations',
  // מיקומים
  'אשדוד', 'בית שמש', 'דרום', 'מרכז', 'נגב', 'שפלה', 'חפץ חיים', 'בני דרום', 'מבקיעים',
  'אזור תעשייה', 'industrial', 'park', 'מפעל', 'factory',
  // תנאים
  'משמרות', 'בוקר', 'לילה', 'ערב', 'משמרת', 'שעתי', 'גלובלי', 'שכר שעתי',
  'הסעה', 'הסעות', 'ארוחות', 'ארוחה חמה', 'תנאים סוציאליים',
  // דרישות כלליות
  'רישיון נהיגה', 'ניידות', 'עבודה פיזית', 'כושר גופני', 'אחריות', 'סדר וארגון',
  'עבודת צוות', 'לחץ', 'עבודה תחת לחץ', 'דיוק', 'תשומת לב', 'זהירות', 'בטיחות'
]

// תגיות ספציפיות לפי סוג משרה
const SPECIFIC_KEYWORDS: Record<string, string[]> = {
  מלגזן: ['רישיון מלגזה', 'מלגזה חשמלית', 'מלגזת קומה', 'העמסה', 'פריקה', 'הרמה', 'נסיעה',
    'תמרון', 'הובלת סחורה', 'סידור מחסן', 'הנחת משטחים', 'גובה', 'מדפים', 'racks', 'shelves',
    'יציבות', 'בטיחות מלגזה', 'תחזוקה', 'בדיקה יומית', 'דלק', 'חשמל', 'סוללה', 'טעינה'],
  היגש: ['reach', 'גובה רב', 'narrow aisle', 'מעברים צרים', 'דיוק גבוה', 'שליפה מגובה',
    'אחסון גבוה', 'מרפסות', 'רמות', 'levels', 'תיאום יד-עין', 'ריכוז', 'זהירות רבה'],
  פקיד: ['אדמיניסטרציה', 'משרדי', 'מחשב', 'אקסל', 'Excel', 'Word', 'מערכות מידע',
    'ניהול מלאי', 'דוחות', 'תיעוד', 'רישום', 'עדכון נתונים', 'קלדנות', 'הקלדה',
    'קליטת עובדים', 'נוכחות', 'דיווח', 'רוסית', 'שפות', 'תקשורת'],
  מלקט: ['ליקוט הזמנות', 'order picking', 'walking', 'הליכה', 'חיפוש', 'איתור',
    'מסופון הזמנות', 'RF', 'voice picking', 'קול', 'הנחיות', 'רשימה', 'list',
    'מהירות', 'speed', 'יעילות', 'efficiency', 'דיוק בליקוט', 'אריזה', 'packing'],
  בקר: ['בקרת איכות', 'בדיקת סחורה', 'inspection', 'verify', 'אימות', 'התאמה',
    'תעודות', 'חשבוניות', 'invoices', 'נזקים', 'damage', 'חריגות', 'exceptions',
    'דיווח ליקויים', 'דחייה', 'החזרה', 'rejection', 'return', 'documentation'],
  מחסנאי: ['עבודת מחסן', 'קבלה', 'receiving', 'שינוע פנימי', 'internal', 'movement',
    'סידור', 'ארגון', 'organization', 'ניקיון', 'תחזוקת מחסן', 'orderly', 'neat'],
  שירות: ['שירות לקוחות', 'customer service', 'טלפון', 'מענה', 'תיאום', 'coordination',
    'פניות', 'complaints', 'תלונות', 'פתרון בעיות', 'problem solving', 'follow up',
    'מעקב', 'SLA', 'זמני תגובה', 'response time', 'ידידותי', 'friendly', 'סבלנות'],
  רפרנט: ['ניהול נהגים', 'driver management', 'תשובות', 'מעקב משלוחים', 'tracking',
    'פתרון תקלות', 'troubleshooting', 'החלטות', 'decisions', 'עצמאות', 'independence',
    'אחריות מערכתית', 'קשר עם לקוחות', 'supplier', 'ספקים', 'vendors'],
  סדרן: ['תכנון קווים', 'route planning', 'optimization', 'אופטימיזציה', 'לוגיסטיקת הפצה',
    'distribution', 'קבלנים', 'contractors', 'משאיות', 'trucks', 'זמנים', 'timing',
    'עמידה בלוחות זמנים', 'deadline', 'ניהול זמן', 'time management'],
  לקוח: ['נציג לקוח', 'account', 'חשבון', 'ניהול הזמנות', 'order management',
    'סטטוס', 'status', 'עדכונים', 'updates', 'שקיפות', 'transparency', 'דיוק נתונים']
}

// יצירת 60 תגיות מותאמות לכל משרה
function generateKeywordsForPosition(title: string, description: string, location: string): string[] {
  const allKeywords = new Set<string>(LOGISTICS_BASE_KEYWORDS)
  
  // הוסף תגיות ספציפיות לפי סוג המשרה
  const titleLower = title.toLowerCase()
  const descLower = (description || '').toLowerCase()
  
  for (const [type, keywords] of Object.entries(SPECIFIC_KEYWORDS)) {
    if (titleLower.includes(type) || descLower.includes(type)) {
      keywords.forEach(k => allKeywords.add(k))
    }
  }
  
  // הוסף מיקום
  if (location) {
    allKeywords.add(location)
    if (location.includes('אשדוד')) {
      allKeywords.add('אזור אשדוד')
      allKeywords.add('דרום')
      allKeywords.add('שפלה דרומית')
    }
    if (location.includes('בית שמש')) {
      allKeywords.add('אזור בית שמש')
      allKeywords.add('שפלה')
      allKeywords.add('הר טוב')
    }
  }
  
  // החזר עד 60 תגיות
  return Array.from(allKeywords).slice(0, 60)
}

// GET /api/update-sela-positions
export async function GET() {
  try {
    console.log('🔧 מסנכרן משרות סלע לוגיסטיקה - דצמבר 2025...')

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
      // צור מעסיק חדש
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
    // 📋 משרות פנינית - pninit@selabonded.co.il
    // ================================
    const pninitPositions = [
      {
        title: 'מלגזן היגש - בני דרום',
        location: 'בני דרום',
        workHours: '08:00-17:00',
        salaryRange: '47 ₪/שעה',
        description: `🏭 מלגזן היגש - סלע לוגיסטיקה בני דרום

עבודה על מלגזת היגש וליקוטים במחסן לוגיסטי.

🍽️ ארוחות חמות
🚌 הסעות מאשדוד

📞 איש קשר: פנינית רויטמן`,
        requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
רצון לעבוד ונכונות ללמוד`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      },
      {
        title: 'פקיד/ה מחסן - בני דרום',
        location: 'בני דרום',
        workHours: '08:00-17:00',
        salaryRange: '42 ₪/שעה',
        description: `📋 פקיד/ה מחסן - סלע לוגיסטיקה בני דרום

ניהול כל המערך האדמיניסטרטיבי של המחסן בשילוב של עבודה משרדית ועבודה בשטח:
• בקרה על קליטת סחורה והפצתה
• ניהול מלאי שוטף
• קליטת עובדים חדשים
• טיפול בנוכחות העובדים
• אדמיניסטרציה שוטפת

🍽️ ארוחות חמות
🚗 הגעה עצמאית

⚠️ נדרשת שליטה בשפה הרוסית!

📞 איש קשר: פנינית רויטמן`,
        requirements: `נדרשת שליטה בשפה הרוסית - חובה! (עבודה מול גורמים דוברי רוסית)
ניסיון קודם בתפקיד דומה - חובה
ניסיון במערכת WMS - יתרון משמעותי
יכולת עבודה בסביבה ממוחשבת
עבודה באקסל - חובה
ניידות - חובה`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      },
      {
        title: 'פקיד/ה מלאי - חפץ חיים',
        location: 'חפץ חיים',
        workHours: '08:00-17:00',
        salaryRange: '45 ₪/שעה',
        description: `📋 פקיד/ה מלאי - סלע לוגיסטיקה חפץ חיים

• בקרה על קליטת סחורה והפצתה
• ניהול מלאי שוטף
• קליטת עובדים חדשים
• טיפול בנוכחות העובדים
• אדמיניסטרציה שוטפת

העבודה מחולקת בין עבודה על המחשב ובין עשייה פיזית ברצפת המרלו"ג:
הדבקת מדבקות על המשטחים, סיווג המשטחים לפי הדרישה ועוד.

🍽️ ארוחות חמות
🚗 הגעה עצמאית

📞 איש קשר: פנינית רויטמן`,
        requirements: `ניסיון קודם בתפקיד דומה - חובה
ניסיון במערכת WMS - יתרון משמעותי
יכולת עבודה בסביבה ממוחשבת
עבודה באקסל - חובה
ניידות - חובה`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      },
      {
        title: 'מלקט/ת - אשדוד המדע 2',
        location: 'אשדוד - המדע 2',
        workHours: '08:00-17:00',
        salaryRange: '38 ₪/שעה',
        description: `📦 מלקט/ת - סלע לוגיסטיקה אשדוד

ליקוט סחורה והכנת הזמנות, עבודה עם מסופון.

🍽️ ארוחות
🚌 הסעות מבאר שבע

📞 איש קשר: פנינית רויטמן`,
        requirements: `נכונות למשרה מלאה
ראש גדול
ניסיון בליקוט - יתרון`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
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

🚗 הגעה עצמאית

📞 איש קשר: פנינית רויטמן`,
        requirements: `נכונות לעבודה פיזית
נכונות למשמרת לילה`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      },
      {
        title: 'מלגזן היגש - אשדוד המדע 2',
        location: 'אשדוד - המדע 2',
        workHours: '08:00-17:00',
        salaryRange: '47 ₪/שעה',
        description: `🏭 מלגזן היגש - סלע לוגיסטיקה אשדוד

עבודה על מלגזת היגש.
נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן.

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: פנינית רויטמן`,
        requirements: `רישיון למלגזה - חובה
ניסיון על מלגזת היגש / נכונות ללמוד
נכונות לירידה מהמלגזה וביצוע משימות נוספות`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      },
      {
        title: 'בקר/ית סחורה - אשדוד המתכת 5 (סלע ישן)',
        location: 'אשדוד - המתכת 5 (סלע ישן)',
        workHours: '06:00-12:00',
        salaryRange: '40 ₪/שעה',
        description: `🔍 בקר/ית סחורה - סלע לוגיסטיקה אשדוד

בקר סחורה על רמפות ההפצה:
• עבודה מול נהגים
• בדיקת סחורה אל מול תעודות היציאה
• סריקת המוצרים

משמרת בוקר קצרה!

🚗 הגעה עצמאית

📞 איש קשר: פנינית רויטמן`,
        requirements: `בקרת סחורה על ידי סריקת המוצרים עם מסופון
אחריות ורצינות`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      },
      {
        title: 'אורז/ת - בית שמש הר טוב',
        location: 'בית שמש - אזור תעשייה הר טוב',
        workHours: 'משמרות: 06:30-15:30/16:00 או 11:00/12:00-20:00',
        salaryRange: '38 ₪/שעה',
        description: `📦 אורז/ת - סלע לוגיסטיקה בית שמש

עבודת אריזה במחסן לוגיסטי.

משמרות גמישות:
• בוקר: 06:30-15:30/16:00
• או: 11:00/12:00 עד ~20:00

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: פנינית רויטמן`,
        requirements: `נכונות לעבודה פיזית
דיוק ותשומת לב
עבודת צוות`,
        contactName: 'פנינית רויטמן',
        contactEmail: 'pninit@selabonded.co.il'
      }
    ]

    // ================================
    // 📋 משרות דנה - danav@selabonded.co.il
    // ================================
    const danaPositions = [
      {
        title: 'נציג/ת שירות לקוחות - לוגיסטים אשדוד',
        location: 'אשדוד - המדע 2 (לוגיסטים)',
        workHours: '08:00-17:00',
        salaryRange: '37 ₪/שעה',
        description: `📞 נציג/ת שירות לקוחות - לוגיסטים אשדוד

• תיאום מועדי אספקה
• מענה לפניות לקוחות בטלפון ובכתב

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון במוקד שירות - יתרון
ידע והכרה בעבודה על מחשב - חובה
תודעת שירות`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il'
      },
      {
        title: 'רפרנט/ית שטח - לוגיסטים בית שמש',
        location: 'בית שמש - אזור תעשייה הר טוב (לוגיסטים)',
        workHours: '05:00-14:00',
        salaryRange: '50 ₪/שעה',
        description: `🚛 רפרנט/ית שטח - לוגיסטים בית שמש

תפקיד שטח:
• ניהול מערך נהגים
• טיפול בתעודות חתומות
• פתרון תקלות בהעמסה ונזקים
• דיווח על אי אספקות

תפקיד ניהולי בשכר גבוה!

🚗 הגעה עצמאית

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון בתפעול מערך הפצה - חובה
יכולת רתימת עובדים
יכולת התנהלות עם חשבוניות ומסמכים מרובים
סדר וארגון
אסרטיביות - חובה
ניידות - חובה`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il'
      },
      {
        title: 'סדרן/ית הפצה - לוגיסטים אשדוד/בית שמש',
        location: 'אשדוד המדע 2 / בית שמש הר טוב (לוגיסטים)',
        workHours: '06:00-16:00',
        salaryRange: '13,000 ₪ גלובלי',
        description: `📋 סדרן/ית הפצה - לוגיסטים

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
        contactEmail: 'danav@selabonded.co.il'
      },
      {
        title: 'רפרנט/ית שטח - לוגיסטים מבקיעים',
        location: 'מבקיעים (לוגיסטים)',
        workHours: '06:00-14:00',
        salaryRange: '50 ₪/שעה',
        description: `🚛 רפרנט/ית שטח - לוגיסטים מבקיעים

תפקיד שטח:
• ניהול מערך נהגים
• טיפול בתעודות חתומות
• פתרון תקלות בהעמסה ונזקים
• דיווח על אי אספקות

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון עבודה במערך הפצה - חובה
ניסיון קודם בתפקיד בק אופיס לוגיסטי - חובה
אחריות סדר וארגון - חובה
יכולת עבודה בכמה ממשקים במקביל
תודעת שירות מעולה
נכונות לעבודה בשעות נוספות`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il'
      },
      {
        title: 'נציג/ת לקוח - לוגיסטים אשדוד',
        location: 'אשדוד - המדע 2 (לוגיסטים)',
        workHours: '08:00-17:00',
        salaryRange: '42 ₪/שעה',
        description: `💼 נציג/ת לקוח - לוגיסטים אשדוד

• טיפול בהזמנות
• סריקת תעודות
• טיפול במלאים והזנת נתונים במערכת

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון בתחום הלוגיסטיקה - חובה
שליטה ביישומי אופיס - חובה`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il'
      },
      {
        title: 'נציג/ה שירות ורפרנטיות - לוגיסטים בית שמש',
        location: 'בית שמש - אזור תעשייה הר טוב (לוגיסטים)',
        workHours: '06:00-15:00',
        salaryRange: '13,000 ₪ גלובלי',
        description: `📞🚛 נציג/ה שירות ורפרנטיות - לוגיסטים בית שמש

תפקיד משולב הכולל:
• שירות לקוחות
• רפרנטיות שטח
• מענה טלפוני
• תיאום משלוחים

תפקיד ניהולי בשכר גלובלי!

🍽️ ארוחות
🚗 הגעה עצמאית

📞 איש קשר: דנה שפירו`,
        requirements: `ניסיון בשירות לקוחות - חובה
ניסיון בלוגיסטיקה/הפצה - יתרון משמעותי
יכולת עבודה תחת לחץ
תודעת שירות גבוהה
ניידות - חובה`,
        contactName: 'דנה שפירו',
        contactEmail: 'danav@selabonded.co.il'
      }
    ]

    const allNewPositions = [...pninitPositions, ...danaPositions]
    const results: { position: string; action: string; keywords: number }[] = []

    // 1️⃣ מחק את כל המשרות הישנות של סלע
    const deletedCount = await prisma.position.deleteMany({
      where: { employerId: selaEmployer.id }
    })
    console.log(`🗑️ נמחקו ${deletedCount.count} משרות ישנות`)

    // 2️⃣ צור את כל המשרות החדשות
    for (const pos of allNewPositions) {
      const keywords = generateKeywordsForPosition(pos.title, pos.description, pos.location)
      
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
          employmentType: 'משרה מלאה',
          active: true,
          openings: 1,
          priority: 5
        }
      })
      results.push({ position: pos.title, action: '✅ נוצר', keywords: keywords.length })
    }

    // 3️⃣ סטטיסטיקות
    const pninitCount = pninitPositions.length
    const danaCount = danaPositions.length

    return NextResponse.json({
      success: true,
      message: '✅ משרות סלע לוגיסטיקה סונכרנו בהצלחה!',
      employer: selaEmployer.name,
      stats: {
        deleted: deletedCount.count,
        created: results.length,
        pninitPositions: pninitCount,
        danaPositions: danaCount
      },
      positions: {
        pninit: results.filter((_, i) => i < pninitCount).map(r => r.position),
        dana: results.filter((_, i) => i >= pninitCount).map(r => r.position)
      }
    })

  } catch (error) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json(
      { error: 'שגיאה בסנכרון משרות', details: String(error) },
      { status: 500 }
    )
  }
}
