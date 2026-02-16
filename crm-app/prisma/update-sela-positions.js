const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 📋 משרות סלע לוגיסטיקה - פנינית רויטמן
const SELA_POSITIONS = [
  {
    title: 'מלגזן היגש - בני דרום',
    location: 'בני דרום',
    workHours: '08:00-17:00',
    salaryRange: '47 ₪/שעה',
    description: 'עבודה על הגש וליקוטים',
    requirements: 'רישיון מלגזה, ניסיון על הגש ורצון לעבוד',
    benefits: 'ארוחות חמות, הסעה מאשקלון ואשדוד',
    transportation: 'הסעה מאשקלון ואשדוד',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 2
  },
  {
    title: 'פקיד/ה - בני דרום',
    location: 'בני דרום',
    workHours: '08:00-17:00',
    salaryRange: '42 ₪/שעה',
    description: `ניהול כל המערך האדמיניסטרטיבי של המחסן בשילוב של עבודה משרדית ועבודה בשטח:
• בקרה על קליטת סחורה והפצתה
• ניהול מלאי שוטף
• קליטת עובדים חדשים
• טיפול בנוכחות העובדים
• אדמיניסטרציה שוטפת`,
    requirements: `• נדרשת שליטה בשפה הרוסית עקב עבודה מול גורמים דוברי רוסית
• ניסיון קודם בתפקיד דומה - חובה
• ניסיון במערכת WMS - יתרון משמעותי
• יכולת עבודה בסביבה ממוחשבת
• עבודה באקסל - חובה
• ניידות - חובה`,
    benefits: 'ארוחות חמות',
    transportation: 'הגעה עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 2
  },
  {
    title: 'פקיד/ה - חפץ חיים',
    location: 'חפץ חיים',
    workHours: '08:00-17:00',
    salaryRange: '45 ₪/שעה',
    description: `• בקרה על קליטת סחורה והפצתה
• ניהול מלאי שוטף
• קליטת עובדים חדשים
• טיפול בנוכחות העובדים
• אדמיניסטרציה שוטפת
העבודה מחולקת בין עבודה על המחשב ובין עשייה פיזית ברצפת המרלו"ג, הדבקת מדבקות על המשטחים, סיווג המשטחים לפי הדרישה ועוד.`,
    requirements: `• ניסיון קודם בתפקיד דומה - חובה
• ניסיון במערכת WMS - יתרון משמעותי
• יכולת עבודה בסביבה ממוחשבת
• עבודה באקסל - חובה
• ניידות - חובה`,
    benefits: 'ארוחות חמות',
    transportation: 'עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 2
  },
  {
    title: 'מלקט/ת - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '08:00-17:00',
    salaryRange: '38 ₪/שעה',
    description: 'ליקוט סחורה והכנת הזמנות, עבודה עם מסופון',
    requirements: 'נכונות למשרה מלאה, ראש גדול, ניסיון בליקוט - יתרון',
    benefits: 'הגעה עצמית, ארוחות',
    transportation: 'עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 1
  },
  {
    title: 'מחסנאי/ת לילה - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '16:30-01:30',
    salaryRange: '42 ₪/שעה',
    description: 'עבודות מחסן כלליות - הזזת קרונים, שרינקים ועוד',
    requirements: 'נכונות לעבודה פיזית',
    benefits: 'ארוחות',
    transportation: 'עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 1
  },
  {
    title: 'מלגזן היגש - אשדוד המדע 2',
    location: 'אשדוד - המדע 2',
    workHours: '08:00-17:00',
    salaryRange: '47 ₪/שעה',
    description: `• ניסיון על מלגזת היגש / נכונות ללמוד עבודה על מלגזת היגש
• נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן`,
    requirements: 'רישיון למלגזה - חובה',
    benefits: 'הגעה עצמית, ארוחות',
    transportation: 'עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 2
  },
  {
    title: 'בקר/ית - סלע ישן אשדוד',
    location: 'אשדוד - סלע ישן, המתכת 5',
    workHours: '06:00-12:00',
    salaryRange: '40 ₪/שעה',
    description: 'בקר סחורה על רמפות ההפצה, עבודה מול נהגים, בדיקת סחורה אל מול תעודות היציאה וסריקת המוצרים',
    requirements: 'בקרת סחורה על ידי סריקת המוצרים עם מסופון. אנחנו מחפשים עובדים אחראים ורציניים',
    benefits: 'ארוחות',
    transportation: 'עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 1
  },
  {
    title: 'בקר/ית - בית שמש הר טוב',
    location: 'בית שמש - אזור תעשייה הר טוב',
    workHours: '06:30-15:30/16:00 או 11:00/12:00 עד סיום (~20:00)',
    salaryRange: '42 ₪/שעה',
    description: `בקרה ובדיקה של ההזמנות לפני ההפצה.
בדיקה מוקפדת של פריטים לפני העמסתם למשאיות.
הבדיקה מתבצעת עם מסופון לפי מק"ט על הפריט ומול ההזמנה.`,
    requirements: `• אחריות ורצינות
• עבודה עם מסופון - חובה
• דיוק ותשומת לב לפרטים קטנים
• יכולת עבודה תחת לחץ`,
    benefits: 'הגעה עצמית, ארוחות',
    transportation: 'עצמאית',
    contactName: 'Pninit Roitman',
    contactEmail: 'pninit@selabonded.co.il',
    priority: 2
  }
]

