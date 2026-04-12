import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getResendApiKey, getResendFromEmail } from '@/lib/env';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// GET /api/test-smtp - בדיקת חיבור מייל (Resend או SMTP)
export async function GET() {
  try {
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')

    // Debug: check runtime-env.json
    const cwd = process.cwd()
    const jsonPath = join(cwd, 'runtime-env.json')
    const jsonExists = existsSync(jsonPath)
    let jsonContent = 'N/A'
    if (jsonExists) {
      try { jsonContent = readFileSync(jsonPath, 'utf-8') } catch(e: any) { jsonContent = 'READ ERROR: ' + e.message }
    }

    // בדיקה 1: האם משתני סביבה קיימים
    const resendKey = getResendApiKey()
    const resendFrom = getResendFromEmail()
    const envCheck = {
      RESEND_API_KEY: !!resendKey,
      RESEND_API_KEY_PREFIX: resendKey ? resendKey.substring(0, 6) + '...' : 'NOT SET',
      RESEND_FROM_EMAIL: !!resendFrom,
      RESEND_FROM_EMAIL_VALUE: resendFrom || 'NOT SET',
      SMTP_USER: !!smtpUser,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      DEBUG_CWD: cwd,
      DEBUG_JSON_PATH: jsonPath,
      DEBUG_JSON_EXISTS: jsonExists,
      DEBUG_JSON_CONTENT: jsonContent,
    }

    // 🥇 ניסיון 1: Resend HTTP API (מומלץ ל-Railway)
    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        const fromEmail = resendFrom
        
        const { data, error } = await resend.emails.send({
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

// POST /api/test-smtp - diagnostic: test the real send flow step by step
export async function POST(request: NextRequest) {
  const steps: string[] = []
  try {
    const { candidateId, positionId } = await request.json()
    steps.push('1. Parsed request body')

    if (!candidateId || !positionId) {
      return NextResponse.json({ error: 'Need candidateId and positionId', steps })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true },
    })
    steps.push(`2. Candidate: ${candidate ? candidate.name : 'NOT FOUND'}`)

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found', steps })
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { employer: true, tags: true },
    })
    steps.push(`3. Position: ${position ? position.title : 'NOT FOUND'}`)
    steps.push(`3b. Employer: ${position?.employer ? position.employer.name : 'NO EMPLOYER'}`)
    steps.push(`3c. Employer email: ${position?.employer?.email || 'NONE'}`)
    steps.push(`3d. Contact email: ${(position as any)?.contactEmail || 'NONE'}`)

    if (!position) {
      return NextResponse.json({ error: 'Position not found', steps })
    }

    const targetEmail = (position as any)?.contactEmail || position.employer?.email
    steps.push(`4. Target email resolved: ${targetEmail || 'NONE!'}`)

    if (!targetEmail) {
      return NextResponse.json({ error: 'No email address for this position/employer!', steps })
    }

    const useResend = !!getResendApiKey()
    steps.push(`5. Using Resend: ${useResend}`)
    steps.push(`5b. RESEND_FROM_EMAIL: ${getResendFromEmail()}`)

    if (useResend) {
      const resend = new Resend(getResendApiKey()!)
      const fromEmail = getResendFromEmail()
      steps.push(`6. From email: ${fromEmail}`)
      steps.push(`6b. Sending to: ${targetEmail}`)

      const result = await resend.emails.send({
        from: `צוות הגיוס <${fromEmail}>`,
        to: [targetEmail],
        subject: `[בדיקה] מועמד/ת: ${candidate.name} - ${position.title}`,
        html: `<div dir="rtl"><h2>בדיקת שליחה</h2><p>מועמד: ${candidate.name}</p><p>משרה: ${position.title}</p><p>מעסיק: ${position.employer?.name}</p></div>`,
      })
      steps.push(`7. Resend result: ${JSON.stringify(result)}`)

      return NextResponse.json({ success: true, steps, resendId: result.data?.id })
    }

    return NextResponse.json({ error: 'No Resend configured', steps })
  } catch (error: any) {
    steps.push(`ERROR: ${error.message}`)
    steps.push(`STACK: ${error.stack?.substring(0, 500)}`)
    return NextResponse.json({ error: error.message, steps }, { status: 500 })
  }
}
