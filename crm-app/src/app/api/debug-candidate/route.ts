import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API לדיבוג מועמד
 * GET /api/debug-candidate?name=נסר&phone=0586336399
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || ''
  const phone = searchParams.get('phone') || ''

  try {
    // חיפוש מועמד
    const candidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { name: { contains: name } },
          { phone: { contains: phone } },
          { phone: { contains: phone.replace(/^0/, '') } }
        ]
      },
      include: {
        tags: true
      },
      take: 10
    })

    if (candidates.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'לא נמצא מועמד עם הפרטים האלה',
        searchedFor: { name, phone }
      })
    }

    // בדיקת התאמה לטלימאן
    const teliman = await prisma.position.findFirst({
      where: {
        OR: [
          { title: { contains: 'טלימאן' } },
          { title: { contains: 'טלמן' } }
        ]
      },
      include: { tags: true }
    })

    const results = candidates.map(c => ({
      id: c.id,
      name: c.name,
      city: c.city || '*** לא הוזנה עיר! ***',
      phone: c.phone,
      email: c.email,
      tags: c.tags.map(t => t.name),
      createdAt: c.createdAt
    }))

    // בדיקת לוגיקת מיקום
    function areNearbyLocations(city1: string, city2: string): boolean {
      const nearbyGroups = [
        ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נשר', 'טירת כרמל', 
         'שפרעם', 'עכו', 'נהריה', 'כרמיאל', 'טמרה', 'אום אל פחם', 'סחנין', 'עראבה', 'דיר חנא',
         'מגאר', 'כאבול', 'דאלית אל כרמל', 'עוספיא', 'יקנעם', 'נצרת', 'נוף הגליל'],
      ]
      
      for (const group of nearbyGroups) {
        const normalizedGroup = group.map(g => g.toLowerCase())
        const match1 = normalizedGroup.some(g => city1.includes(g) || g.includes(city1))
        const match2 = normalizedGroup.some(g => city2.includes(g) || g.includes(city2))
        if (match1 && match2) return true
      }
      return false
    }

    const locationAnalysis = candidates.map(c => {
      const candidateCity = (c.city || '').toLowerCase()
      const positionLocation = (teliman?.location || '').toLowerCase()
      
      const exactMatch = positionLocation.includes(candidateCity) || candidateCity.includes(positionLocation)
      const nearbyMatch = areNearbyLocations(candidateCity, positionLocation)
      
      let score = 0
      let reason = ''
      if (!c.city) {
        score = 15
        reason = 'אין עיר למועמד - ציון בסיסי'
      } else if (exactMatch) {
        score = 50
        reason = 'התאמה מדויקת'
      } else if (nearbyMatch) {
        score = 40
        reason = 'עיר קרובה'
      } else {
        score = 0
        reason = 'לא באזור'
      }
      
      return {
        candidateName: c.name,
        candidateCity: c.city || 'לא הוזנה',
        positionLocation: teliman?.location || 'לא נמצאה משרה',
        locationScore: score,
        reason
      }
    })

    return NextResponse.json({
      found: true,
      candidates: results,
      teliman: teliman ? {
        title: teliman.title,
        location: teliman.location,
        active: teliman.active,
        tagsCount: teliman.tags.length
      } : null,
      locationAnalysis,
      hint: 'אם אין עיר למועמד - צריך לעדכן אותו!'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: String(error) 
    }, { status: 500 })
  }
}
