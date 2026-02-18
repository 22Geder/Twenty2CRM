const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// מיפוי קודי משרות לפי מרחבים
const JOB_CODES = {
  'מרכז': 'JB-107',
  'דן': 'JB-110',
  'יהודה': 'JB-109',
  'LIVE': 'JB-4100',
  'live': 'JB-4100',
};

// ערים לפי מרחבים
const AREA_MAPPING = {
  // מרחב מרכז
  'תל אביב': 'מרכז',
  'רמת גן': 'מרכז',
  'גבעתיים': 'מרכז',
  'בני ברק': 'מרכז',
  'פתח תקווה': 'מרכז',
  'ראש העין': 'מרכז',
  'כפר סבא': 'מרכז',
  'הרצליה': 'מרכז',
  'רעננה': 'מרכז',
  'נתניה': 'מרכז',
  'הוד השרון': 'מרכז',
  'רמת השרון': 'מרכז',
  
  // מרחב דן
  'חולון': 'דן',
  'בת ים': 'דן',
  'ראשון לציון': 'דן',
  'רחובות': 'דן',
  'נס ציונה': 'דן',
  'יבנה': 'דן',
  'אשדוד': 'דן',
  'לוד': 'דן',
  'רמלה': 'דן',
  
  // מרחב יהודה
  'ירושלים': 'יהודה',
  'מעלה אדומים': 'יהודה',
  'בית שמש': 'יהודה',
  'מודיעין': 'יהודה',
  'גוש עציון': 'יהודה',
  'אריאל': 'יהודה',
};

function detectArea(title, location, description) {
  const textToSearch = `${title || ''} ${location || ''} ${description || ''}`.toLowerCase();
  
  // בדיקה ישירה למרחב LIVE
  if (textToSearch.includes('live') || textToSearch.includes('לייב')) {
    return 'LIVE';
  }
  
  // בדיקה ישירה למרחב
  if (textToSearch.includes('מרחב מרכז') || textToSearch.includes('מרחב תל אביב')) {
    return 'מרכז';
  }
  if (textToSearch.includes('מרחב דן')) {
    return 'דן';
  }
  if (textToSearch.includes('מרחב יהודה')) {
    return 'יהודה';
  }
  
  // בדיקה לפי עיר
  for (const [city, area] of Object.entries(AREA_MAPPING)) {
    if (textToSearch.includes(city.toLowerCase())) {
      return area;
    }
  }
  
  // ברירת מחדל - מרכז (רוב המשרות)
  return 'מרכז';
}

async function addJobCodesToMizrahi() {
  console.log('🏦 מוסיף קודי משרות למשרות בנק מזרחי...\n');
  
  // מציאת מעסיק בנק מזרחי
  const mizrahi = await prisma.employer.findFirst({
    where: { name: { contains: 'מזרחי' } }
  });
  
  if (!mizrahi) {
    console.log('❌ לא נמצא מעסיק בנק מזרחי');
    return;
  }
  
  console.log(`✅ נמצא מעסיק: ${mizrahi.name}\n`);
  
  // מציאת כל המשרות של בנק מזרחי
  const positions = await prisma.position.findMany({
    where: { employerId: mizrahi.id }
  });
  
  console.log(`📋 נמצאו ${positions.length} משרות\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const pos of positions) {
    // בדיקה אם כבר יש קוד משרה
    if (pos.title.includes('JB-')) {
      console.log(`⏭️ דילוג: ${pos.title} (כבר יש קוד)`);
      skipped++;
      continue;
    }
    
    // זיהוי המרחב
    const area = detectArea(pos.title, pos.location, pos.description);
    const jobCode = JOB_CODES[area];
    
    if (!jobCode) {
      console.log(`⚠️ לא זוהה מרחב: ${pos.title} | מיקום: ${pos.location}`);
      continue;
    }
    
    // הוספת קוד המשרה לכותרת
    const newTitle = `${pos.title} [${jobCode}]`;
    
    await prisma.position.update({
      where: { id: pos.id },
      data: { title: newTitle }
    });
    
    console.log(`✅ ${pos.title}`);
    console.log(`   → ${newTitle} (מרחב ${area})`);
    updated++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 סיכום:`);
  console.log(`   • עודכנו: ${updated} משרות`);
  console.log(`   • דולגו (כבר יש קוד): ${skipped} משרות`);
}

addJobCodesToMizrahi()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
