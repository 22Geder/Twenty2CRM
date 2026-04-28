const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const employerId = 'ab320332-a272-468e-a26d-c563f2ae59ef';

  // === משרה 1: נהג - 45 ש"ח, ללא שישי ===
  const pos1 = await p.position.create({
    data: {
      title: 'נהג - רישיון מעל 12 טון',
      description: 'נהג משאית מעל 12 טון לחברת ברוש סחר בברזל באשדוד. עבודה בהובלת חומרי בניין וברזל. ללא רכב צמוד. כולל עבודת מחסנאות במידת הצורך.',
      requirements: 'רישיון נהיגה מעל 12 טון (C+E או C1). ניסיון בנהיגת משאיות. כושר פיזי טוב. יכולת עבודה בצוות. ניסיון בהובלת ברזל/חומרי בניין - יתרון.',
      location: 'אשדוד - אזור התעשייה',
      salaryRange: '45 ש"ח לשעה',
      employmentType: 'Full-time',
      employerId: employerId,
      active: true,
      workHours: 'ימים א-ה, ללא שישי',
      benefits: 'ללא רכב צמוד. כולל עבודת מחסנאות.',
      keywords: JSON.stringify(['נהג','משאית','רישיון מעל 12','הובלה','ברזל','חומרי בניין','מחסנאי','אשדוד','אזור תעשייה','ללא שישי'])
    }
  });
  console.log('✅ Created position 1 (נהג):', pos1.id);

  // === משרה 2: עובדים כלליים - 42 ש"ח, שישי כן, שבת לא ===
  const pos2 = await p.position.create({
    data: {
      title: 'עובד/ת כללי/ת',
      description: 'עובד/ת כללי/ת לחברת ברוש סחר בברזל באשדוד. עבודה כללית במחסן ובשטח.',
      requirements: 'כושר פיזי טוב. נכונות לעבודה פיזית. אחריות ומוטיבציה. עבודה בימי שישי - חובה.',
      location: 'אשדוד - אזור התעשייה',
      salaryRange: '42 ש"ח לשעה',
      employmentType: 'Full-time',
      employerId: employerId,
      active: true,
      workHours: 'ימים א-ו (כולל שישי), ללא שבת',
      benefits: 'עבודה יציבה. אפשרויות קידום.',
      keywords: JSON.stringify(['עובד כללי','עבודה פיזית','מחסן','ברזל','חומרי בניין','אשדוד','אזור תעשייה','שישי','ללא שבת'])
    }
  });
  console.log('✅ Created position 2 (עובד כללי):', pos2.id);

  // === משרה 3: עוזר מחסנאי - 43 ש"ח, שישי כן, שבת לא ===
  const pos3 = await p.position.create({
    data: {
      title: 'עוזר/ת מחסנאי/ת',
      description: 'עוזר/ת מחסנאי/ת לחברת ברוש סחר בברזל באשדוד. סיוע בעבודת המחסן, ליקוט, סידור והכנת הזמנות.',
      requirements: 'כושר פיזי טוב. יכולת עבודה בצוות. סדר וארגון. ניסיון במחסנאות - יתרון. עבודה בימי שישי - חובה.',
      location: 'אשדוד - אזור התעשייה',
      salaryRange: '43 ש"ח לשעה',
      employmentType: 'Full-time',
      employerId: employerId,
      active: true,
      workHours: 'ימים א-ו (כולל שישי), ללא שבת',
      benefits: 'עבודה יציבה. סביבת עבודה מקצועית.',
      keywords: JSON.stringify(['עוזר מחסנאי','מחסנאי','מחסן','ליקוט','סידור','ברזל','חומרי בניין','אשדוד','אזור תעשייה','שישי','ללא שבת'])
    }
  });
  console.log('✅ Created position 3 (עוזר מחסנאי):', pos3.id);

  // === יצירת 40 תגיות ===
  const allTagNames = [
    // נהג (7)
    'נהג', 'נהג משאית', 'רישיון C', 'רישיון CE', 'רישיון מעל 12 טון', 'הובלה', 'משאית',
    // מחסנאות (7)
    'מחסנאי', 'עוזר מחסנאי', 'מחסן', 'ליקוט', 'סידור מחסן', 'הכנת הזמנות', 'מלאי',
    // עובד כללי (4)
    'עובד כללי', 'עבודה פיזית', 'עבודה כללית', 'עובד ייצור',
    // תחום (7)
    'ברזל', 'חומרי בניין', 'סחר', 'לוגיסטיקה', 'הפצה', 'שינוע', 'אחסנה',
    // מיקום (3)
    'אשדוד', 'אזור התעשייה אשדוד', 'דרום',
    // תנאים (6)
    'שכר שעתי', 'משרה מלאה', 'עבודה יציבה', 'ללא שישי', 'כולל שישי', 'ללא שבת',
    // כישורים (5)
    'כושר פיזי', 'עבודת צוות', 'אחריות', 'סדר וארגון', 'נהיגה',
    // ברוש (2)
    'ברוש', 'ברוש סחר בברזל',
    // כללי (2) - total = 43 including overlapping
    'ללא ניסיון', 'מתאים למתחילים'
  ];

  console.log('📌 Total unique tags:', allTagNames.length);

  // יצירת תגיות חדשות (רק מה שלא קיים)
  const existingTags = await p.tag.findMany({ where: { name: { in: allTagNames } }, select: { id: true, name: true } });
  const existingNames = new Set(existingTags.map(t => t.name));
  const newNames = allTagNames.filter(n => !existingNames.has(n));

  if (newNames.length > 0) {
    await p.tag.createMany({ data: newNames.map(name => ({ name, category: 'general' })) });
    console.log('🏷️ Created', newNames.length, 'new tags');
  } else {
    console.log('🏷️ All tags already exist');
  }

  // שליפת כל התגיות
  const allTags = await p.tag.findMany({ where: { name: { in: allTagNames } }, select: { id: true, name: true } });

  // חיבור תגיות לנהג (28 תגיות)
  const driverTagNames = [
    'נהג', 'נהג משאית', 'רישיון C', 'רישיון CE', 'רישיון מעל 12 טון', 'הובלה', 'משאית',
    'מחסנאי', 'מחסן',
    'ברזל', 'חומרי בניין', 'סחר', 'לוגיסטיקה', 'הפצה', 'שינוע',
    'אשדוד', 'אזור התעשייה אשדוד', 'דרום',
    'שכר שעתי', 'משרה מלאה', 'עבודה יציבה', 'ללא שישי',
    'כושר פיזי', 'עבודת צוות', 'אחריות', 'נהיגה',
    'ברוש', 'ברוש סחר בברזל'
  ];
  const driverTags = allTags.filter(t => driverTagNames.includes(t.name));
  await p.position.update({ where: { id: pos1.id }, data: { tags: { connect: driverTags.map(t => ({ id: t.id })) } } });
  console.log('🔗 Connected', driverTags.length, 'tags to נהג');

  // חיבור תגיות לעובד כללי (28 תגיות)
  const generalTagNames = [
    'עובד כללי', 'עבודה פיזית', 'עבודה כללית', 'עובד ייצור',
    'מחסן',
    'ברזל', 'חומרי בניין', 'סחר', 'לוגיסטיקה', 'אחסנה', 'הפצה', 'שינוע',
    'אשדוד', 'אזור התעשייה אשדוד', 'דרום',
    'שכר שעתי', 'משרה מלאה', 'עבודה יציבה', 'כולל שישי', 'ללא שבת',
    'כושר פיזי', 'עבודת צוות', 'אחריות', 'סדר וארגון',
    'ברוש', 'ברוש סחר בברזל',
    'ללא ניסיון', 'מתאים למתחילים'
  ];
  const generalTags = allTags.filter(t => generalTagNames.includes(t.name));
  await p.position.update({ where: { id: pos2.id }, data: { tags: { connect: generalTags.map(t => ({ id: t.id })) } } });
  console.log('🔗 Connected', generalTags.length, 'tags to עובד כללי');

  // חיבור תגיות לעוזר מחסנאי (29 תגיות)
  const warehouseTagNames = [
    'עוזר מחסנאי', 'מחסנאי', 'מחסן', 'ליקוט', 'סידור מחסן', 'הכנת הזמנות', 'מלאי',
    'עבודה פיזית',
    'ברזל', 'חומרי בניין', 'סחר', 'לוגיסטיקה', 'אחסנה',
    'אשדוד', 'אזור התעשייה אשדוד', 'דרום',
    'שכר שעתי', 'משרה מלאה', 'עבודה יציבה', 'כולל שישי', 'ללא שבת',
    'כושר פיזי', 'עבודת צוות', 'אחריות', 'סדר וארגון',
    'ברוש', 'ברוש סחר בברזל',
    'ללא ניסיון', 'מתאים למתחילים'
  ];
  const warehouseTags = allTags.filter(t => warehouseTagNames.includes(t.name));
  await p.position.update({ where: { id: pos3.id }, data: { tags: { connect: warehouseTags.map(t => ({ id: t.id })) } } });
  console.log('🔗 Connected', warehouseTags.length, 'tags to עוזר מחסנאי');

  console.log('\n=== ✅ DONE ===');
  console.log('3 positions created for ברוש סחר בברזל בע"מ - אשדוד');
  console.log('Position IDs:', pos1.id, pos2.id, pos3.id);
}

main().catch(e => console.error('❌ Error:', e)).finally(() => p.$disconnect());
