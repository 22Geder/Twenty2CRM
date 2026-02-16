const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 מוסיף תגיות למשרת YES להתאמת מועמדים צעירים...')

  const positionId = 'dd9acd81-5263-408e-a5d2-5b52990ad425'

  // תגיות חדשות למועמדים צעירים
  const newTagNames = [
    'ללא ניסיון',
    'entry level',
    'מתחילים'
  ]

  const tagColors = {
    'ללא ניסיון': '#22C55E',
    'entry level': '#3B82F6',
    'מתחילים': '#A855F7'
  }

  // יצירת תגיות חדשות
  const newTags = []
  for (const name of newTagNames) {
    let tag = await prisma.tag.findFirst({ where: { name } })
    if (!tag) {
      tag = await prisma.tag.create({
        data: { name, color: tagColors[name] || '#6B7280' }
      })
      console.log(`✅ תגית נוצרה: ${name}`)
    }
    newTags.push(tag)
  }

  // קבלת התגיות הקיימות של המשרה
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { tags: true }
  })

  // שילוב כל התגיות
  const allTagIds = [
    ...position.tags.map(t => ({ id: t.id })),
    ...newTags.map(t => ({ id: t.id }))
  ]

  // עדכון AI Profile להדגיש שמתאים לצעירים
  const currentAiProfile = JSON.parse(position.aiProfile || '{}')
  currentAiProfile.idealCandidate = 'מועמד/ת צעיר/ה עם מוטיבציה, אוריינטציה מכירתית, כושר ביטוי ושכנוע. גם ללא ניסיון קודם - ניתן להתקבל! מתאים למי שמחפש כניסה לעולם המכירות.'
  currentAiProfile.targetAudience = 'צעירים, מתחילים, ללא ניסיון, כניסה לשוק העבודה'
  currentAiProfile.experienceLevel = 'entry'
  currentAiProfile.deepAnalysis.requirements.experience = {
    minimum: 0,
    preferred: 0,
    description: 'לא נדרש ניסיון קודם! מתאים לצעירים ומתחילים'
  }

  // עדכון Keywords
  const currentKeywords = JSON.parse(position.keywords || '[]')
  const additionalKeywords = ['צעירים', 'ללא ניסיון', 'מתחילים', 'entry level', 'כניסה לשוק העבודה', 'עבודה ראשונה', 'סטודנטים']
  const allKeywords = [...new Set([...currentKeywords, ...additionalKeywords])]

  // עדכון המשרה
  await prisma.position.update({
    where: { id: positionId },
    data: {
      aiProfile: JSON.stringify(currentAiProfile),
      keywords: JSON.stringify(allKeywords),
      tags: {
        set: allTagIds
      }
    }
  })

  console.log('\n✅ המשרה עודכנה!')
  console.log('📝 תגיות חדשות: ללא ניסיון, entry level, מתחילים')
  console.log('📝 Keywords חדשים:', additionalKeywords.join(', '))
  console.log('\n🎯 המשרה כעת תימצא גם עבור:')
  console.log('   - מועמדים צעירים')
  console.log('   - מועמדים ללא ניסיון')
  console.log('   - מתחילים')
  console.log('   - סטודנטים')

  // הצגת מועמדים מתאימים מהצפון
  const northCandidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { city: { contains: 'חיפה' } },
        { city: { contains: 'נשר' } },
        { city: { contains: 'עכו' } },
        { city: { contains: 'נהריה' } },
        { city: { contains: 'קריות' } },
        { city: { contains: 'כרמל' } },
        { city: { contains: 'קריית' } }
      ]
    },
    include: { tags: true },
    take: 15
  })

  console.log('\n\n=== מועמדים מהצפון שכדאי לשלוח להם על המשרה ===')
  console.log('נמצאו:', northCandidates.length, 'מועמדים מהצפון\n')
  
  northCandidates.forEach((c, i) => {
    console.log(`${i+1}. ${c.name} | ${c.city} | ${c.phone || 'אין טלפון'}`)
    if (c.currentTitle) console.log(`   תפקיד נוכחי: ${c.currentTitle}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
