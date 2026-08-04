const { PrismaClient } = require('@prisma/client');
const DB_URL = 'postgresql://postgres:miCCfmqEmdjjdNPFdExCXbIiiYbjVJRv@yamabiko.proxy.rlwy.net:17606/railway';
const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

function kw(...words) {
  return JSON.stringify([...new Set(words)].slice(0, 60));
}

async function getOrCreateTag(name) {
  let tag = await prisma.tag.findFirst({ where: { name } });
  if (!tag) tag = await prisma.tag.create({ data: { name, type: 'POSITION', color: '#b45309' } });
  return tag;
}

async function getOrCreateEmployer(name) {
  let emp = await prisma.employer.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } });
  if (!emp) {
    emp = await prisma.employer.create({
      data: { name, email: `jobs+${Date.now()}@${name.replace(/[^a-z]/gi,'').toLowerCase()}.co.il`, description: 'הובלות ולוגיסטיקה' }
    });
    console.log(`✅ נוצר מעסיק: ${emp.name} (${emp.id})`);
  } else {
    console.log(`📋 מעסיק קיים: ${emp.name} (${emp.id})`);
  }
  return emp;
}

const BASE_DRIVER = [
  'נהג','נהגת','נהג משאית','נהיגה מקצועית','נהיגה מסחרית',
  'רישיון נהיגה','הובלה','שינוע','לוגיסטיקה','חלוקת סחורה',
  'קו חלוקה','אשדוד','דרום','עמידה בזמנים','ניסיון בנהיגה'
];

const POSITIONS = [
  // ===== שרביט – 12 טון ומעלה =====
  {
    employerKey: 'שרביט',
    title: 'נהג/ת משאית 12 טון ומעלה – שרביט אשדוד',
    location: 'אשדוד',
    salaryRange: 'לפי ניסיון',
    workHours: 'משרה מלאה',
    description: `לחברת שרביט באשדוד דרוש/ה נהג/ת משאית 12 טון ומעלה.
- חלוקת סחורה / הובלות בקווים
- עבודה יציבה בחברה מסודרת`,
    requirements: `- רישיון 12 טון (ג') ומעלה – חובה
- ניסיון בנהיגה על משאית – חובה
- אחריות ואמינות`,
    keywords: kw(
      ...BASE_DRIVER,
      'שרביט','12 טון','רישיון ג','רישיון 12 טון','משאית 12 טון',
      'נהג 12 טון','נהגת 12 טון','ג פלוס','ג+',
      'חלוקה','קו חלוקה','הובלה','שינוע סחורה','משלוחים',
      'משרה מלאה','אשדוד','דרום','עמידה בזמנים','אמינות',
      'אחריות','רישיון בתוקף','ניסיון חלוקה','נהיגה בטוחה',
      'משאיות','הובלות','מרכב','גרור','טריילר',
      'ד טון','15 טון','18 טון','נהיגה ארוכה','נהיגה עירונית',
      'תחנה מרכזית','רישיון מקצועי','יכולת ניווט','GPS'
    )
  },

  // ===== אביב צבאן – 15 טון =====
  {
    employerKey: 'אביב צבאן',
    title: 'נהג/ת משאית 15 טון – אביב צבאן אשדוד',
    location: 'אשדוד',
    salaryRange: 'לפי ניסיון',
    workHours: 'משרה מלאה',
    description: `לחברת אביב צבאן באשדוד דרוש/ה נהג/ת משאית 15 טון.
- הובלות / חלוקת סחורה
- עבודה יציבה בחברה מסודרת`,
    requirements: `- רישיון 15 טון ומעלה – חובה
- ניסיון בנהיגה על משאית – חובה
- אחריות ואמינות`,
    keywords: kw(
      ...BASE_DRIVER,
      'אביב צבאן','צבאן','15 טון','רישיון 15 טון','משאית 15 טון',
      'נהג 15 טון','נהגת 15 טון','ד','רישיון ד',
      'חלוקה','קו חלוקה','הובלה','שינוע סחורה','משלוחים',
      'משרה מלאה','אשדוד','דרום','עמידה בזמנים','אמינות',
      'אחריות','רישיון בתוקף','ניסיון חלוקה','נהיגה בטוחה',
      'משאיות','הובלות','12 טון','18 טון','גרור','טריילר',
      'נהיגה ארוכה','נהיגה עירונית','ניווט','GPS','רישיון מקצועי',
      'ד פלוס','ד+','יכולת ניווט','רישיון ג'
    )
  }
];

async function main() {
  console.log('🚛 יצירת לקוחות חדשים – נהגי משאיות אשדוד\n');

  // ניקוי ריצה קודמת חלקית
  const sharv = await prisma.employer.findFirst({ where: { name: 'שרביט' } });
  if (sharv) {
    await prisma.position.deleteMany({ where: { employerId: sharv.id } });
    await prisma.employer.delete({ where: { id: sharv.id } });
    console.log('🧹 נוקה שרביט ישן');
  }

  // תגיות נהיגה
  const tagDriver = await getOrCreateTag('נהג משאית');
  const tag12 = await getOrCreateTag('רישיון 12 טון');
  const tag15 = await getOrCreateTag('רישיון 15 טון');
  const tagLic = await getOrCreateTag('רישיון מסחרי');
  const tagAshdod = await getOrCreateTag('אשדוד');

  let totalCreated = 0;

  for (const pos of POSITIONS) {
    const employer = await getOrCreateEmployer(pos.employerKey);
    const kwArr = JSON.parse(pos.keywords);

    const tagsToConnect = [tagDriver.id, tagLic.id, tagAshdod.id];
    if (pos.title.includes('12 טון')) tagsToConnect.push(tag12.id);
    if (pos.title.includes('15 טון')) tagsToConnect.push(tag15.id);

    await prisma.position.create({
      data: {
        title: pos.title,
        description: pos.description,
        requirements: pos.requirements,
        location: pos.location,
        salaryRange: pos.salaryRange,
        workHours: pos.workHours,
        employmentType: 'Full-time',
        keywords: pos.keywords,
        active: true,
        priority: 0,
        openings: 1,
        employerId: employer.id,
        tags: { connect: tagsToConnect.map(id => ({ id })) }
      }
    });
    console.log(`✅ kw=${kwArr.length} | ${pos.title}`);
    console.log(`   📍 ${pos.location} | 🏷️ תגיות: ${tagsToConnect.length}`);
    totalCreated++;
  }

  console.log(`\n🎉 הושלם! נוצרו ${totalCreated} משרות ו-2 מעסיקים חדשים`);
  console.log('\n📋 תגיות שנוצרו/נמצאו:');
  console.log('  🏷️ נהג משאית | רישיון 12 טון | רישיון 15 טון | רישיון מסחרי | אשדוד');
}

main()
  .catch(e => { console.error('💥', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
