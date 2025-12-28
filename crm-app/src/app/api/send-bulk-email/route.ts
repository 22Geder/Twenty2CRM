import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import nodemailer from "nodemailer"

// POST /api/send-bulk-email - שליחת מיילים המונית
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipients, subject, message, positionTitle } = await request.json()

    // בדיקות
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required" },
        { status: 400 }
      )
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    // הגדרות SMTP
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      return NextResponse.json(
        { error: "SMTP credentials not configured" },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport(smtpConfig)

    const results = {
      successful: [] as string[],
      failed: [] as { email: string; error: string }[],
    }

    // שליחה לכל נמען
    for (const recipient of recipients) {
      try {
        if (!recipient.email) {
          results.failed.push({
            email: recipient.name,
            error: "No email address",
          })
          continue
        }

        // יצירת הודעה מותאמת אישית
        const personalizedMessage = message
          .replace('{name}', recipient.name)
          .replace('{position}', positionTitle || 'המשרה')

        const personalizedSubject = subject
          .replace('{name}', recipient.name)
          .replace('{position}', positionTitle || 'המשרה')

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'צוות הגיוס'}" <${smtpConfig.auth.user}>`,
          to: recipient.email,
          subject: personalizedSubject,
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎯 הזדמנות תעסוקה חדשה</h1>
                </div>
                <div class="content">
                  ${personalizedMessage.replace(/\n/g, '<br>')}
                  
                  <p style="margin-top: 30px;">
                    <strong>נשמח לשמוע ממך!</strong>
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 TWENTY2CRM | מערכת ניהול גיוס</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: personalizedMessage, // גרסת טקסט רגיל
        })

        results.successful.push(recipient.name)
      } catch (error: any) {
        console.error(`Failed to send email to ${recipient.name}:`, error)
        results.failed.push({
          email: recipient.email,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: "Bulk email sending completed",
      results,
      total: recipients.length,
      successful: results.successful.length,
      failed: results.failed.length,
    })
  } catch (error) {
    console.error("Error sending bulk email:", error)
    return NextResponse.json(
      { error: "Failed to send bulk email" },
      { status: 500 }
    )
  }
}
