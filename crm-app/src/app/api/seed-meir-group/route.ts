import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
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
        description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.\nמתן מענה מקצועי ללקוחות החברה.\nעבודה עם ממשקים.`,
        requirements: `ניסיון בשירות לקוחות - חובה\nתודעה גבוהה למתן שירות`,
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
        requirements: `ניסיון בדיאגנוסטיקה ברמה טובה מאוד - חובה\nאנגלית טכנית`,
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
        requirements: `ניסיון במכונאות - חובה\nרישיון נהיגה ג' - חובה`,
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
        requirements: `ניסיון במכונאות - חובה\nניסיון כמכונאי ברמה טובה מאוד\nרישיון נהיגה מעל 15 טון`,
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
        description: `בחינת רכבים של לקוחות מרכז השירות.\nבדיקה מכאנית של תקלות.\nנסיעות מבחן.\nעדכון כרטיסי עבודה לאחר בחינה.`,
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
        requirements: `ניסיון במכונאות - חובה\nרישיון נהיגה ג' - חובה`,
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
        description: `עבודת מחסן בסביבת עבודה ממוחשבת.\nליקוט חלפים, סידור, ספירות מלאי.\nהבנה בחלקי חילוף לרכב - יתרון משמעותי.`,
        requirements: `ניסיון בעבודת מחסן\nהבנה בחלקי חילוף לרכב - יתרון משמעותי`,
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
        requirements: `ניסיון במכונאות - חובה\nרישיון נהיגה ג' - חובה`,
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
        requirements: `ניסיון במכונאות - חובה\nרישיון נהיגה ג' - חובה`,
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
        description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.\nמתן מענה מקצועי ללקוחות החברה.\nעבודה עם ממשקים.`,
        requirements: `ניסיון בשירות לקוחות - חובה\nתודעה גבוהה למתן שירות`,
        workHours: 'משרה מלאה 5 ימים בשבוע, 7:30-16:30. ימי שישי לסירוגין 7:30-12:00',
        benefits: `חדר אוכל - ארוחות צהריים מסובסדות\nביגוד\nחניה`,
        employmentType: 'משרה מלאה',
        active: true,
        openings: 1,
        tags: ['יועץ שירות', 'שירות לקוחות', 'דרום', 'רכב'],
      },
    ]

    const created: string[] = []
    let totalOpenings = 0

    for (const posData of positions) {
      const tags = posData.tags
      totalOpenings += posData.openings

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

      created.push(`${posData.title} (${posData.openings})`)
    }

    return NextResponse.json({
      success: true,
      employer: meirGroup.name,
      employerId: meirGroup.id,
      positionsCreated: positions.length,
      totalOpenings,
      positions: created,
    })
  } catch (error: unknown) {
    console.error('❌ Seed error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
