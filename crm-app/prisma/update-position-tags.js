const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * עדכון keywords למשרות רכב - תוספת תגיות מכירות בעברית
 * שדה tags הוא relation לטבלה נפרדת, לכן משתמשים ב-keywords שזה JSON string
 */
async function main() {
  console.log('🚗 מעדכן keywords למשרות רכב...\n');
  
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
  const salesKeywords = [
    'מכירות', 'איש מכירות', 'אשת מכירות', 'נציג מכירות', 'סוכן מכירות',
    'מכירות פרונטליות', 'יעדים', 'עמלות', 'בונוסים', 'סגירת עסקאות',
    'משא ומתן', 'שכנוע', 'יחסי לקוחות', 'שירות לקוחות', 'ניסיון במכירות',
    'יכולת מכירה', 'דרייב מכירות', 'מכירן', 'מכירנית'
  ];
  
  // תגיות רכב בעברית
  const automotiveKeywords = [
    'רכב', 'עולם הרכב', 'אולם תצוגה', 'סוכנות רכב',
    'טרייד אין', 'מימון רכב', 'ליסינג', 'נסיעת מבחן', 'מסירת רכב'
  ];
  
  let updated = 0;
  
  for (const position of automotivePositions) {
    try {
      // מפענחים את ה-keywords הקיימים
      let currentKeywords = [];
      try {
        currentKeywords = position.keywords ? JSON.parse(position.keywords) : [];
      } catch {
        currentKeywords = [];
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
      
      // מוסיפים keywords מתאימים
      const newKeywords = new Set(currentKeywords);
      
      // keywords רכב לכולם
      automotiveKeywords.forEach(kw => newKeywords.add(kw));
      
      if (isSales || isManagement) {
        // keywords מכירה
        salesKeywords.forEach(kw => newKeywords.add(kw));
      }
      
      if (isReception) {
        newKeywords.add('קבלת לקוחות');
        newKeywords.add('שירות לקוחות');
        newKeywords.add('ייצוגיות');
        newKeywords.add('יחסי ציבור');
      }
      
      // מוסיפים את המותג הרלוונטי
      const titleLower = position.title.toLowerCase();
      const employerName = position.employer?.name || '';
      
      if (titleLower.includes('geely') || titleLower.includes("ג'ילי") || employerName.includes('UNION')) {
        newKeywords.add('GEELY');
        newKeywords.add("ג'ילי");
        newKeywords.add('יוניון');
      }
      if (titleLower.includes('לקסוס') || titleLower.includes('lexus')) {
        newKeywords.add('לקסוס');
        newKeywords.add('פרימיום');
      }
      if (titleLower.includes('טויוטה') || titleLower.includes('toyota')) {
        newKeywords.add('טויוטה');
      }
      if (titleLower.includes('gac') || employerName.includes('GAC')) {
        newKeywords.add('GAC');
        newKeywords.add('גאק');
      }
      
      // עדכון keywords
      await prisma.position.update({
        where: { id: position.id },
        data: { keywords: JSON.stringify([...newKeywords]) }
      });
      
      console.log(`✅ ${position.employer?.name || 'לא ידוע'} | ${position.title} | ${newKeywords.size} keywords`);
      updated++;
      
    } catch (error) {
      console.error(`❌ שגיאה: ${position.title}`, error.message);
    }
  }
  
  console.log(`\n🎉 עודכנו ${updated} משרות עם keywords מכירות בעברית!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
