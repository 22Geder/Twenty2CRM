import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'

// סריקת כל המיילים ההיסטוריים - לרוץ פעם אחת בהתחלה
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      maxEmails = 500, // מספר מקסימלי של מיילים לסרוק
      daysBack = 90    // כמה ימים אחורה לסרוק
    } = body

    const { resumeKeywords } = await import('@/lib/resume-keywords')

    console.log(`🔍 Starting historical email scan: ${maxEmails} emails, ${daysBack} days back`)

    // התחברות ל-Gmail API דרך Service Account
    const keyPath = path.join(process.cwd(), 'service-account-key.json')
    
    if (!fs.existsSync(keyPath)) {
      return NextResponse.json(
        { error: 'Service account key not found. Please ensure service-account-key.json exists.' },
        { status: 500 }
      )
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    })

    const gmail = google.gmail({ version: 'v1', auth })

    // חישוב תאריך מהעבר
    const dateFilter = new Date()
    dateFilter.setDate(dateFilter.getDate() - daysBack)
    const timestamp = Math.floor(dateFilter.getTime() / 1000)

    // בדיקת מיילים עם attachments בעבר X ימים
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxEmails,
      q: `after:${timestamp} has:attachment`
    })

    const messageIds = response.data.messages || []
    console.log(`Found ${messageIds.length} emails with attachments from last ${daysBack} days`)

    // עיבוד כל מייל
    const processedEmails = []
    
    for (const message of messageIds) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        })

        const result = await processHistoricalEmail(msg.data, resumeKeywords)
        if (result.success) {
          processedEmails.push(result)
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      emailsScanned: messageIds.length,
      candidatesCreated: processedEmails.length,
      results: processedEmails
    })

  } catch (error) {
    console.error('Historical scan error:', error)
    return NextResponse.json(
      { error: 'Historical scan failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// חילוץ תוכן המייל
function getEmailBody(message: any): string {
  let body = ''
  const part = message.payload?.parts?.[0] || message.payload
  
  if (part.body?.data) {
    body = Buffer.from(part.body.data, 'base64').toString('utf-8')
  }
  
  return body
}

// עיבוד מייל היסטורי
async function processHistoricalEmail(emailData: any, resumeKeywords: string[]) {
  try {
    const headers = emailData.payload?.headers || []
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'ללא נושא'
    const from = headers.find((h: any) => h.name === 'From')?.value || 'unknown'
    const body = getEmailBody(emailData)

    // בדיקת keywords
    const hasResumeKeywords = resumeKeywords.some(keyword => 
      body.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!hasResumeKeywords) {
      return { success: false, reason: 'No resume keywords found' }
    }

    const candidateInfo = extractInfoFromEmail({ subject, from, body })

    // בדיקה אם המועמד כבר קיים
    let candidate
    if (candidateInfo.email) {
      candidate = await prisma.candidate.findUnique({
        where: { email: candidateInfo.email }
      })
    }

    if (candidate) {
      return {
        success: false,
        reason: 'Candidate already exists',
        candidateId: candidate.id
      }
    }

    // יצירת מועמד חדש
    const newCandidate = await prisma.candidate.create({
      data: {
        name: candidateInfo.name || 'מועמד ממייל',
        email: candidateInfo.email || `temp_${Date.now()}@pending.com`,
        phone: candidateInfo.phone,
        currentTitle: candidateInfo.title,
        skills: candidateInfo.skills,
        city: candidateInfo.city,
        source: 'EMAIL_HISTORICAL',
        notes: `נקלט מסריקה היסטורית ב-${new Date().toLocaleDateString('he-IL')}\n\nנושא: ${subject}\n\nמ: ${from}`,
        resumeUrl: null
      }
    })

    // התאמה חכמה אוטומטית
    if (candidateInfo.skills) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/smart-matching`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: newCandidate.id,
            resumeText: body
          })
        })
      } catch (error) {
        console.log('Smart matching failed, but candidate was created')
      }
    }

    return {
      success: true,
      candidateId: newCandidate.id,
      candidateName: newCandidate.name,
      candidateEmail: newCandidate.email
    }

  } catch (error) {
    console.error('Error processing historical email:', error)
    return {
      success: false,
      reason: 'Processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// חילוץ מידע מתוכן המייל
function extractInfoFromEmail(emailData: any) {
  const text = (emailData.subject + ' ' + emailData.from + ' ' + emailData.body).toLowerCase()
  
  // חילוץ אימייל
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
  const emails = emailData.body?.match(emailRegex) || []
  const candidateEmail = emails.find((email: string) => 
    !email.includes('22geder') && !email.includes('gmail')
  ) || extractEmailFromString(emailData.from)

  // חילוץ טלפון
  const phoneRegex = /0(?:5[0-9]|[2-4]|[7-9])[0-9-\s]{7,}/g
  const phoneMatch = emailData.body?.match(phoneRegex)
  const phone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : null

  // חילוץ שם
  const nameRegex = /(?:שם:|שלום,?\s+|מצורף קורות חיים של\s+|אני\s+)([א-ת\s]{2,30})/
  const nameMatch = emailData.body?.match(nameRegex)
  const name = nameMatch ? nameMatch[1].trim() : extractNameFromEmail(candidateEmail)

  // חילוץ עיר
  const cities = [
    'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'פתח תקווה',
    'ראשון לציון', 'אשדוד', 'נתניה', 'רעננה', 'חולון'
  ]
  let city = null
  for (const c of cities) {
    if (text.includes(c.toLowerCase())) {
      city = c
      break
    }
  }

  // חילוץ כישורים
  const skillsKeywords = [
    'javascript', 'react', 'node', 'python', 'java', 'מחסנאי',
    'נהג', 'מנהל', 'מכירות', 'שיווק', 'הייטק', 'excel'
  ]
  const detectedSkills = skillsKeywords.filter(skill => 
    text.includes(skill.toLowerCase())
  )

  return {
    email: candidateEmail,
    name,
    phone,
    city,
    title: detectedSkills[0] || null,
    skills: detectedSkills.length > 0 ? detectedSkills.join(', ') : null
  }
}

function extractEmailFromString(str: string): string {
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/
  const match = str?.match(emailRegex)
  return match ? match[0] : ''
}

function extractNameFromEmail(email: string): string {
  if (!email) return 'מועמד'
  const username = email.split('@')[0]
  const parts = username.split(/[._-]/)
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')
}
