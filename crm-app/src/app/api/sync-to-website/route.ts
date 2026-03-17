/**
 * 🔄 API Route: Sync Positions to Twenty2Jobs Website
 * 
 * POST /api/sync-to-website - סנכרון כל המשרות הפעילות
 * POST /api/sync-to-website?positionId=xxx - סנכרון משרה בודדת
 * GET /api/sync-to-website - בדיקת סטטוס החיבור
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  syncPositionToWebsite,
  syncAllPositions,
  syncEmployerPositions,
  checkWebsiteConnection,
  getSyncedPositions,
  deactivatePositionOnWebsite,
} from '@/lib/twenty2jobs-sync'

// GET - בדיקת סטטוס ומידע
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // בדיקת חיבור
    if (action === 'status') {
      const result = await checkWebsiteConnection()
      return NextResponse.json(result)
    }

    // קבלת משרות מסונכרנות
    if (action === 'synced') {
      const result = await getSyncedPositions()
      return NextResponse.json(result)
    }

    // ברירת מחדל - סטטוס חיבור
    const result = await checkWebsiteConnection()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error in sync GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - ביצוע סנכרון
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, positionId, employerId, onlyActive = true } = body

    // סנכרון משרה בודדת
    if (action === 'single' && positionId) {
      console.log(`🔄 מסנכרן משרה בודדת: ${positionId}`)
      const result = await syncPositionToWebsite(positionId)
      return NextResponse.json(result)
    }

    // השבתת משרה
    if (action === 'deactivate' && positionId) {
      console.log(`🚫 משבית משרה באתר: ${positionId}`)
      const result = await deactivatePositionOnWebsite(positionId)
      return NextResponse.json(result)
    }

    // סנכרון משרות של מעסיק
    if (action === 'employer' && employerId) {
      console.log(`🔄 מסנכרן משרות של מעסיק: ${employerId}`)
      const result = await syncEmployerPositions(employerId)
      return NextResponse.json(result)
    }

    // סנכרון כל המשרות
    if (action === 'all' || !action) {
      console.log(`🔄 מסנכרן את כל המשרות ${onlyActive ? 'הפעילות' : ''}...`)
      const result = await syncAllPositions(onlyActive)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Error in sync POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
