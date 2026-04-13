import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getResendApiKey, getResendFromEmail } from '@/lib/env';

// GET /api/test-smtp - בדיקת חיבור מייל (Resend או SMTP)
export async function GET() {
  try {
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')

    const resendKey = getResendApiKey();
    const resendFrom = getResendFromEmail();
    
    const envCheck = {
      RESEND_API_KEY: !!resendKey,
      RESEND_API_KEY_PREFIX: resendKey ? resendKey.substring(0, 6) + '...' : 'NOT SET',
      RESEND_FROM_EMAIL_VALUE: resendFrom,
      SMTP_USER: !!smtpUser,
    }

    // 🥇 ניסיון 1: Resend HTTP API (מומלץ ל-Railway)
    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        const fromEmail = resendFrom
        
        const { data, error } = await resend.emails.send({
          from: `TWENTY2CRM Test <${fromEmail}>`,
          replyTo: '22geder@gmail.com',
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

        if (error) {
          return NextResponse.json({
            success: false,
            method: 'Resend HTTP API',
            error: error.message || error.name || JSON.stringify(error),
            envCheck,
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          method: 'Resend HTTP API',
          message: '✅ Resend works! Test email sent successfully',
          envCheck,
          resendId: data?.id,
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

// POST /api/test-smtp - שליחת מייל בדיקה לכתובת ספציפית (דוגמת מייל למעסיק)
export async function POST(request: NextRequest) {
  try {
    const { to, candidateId, positionId } = await request.json()
    const resendKey = getResendApiKey()
    const fromEmail = getResendFromEmail()

    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    const resend = new Resend(resendKey)

    // אם יש candidateId ו-positionId - שלח מייל אמיתי עם נתונים מה-DB
    if (candidateId && positionId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { tags: true },
      })
      const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: { employer: true, tags: true },
      })

      if (!candidate || !position) {
        return NextResponse.json({ error: 'Candidate or Position not found' }, { status: 404 })
      }

      const targetEmail = to || (position as any)?.contactEmail || position.employer?.email
      if (!targetEmail) {
        return NextResponse.json({ error: 'No target email' }, { status: 400 })
      }

      const { data, error } = await resend.emails.send({
        from: `צוות הגיוס - HR22 <${fromEmail}>`,
        replyTo: '22geder@gmail.com',
        to: [targetEmail],
        subject: `מועמד/ת מתאים/ה למשרת ${position.title} - ${candidate.name}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
              <h2 style="margin: 0;">🎯 מועמד/ת מתאים/ה למשרה שלכם</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${position.title} | ${position.employer?.name || ''}</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
              <h3 style="color: #333; margin-top: 0;">פרטי המועמד/ת:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">שם:</td><td style="padding: 8px;">${candidate.name}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">טלפון:</td><td style="padding: 8px; direction: ltr;">${candidate.phone || 'לא צוין'}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">אימייל:</td><td style="padding: 8px;">${candidate.email || 'לא צוין'}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">עיר:</td><td style="padding: 8px;">${candidate.city || 'לא צוין'}</td></tr>
                ${candidate.experience ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">ניסיון:</td><td style="padding: 8px;">${candidate.experience}</td></tr>` : ''}
              </table>
              
              <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; border-right: 4px solid #667eea;">
                <h4 style="margin: 0 0 10px 0; color: #667eea;">✨ נקודות התאמה:</h4>
                <ul style="margin: 0; padding-right: 20px; color: #555;">
                  <li>ניסיון רלוונטי בתחום</li>
                  <li>מיקום גאוגרפי מתאים</li>
                  <li>זמינות מיידית</li>
                </ul>
              </div>
            </div>
            <div style="background: #333; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">נשלח מ-TWENTY2CRM | צוות הגיוס HR22</p>
              <p style="margin: 5px 0 0 0; opacity: 0.7;">להשבה על מייל זה - לחצו Reply</p>
            </div>
          </div>
        `,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message || JSON.stringify(error) }, { status: 500 })
      }

      return NextResponse.json({ success: true, resendId: data?.id, sentTo: targetEmail, from: fromEmail, candidate: candidate.name, position: position.title })
    }

    // אם יש רק כתובת to - שלח מייל דוגמה
    if (to) {
      const { data, error } = await resend.emails.send({
        from: `צוות הגיוס - HR22 <${fromEmail}>`,
        replyTo: '22geder@gmail.com',
        to: [to],
        subject: 'מועמד/ת מתאים/ה למשרת נציג/ת שירות - ישראל ישראלי',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
              <h2 style="margin: 0;">🎯 מועמד/ת מתאים/ה למשרה שלכם</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">נציג/ת שירות | דוגמה לחברה</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
              <h3 style="color: #333; margin-top: 0;">פרטי המועמד/ת:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">שם:</td><td style="padding: 8px;">ישראל ישראלי</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">טלפון:</td><td style="padding: 8px; direction: ltr;">050-1234567</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">אימייל:</td><td style="padding: 8px;">israel@example.com</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">עיר:</td><td style="padding: 8px;">תל אביב</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #555;">ניסיון:</td><td style="padding: 8px;">3 שנות ניסיון בשירות לקוחות</td></tr>
              </table>
              
              <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; border-right: 4px solid #667eea;">
                <h4 style="margin: 0 0 10px 0; color: #667eea;">✨ נקודות התאמה:</h4>
                <ul style="margin: 0; padding-right: 20px; color: #555;">
                  <li>ניסיון של 3 שנים בשירות לקוחות טלפוני ופרונטלי</li>
                  <li>מתגורר/ת בתל אביב - קרוב למיקום המשרד</li>
                  <li>יכולת עבודה במשמרות כולל ערבים</li>
                  <li>שליטה מלאה בעברית ואנגלית</li>
                  <li>זמינות מיידית</li>
                </ul>
              </div>
            </div>
            <div style="background: #333; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">נשלח מ-TWENTY2CRM | צוות הגיוס HR22</p>
              <p style="margin: 5px 0 0 0; opacity: 0.7;">להשבה על מייל זה - לחצו Reply</p>
            </div>
          </div>
        `,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message || JSON.stringify(error) }, { status: 500 })
      }

      return NextResponse.json({ success: true, resendId: data?.id, sentTo: to, from: fromEmail })
    }

    return NextResponse.json({ error: 'Need "to" email or "candidateId"+"positionId"' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
