import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import twilio from "twilio"

// POST /api/send-bulk-sms - שליחת SMS המונית
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipients, message, positionTitle } = await request.json()

    // בדיקות
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required" },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      )
    }

    const client = twilio(accountSid, authToken)

    const results = {
      successful: [] as string[],
      failed: [] as { phone: string; error: string }[],
    }

    // שליחה לכל נמען
    for (const recipient of recipients) {
      try {
        // נרמול מספר טלפון לפורמט בינלאומי
        let phone = recipient.phone.replace(/[^0-9]/g, '')
        
        // אם מתחיל ב-0, נסיר אותו ונוסיף 972
        if (phone.startsWith('0')) {
          phone = '972' + phone.substring(1)
        }
        
        // אם לא מתחיל ב-+, נוסיף
        if (!phone.startsWith('+')) {
          phone = '+' + phone
        }

        // יצירת הודעה מותאמת אישית
        const personalizedMessage = message
          .replace('{name}', recipient.name)
          .replace('{position}', positionTitle || 'המשרה')

        await client.messages.create({
          body: personalizedMessage,
          from: fromNumber,
          to: phone,
        })

        results.successful.push(recipient.name)
      } catch (error: any) {
        console.error(`Failed to send SMS to ${recipient.name}:`, error)
        results.failed.push({
          phone: recipient.phone,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: "Bulk SMS sending completed",
      results,
      total: recipients.length,
      successful: results.successful.length,
      failed: results.failed.length,
    })
  } catch (error) {
    console.error("Error sending bulk SMS:", error)
    return NextResponse.json(
      { error: "Failed to send bulk SMS" },
      { status: 500 }
    )
  }
}
