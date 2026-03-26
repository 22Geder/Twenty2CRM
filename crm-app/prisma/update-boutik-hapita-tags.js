const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── תגיות לאופים (25) ────────────────────────────────────────────
const BAKER_TAGS = [
  { name: 'אופה', color: '#FF8C00', category: 'מקצוע' },
  { name: 'אפייה', color: '#FF8C00', category: 'מקצוע' },
  { name: 'אפייה מקצועית', color: '#FF8C00', category: 'מקצוע' },
  { name: 'אפייה תעשייתית', color: '#FF8C00', category: 'מקצוע' },
  { name: 'הכנת בצק', color: '#D2691E', category: 'כישור' },
  { name: 'תנור תעשייתי', color: '#D2691E', category: 'כישור' },
  { name: 'עבודה עם שמרים', color: '#D2691E', category: 'כישור' },
  { name: 'לחם', color: '#F4A460', category: 'מוצר' },
  { name: 'פיתות', color: '#F4A460', category: 'מוצר' },
  { name: 'מאפים', color: '#F4A460', category: 'מוצר' },
  { name: 'בורקס', color: '#F4A460', category: 'מוצר' },
  { name: 'חלות', color: '#F4A460', category: 'מוצר' },
  { name: 'קונדיטוריה', color: '#9C27B0', category: 'מקצוע' },
  { name: 'תעשיית מזון', color: '#7CB342', category: 'תחום' },
  { name: 'ייצור מזון', color: '#7CB342', category: 'תחום' },
  { name: 'היגיינה ומזון', color: '#7CB342', category: 'תחום' },
  { name: 'כשרות', color: '#7CB342', category: 'תחום' },
  { name: 'משמרת בוקר', color: '#2196F3', category: 'משמרת' },
  { name: 'משמרת לילה', color: '#2196F3', category: 'משמרת' },
  { name: 'עבודה בשעות מוקדמות', color: '#2196F3', category: 'משמרת' },
  { name: 'עבודה בעמידה', color: '#607D8B', category: 'תנאי עבודה' },
  { name: 'עבודה בצוות', color: '#607D8B', category: 'תנאי עבודה' },
  { name: 'קו ייצור', color: '#607D8B', category: 'תנאי עבודה' },
  { name: 'ניסיון בבתי מאפה', color: '#FF5722', category: 'ניסיון' },
  { name: 'בוטיק הפיתה', color: '#00A8A8', category: 'מעסיק' },
];

// ── תגיות לקופאים (25) ───────────────────────────────────────────
const CASHIER_TAGS = [
  { name: 'קופאי', color: '#2196F3', category: 'מקצוע' },
  { name: 'קופאית', color: '#2196F3', category: 'מקצוע' },
  { name: 'עבודה בקופה', color: '#2196F3', category: 'מקצוע' },
  { name: 'קופה ממוחשבת', color: '#1976D2', category: 'כישור' },
  { name: 'קופה רושמת', color: '#1976D2', category: 'כישור' },
  { name: 'סגירת קופה', color: '#1976D2', category: 'כישור' },
  { name: 'ספירת כסף', color: '#1976D2', category: 'כישור' },
  { name: 'קבלת תשלומים', color: '#1976D2', category: 'כישור' },
  { name: 'קמעונאות', color: '#7CB342', category: 'תחום' },
  { name: 'רשת מזון', color: '#7CB342', category: 'תחום' },
  { name: 'שירות לקוחות', color: '#00A8A8', category: 'כישור' },
  { name: 'שירותיות', color: '#00A8A8', category: 'אופי' },
  { name: 'חיוך ואדיבות', color: '#00A8A8', category: 'אופי' },
  { name: 'יחסי אנוש', color: '#00A8A8', category: 'אופי' },
  { name: 'יושרה', color: '#FF5722', category: 'אופי' },
  { name: 'אמינות', color: '#FF5722', category: 'אופי' },
  { name: 'דיוק', color: '#FF5722', category: 'אופי' },
  { name: 'עבודה תחת לחץ', color: '#607D8B', category: 'תנאי עבודה' },
  { name: 'גמישות בשעות', color: '#607D8B', category: 'תנאי עבודה' },
  { name: 'עבודה בסופ"ש', color: '#607D8B', category: 'תנאי עבודה' },
  { name: 'חישוב מהיר', color: '#9C27B0', category: 'כישור' },
  { name: 'מיומנות מחשב', color: '#9C27B0', category: 'כישור' },
  { name: 'ניסיון בקופה', color: '#FF8C00', category: 'ניסיון' },
  { name: 'ניסיון בקמעונאות', color: '#FF8C00', category: 'ניסיון' },
  { name: 'בוטיק הפיתה', color: '#00A8A8', category: 'מעסיק' },
];

