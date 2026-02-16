import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'

// מערכת פולינג - בודק מיילים כל X דקות עם Service Account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailAddress = '22geder@gmail.com' } = body

    const { resumeKeywords } = await import('@/lib/resume-keywords')

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

    // בדיקת מיילים חדשים (פחות מ-1 שעה)
    const oneHourAgo = Math.floor((Date.now() - 60 * 60 * 1000) / 1000)
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${oneHourAgo} has:attachment`
    })

    const messageIds = response.data.messages || []
    console.log(`Found ${messageIds.length} emails with attachments`)

    // עיבוד כל מייל
    const processedEmails = []
    for (const message of messageIds) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      })

      const result = await processResumeEmail(msg.data, resumeKeywords)
      if (result.success) {
        processedEmails.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      emailsChecked: messageIds.length,
      candidatesCreated: processedEmails.length,
      results: processedEmails
    })

  } catch (error) {
    console.error('Email polling error:', error)
    return NextResponse.json(
      { error: 'Failed to check emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// עיבוד מייל עם קורות חיים
async function processResumeEmail(emailData: any, resumeKeywords: string[]) {
  try {
    // חילוץ מידע מהמייל
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
        source: 'EMAIL_AUTO',
        notes: `נקלט אוטומטית מאימייל ב-${new Date().toLocaleDateString('he-IL')}\n\nנושא: ${subject}\n\nמ: ${from}`,
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
    console.error('Error processing email:', error)
    return {
      success: false,
      reason: 'Processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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

  // חילוץ שם משופר
  let name = ''
  
  // תבניות לחילוץ שם מגוף המייל
  const namePatterns = [
    /(?:שם[:\s]+|name[:\s]+)([א-ת\s]{2,30}|[A-Za-z\s]{2,40})/i,
    /(?:שלום,?\s+|מצורף קורות חיים של\s+|אני\s+|קוראים לי\s+)([א-ת\s]{2,30})/i,
    /^([א-ת]{2,15}\s+[א-ת]{2,15})$/m,  // שם פרטי + משפחה בעברית
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/m,   // First Last in English
  ]
  
  for (const pattern of namePatterns) {
    const match = emailData.body?.match(pattern) || text.match(pattern)
    if (match && match[1]) {
      const possibleName = match[1].trim()
      // וודא שזה לא מילים שלא יכולות להיות שם
      const notNames = ['קורות חיים', 'resume', 'cv', 'ניסיון', 'השכלה']
      if (!notNames.some(n => possibleName.toLowerCase().includes(n.toLowerCase()))) {
        name = possibleName
        break
      }
    }
  }
  
  // fallback לאימייל
  if (!name) {
    name = extractNameFromEmail(candidateEmail)
  }

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