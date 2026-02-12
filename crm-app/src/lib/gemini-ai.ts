import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

/**
 * ניתוח קורות חיים בעזרת Gemini AI
 * מחלץ כישורים, ניסיון, תחומים עיסוקיים ותגיות
 */
export async function analyzeResumeWithGemini(resumeText: string): Promise<{
  skills: string[]
  experience: number
  industries: string[]
  tags: string[]
  summary: string
  keyStrengths: string[]
}> {
  try {
    // Using the latest stable model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    const prompt = `Analyze this resume and extract the following information in Hebrew:

Resume:
${resumeText}

Please provide a JSON response with these exact fields:
{
  "skills": ["array of professional skills in Hebrew"],
  "experience": number (years of experience),
  "industries": ["array of industry sectors in Hebrew"],
  "tags": ["array of professional tags/specializations in Hebrew"],
  "summary": "one sentence summary of the candidate profile in Hebrew",
  "keyStrengths": ["array of 3-5 key strengths in Hebrew"]
}

Respond ONLY with the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: typeof parsed.experience === "number" ? parsed.experience : 0,
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
    }
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error)
    throw error
  }
}

/**
 * ניתוח תיאור משרה וחילוץ דרישות
 */
export async function analyzeJobDescriptionWithGemini(jobDescription: string): Promise<{
  requiredSkills: string[]
  requiredExperience: number
  industries: string[]
  jobTags: string[]
  keyRequirements: string[]
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    const prompt = `Analyze this job description and extract the following information in Hebrew:

Job Description:
${jobDescription}

Please provide a JSON response with these exact fields:
{
  "requiredSkills": ["array of required professional skills in Hebrew"],
  "requiredExperience": number (years of experience required),
  "industries": ["array of relevant industry sectors in Hebrew"],
  "jobTags": ["array of job tags/specializations in Hebrew"],
  "keyRequirements": ["array of 3-5 key job requirements in Hebrew"]
}

Respond ONLY with the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
      requiredExperience: typeof parsed.requiredExperience === "number" ? parsed.requiredExperience : 0,
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      jobTags: Array.isArray(parsed.jobTags) ? parsed.jobTags : [],
      keyRequirements: Array.isArray(parsed.keyRequirements) ? parsed.keyRequirements : [],
    }
  } catch (error) {
    console.error("Error analyzing job description with Gemini:", error)
    throw error
  }
}

/**
 * חישוב ניקוד התאמה בין מועמד למשרה
 * משתמש ב-Gemini לניתוח עמוק של התאמה
 */
export async function calculateMatchScoreWithGemini(
  candidateProfile: {
    skills: string[]
    experience: number
    industries: string[]
    tags: string[]
    summary: string
    keyStrengths: string[]
  },
  jobProfile: {
    requiredSkills: string[]
    requiredExperience: number
    industries: string[]
    jobTags: string[]
    keyRequirements: string[]
  }
): Promise<{
  score: number
  reasoning: string
  matchedSkills: string[]
  missingSkills: string[]
  experienceFit: string
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    const prompt = `Analyze the match between a candidate and a job position:

Candidate Profile:
- Skills: ${candidateProfile.skills.join(", ")}
- Experience: ${candidateProfile.experience} years
- Industries: ${candidateProfile.industries.join(", ")}
- Specializations: ${candidateProfile.tags.join(", ")}
- Summary: ${candidateProfile.summary}
- Key Strengths: ${candidateProfile.keyStrengths.join(", ")}

Job Requirements:
- Required Skills: ${jobProfile.requiredSkills.join(", ")}
- Required Experience: ${jobProfile.requiredExperience} years
- Industries: ${jobProfile.industries.join(", ")}
- Specializations: ${jobProfile.jobTags.join(", ")}
- Key Requirements: ${jobProfile.keyRequirements.join(", ")}

Please provide a JSON response in Hebrew:
{
  "score": number (0-100, matching percentage),
  "reasoning": "explanation of the match score in Hebrew",
  "matchedSkills": ["array of skills that match in Hebrew"],
  "missingSkills": ["array of important missing skills in Hebrew"],
  "experienceFit": "assessment of experience fit in Hebrew"
}

Respond ONLY with the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      score: Math.max(0, Math.min(100, typeof parsed.score === "number" ? parsed.score : 0)),
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      experienceFit: typeof parsed.experienceFit === "string" ? parsed.experienceFit : "",
    }
  } catch (error) {
    console.error("Error calculating match score with Gemini:", error)
    throw error
  }
}

