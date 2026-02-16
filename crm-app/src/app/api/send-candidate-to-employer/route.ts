import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// 🔍 GET - תצוגה מקדימה של המייל לפני שליחה
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const positionId = searchParams.get('positionId')

    if (!candidateId || !positionId) {
      return NextResponse.json(
        { error: "candidateId and positionId are required" },
        { status: 400 }
      )
    }

    // שליפת פרטי המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { tags: true },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // שליפת פרטי המשרה והמעסיק (כולל שדות חדשים)
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { 
        employer: true, 
        tags: true 
      },
    })

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    // בדיקה שיש לפחות מייל אחד (של המעסיק או של איש הקשר)
    const hasEmail = position.employer?.email || (position as any).contactEmail
    if (!hasEmail) {
      return NextResponse.json({ error: "No email found for this position" }, { status: 400 })
    }

    // 📧 שליפת היסטוריית מיילים קודמים למשרה זו
    const previousEmails = await prisma.employerEmailHistory.findMany({
      where: { positionId },
      orderBy: { sentAt: 'desc' },
      take: 10, // עד 10 מיילים אחרונים
    })

    // יצירת משפטי התאמה אוטומטיים
    const matchingPoints = analyzeAndGenerateMatchingPoints(candidate, position, candidate.tags)
    const emailSubject = `מועמד/ת מתאים/ה למשרה: ${position.title} - ${candidate.name}`

    // 📧 בחירת המייל הראשי - עדיפות ל-contactEmail של המשרה
    const positionAny = position as any
    const primaryEmail = positionAny.contactEmail || position.employer?.email
    const primaryName = positionAny.contactName || position.employer?.name

    return NextResponse.json({
      success: true,
      preview: {
        subject: emailSubject,
        matchingPoints,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          city: candidate.city,
          currentTitle: candidate.currentTitle,
          currentCompany: candidate.currentCompany,
          yearsOfExperience: candidate.yearsOfExperience,
          resumeUrl: candidate.resumeUrl,
          tags: candidate.tags.map(t => t.name),
        },
        position: {
          id: position.id,
          title: position.title,
          location: position.location,
          contactEmail: positionAny.contactEmail,   // 📧 מייל ספציפי למשרה
          contactName: positionAny.contactName,     // 📧 שם איש קשר
        },
        employer: {
          id: position.employer?.id,
          name: position.employer?.name,
          email: position.employer?.email,      // מייל המעסיק הראשי
        },
        // 📧 המייל ואיש הקשר הנבחרים
        targetEmail: primaryEmail,
        targetName: primaryName,
      },
      // 📧 היסטוריית מיילים קודמים
      previousEmails: previousEmails.map((email: { id: string; candidateName: string; subject: string; matchingPoints: string; sentAt: Date }) => ({
        id: email.id,
        candidateName: email.candidateName,
        subject: email.subject,
        matchingPoints: JSON.parse(email.matchingPoints),
        sentAt: email.sentAt,
      }))
    })
  } catch (error: any) {
    console.error("Error generating preview:", error)
    return NextResponse.json(
      { error: "Failed to generate preview", details: error.message },
      { status: 500 }
    )
  }
}

