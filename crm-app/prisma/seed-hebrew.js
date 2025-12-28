const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// משרות ישראליות מסודרות לפי קטגוריות
const jobCategories = {
  'היי-טק ופיתוח': [
    { title: 'Full Stack Developer', requirements: 'React, Node.js, TypeScript, ניסיון 3+ שנים', salary: '20,000-35,000 ₪', location: 'תל אביב' },
    { title: 'Frontend Developer', requirements: 'React, Vue.js, Angular, HTML5, CSS3', salary: '18,000-30,000 ₪', location: 'תל אביב' },
    { title: 'Backend Developer', requirements: 'Node.js, Python, Java, MySQL, MongoDB', salary: '18,000-32,000 ₪', location: 'תל אביב' },
    { title: 'DevOps Engineer', requirements: 'AWS, Docker, Kubernetes, CI/CD', salary: '22,000-38,000 ₪', location: 'הרצליה' },
    { title: 'QA Automation Engineer', requirements: 'Selenium, Cypress, Jest, Automation', salary: '15,000-25,000 ₪', location: 'רעננה' },
    { title: 'Mobile Developer', requirements: 'React Native, Flutter, Swift, Kotlin', salary: '20,000-35,000 ₪', location: 'תל אביב' },
    { title: 'Data Engineer', requirements: 'Python, SQL, Spark, Big Data', salary: '22,000-40,000 ₪', location: 'תל אביב' },
    { title: 'Data Scientist', requirements: 'Python, Machine Learning, Statistics', salary: '25,000-45,000 ₪', location: 'תל אביב' },
    { title: 'Product Manager', requirements: 'Agile, Product Roadmap, Analytics', salary: '25,000-45,000 ₪', location: 'תל אביב' },
    { title: 'UX/UI Designer', requirements: 'Figma, Sketch, Adobe XD, User Research', salary: '18,000-30,000 ₪', location: 'תל אביב' },
    { title: 'Scrum Master', requirements: 'Agile, Scrum, Jira, Team Leadership', salary: '20,000-32,000 ₪', location: 'רמת גן' },
    { title: 'Team Leader', requirements: 'Leadership, Architecture, Code Review', salary: '30,000-50,000 ₪', location: 'תל אביב' },
    { title: 'CTO', requirements: 'Technology Strategy, Leadership, Innovation', salary: '40,000-80,000 ₪', location: 'תל אביב' },
    { title: 'Cyber Security Engineer', requirements: 'Cybersecurity, Penetration Testing, SIEM', salary: '25,000-45,000 ₪', location: 'תל אביב' },
    { title: 'Cloud Architect', requirements: 'AWS, Azure, GCP, Cloud Strategy', salary: '30,000-55,000 ₪', location: 'הרצליה' },
  ],
  'שיווק ומכירות': [
    { title: 'מנהל/ת שיווק דיגיטלי', requirements: 'Google Ads, Facebook Ads, SEO, Analytics', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת תוכן', requirements: 'כתיבה שיווקית, SEO, ניהול רשתות חברתיות', salary: '12,000-22,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת רשתות חברתיות', requirements: 'Facebook, Instagram, TikTok, יצירת תוכן', salary: '10,000-20,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת מכירות', requirements: 'מכירות B2B, CRM, משא ומתן', salary: '15,000-35,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת לקוחות', requirements: 'ניהול קשרי לקוחות, מכירות, שירות', salary: '12,000-25,000 ₪', location: 'רמת גן' },
    { title: 'מנהל/ת שיווק', requirements: 'אסטרטגיה שיווקית, ניהול קמפיינים, תקציבים', salary: '18,000-35,000 ₪', location: 'תל אביב' },
    { title: 'מומחה SEO', requirements: 'SEO, Google Analytics, מילות מפתח', salary: '12,000-22,000 ₪', location: 'תל אביב' },
    { title: 'מומחה PPC', requirements: 'Google Ads, Facebook Ads, ניהול קמפיינים', salary: '12,000-23,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת מותג', requirements: 'ניהול מותג, אסטרטגיה, יצירתיות', salary: '16,000-30,000 ₪', location: 'תל אביב' },
    { title: 'Growth Hacker', requirements: 'Analytics, A/B Testing, אופטימיזציה', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת פיתוח עסקי', requirements: 'שותפויות, אסטרטגיה, מכירות', salary: '18,000-35,000 ₪', location: 'תל אביב' },
    { title: 'נציג/ת מכירות', requirements: 'תקשורת, CRM, מכירות', salary: '8,000-15,000 ₪', location: 'תל אביב' },
  ],
  'פיננסים וכספים': [
    { title: 'סמנכ"ל כספים (CFO)', requirements: 'אסטרטגיה פיננסית, ניהול, דיווח', salary: '35,000-70,000 ₪', location: 'תל אביב' },
    { title: 'בקר/ת פיננסי', requirements: 'חשבונאות, דיווחים, תקציבים', salary: '20,000-35,000 ₪', location: 'רמת גן' },
    { title: 'רואה חשבון', requirements: 'חשבונאות, Excel, מיסים', salary: '12,000-22,000 ₪', location: 'תל אביב' },
    { title: 'אנליסט פיננסי', requirements: 'ניתוח פיננסי, Excel, דיווחים', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת חשבונות', requirements: 'הנהלת חשבונות, תוכנות חשבונאות', salary: '8,000-15,000 ₪', location: 'פתח תקווה' },
    { title: 'רכז/ת שכר', requirements: 'שכר, Excel, רגולציה', salary: '10,000-18,000 ₪', location: 'רמת גן' },
    { title: 'יועץ/ת מס', requirements: 'דיני מיסים, תכנון מס', salary: '15,000-30,000 ₪', location: 'תל אביב' },
    { title: 'מבקר/ת פנים', requirements: 'ביקורת, תקינה, ניתוח', salary: '15,000-28,000 ₪', location: 'תל אביב' },
  ],
  'משאבי אנוש': [
    { title: 'מנהל/ת משאבי אנוש', requirements: 'ניהול HR, גיוס, ארגון', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'מגייס/ת', requirements: 'גיוס, ראיונות, LinkedIn', salary: '10,000-20,000 ₪', location: 'תל אביב' },
    { title: 'רכז/ת משאבי אנוש', requirements: 'תפעול HR, מדיניות', salary: '12,000-22,000 ₪', location: 'רמת גן' },
    { title: 'מנהל/ת גיוס', requirements: 'אסטרטגיית גיוס, ניהול', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'שותף/ה עסקי HR', requirements: 'ייעוץ, אסטרטגיה, HR', salary: '16,000-30,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת הכשרה ופיתוח', requirements: 'הדרכה, למידה וצמיחה', salary: '14,000-26,000 ₪', location: 'תל אביב' },
  ],
  'בנייה והנדסה': [
    { title: 'מהנדס/ת אזרחי', requirements: 'הנדסה, AutoCAD, ניהול פרויקטים', salary: '18,000-32,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת פרויקטי בנייה', requirements: 'ניהול פרויקטים, בנייה, תקציבים', salary: '20,000-38,000 ₪', location: 'תל אביב' },
    { title: 'אדריכל/ית', requirements: 'אדריכלות, עיצוב, Revit', salary: '18,000-35,000 ₪', location: 'תל אביב' },
    { title: 'מהנדס/ת חשמל', requirements: 'הנדסת חשמל, תכנון, פרויקטים', salary: '16,000-30,000 ₪', location: 'חיפה' },
    { title: 'מהנדס/ת מכונות', requirements: 'הנדסה מכנית, תכנון, פרויקטים', salary: '16,000-30,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת אתר', requirements: 'ניהול בנייה, פיקוח', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'מהנדס/ת בטיחות', requirements: 'בטיחות, רגולציה', salary: '14,000-25,000 ₪', location: 'תל אביב' },
  ],
  'רפואה ובריאות': [
    { title: 'רופא/ה', requirements: 'רפואה, רישיון', salary: '30,000-60,000 ₪', location: 'תל אביב' },
    { title: 'אח/ות', requirements: 'סיעוד, רישיון', salary: '12,000-20,000 ₪', location: 'תל אביב' },
    { title: 'מזכיר/ה רפואי', requirements: 'מינהל, מונחים רפואיים', salary: '8,000-14,000 ₪', location: 'תל אביב' },
    { title: 'פיזיותרפיסט/ית', requirements: 'פיזיותרפיה, רישיון', salary: '12,000-22,000 ₪', location: 'תל אביב' },
    { title: 'רוקח/ת', requirements: 'רוקחות, רישיון', salary: '15,000-25,000 ₪', location: 'תל אביב' },
    { title: 'טכנאי/ת מעבדה', requirements: 'מעבדה, ניתוח', salary: '10,000-18,000 ₪', location: 'תל אביב' },
    { title: 'רנטגנאי/ת', requirements: 'רדיולוגיה, רישיון', salary: '25,000-45,000 ₪', location: 'ירושלים' },
  ],
  'חינוך והוראה': [
    { title: 'מורה/ה', requirements: 'תעודת הוראה, התמחות בנושא', salary: '10,000-18,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת בית ספר', requirements: 'ניהול, חינוך', salary: '18,000-30,000 ₪', location: 'תל אביב' },
    { title: 'יועץ/ת חינוכי', requirements: 'ייעוץ, חינוך', salary: '12,000-20,000 ₪', location: 'ירושלים' },
    { title: 'מורה/ה לחינוך מיוחד', requirements: 'חינוך מיוחד, תעודה', salary: '12,000-20,000 ₪', location: 'תל אביב' },
    { title: 'מדריך/ה פרטי', requirements: 'ידע בנושא, הוראה', salary: '60-150 ₪/שעה', location: 'כל הארץ' },
    { title: 'גננת', requirements: 'חינוך גיל הרך', salary: '8,000-14,000 ₪', location: 'תל אביב' },
  ],
  'מסעדנות ואירוח': [
    { title: 'שף/ית', requirements: 'בישול, ניהול מטבח', salary: '12,000-25,000 ₪', location: 'תל אביב' },
    { title: 'סו-שף', requirements: 'בישול, מנהיגות', salary: '10,000-18,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת מסעדה', requirements: 'ניהול, שירות', salary: '12,000-22,000 ₪', location: 'תל אביב' },
    { title: 'מלצר/ית', requirements: 'שירות, תקשורת', salary: '6,000-10,000 ₪', location: 'תל אביב' },
    { title: 'ברמן/ית', requirements: 'מיקסולוגיה, שירות', salary: '7,000-12,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת מלון', requirements: 'אירוח, ניהול', salary: '15,000-28,000 ₪', location: 'ירושלים' },
    { title: 'רכז/ת אירועים', requirements: 'ארגון אירועים, לוגיסטיקה', salary: '10,000-18,000 ₪', location: 'תל אביב' },
  ],
  'קמעונאות ומסחר': [
    { title: 'מנהל/ת חנות', requirements: 'קמעונאות, ניהול, מכירות', salary: '10,000-18,000 ₪', location: 'תל אביב' },
    { title: 'אחראי/ת מכירות', requirements: 'שירות לקוחות, מכירות', salary: '6,000-10,000 ₪', location: 'תל אביב' },
    { title: 'מרצ\'נדייזר', requirements: 'תצוגה, סחר', salary: '8,000-14,000 ₪', location: 'תל אביב' },
    { title: 'קופאי/ת', requirements: 'קופה, שירות לקוחות', salary: '6,000-9,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת מלאי', requirements: 'מלאי, מערכות', salary: '10,000-18,000 ₪', location: 'פתח תקווה' },
    { title: 'מנהל/ת קטגוריה', requirements: 'ניהול קטגוריה, ניתוח', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'קונה/ת', requirements: 'רכש, משא ומתן', salary: '12,000-22,000 ₪', location: 'תל אביב' },
  ],
  'לוגיסטיקה ותפעול': [
    { title: 'מנהל/ת לוגיסטיקה', requirements: 'לוגיסטיקה, שרשרת אספקה', salary: '15,000-28,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת שרשרת אספקה', requirements: 'Supply Chain, תכנון', salary: '18,000-32,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת מחסן', requirements: 'מחסן, מלאי', salary: '12,000-20,000 ₪', location: 'פתח תקווה' },
    { title: 'מנהל/ת תפעול', requirements: 'תפעול, יעילות', salary: '16,000-30,000 ₪', location: 'תל אביב' },
    { title: 'מנהל/ת רכש', requirements: 'רכש, ספקים', salary: '14,000-26,000 ₪', location: 'תל אביב' },
    { title: 'מפעיל/ת מלגזה', requirements: 'רישיון, בטיחות', salary: '7,000-12,000 ₪', location: 'נתניה' },
    { title: 'נהג/ת משלוחים', requirements: 'רישיון נהיגה, ניווט', salary: '6,000-10,000 ₪', location: 'תל אביב' },
  ],
}

async function main() {
  console.log('🌱 מתחיל לטעון נתונים עם משרות ישראליות...\n')

  // ניקוי נתונים קיימים
  console.log('🗑️  מנקה נתונים קיימים...')
  await prisma.interview.deleteMany({})
  await prisma.application.deleteMany({})
  await prisma.candidate.deleteMany({})
  await prisma.position.deleteMany({})
  await prisma.tag.deleteMany({})
  await prisma.employer.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
  console.log('✅ נתונים נוקו\n')

  // יצירת משתמש מנהל
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@twenty2jobs.co.il',
      name: 'מנהל מערכת',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ משתמש מנהל נוצר:', admin.email)

  // יצירת מחלקות
  const departments = {}
  for (const categoryName of Object.keys(jobCategories)) {
    const dept = await prisma.department.create({
      data: {
        name: categoryName,
        description: `מחלקת ${categoryName}`,
      },
    })
    departments[categoryName] = dept
    console.log(`✅ מחלקה נוצרה: ${categoryName}`)
  }

  // יצירת מעסיקים ישראליים
  const employers = []
  const employerNames = [
    { name: 'גוגל ישראל', email: 'jobs@google.co.il', phone: '03-7654321', website: 'https://google.co.il' },
    { name: 'מיקרוסופט ישראל', email: 'careers@microsoft.co.il', phone: '03-7654322', website: 'https://microsoft.co.il' },
    { name: 'פייסבוק ישראל', email: 'jobs@fb.co.il', phone: '03-7654323', website: 'https://facebook.co.il' },
    { name: 'אמזון ישראל', email: 'careers@amazon.co.il', phone: '03-7654324', website: 'https://amazon.co.il' },
    { name: 'אפל ישראל', email: 'jobs@apple.co.il', phone: '03-7654325', website: 'https://apple.co.il' },
    { name: 'אינטל ישראל', email: 'careers@intel.co.il', phone: '03-7654326', website: 'https://intel.co.il' },
    { name: 'וויקס', email: 'careers@wix.com', phone: '03-7654328', website: 'https://wix.com' },
    { name: 'מאנדיי', email: 'jobs@monday.com', phone: '03-7654329', website: 'https://monday.com' },
    { name: 'ניס טכנולוגיות', email: 'careers@nice.com', phone: '03-7654330', website: 'https://nice.com' },
    { name: 'צ\'ק פוינט', email: 'jobs@checkpoint.com', phone: '03-7654331', website: 'https://checkpoint.com' },
  ]

  for (const emp of employerNames) {
    const employer = await prisma.employer.create({
      data: emp,
    })
    employers.push(employer)
  }
  console.log(`✅ ${employers.length} מעסיקים נוצרו\n`)

  // יצירת משרות
  let totalPositions = 0
  for (const [categoryName, jobs] of Object.entries(jobCategories)) {
    console.log(`📋 יוצר משרות עבור ${categoryName}...`)
    
    for (const job of jobs) {
      const randomEmployer = employers[Math.floor(Math.random() * employers.length)]
      const employmentTypes = ['משרה מלאה', 'משרה חלקית', 'עבודה זמנית', 'פרילנס']
      
      await prisma.position.create({
        data: {
          title: job.title,
          description: `אנחנו מחפשים ${job.title} מוכשר/ת להצטרף לצוות שלנו. משרה מעניינת עם אתגרים ואפשרויות צמיחה.`,
          requirements: job.requirements,
          location: job.location,
          employmentType: employmentTypes[Math.floor(Math.random() * employmentTypes.length)],
          salaryRange: job.salary,
          active: Math.random() > 0.2,
          employerId: randomEmployer.id,
          departmentId: departments[categoryName].id,
          openings: Math.floor(Math.random() * 3) + 1,
          priority: Math.floor(Math.random() * 3),
        },
      })
      totalPositions++
    }
    console.log(`  ✅ ${jobs.length} משרות נוצרו`)
  }

  console.log(`\n✅ סה"כ ${totalPositions} משרות נוצרו!\n`)

  // יצירת תגיות כישורים
  const skills = [
    // טכנולוגיה
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'PHP',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Machine Learning', 'AI', 'Data Science', 'Big Data', 'Agile', 'Scrum',
    // כישורים רכים
    'מנהיגות', 'תקשורת', 'פתרון בעיות', 'עבודת צוות', 'יצירתיות', 'ניהול זמן',
    // שיווק
    'Google Ads', 'Facebook Ads', 'SEO', 'Content Marketing', 'Social Media',
    // אחרים
    'Excel', 'PowerPoint', 'Photoshop', 'Illustrator', 'AutoCAD', 'Revit'
  ]

  for (const skill of skills) {
    await prisma.tag.create({
      data: {
        name: skill,
        type: 'SKILL',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      },
    })
  }
  console.log(`✅ ${skills.length} תגיות כישורים נוצרו\n`)

  console.log('🎉 טעינת הנתונים הושלמה בהצלחה!\n')
  console.log('📊 סיכום:')
  console.log(`   - ${totalPositions} משרות`)
  console.log(`   - ${Object.keys(jobCategories).length} קטגוריות`)
  console.log(`   - ${employers.length} מעסיקים`)
  console.log(`   - ${skills.length} תגיות כישורים`)
  console.log('\n📝 פרטי התחברות:')
  console.log('   אימייל: admin@twenty2jobs.co.il')
  console.log('   סיסמה: admin123')
}

main()
  .catch((e) => {
    console.error('❌ שגיאה בטעינת הנתונים:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
