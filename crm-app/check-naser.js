const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // מחפש את המועמד נסר - כל הדרכים
    console.log('מחפש מועמד...');
    
    const candidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { name: { contains: 'נסר' } },
          { name: { contains: 'סואעד' } },
          { email: { contains: 'swaed' } },
          { phone: { contains: '0586336399' } },
          { phone: { contains: '586336399' } }
        ]
      }
    });
    
    if (candidates.length > 0) {
      console.log('\n=== מצאתי מועמדים ===');
      for (const c of candidates) {
        console.log('ID:', c.id);
        console.log('שם:', c.name);
        console.log('עיר:', c.city || '*** אין עיר! ***');
        console.log('טלפון:', c.phone);
        console.log('---');
      }
    } else {
      console.log('\n*** לא מצאתי את המועמד נסר סואעד במערכת! ***');
    }
    
    // מחפש את משרת טלימאן
    const teliman = await prisma.position.findFirst({
      where: {
        OR: [
          { title: { contains: 'טלימאן' } },
          { title: { contains: 'טלמן' } }
        ]
      },
      include: { tags: true }
    });
    
    if (teliman) {
      console.log('\n=== משרת טלימאן ===');
      console.log('כותרת:', teliman.title);
      console.log('מיקום:', teliman.location);
      console.log('פעילה:', teliman.active);
      console.log('תגיות:', teliman.tags.map(t => t.name).join(', ') || 'אין תגיות');
    }
    
  } catch (e) {
    console.error('שגיאה:', e.message);
  }
  await prisma.$disconnect();
}

check();
