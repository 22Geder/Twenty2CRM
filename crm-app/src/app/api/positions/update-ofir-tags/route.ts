import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/positions/update-ofir-tags
 * עדכון תגיות נרחב למשרת סוכן ביטוח - אופיר
 */

// תגיות מורחבות - 30 תגיות למשרת מכירות ביטוח
const EXTENDED_INSURANCE_TAGS = [
  // מכירות כללי
  'מכירות', 'sales', 'נציג מכירות', 'איש מכירות', 'אשת מכירות',
  'מכירות טלפוניות', 'telesales', 'טלמרקטינג', 'telemarketing',
  'מוקד מכירות', 'call center', 'קול סנטר',
  
  // ביטוח
  'ביטוח', 'insurance', 'סוכן ביטוח', 'סוכנת ביטוח',
  'ביטוח חיים', 'ביטוח בריאות', 'ביטוח משכנתא',
  'פוליסות', 'פוליסה', 'תביעות',
  
  // פיננסי
  'פיננסי', 'finance', 'פיננסים', 'פנסיה', 'pension',
  'קרן השתלמות', 'גמל', 'השקעות', 'חיסכון',
  
  // מיומנויות מכירה
  'עמלות', 'commission', 'יעדים', 'targets', 'בונוסים',
  'לידים', 'leads', 'שכנוע', 'משא ומתן', 'negotiation',
  'סגירת עסקאות', 'closing', 'יחסי לקוחות',
  
  // תכונות
  'תקשורת', 'communication', 'שירות לקוחות', 'customer service',
  'יחסי אנוש', 'רעב להצלחה', 'הישגיות', 'מוטיבציה',
  
  // מיקום
  'אשדוד', 'דרום', 'south', 'משרה מלאה', 'full time'
]

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()
    
    if (adminKey !== 'twenty2ofir2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🛡️ מעדכן תגיות למשרת סוכן ביטוח - אופיר...')

    // מציאת המשרה
    const position = await prisma.position.findFirst({
      where: {
        title: { contains: 'מכירות ביטוח' }
      },
      include: { employer: true, tags: true }
    })

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    console.log(`✅ נמצאה משרה: ${position.title} (${position.employer?.name})`)

    // יצירת כל התגיות
    const tags = await Promise.all(
      EXTENDED_INSURANCE_TAGS.map(tagName => 
        prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        })
      )
    )
    
    console.log(`✅ נוצרו/עודכנו ${tags.length} תגיות`)

    // עדכון המשרה עם כל התגיות
    const updatedPosition = await prisma.position.update({
      where: { id: position.id },
      data: {
        tags: {
          set: tags.map(t => ({ id: t.id }))
        }
      },
      include: { tags: true, employer: true }
    })

    return NextResponse.json({
      success: true,
      message: `עודכנו ${tags.length} תגיות למשרת סוכן ביטוח`,
      position: {
        id: updatedPosition.id,
        title: updatedPosition.title,
        employer: updatedPosition.employer?.name,
        location: updatedPosition.location,
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
