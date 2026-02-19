const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// עדכון שעות עבודה למשרות של פנינית ודנה בסלע לוגיסטיקה
const workHoursUpdates = [
  // Pninit Roitman positions
  { title: 'מלגזן היגש', location: 'בני דרום', contactName: 'Pninit Roitman', workHours: '08:00-17:00' },
  { title: 'פקיד/ה', location: 'בני דרום', contactName: 'Pninit Roitman', workHours: '08:00-17:00' },
  { title: 'פקיד/ה', location: 'חפץ חיים', contactName: 'Pninit Roitman', workHours: '08:00-17:00' },
  { title: 'מלקט/ת', location: 'אשדוד', contactName: 'Pninit Roitman', workHours: '08:00-17:00' },
  { title: 'מחסנאי/ת לילה', location: 'אשדוד', contactName: 'Pninit Roitman', workHours: '16:30-01:30' },
  { title: 'מלגזן היגש', location: 'אשדוד', contactName: 'Pninit Roitman', workHours: '08:00-17:00' },
  { title: 'בקר/ית', location: 'אשדוד', contactName: 'Pninit Roitman', workHours: '06:00-12:00' },
  { title: 'בקר/ית', location: 'בית שמש', contactName: 'Pninit Roitman', workHours: '06:30-15:30/16:00 או משעה 11:00/12:00 ועד סיום העבודה סביבות 20:00' },
  
  // Dana Shapiro positions
  { title: 'נציג/ת שירות לקוחות', location: 'אשדוד', contactName: 'Dana Shapiro', workHours: '13:00/14:00-20:00' },
  { title: 'רפרנט/ית שטח', location: 'בית שמש', contactName: 'Dana Shapiro', workHours: '06:00-15:00' },
  { title: 'סדרן הפצה', location: 'אשדוד', contactName: 'Dana Shapiro', workHours: '06:00-16:00' },
  { title: 'סדרן הפצה', location: 'בית שמש', contactName: 'Dana Shapiro', workHours: '06:00-16:00' },
  { title: 'רפרנט/ית שטח', location: 'מבקיעים', contactName: 'Dana Shapiro', workHours: '05:00-14:00' },
  { title: 'נציג/ת לקוח', location: 'אשדוד', contactName: 'Dana Shapiro', workHours: '08:00-17:00' },
]

async function updateWorkHours() {
  console.log('🕐 מתחיל עדכון שעות עבודה למשרות סלע...\n')
  
  let updated = 0
  let notFound = 0
  
  for (const update of workHoursUpdates) {
    // חיפוש גמיש לפי חלק מהשם והמיקום
    const positions = await prisma.position.findMany({
      where: {
        AND: [
          { contactName: update.contactName },
          {
            OR: [
              { title: { contains: update.title } },
              { title: { contains: update.title.replace('/', '') } },
            ]
          },
          {
            OR: [
              { location: { contains: update.location } },
              { location: { contains: update.location.split('-')[0].trim() } },
            ]
          }
        ]
      },
      select: { id: true, title: true, location: true, workHours: true }
    })
    
    if (positions.length === 0) {
      console.log(`❌ לא נמצא: ${update.title} @ ${update.location} (${update.contactName})`)
      notFound++
      continue
    }
    
    for (const position of positions) {
      await prisma.position.update({
        where: { id: position.id },
        data: { workHours: update.workHours }
      })
      console.log(`✅ עודכן: ${position.title} @ ${position.location}`)
      console.log(`   שעות: ${update.workHours}`)
      updated++
    }
  }
  
  console.log(`\n📊 סיכום:`)
  console.log(`   ✅ עודכנו: ${updated} משרות`)
  console.log(`   ❌ לא נמצאו: ${notFound}`)
}

updateWorkHours()
  .catch(e => console.error('שגיאה:', e))
  .finally(() => prisma.$disconnect())