/**
 * זיכרון בוט - אימון מתמשך של מודל ההתאמה
 * שמירת התאמות היסטוריות כדי להשפר ב-דיוק
 */
export async function improveMatchingWithFeedback(
  feedback: Array<{
    candidateName: string
    jobTitle: string
    initialScore: number
    hiringOutcome: boolean // true = hired, false = not hired
    reason?: string
  }>
): Promise<{
  insights: string[]
  recommendedChanges: string[]
  improvementAreas: string[]
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    const feedbackText = feedback
      .map(
        (f) =>
          `Candidate: ${f.candidateName}, Job: ${f.jobTitle}, Score: ${f.initialScore}, Hired: ${f.hiringOutcome}, Reason: ${f.reason || "Not specified"}`
      )
      .join("\n")

    const prompt = `Analyze this hiring feedback data and provide insights to improve matching accuracy:

Feedback Data:
${feedbackText}

Based on this historical data, provide in Hebrew:
{
  "insights": ["array of key insights from the hiring patterns in Hebrew"],
  "recommendedChanges": ["array of recommended changes to improve matching in Hebrew"],
  "improvementAreas": ["array of areas where the matching algorithm should focus more in Hebrew"]
}

Respond ONLY with the JSON, no additional text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        insights: [],
        recommendedChanges: [],
        improvementAreas: [],
      }
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      recommendedChanges: Array.isArray(parsed.recommendedChanges) ? parsed.recommendedChanges : [],
      improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
    }
  } catch (error) {
    console.error("Error improving matching with feedback:", error)
    return {
      insights: [],
      recommendedChanges: [],
      improvementAreas: [],
    }
  }
}

/**
 * 🎯 מנוע התאמה כפול (Dual-Layer Matching) - Twenty2Geder Premium
 * מבצע ניתוח מתקדם של מועמד מול כל המשרות ומחזיר את ההתאמה הטובה ביותר
 */
export interface CandidateCard {
  fullName: string
  city: string
  age: string
  phone: string
  email: string
  hotTags: string[] // מילות מפתח שנמצאו גם ב-CV וגם במשרות
  currentTitle: string
  yearsExperience: number
}

export interface DualLayerAnalysis {
  technicalMatch: {
    score: number
    matched: string[]
    missing: string[]
    explanation: string
  }
  aiLogicMatch: {
    score: number
    explanation: string
    relevanceAssessment: string
  }
}

export interface ProsCons {
  pros: string[]
  cons: string[]
}

export interface PositionMatch {
  positionId: string
  positionTitle: string
  employerName: string
  location: string
  weightedScore: number
  dualAnalysis: DualLayerAnalysis
  prosCons: ProsCons
  recommendation: {
    shouldProceed: boolean
    summaryForEmployer: string
  }
}

export interface DualLayerMatchResult {
  candidateCard: CandidateCard
  bestMatch: PositionMatch | null
  allMatches: PositionMatch[]
  analysisTimestamp: string
}

export async function performDualLayerMatching(
  candidateData: {
    name: string
    phone?: string
    email?: string
    city?: string
    age?: string
    currentTitle?: string
    yearsOfExperience?: number
    resumeText: string
    skills?: string[]
  },
  positions: Array<{
    id: string
    title: string
    description?: string
    requirements?: string
    employerName?: string
    location?: string
    tags?: string[]
  }>
): Promise<DualLayerMatchResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // בניית רשימת מילות מפתח מכל המשרות
    const allPositionKeywords = new Set<string>()
    positions.forEach(pos => {
      pos.tags?.forEach(tag => allPositionKeywords.add(tag.toLowerCase()))
      // חילוץ מילות מפתח מתיאור ודרישות
      const text = `${pos.title} ${pos.description || ''} ${pos.requirements || ''}`
      const keywords = extractKeywords(text)
      keywords.forEach(kw => allPositionKeywords.add(kw.toLowerCase()))
    })

    const positionsContext = positions.map(p => 
      `ID: ${p.id}
      משרה: ${p.title}
      מעסיק: ${p.employerName || 'לא צוין'}
      מיקום: ${p.location || 'לא צוין'}
      תיאור: ${p.description || 'לא צוין'}
      דרישות: ${p.requirements || 'לא צוין'}
      תגיות: ${p.tags?.join(', ') || 'לא צוינו'}`
    ).join('\n\n---\n\n')

    const prompt = `אתה מנהל גיוס בכיר ומנתח דאטה של חברת Twenty2Geder. 

קורות החיים של המועמד:
${candidateData.resumeText}

פרטים נוספים על המועמד:
- שם: ${candidateData.name || 'לא צוין'}
- טלפון: ${candidateData.phone || 'לא צוין'}
- אימייל: ${candidateData.email || 'לא צוין'}
- עיר: ${candidateData.city || 'לא צוין'}
- גיל: ${candidateData.age || 'לא צוין'}
- תפקיד נוכחי: ${candidateData.currentTitle || 'לא צוין'}
- שנות ניסיון: ${candidateData.yearsOfExperience || 'לא צוין'}

רשימת המשרות הפתוחות:
${positionsContext}

משימתך:
1. נתח את קורות החיים וזהה את כל מילות המפתח (Skills/Technologies)
2. מצא את המשרה הכי מתאימה מתוך הרשימה
3. בצע ניתוח כפול: התאמה טכנית (לפי תגיות) + התאמה לוגית (לפי הגיון מגייס)
4. פרט בדיוק 5 יתרונות ו-5 חסרונות/סיכונים
5. תן המלצה סופית

החזר תשובה ב-JSON בלבד בפורמט הבא:
{
  "candidateCard": {
    "fullName": "שם מלא",
    "city": "עיר",
    "age": "גיל או 'לא צוין'",
    "phone": "טלפון",
    "email": "אימייל",
    "hotTags": ["תג1", "תג2", "תג3"],
    "currentTitle": "תפקיד נוכחי",
    "yearsExperience": מספר
  },
  "bestMatch": {
    "positionId": "ID של המשרה הכי מתאימה",
    "positionTitle": "שם המשרה",
    "employerName": "שם המעסיק",
    "location": "מיקום",
    "weightedScore": מספר 0-100,
    "dualAnalysis": {
      "technicalMatch": {
        "score": מספר 0-100,
        "matched": ["כישור תואם 1", "כישור תואם 2"],
        "missing": ["כישור חסר 1", "כישור חסר 2"],
        "explanation": "הסבר קצר על ההתאמה הטכנית"
      },
      "aiLogicMatch": {
        "score": מספר 0-100,
        "explanation": "האם הניסיון באמת רלוונטי לאופי התפקיד?",
        "relevanceAssessment": "הערכה עמוקה של ההתאמה מעבר לתגיות"
      }
    },
    "prosCons": {
      "pros": ["יתרון 1", "יתרון 2", "יתרון 3", "יתרון 4", "יתרון 5"],
      "cons": ["חיסרון/סיכון 1", "חיסרון/סיכון 2", "חיסרון/סיכון 3", "חיסרון/סיכון 4", "חיסרון/סיכון 5"]
    },
    "recommendation": {
      "shouldProceed": true/false,
      "summaryForEmployer": "פסקה קצרה למעסיק שמסכמת את היתרונות"
    }
  },
  "topMatches": [
    {"positionId": "ID", "positionTitle": "שם", "score": מספר}
  ]
}

חשוב מאוד:
- התגיות החמות (hotTags) חייבות להיות מילות מפתח שנמצאות גם ב-CV וגם ברשימת המשרות
- ציון ההתאמה המשוקלל = 60% התאמה טכנית + 40% התאמה לוגית
- חובה לתת בדיוק 5 יתרונות ו-5 חסרונות, גם אם המועמד מצוין או חלש
- הכל בעברית!

החזר JSON בלבד, ללא טקסט נוסף.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini")
    }

    const parsed = JSON.parse(jsonMatch[0])

    // עיבוד התוצאה
    const candidateCard: CandidateCard = {
      fullName: parsed.candidateCard?.fullName || candidateData.name || 'לא צוין',
      city: parsed.candidateCard?.city || candidateData.city || 'לא צוין',
      age: parsed.candidateCard?.age || candidateData.age || 'לא צוין',
      phone: parsed.candidateCard?.phone || candidateData.phone || 'לא צוין',
      email: parsed.candidateCard?.email || candidateData.email || 'לא צוין',
      hotTags: Array.isArray(parsed.candidateCard?.hotTags) ? parsed.candidateCard.hotTags : [],
      currentTitle: parsed.candidateCard?.currentTitle || candidateData.currentTitle || 'לא צוין',
      yearsExperience: typeof parsed.candidateCard?.yearsExperience === 'number' 
        ? parsed.candidateCard.yearsExperience 
        : candidateData.yearsOfExperience || 0
    }

    let bestMatch: PositionMatch | null = null
    if (parsed.bestMatch) {
      bestMatch = {
        positionId: parsed.bestMatch.positionId || '',
        positionTitle: parsed.bestMatch.positionTitle || '',
        employerName: parsed.bestMatch.employerName || '',
        location: parsed.bestMatch.location || '',
        weightedScore: Math.max(0, Math.min(100, parsed.bestMatch.weightedScore || 0)),
        dualAnalysis: {
          technicalMatch: {
            score: parsed.bestMatch.dualAnalysis?.technicalMatch?.score || 0,
            matched: parsed.bestMatch.dualAnalysis?.technicalMatch?.matched || [],
            missing: parsed.bestMatch.dualAnalysis?.technicalMatch?.missing || [],
            explanation: parsed.bestMatch.dualAnalysis?.technicalMatch?.explanation || ''
          },
          aiLogicMatch: {
            score: parsed.bestMatch.dualAnalysis?.aiLogicMatch?.score || 0,
            explanation: parsed.bestMatch.dualAnalysis?.aiLogicMatch?.explanation || '',
            relevanceAssessment: parsed.bestMatch.dualAnalysis?.aiLogicMatch?.relevanceAssessment || ''
          }
        },
        prosCons: {
          pros: ensureFiveItems(parsed.bestMatch.prosCons?.pros || [], 'יתרון'),
          cons: ensureFiveItems(parsed.bestMatch.prosCons?.cons || [], 'סיכון')
        },
        recommendation: {
          shouldProceed: parsed.bestMatch.recommendation?.shouldProceed ?? false,
          summaryForEmployer: parsed.bestMatch.recommendation?.summaryForEmployer || ''
        }
      }
    }

    // עיבוד כל ההתאמות
    const allMatches: PositionMatch[] = []
    if (Array.isArray(parsed.topMatches)) {
      for (const match of parsed.topMatches.slice(0, 5)) {
        if (match.positionId && match.positionId !== bestMatch?.positionId) {
          allMatches.push({
            positionId: match.positionId,
            positionTitle: match.positionTitle || '',
            employerName: match.employerName || '',
            location: match.location || '',
            weightedScore: match.score || 0,
            dualAnalysis: {
              technicalMatch: { score: 0, matched: [], missing: [], explanation: '' },
              aiLogicMatch: { score: 0, explanation: '', relevanceAssessment: '' }
            },
            prosCons: { pros: [], cons: [] },
            recommendation: { shouldProceed: false, summaryForEmployer: '' }
          })
        }
      }
    }

    return {
      candidateCard,
      bestMatch,
      allMatches,
      analysisTimestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error("Error in dual-layer matching:", error)
    throw error
  }
}

