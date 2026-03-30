/**
 * seed-barosh-iron.js
 * מוסיף/מעדכן: ברוש סחר בברזל - אשדוד
 * עובד דלפק - שכר שעתי 45-50 ₪
 * תגיות: מחסנאי + שירות לקוחות + מכירות
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 ברוש סחר בברזל - הוספה/עדכון...\n');

  // 1. צור/עדכן מעסיק
  const employer = await prisma.employer.upsert({
    where: { name: 'ברוש סחר בברזל' },
    update: {
      city: 'אשדוד',
      industry: 'סחר ותעשייה',
    },
    create: {
      name: 'ברוש סחר בברזל',
      city: 'אשדוד',
      industry: 'סחר ותעשייה',
      active: true,
    },
  });
  console.log(`✅ מעסיק: ${employer.name} (${employer.id})`);

  // 2. תגיות למשרת עובד דלפק
  const tags = [
    // מחסנאי
    'מחסנאי',
    'מחסן',
    'קבלת סחורה',
    'ספירת מלאי',
    'פיקינג',
    'אריזה',
    'העמסה ופריקה',
    'ניהול מלאי',
    'ספרי מלאי',
    'רישיון מלגזה',
    // שירות לקוחות
    'שירות לקוחות',
    'עבודה מול לקוחות',
    'קבלת קהל',
    'מכירות בדלפק',
    'מכירות',
    'מכירות פנים',
    'הצעות מחיר',
    'תמיכה טלפונית',
    'תיאום ואדמיניסטרציה',
    // תחום ברזל ובניה
    'חומרי בניה',
    'מוצרי פלדה',
    'ברזל',
    'מסחר',
    'עבודה פיזית',
    'עבודה בשטח',
    // כללי
    'עובד דלפק',
    'עובד מחסן',
    'משמרות',
    'גמישות בשעות',
    'אשדוד',
  ];

  // 3. צור/עדכן את המשרה
  const positionData = {
    title: 'עובד/ת דלפק ומחסן',
    description: 'עבודה בדלפק מכירות ומחסן – קבלת לקוחות, הוצאת סחורה, ספירת מלאי וסיוע בהעמסה. תחום ברזל וחומרי בניה.',
    requirements: 'נסיון בשירות לקוחות או מחסן יתרון. עבודה פיזית. גמישות בשעות.',
    salaryRange: '45-50 ₪ לשעה',
    workHours: 'משמרות, ימים א-ה',
    location: 'אשדוד',
    active: true,
    employerId: employer.id,
  };

  const tagConnects = {
    connectOrCreate: tags.map(tag => ({
      where: { name: tag },
      create: { name: tag, color: '#6366f1' },
    })),
  };

  const existing = await prisma.position.findFirst({
    where: { title: positionData.title, employerId: employer.id },
  });

  let position;
  if (existing) {
    position = await prisma.position.update({
      where: { id: existing.id },
      data: { ...positionData, tags: tagConnects },
      include: { tags: true },
    });
    console.log('🔄 עדכון משרה קיימת');
  } else {
    position = await prisma.position.create({
      data: { ...positionData, tags: tagConnects },
      include: { tags: true },
    });
    console.log('🆕 יצירת משרה חדשה');
  }

  console.log(`✅ משרה: ${position.title} – ${position.location}`);
  console.log(`   שכר: ${position.salaryRange}`);
  console.log(`   תגיות (${position.tags.length}): ${position.tags.map(t => t.name).join(', ')}`);

  // 4. ספור סה"כ משרות פעילות
  const totalActive = await prisma.position.count({ where: { active: true } });
  const totalAll = await prisma.position.count();
  console.log(`\n📊 סה"כ משרות פעילות: ${totalActive} מתוך ${totalAll}`);

  // 5. רשימת כל המעסיקים + כמה משרות פעילות לכל אחד
  const employers = await prisma.employer.findMany({
    include: {
      _count: { select: { positions: true } },
      positions: { where: { active: true }, select: { id: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\n📋 רשימת מעסיקים:');
  for (const emp of employers) {
    const activeCount = emp.positions.length;
    if (activeCount > 0) {
      console.log(`   ${emp.name}: ${activeCount} פעילות (${emp._count.positions} סה"כ)`);
    }
  }

  console.log('\n✅ סיום!');
}

main()
  .catch(e => {
    console.error('❌ שגיאה:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
