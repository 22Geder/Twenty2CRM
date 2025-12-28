import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Gmail Webhook - מקבל נוטיפיקציות על מיילים חדשים
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Gmail שולח notification עם historyId
    const { message } = body
    if (!message?.data) {
      return NextResponse.json({ received: true })
    }

    // Decode the message
    const decodedData = Buffer.from(message.data, 'base64').toString()
    const notification = JSON.parse(decodedData)
    
    console.log('Gmail notification received:', notification)

    // כאן נבדוק מיילים חדשים
    await checkNewEmails()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gmail webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// בדיקת מיילים חדשים
async function checkNewEmails() {
  try {
    // כאן נשתמש ב-Gmail API לבדיקת מיילים
    // לעת עתה נחזיר success
    console.log('Checking for new emails...')
    return true
  } catch (error) {
    console.error('Error checking emails:', error)
    return false
  }
}

// GET - לבדיקת סטטוס המערכת
export async function GET() {
  return NextResponse.json({
    status: 'active',
    webhook: 'gmail-auto-import',
    message: 'Gmail webhook is ready to receive notifications'
  })
}