// ── תגיות למנהלת חשבונות (25) ────────────────────────────────────
const ACCOUNTANT_TAGS = [
  { name: 'מנהלת חשבונות', color: '#00A8A8', category: 'מקצוע' },
  { name: 'הנהלת חשבונות', color: '#00A8A8', category: 'מקצוע' },
  { name: 'הנח"ש', color: '#00A8A8', category: 'מקצוע' },
  { name: 'הנהלת חשבונות סוג 2', color: '#00ACC1', category: 'הסמכה' },
  { name: 'הנהלת חשבונות סוג 3', color: '#00ACC1', category: 'הסמכה' },
  { name: 'רואה חשבון', color: '#00ACC1', category: 'הסמכה' },
  { name: 'הכנת דוחות', color: '#1976D2', category: 'כישור' },
  { name: 'דוחות כספיים', color: '#1976D2', category: 'כישור' },
  { name: 'מאזן', color: '#1976D2', category: 'כישור' },
  { name: 'ניהול ספרים', color: '#1976D2', category: 'כישור' },
  { name: 'חשבוניות', color: '#1976D2', category: 'כישור' },
  { name: 'תשלומים וגבייה', color: '#1976D2', category: 'כישור' },
  { name: 'מע"מ', color: '#7CB342', category: 'נושא מקצועי' },
  { name: 'מס הכנסה', color: '#7CB342', category: 'נושא מקצועי' },
  { name: 'ביטוח לאומי', color: '#7CB342', category: 'נושא מקצועי' },
  { name: 'שכר ותשלומים', color: '#7CB342', category: 'נושא מקצועי' },
  { name: 'תוכנת פריורטי', color: '#9C27B0', category: 'תוכנה' },
  { name: 'תוכנת חשבשבת', color: '#9C27B0', category: 'תוכנה' },
  { name: 'Excel מתקדם', color: '#9C27B0', category: 'תוכנה' },
  { name: 'ERP', color: '#9C27B0', category: 'תוכנה' },
  { name: 'ניסיון בהנח"ש', color: '#FF8C00', category: 'ניסיון' },
  { name: 'ניסיון בחברות מזון', color: '#FF8C00', category: 'ניסיון' },
  { name: 'דיוק ודקדקנות', color: '#FF5722', category: 'אופי' },
  { name: 'סודיות ואמינות', color: '#FF5722', category: 'אופי' },
  { name: 'בוטיק הפיתה', color: '#00A8A8', category: 'מעסיק' },
];

// ── Keywords למנהלת חשבונות ───────────────────────────────────────
const ACCOUNTANT_KEYWORDS = [
  'מנהלת חשבונות', 'הנהלת חשבונות', 'הנח"ש', 'ניהול ספרים',
  'חשבוניות', 'תשלומים', 'גבייה', 'מאזן', 'דוחות כספיים',
  'מע"מ', 'מס הכנסה', 'ביטוח לאומי', 'שכר', 'פריורטי', 'חשבשבת',
  'Excel', 'ERP', 'דיוק', 'אמינות', 'סודיות',
  'הנהלת חשבונות סוג 2', 'הנהלת חשבונות סוג 3', 'רואה חשבון',
  'ניסיון בהנח"ש', 'ניסיון בחברות מזון',
];

async function upsertTags(tagDefs) {
  const tagIds = [];
  for (const t of tagDefs) {
    const tag = await prisma.tag.upsert({
      where: { name: t.name },
      update: { color: t.color, category: t.category, type: 'SKILL' },
      create: { name: t.name, color: t.color, category: t.category, type: 'SKILL' },
    });
    tagIds.push({ id: tag.id });
  }
  return tagIds;
}

async function connectTagsToPosition(positionId, tagIdObjects) {
  await prisma.position.update({
    where: { id: positionId },
    data: {
      tags: {
        connect: tagIdObjects,
      },
    },
  });
}