// 🤖 פונקציה לניתוח חכם של קורות חיים ויצירת משפטי התאמה
function analyzeAndGenerateMatchingPoints(
  candidate: any,
  position: any,
  candidateTags: any[]
): string[] {
  const matchingPoints: string[] = []
  
  // 1. ניתוח תגיות והתמחויות
  const matchingTagNames = candidateTags
    .filter(tag => position.tags.some((pt: any) => pt.id === tag.id))
    .map(tag => tag.name)
  
  if (matchingTagNames.length > 0) {
    const topSkills = matchingTagNames.slice(0, 4).join(', ')
    matchingPoints.push(
      `${candidate.name} מביא/ה ניסיון מוכח ב-${topSkills}, בדיוק כפי שנדרש למשרה`
    )
  }

  // 2. ניתוח שנות ניסיון
  if (candidate.yearsOfExperience) {
    if (candidate.yearsOfExperience >= 5) {
      matchingPoints.push(
        `עם ${candidate.yearsOfExperience} שנות ניסיון בתחום, ${candidate.name} מציע/ה רקע עשיר ויכולת להשתלב במהירות`
      )
    } else if (candidate.yearsOfExperience >= 2) {
      matchingPoints.push(
        `${candidate.yearsOfExperience} שנות ניסיון מעשי מאפשרות ל-${candidate.name} להתחיל לתרום מיד`
      )
    } else {
      matchingPoints.push(
        `כמועמד/ת עם ${candidate.yearsOfExperience} שנות ניסיון, ${candidate.name} משלב/ת סקרנות עם ידע עדכני בתחום`
      )
    }
  }

  // 3. ניתוח תפקיד נוכחי/קודם
  if (candidate.currentTitle && candidate.currentCompany) {
    matchingPoints.push(
      `כיום ${candidate.currentTitle} ב-${candidate.currentCompany}, הניסיון הרלוונטי מתאים במדויק לדרישות התפקיד`
    )
  } else if (candidate.currentTitle) {
    matchingPoints.push(
      `הניסיון שצבר/ה ${candidate.name} בתפקיד ${candidate.currentTitle} מהווה בסיס איתן למשרה זו`
    )
  }

  // 4. ניתוח מיקום והעדפות
  if (candidate.city && position.location) {
    const canLocation = candidate.city.toLowerCase()
    const posLocation = position.location.toLowerCase()
    
    if (posLocation.includes(canLocation) || canLocation.includes(posLocation)) {
      matchingPoints.push(
        `מיקום גיאוגרפי אידיאלי - ${candidate.name} ממוקם/ת ב-${candidate.city}, קרוב למשרדי החברה`
      )
    } else {
      // בדיקה אזורית
      const tlvArea = ['תל אביב', 'רמת גן', 'גבעתיים', 'חולון', 'בת ים']
      const haifaArea = ['חיפה', 'קריות', 'נהריה', 'עכו']
      const jlmArea = ['ירושלים', 'בית שמש', 'מעלה אדומים']
      
      const inSameRegion = 
        (tlvArea.some(c => posLocation.includes(c.toLowerCase())) && 
         tlvArea.some(c => canLocation.includes(c.toLowerCase()))) ||
        (haifaArea.some(c => posLocation.includes(c.toLowerCase())) && 
         haifaArea.some(c => canLocation.includes(c.toLowerCase()))) ||
        (jlmArea.some(c => posLocation.includes(c.toLowerCase())) && 
         jlmArea.some(c => canLocation.includes(c.toLowerCase())))
      
      if (inSameRegion) {
        matchingPoints.push(
          `מיקום נוח באזור ${candidate.city}, מאפשר הגעה קלה למקום העבודה`
        )
      }
    }
  }

  // 5. ניתוח השכלה והכשרות (אם יש מידע)
  if (candidate.skills && typeof candidate.skills === 'string') {
    const skillsArray = candidate.skills.toLowerCase().split(',').map((s: string) => s.trim())
    const relevantSkills = skillsArray.filter((skill: string) => 
      position.requirements?.toLowerCase().includes(skill) || 
      position.description?.toLowerCase().includes(skill)
    )
    
    if (relevantSkills.length > 0) {
      matchingPoints.push(
        `מיומנויות נוספות כמו ${relevantSkills.slice(0, 2).join(' ו-')} מוסיפות ערך משמעותי למועמדות`
      )
    }
  }

  // 6. ניתוח שכר (אם רלוונטי)
  if (candidate.expectedSalary && position.salaryRange) {
    matchingPoints.push(
      `ציפיות השכר של ${candidate.name} מתאימות לתקציב המשרה ומאפשרות התקדמות חלקה`
    )
  }

  // 7. ניתוח זמינות ותקופת הודעה מוקדמת
  if (candidate.noticePeriod) {
    if (candidate.noticePeriod.toLowerCase().includes('מיידי') || 
        candidate.noticePeriod.toLowerCase().includes('זמין')) {
      matchingPoints.push(
        `זמינות מיידית - ${candidate.name} יכול/ה להתחיל בהקדם האפשרי`
      )
    } else {
      matchingPoints.push(
        `תקופת הודעה מוקדמת של ${candidate.noticePeriod}, מאפשרת תכנון מסודר של המעבר`
      )
    }
  }

  // 8. ניתוח רקע והישגים
  if (candidate.notes && candidate.notes.length > 50) {
    // נתח את ההערות למציאת הישגים
    const notes = candidate.notes.toLowerCase()
    if (notes.includes('פרויקט') || notes.includes('הצלחה') || notes.includes('שיפור')) {
      matchingPoints.push(
        `רקע מרשים עם הישגים מוכחים בניהול פרויקטים ושיפור תהליכים`
      )
    }
  }

  // 9. ניתוח דירוג ואיכות
  if (candidate.rating && candidate.rating >= 4) {
    matchingPoints.push(
      `דירוג גבוה במערכת (${candidate.rating}/5) מעיד על איכות מועמדות יוצאת דופן`
    )
  }

  // 10. הוספת נקודות כלליות איכותיות אם חסרות נקודות
  if (matchingPoints.length < 5) {
    const genericPoints = [
      `${candidate.name} מציג/ה פרופיל מקצועי ומלא, עם קורות חיים מסודרים ומפורטים`,
      `התרשמנו מהגישה המקצועית והרצינות שמשדר/ת ${candidate.name} במועמדות`,
      `שילוב ייחודי של ניסיון מעשי וידע תיאורטי מהווה יתרון משמעותי`,
      `יכולות תקשורת מצוינות ונכונות ללמוד מתבטאות בקורות החיים`,
      `הפרופיל המקצועי מעיד על יכולת הסתגלות גבוהה וחשיבה יצירתית`
    ]
    
    while (matchingPoints.length < 5) {
      matchingPoints.push(genericPoints[matchingPoints.length])
    }
  }

  // החזר בדיוק 5 נקודות
  return matchingPoints.slice(0, 5)
}

