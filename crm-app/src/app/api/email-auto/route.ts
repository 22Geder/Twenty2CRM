import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// מערכת לקליטת מיילים אוטומטית מ-22geder@gmail.com
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'check-emails') {
      // בדוק מיילים חדשים
      const emails = await checkForNewEmails()
      return NextResponse.json({ 
        success: true, 
        count: emails.length,
        emails: emails
      })
    }

    if (action === 'process-email') {
      // עבד מייל ספציפי
      const { emailData } = body
      const result = await processResumeEmail(emailData)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Email processing error:", error)
    return NextResponse.json(
      { error: "Failed to process emails" },
      { status: 500 }
    )
  }
}

// בדיקת מיילים חדשים
async function checkForNewEmails() {
  // לצורך הדמו - נחזיר מיילים דמה
  // בפרויקט אמיתי נשתמש ב-Gmail API או IMAP
  return [
    {
      id: '1',
      from: '22geder@gmail.com',
      subject: 'קורות חיים - יונתן כהן',
      body: 'שלום, מצורף קורות החיים שלי',
      attachments: ['resume.pdf'],
      date: new Date().toISOString()
    }
  ]
}

// עיבוד מייל עם קורות חיים
async function processResumeEmail(emailData: any) {
  try {
    // זהה מילות מפתח בנושא או תוכן
    const resumeKeywords = [
      'קורות חיים', 'קוח', 'קח', 'CV', 'resume', 
      'מועמדות', 'משרה', 'עבודה', 'מחפש עבודה',
      'מעוניין במשרה', 'רוצה לעבוד'
    ]
    
    const isResumeEmail = resumeKeywords.some(keyword => 
      emailData.subject?.toLowerCase().includes(keyword.toLowerCase()) ||
      emailData.body?.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!isResumeEmail) {
      return { success: false, reason: 'Not a resume email' }
    }

    // נתח את תוכן המייל וחלץ מידע
    const candidateInfo = extractCandidateInfo(emailData)
    
    // בדוק אם המועמד כבר קיים
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email: candidateInfo.email }
    })

    if (existingCandidate) {
      return { 
        success: false, 
        reason: 'Candidate already exists',
        candidateId: existingCandidate.id 
      }
    }

    // צור מועמד חדש
    const newCandidate = await prisma.candidate.create({
      data: {
        name: candidateInfo.name || 'מועמד מאימייל',
        email: candidateInfo.email,
        phone: candidateInfo.phone,
        source: 'EMAIL_AUTO',
        skills: candidateInfo.skills,
        notes: `נקלט אוטומטית מאימייל ב-${new Date().toLocaleDateString('he-IL')}\n\nנושא: ${emailData.subject}\n\nתוכן המייל:\n${emailData.body}`,
        resumeUrl: candidateInfo.resumeUrl
      }
    })

    // בצע התאמה חכמה אוטומטית
    if (candidateInfo.resumeText) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/smart-matching`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: newCandidate.id,
            resumeText: candidateInfo.resumeText
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
      candidateEmail: newCandidate.email,
      autoMatched: !!candidateInfo.resumeText
    }

  } catch (error) {
    console.error('Error processing resume email:', error)
    return { success: false, reason: 'Processing error' }
  }
}

// חילוץ מידע מועמד מתוכן המייל
function extractCandidateInfo(emailData: any) {
  const text = (emailData.subject + ' ' + emailData.body).toLowerCase()
  
  // חלץ אימייל
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g
  const emailMatches = emailData.body?.match(emailRegex) || []
  const candidateEmail = emailMatches.find((email: string) => 
    !email.includes('22geder') && !email.includes('gmail')
  ) || emailData.from

  // חלץ טלפון ישראלי
  const phoneRegex = /0(?:5[0-9]|[2-4]|[7-9])[0-9-\s]{7,}/g
  const phoneMatch = emailData.body?.match(phoneRegex)
  const phone = phoneMatch ? phoneMatch[0].replace(/[-\s]/g, '') : null

  // חלץ שם (בדרך כלל בתחילת המייל או בשורה הראשונה)
  const nameRegex = /(?:שם:|שלום,?\s+|מצורף קורות חיים של\s+|אני\s+)([א-ת\s]{2,30})/
  const nameMatch = emailData.body?.match(nameRegex)
  const name = nameMatch ? nameMatch[1].trim() : extractNameFromEmail(candidateEmail)

  // זהה כישורים נפוצים
  const skillsKeywords = [
    'javascript', 'react', 'node.js', 'python', 'java', 'php', 'html', 'css',
    'מנהל', 'רו"ח', 'מהנדס', 'מפתח', 'מתכנת', 'מעצב', 'מכירות', 'שיווק'
  ]
  
  const detectedSkills = skillsKeywords.filter(skill => 
    text.includes(skill.toLowerCase())
  )

  return {
    email: candidateEmail,
    name: name,
    phone: phone,
    skills: detectedSkills.length > 0 ? detectedSkills.join(', ') : null,
    resumeText: emailData.body,
    resumeUrl: emailData.attachments?.length > 0 ? '/uploads/email-resume.pdf' : null
  }
}

// חלץ שם מכתובת אימייל
function extractNameFromEmail(email: string): string {
  const username = email.split('@')[0]
  const parts = username.split(/[._-]/)
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')
}