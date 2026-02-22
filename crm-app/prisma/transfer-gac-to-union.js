const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚗 מעדכן GAC ומעביר ל-UNION...\n')

  // 1. מציאת מעסיקים
  const gacEmployer = await prisma.employer.findFirst({
    where: { name: { contains: 'GAC' } }
  })

  const unionEmployer = await prisma.employer.findFirst({
    where: { 
      OR: [
        { name: { contains: 'UNION' } },
        { name: { contains: 'יוניון' } }
      ]
    }
  })

  if (!gacEmployer) {
    console.log('⚠️ לא נמצא מעסיק GAC, יוצר חדש...')
    const newGac = await prisma.employer.create({
      data: {
        name: 'חברת GAC',
        email: 'gac@gac.co.il',
        phone: '03-1234567',
        description: 'יבואן רכב GAC'
      }
    })
    console.log('✅ נוצר מעסיק GAC:', newGac.id)
  }

  if (!unionEmployer) {
    console.log('❌ לא נמצא מעסיק UNION!')
    return
  }

  console.log('📋 GAC:', gacEmployer?.name, gacEmployer?.id)
  console.log('📋 UNION:', unionEmployer.name, unionEmployer.id)

  // 2. הוספת המשרה החדשה (ישירות ל-UNION כי GAC עובד דרכם)
  const newPosition = await prisma.position.create({
    data: {
      employerId: unionEmployer.id,
      title: 'מנהל/ת תיק לקוח ציי רכב - GAC',
      location: 'רעננה + שטח (יש רכב)',
      description: `🚗 GAC - מנהל/ת תיק לקוח ציי רכב

📍 מיקום: רעננה + שטח ארצי (יש רכב צמוד)

📋 תיאור התפקיד:
• ניהול שוטף של תיקי לקוחות מוסדיים וציי רכב בהיקפים גדולים
• איתור וגיוס לקוחות חדשים והרחבת פעילות קיימת
• הובלת תהליכי מכירה מקצה לקצה – החל משלב המו"מ ועד חתימה על חוזים
• בניית והצגת הצעות ערך מותאמות לצורכי הלקוח
• עבודה מול גורמים בכירים בארגונים, מנהלי רכש ומנהלי תחבורה
• תיאום ממשקים פנימיים בחברה (שירות, תפעול, כספים)
• עמידה ביעדי מכירות וביעדי שביעות רצון לקוחות

✅ דרישות התפקיד:
• ניסיון מוכח של כשנה במכירות B2B - חובה!
• ניסיון מתחום הרכב - יתרון משמעותי
• יכולת גבוהה לניהול מו"מ מורכב
• רקע והבנה עסקית-מסחרית רחבה
• יכולת ניהול מספר פרויקטים ולקוחות במקביל
• כישורי תקשורת בין-אישית מצוינים ויחסי אנוש מעולים
• יכולת ניהול ממשקים פנים וחוץ ארגוניים
• HANDS ON ויכולת עבודה בצוות
• שליטה מלאה ביישומי מחשב ו-Excel

🎯 מה אנחנו מחפשים?
• בעלי ניסיון של שנה בעולם המכירות B2B
• וורבליים, רמה אישית סופר גבוהה, אסרטיביים - הדגש הוא אישיותי!
• התנסחות מעולה, יכולת מו"מ עם גורמים בכירים

⏰ שעות עבודה:
• ימים א'-ה' 8:00-17:00
• שישי רק במקרה הצורך
• נדרשת גמישות (פגישות שטח עם לקוחות)

💰 תנאים:
• בסיס: 8,000 ₪ (לבעלי ניסיון אזור 8-9K)
• עמלות: 4,000-5,000 ₪
• רכב צמוד + פלאפון`,
      requirements: `• ניסיון מוכח של כשנה במכירות B2B - חובה!
• ניסיון מתחום הרכב - יתרון משמעותי
• יכולת גבוהה לניהול מו"מ מורכב
• רקע והבנה עסקית-מסחרית רחבה
• יכולת ניהול מספר פרויקטים ולקוחות במקביל
• כישורי תקשורת בין-אישית מצוינים
• שליטה מלאה ביישומי מחשב ו-Excel
• רישיון נהיגה - חובה`,
      salaryRange: 'בסיס 8,000 ₪ + עמלות 4-5K',
      employmentType: 'FULL_TIME',
      isActive: true,
      priority: 3,
      keywords: 'מכירות B2B, ציי רכב, מנהל לקוחות, מו"מ, ניהול תיקים, רכב, GAC, UNION, יוניון, רעננה, שטח, גמישות, עמלות, רישיון נהיגה, לקוחות מוסדיים, תיאום, שירות, Excel'
    }
  })

  console.log('\n✅ נוספה משרה חדשה:', newPosition.title, newPosition.id)

  // 3. הוספת תגיות למשרה החדשה
  const tags = [
    'מכירות B2B', 'ציי רכב', 'מנהל לקוחות', 'מו"מ', 
    'רעננה', 'שטח', 'GAC', 'UNION', 'יוניון',
    'רכב', 'לקוחות מוסדיים', 'גמישות', 'עמלות',
    'משרה מלאה', 'ניסיון נדרש'
  ]

  for (const tagName of tags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      create: { name: tagName, color: getTagColor(tagName) },
      update: {}
    })
    
    await prisma.position.update({
      where: { id: newPosition.id },
      data: {
        tags: { connect: { id: tag.id } }
      }
    }).catch(() => {}) // ignore if already connected
  }

  console.log('🏷️ הוספו תגיות למשרה')

  // 4. העברת כל משרות GAC ל-UNION
  if (gacEmployer) {
    const gacPositions = await prisma.position.findMany({
      where: { employerId: gacEmployer.id }
    })

    console.log(`\n📦 מעביר ${gacPositions.length} משרות מ-GAC ל-UNION...`)

    for (const position of gacPositions) {
      await prisma.position.update({
        where: { id: position.id },
        data: { 
          employerId: unionEmployer.id,
          // מוסיף GAC לכותרת אם אין
          title: position.title.includes('GAC') ? position.title : `${position.title} - GAC`
        }
      })
      console.log(`  ✅ הועבר: ${position.title}`)
    }
  }

  // 5. סיכום
  const totalUnionPositions = await prisma.position.count({
    where: { employerId: unionEmployer.id }
  })

  console.log('\n========================================')
  console.log('📊 סיכום:')
  console.log('========================================')
  console.log(`✅ משרה חדשה נוספה: מנהל/ת תיק לקוח ציי רכב - GAC`)
  console.log(`✅ כל משרות GAC הועברו ל-UNION`)
  console.log(`📋 סה"כ משרות UNION: ${totalUnionPositions}`)
  console.log('========================================\n')
}

function getTagColor(tagName) {
  const colors = {
    'מכירות B2B': '#3B82F6',
    'ציי רכב': '#10B981',
    'מנהל לקוחות': '#8B5CF6',
    'מו"מ': '#F59E0B',
    'רעננה': '#EC4899',
    'שטח': '#06B6D4',
    'GAC': '#EF4444',
    'UNION': '#0EA5E9',
    'יוניון': '#0EA5E9',
    'רכב': '#10B981',
    'לקוחות מוסדיים': '#8B5CF6',
    'גמישות': '#F97316',
    'עמלות': '#22C55E',
    'משרה מלאה': '#6366F1',
    'ניסיון נדרש': '#F43F5E'
  }
  return colors[tagName] || '#6B7280'
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
