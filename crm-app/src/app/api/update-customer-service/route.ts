import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 🎯 API לעדכון מילות מפתח לשירות לקוחות
 * מוסיף את כל התגיות והמילות מפתח שיש במשרות טלרים גם למשרות שירות לקוחות
 */

// מילות מפתח בסיסיות לשירות לקוחות - זהות לטלרים
const CUSTOMER_SERVICE_KEYWORDS = [
  'נציג שירות', 'נציגת שירות', 'נציג מוקד', 'נציגת מוקד', 
  'מוקדן', 'מוקדנית', 'שירות לקוחות', 'נציג טלפוני', 'נציגת טלפונית',
  'שירותיות', 'סבלנות', 'יכולת הקשבה', 'פתרון בעיות',
  'תקשורת בינאישית', 'הקלדה מהירה', 'עבודה מול מחשב',
  'עבודה תחת לחץ', 'עמידה ביעדים', 'שימור לקוחות',
  'מערכת CRM', 'מערכת טלפוניה', 'משמרות',
  'בנקאות', 'פיננסים', 'קופה', 'עסקאות', 'לקוחות פרטיים', 'לקוחות עסקיים',
  'קופאי', 'קופאית', 'טלר', 'טלרית',
  'מוקד מכירות', 'מוקד תמיכה', 'מוקד שירות', 'קול סנטר', 'Call Center',
  'טלמרקטינג', 'טלמרקטר', 'טלמרקטרית',
  'מכירות', 'מכירות טלפוניות', 'לידים', 'לידים חמים',
  'סגירת עסקאות', 'יעדים', 'עמלות', 'בונוס',
  'customer service', 'call center', 'helpdesk', 'support',
  'יחסי אנוש', 'תודעת שירות', 'אמינות', 'סדר וארגון'
]

const YES_KEYWORDS = [
  ...CUSTOMER_SERVICE_KEYWORDS,
  'yes', 'יס', 'טלסל', 'סטינג', 'נטפליקס', 'דיסני',
  'אינטרנט', 'לוויין', 'כבלים', 'טלוויזיה', 'תקשורת',
  'מכירות', 'נציג מכירות', 'נציגת מכירות', 'מוקד מכירות',
  'שיחות יוצאות', 'שיחות נכנסות', 'לידים חמים',
  'סגירת עסקאות', 'בונוסים', 'יעדים', 'טלמרקטינג',
  'הישגיות', 'תחרותיות', 'שכנוע', 'כושר ביטוי',
  'נשר', 'באר שבע', 'צפון', 'דרום'
]

const TAG_COLORS: Record<string, string> = {
  'שירות לקוחות': '#06B6D4',
  'מוקד': '#3B82F6',
  'טלמרקטינג': '#F97316',
  'משרה מלאה': '#14B8A6',
  'לידים': '#F59E0B',
  'עמלות': '#8B5CF6',
  'מכירות': '#EF4444',
  'yes': '#EC4899',
  'נשר': '#8B5CF6',
  'צפון': '#10B981'
}

function buildYESAIProfile(position: any) {
  return {
    role: position.title,
    industry: 'טלקומוניקציה ותקשורת',
    location: position.location,
    region: position.location?.includes('נשר') ? 'צפון' : position.location?.includes('באר שבע') ? 'דרום' : 'מרכז',
    experience: 'ניסיון במכירות או שירות לקוחות - יתרון משמעותי, מתאים גם ללא ניסיון',
    skills: [
      'מכירות טלפוניות', 'טלמרקטינג', 'שירות לקוחות',
      'עבודה עם לידים', 'סגירת עסקאות', 'עבודה במוקד',
      'תקשורת בינאישית', 'יכולת שכנוע', 'עמידה ביעדים'
    ],
    keywords: YES_KEYWORDS,
    idealCandidate: 'מועמד/ת עם אוריינטציה מכירתית, כושר ביטוי ושכנוע, ניסיון במכירות או שירות לקוחות, יכולת עבודה בסביבה ממוחשבת, הישגיות ותחרותיות. מתאים גם לחסרי ניסיון עם מוטיבציה גבוהה!',
    lastAnalyzed: new Date().toISOString()
  }
}

