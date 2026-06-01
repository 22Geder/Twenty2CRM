import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// 🏷️ 50+ תגיות למלגזני היגש - בני דרום
const KEYWORDS_HIGASH_BNEY_DAROM = [
  'מלגזן', 'מלגזנים', 'היגש', 'מלגזת היגש', 'reach truck', 'reach forklift', 'forklift',
  'מלגזה', 'מלגזות', 'נהג מלגזה', 'נהגי מלגזה', 'מפעיל מלגזה', 'מפעילי מלגזה',
  'לוגיסטיקה', 'מחסן', 'מחסנים', 'מרלוג', 'מרכז לוגיסטי', 'warehouse', 'מחסנאות',
  'שרשרת אספקה', 'supply chain', 'הפצה', 'אחסון', 'אחסנה', 'סחורה', 'מלאי',
  'inventory', 'pallet', 'משטח', 'משטחים', 'גובה רב', 'אחסון גובה', 'narrow aisle',
  'מעברים צרים', 'דיוק גבוה', 'שליפה מגובה', 'רמות', 'מדפים', 'racks',
  'ליקוט', 'picking', 'פיקינג', 'מלקט',
  'בני דרום', 'דרום', 'אזור דרום', 'שפלה דרומית', 'אשקלון', 'אשדוד',
  'הסעה מאשקלון', 'הסעה מאשדוד', 'הסעות', 'תחבורה',
  'ארוחות', 'ארוחות חמות', 'ארוחה חמה', 'תנאים מצוינים', 'תנאים מעולים',
  'בונוסים', 'בונוסים גבוהים', 'סביבת עבודה משפחתית', 'מתנות ופינוקים',
  '50 שקל לשעה', 'שכר שעתי', 'שכר גבוה', 'גמישות בשכר',
  'משרה מלאה', 'full time', 'רישיון מלגזה', 'עבודה פיזית', 'עבודת צוות',
  'אחריות', 'סדר וארגון', 'אזור תעשייה', 'industrial', 'ניסיון', 'רצינות'
]

// 🏷️ 50+ תגיות למלגזני חובק - בית שמש
const KEYWORDS_HOBEK_BEIT_SHEMESH = [
  'מלגזן', 'מלגזנים', 'חובק', 'מלגזת חובק', 'counterbalance', 'counterbalance forklift',
  'forklift', 'מלגזה', 'מלגזות', 'נהג מלגזה', 'נהגי מלגזה', 'מפעיל מלגזה', 'מפעילי מלגזה',
  'לוגיסטיקה', 'מחסן', 'מחסנים', 'מרלוג', 'מרכז לוגיסטי', 'warehouse', 'מחסנאות',
  'שרשרת אספקה', 'supply chain', 'הפצה', 'אחסון', 'אחסנה', 'סחורה', 'מלאי',
  'inventory', 'pallet', 'משטח', 'משטחים',
  'העמסה', 'פריקה', 'הרמה', 'נסיעה', 'תמרון', 'הובלת סחורה',
  'סידור מחסן', 'הנחת משטחים', 'מדפים', 'racks',
  'בית שמש', 'אזור בית שמש', 'הר טוב', 'אזור תעשייה הר טוב', 'שפלה', 'אזור ירושלים',
  'ארוחות', 'ארוחות חמות', 'ארוחה חמה', 'תנאים מצוינים', 'תנאים מעולים',
  'בונוסים', 'בונוסים גבוהים', 'סביבת עבודה משפחתית', 'מתנות ופינוקים',
  'פינוקים לאורך השנה', '50 שקל לשעה', 'שכר שעתי', 'שכר גבוה', 'גמישות בשכר',
  'משרה מלאה', 'full time', 'רישיון מלגזה', 'עבודה פיזית', 'עבודת צוות',
  'אחריות', 'סדר וארגון', 'אזור תעשייה', 'industrial', 'ניסיון', 'רצינות'
]

