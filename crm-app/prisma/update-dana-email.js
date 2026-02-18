const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateDanaEmail() {
  console.log('🔄 מעדכן מיילים של דנה בסלע לוגיסטיקה...')
  
  try {
    // עדכון משרות עם שם קשר של Dana לאימייל החדש
    const updated = await prisma.position.updateMany({
      where: {
        contactName: { contains: 'Dana', mode: 'insensitive' }
      },
      data: {
        contactEmail: 'danav@selabonded.co.il'
      }
    })
    
    console.log(`✅ עודכנו ${updated.count} משרות של דנה`)
    
    // הצגת המשרות שעודכנו
    const danaPositions = await prisma.position.findMany({
      where: {
        contactName: { contains: 'Dana', mode: 'insensitive' }
      },
      select: {
        title: true,
        contactName: true,
        contactEmail: true
      }
    })
    
    console.log('\n📋 משרות של דנה:')
    danaPositions.forEach(p => {
      console.log(`   - ${p.title}: ${p.contactName} (${p.contactEmail})`)
    })
    
    // הצגת משרות של פנינית (לאימות)
    const pninitPositions = await prisma.position.findMany({
      where: {
        contactName: { contains: 'Pninit', mode: 'insensitive' }
      },
      select: {
        title: true,
        contactName: true,
        contactEmail: true
      }
    })
    
    console.log('\n📋 משרות של פנינית:')
    pninitPositions.forEach(p => {
      console.log(`   - ${p.title}: ${p.contactName} (${p.contactEmail})`)
    })
    
  } catch (error) {
    console.error('❌ שגיאה:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDanaEmail()
