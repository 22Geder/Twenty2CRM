const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * עדכון תגיות (tags) למשרות רכב - תוספת תגיות מכירות בעברית
 */
async function main() {
  console.log('🚗 מעדכן תגיות מכירות למשרות רכב...\n');
  
  // משרות רכב שצריכות תגיות מכירות
  const automotivePositions = await prisma.position.findMany({
    where: {
      OR: [
        { title: { contains: 'מכירות' } },
        { title: { contains: 'יועץ' } },
        { title: { contains: 'GEELY' } },
        { title: { contains: 'טויוטה' } },
        { title: { contains: 'GAC' } },
        { title: { contains: 'לקסוס' } },
        { title: { contains: 'יוניון' } },
        { title: { contains: 'UNION' } },
        { title: { contains: 'אולם' } },
        { title: { contains: 'יד ראשונה' } },
        { title: { contains: 'ליסינג' } },
        { title: { contains: 'קבלה' } },
        { title: { contains: 'דייל' } },
        { title: { contains: 'התרשמות' } },
        { title: { contains: 'נסיעות' } },
        { employer: { name: { contains: 'UNION' } } },
        { employer: { name: { contains: 'GAC' } } },
        { employer: { name: { contains: 'אופרייט' } } },
        { employer: { name: { contains: 'יד ראשונה' } } },
      ]
    },
    include: { employer: true }
  });
  
  console.log(`📦 נמצאו ${automotivePositions.length} משרות רכב\n`);
  
  // תגיות מכירה בעברית
  const salesTags = [
    'מכירות', 'איש מכירות', 'אשת מכירות', 'נציג מכירות', 'סוכן מכירות',
    'מכירות פרונטליות', 'יעדים', 'עמלות', 'בונוסים', 'סגירת עסקאות',
    'משא ומתן', 'שכנוע', 'יחסי לקוחות', 'שירות לקוחות'
  ];
  
  // תגיות רכב בעברית
  const automotiveTags = [
    'רכב', 'עולם הרכב', 'אולם תצוגה', 'סוכנות רכב',
    'טרייד אין', 'מימון רכב', 'ליסינג', 'נסיעת מבחן', 'מסירת רכב'
  ];
  
  let updated = 0;
  
  for (const position of automotivePositions) {
    try {
      // מפענחים את התגיות הקיימות
      let currentTags = [];
      try {
        currentTags = position.tags ? JSON.parse(position.tags) : [];
      } catch {
        currentTags = [];
      }
      
      // בודקים אם זו משרת מכירות
      const isSales = position.title.includes('מכירות') || 
                      position.title.includes('יועץ') ||
                      position.title.includes('איש') ||
                      position.title.includes('אשת') ||
                      position.title.includes('נציג');
      
      // בודקים אם זו משרת קבלה/התרשמות
      const isReception = position.title.includes('קבלה') || 
                          position.title.includes('דייל') ||
                          position.title.includes('התרשמות');
      
      // בודקים אם זו משרה ניהולית
      const isManagement = position.title.includes('מנהל');
      
      // מוסיפים תגיות מתאימות
      const newTags = new Set(currentTags);
      
      // תגיות רכב לכולם
      automotiveTags.forEach(tag => newTags.add(tag));
      
      if (isSales || isManagement) {
        // תגיות מכירה
        salesTags.forEach(tag => newTags.add(tag));
        newTags.add('ניסיון במכירות');
        newTags.add('יכולת מכירה');
        newTags.add('דרייב מכירות');
      }
      
      if (isReception) {
        newTags.add('קבלת לקוחות');
        newTags.add('שירות לקוחות');
        newTags.add('ייצוגיות');
        newTags.add('יחסי ציבור');
      }
      
      // מוסיפים את המותג הרלוונטי
      const titleLower = position.title.toLowerCase();
      const employerName = position.employer?.name || '';
      
      if (titleLower.includes('geely') || titleLower.includes("ג'ילי") || employerName.includes('UNION')) {
        newTags.add('GEELY');
        newTags.add("ג'ילי");
        newTags.add('יוניון');
      }
      if (titleLower.includes('לקסוס') || titleLower.includes('lexus')) {
        newTags.add('לקסוס');
        newTags.add('פרימיום');
      }
      if (titleLower.includes('טויוטה') || titleLower.includes('toyota')) {
        newTags.add('טויוטה');
      }
      if (titleLower.includes('gac') || employerName.includes('GAC')) {
        newTags.add('GAC');
        newTags.add('גאק');
      }
      
      // עדכון
      await prisma.position.update({
        where: { id: position.id },
        data: { tags: JSON.stringify([...newTags]) }
      });
      
      console.log(`✅ ${position.employer?.name || 'לא ידוע'} | ${position.title} | ${newTags.size} תגיות`);
      updated++;
      
    } catch (error) {
      console.error(`❌ שגיאה: ${position.title}`, error.message);
    }
  }
  
  console.log(`\n🎉 עודכנו ${updated} משרות עם תגיות מכירות בעברית!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
