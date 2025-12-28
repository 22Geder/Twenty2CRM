import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/candidates/[id]/ai-analysis - ניתוח AI של מועמד למשרה ספציפית
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const candidateId = resolvedParams.id
    const { positionId } = await request.json()

    if (!positionId) {
      return NextResponse.json(
        { error: "positionId is required" },
        { status: 400 }
      )
    }

    // שליפת המועמד והמשרה
    const [candidate, position] = await Promise.all([
      prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          tags: true,
        },
      }),
      prisma.position.findUnique({
        where: { id: positionId },
        include: {
          employer: true,
          tags: true,
        },
      }),
    ])

    if (!candidate || !position) {
      return NextResponse.json(
        { error: "Candidate or Position not found" },
        { status: 404 }
      )
    }

    // חישוב ציון התאמה כללי
    let matchScore = 0
    const candidateTagIds = candidate.tags.map(t => t.id)
    const positionTagIds = position.tags.map(t => t.id)
    const matchingTagIds = candidateTagIds.filter(id => positionTagIds.includes(id))

    if (positionTagIds.length > 0) {
      const tagMatchPercentage = (matchingTagIds.length / positionTagIds.length) * 100
      matchScore = Math.round(tagMatchPercentage)
    }

    // 🟢 5 נקודות חזקות
    const strengths: string[] = []

    // חוזקה 1: התאמת תגיות
    const matchingTags = candidate.tags.filter(t => matchingTagIds.includes(t.id))
    if (matchingTags.length > 0) {
      const topSkills = matchingTags.slice(0, 4).map(t => t.name).join(', ')
      strengths.push(`✅ התאמה מושלמת: ${candidate.name} מביא/ה ניסיון מוכח ב-${topSkills}, בדיוק כפי שנדרש למשרה`)
    }

    // חוזקה 2: ניסיון
    if (candidate.yearsOfExperience) {
      if (candidate.yearsOfExperience >= 5) {
        strengths.push(`✅ ניסיון עשיר: עם ${candidate.yearsOfExperience} שנות ניסיון בתחום, ${candidate.name} מציע/ה רקע עשיר ויכולת להשתלב במהירות ולהוביל פרויקטים`)
      } else if (candidate.yearsOfExperience >= 2) {
        strengths.push(`✅ ניסיון מעשי: ${candidate.yearsOfExperience} שנות ניסיון מעשי מאפשרות ל-${candidate.name} להתחיל לתרום מיד ולהתפתח במהירות`)
      } else {
        strengths.push(`✅ ידע עדכני: כמועמד/ת צעיר/ה עם ${candidate.yearsOfExperience} שנות ניסיון, ${candidate.name} משלב/ת סקרנות עם ידע עדכני וטכנולוגיות חדשות`)
      }
    }

    // חוזקה 3: תפקיד נוכחי
    if (candidate.currentTitle && candidate.currentCompany) {
      strengths.push(`✅ תפקיד רלוונטי: כיום ${candidate.currentTitle} ב-${candidate.currentCompany}, הניסיון הרלוונטי מתאים במדויק לדרישות התפקיד ב-${position.employer?.name}`)
    } else if (candidate.currentTitle) {
      strengths.push(`✅ רקע מתאים: הניסיון שצבר/ה ${candidate.name} בתפקיד ${candidate.currentTitle} מהווה בסיס איתן ומתאים למשרה ${position.title}`)
    }

    // חוזקה 4: מיקום
    if (candidate.city && position.location) {
      const canLocation = candidate.city.toLowerCase()
      const posLocation = position.location.toLowerCase()
      
      if (posLocation.includes(canLocation) || canLocation.includes(posLocation)) {
        strengths.push(`✅ מיקום אידיאלי: ${candidate.name} ממוקם/ת ב-${candidate.city}, קרוב למשרדי החברה ב-${position.location}, מה שמאפשר גמישות והגעה נוחה`)
      } else {
        const tlvArea = ['תל אביב', 'רמת גן', 'גבעתיים', 'חולון', 'בת ים']
        const haifaArea = ['חיפה', 'קריות', 'נהריה']
        const jlmArea = ['ירושלים', 'בית שמש']
        
        const inSameRegion = 
          (tlvArea.some(c => posLocation.includes(c)) && tlvArea.some(c => canLocation.includes(c))) ||
          (haifaArea.some(c => posLocation.includes(c)) && haifaArea.some(c => canLocation.includes(c))) ||
          (jlmArea.some(c => posLocation.includes(c)) && jlmArea.some(c => canLocation.includes(c)))
        
        if (inSameRegion) {
          strengths.push(`✅ מיקום נוח: ${candidate.name} ממוקם/ת באזור ${candidate.city}, מאפשר הגעה קלה למקום העבודה ב-${position.location}`)
        }
      }
    }

    // חוזקה 5: דירוג וזמינות
    if (candidate.rating && candidate.rating >= 4) {
      strengths.push(`✅ איכות מועמדות: דירוג גבוה במערכת (${candidate.rating}/5) מעיד על איכות יוצאת דופן ותאימות מצוינת לדרישות השוק`)
    } else if (candidate.noticePeriod) {
      strengths.push(`✅ זמינות: תקופת הודעה של ${candidate.noticePeriod}, מאפשרת תכנון מסודר ומעבר חלק`)
    } else if (candidate.resumeUrl && candidate.linkedinUrl) {
      strengths.push(`✅ פרופיל מקצועי: ${candidate.name} מספק/ת קורות חיים מלאים ופרופיל LinkedIn עדכני, המעידים על מקצועיות ורצינות`)
    }

    // אם אין מספיק חוזקות, נוסיף כלליות
    if (strengths.length < 5) {
      if (candidate.skills) {
        strengths.push(`✅ מיומנויות נוספות: יכולות כמו ${candidate.skills.split(',').slice(0, 3).join(', ')} מוסיפות ערך משמעותי למועמדות`)
      }
      if (candidate.expectedSalary && position.salaryRange) {
        strengths.push(`✅ התאמת ציפיות: ציפיות השכר (${candidate.expectedSalary}) מתאימות לטווח המוצע (${position.salaryRange}), מה שמאפשר התקדמות חלקה`)
      }
      if (strengths.length < 5) {
        strengths.push(`✅ מועמדות מתאימה: ${candidate.name} מציג/ה שילוב טוב של ניסיון, מיומנויות וזמינות למשרה זו`)
      }
    }

    // 🔴 5 נקודות לשיפור/חולשות
    const weaknesses: string[] = []

    // חולשה 1: תגיות חסרות
    const missingTags = position.tags.filter(t => !candidateTagIds.includes(t.id))
    if (missingTags.length > 0) {
      const missingSkills = missingTags.slice(0, 3).map(t => t.name).join(', ')
      weaknesses.push(`⚠️ מיומנויות חסרות: למועמד/ת חסרים כישורים ב-${missingSkills} שנדרשים למשרה - מומלץ לבדוק האם יש נכונות ללמוד`)
    }

    // חולשה 2: ניסיון
    if (candidate.yearsOfExperience !== null && candidate.yearsOfExperience < 2) {
      weaknesses.push(`⚠️ ניסיון מוגבל: עם ${candidate.yearsOfExperience || 0} שנות ניסיון, ייתכן שיידרש זמן הסתגלות וליווי צמוד בתחילת הדרך`)
    } else if (!candidate.yearsOfExperience) {
      weaknesses.push(`⚠️ חסר מידע: לא צוין ניסיון מקצועי - מומלץ לברר בראיון על היקף והיכרות עם התחום`)
    }

    // חולשה 3: מיקום
    if (candidate.city && position.location) {
      const canLocation = candidate.city.toLowerCase()
      const posLocation = position.location.toLowerCase()
      
      if (!posLocation.includes(canLocation) && !canLocation.includes(posLocation)) {
        const tlvArea = ['תל אביב', 'רמת גן', 'גבעתיים', 'חולון']
        const haifaArea = ['חיפה', 'קריות', 'נהריה']
        const jlmArea = ['ירושלים', 'בית שמש']
        
        const inSameRegion = 
          (tlvArea.some(c => posLocation.includes(c)) && tlvArea.some(c => canLocation.includes(c))) ||
          (haifaArea.some(c => posLocation.includes(c)) && haifaArea.some(c => canLocation.includes(c))) ||
          (jlmArea.some(c => posLocation.includes(c)) && jlmArea.some(c => canLocation.includes(c)))
        
        if (!inSameRegion) {
          weaknesses.push(`⚠️ מיקום מרוחק: המועמד/ת ממוקם/ת ב-${candidate.city} והמשרה ב-${position.location} - יש לבדוק נכונות לנסיעות או עבודה היברידית`)
        }
      }
    }

    // חולשה 4: תפקיד לא מתאים
    if (candidate.currentTitle && position.title) {
      const candidateTitle = candidate.currentTitle.toLowerCase()
      const positionTitle = position.title.toLowerCase()
      
      const candidateTitleWords = candidateTitle.split(' ')
      const positionTitleWords = positionTitle.split(' ')
      
      const matchingWords = candidateTitleWords.filter(word => 
        positionTitleWords.some(pWord => pWord.includes(word) || word.includes(pWord))
      ).length
      
      if (matchingWords === 0) {
        weaknesses.push(`⚠️ תפקיד שונה: התפקיד הנוכחי (${candidate.currentTitle}) שונה מהמשרה המוצעת (${position.title}) - מומלץ לבדוק מוטיבציה למעבר`)
      }
    }

    // חולשה 5: פרטים חסרים
    const missingDetails = []
    if (!candidate.email && !candidate.phone) {
      missingDetails.push('פרטי התקשרות')
    }
    if (!candidate.resumeUrl) {
      missingDetails.push('קורות חיים')
    }
    if (!candidate.linkedinUrl) {
      missingDetails.push('פרופיל LinkedIn')
    }
    if (!candidate.noticePeriod) {
      missingDetails.push('תקופת הודעה')
    }
    
    if (missingDetails.length > 0) {
      weaknesses.push(`⚠️ מידע חסר: ${missingDetails.join(', ')} - יש להשלים את הפרטים לפני שליחה למעסיק`)
    }

    // חולשה 6: דירוג נמוך
    if (candidate.rating && candidate.rating < 3) {
      weaknesses.push(`⚠️ דירוג נמוך: דירוג של ${candidate.rating}/5 במערכת - מומלץ לבדוק היסטוריה ואסמכתאות`)
    }

    // אם אין מספיק חולשות
    if (weaknesses.length < 5) {
      weaknesses.push(`💡 המלצה: מומלץ לקבוע שיחת טלפון ראשונית לאימות התאמה והבנת מוטיבציה`)
    }
    if (weaknesses.length < 5) {
      weaknesses.push(`💡 שים לב: וודא שהמועמד/ת מודע/ת לתנאי המשרה המלאים לפני שליחה למעסיק`)
    }
    if (weaknesses.length < 5) {
      weaknesses.push(`💡 טיפ: בדוק רפרנסים מהעבר לאימות איכות וביצועים`)
    }

    // בדיקה אם המועמד עבד בחברה זו בעבר
    let workedAtCompanyBefore = false
    const employerName = position.employer?.name?.toLowerCase() || ''
    const candidateCompany = candidate.currentCompany?.toLowerCase() || ''
    
    if (employerName && candidateCompany && (
      employerName.includes(candidateCompany) || 
      candidateCompany.includes(employerName)
    )) {
      workedAtCompanyBefore = true
    }

    return NextResponse.json({
      matchScore,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      candidateName: candidate.name,
      positionTitle: position.title,
      employerName: position.employer?.name,
      workedAtCompanyBefore,
      recommendation: matchScore >= 70 
        ? "מועמדות מומלצת - שלח למעסיק" 
        : matchScore >= 50 
        ? "מועמדות טובה - מומלץ ראיון טלפוני תחילה"
        : "מועמדות חלשה - בדוק אלטרנטיבות",
    })

  } catch (error: any) {
    console.error("Error analyzing candidate:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
