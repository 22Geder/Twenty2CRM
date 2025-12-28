import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Webhook לקבלת אימיילים מ-Gmail/Outlook
// יש להגדיר את זה בספק האימייל שלך
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, subject, text, html, attachments } = body

    console.log('📧 Received email:', { from, subject })

    // בדוק אם יש קובץ CV מצורף
    const cvAttachment = attachments?.find((att: any) => 
      att.filename?.match(/\.(pdf|doc|docx)$/i)
    )

    if (!cvAttachment) {
      return NextResponse.json({ 
        message: 'No CV attachment found',
        status: 'ignored'
      })
    }

    // נתח את המייל וקורות החיים באמצעות AI
    const analysis: any = await analyzeCV(text || html, cvAttachment)

    // צור מועמד חדש
    const candidate = await prisma.candidate.create({
      data: {
        name: analysis?.name || extractNameFromEmail(from),
        email: from,
        phone: analysis?.phone || '',
        skills: analysis?.skills?.join(', ') || '',
        yearsOfExperience: analysis?.experience || 0,
        currentTitle: analysis?.currentTitle || '',
        resumeUrl: cvAttachment.url,
        source: 'EMAIL_WEBHOOK',
      }
    })

    console.log('✅ Candidate created:', candidate.id)

    // מצא משרות מתאימות אוטומטית
    const matchingPositions = await findMatchingPositions(analysis)

    // צור מועמדויות אוטומטית
    for (const position of matchingPositions) {
      await prisma.application.create({
        data: {
          candidateId: candidate.id,
          positionId: position.id,
          status: 'NEW',
        }
      })
      console.log(`✅ Auto-applied to position: ${position.title}`)
    }

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      matchingPositions: matchingPositions.length,
      message: `Candidate processed and matched to ${matchingPositions.length} positions`
    })

  } catch (error) {
    console.error('Error processing email:', error)
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    )
  }
}

// פונקציה לניתוח קורות חיים באמצעות AI
async function analyzeCV(content: string, attachment: any) {
  try {
    // כאן תוכל לשלב AI כמו OpenAI GPT או Anthropic Claude
    // לצורך הדוגמה, נשתמש בניתוח טקסט פשוט
    
    const analysis = {
      name: extractName(content),
      phone: extractPhone(content),
      skills: extractSkills(content),
      experience: extractExperience(content),
      currentTitle: extractCurrentTitle(content),
      education: extractEducation(content),
    }

    return analysis
  } catch (error) {
    console.error('CV analysis error:', error)
    return {}
  }
}

// חילוץ שם
function extractName(text: string): string | null {
  // חפש דפוסים של שם מלא
  const namePatterns = [
    /שם[:\s]+([א-ת\s]+)/,
    /Name[:\s]+([A-Za-z\s]+)/i,
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  
  return null
}

// חילוץ טלפון
function extractPhone(text: string): string | null {
  const phonePattern = /(\+972|0)[-\s]?\d{1,2}[-\s]?\d{7}/
  const match = text.match(phonePattern)
  return match ? match[0] : null
}

// חילוץ כישורים
function extractSkills(text: string): string[] {
  const knownSkills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C#',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
    'Machine Learning', 'AI', 'Data Science', 'Angular', 'Vue.js',
    'Leadership', 'Agile', 'Scrum', 'Project Management'
  ]
  
  const foundSkills = knownSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  )
  
  return foundSkills
}

// חילוץ ניסיון
function extractExperience(text: string): number {
  const experiencePatterns = [
    /(\d+)\s*(?:שנ|year)/i,
    /ניסיון[:\s]+(\d+)/,
  ]
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern)
    if (match) return parseInt(match[1])
  }
  
  return 0
}

// חילוץ תפקיד נוכחי
function extractCurrentTitle(text: string): string | null {
  const titlePatterns = [
    /תפקיד נוכחי[:\s]+([א-ת\s]+)/,
    /Current Position[:\s]+([A-Za-z\s]+)/i,
  ]
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  
  return null
}

// חילוץ השכלה
function extractEducation(text: string): string | null {
  const eduPatterns = [
    /(?:תואר|degree)[:\s]+([א-ת\s]+)/i,
    /(?:B\.?Sc|M\.?Sc|PhD)[:\s]+([A-Za-z\s]+)/i,
  ]
  
  for (const pattern of eduPatterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  
  return null
}

// חילוץ שם מכתובת מייל
function extractNameFromEmail(email: string): string {
  const name = email.split('@')[0]
  return name.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// מצא משרות מתאימות
async function findMatchingPositions(analysis: any) {
  const positions = await prisma.position.findMany({
    where: {
      active: true,
    },
    include: {
      department: true,
      employer: true,
    }
  })

  // חשב ציון התאמה לכל משרה
  const scoredPositions = positions.map(position => {
    let score = 0
    
    // התאמת כישורים
    if (analysis.skills && position.requirements) {
      const positionSkills = position.requirements.toLowerCase()
      const matchedSkills = analysis.skills.filter((skill: string) =>
        positionSkills.includes(skill.toLowerCase())
      )
      score += matchedSkills.length * 20
    }
    
    // התאמת ניסיון
    if (analysis.experience >= 3) score += 15
    if (analysis.experience >= 5) score += 10
    
    // התאמת תואר
    if (position.title && analysis.currentTitle) {
      if (position.title.toLowerCase().includes(analysis.currentTitle.toLowerCase())) {
        score += 30
      }
    }
    
    return {
      ...position,
      matchScore: score
    }
  })

  // החזר רק משרות עם ציון מעל 30
  return scoredPositions
    .filter(p => p.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5) // מקסימום 5 משרות
}
