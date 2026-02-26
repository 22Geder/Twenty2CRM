import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API לדיבוג משרות אוטומוטיב/מאבחנים
 * GET /api/debug-automotive
 */
export async function GET(request: NextRequest) {
  try {
    // 1. מציאת כל משרות UNION/UMI/AVIS
    const automotivePositions = await prisma.position.findMany({
      where: {
        active: true,
        OR: [
          { employer: { name: { contains: 'UNION' } } },
          { employer: { name: { contains: 'UMI' } } },
          { employer: { name: { contains: 'AVIS' } } },
          { employer: { name: { contains: 'יוניון' } } },
          // גם תפקידים עם מאבחן בכותרת
          { title: { contains: 'מאבחן' } },
          { title: { contains: 'טכנאי רכב' } },
          { title: { contains: 'חשמלאי רכב' } },
          { title: { contains: 'תומך טכני' } },
          { keywords: { contains: 'דיאגנוסטיקה' } },
          { keywords: { contains: 'מאבחן' } }
        ]
      },
      include: {
        employer: true,
        tags: true
      }
    })

    // 2. מציאת מועמדים עם תגיות רכב
    const automotiveCandidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { tags: { some: { name: { contains: 'מאבחן' } } } },
          { tags: { some: { name: { contains: 'חשמלאי' } } } },
          { tags: { some: { name: { contains: 'רכב' } } } },
          { tags: { some: { name: { contains: 'דיאגנוסטיקה' } } } },
          { tags: { some: { name: { contains: 'מוסך' } } } },
        ]
      },
      include: { tags: true },
      take: 20
    })

    // 3. סיכום
    return NextResponse.json({
      automotivePositions: automotivePositions.map(p => ({
        id: p.id,
        title: p.title,
        employer: p.employer.name,
        location: p.location,
        tags: p.tags.map(t => t.name),
        keywords: p.keywords?.slice(0, 200) + '...'
      })),
      positionsCount: automotivePositions.length,
      
      automotiveCandidates: automotiveCandidates.map(c => ({
        id: c.id,
        name: c.name,
        city: c.city,
        tags: c.tags.map(t => t.name)
      })),
      candidatesCount: automotiveCandidates.length,

      message: `נמצאו ${automotivePositions.length} משרות אוטומוטיב ו-${automotiveCandidates.length} מועמדים עם רקע ברכב`
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
