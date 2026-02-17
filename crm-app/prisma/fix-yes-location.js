const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing YES position locations...')

  // מצא את המעסיק YES
  const yesEmployer = await prisma.employer.findFirst({
    where: { name: { contains: 'yes', mode: 'insensitive' } }
  })

  if (!yesEmployer) {
    console.log('❌ No YES employer found')
    return
  }

  console.log(`✅ Found YES employer: ${yesEmployer.id}`)

  // חפש את משרת סוכן מכירות שטח
  const fieldSalesPosition = await prisma.position.findFirst({
    where: {
      employerId: yesEmployer.id,
      title: { contains: 'סוכן' }
    }
  })

  if (fieldSalesPosition) {
    console.log(`📋 Found position: ${fieldSalesPosition.title}`)
    console.log(`   Current location: ${fieldSalesPosition.location}`)
    
    // עדכן את המיקום למרכז
    await prisma.position.update({
      where: { id: fieldSalesPosition.id },
      data: { location: 'מרכז' }
    })
    console.log(`✅ Updated location to: מרכז`)
  } else {
    console.log('❌ Field sales position not found, creating new one...')
    
    // צור משרה חדשה אם לא קיימת
    const newPosition = await prisma.position.create({
      data: {
        title: 'סוכן/ת מכירות שטח למגזר עסקי',
        location: 'מרכז',
        description: `מכירת מוצרי ושרותי החברה לבתי עסק בינוניים וגדולים, איתור לקוחות פוטנציאליים ותאום פגישות מכירה עימם באופן עצמאי.
ביצוע פגישות המכירה ומו"מ לסגירת העסקאות עם בתי העסק, אחריות אישית וליווי תהליך הצטרפות הלקוח לחברה.
עבודה מול ממשקים פנים וחוץ ארגוניים רבים, עמידה ביעדי המכירות.`,
        requirements: `ניסיון במכירות - חובה
הכרות עם המגזר העסקי - יתרון משמעותי
רקע טכני - יתרון משמעותי
רצינות, יציבות ומכוונות לטווח ארוך
דרייב למכירות
נכונות לעבודת שטח מאומצת
יחסי אנוש מצויינים
רישיון נהיגה - חובה`,
        salaryRange: 'שכר בסיס 8,000 ₪ + בונוס ללא תקרה + רכב + סלולרי + טבלט',
        employmentType: 'משרה מלאה',
        active: true,
        employerId: yesEmployer.id,
        openings: 1,
        priority: 5,
        keywords: JSON.stringify(['מכירות שטח', 'B2B', 'מרכז', 'סוכן', 'עסקי', 'רכב צמוד', 'yes', 'יס'])
      }
    })
    console.log(`✅ Created new position: ${newPosition.title} - מרכז`)
  }

  // הצג את כל משרות YES
  const allYesPositions = await prisma.position.findMany({
    where: { employerId: yesEmployer.id, active: true }
  })

  console.log('\n=== כל משרות YES הפעילות ===')
  allYesPositions.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - ${p.location}`)
  })

  console.log('\n🎉 Done!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
