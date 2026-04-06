import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// תגיות רלוונטיות לאושפיר - שילוח בינלאומי
const OSHPIR_TAGS = [
  // תחום שילוח בינלאומי
  'שילוח בינלאומי',
  'יבוא',
  'יצוא',
  'מכס',
  'סוכן מכס',
  'ספנות',
  'תיאום שילוח',
  // כישורים
  'אנגלית',
  'אנגלית ברמה גבוהה',
  'פוקוס',
  'תוכנת פוקוס',
  'תיאום',
  'אדמיניסטרציה',
  'עבודה מול ספקים',
  'עבודה מול לקוחות',
  'תיעוד',
  // מיקום / כללי
  'חיפה',
  'צפון',
  'משרה מלאה',
]

const IMPORT_KEYWORDS = JSON.stringify([
  'שילוח בינלאומי', 'יבוא', 'ייבוא', 'מתאם יבוא', 'סוכן מכס', 'מכס',
  'ספנות', 'חברות ספנות', 'פוקוס', 'אנגלית', 'חיפה', 'תיאום', 'אדמיניסטרציה',
  'עבודה מול ספקים', 'קרוב אוניות', 'Import coordinator', 'freight forwarding',
])

const EXPORT_KEYWORDS = JSON.stringify([
  'שילוח בינלאומי', 'יצוא', 'ייצוא', 'מתאם יצוא', 'סוכן מכס', 'מכס',
  'ספנות', 'חברות ספנות', 'פוקוס', 'אנגלית', 'חיפה', 'תיאום', 'אדמיניסטרציה',
  'עבודה מול ספקים', 'Export coordinator', 'freight forwarding',
])

export async function POST() {
  try {
    // 1. מצא מעסיק אושפיר
    const employer = await prisma.employer.findFirst({
      where: { name: { contains: 'אושפיר', mode: 'insensitive' } },
    })

    if (!employer) {
      return NextResponse.json({ error: 'מעסיק אושפיר לא נמצא במערכת' }, { status: 404 })
    }

    // 2. מצא את כל משרות אושפיר
    const positions = await prisma.position.findMany({
      where: { employerId: employer.id },
      include: { tags: true },
    })

    if (positions.length === 0) {
      return NextResponse.json({ error: 'לא נמצאו משרות עבור אושפיר' }, { status: 404 })
    }

    // 3. בנה connectOrCreate לכל התגיות
    const tagConnects = {
      connectOrCreate: OSHPIR_TAGS.map(tag => ({
        where: { name: tag },
        create: { name: tag, color: '#0ea5e9' }, // כחול ים לשילוח בינלאומי
      })),
    }

    // 4. עדכן כל משרה — תגיות + קלוורדס + active + aiProfile
    const updated: string[] = []

    for (const pos of positions) {
      const isImport = pos.title.includes('יבוא') || pos.title.toLowerCase().includes('import')
      const keywords = isImport ? IMPORT_KEYWORDS : EXPORT_KEYWORDS

      await prisma.position.update({
        where: { id: pos.id },
        data: {
          active: true,
          keywords,
          workHours: 'משרה מלאה',
          contactName: 'ריקי כהן',
          contactEmail: 'oshpir@oshpir.co.il',
          aiProfile: JSON.stringify({
            summary: `תפקיד ${isImport ? 'מתאם/ת יבוא' : 'מתאם/ת יצוא'} בחברת שילוח בינלאומי אושפיר חיפה. נדרש ניסיון בשילוח ואנגלית ברמה גבוהה.`,
            skills: ['שילוח בינלאומי', isImport ? 'יבוא' : 'יצוא', 'מכס', 'ספנות', 'אנגלית', 'פוקוס', 'תיאום'],
            field: 'שילוח_בינלאומי',
            level: 'מנוסה',
            location: 'חיפה',
          }),
          tags: tagConnects,
        },
      })

      updated.push(pos.title)
    }

    return NextResponse.json({
      success: true,
      employer: employer.name,
      updated: updated.length,
      positions: updated,
      tagsAdded: OSHPIR_TAGS.length,
      tags: OSHPIR_TAGS,
    })
  } catch (error) {
    console.error('sync-oshpir-tags error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
