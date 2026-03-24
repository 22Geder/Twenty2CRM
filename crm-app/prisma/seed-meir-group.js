const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🏢 Adding קבוצת מאיר employer and positions...')

  // Create or get קבוצת מאיר employer
  const meirGroup = await prisma.employer.upsert({
    where: { email: 'hr@meir-group.co.il' },
    update: {},
    create: {
      name: 'קבוצת מאיר',
      email: 'hr@meir-group.co.il',
      phone: '',
      description: 'קבוצת מאיר - מרכזי שירות רכב ברחבי הארץ',
    },
  })
  console.log('✅ Added employer: קבוצת מאיר', meirGroup.id)

  const commonBenefits = `חדר אוכל - ארוחות צהריים מסובסדות
ביטוח רפואי פרטי במימון החברה
ביגוד
חניה`

  const commonBenefitsWithBonus = `${commonBenefits}
מענק התמדה במשך שנתיים`

  const positions = [
    // === מרכז שירות עמק חפר ===
    {
      title: 'יועץ שירות - מרכז שירות עמק חפר',
      location: 'עמק חפר',
      description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.
מתן מענה מקצועי ללקוחות החברה.
עבודה עם ממשקים.`,
      requirements: `ניסיון בשירות לקוחות - חובה
תודעה גבוהה למתן שירות`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefits,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['יועץ שירות', 'שירות לקוחות', 'עמק חפר', 'רכב'],
    },
    {
      title: 'דיאגנוסטיקאי - מרכז שירות עמק חפר',
      location: 'עמק חפר',
      description: `עבודת דיאגנוסטיקה ואבחון תקלות ברכבים במרכז השירות.`,
      requirements: `ניסיון בדיאגנוסטיקה ברמה טובה מאוד - חובה
אנגלית טכנית`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['דיאגנוסטיקה', 'אבחון תקלות', 'עמק חפר', 'רכב', 'אנגלית טכנית'],
    },

    // === מרכז שירות רמלה ===
    {
      title: 'מכונאי ניידת - מרכז שירות רמלה',
      location: 'רמלה',
      description: `מכונאי ניידת שירות. עבודה מהשעה 7:30 עד 14:00 במרכז השירות ולאחר מכן כוננות.`,
      requirements: `ניסיון במכונאות - חובה
רישיון נהיגה ג' - חובה`,
      workHours: '7:30-14:00 במרכז השירות + כוננות. ימי שישי לסירוגין כולל כוננות',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['מכונאי', 'ניידת שירות', 'רמלה', 'כוננות', 'רישיון ג'],
    },

    // === מרכז שירות אשדוד ===
    {
      title: 'מכונאי צמ"ה - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `מכונאי ציוד מכני הנדסי (צמ"ה) במרכז השירות.`,
      requirements: `ניסיון במכונאות - חובה
ניסיון כמכונאי ברמה טובה מאוד
רישיון נהיגה מעל 15 טון`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['מכונאי', 'צמ"ה', 'אשדוד', 'רישיון 15 טון', 'ציוד מכני'],
    },
    {
      title: 'בוחן רכב - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `בחינת רכבים של לקוחות מרכז השירות.
בדיקה מכאנית של תקלות.
נסיעות מבחן.
עדכון כרטיסי עבודה לאחר בחינה.`,
      requirements: `ניסיון בבחינה בבור (לא במכון רישוי) - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefits,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['בוחן רכב', 'אשדוד', 'בדיקה מכאנית', 'נסיעות מבחן'],
    },
    {
      title: 'מכונאי ניידת שירות 24/7 - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `מכונאי ניידת שירות 24/7. עבודה מהשעה 7:30 עד 14:00 במרכז השירות ולאחר מכן כוננות.`,
      requirements: `ניסיון במכונאות - חובה
רישיון נהיגה ג' - חובה`,
      workHours: '7:30-14:00 במרכז השירות + כוננות. ימי שישי לסירוגין כולל כוננות',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['מכונאי', 'ניידת שירות', 'אשדוד', 'כוננות', '24/7', 'רישיון ג'],
    },
    {
      title: 'מכונאי רכב - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `עבודת מכונאות רכב במרכז השירות.`,
      requirements: `ניסיון כמכונאי ברמה טובה מאוד - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 4,
      tags: ['מכונאי', 'אשדוד', 'רכב', 'מוסך'],
    },
    {
      title: 'נהג שינוע - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `נהג/ת שינוע משאיות ואוטובוסים ונסיעות מבחן.`,
      requirements: `רישיון נהיגה E+D - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefits,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['נהג', 'שינוע', 'אשדוד', 'משאיות', 'אוטובוסים', 'רישיון E', 'רישיון D'],
    },
    {
      title: 'מחסנאי - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `עבודת מחסן בסביבת עבודה ממוחשבת.
ליקוט חלפים, סידור, ספירות מלאי.
הבנה בחלקי חילוף לרכב - יתרון משמעותי.`,
      requirements: `ניסיון בעבודת מחסן
הבנה בחלקי חילוף לרכב - יתרון משמעותי`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefits,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 2,
      tags: ['מחסנאי', 'אשדוד', 'מחסן', 'ליקוט', 'חלקי חילוף', 'רכב'],
    },
    {
      title: 'מסגר - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `עבודת מסגרות במרכז השירות.`,
      requirements: `ניסיון כמסגר - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefits,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['מסגר', 'אשדוד', 'רכב'],
    },
    {
      title: 'פחח - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `עבודת פחחות במרכז השירות.`,
      requirements: `ניסיון כפחח - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefits,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['פחח', 'פחחות', 'אשדוד', 'רכב'],
    },
    {
      title: 'מכונאי ניידת שירות - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `מכונאי ניידת שירות במרכז שירות אשדוד.`,
      requirements: `ניסיון במכונאות - חובה
רישיון נהיגה ג' - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['מכונאי', 'ניידת שירות', 'אשדוד', 'רישיון ג'],
    },
    {
      title: 'מכונאי ניידת צמ"ה - מרכז שירות אשדוד',
      location: 'אשדוד',
      description: `מכונאי ניידת ציוד מכני הנדסי (צמ"ה) במרכז שירות אשדוד.`,
      requirements: `ניסיון במכונאות - חובה
רישיון נהיגה ג' - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['מכונאי', 'ניידת', 'צמ"ה', 'אשדוד', 'רישיון ג'],
    },

    // === מרכז שירות דרום ===
    {
      title: 'דיאגנוסטיקאי - מרכז שירות דרום',
      location: 'דרום',
      description: `עבודת דיאגנוסטיקה ואבחון תקלות ברכבים במרכז השירות.`,
      requirements: `ניסיון בדיאגנוסטיקה ברמה טובה מאוד - חובה`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: commonBenefitsWithBonus,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['דיאגנוסטיקה', 'אבחון תקלות', 'דרום', 'רכב'],
    },
    {
      title: 'יועץ שירות - מרכז שירות דרום',
      location: 'דרום',
      description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.
מתן מענה מקצועי ללקוחות החברה.
עבודה עם ממשקים.`,
      requirements: `ניסיון בשירות לקוחות - חובה
תודעה גבוהה למתן שירות`,
      workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
      benefits: `חדר אוכל - ארוחות צהריים מסובסדות
ביגוד
חניה`,
      employmentType: 'משרה מלאה',
      active: true,
      openings: 1,
      tags: ['יועץ שירות', 'שירות לקוחות', 'דרום', 'רכב'],
    },
  ]

  console.log(`📦 Creating ${positions.length} positions for קבוצת מאיר...`)

  let totalOpenings = 0
  for (const posData of positions) {
    const tags = posData.tags
    delete posData.tags

    totalOpenings += posData.openings

    // Generate keywords from tags
    const keywords = JSON.stringify(tags)

    const position = await prisma.position.create({
      data: {
        title: posData.title,
        description: posData.description,
        requirements: posData.requirements,
        location: posData.location,
        workHours: posData.workHours,
        benefits: posData.benefits,
        employmentType: posData.employmentType,
        active: posData.active,
        openings: posData.openings,
        keywords: keywords,
        priority: 5,
        employerId: meirGroup.id,
      },
    })

    // Create and connect tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tag = await prisma.tag.findFirst({
          where: { name: tagName },
        })

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              category: 'skill',
            },
          })
        }

        await prisma.position.update({
          where: { id: position.id },
          data: {
            tags: {
              connect: { id: tag.id },
            },
          },
        })
      }
    }

    console.log(`✅ Created: ${posData.title} (${posData.openings} openings) - ${posData.location}`)
  }

  console.log(`\n🎉 Done! Created ${positions.length} positions (${totalOpenings} total openings) for קבוצת מאיר`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
