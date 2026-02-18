// סקריפט לעדכון פרטי קשר של משרות YES
// יש להריץ עם DATABASE_URL של פרודקשן

const { PrismaClient } = require('@prisma/client')

// פרטי הרכזים
const shirContact = {
  contactName: 'שיר בניוניס - Shir Benyunes',
  contactEmail: 'SBenyunes@yes.co.il',
  phone: '052-6152101'
}

const nofarContact = {
  contactName: 'נופר קצב אבשרי - Nofar Katzav avshari',
  contactEmail: 'NKatzavavsha@yes.co.il',
  phone: '050-6954194'
}

// משרות נשר - שיר (ראיון פרונטלי בנשר כל יום 9:00-14:00)
const nesherPositions = [
  'נציג/ת מכירות נשר',
  'נציג/ת שירות ותמיכה נשר',
  'נציג/ת מכירות טלסל',
  'נציג/ת מוקד מכירות',
  'נציג/ת תמיכה טכנית'
]

// משרות באר שבע - נופר (ראיון טלפוני)
const beerShevaPositions = [
  'נציג/ת שירות ותמיכה באר שבע',
  'נציג/ת שירות לקוחות'
]

// משרות כפר סבא - נופר (ראיון פרונטלי בכפר סבא)
const kfarSabaPositions = [
  'סוכן/ת מכירות שטח עסקי',
  'סוכן/ת מכירות שטח למגזר העסקי',
  'אחראי/ת תיק לקוח עסקי',
  'נציג/ת קהילה דיגיטלית'
]

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 מעדכן פרטי קשר למשרות YES...')
    
    // מצא את המעסיק YES
    const yesEmployer = await prisma.employer.findFirst({
      where: { name: { contains: 'yes', mode: 'insensitive' } }
    })

    if (!yesEmployer) {
      console.log('❌ לא נמצא מעסיק YES')
      return
    }

    console.log(`✅ נמצא מעסיק YES: ${yesEmployer.id}`)

    // קבל את כל משרות YES
    const allPositions = await prisma.position.findMany({
      where: { employerId: yesEmployer.id },
      select: { id: true, title: true, location: true }
    })

    console.log(`📋 נמצאו ${allPositions.length} משרות YES`)

    let updatedCount = 0

    for (const pos of allPositions) {
      let contactInfo = null
      let additionalNote = ''

      // בדיקה לפי מיקום ושם המשרה
      const isNesher = pos.location?.includes('נשר') || nesherPositions.some(n => pos.title.includes(n.replace('נציג/ת ', '')))
      const isBeerSheva = pos.location?.includes('באר שבע') || pos.location?.includes("ב\"ש")
      const isKfarSaba = pos.location?.includes('כפר סבא') || kfarSabaPositions.some(k => pos.title.includes(k.replace('/ת ', '/')))

      if (isNesher && !isBeerSheva) {
        contactInfo = shirContact
        additionalNote = '\n\n📞 ראיונות: פרונטלי בנשר כל יום בין 9:00-14:00\n✉️ יש לעדכן את שיר במועד הראיון'
      } else if (isBeerSheva) {
        contactInfo = nofarContact
        additionalNote = '\n\n📞 ראיונות: טלפוניים על ידי נופר הרכזת\n✉️ יש להעביר פרטי מועמדים במייל + לנילוסופט'
      } else if (isKfarSaba) {
        contactInfo = nofarContact
        additionalNote = '\n\n📞 ראיונות: פרונטלי בכפר סבא מול נופר'
      }

      if (contactInfo) {
        await prisma.position.update({
          where: { id: pos.id },
          data: {
            contactName: contactInfo.contactName,
            contactEmail: contactInfo.contactEmail
          }
        })
        console.log(`   ✅ עודכן: ${pos.title} (${pos.location}) → ${contactInfo.contactName}`)
        updatedCount++
      } else {
        console.log(`   ⚠️ לא עודכן: ${pos.title} (${pos.location})`)
      }
    }

    console.log(`\n🎉 סיום! עודכנו ${updatedCount} משרות`)

    // הצגת סיכום
    const updatedPositions = await prisma.position.findMany({
      where: { employerId: yesEmployer.id },
      select: { title: true, location: true, contactName: true, contactEmail: true },
      orderBy: { location: 'asc' }
    })

    console.log('\n=== סיכום משרות YES ===')
    updatedPositions.forEach(p => {
      console.log(`${p.title}`)
      console.log(`   📍 ${p.location || 'לא מוגדר'}`)
      console.log(`   👤 ${p.contactName || 'לא מוגדר'}`)
      console.log(`   ✉️  ${p.contactEmail || 'לא מוגדר'}\n`)
    })

  } catch (error) {
    console.error('❌ שגיאה:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
