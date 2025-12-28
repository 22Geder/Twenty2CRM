import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// מערכת פולינג - בודק מיילים כל X דקות
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailAddress = '22geder@gmail.com' } = body

    // מילות מפתח לזיהוי קורות חיים
    const resumeKeywords = [
      'קורות חיים',
      'קוח',
      'קו"ח',
      'CV',
      'resume',
      'מועמדות',
      'משרה',
      'מחפש עבודה',
      'מעוניין במשרה'
    ]

    // כאן נתחבר ל-Gmail API ונבדוק מיילים
    // לצורך הדמונסטרציה, אחזיר מבנה דומה למה שיהיה
    const mockEmails = await simulateGmailCheck(emailAddress, resumeKeywords)

    // עיבוד כל מייל
    const processedEmails = []
    for (const email of mockEmails) {
      const result = await processResumeEmail(email)
      if (result.success) {
        processedEmails.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      emailsChecked: mockEmails.length,
      candidatesCreated: processedEmails.length,
      results: processedEmails
    })

  } catch (error) {
    console.error('Email polling error:', error)
    return NextResponse.json(
      { error: 'Failed to check emails' },
      { status: 500 }
    )
  }
}

// סימולציה של בדיקת Gmail (להחליף ב-Gmail API אמיתי)
async function simulateGmailCheck(emailAddress: string, keywords: string[]) {
  // בפרודקשן זה יהיה:
  // const gmail = google.gmail({ version: 'v1', auth });
  // const response = await gmail.users.messages.list({ userId: 'me', q: 'is:unread' });
  
  return [] // מיילים מדומים
}

// עיבוד מייל עם קורות חיים
async function processResumeEmail(emailData: any) {
  try {
    // חילוץ מידע מהמייל
    const candidateInfo = extractInfoFromEmail(emailData)

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
        notes: `נקלט אוטומטית מאימייל ב-${new Date().toLocaleDateString('he-IL')}\n\nנושא: ${emailData.subject}\n\nתוכן:\n${emailData.body}`,
        resumeUrl: candidateInfo.attachmentUrl
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
            resumeText: emailData.body
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

// חילוץ מידע מתוכן המייל
function extractInfoFromEmail(emailData: any) {
  const text = (emailData.subject + ' ' + emailData.body).toLowerCase()
  
  // חילוץ אימייל
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
  const emails = emailData.body?.match(emailRegex) || []
  const candidateEmail = emails.find((email: string) => 
    !email.includes('22geder') && !email.includes('gmail')
  ) || emailData.from

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
    skills: detectedSkills.length > 0 ? detectedSkills.join(', ') : null,
    attachmentUrl: emailData.attachments?.[0] || null
  }
}

function extractNameFromEmail(email: string): string {
  const username = email.split('@')[0]
  const parts = username.split(/[._-]/)
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')
}