// POST /api/send-candidate-to-employer - שליחת מועמד למעסיק
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // קבלת נתונים - כולל משפטי התאמה מותאמים אישית (אופציונלי) ומייל יעד
    const { 
      candidateId, 
      positionId, 
      customMatchingPoints, 
      customSubject,
      targetEmail,      // 📧 המייל שאליו לשלוח (אופציונלי)
      targetName,       // 📧 שם איש הקשר (אופציונלי)
      saveEmailToPosition  // 📧 האם לשמור את המייל למשרה
    } = await request.json()

    if (!candidateId || !positionId) {
      return NextResponse.json(
        { error: "candidateId and positionId are required" },
        { status: 400 }
      )
    }

    // שליפת פרטי המועמד
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        tags: true,
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // שליפת פרטי המשרה והמעסיק (כולל מייל איש קשר)
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        employer: true,
        tags: true,
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    // 📧 קביעת המייל לשליחה - עדיפות למייל שנבחר, אחר כך contactEmail, ולבסוף מייל המעסיק
    const positionAny = position as any
    const emailToSend = targetEmail || positionAny.contactEmail || position.employer?.email
    const nameToAddress = targetName || positionAny.contactName || position.employer?.name

    if (!emailToSend) {
      return NextResponse.json(
        { error: "No email address available for this position" },
        { status: 400 }
      )
    }

    // 📧 אם נבחר לשמור את המייל למשרה ויש מייל חדש
    if (saveEmailToPosition && targetEmail && targetEmail !== positionAny.contactEmail) {
      await prisma.position.update({
        where: { id: positionId },
        data: {
          contactEmail: targetEmail,
          contactName: targetName || positionAny.contactName,
        } as any
      })
      console.log(`📧 Updated position ${positionId} contactEmail to ${targetEmail}`)
    }

    // 🚫 בדיקה: האם המועמד עבד בחברה זו בעבר
    const employerName = position.employer.name.toLowerCase()
    const candidateCompany = candidate.currentCompany?.toLowerCase() || ''
    
    if (candidateCompany && (
      employerName.includes(candidateCompany) || 
      candidateCompany.includes(employerName)
    )) {
      return NextResponse.json(
        { 
          error: `❌ לא ניתן לשלוח - ${candidate.name} כבר עבד/ה ב-${position.employer.name}`,
          workedAtCompanyBefore: true 
        },
        { status: 400 }
      )
    }

    // בדיקת הגדרות SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { error: "SMTP not configured" },
        { status: 500 }
      )
    }

    // 🤖 שימוש במשפטי התאמה מותאמים או יצירה אוטומטית
    const matchingPoints = customMatchingPoints && customMatchingPoints.length === 5
      ? customMatchingPoints
      : analyzeAndGenerateMatchingPoints(candidate, position, candidate.tags)

    // הגדרת SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // בניית המייל - עם נושא מותאם או אוטומטי
    const emailSubject = customSubject || `מועמד/ת מתאים/ה למשרה: ${position.title} - ${candidate.name}`
    
    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.8;
            color: #2c3e50;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
          }
          .intro {
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .candidate-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 30px;
            border-right: 5px solid #667eea;
          }
          .candidate-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .candidate-title {
            font-size: 16px;
            color: #555;
            margin-bottom: 15px;
          }
          .candidate-details {
            display: grid;
            gap: 8px;
            font-size: 14px;
            color: #666;
          }
          .detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .detail-icon {
            color: #667eea;
            font-weight: bold;
          }
          .matching-section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
          }
          .matching-points {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .matching-point {
            background: #f8f9ff;
            padding: 18px;
            margin-bottom: 12px;
            border-radius: 8px;
            border-right: 4px solid #667eea;
            position: relative;
            padding-right: 50px;
          }
          .point-number {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          }
          .point-text {
            font-size: 15px;
            line-height: 1.6;
            color: #2c3e50;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 15px;
          }
          .tag {
            background: #667eea;
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
          }
          .resume-section {
            background: #fff9e6;
            border: 2px dashed #ffc107;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .resume-icon {
            font-size: 40px;
            margin-bottom: 10px;
          }
          .cta-section {
            text-align: center;
            margin: 35px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-size: 17px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #7f8c8d;
            font-size: 13px;
            border-top: 1px solid #dee2e6;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 מועמד/ת מצוין/ת למשרה שלך</h1>
            <p>${position.title}</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              שלום ${nameToAddress},
            </div>
            
            <div class="intro">
              מצאנו מועמד/ת מצוין/ת שעונה על כל הדרישות של המשרה <strong>${position.title}</strong>.
              לאחר ניתוח מעמיק של קורות החיים והתאמתם לדרישות המשרה, אנו בטוחים שזה משהו שכדאי לבדוק.
            </div>

            <div class="candidate-card">
              <div class="candidate-name">📋 ${candidate.name}</div>
              ${candidate.currentTitle ? `<div class="candidate-title">${candidate.currentTitle}${candidate.currentCompany ? ` | ${candidate.currentCompany}` : ''}</div>` : ''}
              
              <div class="candidate-details">
                ${candidate.yearsOfExperience ? `
                  <div class="detail-row">
                    <span class="detail-icon">💼</span>
                    <span>ניסיון: ${candidate.yearsOfExperience} שנים</span>
                  </div>
                ` : ''}
                ${candidate.email ? `
                  <div class="detail-row">
                    <span class="detail-icon">📧</span>
                    <span>${candidate.email}</span>
                  </div>
                ` : ''}
                ${candidate.phone ? `
                  <div class="detail-row">
                    <span class="detail-icon">📱</span>
                    <span>${candidate.phone}</span>
                  </div>
                ` : ''}
                ${candidate.city ? `
                  <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <span>${candidate.city}</span>
                  </div>
                ` : ''}
              </div>

              ${candidate.tags && candidate.tags.length > 0 ? `
                <div class="tags">
                  ${candidate.tags.slice(0, 6).map((tag: any) => `<span class="tag">${tag.name}</span>`).join('')}
                </div>
              ` : ''}
            </div>

            <div class="matching-section">
              <div class="section-title">
                ✨ למה ${candidate.name} מתאים/ה בדיוק למשרה:
              </div>
              
              <ul class="matching-points">
                ${matchingPoints.map((point: string, index: number) => `
                  <li class="matching-point">
                    <div class="point-number">${index + 1}</div>
                    <div class="point-text">${point}</div>
                  </li>
                `).join('')}
              </ul>
            </div>

            ${candidate.resumeUrl ? `
              <div class="resume-section">
                <div class="resume-icon">📄</div>
                <div style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 8px;">
                  קורות חיים מצורפים
                </div>
                <div style="font-size: 14px; color: #666;">
                  הקובץ המלא מצורף למייל זה
                </div>
              </div>
            ` : ''}

            <div class="cta-section">
              <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
                מעוניינים לקדם את המועמדות?
              </p>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${process.env.SMTP_USER}&su=${encodeURIComponent(`עניין במועמד/ת ${candidate.name} למשרה ${position.title}`)}" target="_blank" rel="noopener noreferrer" class="cta-button">
                📞 בואו נדבר
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e9ecef; font-size: 14px; color: #7f8c8d;">
              <strong>💡 טיפ:</strong> מומלץ לקבוע ראיון טלפוני ראשוני בהקדם - מועמדים איכותיים נעלמים מהר!
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">TWENTY2CRM</div>
            <div>מערכת ניהול גיוס מתקדמת</div>
            <div class="contact-info">
              נשלח באמצעות TWENTY2CRM | © 2025 כל הזכויות שמורות
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // יצירת טקסט משפטי ההתאמה
    const matchingPointsText = matchingPoints
      .map((point: string, i: number) => `${i + 1}. ${point}`)
      .join('\n\n')

    // שליחת המייל - למייל שנבחר (contactEmail או מייל המעסיק)
    const mailOptions: any = {
      from: `"${process.env.SMTP_FROM_NAME || 'צוות הגיוס'}" <${process.env.SMTP_USER}>`,
      to: emailToSend,  // 📧 שימוש במייל היעד שנבחר
      subject: emailSubject,
      html: emailHTML,
      text: `
שלום ${nameToAddress},

מצאנו מועמד/ת מצוין/ת למשרה: ${position.title}

שם: ${candidate.name}
${candidate.currentTitle ? `תפקיד נוכחי: ${candidate.currentTitle}` : ''}
${candidate.yearsOfExperience ? `ניסיון: ${candidate.yearsOfExperience} שנים` : ''}

למה ${candidate.name} מתאים/ה:

${matchingPointsText}

${candidate.email ? `אימייל: ${candidate.email}` : ''}
${candidate.phone ? `טלפון: ${candidate.phone}` : ''}

בברכה,
צוות הגיוס
      `.trim()
    }

    // צירוף קורות חיים אם קיימים
    if (candidate.resumeUrl) {
      mailOptions.attachments = [
        {
          filename: `${candidate.name}_CV.pdf`,
          path: candidate.resumeUrl,
        }
      ]
    }

    await transporter.sendMail(mailOptions)

    // 📧 שמירת המייל להיסטוריה
    await prisma.employerEmailHistory.create({
      data: {
        candidateId,
        candidateName: candidate.name,
        positionId,
        positionTitle: position.title,
        employerId: position.employer?.id || '',
        employerName: position.employer?.name || nameToAddress || '',
        employerEmail: emailToSend,  // 📧 שמירת המייל שאליו נשלח בפועל
        subject: emailSubject,
        matchingPoints: JSON.stringify(matchingPoints),
      }
    })

    return NextResponse.json({
      success: true,
      message: `המייל נשלח בהצלחה ל-${emailToSend}`,
      employerEmail: emailToSend,
      recipientName: nameToAddress,
      candidateName: candidate.name,
      matchingPoints,
      emailSavedToPosition: saveEmailToPosition && targetEmail ? true : false
    })

  } catch (error: any) {
    console.error("Error sending candidate to employer:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    )
  }
}
