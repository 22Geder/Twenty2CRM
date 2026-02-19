import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
