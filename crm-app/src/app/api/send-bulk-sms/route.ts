import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import twilio from "twilio"

const MAX_RECIPIENTS = 50 // מקסימום 50 נמענים

// POST /api/send-bulk-sms - שליחת SMS המונית
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipients, message, positionTitle, positionId, includeUnsubscribeText = true } = await request.json()

    // בדיקות
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required" },
        { status: 400 }
      )
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `מקסימום ${MAX_RECIPIENTS} נמענים בכל שליחה` },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // סינון נמענים שביקשו הסרה
    const recipientPhones = recipients
      .filter(r => r.phone)
      .map(r => r.phone.replace(/[^0-9]/g, ''))

    const unsubscribedCandidates = await prisma.candidate.findMany({
      where: {
        OR: recipientPhones.map(phone => ({
          phone: { contains: phone.slice(-9) } // Last 9 digits
        })),
        unsubscribed: true
      },
      select: { phone: true }
    })

    const unsubscribedPhones = new Set(
      unsubscribedCandidates.map(c => c.phone?.replace(/[^0-9]/g, '').slice(-9))
    )

    const filteredRecipients = recipients.filter(r => {
      const normalizedPhone = r.phone?.replace(/[^0-9]/g, '').slice(-9)
      return normalizedPhone && !unsubscribedPhones.has(normalizedPhone)
    })

    if (filteredRecipients.length === 0) {
      return NextResponse.json(
        { error: "כל הנמענים ביקשו הסרה מרשימת התפוצה" },
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
      skippedUnsubscribed: unsubscribedPhones.size
    }

    // שליחה לכל נמען
    for (const recipient of filteredRecipients) {
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
        let personalizedMessage = message
          .replace(/{name}/g, recipient.name || '')
          .replace(/{position}/g, positionTitle || 'המשרה')

        // הוספת טקסט הסרה
        if (includeUnsubscribeText) {
          personalizedMessage += '\n\n🔕 להסרה השב 1'
        }

        await client.messages.create({
          body: personalizedMessage,
          from: fromNumber,
          to: phone,
        })

        results.successful.push(recipient.name || recipient.phone)

        // לוג פעילות
        if (recipient.candidateId) {
          await prisma.activityLog.create({
            data: {
              action: 'BULK_SMS_SENT',
              description: `נשלח SMS המוני: ${positionTitle || 'הודעה כללית'}`,
              candidateId: recipient.candidateId,
              positionId: positionId || undefined,
              userId: session.user?.id
            }
          }).catch(() => {}) // Ignore if activity log fails
        }
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
      sent: results.successful.length,
      failed: results.failed.length,
      skippedUnsubscribed: results.skippedUnsubscribed
    })
  } catch (error) {
    console.error("Error sending bulk SMS:", error)
    return NextResponse.json(
      { error: "Failed to send bulk SMS" },
      { status: 500 }
    )
  }
}
