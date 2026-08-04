const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 מתחיל הוספת משרות סלע לוגיסטיקה - עדכון מאי 2026...')

  // מציאת או יצירת מעסיק: סלע לוגיסטיקה
  let employer = await prisma.employer.findFirst({
    where: {
      OR: [
        { name: { contains: 'סלע לוגיסטיקה' } },
        { email: 'jobs@sela-logistics.co.il' }
      ]
    }
  })

  if (!employer) {
    employer = await prisma.employer.create({
      data: {
        name: 'סלע לוגיסטיקה',
        email: 'jobs@sela-logistics.co.il',
        phone: '08-900-0000',
        description: 'סלע לוגיסטיקה - חברת לוגיסטיקה ומחסנאות מובילה עם מרלוגים באשדוד, בני דרום, מבקיעים ובית שמש.'
      }
    })
    console.log('✅ נוצר מעסיק: סלע לוגיסטיקה')
  } else {
    console.log('✅ מעסיק קיים:', employer.name)
  }

  const positions = [
    // ========================
    // בני דרום
    // ========================
    {
      title: 'אחראי/ת מחלקת מכולות',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '45 ₪ לשעה',
      description: `אחריות על קליטת מכולות, אחריות שהמכולות נסרקות כראוי, עבודה בשטח המרלוג, ווידוא שיש מקום לכל המשטחים שצריכים להיקלט, נהיגה על פולר.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון נהיגה - חובה
מועמד/ת אחראי/ת, מסודר/ת עם ניסיון בעבודה במחסן
נכונות לעבודה בשעות נוספות וימי שישי לפי צורך`,
      benefits: 'ארוחות\nנכונות לעבודה בשעות נוספות וימי שישי לפי צורך',
      transportation: 'הסעה מאשדוד ואשקלון',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['אחראי מחלקה', 'מכולות', 'בני דרום', 'מחסנאות', 'פולר']
    },
    {
      title: 'מלקט/ת',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '37 ₪ לשעה',
      description: `ליקוט וקליטת סחורה דרך מערכת ממוחשבת בעמדה.
העבודה בעמידה.
שעות עבודה: 08:00-17:00`,
      requirements: `נכונות לעבודה בעמידה
הבנה בסיסית ביותר בעבודה מול מחשב
קריאה ודיבור בעברית
נכונות לעבודה בשעות נוספות לפי הצורך`,
      benefits: 'ארוחות חמות\nבונוסים גבוהים עפי תפוקות',
      transportation: 'הסעה מאשדוד ואשקלון',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלקט', 'בני דרום', 'מחסנאות', 'ליקוט', 'בונוסים']
    },
    {
      title: 'מחסנאי מחלקת הפצה',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '40 ₪ לשעה',
      description: `סידור הזמנות (קרטונים) על משטחים והכנה להפצה.
בעת הצורך נדרש לעזור בבניית קרטונים.
שעות עבודה: 08:00-17:00`,
      requirements: `נכונות למשרה מלאה
נכונות לעבודה פיזית`,
      benefits: 'ארוחות חמות',
      transportation: 'הסעה מאשדוד ואשקלון',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מחסנאי', 'הפצה', 'בני דרום', 'מחסנאות', 'קרטונים']
    },
    {
      title: 'מחסנאי/ת',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '40 ₪ לשעה',
      description: `עבודות מחסן כלליות - שרינקים, סידור סחורה, עבודה עם ג\'ק חשמלי.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון נהיגה - חובה`,
      benefits: 'ארוחות חמות',
      transportation: 'הסעה מאשדוד ואשקלון',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מחסנאי', 'בני דרום', 'מחסנאות', 'ג\'ק חשמלי', 'שרינקים']
    },
    {
      title: 'מלגזן היגש',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '47 ₪ לשעה',
      description: `עבודה על הגש וליקוטים.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון מלגזה - חובה
ניסיון על הגש ורצינות`,
      benefits: 'ארוחות חמות',
      transportation: 'הסעה מאשדוד ואשקלון',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלגזן', 'היגש', 'בני דרום', 'מחסנאות', 'ליקוט']
    },

    // ========================
    // אשדוד - המדע 2
    // ========================
    {
      title: 'מלקט/ת',
      location: 'אשדוד - המדע 2',
      workHours: '08:00-17:00',
      salaryRange: '38 ₪ לשעה',
      description: `ליקוט סחורה והכנת הזמנות, עבודה עם מסופון.
שעות עבודה: 08:00-17:00`,
      requirements: `נכונות למשרה מלאה
ראש גדול
ניסיון בליקוט - יתרון`,
      benefits: 'הגעה עצמית, ארוחות',
      transportation: 'הסעה מאשקלון',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלקט', 'אשדוד', 'מחסנאות', 'מסופון', 'ליקוט']
    },
    {
      title: 'מלגזן היגש יום',
      location: 'אשדוד - המדע 2',
      workHours: '08:00-17:00',
      salaryRange: '47 ₪ לשעה',
      description: `ניסיון על מלגזת היגש / נכונות ללמוד עבודה על מלגזת היגש.
נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון למלגזה - חובה`,
      benefits: '',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלגזן', 'היגש', 'אשדוד', 'מחסנאות', 'יום']
    },
    {
      title: 'מלגזן מחסנאי לילה',
      location: 'אשדוד - המדע 2',
      workHours: '18:00-03:00',
      salaryRange: '48 ₪ לשעה',
      description: `עבודה על מלגזה + ליקוט.
משמרת לילה: 18:00-03:00`,
      requirements: `רישיון על מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבוד עם מסופון וללקט`,
      benefits: '',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלגזן', 'לילה', 'אשדוד', 'מחסנאות', 'ליקוט']
    },
    {
      title: 'מחסנאי/ת יום',
      location: 'אשדוד - המדע 2',
      workHours: '08:00-17:00',
      salaryRange: '40 ₪ לשעה',
      description: `עבודות מחסן כלליות - הזזת קרונים, שרינקים ועוד.
שעות עבודה: 08:00-17:00`,
      requirements: `נכונות לעבודה פיזית`,
      benefits: 'ארוחות חמות',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מחסנאי', 'יום', 'אשדוד', 'מחסנאות', 'פיזי']
    },
    {
      title: 'מחסנאי/ת ערב',
      location: 'אשדוד - המדע 2',
      workHours: '16:30-01:30',
      salaryRange: '42 ₪ לשעה',
      description: `עבודות מחסן כלליות - הזזת קרונים, שרינקים ועוד.
משמרת ערב: 16:30-01:30`,
      requirements: `נכונות לעבודה פיזית`,
      benefits: 'הסעה בחזור לאשדוד',
      transportation: 'הסעה בחזור לאשדוד',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מחסנאי', 'ערב', 'אשדוד', 'מחסנאות', 'פיזי']
    },

    // ========================
    // סלע 3 - המתכת 5 אשדוד
    // ========================
    {
      title: 'מלגזן היגש',
      location: 'סלע 3 - המתכת 5, אשדוד',
      workHours: '06:00-16:00',
      salaryRange: '47 ₪ לשעה',
      description: `עבודה על מלגזה + ליקוט.
שעות עבודה: 06:00-16:00`,
      requirements: `רישיון על מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבוד עם מסופון וללקט`,
      benefits: '',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלגזן', 'היגש', 'אשדוד', 'מחסנאות', 'המתכת']
    },
    {
      title: 'בקר/ית בוקר',
      location: 'סלע 3 - המתכת 5, אשדוד',
      workHours: '06:00-11:00',
      salaryRange: '40 ₪ לשעה',
      description: `סריקות סחורה עם מסופון.
שעות עבודה: 06:00-11:00`,
      requirements: `נדרשת אוריינטציה טכנית לעבוד עם מסופון`,
      benefits: '',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'חלקית',
      active: true,
      tags: ['בקר', 'בוקר', 'אשדוד', 'מסופון', 'חלקית']
    },

    // ========================
    // לוגיסטים - המדע 2 אשדוד (Dana Shapiro)
    // ========================
    {
      title: 'נציג/ת שירות לקוחות',
      location: 'לוגיסטים - המדע 2, אשדוד',
      workHours: '08:00-17:00',
      salaryRange: '38 ₪ לשעה + בונוסים חודשיים',
      description: `תיאום מועדי אספקה, מענה לפניות לקוחות בטלפון ובכתב.
שעות עבודה: 08:00-17:00`,
      requirements: `ניסיון במוקד שירות - יתרון`,
      benefits: 'בונוסים חודשיים בכפוף לעמידה ביעדים ועל התמדה',
      transportation: 'עצמאית',
      contactName: 'Dana Shapiro',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['שירות לקוחות', 'מוקד', 'אשדוד', 'לוגיסטיקה', 'בונוסים']
    },

    // ========================
    // בית שמש - אזור תעשייה ברוש (Dana Shapiro)
    // ========================
    {
      title: 'רפרנט/ית שטח בית שמש',
      location: 'לוגיסטים - אזור תעשייה ברוש, בית שמש',
      workHours: '06:00-15:00',
      salaryRange: '50 ₪ לשעה',
      description: `תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות.
שעות עבודה: 06:00-15:00`,
      requirements: `ניסיון בתפעול מערך הפצה - חובה
יכולת רתימת עובדים
יכולת התנהלות עם חשבוניות ומסמכים מרובים
סדר וארגון
אסרטיביות - חובה
ניידות - חובה`,
      benefits: 'בית שמש',
      transportation: 'עצמאית',
      contactName: 'Dana Shapiro',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['רפרנט שטח', 'הפצה', 'בית שמש', 'ניהול נהגים', 'ניידות']
    },
    {
      title: 'סדרן הפצה בית שמש',
      location: 'לוגיסטים - אזור תעשייה ברוש, בית שמש',
      workHours: '06:00-16:00',
      salaryRange: 'עד 13,000 ₪ - להגיש עם צפ"ש',
      description: `ניהול קבלנים, הכנת קווי הפצה, מעקב הובלות ועמידה בזמנים, טיפול בהעמסה והחזרות, הנפקת דוחות, מענה שוטף לפניות הנהגים.
שעות עבודה: 06:00-16:00
תקן אחד בבית שמש.`,
      requirements: `ניסיון מוכח בתכנון קווי הפצה רבים - חובה
חשיבה לוגית ופתרון בעיות
תפקוד מעולה תחת לחץ
ניידות - חובה`,
      benefits: 'הגעה עצמית, ארוחות',
      transportation: 'עצמאית',
      contactName: 'Dana Shapiro',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['סדרן הפצה', 'לוגיסטיקה', 'בית שמש', 'ניהול', 'קווי הפצה']
    },

    // ========================
    // מבקיעים אשקלון (Dana Shapiro)
    // ========================
    {
      title: 'רפרנט/ית הפצה מבקיעים',
      location: 'לוגיסטים - מבקיעים, אשקלון',
      workHours: '06:00-15:00',
      salaryRange: '50 ₪ לשעה',
      description: `תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות.
שעות עבודה: 06:00-15:00`,
      requirements: `ניסיון בתפעול מערך הפצה - חובה
יכולת רתימת עובדים
יכולת התנהלות עם חשבוניות ומסמכים מרובים
סדר וארגון
אסרטיביות - חובה
ניידות - חובה`,
      benefits: 'מיקום המשרה במבקיעים',
      transportation: 'עצמאית',
      contactName: 'Dana Shapiro',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['רפרנט הפצה', 'מבקיעים', 'אשקלון', 'לוגיסטיקה', 'ניהול נהגים']
    },

    // ========================
    // לוגיסטים - המדע 2 אשדוד - דיסקרטי (Dana Shapiro)
    // ========================
    {
      title: 'רפרנט/ית הפצה אשדוד - דיסקרטי',
      location: 'לוגיסטים - המדע 2, אשדוד',
      workHours: '06:00-16:00',
      salaryRange: '50 ₪ לשעה',
      description: `תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות.
⚠️ משרה דיסקרטית - נא לא לפרסם.
שעות עבודה: 06:00-16:00`,
      requirements: `ניסיון עבודה במערך הפצה - חובה
ניסיון קודם בתפקיד בק אופיס לוגיסטי - חובה
אחריות סדר וארגון - חובה
יכולת עבודה בכמה ממשקים במקביל
תודעת שירות מעולה
נכונות לעבודה בשעות נוספות`,
      benefits: 'מיקום המשרה במטה באשדוד',
      transportation: 'עצמאית',
      contactName: 'Dana Shapiro',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['רפרנט הפצה', 'אשדוד', 'דיסקרטי', 'לוגיסטיקה', 'back office']
    },

    // ========================
    // מבקיעים אשקלון - לילה (Pninit Roitman)
    // ========================
    {
      title: 'מלגזן מחסנאי לילה',
      location: 'מבקיעים, אשקלון',
      workHours: '17:00-05:00',
      salaryRange: '45 ₪ לשעה + 0.5 אג\' לכל קרטון',
      description: `ליקוט מזגנים באמצעות מלגזה (עבודה פיזית).
משרת לילה: 17:00 עד 05:00.`,
      requirements: `רישיון למלגזה - חובה
נכונות לעבודה פיזית`,
      benefits: 'יש ארוחות\n0.5 אג\' לכל קרטון שמלקטים',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['מלגזן', 'לילה', 'מבקיעים', 'אשקלון', 'מחסנאות', 'מזגנים']
    },

    // ========================
    // לוגיסטים - המדע 2 אשדוד - נציג טיוב (Pninit Roitman)
    // ========================
    {
      title: 'נציג טיוב נתונים',
      location: 'לוגיסטים - המדע 2, אשדוד',
      workHours: '08:00-17:00',
      salaryRange: '40 ₪ לשעה',
      description: `הזנת פריטים ונתונים מתוך קטלוג לתוך המערכת.
תחזוקה ועדכון שוטף של טבלאות - טבלאות עובדים, נהגים, קבלנים, מחסנים ועוד.
עזרה שוטפת למחלקת תהליכים ובקרה.
שעות עבודה: 08:00-17:00`,
      requirements: `ידע בעבודה על אקסל - חובה
ידע במערכות OFFICE
שליטה ביישומי מחשב`,
      benefits: 'ארוחות חמות',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['טיוב נתונים', 'Excel', 'OFFICE', 'אשדוד', 'לוגיסטיקה', 'נתונים']
    },

    // ========================
    // בית שמש - אזור תעשייה ברוש - דיסקרטי (Pninit Roitman)
    // ========================
    {
      title: 'פקיד/ה - דיסקרטי',
      location: 'בית שמש - אזור תעשייה ברוש',
      workHours: '08:00-17:00',
      salaryRange: '50 ₪ לשעה (בהתאם לניסיון)',
      description: `בקרה על קליטת סחורה והפצתה.
ניהול מלאי שוטף.
קליטת עובדים חדשים.
טיפול בנוכחות העובדים.
אדמיניסטרציה שוטפת.
⚠️ משרה דיסקרטית - נא לא לפרסם.
שעות עבודה: 08:00-17:00`,
      requirements: `ניסיון קודם בתפקיד דומה - חובה
ניסיון במערכת WMS - חובה
יכולת עבודה בסביבה ממוחשבת
עבודה באקסל - חובה
ניידות - חובה`,
      benefits: 'השכר בהתאם לניסיון\nיש ארוחות בצהריים',
      transportation: 'עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: ['פקיד', 'WMS', 'Excel', 'בית שמש', 'דיסקרטי', 'מלאי']
    }
  ]

  console.log(`📝 מוסיף ${positions.length} משרות...`)

  let created = 0
  let errors = 0

  for (const positionData of positions) {
    try {
      const position = await prisma.position.create({
        data: {
          title: positionData.title,
          location: positionData.location,
          description: positionData.description,
          requirements: positionData.requirements,
          salaryRange: positionData.salaryRange,
          employmentType: positionData.employmentType,
          active: positionData.active,
          employerId: employer.id,
          workHours: positionData.workHours || null,
          benefits: positionData.benefits || null,
          transportation: positionData.transportation || null,
          contactName: positionData.contactName || null
        }
      })

      // יצירת תגיות
      for (const tagName of positionData.tags) {
        let tag = await prisma.tag.findFirst({ where: { name: tagName } })
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName, type: 'POSITION', color: '#f59e0b' }
          })
        }
        await prisma.position.update({
          where: { id: position.id },
          data: { tags: { connect: { id: tag.id } } }
        })
      }

      console.log(`✅ נוצר: ${position.title} - ${positionData.location}`)
      created++
    } catch (error) {
      console.error(`❌ שגיאה ביצירת משרה ${positionData.title}:`, error.message)
      errors++
    }
  }

  console.log(`\n🎉 הושלם! נוצרו: ${created} משרות, שגיאות: ${errors}`)
}

main()
  .catch((e) => {
    console.error('💥 שגיאה:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
