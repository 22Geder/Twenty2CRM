import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/positions/update-yes-benefits
 * עדכון תנאים לכל המשרות של YES
 */
export async function POST(request: NextRequest) {
  // Allow temporary admin access with secret key
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('key')
  
  if (adminKey !== 'twenty2yes2026') {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    console.log('🔍 מחפש את YES...')
    
    // מצא את כל המעסיקים של YES
    const yesEmployers = await prisma.employer.findMany({
      where: {
        OR: [
          { name: { contains: 'YES', mode: 'insensitive' } },
          { name: { contains: 'yes', mode: 'insensitive' } },
          { name: { contains: 'יס' } }
        ]
      }
    })
    
    console.log(`📋 נמצאו ${yesEmployers.length} מעסיקים של YES`)
    
    if (yesEmployers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'לא נמצאו מעסיקים של YES' 
      })
    }
    
    const employerIds = yesEmployers.map(e => e.id)
    
    // עדכון התנאים לכל המשרות של YES
    const benefits = `קרן השתלמות אחרי 3 שנות ותק, עובדי חברה מהיום הראשון, ארוחת צהריים מסובסדת (תן ביס) 41 ש"ח ליום, מתנות בחגים, נופש חברה (בוותק מסוים)`
    
    const result = await prisma.position.updateMany({
      where: {
        employerId: { in: employerIds }
      },
      data: {
        benefits: benefits
      }
    })
    
    // שלוף את המשרות שעודכנו
    const updatedPositions = await prisma.position.findMany({
      where: { employerId: { in: employerIds } },
      select: { id: true, title: true, benefits: true }
    })
    
    console.log(`✅ עודכנו ${result.count} משרות של YES`)
    
    return NextResponse.json({
      success: true,
      message: `עודכנו ${result.count} משרות של YES עם התנאים החדשים`,
      employers: yesEmployers.map(e => e.name),
      positionsUpdated: result.count,
      positions: updatedPositions
    })

  } catch (error: any) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json(
      { error: 'Failed to update YES benefits', details: error.message },
      { status: 500 }
    )
  }
}

// גם GET לנוחות
export async function GET(request: NextRequest) {
  return POST(request)
}
