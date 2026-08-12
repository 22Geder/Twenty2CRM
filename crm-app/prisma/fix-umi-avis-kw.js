const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
const EMPLOYER_ID = '8397497e-1495-403e-ac79-843193d6e593';
const EXTRA = ['UMI AVIS','משרה מלאה','שעות נוספות','עובד חברה','תנאים סוציאליים','ביטוח בריאות','קידום','אחריות','מקצועיות','גמישות','שירות לקוחות','יחסי אנוש','ניסיון','דייקנות','ריבוי משימות','עצמאות','ממוחשב','יוזמה','סדר וארגון','ראש גדול'];
async function main() {
  const all = await prisma.position.findMany({ where: { employerId: EMPLOYER_ID }, select: { id: true, title: true, keywords: true } });
  const low = all.filter(x => !x.keywords || JSON.parse(x.keywords).length < 50);
  let fixed = 0;
  for (const pos of low) {
    let arr = pos.keywords ? JSON.parse(pos.keywords) : [];
    const more = EXTRA.filter(w => !arr.includes(w)).slice(0, 50 - arr.length);
    arr = [...new Set([...arr, ...more])].slice(0, 55);
    await prisma.position.update({ where: { id: pos.id }, data: { keywords: JSON.stringify(arr) } });
    console.log(`✅ תוקן: ${pos.title} → ${arr.length} kw`);
    fixed++;
  }
  if (fixed === 0) console.log('✅ כל המשרות כבר עם 50+');
  else console.log(`🎉 תוקנו ${fixed} משרות`);
}
main().catch(e => console.error('💥', e.message)).finally(() => prisma.$disconnect());
