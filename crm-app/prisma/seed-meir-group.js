const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BENEFITS_STANDARD = `חדר אוכל - ארוחות צהריים מסובסדות
ביטוח רפואי פרטי במימון החברה
ביגוד
חניה`;

const BENEFITS_WITH_BONUS = `חדר אוכל - ארוחות צהריים מסובסדות
ביטוח רפואי פרטי במימון החברה
ביגוד
חניה
מענק התמדה במשך שנתיים`;

const HOURS_FULL = 'משרה מלאה 5 ימים בשבוע, 7:30–16:30, ימי שישי לסירוגין 7:30–12:00';
const HOURS_MOBILE = 'עבודה מהשעה 7:30 עד 14:00 במרכז השירות ולאחר מכן כוננות, ימי שישי לסירוגין כולל כוננות';

async function main() {
  console.log('🏢 מוסיף קבוצת מאיר ומשרות...');

  // ── יצירת המעסיק ──────────────────────────────────────────────────
  const meir = await prisma.employer.upsert({
    where: { email: 'hr@meirgroup.co.il' },
    update: { name: 'קבוצת מאיר', phone: '', description: 'קבוצת מאיר - מרכזי שירות רכב' },
    create: {
      name: 'קבוצת מאיר',
      email: 'hr@meirgroup.co.il',
      phone: '',
      description: 'קבוצת מאיר - מרכזי שירות רכב',
    },
  });
  console.log('✅ מעסיק נוסף: קבוצת מאיר');

  // ── משרות ─────────────────────────────────────────────────────────

  // 1. יועץ שירות – עמק חפר
  await prisma.position.create({
    data: {
      title: 'יועץ שירות',
      employerId: meir.id,
      location: 'מרכז שירות עמק חפר',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.
מתן מענה מקצועי ללקוחות החברה.
עבודה עם ממשקים`,
      requirements: `ניסיון בשירות לקוחות – חובה
תודעה גבוהה למתן שירות`,
      workHours: HOURS_FULL,
      benefits: BENEFITS_STANDARD,
      keywords: JSON.stringify([
        'יועץ שירות','שירות לקוחות','מרכז שירות','ממשקים','עמק חפר','תודעת שירות'
      ]),
    },
  });
  console.log('✅ יועץ שירות – עמק חפר');

  // 2. דיאגנוסטיקה – עמק חפר
  await prisma.position.create({
    data: {
      title: 'דיאגנוסטיקה',
      employerId: meir.id,
      location: 'מרכז שירות עמק חפר',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'אבחון תקלות ברכבים באמצעות ציוד דיאגנוסטי',
      requirements: `ניסיון בדיאגנוסטיקה ברמה טובה מאוד
אנגלית טכנית`,
      workHours: HOURS_FULL,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'דיאגנוסטיקה','אבחון תקלות','טכנאי רכב','אנגלית טכנית','עמק חפר','מרכז שירות'
      ]),
    },
  });
  console.log('✅ דיאגנוסטיקה – עמק חפר');

  // 3. מכונאי ניידת – רמלה
  await prisma.position.create({
    data: {
      title: 'מכונאי ניידת',
      employerId: meir.id,
      location: 'מרכז שירות רמלה',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'עבודת מכונאות בשטח – ניידת שירות',
      requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
      workHours: HOURS_MOBILE,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'מכונאי','מכונאות','ניידת','רישיון ג','כוננות','רמלה','מרכז שירות'
      ]),
    },
  });
  console.log('✅ מכונאי ניידת – רמלה');

  // 4. מכונאי צמ"ה – אשדוד
  await prisma.position.create({
    data: {
      title: 'מכונאי צמ"ה',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'עבודת מכונאות על ציוד מכני הנדסי (צמ"ה)',
      requirements: `ניסיון כמכונאי ברמה טובה מאוד
רישיון נהיגה מעל 15 טון`,
      workHours: HOURS_FULL,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'מכונאי','צמ"ה','ציוד מכני הנדסי','רישיון כבד','15 טון','אשדוד','מרכז שירות'
      ]),
    },
  });
  console.log('✅ מכונאי צמ"ה – אשדוד');

  // 5. בוחן – אשדוד
  await prisma.position.create({
    data: {
      title: 'בוחן',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: `בחינת רכבים של לקוחות מרכז השירות
בדיקה מכאנית של תקלות
נסיעות מבחן
עדכון כרטיסי עבודה לאחר בחינה`,
      requirements: 'ניסיון בבחינה בבור (לא במכון רישוי)',
      workHours: HOURS_FULL,
      benefits: BENEFITS_STANDARD,
      keywords: JSON.stringify([
        'בוחן','בחינת רכבים','נסיעות מבחן','בדיקה מכאנית','כרטיסי עבודה','אשדוד','מרכז שירות'
      ]),
    },
  });
  console.log('✅ בוחן – אשדוד');

  // 6. מכונאי ניידת שירות 24/7 – אשדוד
  await prisma.position.create({
    data: {
      title: 'מכונאי ניידת שירות 24/7',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 2,
      description: 'עבודת מכונאות בשטח בכוננות 24/7 – ניידת שירות',
      requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
      workHours: HOURS_MOBILE,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'מכונאי','ניידת','24/7','כוננות','רישיון ג','אשדוד','מרכז שירות','שירות שטח'
      ]),
    },
  });
  console.log('✅ מכונאי ניידת שירות 24/7 – אשדוד');

  // 7. מכונאים (4 משרות) – אשדוד
  await prisma.position.create({
    data: {
      title: 'מכונאי',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 4,
      priority: 2,
      description: 'עבודת מכונאות במרכז שירות',
      requirements: 'ניסיון כמכונאי ברמה טובה מאוד',
      workHours: HOURS_FULL,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'מכונאי','מכונאות','טכנאי רכב','אשדוד','מרכז שירות','משרה מלאה'
      ]),
    },
  });
  console.log('✅ מכונאים (4) – אשדוד');

  // 8. נהג – אשדוד
  await prisma.position.create({
    data: {
      title: 'נהג',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'נהג/ת שינוע משאיות ואוטובוסים ונסיעות מבחן',
      requirements: 'רישיון נהיגה E+D – חובה',
      workHours: HOURS_FULL,
      benefits: BENEFITS_STANDARD,
      keywords: JSON.stringify([
        'נהג','רישיון E','רישיון D','שינוע','משאיות','אוטובוסים','נסיעות מבחן','אשדוד'
      ]),
    },
  });
  console.log('✅ נהג – אשדוד');

  // 9. מחסנאים (2 משרות) – אשדוד
  await prisma.position.create({
    data: {
      title: 'מחסנאי',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 2,
      priority: 1,
      description: `עבודת מחסן בסביבת עבודה ממוחשבת
ליקוט חלפים
סידור וספירות מלאי`,
      requirements: 'הבנה בחלקי חילוף לרכב – יתרון משמעותי',
      workHours: HOURS_FULL,
      benefits: BENEFITS_STANDARD,
      keywords: JSON.stringify([
        'מחסנאי','מחסן','ליקוט','חלפים','חלקי חילוף','מלאי','ממוחשב','אשדוד'
      ]),
    },
  });
  console.log('✅ מחסנאים (2) – אשדוד');

  // 10. מסגר – אשדוד
  await prisma.position.create({
    data: {
      title: 'מסגר',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'עבודת מסגרות במרכז שירות',
      requirements: 'ניסיון כמסגר',
      workHours: HOURS_FULL,
      benefits: BENEFITS_STANDARD,
      keywords: JSON.stringify([
        'מסגר','מסגרות','עבודת מתכת','אשדוד','מרכז שירות'
      ]),
    },
  });
  console.log('✅ מסגר – אשדוד');

  // 11. פחח – אשדוד
  await prisma.position.create({
    data: {
      title: 'פחח',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'עבודת פחחות במרכז שירות',
      requirements: 'ניסיון כפחח',
      workHours: HOURS_FULL,
      benefits: BENEFITS_STANDARD,
      keywords: JSON.stringify([
        'פחח','פחחות','תיקון פגמים','קרוסרי','אשדוד','מרכז שירות'
      ]),
    },
  });
  console.log('✅ פחח – אשדוד');

  // 12. מכונאי ניידת שירות – אשדוד
  await prisma.position.create({
    data: {
      title: 'מכונאי ניידת שירות',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'עבודת מכונאות בשטח – ניידת שירות',
      requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
      workHours: HOURS_FULL,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'מכונאי','ניידת שירות','רישיון ג','מכונאות','אשדוד','מרכז שירות'
      ]),
    },
  });
  console.log('✅ מכונאי ניידת שירות – אשדוד');

  // 13. מכונאי ניידת צמ"ה – אשדוד
  await prisma.position.create({
    data: {
      title: 'מכונאי ניידת צמ"ה',
      employerId: meir.id,
      location: 'מרכז שירות אשדוד',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'עבודת מכונאות בשטח על ציוד מכני הנדסי – ניידת שירות',
      requirements: `ניסיון במכונאות – חובה
רישיון נהיגה ג' – חובה`,
      workHours: HOURS_FULL,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'מכונאי','צמ"ה','ניידת','ציוד מכני הנדסי','רישיון ג','אשדוד','מרכז שירות'
      ]),
    },
  });
  console.log('✅ מכונאי ניידת צמ"ה – אשדוד');

  // 14. דיאגנוסטיקה – מרכז שירות דרום
  await prisma.position.create({
    data: {
      title: 'דיאגנוסטיקה',
      employerId: meir.id,
      location: 'מרכז שירות דרום',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: 'אבחון תקלות ברכבים באמצעות ציוד דיאגנוסטי',
      requirements: 'ניסיון בדיאגנוסטיקה ברמה טובה מאוד',
      workHours: HOURS_FULL,
      benefits: BENEFITS_WITH_BONUS,
      keywords: JSON.stringify([
        'דיאגנוסטיקה','אבחון תקלות','טכנאי רכב','מרכז שירות דרום','דרום'
      ]),
    },
  });
  console.log('✅ דיאגנוסטיקה – מרכז שירות דרום');

  // 15. יועץ שירות – מרכז שירות דרום
  await prisma.position.create({
    data: {
      title: 'יועץ שירות',
      employerId: meir.id,
      location: 'מרכז שירות דרום',
      employmentType: 'Full-time',
      active: true,
      openings: 1,
      priority: 1,
      description: `ליווי הלקוח מהגעתו למרכז השירות ועד לשחרורו.
מתן מענה מקצועי ללקוחות החברה.
עבודה עם ממשקים`,
      requirements: `ניסיון בשירות לקוחות – חובה
תודעה גבוהה למתן שירות`,
      workHours: HOURS_FULL,
      benefits: `ביגוד
חניה`,
      keywords: JSON.stringify([
        'יועץ שירות','שירות לקוחות','מרכז שירות דרום','ממשקים','תודעת שירות','דרום'
      ]),
    },
  });
  console.log('✅ יועץ שירות – מרכז שירות דרום');

  console.log('\n🎉 סיום! קבוצת מאיר + 15 משרות נוספו בהצלחה.');
}

main()
  .catch((e) => {
    console.error('❌ שגיאה:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
