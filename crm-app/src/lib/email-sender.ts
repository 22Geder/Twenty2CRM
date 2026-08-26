import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { getResendApiKey, getResendFromEmail } from './env'

export type CrmEmailOptions = {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
}

function recipientList(to: string | string[]): string[] {
  return Array.isArray(to) ? to.filter(Boolean) : [to]
}

function fromDisplayName(from: string): string {
  return from.match(/"([^"]+)"/)?.[1] || 'Twenty2CRM'
}

function smtpPassword(): string | undefined {
  return process.env.SMTP_PASSWORD || process.env.SMTP_PASS
}

function hasSmtpConfig(): boolean {
  return !!(process.env.SMTP_USER && smtpPassword())
}

function errorMessage(err: unknown): string {
  if (!err) return 'unknown error'
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { message?: string; name?: string }
    return maybe.message || maybe.name || 'unknown error'
  }
  return String(err)
}

async function sendViaResend(options: CrmEmailOptions, recipients: string[]): Promise<void> {
  const resendKey = getResendApiKey()
  if (!resendKey) {
    throw new Error('RESEND_API_KEY missing')
  }

  const resend = new Resend(resendKey)
  const fromEmail = getResendFromEmail()
  const fromName = fromDisplayName(options.from)
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    replyTo: '22geder@gmail.com',
    to: recipients,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (error) {
    throw new Error(error.message || error.name || 'Resend send failed')
  }

  console.log('📧 Email sent via Resend', data?.id ? '(id received)' : '')
}

async function sendViaSmtp(options: CrmEmailOptions, recipients: string[]): Promise<void> {
  const user = process.env.SMTP_USER
  const pass = smtpPassword()
  if (!user || !pass) {
    throw new Error('SMTP not configured')
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const configuredPort = parseInt(process.env.SMTP_PORT || '587', 10)
  const configs = [
    {
      host,
      port: configuredPort,
      secure: process.env.SMTP_SECURE === 'true' || configuredPort === 465,
    },
    { host, port: 465, secure: true },
    { host: 'smtp.gmail.com', port: 587, secure: false },
  ]

  let lastError: unknown
  for (const config of configs) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      })

      await transporter.sendMail({
        from: options.from.includes('<') ? options.from : `"Twenty2CRM" <${user}>`,
        to: recipients.join(', '),
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      console.log(`📧 Email sent via SMTP ${config.host}:${config.port}`)
      return
    } catch (err) {
      lastError = err
      console.error(`❌ SMTP ${config.host}:${config.port} failed:`, errorMessage(err))
    }
  }

  throw new Error(`SMTP send failed: ${errorMessage(lastError)}`)
}

export async function sendCrmEmail(options: CrmEmailOptions): Promise<{ method: 'resend' | 'smtp' }> {
  const recipients = recipientList(options.to)
  if (recipients.length === 0) {
    throw new Error('No email recipients')
  }

  const resendKey = getResendApiKey()
  if (resendKey) {
    try {
      await sendViaResend(options, recipients)
      return { method: 'resend' }
    } catch (err) {
      console.error('❌ Resend send failed, trying SMTP fallback:', errorMessage(err))
      if (!hasSmtpConfig()) {
        throw err
      }
    }
  }

  if (!hasSmtpConfig()) {
    throw new Error('Email not configured - set RESEND_API_KEY or SMTP_USER + SMTP_PASSWORD')
  }

  await sendViaSmtp(options, recipients)
  return { method: 'smtp' }
}
