require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚢 מוסיף לקוח: קשרי גל ים')
  
  // 1. חיפוש או יצירת המעסיק
  let employer = await prisma.employer.findFirst({
    where: {
      OR: [
        { name: { contains: 'קשרי גל ים' } },
        { name: { contains: 'גל ים' } }
      ]
    }
  })

  if (!employer) {
    console.log('🏢 יוצר מעסיק חדש: קשרי גל ים')
    employer = await prisma.employer.create({
      data: {
        name: 'קשרי גל ים',
        email: 'jobs@kishreygalyam.co.il',
        phone: '',
        description: 'חברת קשרי גל ים - שירותי לוגיסטיקה ונמל חיפה'
      }
    })
    console.log('✅ נוצר מעסיק:', employer.id)
  } else {
    console.log('✅ נמצא מעסיק:', employer.name)
  }

  // 2. יצירת/מציאת תגיות
  const tagNames = [
    'לוגיסטיקה', 'נמל', 'חיפה', 'משאיות', 'רישום', 
    'תפעול', 'משרה מלאה', 'ללא ניסיון'
  ]

  const tags = {}
  for (const tagName of tagNames) {
    let tag = await prisma.tag.findFirst({ where: { name: tagName } })
    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName, color: getTagColor(tagName) }
      })
      console.log(`🏷️ נוצרה תגית: ${tagName}`)
    }
    tags[tagName] = tag
  }

  // 3. יצירת המשרה - טלימאן
  const existingPosition = await prisma.position.findFirst({
    where: {
      title: { contains: 'טלימאן' },
      employerId: employer.id
    }
  })

  if (existingPosition) {
    console.log('⚠️ משרת טלימאן כבר קיימת, מעדכן...')
    await prisma.position.update({
      where: { id: existingPosition.id },
      data: {
        active: true,
        description: getPositionDescription(),
        requirements: getPositionRequirements(),
        location: 'נמל חיפה',
        salaryRange: 'לפי סיכום',
        employmentType: 'משרה מלאה',
        keywords: JSON.stringify(['טלימאן', 'נמל חיפה', 'משאיות', 'רישום', 'לוגיסטיקה', 'גל ים', 'שכירת משאיות', 'תפעול נמלי']),
        benefits: 'תנאים טובים, סביבת עבודה דינמית',
        aiProfile: JSON.stringify(getAiProfile())
      }
    })
    console.log('✅ משרה עודכנה')
  } else {
    const position = await prisma.position.create({
      data: {
        title: 'טלימאן/ית - רישום משאיות שכורות',
        description: getPositionDescription(),
        requirements: getPositionRequirements(),
        location: 'נמל חיפה',
        salaryRange: 'לפי סיכום',
        employmentType: 'משרה מלאה',
        employerId: employer.id,
        active: true,
        keywords: JSON.stringify(['טלימאן', 'נמל חיפה', 'משאיות', 'רישום', 'לוגיסטיקה', 'גל ים', 'שכירת משאיות', 'תפעול נמלי']),
        benefits: 'תנאים טובים, סביבת עבודה דינמית',
        aiProfile: JSON.stringify(getAiProfile()),
        tags: {
          connect: Object.values(tags).map(t => ({ id: t.id }))
        }
      }
    })
    console.log('✅ נוצרה משרה חדשה:', position.title)
  }

  console.log('🎉 הסתיים בהצלחה!')
}

function getPositionDescription() {
  return `טלימאן/ית בנמל חיפה - קשרי גל ים

📍 מיקום: נמל חיפה

תיאור התפקיד:
אחריות על רישום ותיעוד משאיות שכורות הנכנסות ויוצאות מהנמל.

תחומי אחריות:
• רישום משאיות שכורות הנכנסות לנמל
• תיעוד פרטי המשאית, הנהג והמטען
• מעקב אחר תנועת משאיות בשטח הנמל
• עבודה מול מערכות ממוחשבות
• קשר עם נהגים וחברות ההובלה
• דיווח ותיעוד שוטף

טלימאן הוא תפקיד מרכזי בתפעול הנמלי, המבטיח שכל משאית שכורה שנכנסת לנמל מתועדת כראוי ועומדת בתקנות.`
}

function getPositionRequirements() {
  return `דרישות התפקיד:
• דייקנות ואחריות
• יכולת עבודה עם מחשב
• סדר וארגון
• יכולת עבודה בסביבה דינמית
• עברית - שפת אם
• ניסיון בתפקיד דומה - יתרון
• רישיון נהיגה - יתרון`
}

function getAiProfile() {
  return {
    role: 'טלימאן/ית - רישום משאיות',
    industry: 'לוגיסטיקה ונמלים',
    skills: ['רישום', 'תיעוד', 'עבודה עם מחשב', 'דייקנות', 'סדר וארגון'],
    experience: 'ניסיון בתפקיד דומה - יתרון',
    location: 'נמל חיפה',
    workDays: 'א-ה',
    benefits: ['תנאים טובים', 'סביבת עבודה דינמית'],
    keywords: ['טלימאן', 'נמל חיפה', 'משאיות', 'רישום', 'לוגיסטיקה', 'תפעול נמלי', 'גל ים']
  }
}

function getTagColor(tagName) {
  const colors = {
    'לוגיסטיקה': '#3B82F6',
    'נמל': '#0EA5E9',
    'חיפה': '#10B981',
    'משאיות': '#F59E0B',
    'רישום': '#8B5CF6',
    'תפעול': '#EC4899',
    'משרה מלאה': '#22C55E',
    'ללא ניסיון': '#14B8A6'
  }
  return colors[tagName] || '#6B7280'
}

main()
  .catch(e => {
    console.error('❌ שגיאה:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
