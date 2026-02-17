const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // חיפוש כל האלירנים
  console.log('=== כל המועמדים בשם אלירן ===');
  const allElirans = await prisma.candidate.findMany({
    where: { name: { contains: 'אלירן' } }
  });
  
  for (const c of allElirans) {
    console.log(`ID: ${c.id}`);
    console.log(`שם: ${c.name}`);
    console.log(`תפקיד: ${c.currentTitle || 'לא צוין'}`);
    console.log(`כישורים: ${c.skills || 'לא צוין'}`);
    console.log(`הערות: ${c.notes?.substring(0, 300) || 'אין'}`);
    console.log('---');
  }
  
  // חיפוש גם אברהם
  console.log('\n=== מועמדים בשם אברהם ===');
  const abrahams = await prisma.candidate.findMany({
    where: { name: { contains: 'אברהם' } }
  });
  
  for (const c of abrahams) {
    console.log(`ID: ${c.id}`);
    console.log(`שם: ${c.name}`);
    console.log(`תפקיד: ${c.currentTitle || 'לא צוין'}`);
    console.log(`כישורים: ${c.skills || 'לא צוין'}`);
    console.log(`הערות: ${c.notes?.substring(0, 300) || 'אין'}`);
    console.log('---');
  }
  
  // חיפוש משרות רכב
  console.log('\n=== משרות מכירות רכב פעילות ===');
  const carPositions = await prisma.position.findMany({
    where: {
      active: true,
      OR: [
        { title: { contains: 'מכירות' } },
        { title: { contains: 'רכב' } },
        { employer: { name: { contains: 'UNION' } } },
        { employer: { name: { contains: 'GAC' } } },
        { employer: { name: { contains: 'אופרייט' } } },
      ]
    },
    include: { employer: true }
  });
  
  for (const pos of carPositions) {
    let keywords = [];
    try {
      keywords = pos.keywords ? JSON.parse(pos.keywords) : [];
    } catch { }
    
    const hasSales = keywords.some(k => 
      k.includes('מכירות') || k.includes('מכירן') || k.includes('סוכן מכירות')
    );
    
    console.log(`${pos.employer?.name} | ${pos.title}`);
    console.log(`   📍 ${pos.location} | מכירות: ${hasSales ? '✅' : '❌'}`);
    console.log(`   🏷️ ${keywords.length} תגיות`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
