import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Sela work hours data
const selaWorkHours = [
  { title: "מלגזן היגש", location: "בני דרום", contactName: "Pninit", workHours: "08:00-17:00" },
  { title: "פקיד", location: "בני דרום", contactName: "Pninit", workHours: "08:00-17:00" },
  { title: "פקיד", location: "חפץ חיים", contactName: "Pninit", workHours: "08:00-17:00" },
  { title: "מלקט", location: "אשדוד", contactName: "Pninit", workHours: "08:00-17:00" },
  { title: "מחסנאי", location: "אשדוד", contactName: "Pninit", workHours: "16:30-01:30" },
  { title: "מלגזן היגש", location: "אשדוד", contactName: "Pninit", workHours: "08:00-17:00" },
  { title: "בקר", location: "אשדוד", contactName: "Pninit", workHours: "06:00-12:00" },
  { title: "בקר", location: "בית שמש", contactName: "Pninit", workHours: "06:30-15:30" },
  { title: "נציג", location: "אשדוד", contactName: "Dana", workHours: "13:00-20:00" },
  { title: "רפרנט", location: "בית שמש", contactName: "Dana", workHours: "06:00-15:00" },
  { title: "סדרן", location: "אשדוד", contactName: "Dana", workHours: "06:00-16:00" },
  { title: "סדרן", location: "בית שמש", contactName: "Dana", workHours: "06:00-16:00" },
  { title: "רפרנט", location: "מבקיעים", contactName: "Dana", workHours: "05:00-14:00" },
  { title: "נציג לקוח", location: "אשדוד", contactName: "Dana", workHours: "08:00-17:00" },
]

// GET /api/positions/update-work-hours - עדכון שעות עבודה לסלע (one-time)
export async function GET() {
  try {
    const results = []
    
    for (const update of selaWorkHours) {
      const { title, location, contactName, workHours } = update
      
      // חיפוש גמיש
      const positions = await prisma.position.findMany({
        where: {
          AND: [
            contactName ? { contactName: { contains: contactName } } : {},
            title ? {
              OR: [
                { title: { contains: title } },
                { title: { contains: title.replace('/', '') } },
              ]
            } : {},
            location ? {
              OR: [
                { location: { contains: location } },
                { location: { contains: location.split('-')[0].trim() } },
              ]
            } : {}
          ]
        },
        select: { id: true, title: true, location: true, workHours: true, contactName: true }
      })

      for (const position of positions) {
        await prisma.position.update({
          where: { id: position.id },
          data: { workHours }
        })
        results.push({
          status: 'updated',
          title: position.title,
          location: position.location,
          contactName: position.contactName,
          workHours
        })
      }
      
      if (positions.length === 0) {
        results.push({
          status: 'not_found',
          title,
          location,
          contactName
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      updated: results.filter(r => r.status === 'updated').length,
      notFound: results.filter(r => r.status === 'not_found').length
    })
  } catch (error) {
    console.error('Error updating work hours:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}

// POST /api/positions/update-work-hours
// עדכון שעות עבודה למשרות
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { updates } = await request.json()
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates must be an array' }, { status: 400 })
    }

    const results = []
    
    for (const update of updates) {
      const { title, location, contactName, workHours } = update
      
      // חיפוש גמיש
      const positions = await prisma.position.findMany({
        where: {
          AND: [
            contactName ? { contactName: { contains: contactName } } : {},
            title ? {
              OR: [
                { title: { contains: title } },
                { title: { contains: title.replace('/', '') } },
              ]
            } : {},
            location ? {
              OR: [
                { location: { contains: location } },
                { location: { contains: location.split('-')[0].trim() } },
              ]
            } : {}
          ]
        },
        select: { id: true, title: true, location: true, workHours: true }
      })

      for (const position of positions) {
        await prisma.position.update({
          where: { id: position.id },
          data: { workHours }
        })
        results.push({
          status: 'updated',
          title: position.title,
          location: position.location,
          workHours
        })
      }
      
      if (positions.length === 0) {
        results.push({
          status: 'not_found',
          title,
          location,
          contactName
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      updated: results.filter(r => r.status === 'updated').length,
      notFound: results.filter(r => r.status === 'not_found').length
    })
  } catch (error) {
    console.error('Error updating work hours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
