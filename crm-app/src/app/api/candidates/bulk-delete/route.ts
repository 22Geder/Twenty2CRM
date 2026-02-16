import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// 🆕 מחיקה המונית של מועמדים
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'נדרש מערך של מזהי מועמדים' },
        { status: 400 }
      )
    }

    // הגבלת מספר המועמדים למחיקה בפעם אחת
    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'ניתן למחוק עד 100 מועמדים בפעם אחת' },
        { status: 400 }
      )
    }

    // מחיקת כל הנתונים הקשורים למועמדים
    // הסדר חשוב בגלל foreign keys
    
    // 1. מחיקת ראיונות
    await prisma.interview.deleteMany({
      where: { candidateId: { in: ids } }
    })
    
    // 2. מחיקת מועמדויות
    await prisma.application.deleteMany({
      where: { candidateId: { in: ids } }
    })
    
    // 3. מחיקת הערות
    await prisma.note.deleteMany({
      where: { candidateId: { in: ids } }
    })
    
    // 4. מחיקת קשרי תגיות (דרך SQL ישיר כי זה many-to-many)
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "_CandidateToTag" 
        WHERE "A" = ANY($1::text[])
      `, ids)
    } catch {
      // אם הטבלה לא קיימת או יש שגיאה - ממשיכים
      console.log('Note: Could not delete tag relations')
    }
    
    // 5. מחיקת המועמדים עצמם
    const result = await prisma.candidate.deleteMany({
      where: { id: { in: ids } }
    })

    console.log(`✅ נמחקו ${result.count} מועמדים`)
    
    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `נמחקו ${result.count} מועמדים בהצלחה`
    })

  } catch (error) {
    console.error('❌ שגיאה במחיקה המונית:', error)
    return NextResponse.json(
      { error: 'שגיאה במחיקה המונית' },
      { status: 500 }
    )
  }
}
