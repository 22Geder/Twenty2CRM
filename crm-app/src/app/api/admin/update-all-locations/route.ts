import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/update-all-locations
 * עדכון מיקומים של משרות קיימות לפורמט מרובה ערים
 */
export async function GET() {
  try {
    console.log('🔧 מעדכן מיקומי משרות...')

    const updates: { title: string; oldLocation: string; newLocation: string }[] = []
    const debug: string[] = []

    // מצא את כל המשרות של אופרייט
    const uprightPositions = await prisma.position.findMany({
      where: { 
        employer: { 
          OR: [
            { name: { contains: 'אופרייט' } },
            { name: { contains: 'Operait' } }
          ]
        }
      },
      include: { employer: true }
    })
    debug.push(`Found ${uprightPositions.length} Upright positions`)

    // עדכון ידני של כל משרת אופרייט
    for (const pos of uprightPositions) {
      const loc = (pos.location || '').toLowerCase()
      let newLoc = pos.location
      
      if (loc.includes('גלילות') && !loc.includes('תל אביב')) {
        newLoc = 'גלילות, תל אביב, רמת השרון, הרצליה, רעננה'
      } else if (loc.includes('חדרה') && !loc.includes('נתניה')) {
        newLoc = 'חדרה, נתניה, כפר יונה, פרדס חנה'
      }
      
      if (newLoc !== pos.location) {
        await prisma.position.update({
          where: { id: pos.id },
          data: { location: newLoc }
        })
        updates.push({ title: pos.title, oldLocation: pos.location || '', newLocation: newLoc })
      }
    }

    // מצא את כל המשרות של סלע
    const selaPositions = await prisma.position.findMany({
      where: { 
        employer: { name: { contains: 'סלע' } }
      }
    })
    debug.push(`Found ${selaPositions.length} Sela positions`)

    // עדכון ידני של משרות סלע עם מיקומים קטנים
    for (const pos of selaPositions) {
      const loc = (pos.location || '').toLowerCase()
      let newLoc = pos.location
      
      // עדכון רק אם אין כבר ערים נוספות
      if (loc === 'בני דרום' || (loc.includes('בני דרום') && !loc.includes('אשדוד'))) {
        newLoc = 'בני דרום, אשדוד, אשקלון, קריית גת'
      } else if (loc === 'חפץ חיים' || (loc.includes('חפץ חיים') && !loc.includes('אשדוד'))) {
        newLoc = 'חפץ חיים, קריית מלאכי, גדרה, אשדוד'
      } else if ((loc === 'מבקיעים' || loc.includes('מבקיעים')) && !loc.includes('אשקלון')) {
        newLoc = 'מבקיעים, אשקלון, קריית גת, שדרות'
      }
      
      if (newLoc !== pos.location) {
        await prisma.position.update({
          where: { id: pos.id },
          data: { location: newLoc }
        })
        updates.push({ title: pos.title, oldLocation: pos.location || '', newLocation: newLoc })
      }
    }

    return NextResponse.json({
      success: true,
      message: `עודכנו ${updates.length} משרות`,
      debug,
      updates
    })

  } catch (error) {
    console.error('Error updating locations:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update locations', details: errorMessage },
      { status: 500 }
    )
  }
}
