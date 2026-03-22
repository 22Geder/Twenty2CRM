import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// API לשליחת תזכורות ראיונות ומועמדים בתהליך
// GET - בדיקה ושליחת תזכורות
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'both' // 'interviews', 'in-process', 'both'
    
    const results: any = {
      interviewReminders: [],
      inProcessReminders: [],
    }

    // בדיקת הגדרות SMTP (תומך גם ב-SMTP_PASS וגם ב-SMTP_PASSWORD)
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
    if (!process.env.SMTP_USER || !smtpPassword) {
      return NextResponse.json({ error: "SMTP not configured" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPassword,
      },
    })

    // 📅 תזכורות לראיונות היום
    if (type === 'interviews' || type === 'both') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const interviewsToday = await prisma.candidate.findMany({
        where: {
          interviewDate: {
            gte: today,
            lt: tomorrow,
          },
          interviewReminderSent: false,
          employmentStatus: 'IN_PROCESS',
        },
        include: {
          inProcessPosition: {
            include: { employer: true }
          }
        }
      })

      if (interviewsToday.length > 0) {
        // יצירת רשימת ראיונות להיום
        const interviewList = interviewsToday.map(c => 
          `• ${c.name} - ${c.phone || 'אין טלפון'} - ${c.inProcessPosition?.title || 'משרה לא ידועה'} (${c.inProcessPosition?.employer?.name || ''})`
        ).join('\n')

        const emailHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📅 תזכורת ראיונות להיום</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">${today.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #333; margin-top: 0;">יש לך ${interviewsToday.length} ראיונות היום:</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <pre style="margin: 0; font-family: Arial; white-space: pre-wrap; line-height: 1.8;">${interviewList}</pre>
                </div>
                <a href="${process.env.NEXTAUTH_URL || 'https://twenty2crm-production-7997.up.railway.app'}/dashboard/monthly-status" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 10px;">
                  צפה בסטטוס חודשי
                </a>
              </div>
            </div>
          </body>
          </html>
        `

        await transporter.sendMail({
          from: `"תזכורות Twenty2CRM" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_USER, // שולח למייל שלך
          subject: `📅 ${interviewsToday.length} ראיונות היום - ${today.toLocaleDateString('he-IL')}`,
          html: emailHtml,
        })

        // סימון שהתזכורת נשלחה
        await prisma.candidate.updateMany({
          where: {
            id: { in: interviewsToday.map(c => c.id) }
          },
          data: { interviewReminderSent: true }
        })

        results.interviewReminders = interviewsToday.map(c => ({ id: c.id, name: c.name }))
      }
    }

    // 🔄 תזכורת מועמדים בתהליך (כל 4 שעות)
    if (type === 'in-process' || type === 'both') {
      const inProcessCandidates = await prisma.candidate.findMany({
        where: {
          employmentStatus: 'IN_PROCESS',
        },
        include: {
          inProcessPosition: {
            include: { employer: true }
          }
        },
        orderBy: { inProcessAt: 'asc' }
      })

      if (inProcessCandidates.length > 0) {
        const candidateList = inProcessCandidates.map(c => {
          const daysInProcess = c.inProcessAt 
            ? Math.floor((Date.now() - new Date(c.inProcessAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0
          const interviewInfo = c.interviewDate 
            ? `📅 ראיון: ${new Date(c.interviewDate).toLocaleDateString('he-IL')}`
            : '⚠️ אין תאריך ראיון'
          return `• ${c.name} | ${c.phone || ''} | ${c.inProcessPosition?.title || 'משרה לא ידועה'} | ${daysInProcess} ימים בתהליך | ${interviewInfo}`
        }).join('\n')

        const emailHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🔄 מועמדים בתהליך</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">עדכון תקופתי - ${new Date().toLocaleString('he-IL')}</p>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #333; margin-top: 0;">${inProcessCandidates.length} מועמדים בתהליך כרגע:</h2>
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
                  <pre style="margin: 0; font-family: Arial; white-space: pre-wrap; line-height: 2; font-size: 14px;">${candidateList}</pre>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                  <a href="${process.env.NEXTAUTH_URL || 'https://twenty2crm-production-7997.up.railway.app'}/dashboard/monthly-status?filter=in-process" 
                     style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                    צפה במועמדים בתהליך
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `

        await transporter.sendMail({
          from: `"מעקב Twenty2CRM" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_USER,
          subject: `🔄 ${inProcessCandidates.length} מועמדים בתהליך - עדכון`,
          html: emailHtml,
        })

        results.inProcessReminders = inProcessCandidates.map(c => ({ id: c.id, name: c.name }))
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
      message: `נשלחו ${results.interviewReminders.length} תזכורות ראיונות, ${results.inProcessReminders.length} עדכוני מועמדים בתהליך`
    })

  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json(
      { error: "Failed to send reminders", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - הפעלה ידנית של תזכורות
export async function POST(request: NextRequest) {
  return GET(request)
}
