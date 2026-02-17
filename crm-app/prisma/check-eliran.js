const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // חיפוש אלירן
  const candidate = await prisma.candidate.findFirst({
    where: { name: { contains: 'אלירן' } }
  });
  
  if (candidate) {
    console.log('=== פרטי המועמד ===');
    console.log('שם:', candidate.name);
    console.log('עיר:', candidate.city);
    console.log('כישורים:', candidate.skills);
    console.log('ציון:', candidate.score);
    console.log('תפקיד נוכחי:', candidate.currentTitle);
    console.log('חברה נוכחית:', candidate.currentCompany);
    console.log('הערות:', candidate.notes?.substring(0, 500));
    console.log('');
    
    // חיפוש משרות רכב
    console.log('=== משרות רכב פעילות ===');
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
      // פענוח keywords 
      let keywords = [];
      try {
        keywords = pos.keywords ? JSON.parse(pos.keywords) : [];
      } catch { }
      
      const hasSales = keywords.some(k => 
        k.includes('מכירות') || k.includes('מכירן') || k.includes('סוכן מכירות')
      );
      const hasCarSales = keywords.some(k => 
        k.includes('מכירות רכב') || k.includes('איש מכירות רכב')
      );
      
      console.log(`${pos.employer?.name} | ${pos.title}`);
      console.log(`   📍 ${pos.location} | יש מכירות: ${hasSales} | מכירות רכב: ${hasCarSales}`);
      console.log(`   🏷️ ${keywords.length} תגיות: ${keywords.slice(0, 8).join(', ')}...`);
      console.log('');
    }
  } else {
    console.log('מועמד לא נמצא');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
