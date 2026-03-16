import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/positions/update-ofir-tags
 * עדכון תגיות למשרת אופיר סוכנויות ביטוח - 30 תגיות!
 */

// 30 תגיות למשרת מכירות ביטוח
const EXPANDED_INSURANCE_TAGS = [
  // ביטוח
  'ביטוח', 'insurance', 'סוכן ביטוח', 'פוליסה', 'פוליסות',
  'ביטוח חיים', 'ביטוח בריאות', 'ביטוח משכנתא', 'כיסוי ביטוחי',
  
  // מכירות
  'מכירות', 'sales', 'מכירות טלפוניות', 'telesales', 'טלמרקטינג',
  'נציג מכירות', 'איש מכירות', 'אשת מכירות', 'מכירות B2C',
  
  // כישורים
  'שכנוע', 'משא ומתן', 'negotiation', 'סגירת עסקאות', 'closing',
  'לידים', 'leads', 'יעדים', 'targets', 'עמלות', 'commission',
  
  // שירות
  'שירות לקוחות', 'customer service', 'תודעת שירות', 'יחסי אנוש',
  
  // פיננסי
  'פיננסי', 'finance', 'פנסיה', 'pension', 'חסכון', 'השקעות',
  
  // מיקום ותנאים
  'אשדוד', 'דרום', 'משרה מלאה', 'קידום', 'אווירה משפחתית',
  'שכר גבוה', 'בונוסים', 'טיסות', 'רווחה'
]

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()
    
    if (adminKey !== 'twenty2ofir2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🛡️ מעדכן תגיות למשרת אופיר ביטוח...')

    // מציאת מעסיק אופיר
    const employer = await prisma.employer.findFirst({
      where: {
        OR: [
          { name: { contains: 'אופיר' } },
          { name: { contains: 'Ofir' } }
        ]
      }
    })

    if (!employer) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    // מציאת המשרה
    const position = await prisma.position.findFirst({
      where: { employerId: employer.id },
      include: { tags: true }
    })

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    // יצירת כל התגיות
    const tags = await Promise.all(
      EXPANDED_INSURANCE_TAGS.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    )
    const tagIds = tags.map(t => t.id)

    // עדכון המשרה עם התגיות החדשות
    const updatedPosition = await prisma.position.update({
      where: { id: position.id },
      data: {
        tags: { set: tagIds.map(id => ({ id })) }
      },
      include: { tags: true }
    })

    return NextResponse.json({
      success: true,
      message: `עודכנו ${tagIds.length} תגיות למשרת ${position.title}`,
      position: {
        id: updatedPosition.id,
        title: updatedPosition.title,
        tagsCount: updatedPosition.tags.length,
        tags: updatedPosition.tags.map(t => t.name)
      }
    })

  } catch (error) {
    console.error('❌ Error updating Ofir tags:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update tags', details: errorMessage },
      { status: 500 }
    )
  }
}
