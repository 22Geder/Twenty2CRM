const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
const EMPLOYER_ID = '1258f7dc-b8af-406e-96ce-44e2557ba4a1';
const EXTRA = [
  'סלע לוגיסטיקה','לוגיסטיקה','מרכז לוגיסטי','מחסן','תפעול','משרה מלאה',
  'עבודה פיזית','אחריות','ניסיון','שעתי','ראש גדול','גמישות','דיוק','סדר וארגון',
  'עמידה בלחץ','מקצועיות','יוזמה','עצמאות','יחסי אנוש','עמידה בזמנים',
  'ארוחות','תנאים סוציאליים','שינוע','מלאי','אשדוד','בית שמש','בני דרום',
  'עבודה','תפקיד','שעות עבודה','עמידה','נסיעות','ניקיון','תחזוקה','בדיקה',
  'פריטים','הגעה','זמינות','שכר','כישורים','שטח','ציוד','מגרש','זמינות מיידית',
  'ישראל','הכנה','עיסוק','כוח אדם','מאומץ','מהיר','ממוקד','בטיחות','ניהול'
];
async function main() {
  const all = await prisma.position.findMany({ where: { employerId: EMPLOYER_ID }, select: { id: true, title: true, keywords: true } });
  const low = all.filter(x => !x.keywords || JSON.parse(x.keywords).length < 50);
  let fixed = 0;
  for (const pos of low) {
    let arr = pos.keywords ? JSON.parse(pos.keywords) : [];
    const more = EXTRA.filter(w => !arr.includes(w)).slice(0, 50 - arr.length);
    arr = [...new Set([...arr, ...more])].slice(0, 55);
    await prisma.position.update({ where: { id: pos.id }, data: { keywords: JSON.stringify(arr) } });
    console.log(`✅ ${pos.title} → ${arr.length} kw`);
    fixed++;
  }
  if (fixed === 0) console.log('✅ כולן כבר עם 50+');
  else console.log(`🎉 תוקנו ${fixed} משרות`);
}
main().catch(e => console.error('💥', e.message)).finally(() => prisma.$disconnect());
