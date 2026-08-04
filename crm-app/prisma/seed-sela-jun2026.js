const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 🏷️ תגיות בסיס לוגיסטיקה - 50+ תגיות לכל משרה
const TAGS_HIGASH_BNEY_DAROM = [
  // תפקיד
  'מלגזן', 'מלגזנים', 'היגש', 'מלגזת היגש', 'reach truck', 'reach forklift', 'forklift',
  'מלגזה', 'מלגזות', 'נהג מלגזה', 'נהגי מלגזה', 'מפעיל מלגזה',
  // לוגיסטיקה כללי
  'לוגיסטיקה', 'מחסן', 'מחסנים', 'מרלוג', 'מרכז לוגיסטי', 'warehouse',
  'מחסנאות', 'שרשרת אספקה', 'supply chain', 'הפצה', 'אחסון', 'אחסנה',
  'סחורה', 'מלאי', 'inventory', 'pallet', 'משטח', 'משטחים',
  // מיומנויות היגש
  'גובה רב', 'אחסון גובה', 'narrow aisle', 'מעברים צרים', 'דיוק גבוה',
  'שליפה מגובה', 'רמות', 'מדפים', 'racks', 'ליקוט', 'picking', 'פיקינג',
  // מיקום ותחבורה
  'בני דרום', 'דרום', 'אזור דרום', 'שפלה דרומית', 'אשקלון', 'אשדוד',
  'הסעה מאשקלון', 'הסעה מאשדוד', 'הסעות',
  // תנאים
  'ארוחות', 'ארוחות חמות', 'ארוחה חמה', 'תנאים מצוינים', 'תנאים מעולים',
  'בונוסים', 'בונוסים גבוהים', 'סביבת עבודה משפחתית', 'מתנות ופינוקים',
  '50 שקל לשעה', 'שכר שעתי', 'שכר גבוה', 'גמישות בשכר',
  // כללי
  'משרה מלאה', 'full time', 'רישיון מלגזה', 'עבודה פיזית', 'עבודת צוות',
  'אחריות', 'סדר וארגון', 'אזור תעשייה', 'industrial', 'מפעל',
  'עבודה תחת לחץ', 'דיוק', 'זהירות', 'בטיחות', 'ניסיון', 'רצינות',
  'אחסון לוגיסטי', 'עובד מחסן', 'ניידות', 'גמישות'
]

const TAGS_HOBEK_BEIT_SHEMESH = [
  // תפקיד
  'מלגזן', 'מלגזנים', 'חובק', 'מלגזת חובק', 'counterbalance', 'counterbalance forklift',
  'forklift', 'מלגזה', 'מלגזות', 'נהג מלגזה', 'נהגי מלגזה', 'מפעיל מלגזה',
  // לוגיסטיקה כללי
  'לוגיסטיקה', 'מחסן', 'מחסנים', 'מרלוג', 'מרכז לוגיסטי', 'warehouse',
  'מחסנאות', 'שרשרת אספקה', 'supply chain', 'הפצה', 'אחסון', 'אחסנה',
  'סחורה', 'מלאי', 'inventory', 'pallet', 'משטח', 'משטחים',
  // מיומנויות חובק
  'העמסה', 'פריקה', 'הרמה', 'נסיעה', 'תמרון', 'הובלת סחורה',
  'סידור מחסן', 'הנחת משטחים', 'מדפים', 'racks',
  // מיקום
  'בית שמש', 'אזור בית שמש', 'הר טוב', 'אזור תעשייה הר טוב', 'שפלה',
  'אזור ירושלים', 'מרכז',
  // תנאים
  'ארוחות', 'ארוחות חמות', 'ארוחה חמה', 'תנאים מצוינים', 'תנאים מעולים',
  'בונוסים', 'בונוסים גבוהים', 'סביבת עבודה משפחתית', 'מתנות ופינוקים',
  'פינוקים לאורך השנה', 'מתנות',
  '50 שקל לשעה', 'שכר שעתי', 'שכר גבוה', 'גמישות בשכר',
  // כללי
  'משרה מלאה', 'full time', 'רישיון מלגזה', 'עבודה פיזית', 'עבודת צוות',
  'אחריות', 'סדר וארגון', 'אזור תעשייה', 'industrial', 'מפעל',
  'עבודה תחת לחץ', 'דיוק', 'זהירות', 'בטיחות', 'ניסיון', 'רצינות',
  'אחסון לוגיסטי', 'עובד מחסן', 'ניידות', 'גמישות'
]