// 📋 משרות לוגיסטים - דנה שפירו
const LOGISTIM_POSITIONS = [
  {
    title: 'נציג/ת שירות לקוחות - אשדוד',
    location: 'אשדוד - המדע 2 (לוגיסטים)',
    workHours: '13:00/14:00-20:00',
    salaryRange: '38 ₪/שעה',
    description: 'תיאום מועדי אספקה, מענה לפניות לקוחות בטלפון ובכתב',
    requirements: 'ניסיון במוקד שירות - יתרון',
    benefits: 'הגעה עצמית, ארוחות',
    transportation: 'עצמאית',
    contactName: 'Dana Shapiro',
    contactEmail: 'dana@logistim.co.il',
    priority: 1
  },
  {
    title: 'רפרנט/ית שטח - בית שמש',
    location: 'בית שמש - אזור תעשייה הר טוב (לוגיסטים)',
    workHours: '06:00-15:00',
    salaryRange: '50 ₪/שעה',
    description: 'תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות',
    requirements: `• ניסיון בתפעול מערך הפצה - חובה
• יכולת רתימת עובדים
• יכולת התנהלות עם חשבוניות ומסמכים מרובים
• סדר וארגון
• אסרטיביות - חובה
• ניידות - חובה`,
    benefits: 'ארוחות',
    transportation: 'עצמאית',
    contactName: 'Dana Shapiro',
    contactEmail: 'dana@logistim.co.il',
    priority: 2
  },
  {
    title: 'סדרן הפצה - אשדוד/בית שמש',
    location: 'אשדוד המדע 2 / בית שמש הר טוב (לוגיסטים)',
    workHours: '06:00-16:00',
    salaryRange: '13,000 ₪/חודש',
    description: `ניהול קבלנים, הכנת קווי הפצה, מעקב הובלות ועמידה בזמנים,
טיפול בהעמסה והחזרות, הנפקת דוחות, מענה שוטף לפניות הנהגים`,
    requirements: `• ניסיון מוכח בתכנון קווי הפצה רבים - חובה
• חשיבה לוגית ופתרון בעיות
• תפקוד מעולה תחת לחץ
• ניידות - חובה`,
    benefits: 'הגעה עצמית, ארוחות. תקן אחד באשדוד ותקן אחד בבית שמש',
    transportation: 'עצמאית',
    contactName: 'Dana Shapiro',
    contactEmail: 'dana@logistim.co.il',
    priority: 3
  },
  {
    title: 'רפרנט/ית שטח - מבקיעים',
    location: 'מבקיעים (לוגיסטים)',
    workHours: '05:00-14:00',
    salaryRange: '50 ₪/שעה',
    description: 'תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות',
    requirements: `• ניסיון עבודה במערך הפצה - חובה
• ניסיון קודם בתפקיד בק אופיס לוגיסטי - חובה
• אחריות סדר וארגון - חובה
• יכולת עבודה בכמה ממשקים במקביל
• תודעת שירות מעולה
• נכונות לעבודה בשעות נוספות`,
    benefits: 'ארוחות',
    transportation: 'עצמאית',
    contactName: 'Dana Shapiro',
    contactEmail: 'dana@logistim.co.il',
    priority: 2
  },
  {
    title: 'נציג/ת לקוח - אשדוד',
    location: 'אשדוד - המדע 2 (לוגיסטים)',
    workHours: '08:00-17:00',
    salaryRange: '42 ₪/שעה',
    description: 'טיפול בהזמנות, סריקת תעודות, טיפול במלאים והזנת נתונים במערכת',
    requirements: `• ניסיון בתחום הלוגיסטיקה - חובה
• שליטה ביישומי אופיס - חובה`,
    benefits: 'ארוחות',
    transportation: 'עצמאית',
    contactName: 'Dana Shapiro',
    contactEmail: 'dana@logistim.co.il',
    priority: 1
  }
]

