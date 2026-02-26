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

    // עדכון משרות סלע - מיקומים קטנים
    const selaLocationUpdates: Record<string, string> = {
      'בני דרום': 'בני דרום, אשדוד, אשקלון, קריית גת',
      'חפץ חיים': 'חפץ חיים, קריית מלאכי, גדרה, אשדוד',
      'מבקיעים': 'מבקיעים, אשקלון, קריית גת, שדרות',
      'מבקיעים (לוגיסטים)': 'מבקיעים, אשקלון, קריית גת, שדרות',
    }

    for (const [oldLoc, newLoc] of Object.entries(selaLocationUpdates)) {
      const positions = await prisma.position.findMany({
        where: { 
          location: oldLoc,
          employer: { name: { contains: 'סלע' } }
        }
      })
      
      for (const pos of positions) {
        await prisma.position.update({
          where: { id: pos.id },
          data: { location: newLoc }
        })
        updates.push({ title: pos.title, oldLocation: oldLoc, newLocation: newLoc })
      }
    }

    // עדכון משרות אופרייט
    const uprightLocationUpdates: Record<string, string> = {
      'גלילות': 'גלילות, תל אביב, רמת השרון, הרצליה, רעננה',
      'חדרה': 'חדרה, נתניה, כפר יונה, פרדס חנה',
    }

    for (const [oldLoc, newLoc] of Object.entries(uprightLocationUpdates)) {
      const positions = await prisma.position.findMany({
        where: { 
          location: oldLoc,
          employer: { name: { contains: 'אופרייט' } }
        }
      })
      
      for (const pos of positions) {
        await prisma.position.update({
          where: { id: pos.id },
          data: { location: newLoc }
        })
        updates.push({ title: pos.title, oldLocation: oldLoc, newLocation: newLoc })
      }
    }

    return NextResponse.json({
      success: true,
      message: `עודכנו ${updates.length} משרות`,
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
