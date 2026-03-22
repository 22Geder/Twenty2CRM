import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// GET /api/test-smtp - בדיקת חיבור מייל (Resend או SMTP)
export async function GET() {
  try {
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')

    // בדיקה 1: האם משתני סביבה קיימים
    const envCheck = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      SMTP_USER: !!smtpUser,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
    }

    // 🥇 ניסיון 1: Resend HTTP API (מומלץ ל-Railway)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        
        const result = await resend.emails.send({
          from: `TWENTY2CRM Test <${fromEmail}>`,
          to: [smtpUser || '22geder@gmail.com'],
          subject: '✅ בדיקת Resend - TWENTY2CRM',
          html: `
            <div dir="rtl" style="font-family: Arial; padding: 20px;">
              <h2>✅ מערכת המיילים עובדת דרך Resend!</h2>
              <p>המייל הזה נשלח מ-TWENTY2CRM בתאריך ${new Date().toLocaleDateString('he-IL')}</p>
              <p>שירות: Resend HTTP API</p>
            </div>
          `
        })

        return NextResponse.json({
          success: true,
          method: 'Resend HTTP API',
          message: '✅ Resend works! Test email sent successfully',
          envCheck,
          resendId: result.data?.id,
        })
      } catch (resendErr: any) {
        return NextResponse.json({
          success: false,
          method: 'Resend HTTP API',
          error: resendErr.message,
          envCheck,
          fix: 'Check RESEND_API_KEY value. Make sure your domain is verified in Resend dashboard.'
        }, { status: 500 })
      }
    }

    // 🥈 ניסיון 2: SMTP (לא עובד ב-Railway בדרך כלל)
    if (!smtpUser || !smtpPassword) {
      return NextResponse.json({
        success: false,
        error: 'No email service configured',
        envCheck,
        fix: 'Add RESEND_API_KEY to Railway. Sign up free at https://resend.com'
      })
    }

    const configs = [
      { host: smtpHost, port: 465, secure: true, label: 'SSL (465)' },
      { host: smtpHost, port: smtpPort, secure: false, label: `STARTTLS (${smtpPort})` },
      { host: 'smtp.gmail.com', port: 465, secure: true, label: 'Gmail SSL (465)' },
    ]

    let lastError = null

    for (const config of configs) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: smtpUser, pass: smtpPassword },
          connectionTimeout: 10000,
          greetingTimeout: 8000,
        })

        await transporter.verify()

        await transporter.sendMail({
          from: `"TWENTY2CRM" <${smtpUser}>`,
          to: smtpUser,
          subject: '✅ בדיקת SMTP - TWENTY2CRM',
          html: `<div dir="rtl"><h2>✅ SMTP עובד!</h2><p>הגדרות: ${config.label}</p></div>`
        })

        return NextResponse.json({
          success: true,
          method: 'SMTP',
          message: `✅ SMTP works with ${config.label}`,
          envCheck,
          workingConfig: config.label,
        })
      } catch (err: any) {
        lastError = { config: config.label, error: err.message, code: err.code }
        continue
      }
    }

    return NextResponse.json({
      success: false,
      error: 'All SMTP configurations failed (Railway blocks SMTP ports)',
      envCheck,
      lastError,
      fix: 'Railway blocks SMTP. Add RESEND_API_KEY to Railway env vars. Sign up free at https://resend.com'
    }, { status: 500 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command,
      fix: error.code === 'EAUTH' 
        ? 'Authentication failed - check SMTP_PASSWORD/SMTP_PASS value. For Gmail, use App Password (not regular password).'
        : error.code === 'ESOCKET' || error.code === 'ECONNECTION'
        ? 'Connection failed - check SMTP_HOST and SMTP_PORT values.'
        : 'Check all SMTP environment variables in Railway.'
    }, { status: 500 })
  }
}