const NEW_POSITIONS = [
  // ========================
  // מלגזני היגש - בני דרום (x2)
  // ========================
  {
    title: 'מלגזן/ית היגש - בני דרום (1)',
    location: 'בני דרום',
    workHours: '08:00-17:00',
    salaryRange: '50 ₪/שעה (גמישות)',
    description: `🏭 מלגזן/ית היגש - סלע לוגיסטיקה בני דרום

עבודה על מלגזת היגש - ליקוטים, אחסון מגובה וניהול סחורה במרלוג.
משרה מלאה בסביבת עבודה משפחתית ונעימה.

🚌 הסעות מאשקלון ואשדוד
🍽️ ארוחות חמות
💰 בונוסים גבוהים
🎁 מתנות ופינוקים לאורך השנה

📞 איש קשר: פנינית רויטמן`,
    requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבודה פיזית ורצינות`,
    contactName: 'פנינית רויטמן',
    contactEmail: 'pninit@selabonded.co.il',
    keywords: KEYWORDS_HIGASH_BNEY_DAROM,
    openings: 1
  },
  {
    title: 'מלגזן/ית היגש - בני דרום (2)',
    location: 'בני דרום',
    workHours: '08:00-17:00',
    salaryRange: '50 ₪/שעה (גמישות)',
    description: `🏭 מלגזן/ית היגש - סלע לוגיסטיקה בני דרום

עבודה על מלגזת היגש - ליקוטים, אחסון מגובה וניהול סחורה במרלוג.
משרה מלאה בסביבת עבודה משפחתית ונעימה.

🚌 הסעות מאשקלון ואשדוד
🍽️ ארוחות חמות
💰 בונוסים גבוהים
🎁 מתנות ופינוקים לאורך השנה

📞 איש קשר: פנינית רויטמן`,
    requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבודה פיזית ורצינות`,
    contactName: 'פנינית רויטמן',
    contactEmail: 'pninit@selabonded.co.il',
    keywords: KEYWORDS_HIGASH_BNEY_DAROM,
    openings: 1
  },

  // ========================
  // מלגזני חובק - בית שמש (x3)
  // ========================
  {
    title: 'מלגזן/ית חובק - בית שמש (1)',
    location: 'בית שמש',
    workHours: '08:00-17:00',
    salaryRange: '50 ₪/שעה (גמישות)',
    description: `🏭 מלגזן/ית חובק - סלע לוגיסטיקה בית שמש

עבודה על מלגזת חובק - העמסה, פריקה ואחסון סחורה במרלוג בית שמש.
תנאים מעולים למתאימים, סביבת עבודה משפחתית ונעימה.

🍽️ ארוחות חמות
💰 בונוסים גבוהים
🌟 תנאים מעולים למתאימים
🎁 מתנות ופינוקים לאורך השנה

📞 איש קשר: פנינית רויטמן`,
    requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת חובק - יתרון
נכונות לעבודה פיזית`,
    contactName: 'פנינית רויטמן',
    contactEmail: 'pninit@selabonded.co.il',
    keywords: KEYWORDS_HOBEK_BEIT_SHEMESH,
    openings: 1
  },
  {
    title: 'מלגזן/ית חובק - בית שמש (2)',
    location: 'בית שמש',
    workHours: '08:00-17:00',
    salaryRange: '50 ₪/שעה (גמישות)',
    description: `🏭 מלגזן/ית חובק - סלע לוגיסטיקה בית שמש

עבודה על מלגזת חובק - העמסה, פריקה ואחסון סחורה במרלוג בית שמש.
תנאים מעולים למתאימים, סביבת עבודה משפחתית ונעימה.

🍽️ ארוחות חמות
💰 בונוסים גבוהים
🌟 תנאים מעולים למתאימים
🎁 מתנות ופינוקים לאורך השנה

📞 איש קשר: פנינית רויטמן`,
    requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת חובק - יתרון
נכונות לעבודה פיזית`,
    contactName: 'פנינית רויטמן',
    contactEmail: 'pninit@selabonded.co.il',
    keywords: KEYWORDS_HOBEK_BEIT_SHEMESH,
    openings: 1
  },
  {
    title: 'מלגזן/ית חובק - בית שמש (3)',
    location: 'בית שמש',
    workHours: '08:00-17:00',
    salaryRange: '50 ₪/שעה (גמישות)',
    description: `🏭 מלגזן/ית חובק - סלע לוגיסטיקה בית שמש

עבודה על מלגזת חובק - העמסה, פריקה ואחסון סחורה במרלוג בית שמש.
תנאים מעולים למתאימים, סביבת עבודה משפחתית ונעימה.

🍽️ ארוחות חמות
💰 בונוסים גבוהים
🌟 תנאים מעולים למתאימים
🎁 מתנות ופינוקים לאורך השנה

📞 איש קשר: פנינית רויטמן`,
    requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת חובק - יתרון
נכונות לעבודה פיזית`,
    contactName: 'פנינית רויטמן',
    contactEmail: 'pninit@selabonded.co.il',
    keywords: KEYWORDS_HOBEK_BEIT_SHEMESH,
    openings: 1
  }
]

// POST /api/seed-sela-jun2026 - הוספת משרות סלע לוגיסטיקה יוני 2026
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // מציאת מעסיק סלע לוגיסטיקה
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
    }

    const results: { position: string; action: string; keywords: number }[] = []

    for (const pos of NEW_POSITIONS) {
      // בדוק אם המשרה כבר קיימת
      const existing = await prisma.position.findFirst({
        where: {
          employerId: selaEmployer.id,
          title: pos.title
        }
      })

      if (existing) {
        // עדכן משרה קיימת
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            location: pos.location,
            description: pos.description,
            requirements: pos.requirements,
            salaryRange: pos.salaryRange,
            workHours: pos.workHours,
            contactName: pos.contactName,
            contactEmail: pos.contactEmail,
            keywords: JSON.stringify(pos.keywords),
            active: true,
            priority: 5
          }
        })
        results.push({ position: pos.title, action: '🔄 עודכן', keywords: pos.keywords.length })
      } else {
        // צור משרה חדשה
        await prisma.position.create({
          data: {
            title: pos.title,
            location: pos.location,
            description: pos.description,
            requirements: pos.requirements,
            salaryRange: pos.salaryRange,
            workHours: pos.workHours,
            contactName: pos.contactName,
            contactEmail: pos.contactEmail,
            keywords: JSON.stringify(pos.keywords),
            employerId: selaEmployer.id,
            employmentType: 'משרה מלאה',
            active: true,
            openings: pos.openings,
            priority: 5
          }
        })
        results.push({ position: pos.title, action: '✅ נוצר', keywords: pos.keywords.length })
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ משרות סלע לוגיסטיקה יוני 2026 נוספו בהצלחה!',
      employer: selaEmployer.name,
      stats: {
        total: results.length,
        higash_bney_darom: 2,
        hobek_beit_shemesh: 3,
        keywords_per_position: {
          higash: KEYWORDS_HIGASH_BNEY_DAROM.length,
          hobek: KEYWORDS_HOBEK_BEIT_SHEMESH.length
        }
      },
      positions: results
    })

  } catch (error) {
    console.error('❌ שגיאה בהוספת משרות סלע יוני 2026:', error)
    return NextResponse.json(
      { error: 'שגיאה בהוספת משרות', details: String(error) },
      { status: 500 }
    )
  }
}