function buildCustomerServiceAIProfile(position: any) {
  return {
    role: position.title,
    industry: 'שירות לקוחות ומוקדים',
    location: position.location,
    experience: 'ניסיון בשירות לקוחות או מכירות - יתרון משמעותי, מתאים גם ללא ניסיון',
    skills: [
      'שירות לקוחות', 'תקשורת בינאישית', 'עבודה בסביבה ממוחשבת',
      'סבלנות', 'יכולת הקשבה', 'פתרון בעיות', 'מולטי-טאסקינג', 'עבודה תחת לחץ'
    ],
    keywords: CUSTOMER_SERVICE_KEYWORDS,
    idealCandidate: 'מועמד/ת עם תודעת שירות גבוהה, סבלנות ויכולת הקשבה, ניסיון בשירות לקוחות או מכירות - יתרון, יכולת עבודה בסביבה ממוחשבת',
    lastAnalyzed: new Date().toISOString()
  }
}

export async function GET() {
  try {
    const results = {
      tagsCreated: 0,
      yesUpdated: 0,
      customerServiceUpdated: 0
    }

    // 1. יצירת תגיות
    const allTags = ['שירות לקוחות', 'מוקד', 'טלמרקטינג', 'משרה מלאה', 'לידים', 'עמלות', 'מכירות', 'yes', 'נשר', 'צפון', 'באר שבע', 'דרום']
    
    for (const tagName of allTags) {
      await prisma.tag.upsert({
        where: { name: tagName },
        update: { color: TAG_COLORS[tagName] || '#6B7280' },
        create: { name: tagName, color: TAG_COLORS[tagName] || '#6B7280' }
      })
      results.tagsCreated++
    }

    // 2. עדכון משרות YES
    const yesEmployer = await prisma.employer.findFirst({
      where: { name: { contains: 'YES', mode: 'insensitive' } }
    })

    if (yesEmployer) {
      const yesPositions = await prisma.position.findMany({
        where: { employerId: yesEmployer.id, active: true },
        include: { employer: true }
      })

      for (const position of yesPositions) {
        const region = position.location?.includes('נשר') ? 'צפון' : 
                       position.location?.includes('באר שבע') ? 'דרום' : 'מרכז'
        
        const yesTags = ['מכירות', 'שירות לקוחות', 'מוקד', 'טלמרקטינג', 'לידים', 'עמלות', 'yes', 'משרה מלאה']
        if (region === 'צפון') yesTags.push('נשר', 'צפון')
        if (region === 'דרום') yesTags.push('באר שבע', 'דרום')

        await prisma.position.update({
          where: { id: position.id },
          data: {
            keywords: JSON.stringify(YES_KEYWORDS),
            aiProfile: JSON.stringify(buildYESAIProfile(position)),
            tags: {
              set: [],
              connect: yesTags.map(name => ({ name }))
            }
          }
        })
        results.yesUpdated++
      }
    }

    // 3. עדכון משרות שירות לקוחות כלליות
    const customerServicePositions = await prisma.position.findMany({
      where: {
        active: true,
        OR: [
          { title: { contains: 'שירות', mode: 'insensitive' } },
          { title: { contains: 'נציג', mode: 'insensitive' } },
          { title: { contains: 'מוקד', mode: 'insensitive' } },
          { title: { contains: 'לקוחות', mode: 'insensitive' } },
          { description: { contains: 'שירות לקוחות', mode: 'insensitive' } }
        ],
        NOT: [
          { title: { contains: 'טלר', mode: 'insensitive' } },
          { title: { contains: 'בנקאי', mode: 'insensitive' } },
          { employer: { name: { contains: 'מזרחי', mode: 'insensitive' } } },
          { employer: { name: { contains: 'YES', mode: 'insensitive' } } }
        ]
      },
      include: { employer: true }
    })

    for (const position of customerServicePositions) {
      const tags = ['שירות לקוחות', 'מוקד', 'משרה מלאה']
      if (position.title?.includes('מכירות') || position.description?.includes('מכירות')) {
        tags.push('מכירות', 'עמלות')
      }

      await prisma.position.update({
        where: { id: position.id },
        data: {
          keywords: JSON.stringify(CUSTOMER_SERVICE_KEYWORDS),
          aiProfile: JSON.stringify(buildCustomerServiceAIProfile(position)),
          tags: {
            connect: tags.map(name => ({ name }))
          }
        }
      })
      results.customerServiceUpdated++
    }

    return NextResponse.json({
      success: true,
      message: 'עדכון מילות מפתח לשירות לקוחות הושלם!',
      results
    })

  } catch (error) {
    console.error('Error updating customer service keywords:', error)
    return NextResponse.json({ error: 'שגיאה בעדכון' }, { status: 500 })
  }
}