async function main() {
  console.log('🚀 מתחיל עדכון משרות סלע לוגיסטיקה ולוגיסטים...\n')

  // מציאת מעסיק סלע
  let selaEmployer = await prisma.employer.findFirst({
    where: { 
      OR: [
        { name: { contains: 'סלע' } },
        { email: { contains: 'sela' } }
      ]
    }
  })

  if (!selaEmployer) {
    // יצירת מעסיק סלע אם לא קיים
    selaEmployer = await prisma.employer.create({
      data: {
        name: 'סלע לוגיסטיקה',
        email: 'sela@selabonded.co.il',
        phone: '08-8888888',
        description: 'סלע לוגיסטיקה - שירותי מרלו"ג והפצה'
      }
    })
    console.log('✅ נוצר מעסיק: סלע לוגיסטיקה')
  }

  // מציאת/יצירת מעסיק לוגיסטים
  let logistimEmployer = await prisma.employer.findFirst({
    where: { name: { contains: 'לוגיסטי' } }
  })

  if (!logistimEmployer) {
    logistimEmployer = await prisma.employer.create({
      data: {
        name: 'לוגיסטיקר',
        email: 'logistim@logistim.co.il',
        phone: '08-8888889',
        description: 'לוגיסטיקר - שירותי לוגיסטיקה והפצה'
      }
    })
    console.log('✅ נוצר מעסיק: לוגיסטיקר')
  }

  // עדכון/יצירת משרות סלע
  console.log('\n📦 מעדכן משרות סלע לוגיסטיקה (פנינית):')
  for (const pos of SELA_POSITIONS) {
    const existing = await prisma.position.findFirst({
      where: {
        title: pos.title,
        employerId: selaEmployer.id
      }
    })

    if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data: {
          description: pos.description,
          requirements: pos.requirements,
          location: pos.location,
          salaryRange: pos.salaryRange,
          workHours: pos.workHours,
          benefits: pos.benefits,
          transportation: pos.transportation,
          contactName: pos.contactName,
          contactEmail: pos.contactEmail,
          priority: pos.priority,
          active: true
        }
      })
      console.log(`   ✏️ עודכנה: ${pos.title}`)
    } else {
      await prisma.position.create({
        data: {
          title: pos.title,
          description: pos.description,
          requirements: pos.requirements,
          location: pos.location,
          salaryRange: pos.salaryRange,
          workHours: pos.workHours,
          benefits: pos.benefits,
          transportation: pos.transportation,
          contactName: pos.contactName,
          contactEmail: pos.contactEmail,
          priority: pos.priority,
          employerId: selaEmployer.id,
          active: true,
          employmentType: 'Full-time'
        }
      })
      console.log(`   ✅ נוצרה: ${pos.title}`)
    }
  }

  // עדכון/יצירת משרות לוגיסטים
  console.log('\n🚚 מעדכן משרות לוגיסטיקר (דנה):')
  for (const pos of LOGISTIM_POSITIONS) {
    const existing = await prisma.position.findFirst({
      where: {
        title: pos.title,
        employerId: logistimEmployer.id
      }
    })

    if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data: {
          description: pos.description,
          requirements: pos.requirements,
          location: pos.location,
          salaryRange: pos.salaryRange,
          workHours: pos.workHours,
          benefits: pos.benefits,
          transportation: pos.transportation,
          contactName: pos.contactName,
          contactEmail: pos.contactEmail,
          priority: pos.priority,
          active: true
        }
      })
      console.log(`   ✏️ עודכנה: ${pos.title}`)
    } else {
      await prisma.position.create({
        data: {
          title: pos.title,
          description: pos.description,
          requirements: pos.requirements,
          location: pos.location,
          salaryRange: pos.salaryRange,
          workHours: pos.workHours,
          benefits: pos.benefits,
          transportation: pos.transportation,
          contactName: pos.contactName,
          contactEmail: pos.contactEmail,
          priority: pos.priority,
          employerId: logistimEmployer.id,
          active: true,
          employmentType: 'Full-time'
        }
      })
      console.log(`   ✅ נוצרה: ${pos.title}`)
    }
  }

  // סיכום
  const selaCount = await prisma.position.count({
    where: { employerId: selaEmployer.id }
  })
  const logistimCount = await prisma.position.count({
    where: { employerId: logistimEmployer.id }
  })

  console.log('\n' + '='.repeat(50))
  console.log(`📊 סיכום:`)
  console.log(`   • סלע לוגיסטיקה (פנינית): ${selaCount} משרות`)
  console.log(`   • לוגיסטיקר (דנה): ${logistimCount} משרות`)
  console.log('='.repeat(50))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
