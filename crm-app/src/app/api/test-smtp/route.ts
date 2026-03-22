import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// GET /api/test-smtp - בדיקת חיבור SMTP
export async function GET() {
  try {
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpFromName = process.env.SMTP_FROM_NAME || 'TWENTY2CRM'

    // בדיקה 1: האם משתני סביבה קיימים
    const envCheck = {
      SMTP_USER: !!smtpUser,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_FROM_NAME: !!process.env.SMTP_FROM_NAME,
      // גם EMAIL_USER/EMAIL_PASS
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
    }

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json({
        success: false,
        error: 'SMTP credentials missing',
        envCheck,
        fix: 'Add SMTP_PASSWORD (or SMTP_PASS) to Railway environment variables'
      })
    }

    // בדיקה 2: ניסיון חיבור SMTP
    // Railway חוסמת פורט 587, ננסה 465 (SSL) קודם
    const configs = [
      { host: smtpHost, port: 465, secure: true, label: 'SSL (465)' },
      { host: smtpHost, port: smtpPort, secure: false, label: `STARTTLS (${smtpPort})` },
      { host: 'smtp.gmail.com', port: 465, secure: true, label: 'Gmail SSL (465)' },
    ]

    let workingConfig = null
    let lastError = null

    for (const config of configs) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          connectionTimeout: 10000,
          greetingTimeout: 8000,
        })

        await transporter.verify()

        // שליחת מייל בדיקה
        await transporter.sendMail({
          from: `"${smtpFromName}" <${smtpUser}>`,
          to: smtpUser,
          subject: '✅ בדיקת SMTP - TWENTY2CRM',
          html: `
            <div dir="rtl" style="font-family: Arial; padding: 20px;">
              <h2>✅ מערכת המיילים עובדת!</h2>
              <p>המייל הזה נשלח מ-TWENTY2CRM בתאריך ${new Date().toLocaleDateString('he-IL')}</p>
              <p>הגדרות שעובדות: ${config.label}</p>
            </div>
          `
        })

        workingConfig = config
        break
      } catch (err: any) {
        lastError = { config: config.label, error: err.message, code: err.code }
        continue
      }
    }

    if (!workingConfig) {
      return NextResponse.json({
        success: false,
        error: 'All SMTP configurations failed',
        envCheck,
        lastError,
        fix: 'Railway may block outbound SMTP. Try adding SMTP_PORT=465 and SMTP_SECURE=true to Railway environment variables.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '✅ SMTP works! Test email sent successfully',
      envCheck,
      workingConfig: workingConfig.label,
      config: {
        host: workingConfig.host,
        port: workingConfig.port,
        secure: workingConfig.secure,
        user: smtpUser,
        fromName: smtpFromName,
      }
    })

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
