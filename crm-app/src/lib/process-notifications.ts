// 📧 שליחת מיילים עבור תהליך מועמדים
// מייל כניסה לתהליך (מיידי) ומייל מעקב שבועי (אחרי 7 ימים)

import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { getResendApiKey, getResendFromEmail } from './env'

// -----------------------------------------------------------
// פונקציית שליחת מייל פנימית - Resend או SMTP
// -----------------------------------------------------------
async function sendEmail(options: {
  from: string
  to: string
  subject: string
  html: string
}) {
  const resendKey = getResendApiKey()
  if (resendKey) {
    const resend = new Resend(resendKey)
    const fromEmail = getResendFromEmail()
    const fromName = options.from.match(/"([^"]+)"/)?.[1] || 'Twenty2CRM'
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      replyTo: '22geder@gmail.com',
      to: [options.to],
      subject: options.subject,
      html: options.html,
    })
    return
  }

  const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
  if (!process.env.SMTP_USER || !smtpPassword) {
    throw new Error('Email not configured - set RESEND_API_KEY or SMTP_USER + SMTP_PASSWORD')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPassword,
    },
  })

  await transporter.sendMail(options)
}

// -----------------------------------------------------------
// 1️⃣  מייל מיידי - מועמד נכנס לתהליך
// -----------------------------------------------------------
export async function sendProcessEntryEmail({
  candidateName,
  positionTitle,
  employerName,
  phone,
}: {
  candidateName: string
  positionTitle?: string | null
  employerName?: string | null
  phone?: string | null
}) {
  try {
    const toEmail = process.env.CRM_NOTIFY_EMAIL || process.env.SMTP_USER
    if (!toEmail) return

    const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
    const positionInfo =
      [positionTitle, employerName ? `(${employerName})` : null].filter(Boolean).join(' ') ||
      'משרה לא ידועה'
    const baseUrl =
      process.env.NEXTAUTH_URL || 'https://twenty2crm-production-7997.up.railway.app'

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px;">✅ מועמד נכנס לתהליך!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${now}</p>
          </div>
          <div style="padding: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280; width: 40%;">שם מועמד:</td>
                <td style="padding: 12px 0; font-weight: bold; color: #111;">${candidateName}</td>
              </tr>
              ${
                phone
                  ? `<tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #6b7280;">טלפון:</td>
                <td style="padding: 12px 0; color: #111;">${phone}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding: 12px 0; color: #6b7280;">משרה / מעסיק:</td>
                <td style="padding: 12px 0; color: #111;">${positionInfo}</td>
              </tr>
            </table>
            <div style="margin-top: 24px;">
              <a href="${baseUrl}/dashboard/monthly-status?filter=in-process"
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">
                צפה במועמדים בתהליך
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail({
      from: `"כניסה לתהליך - Twenty2CRM" <${process.env.SMTP_USER || toEmail}>`,
      to: toEmail,
      subject: `✅ ${candidateName} נכנס/ה לתהליך - ${positionTitle || 'משרה'}`,
      html,
    })
    console.log(`📧 Process-entry email sent for: ${candidateName}`)
  } catch (err) {
    console.error('❌ Failed to send process-entry email:', err)
  }
}

// -----------------------------------------------------------
// 2️⃣  מייל שבועי - מועמדים שעדיין בתהליך אחרי 7+ ימים
// -----------------------------------------------------------
export async function sendWeeklyProcessCheckEmail(
  candidates: Array<{
    id: string
    name: string
    phone?: string | null
    inProcessAt?: Date | null
    inProcessPosition?: { title: string; employer?: { name: string } | null } | null
  }>
) {
  try {
    const toEmail = process.env.CRM_NOTIFY_EMAIL || process.env.SMTP_USER
    if (!toEmail) return
    if (candidates.length === 0) return

    const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
    const baseUrl =
      process.env.NEXTAUTH_URL || 'https://twenty2crm-production-7997.up.railway.app'

    const rows = candidates
      .map((c) => {
        const days = c.inProcessAt
          ? Math.floor((Date.now() - new Date(c.inProcessAt).getTime()) / 86_400_000)
          : '?'
        const position = c.inProcessPosition?.title || 'משרה לא ידועה'
        const employer = c.inProcessPosition?.employer?.name || ''
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; font-weight: bold;">${c.name}</td>
            <td style="padding: 10px 12px; color: #555;">${c.phone || '-'}</td>
            <td style="padding: 10px 12px;">${position}${employer ? ` <span style="color:#6b7280;">(${employer})</span>` : ''}</td>
            <td style="padding: 10px 12px; text-align: center;">
              <span style="background: #fef3c7; color: #92400e; padding: 2px 10px; border-radius: 20px; font-size: 13px;">
                ${days} ימים
              </span>
            </td>
          </tr>`
      })
      .join('')

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 750px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⏰ מעקב שבועי - מועמדים בתהליך</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${now}</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; margin-top: 0;">
              להלן ${candidates.length} מועמד/ים שנמצאים בתהליך כבר <strong>שבוע ומעלה</strong> — מומלץ לבדוק מה מצבם:
            </p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px 12px; text-align: right; color: #374151; font-size: 14px;">שם</th>
                  <th style="padding: 10px 12px; text-align: right; color: #374151; font-size: 14px;">טלפון</th>
                  <th style="padding: 10px 12px; text-align: right; color: #374151; font-size: 14px;">משרה</th>
                  <th style="padding: 10px 12px; text-align: center; color: #374151; font-size: 14px;">זמן בתהליך</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div style="margin-top: 24px;">
              <a href="${baseUrl}/dashboard/monthly-status?filter=in-process"
                 style="display: inline-block; background: #f59e0b; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">
                פתח סטטוס מועמדים
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail({
      from: `"מעקב שבועי - Twenty2CRM" <${process.env.SMTP_USER || toEmail}>`,
      to: toEmail,
      subject: `⏰ ${candidates.length} מועמדים בתהליך שבוע+ - מעקב שבועי`,
      html,
    })
    console.log(`📧 Weekly process-check email sent (${candidates.length} candidates)`)
  } catch (err) {
    console.error('❌ Failed to send weekly process-check email:', err)
  }
}