async function main() {
  console.log('🥙 מעדכן תגיות לבוטיק הפיתה...\n');

  // ─── מצא את המעסיק ────────────────────────────────────────────
  const employer = await prisma.employer.findUnique({
    where: { email: 'hr@boutik-hapita.co.il' },
  });

  if (!employer) {
    console.error('❌ לא נמצא מעסיק בוטיק הפיתה! הרץ קודם seed-boutik-hapita.js');
    process.exit(1);
  }
  console.log(`✅ מעסיק: ${employer.name}`);

  // ─── תגיות אופים ──────────────────────────────────────────────
  console.log('\n📌 יוצר 25 תגיות לאופים...');
  const bakerTagIds = await upsertTags(BAKER_TAGS);

  const bakerPositions = await prisma.position.findMany({
    where: {
      employerId: employer.id,
      OR: [
        { title: { contains: 'אופ' } },
        { title: { contains: 'אפיי' } },
      ],
    },
  });

  console.log(`   נמצאו ${bakerPositions.length} משרות אופים`);
  for (const pos of bakerPositions) {
    await connectTagsToPosition(pos.id, bakerTagIds);
    console.log(`   ✅ עודכן: ${pos.title}`);
  }

  // ─── תגיות קופאים ─────────────────────────────────────────────
  console.log('\n📌 יוצר 25 תגיות לקופאים...');
  const cashierTagIds = await upsertTags(CASHIER_TAGS);

  const cashierPositions = await prisma.position.findMany({
    where: {
      employerId: employer.id,
      OR: [
        { title: { contains: 'קופ' } },
        { title: { contains: 'cashier' } },
      ],
    },
  });

  console.log(`   נמצאו ${cashierPositions.length} משרות קופאים`);
  for (const pos of cashierPositions) {
    await connectTagsToPosition(pos.id, cashierTagIds);
    console.log(`   ✅ עודכן: ${pos.title}`);
  }

  // ─── מנהלת חשבונות - צור משרה + תגיות ───────────────────────
  console.log('\n📌 יוצר משרת מנהלת חשבונות...');

  const accountantPosition = await prisma.position.create({
    data: {
      title: 'מנהלת חשבונות - בוטיק הפיתה',
      description: `💼 דרוש/ה מנהל/ת חשבונות לרשת "בוטיק הפיתה"

📋 תיאור התפקיד:
• ניהול ספרים שוטף של הרשת
• עריכת חשבוניות, זיכויים ומסמכי הנהלת חשבונות
• ניהול חשבונות ספקים ולקוחות
• הכנת דוחות מע"מ ותשלום לרשויות
• סיוע בהכנת דוחות שנתיים
• עבודה מול רואה חשבון חיצוני

✨ דרישות:
• הנהלת חשבונות סוג 2 לפחות – חובה
• ניסיון מוכח בהנהלת חשבונות – חובה
• שליטה בתוכנת פריורטי / חשבשבת – יתרון
• Excel ברמה טובה
• דייקנות, אמינות וסודיות מוחלטת
• יכולת עבודה עצמאית ובצוות

💰 שכר: לפי ניסיון`,
      requirements: 'הנהלת חשבונות סוג 2 לפחות – חובה, ניסיון מוכח, פריורטי/חשבשבת – יתרון',
      location: 'מרכז',
      keywords: JSON.stringify(ACCOUNTANT_KEYWORDS),
      salaryRange: 'לפי ניסיון',
      employmentType: 'משרה מלאה',
      employerId: employer.id,
      active: true,
      contactName: 'מנהל/ת משאבי אנוש',
      benefits: 'ארוחת צהריים, חניה, תנאים סוציאליים מלאים',
    },
  });
  console.log(`   ✅ משרה נוצרה: ${accountantPosition.title}`);

  console.log('\n📌 יוצר 25 תגיות למנהלת חשבונות...');
  const accountantTagIds = await upsertTags(ACCOUNTANT_TAGS);
  await connectTagsToPosition(accountantPosition.id, accountantTagIds);
  console.log('   ✅ תגיות חוברו למשרת מנהלת חשבונות');

  // ─── סיכום ────────────────────────────────────────────────────
  console.log('\n🎉 סיום! סיכום:');
  console.log(`   • ${bakerPositions.length} משרות אופים עודכנו עם 25 תגיות`);
  console.log(`   • ${cashierPositions.length} משרות קופאים עודכנו עם 25 תגיות`);
  console.log('   • משרת מנהלת חשבונות חדשה נוצרה עם 25 תגיות');
}

main()
  .catch((e) => {
    console.error('❌ שגיאה:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
