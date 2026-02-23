import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API לעדכון מילות מפתח של משרות נמל - הוספת "עובדים כלליים"
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  
  if (key !== 'twenty2port2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results: any[] = []
    
    // 1. עדכון משרות נמל בחיפה - קשרי גל ים
    // טלימאן + סוורים + אתתים + פינרים בחיפה
    const haifaPositions = await prisma.position.findMany({
      where: {
        OR: [
          { title: { contains: 'טלמן' } },
          { title: { contains: 'טלימאן' } },
          { title: { contains: 'סוור' } },
          { title: { contains: 'אתת' } },
          { title: { contains: 'פינר' } },
          { title: { contains: 'לאשינג' } }
        ],
        location: { contains: 'חיפה' }
      }
    })
    
    for (const pos of haifaPositions) {
      let keywords: string[] = []
      try {
        keywords = pos.keywords ? JSON.parse(pos.keywords) : []
      } catch { keywords = [] }
      
      // הוספת מילות מפתח לעובדים כלליים
      const newKeywords = [
        'עובדים כלליים',
        'עבודה כללית', 
        'עבודה פיזית',
        'עובד כללי',
        'עובדת כללית',
        'ללא ניסיון',
        'עובד נמל',
        'עבודת נמל',
        'חיפה',
        'נמל חיפה'
      ]
      
      for (const kw of newKeywords) {
        if (!keywords.includes(kw)) {
          keywords.push(kw)
        }
      }
      
      await prisma.position.update({
        where: { id: pos.id },
        data: { keywords: JSON.stringify(keywords) }
      })
      
      results.push({
        id: pos.id,
        title: pos.title,
        location: pos.location,
        addedKeywords: newKeywords.filter(k => !keywords.includes(k))
      })
    }
    
    // 2. עדכון משרות נמל באשדוד - סוורים, אתתים, פינרים
    const ashdodPositions = await prisma.position.findMany({
      where: {
        OR: [
          { title: { contains: 'סוור' } },
          { title: { contains: 'אתת' } },
          { title: { contains: 'פינר' } },
          { title: { contains: 'לאשינג' } }
        ],
        location: { contains: 'אשדוד' }
      }
    })
    
    for (const pos of ashdodPositions) {
      let keywords: string[] = []
      try {
        keywords = pos.keywords ? JSON.parse(pos.keywords) : []
      } catch { keywords = [] }
      
      // הוספת מילות מפתח לעובדים כלליים באשדוד
      const newKeywords = [
        'עובדים כלליים',
        'עבודה כללית',
        'עבודה פיזית', 
        'עובד כללי',
        'עובדת כללית',
        'ללא ניסיון',
        'עובד נמל',
        'עבודת נמל',
        'אשדוד',
        'נמל אשדוד',
        'סוור',
        'פינר'
      ]
      
      for (const kw of newKeywords) {
        if (!keywords.includes(kw)) {
          keywords.push(kw)
        }
      }
      
      await prisma.position.update({
        where: { id: pos.id },
        data: { keywords: JSON.stringify(keywords) }
      })
      
      results.push({
        id: pos.id,
        title: pos.title,
        location: pos.location,
        addedKeywords: newKeywords.filter(k => !keywords.includes(k))
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'עודכנו מילות מפתח למשרות נמל',
      updatedCount: results.length,
      positions: results
    })
    
  } catch (error: any) {
    console.error('Error updating port keywords:', error)
    return NextResponse.json({ 
      error: 'שגיאה בעדכון מילות מפתח', 
      details: error.message 
    }, { status: 500 })
  }
}