async function main() {
  console.log('🚀 מתחיל הוספת משרות סלע לוגיסטיקה - יוני 2026...')

  // מציאת מעסיק סלע לוגיסטיקה
  const employer = await prisma.employer.findFirst({
    where: {
      OR: [
        { name: { contains: 'סלע לוגיסטיקה' } },
        { email: 'jobs@sela-logistics.co.il' }
      ]
    }
  })

  if (!employer) {
    throw new Error('❌ מעסיק סלע לוגיסטיקה לא נמצא במסד הנתונים! הרץ את seed-sela-logistics-may2026.js תחילה.')
  }

  console.log(`✅ מעסיק נמצא: ${employer.name} (ID: ${employer.id})`)

  const positions = [
    // ========================
    // מלגזני היגש - בני דרום (x2)
    // ========================
    {
      title: 'מלגזן/ית היגש - בני דרום (1)',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '50 ₪ לשעה (יש גמישות)',
      description: `עבודה על מלגזת היגש - ליקוטים, אחסון מגובה וניהול סחורה במרלוג.
משרה מלאה בסביבת עבודה משפחתית ונעימה.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבודה פיזית ורצינות`,
      benefits: `הסעות מאשקלון ואשדוד
ארוחות חמות
בונוסים גבוהים
סביבת עבודה משפחתית ונעימה
מתנות ופינוקים לאורך השנה`,
      transportation: 'הסעות מאשקלון ואשדוד',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: TAGS_HIGASH_BNEY_DAROM
    },
    {
      title: 'מלגזן/ית היגש - בני דרום (2)',
      location: 'בני דרום',
      workHours: '08:00-17:00',
      salaryRange: '50 ₪ לשעה (יש גמישות)',
      description: `עבודה על מלגזת היגש - ליקוטים, אחסון מגובה וניהול סחורה במרלוג.
משרה מלאה בסביבת עבודה משפחתית ונעימה.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת היגש - יתרון
נכונות לעבודה פיזית ורצינות`,
      benefits: `הסעות מאשקלון ואשדוד
ארוחות חמות
בונוסים גבוהים
סביבת עבודה משפחתית ונעימה
מתנות ופינוקים לאורך השנה`,
      transportation: 'הסעות מאשקלון ואשדוד',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: TAGS_HIGASH_BNEY_DAROM
    },

    // ========================
    // מלגזני חובק - בית שמש (x3)
    // ========================
    {
      title: 'מלגזן/ית חובק - בית שמש (1)',
      location: 'בית שמש',
      workHours: '08:00-17:00',
      salaryRange: '50 ₪ לשעה (יש גמישות)',
      description: `עבודה על מלגזת חובק - העמסה, פריקה ואחסון סחורה במרלוג בית שמש.
תנאים מעולים למתאימים, סביבת עבודה משפחתית ונעימה.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת חובק - יתרון
נכונות לעבודה פיזית`,
      benefits: `ארוחות חמות
בונוסים גבוהים
תנאים מעולים למתאימים
סביבת עבודה משפחתית ונעימה
מתנות ופינוקים לאורך השנה`,
      transportation: 'הגעה עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: TAGS_HOBEK_BEIT_SHEMESH
    },
    {
      title: 'מלגזן/ית חובק - בית שמש (2)',
      location: 'בית שמש',
      workHours: '08:00-17:00',
      salaryRange: '50 ₪ לשעה (יש גמישות)',
      description: `עבודה על מלגזת חובק - העמסה, פריקה ואחסון סחורה במרלוג בית שמש.
תנאים מעולים למתאימים, סביבת עבודה משפחתית ונעימה.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת חובק - יתרון
נכונות לעבודה פיזית`,
      benefits: `ארוחות חמות
בונוסים גבוהים
תנאים מעולים למתאימים
סביבת עבודה משפחתית ונעימה
מתנות ופינוקים לאורך השנה`,
      transportation: 'הגעה עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: TAGS_HOBEK_BEIT_SHEMESH
    },
    {
      title: 'מלגזן/ית חובק - בית שמש (3)',
      location: 'בית שמש',
      workHours: '08:00-17:00',
      salaryRange: '50 ₪ לשעה (יש גמישות)',
      description: `עבודה על מלגזת חובק - העמסה, פריקה ואחסון סחורה במרלוג בית שמש.
תנאים מעולים למתאימים, סביבת עבודה משפחתית ונעימה.
שעות עבודה: 08:00-17:00`,
      requirements: `רישיון מלגזה - חובה
ניסיון על מלגזת חובק - יתרון
נכונות לעבודה פיזית`,
      benefits: `ארוחות חמות
בונוסים גבוהים
תנאים מעולים למתאימים
סביבת עבודה משפחתית ונעימה
מתנות ופינוקים לאורך השנה`,
      transportation: 'הגעה עצמאית',
      contactName: 'Pninit Roitman',
      employmentType: 'משרה מלאה',
      active: true,
      tags: TAGS_HOBEK_BEIT_SHEMESH
    }
  ]

  console.log(`📝 מוסיף ${positions.length} משרות...`)
  console.log(`🏷️  כל משרת היגש: ${TAGS_HIGASH_BNEY_DAROM.length} תגיות`)
  console.log(`🏷️  כל משרת חובק: ${TAGS_HOBEK_BEIT_SHEMESH.length} תגיות`)

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

      // יצירת/חיבור תגיות
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

      console.log(`✅ נוצר: ${position.title} | ${positionData.location} | ${positionData.tags.length} תגיות`)
      created++
    } catch (error) {
      console.error(`❌ שגיאה ביצירת משרה "${positionData.title}":`, error.message)
      errors++
    }
  }

  console.log(`\n🎉 הושלם! נוצרו: ${created} משרות, שגיאות: ${errors}`)
  console.log('\n📋 סיכום משרות:')
  console.log('  • 2 × מלגזן/ית היגש - בני דרום | 50 ₪/שעה | הסעות מאשקלון ואשדוד + ארוחות')
  console.log('  • 3 × מלגזן/ית חובק - בית שמש  | 50 ₪/שעה | ארוחות + תנאים מעולים')
}

main()
  .catch((e) => {
    console.error('💥 שגיאה:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
