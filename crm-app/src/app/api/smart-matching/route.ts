import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// POST /api/smart-matching - התאמה חכמה מועמד למשרות
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, resumeText } = body

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      )
    }

    // שלב 1: קבל פרטי מועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        tags: true,
        applications: {
          include: {
            position: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // שלב 2: נתח קורות חיים וזהה כישורים
    let detectedSkills: string[] = []
    if (resumeText) {
      detectedSkills = analyzeResumeForSkills(resumeText)
      
      // הוסף תגיות חדשות למועמד
      const existingTags = await prisma.tag.findMany({
        where: {
          name: {
            in: detectedSkills
          }
        }
      })

      const existingTagNames = existingTags.map(tag => tag.name)
      const newSkills = detectedSkills.filter(skill => !existingTagNames.includes(skill))
      
      // צור תגיות חדשות
      for (const skill of newSkills) {
        await prisma.tag.create({
          data: {
            name: skill,
            type: "SKILL",
            color: getRandomColor()
          }
        })
      }

      // קשר תגיות למועמד
      const allTags = await prisma.tag.findMany({
        where: {
          name: {
            in: detectedSkills
          }
        }
      })

      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          tags: {
            connect: allTags.map(tag => ({ id: tag.id }))
          },
          skills: detectedSkills.join(', ')
        }
      })
    }

    // שלב 3: חפש משרות מתאימות
    const candidateSkills = candidate.tags.map(tag => tag.name).concat(detectedSkills)
    const matchingPositions = await findMatchingPositions(candidate, candidateSkills)

    // שלב 4: צור מועמדויות אוטומטיות למשרות מתאימות
    const createdApplications = []
    for (const match of matchingPositions.slice(0, 3)) { // רק 3 המשרות הטובות ביותר
      if (match.score >= 50) { // רק אם יש התאמה של 50% או יותר
        try {
          const application = await prisma.application.create({
            data: {
              candidateId,
              positionId: match.position.id,
              status: "NEW",
              coverLetter: generateAutoMatchCoverLetter(candidate, match.position, match.matchedSkills)
            },
            include: {
              position: {
                include: {
                  employer: true
                }
              }
            }
          })
          createdApplications.push(application)
        } catch (error) {
          // מועמדות כבר קיימת, תתעלם
          console.log(`Application already exists for candidate ${candidateId} and position ${match.position.id}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      candidateId,
      detectedSkills,
      matchingPositions: matchingPositions.length,
      autoApplications: createdApplications.length,
      applications: createdApplications,
      topMatches: matchingPositions.slice(0, 5).map(match => ({
        position: match.position.title,
        employer: match.position.employer?.name,
        score: Math.round(match.score),
        matchedSkills: match.matchedSkills
      }))
    })

  } catch (error) {
    console.error("Error in smart matching:", error)
    return NextResponse.json(
      { error: "Failed to perform smart matching" },
      { status: 500 }
    )
  }
}

// נתח קורות חיים וזהה כישורים
function analyzeResumeForSkills(resumeText: string): string[] {
  const skillsDatabase = [
    // טכנולוגיות
    "React", "Angular", "Vue.js", "JavaScript", "TypeScript", "Node.js", "Python", "Java", "C#", "PHP",
    "HTML", "CSS", "SCSS", "MongoDB", "MySQL", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS",
    "Azure", "GCP", "Git", "Jenkins", "Linux", "Windows Server", "Nginx", "Apache", "GraphQL", "REST API",
    
    // כישורים רכים בעברית
    "ניהול", "מנהיגות", "עבודת צוות", "תקשורת", "פתרון בעיות", "יצירתיות", "ארגון", "תכנון",
    "מכירות", "שיווק", "שירות לקוחות", "משא ומתן", "הצגה", "הדרכה", "ליווי", "פיתוח עסקי",
    
    // כישורים טכניים בעברית
    "פיתוח", "תכנות", "בדיקות", "QA", "DevOps", "מסדי נתונים", "אבטחת מידע", "רשתות", "אנליטיקה"
  ]

  const text = resumeText.toLowerCase()
  const detectedSkills: string[] = []

  for (const skill of skillsDatabase) {
    if (text.includes(skill.toLowerCase())) {
      detectedSkills.push(skill)
    }
  }

  return [...new Set(detectedSkills)] // הסר כפילויות
}

// מצא משרות מתאימות
async function findMatchingPositions(candidate: any, skills: string[]) {
  const activePositions = await prisma.position.findMany({
    where: {
      active: true
    },
    include: {
      tags: true,
      employer: true,
      applications: {
        where: {
          candidateId: candidate.id
        }
      }
    }
  })

  // סנן משרות שהמועמד כבר התמודד עליהן
  const availablePositions = activePositions.filter(pos => pos.applications.length === 0)

  const matches = availablePositions.map(position => {
    let score = 0
    let matchedSkills: string[] = []

    // התאמת כישורים (70% מהציון)
    const positionSkills = position.tags.map(tag => tag.name)
    for (const skill of skills) {
      if (positionSkills.some(pSkill => pSkill.toLowerCase().includes(skill.toLowerCase()))) {
        score += 20
        matchedSkills.push(skill)
      }
    }

    // התאמת ניסיון (20% מהציון)
    if (candidate.yearsOfExperience) {
      const requiredExperience = extractRequiredExperience(position.requirements || '')
      if (requiredExperience <= candidate.yearsOfExperience) {
        score += Math.min(20, candidate.yearsOfExperience * 3)
      }
    }

    // התאמת כותרת תפקיד (10% מהציון)
    if (candidate.currentTitle && position.title) {
      const titleSimilarity = calculateTitleSimilarity(candidate.currentTitle, position.title)
      score += titleSimilarity * 10
    }

    return {
      position,
      score: Math.min(100, score),
      matchedSkills
    }
  })

  return matches
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
}

// חלץ דרישות ניסיון מטקסט הדרישות
function extractRequiredExperience(requirements: string): number {
  const numbers = requirements.match(/(\d+)\s*(?:שנ|year)/gi)
  if (numbers && numbers.length > 0) {
    return parseInt(numbers[0])
  }
  return 0
}

// חשב דמיון בין כותרות תפקיד
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/)
  const words2 = title2.toLowerCase().split(/\s+/)
  
  let commonWords = 0
  for (const word of words1) {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      commonWords++
    }
  }
  
  return commonWords / Math.max(words1.length, words2.length)
}

// צור מכתב מוטיבציה אוטומטי
function generateAutoMatchCoverLetter(candidate: any, position: any, matchedSkills: string[]): string {
  return `
שלום,

אני ${candidate.name}, מתעניין/ת בתפקיד ${position.title} ב${position.employer?.name}.

בעל/ת ${candidate.yearsOfExperience || 'מספר'} שנות ניסיון כ${candidate.currentTitle || 'מקצוען/ית'}.

הכישורים שלי המתאימים לתפקיד:
${matchedSkills.map(skill => `• ${skill}`).join('\n')}

אשמח להזדמנות לפגישה.

תודה,
${candidate.name}
${candidate.phone || ''}
${candidate.email}

** מכתב זה נוצר אוטומטית על ידי מערכת ההתאמה החכמה **
`.trim()
}

// קבל צבע רנדומלי לתגית
function getRandomColor(): string {
  const colors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", 
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}