// פונקציה עזר לחילוץ מילות מפתח
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>()
  
  // מילות מפתח נפוצות בגיוס
  const commonKeywords = [
    'מכירות', 'שירות', 'לקוחות', 'ניהול', 'מחסן', 'לוגיסטיקה', 'נהג', 'מלגזה',
    'אקסל', 'אופיס', 'מחשב', 'טלפון', 'צוות', 'בכיר', 'זוטר', 'מנהל',
    'תפעול', 'אחזקה', 'חשמל', 'מכונות', 'ייצור', 'קו ייצור', 'בקרת איכות',
    'הנדסה', 'טכנאי', 'פיתוח', 'תוכנה', 'IT', 'רכב', 'מוסך', 'תחזוקה',
    'פקידות', 'מזכירות', 'הנהלת חשבונות', 'כספים', 'גבייה', 'רכש',
    'משאבי אנוש', 'גיוס', 'הדרכה', 'שיווק', 'דיגיטל', 'קמעונאות',
    'WMS', 'ERP', 'SAP', 'CRM', 'Python', 'JavaScript', 'SQL',
    'ליסינג', 'ביטוח', 'בנקאות', 'פיננסים', 'קייטרינג', 'מטבח'
  ]
  
  const textLower = text.toLowerCase()
  for (const kw of commonKeywords) {
    if (textLower.includes(kw.toLowerCase())) {
      keywords.add(kw)
    }
  }
  
  return Array.from(keywords)
}

