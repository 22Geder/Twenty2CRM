import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

const MAX_RECIPIENTS = 50 // מקסימום 50 נמענים

// POST /api/send-bulk-email - שליחת מייל המונית
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipients, subject, message, positionId, positionTitle } = await request.json()

    // בדיקות
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required" },
        { status: 400 }
      )
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECIPIENTS} recipients allowed per batch` },
        { status: 400 }
      )
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    // סינון נמענים שביקשו הסרה
    const recipientEmails = recipients
      .filter(r => r.email)
      .map(r => r.email.toLowerCase())

    const unsubscribedCandidates = await prisma.candidate.findMany({
      where: {
        email: { in: recipientEmails },
        unsubscribed: true
      },
      select: { email: true }
    })

    const unsubscribedEmails = new Set(
      unsubscribedCandidates.map(c => c.email?.toLowerCase())
    )

    const filteredRecipients = recipients.filter(
      r => r.email && !unsubscribedEmails.has(r.email.toLowerCase())
    )

    if (filteredRecipients.length === 0) {
      return NextResponse.json(
        { error: "All recipients have unsubscribed from mailings" },
        { status: 400 }
      )
    }

    // יצירת transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
      },
    })

    const results = {
      successful: [] as string[],
      failed: [] as { email: string; error: string }[],
      skippedUnsubscribed: unsubscribedEmails.size
    }

    // שליחה במקביל (batches של 10)
    const batchSize = 10
    for (let i = 0; i < filteredRecipients.length; i += batchSize) {
      const batch = filteredRecipients.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (recipient: any) => {
        try {
          // יצירת הודעה מותאמת אישית
          const personalizedMessage = message
            .replace(/{name}/g, recipient.name || 'לקוח יקר')
            .replace(/{position}/g, positionTitle || 'משרה')
            .replace(/{email}/g, recipient.email)

          const personalizedSubject = subject
            .replace(/{name}/g, recipient.name || '')
            .replace(/{position}/g, positionTitle || 'משרה')

          // הוספת לינק הסרה בתחתית המייל
          const unsubscribeLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(recipient.email)}`
          
          const htmlMessage = `
            <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
              ${personalizedMessage.replace(/\n/g, '<br>')}
              <br><br>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                להסרה מרשימת התפוצה, 
                <a href="${unsubscribeLink}" style="color: #666;">לחץ כאן</a>
              </p>
            </div>
          `

          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER,
            to: recipient.email,
            subject: personalizedSubject,
            html: htmlMessage,
          })

          results.successful.push(recipient.name || recipient.email)

          // לוג פעילות
          if (recipient.candidateId && session.user?.id) {
            await prisma.activityLog.create({
              data: {
                type: 'BULK_EMAIL_SENT',
                description: `נשלח מייל המוני: ${personalizedSubject}`,
                userId: session.user.id
              }
            }).catch(() => {}) // Ignore if activity log fails
          }
        } catch (error: any) {
          console.error(`Failed to send email to ${recipient.email}:`, error)
          results.failed.push({
            email: recipient.email,
            error: error.message,
          })
        }
      }))

      // השהייה קטנה בין batches כדי לא לחסום
      if (i + batchSize < filteredRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      message: "Bulk email sending completed",
      results,
      total: recipients.length,
      sent: results.successful.length,
      failed: results.failed.length,
      skippedUnsubscribed: results.skippedUnsubscribed
    })
  } catch (error) {
    console.error("Error sending bulk email:", error)
    return NextResponse.json(
      { error: "Failed to send bulk email" },
      { status: 500 }
    )
  }
}
