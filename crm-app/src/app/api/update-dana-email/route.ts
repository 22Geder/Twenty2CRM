import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// POST /api/update-dana-email - עדכון מייל של דנה שפירו
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 מעדכן מיילים של דנה בסלע לוגיסטיקה...')
    
    // עדכון משרות עם שם קשר של Dana לאימייל החדש
    const updated = await prisma.position.updateMany({
      where: {
        contactName: { contains: 'Dana', mode: 'insensitive' }
      },
      data: {
        contactEmail: 'danav@selabonded.co.il'
      }
    })
    
    console.log(`✅ עודכנו ${updated.count} משרות של דנה`)
    
    // הצגת המשרות שעודכנו
    const danaPositions = await prisma.position.findMany({
      where: {
        contactName: { contains: 'Dana', mode: 'insensitive' }
      },
      select: {
        id: true,
        title: true,
        contactName: true,
        contactEmail: true
      }
    })
    
    // הצגת משרות של פנינית (לאימות)
    const pninitPositions = await prisma.position.findMany({
      where: {
        contactName: { contains: 'Pninit', mode: 'insensitive' }
      },
      select: {
        id: true,
        title: true,
        contactName: true,
        contactEmail: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `✅ עודכנו ${updated.count} משרות של דנה`,
      danaPositions,
      pninitPositions
    })
    
  } catch (error) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json(
      { error: 'שגיאה בעדכון מיילים', details: String(error) },
      { status: 500 }
    )
  }
}