// פונקציה עזר - וידוא 5 פריטים בדיוק
function ensureFiveItems(items: string[], prefix: string): string[] {
  const result = [...items]
  while (result.length < 5) {
    result.push(`${prefix} ${result.length + 1} - לא זוהה`)
  }
  return result.slice(0, 5)
}

/**
 * 📊 יצירת כרטיס מועמד מהיר (Candidate Quick Card)
 * מחזיר תצוגה מהירה של המועמד עם התגיות החמות
 */
export async function generateCandidateQuickCard(
  candidateData: {
    name: string
    phone?: string
    email?: string
    city?: string
    resumeText: string
  },
  availableTags: string[]
): Promise<CandidateCard> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    const prompt = `נתח את קורות החיים וחלץ את המידע הבא:

קורות חיים:
${candidateData.resumeText}

רשימת התגיות הזמינות במערכת:
${availableTags.join(', ')}

החזר JSON בלבד:
{
  "fullName": "שם מלא מה-CV",
  "city": "עיר מגורים",
  "age": "גיל או תאריך לידה",
  "phone": "${candidateData.phone || 'חפש ב-CV'}",
  "email": "${candidateData.email || 'חפש ב-CV'}",
  "hotTags": ["רק תגיות שמופיעות גם ב-CV וגם ברשימה הזמינה"],
  "currentTitle": "תפקיד אחרון",
  "yearsExperience": מספר שנות ניסיון
}

חשוב: hotTags חייבים להיות רק תגיות שקיימות ברשימה הזמינה!
החזר JSON בלבד.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error("Invalid response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      fullName: parsed.fullName || candidateData.name,
      city: parsed.city || candidateData.city || 'לא צוין',
      age: parsed.age || 'לא צוין',
      phone: parsed.phone || candidateData.phone || 'לא צוין',
      email: parsed.email || candidateData.email || 'לא צוין',
      hotTags: Array.isArray(parsed.hotTags) ? parsed.hotTags : [],
      currentTitle: parsed.currentTitle || 'לא צוין',
      yearsExperience: parsed.yearsExperience || 0
    }

  } catch (error) {
    console.error("Error generating quick card:", error)
    return {
      fullName: candidateData.name,
      city: candidateData.city || 'לא צוין',
      age: 'לא צוין',
      phone: candidateData.phone || 'לא צוין',
      email: candidateData.email || 'לא צוין',
      hotTags: [],
      currentTitle: 'לא צוין',
      yearsExperience: 0
    }
  }
}


