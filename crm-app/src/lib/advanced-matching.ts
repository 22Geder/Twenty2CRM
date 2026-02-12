/**
 * 🚀 מנוע התאמה מתקדם - Twenty2Geder ULTRA V4
 * 
 * 🧠 AI ULTRA RECRUITER - מערכת גיוס מתקדמת ברמה עולמית
 * שילוב של מגייס בכיר עם 20+ שנות ניסיון, פסיכולוג תעסוקתי, ומומחה לניתוח התנהגותי
 * 
 * ✨ יכולות ULTRA:
 * 1. קריאה מעמיקה של קורות חיים - חילוץ כל המידע הרלוונטי
 * 2. קריאה מעמיקה של משרות - הבנה מלאה של דרישות
 * 3. התאמה רב-שכבתית - תגיות + AI + ניסיון + מיקום
 * 4. 🧠 קריאה אנושית ULTRA - ניתוח כמו מגייס אנושי:
 *    - פרופיל פסיכולוגי-מקצועי
 *    - זיהוי סימנים מוסתרים
 *    - תחזית משך עבודה
 *    - ניתוח התאמה תרבותית
 *    - זיהוי Job Hopping Risk
 *    - זיהוי Over/Under Qualification
 *    - ערך ייחודי של המועמד
 *    - שאלות חכמות לראיון
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import { RECRUITMENT_TAGS } from "./recruitment-tags"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// ================== טיפוסים ================== //

export interface DeepResumeAnalysis {
  // פרטים אישיים
  personalInfo: {
    fullName: string
    phone: string
    email: string
    city: string
    age: string | null
    address: string | null
  }
  
  // ניסיון תעסוקתי
  workExperience: {
    totalYears: number
    positions: Array<{
      title: string
      company: string
      duration: string
      responsibilities: string[]
    }>
    currentTitle: string
    lastEmployer: string
  }
  
  // השכלה
  education: {
    level: 'תיכונית' | 'על תיכונית' | 'תואר ראשון' | 'תואר שני' | 'דוקטורט' | 'אחר'
    degrees: string[]
    institutions: string[]
    specializations: string[]
  }
  
  // כישורים
  skills: {
    technical: string[]      // כישורים טכניים (תוכנות, כלים, שפות תכנות)
    professional: string[]   // כישורים מקצועיים ספציפיים לתחום
    soft: string[]          // כישורים רכים (תקשורת, עבודת צוות)
    languages: string[]      // שפות
    certifications: string[] // הסמכות ותעודות
  }
  
  // תחומי עיסוק
  industries: {
    primary: string[]    // תחומים עיקריים
    secondary: string[]  // תחומים משניים
    detected: string[]   // תחומים שזוהו מהטקסט
  }
  
  // מילות מפתח חמות
  hotKeywords: string[]
  
  // סיכום
  summary: string
  
  // רמת ניסיון
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'management' | 'executive'
  
  // תגיות לחיבור עם מערכת התגיות
  matchedTags: string[]
}

export interface DeepPositionAnalysis {
  // פרטי משרה
  basicInfo: {
    title: string
    employer: string
    location: string
    department: string | null
  }
  
  // דרישות
  requirements: {
    mustHave: string[]        // דרישות חובה
    niceToHave: string[]      // דרישות יתרון
    experience: {
      minimum: number
      preferred: number
    }
    education: string[]
    certifications: string[]
  }
  
  // כישורים נדרשים
  skills: {
    technical: string[]
    professional: string[]
    soft: string[]
    languages: string[]
  }
  
  // תחום
  industry: string[]
  
  // רמת הבכירות הנדרשת
  seniorityRequired: 'junior' | 'mid' | 'senior' | 'management' | 'executive'
  
  // מילות מפתח
  keyRequirements: string[]
  
  // תגיות
  matchedTags: string[]
}

export interface AdvancedMatchResult {
  // ציון כולל
  totalScore: number
  
  // פירוט ציונים
  breakdown: {
    skillsMatch: number       // התאמת כישורים (0-30)
    experienceMatch: number   // התאמת ניסיון (0-20)
    industryMatch: number     // התאמת תחום (0-20)
    locationMatch: number     // התאמת מיקום (0-10)
    educationMatch: number    // התאמת השכלה (0-10)
    aiLogicScore: number      // ניתוח AI (0-10)
    humanReadingScore: number // קריאה אנושית (0-15) - חדש!
  }
  
  // פירוט
  details: {
    matchedSkills: string[]
    missingSkills: string[]
    matchedRequirements: string[]
    missingRequirements: string[]
    strengthPoints: string[]
    riskPoints: string[]
    humanInsights: string[]  // תובנות מקריאה אנושית - חדש!
  }
  
  // הסבר
  explanation: string
  
  // קריאה אנושית - חדש!
  humanReading: HumanReadingResult
  
  // המלצה
  recommendation: {
    shouldProceed: boolean
    confidence: 'high' | 'medium' | 'low'
    summaryForEmployer: string
    summaryForRecruiter: string
  }
}

/**
 * 🧠 קריאה אנושית - ניתוח כמו מגייס אנושי
 * לא רק תגיות - באמת קריאה והבנה של הטקסט
 * ULTRA V4 - עם פרופיל פסיכולוגי, ניתוח עומק, וזיהוי סימנים מוסתרים
 */
export interface HumanReadingResult {
  // הבנת המועמד - מורחב
  candidateUnderstanding: {
    whoIsThisPerson: string          // מי זה בן אדם? תיאור אנושי עשיר
    careerPath: string               // מסלול קריירה - לאן הוא הולך?
    motivationGuess: string          // מה כנראה מניע אותו?
    psychologicalProfile?: string    // פרופיל פסיכולוגי - סגנון עבודה ואישיות
    strengthsFromReading: string[]   // חוזקות שעולות מקריאה
    concernsFromReading: string[]    // דאגות/שאלות שעולות
  }
  
  // מצב נוכחי - מורחב
  currentStatus: {
    isCurrentlyEmployed: boolean     // עובד כרגע?
    employmentAnalysis?: string      // ניתוח מצב תעסוקה
    isStudying: boolean              // לומד כרגע?
    studyStatus: 'completed' | 'in_progress' | 'dropped_out' | 'unknown' | 'not_studying'
    studyDetails: string             // פרטי לימודים
    hasCareerGaps: boolean           // פערים בקריירה?
    gapExplanation: string           // הסבר על פערים
    isInTransition: boolean          // במעבר קריירה?
    transitionDetails: string        // פרטי מעבר
    jobHoppingRisk?: string          // סיכון לעזיבה מהירה
  }
  
  // דגלים - מורחב עם סימנים מוסתרים
  flags: {
    greenFlags: string[]             // סימנים חיוביים
    yellowFlags: string[]            // סימנים לתשומת לב
    redFlags: string[]               // סימנים מדאיגים
    hiddenSignals?: string[]         // סימנים מוסתרים שרק מגייס מנוסה רואה
  }
  
  // התאמה למשרה - ניתוח ULTRA
  jobFitAnalysis: {
    fitScore?: number                // ציון התאמה 1-10
    fitExplanation?: string          // הסבר מפורט על ההתאמה
    whatMakesThemGoodFit: string[]   // למה הם מתאימים
    whatMakesThemRisky: string[]     // למה יש סיכון
    overqualifiedRisk?: string       // סיכון over-qualification
    underqualifiedRisk?: string      // סיכון under-qualification
    cultureFitGuess?: string         // הערכת התאמה תרבותית
    longevityPrediction?: string     // תחזית כמה זמן יישאר
    questionsToAsk: string[]         // שאלות שצריך לשאול בראיון
    dealBreakers: string[]           // דברים שיכולים לפסול
    uniqueValue?: string             // הערך הייחודי של המועמד
  }
  
  // סיכום קריאה אנושית
  humanSummary: string               // סיכום כאילו מגייס כתב
  recruiterRecommendation: string    // המלצה למגייס
  confidenceLevel: 'very_confident' | 'confident' | 'uncertain' | 'need_more_info'
  confidenceExplanation?: string     // הסבר לרמת הביטחון
}

// ================== פונקציות ניתוח ================== //

/**
 * 📄 ניתוח עמוק של קורות חיים
 * קורא ומבין את כל המידע בקורות החיים
 */
export async function analyzeResumeDeep(resumeText: string): Promise<DeepResumeAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // חילוץ מילות מפתח מתגיות המערכת
    const allSystemKeywords = getAllSystemKeywords()
    
    const prompt = `אתה מנתח קורות חיים מומחה. נתח את קורות החיים הבאים וחלץ את כל המידע בפירוט רב.

קורות החיים:
"""
${resumeText}
"""

רשימת מילות מפתח מהמערכת (סמן רק את אלו שמופיעות בקורות החיים):
${allSystemKeywords.slice(0, 200).join(', ')}

הנחיות חשובות:
1. קרא בעיון כל מילה בקורות החיים
2. חלץ ניסיון תעסוקתי - כל תפקיד, כל חברה, כל תקופה
3. זהה כישורים טכניים ספציפיים (תוכנות, כלים, שפות)
4. זהה תעודות והסמכות
5. הבן את התחום המקצועי העיקרי
6. זהה רמת הבכירות
7. חלץ מילות מפתח רלוונטיות

החזר JSON בלבד בפורמט הזה:
{
  "personalInfo": {
    "fullName": "שם מלא",
    "phone": "טלפון או 'לא צוין'",
    "email": "אימייל או 'לא צוין'",
    "city": "עיר מגורים או 'לא צוין'",
    "age": "גיל/שנת לידה או null",
    "address": "כתובת מלאה או null"
  },
  "workExperience": {
    "totalYears": מספר שנות ניסיון,
    "positions": [
      {
        "title": "תפקיד",
        "company": "חברה",
        "duration": "תקופה",
        "responsibilities": ["אחריות 1", "אחריות 2"]
      }
    ],
    "currentTitle": "תפקיד אחרון/נוכחי",
    "lastEmployer": "מעסיק אחרון"
  },
  "education": {
    "level": "רמת השכלה",
    "degrees": ["תואר"],
    "institutions": ["מוסד"],
    "specializations": ["התמחות"]
  },
  "skills": {
    "technical": ["Excel", "SAP", "WMS", "מלגזה"],
    "professional": ["ניהול מחסן", "בקרת מלאי"],
    "soft": ["עבודת צוות", "יכולת עבודה תחת לחץ"],
    "languages": ["עברית", "אנגלית"],
    "certifications": ["רישיון מלגזה", "תעודת חשמלאי"]
  },
  "industries": {
    "primary": ["לוגיסטיקה"],
    "secondary": ["קמעונאות"],
    "detected": ["מחסן", "הפצה"]
  },
  "hotKeywords": ["מילות מפתח חמות מתוך הרשימה שנתתי"],
  "summary": "סיכום קצר של המועמד",
  "seniorityLevel": "junior/mid/senior/management/executive",
  "matchedTags": ["תגיות מהרשימה שתואמות"]
}

חשוב מאוד:
- hotKeywords ו-matchedTags חייבים להכיל רק מילים שמופיעות גם בקורות חיים וגם ברשימת מילות המפתח שנתתי
- אם לא מצאת מידע, כתוב "לא צוין" או השאר מערך ריק
- הכל בעברית!
- החזר JSON בלבד, ללא טקסט נוסף`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response")
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // וידוא שדות
    return {
      personalInfo: {
        fullName: parsed.personalInfo?.fullName || 'לא צוין',
        phone: parsed.personalInfo?.phone || 'לא צוין',
        email: parsed.personalInfo?.email || 'לא צוין',
        city: parsed.personalInfo?.city || 'לא צוין',
        age: parsed.personalInfo?.age || null,
        address: parsed.personalInfo?.address || null
      },
      workExperience: {
        totalYears: parsed.workExperience?.totalYears || 0,
        positions: Array.isArray(parsed.workExperience?.positions) ? parsed.workExperience.positions : [],
        currentTitle: parsed.workExperience?.currentTitle || 'לא צוין',
        lastEmployer: parsed.workExperience?.lastEmployer || 'לא צוין'
      },
      education: {
        level: parsed.education?.level || 'אחר',
        degrees: Array.isArray(parsed.education?.degrees) ? parsed.education.degrees : [],
        institutions: Array.isArray(parsed.education?.institutions) ? parsed.education.institutions : [],
        specializations: Array.isArray(parsed.education?.specializations) ? parsed.education.specializations : []
      },
      skills: {
        technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
        professional: Array.isArray(parsed.skills?.professional) ? parsed.skills.professional : [],
        soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : [],
        languages: Array.isArray(parsed.skills?.languages) ? parsed.skills.languages : [],
        certifications: Array.isArray(parsed.skills?.certifications) ? parsed.skills.certifications : []
      },
      industries: {
        primary: Array.isArray(parsed.industries?.primary) ? parsed.industries.primary : [],
        secondary: Array.isArray(parsed.industries?.secondary) ? parsed.industries.secondary : [],
        detected: Array.isArray(parsed.industries?.detected) ? parsed.industries.detected : []
      },
      hotKeywords: Array.isArray(parsed.hotKeywords) ? parsed.hotKeywords : [],
      summary: parsed.summary || '',
      seniorityLevel: parsed.seniorityLevel || 'mid',
      matchedTags: Array.isArray(parsed.matchedTags) ? parsed.matchedTags : []
    }
    
  } catch (error) {
    console.error("Error in deep resume analysis:", error)
    // החזר ברירת מחדל
    return getDefaultResumeAnalysis()
  }
}

/**
 * 📋 ניתוח עמוק של משרה
 */
export async function analyzePositionDeep(
  title: string,
  description: string,
  requirements: string,
  employer: string,
  location: string
): Promise<DeepPositionAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
    
    const allSystemKeywords = getAllSystemKeywords()
    
    const prompt = `אתה מנתח משרות מומחה. נתח את המשרה הבאה וחלץ את כל הדרישות בפירוט.

פרטי המשרה:
כותרת: ${title}
מעסיק: ${employer}
מיקום: ${location}

תיאור המשרה:
"""
${description || 'לא צוין'}
"""

דרישות:
"""
${requirements || 'לא צוין'}
"""

רשימת מילות מפתח מהמערכת:
${allSystemKeywords.slice(0, 200).join(', ')}

הנחיות:
1. זהה דרישות חובה vs יתרון
2. זהה כישורים טכניים נדרשים
3. הבן את רמת הבכירות הנדרשת
4. זהה את התחום המקצועי

החזר JSON:
{
  "basicInfo": {
    "title": "כותרת המשרה",
    "employer": "שם המעסיק",
    "location": "מיקום",
    "department": "מחלקה או null"
  },
  "requirements": {
    "mustHave": ["דרישות חובה"],
    "niceToHave": ["דרישות יתרון"],
    "experience": {
      "minimum": מספר שנים מינימום,
      "preferred": מספר שנים מועדף
    },
    "education": ["דרישות השכלה"],
    "certifications": ["הסמכות נדרשות"]
  },
  "skills": {
    "technical": ["כישורים טכניים נדרשים"],
    "professional": ["כישורים מקצועיים"],
    "soft": ["כישורים רכים"],
    "languages": ["שפות נדרשות"]
  },
  "industry": ["תחומים רלוונטיים"],
  "seniorityRequired": "junior/mid/senior/management/executive",
  "keyRequirements": ["מילות מפתח מרכזיות"],
  "matchedTags": ["תגיות מהרשימה"]
}

הכל בעברית! החזר JSON בלבד.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON")
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      basicInfo: {
        title: parsed.basicInfo?.title || title,
        employer: parsed.basicInfo?.employer || employer,
        location: parsed.basicInfo?.location || location,
        department: parsed.basicInfo?.department || null
      },
      requirements: {
        mustHave: Array.isArray(parsed.requirements?.mustHave) ? parsed.requirements.mustHave : [],
        niceToHave: Array.isArray(parsed.requirements?.niceToHave) ? parsed.requirements.niceToHave : [],
        experience: {
          minimum: parsed.requirements?.experience?.minimum || 0,
          preferred: parsed.requirements?.experience?.preferred || 0
        },
        education: Array.isArray(parsed.requirements?.education) ? parsed.requirements.education : [],
        certifications: Array.isArray(parsed.requirements?.certifications) ? parsed.requirements.certifications : []
      },
      skills: {
        technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
        professional: Array.isArray(parsed.skills?.professional) ? parsed.skills.professional : [],
        soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : [],
        languages: Array.isArray(parsed.skills?.languages) ? parsed.skills.languages : []
      },
      industry: Array.isArray(parsed.industry) ? parsed.industry : [],
      seniorityRequired: parsed.seniorityRequired || 'mid',
      keyRequirements: Array.isArray(parsed.keyRequirements) ? parsed.keyRequirements : [],
      matchedTags: Array.isArray(parsed.matchedTags) ? parsed.matchedTags : []
    }
    
  } catch (error) {
    console.error("Error in deep position analysis:", error)
    return getDefaultPositionAnalysis(title, employer, location)
  }
}

/**
 * 🎯 חישוב התאמה מתקדם
 */
export async function calculateAdvancedMatch(
  resumeAnalysis: DeepResumeAnalysis,
  positionAnalysis: DeepPositionAnalysis,
  resumeText?: string  // הטקסט המקורי לקריאה אנושית
): Promise<AdvancedMatchResult> {
  
  // 1. התאמת כישורים (0-25 נקודות) - הורדנו כי הוספנו קריאה אנושית
  const skillsScore = calculateSkillsMatch(resumeAnalysis, positionAnalysis)
  
  // 2. התאמת ניסיון (0-15 נקודות)
  const experienceScore = calculateExperienceMatch(resumeAnalysis, positionAnalysis)
  
  // 3. התאמת תחום (0-15 נקודות)
  const industryScore = calculateIndustryMatch(resumeAnalysis, positionAnalysis)
  
  // 4. התאמת מיקום (0-10 נקודות)
  const locationScore = calculateLocationMatch(resumeAnalysis, positionAnalysis)
  
  // 5. התאמת השכלה (0-10 נקודות)
  const educationScore = calculateEducationMatch(resumeAnalysis, positionAnalysis)
  
  // 6. ניתוח AI לוגי (0-10 נקודות)
  const aiScore = await calculateAILogicScore(resumeAnalysis, positionAnalysis)
  
  // 7. 🧠 קריאה אנושית (0-15 נקודות) - חדש!
  const humanReading = await performHumanReading(resumeAnalysis, positionAnalysis, resumeText || '')
  const humanReadingScore = calculateHumanReadingScore(humanReading)
  
  const totalScore = Math.min(100, Math.round(
    Math.min(25, skillsScore.score) + 
    Math.min(15, experienceScore.score) + 
    Math.min(15, industryScore.score) + 
    locationScore.score + 
    educationScore.score + 
    aiScore.score +
    humanReadingScore
  ))
  
  // איסוף כל הפרטים
  const matchedSkills = [...new Set([
    ...skillsScore.matched,
    ...industryScore.matchedIndustries
  ])]
  
  const missingSkills = [...new Set([
    ...skillsScore.missing,
    ...industryScore.missingIndustries
  ])]
  
  // קביעת רמת ביטחון - משולב עם קריאה אנושית
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (totalScore >= 75 && skillsScore.score >= 15 && humanReading.confidenceLevel === 'very_confident') {
    confidence = 'high'
  } else if (totalScore < 50 || humanReading.flags.redFlags.length >= 3) {
    confidence = 'low'
  }
  
  // יצירת הסבר
  const explanation = generateExplanation(
    totalScore, skillsScore, experienceScore, industryScore, 
    resumeAnalysis, positionAnalysis
  )
  
  return {
    totalScore,
    breakdown: {
      skillsMatch: Math.min(25, skillsScore.score),
      experienceMatch: Math.min(15, experienceScore.score),
      industryMatch: Math.min(15, industryScore.score),
      locationMatch: locationScore.score,
      educationMatch: educationScore.score,
      aiLogicScore: aiScore.score,
      humanReadingScore
    },
    details: {
      matchedSkills,
      missingSkills,
      matchedRequirements: skillsScore.matchedRequirements,
      missingRequirements: skillsScore.missingRequirements,
      strengthPoints: [
        ...generateStrengths(resumeAnalysis, positionAnalysis, totalScore),
        ...humanReading.flags.greenFlags.slice(0, 2)
      ],
      riskPoints: [
        ...generateRisks(resumeAnalysis, positionAnalysis),
        ...humanReading.flags.redFlags.slice(0, 2)
      ],
      humanInsights: [
        humanReading.candidateUnderstanding.whoIsThisPerson,
        humanReading.candidateUnderstanding.careerPath,
        ...humanReading.jobFitAnalysis.whatMakesThemGoodFit.slice(0, 2)
      ]
    },
    explanation,
    humanReading,
    recommendation: {
      shouldProceed: totalScore >= 55 && humanReading.flags.redFlags.length < 3,
      confidence,
      summaryForEmployer: generateEmployerSummary(resumeAnalysis, positionAnalysis, totalScore),
      summaryForRecruiter: humanReading.recruiterRecommendation
    }
  }
}

/**
 * 🧠 קריאה אנושית ULTRA - מוח AI מגייס ברמה עולמית
 * Premium V4 - השילוב המושלם בין ניסיון גיוס, פסיכולוגיה, וניתוח התנהגותי
 */
async function performHumanReading(
  resumeAnalysis: DeepResumeAnalysis,
  positionAnalysis: DeepPositionAnalysis,
  originalResumeText: string
): Promise<HumanReadingResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
    
    // בניית פרופיל מיקום מפורט
    const positionProfile = `
משרה: ${positionAnalysis.basicInfo.title}
מעסיק: ${positionAnalysis.basicInfo.employer}
תעשייה: ${positionAnalysis.industry.join(', ')}
מיקום: ${positionAnalysis.basicInfo.location}
רמת בכירות נדרשת: ${positionAnalysis.seniorityRequired}
ניסיון נדרש: ${positionAnalysis.requirements.experience.minimum}-${positionAnalysis.requirements.experience.preferred} שנים
כישורי חובה: ${positionAnalysis.requirements.mustHave.join(', ')}
כישורים רצויים: ${positionAnalysis.requirements.niceToHave.join(', ')}
השכלה נדרשת: ${positionAnalysis.requirements.education.join(', ')}
מילות מפתח: ${positionAnalysis.keyRequirements.join(', ')}
    `.trim()

    // בניית פרופיל מועמד מפורט
    const candidateProfile = `
שם: ${resumeAnalysis.personalInfo.fullName}
עיר: ${resumeAnalysis.personalInfo.city}
גיל משוער: ${resumeAnalysis.personalInfo.age || 'לא ידוע'}
תפקיד נוכחי: ${resumeAnalysis.workExperience.currentTitle}
מעסיק אחרון: ${resumeAnalysis.workExperience.lastEmployer}
שנות ניסיון כוללות: ${resumeAnalysis.workExperience.totalYears}
רמת בכירות: ${resumeAnalysis.seniorityLevel}
תחום עיקרי: ${resumeAnalysis.industries.primary.join(', ')}
תחום משני: ${resumeAnalysis.industries.secondary.join(', ')}
כישורים טכניים: ${resumeAnalysis.skills.technical.join(', ')}
כישורים מקצועיים: ${resumeAnalysis.skills.professional.join(', ')}
כישורים רכים: ${resumeAnalysis.skills.soft.join(', ')}
שפות: ${resumeAnalysis.skills.languages.join(', ')}
הסמכות: ${resumeAnalysis.skills.certifications.join(', ')}
השכלה: ${resumeAnalysis.education.level} - ${resumeAnalysis.education.degrees.join(', ')}
מוסדות: ${resumeAnalysis.education.institutions.join(', ')}
סיכום אישי: ${resumeAnalysis.summary}
    `.trim()

    // היסטוריית תעסוקה
    const workHistory = resumeAnalysis.workExperience.positions.map((pos, i) => 
      `${i + 1}. ${pos.title} @ ${pos.company} (${pos.duration})`
    ).join('\n')

    const prompt = `# 🧠 ULTRA AI RECRUITER - מערכת גיוס מתקדמת ברמה עולמית

אתה מערכת AI מתקדמת לגיוס עובדים - השילוב של מגייס בכיר עם 20+ שנות ניסיון, פסיכולוג תעסוקתי, ומומחה לניתוח התנהגותי.

## 🎯 המשימה שלך:
נתח את המועמד הזה ברמת הדיוק והעומק הגבוהה ביותר האפשרית.
קרא בין השורות. זהה את מה שלא נכתב. הבן את האדם מאחורי הCV.

---

## 📄 קורות החיים המקוריים (טקסט גולמי):
"""
${originalResumeText || 'לא זמין'}
"""

---

## 👤 פרופיל מועמד מעובד:
${candidateProfile}

## 💼 היסטוריית תעסוקה:
${workHistory || 'לא זמין'}

---

## 🏢 המשרה שאנחנו בודקים התאמה אליה:
${positionProfile}

---

# 📋 הנחיות ניתוח ULTRA:

## 1. ניתוח פסיכולוגי-התנהגותי:
- מה הסגנון המקצועי של האדם? (יזם? מבצע? מנהיג? צוותי?)
- מה מניע אותו? (כסף? קריירה? יציבות? אתגר? משמעות?)
- איך הוא מתמודד עם לחץ? (לפי דפוסי קריירה)
- מה אומר סגנון הכתיבה שלו? (מפורט? תמציתי? מתרברב? צנוע?)

## 2. ניתוח מסלול קריירה מעמיק:
- האם יש התקדמות לוגית בקריירה?
- האם יש קפיצות לא הגיוניות (למעלה או למטה)?
- האם משך ההעסקה במקומות עבודה סביר?
- האם יש דפוס של בריחה? (עבודות קצרות מדי)
- האם יש דפוס של קיפאון? (שנים רבות באותו תפקיד)

## 3. זיהוי דגלים אדומים מוסתרים:
- פערים לא מוסברים בתאריכים
- ירידה בדרגה או בתחום
- שפה מעורפלת שמסתירה משהו
- הישגים לא מדידים או מוגזמים
- חוסר בהתקדמות על אף שנים רבות
- מעבר תכוף בין תעשיות לא קשורות
- לימודים שלא הושלמו ללא הסבר
- חברות קטנות מדי או לא מוכרות (אפשרי bluff)

## 4. זיהוי דגלים ירוקים יוצאי דופן:
- הישגים מדידים ומרשימים
- התקדמות עקבית ומהירה
- נאמנות מאוזנת (לא קצר מדי, לא ארוך מדי)
- התמחויות ייחודיות ורלוונטיות
- המלצות או פרסים שצוינו
- יוזמות שיצאו מהאדם
- סימנים ללמידה עצמית ושיפור מתמיד

## 5. ניתוח התאמה אמיתית למשרה:
- האם הניסיון באמת רלוונטי או רק נראה רלוונטי?
- האם רמת הבכירות מתאימה?
- האם יש סיכון של over-qualification (ישעמם)?
- האם יש סיכון של under-qualification (לא יצליח)?
- האם יש סימנים שהמשרה הזו היא צעד הגיוני עבורו?
- האם יש סיכון שיעזוב מהר?

## 6. שאלות חכמות לראיון:
צור שאלות שיחשפו:
- את מה שהוא לא כתב
- את הסיבות האמיתיות לעזיבות
- את רמת הידע האמיתית
- את ההתאמה התרבותית
- את המוטיבציה האמיתית

---

# 📤 פורמט התשובה (JSON בלבד):

{
  "candidateUnderstanding": {
    "whoIsThisPerson": "תיאור אנושי עשיר - מי האדם הזה באמת? (2-3 משפטים)",
    "careerPath": "ניתוח מסלול הקריירה - לאן הוא הולך? האם יש כיוון ברור?",
    "motivationGuess": "מה כנראה מניע אותו - וכיצד זה משפיע על התאמתו?",
    "psychologicalProfile": "פרופיל פסיכולוגי קצר - סגנון עבודה, אישיות מקצועית",
    "strengthsFromReading": ["חוזקה 1 - עם הסבר קצר", "חוזקה 2", "חוזקה 3", "חוזקה 4"],
    "concernsFromReading": ["דאגה 1 - עם הסבר קצר", "דאגה 2", "דאגה 3"]
  },
  "currentStatus": {
    "isCurrentlyEmployed": true/false,
    "employmentAnalysis": "האם עובד? איפה? למה כנראה מחפש?",
    "isStudying": true/false,
    "studyStatus": "completed/in_progress/dropped_out/unknown/not_studying",
    "studyDetails": "פירוט מלא על הלימודים - מה למד, איפה, האם סיים, למה לא אם לא",
    "hasCareerGaps": true/false,
    "gapExplanation": "אם יש פערים - מה כנראה קרה? מדאיג או לא?",
    "isInTransition": true/false,
    "transitionDetails": "אם במעבר קריירה - מאיפה לאיפה? הגיוני?",
    "jobHoppingRisk": "low/medium/high - האם יש סיכון שיעזוב מהר?"
  },
  "flags": {
    "greenFlags": ["דבר מרשים 1 - למה זה חשוב", "דבר מרשים 2", "דבר מרשים 3", "דבר מרשים 4"],
    "yellowFlags": ["דבר שדורש בדיקה 1 - מה לשאול", "דבר 2", "דבר 3"],
    "redFlags": ["דבר מדאיג 1 - למה זה בעייתי", "דבר 2"],
    "hiddenSignals": ["סימן מוסתר 1 שאנשים רבים לא שמים לב אליו", "סימן 2"]
  },
  "jobFitAnalysis": {
    "fitScore": 1-10,
    "fitExplanation": "הסבר מפורט - למה מתאים או לא מתאים",
    "whatMakesThemGoodFit": ["סיבה 1 עם הסבר", "סיבה 2", "סיבה 3"],
    "whatMakesThemRisky": ["סיכון 1 עם הסבר", "סיכון 2"],
    "overqualifiedRisk": "none/low/medium/high - האם מתאים מדי?",
    "underqualifiedRisk": "none/low/medium/high - האם חסר ניסיון/כישורים?",
    "cultureFitGuess": "הערכה להתאמה תרבותית אפשרית",
    "longevityPrediction": "כמה זמן סביר שיישאר אם יתקבל?",
    "questionsToAsk": [
      "שאלה חכמה 1 שתחשוף מידע חשוב - [מה היא תחשוף]",
      "שאלה 2 - [מה היא תחשוף]",
      "שאלה 3 - [מה היא תחשוף]",
      "שאלה 4 - [מה היא תחשוף]"
    ],
    "dealBreakers": ["דבר שיכול לפסול - אם יש, עם הסבר למה"],
    "uniqueValue": "מה הערך הייחודי שהמועמד הזה מביא שאולי אין לאחרים?"
  },
  "humanSummary": "סיכום של 3-4 משפטים כאילו מגייס בכיר כתב הערכה למנהל - כולל המלצה ברורה",
  "recruiterRecommendation": "המלצה ברורה וישירה: ☑️ להמשיך בחום / ⚠️ להמשיך בזהירות / ❓ לחקור לעומק / ❌ לא ממליץ - עם הסבר קצר",
  "confidenceLevel": "very_confident/confident/uncertain/need_more_info",
  "confidenceExplanation": "למה אני ברמת ביטחון כזו?"
}

---

# 🎯 הנחיות קריטיות:
1. היה כנה וישיר - גם אם התוצאה שלילית
2. אל תמציא מידע שלא קיים בCV
3. כשאתה לא בטוח - ציין את זה בבירור
4. השתמש בניסוחים מקצועיים אך ברורים
5. חשוב על המועמד כבן אדם אמיתי, לא כנייר
6. הכל בעברית!`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from AI")
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // המרה לפורמט הסטנדרטי עם העשרה
    return {
      candidateUnderstanding: {
        whoIsThisPerson: parsed.candidateUnderstanding?.whoIsThisPerson || 'לא ניתן לקבוע',
        careerPath: parsed.candidateUnderstanding?.careerPath || 'לא ברור',
        motivationGuess: parsed.candidateUnderstanding?.motivationGuess || 'לא ברור',
        psychologicalProfile: parsed.candidateUnderstanding?.psychologicalProfile || '',
        strengthsFromReading: Array.isArray(parsed.candidateUnderstanding?.strengthsFromReading) 
          ? parsed.candidateUnderstanding.strengthsFromReading : [],
        concernsFromReading: Array.isArray(parsed.candidateUnderstanding?.concernsFromReading)
          ? parsed.candidateUnderstanding.concernsFromReading : []
      },
      currentStatus: {
        isCurrentlyEmployed: parsed.currentStatus?.isCurrentlyEmployed ?? true,
        employmentAnalysis: parsed.currentStatus?.employmentAnalysis || '',
        isStudying: parsed.currentStatus?.isStudying ?? false,
        studyStatus: parsed.currentStatus?.studyStatus || 'unknown',
        studyDetails: parsed.currentStatus?.studyDetails || 'לא ידוע',
        hasCareerGaps: parsed.currentStatus?.hasCareerGaps ?? false,
        gapExplanation: parsed.currentStatus?.gapExplanation || '',
        isInTransition: parsed.currentStatus?.isInTransition ?? false,
        transitionDetails: parsed.currentStatus?.transitionDetails || '',
        jobHoppingRisk: parsed.currentStatus?.jobHoppingRisk || 'unknown'
      },
      flags: {
        greenFlags: Array.isArray(parsed.flags?.greenFlags) ? parsed.flags.greenFlags : [],
        yellowFlags: Array.isArray(parsed.flags?.yellowFlags) ? parsed.flags.yellowFlags : [],
        redFlags: Array.isArray(parsed.flags?.redFlags) ? parsed.flags.redFlags : [],
        hiddenSignals: Array.isArray(parsed.flags?.hiddenSignals) ? parsed.flags.hiddenSignals : []
      },
      jobFitAnalysis: {
        fitScore: typeof parsed.jobFitAnalysis?.fitScore === 'number' ? parsed.jobFitAnalysis.fitScore : 5,
        fitExplanation: parsed.jobFitAnalysis?.fitExplanation || '',
        whatMakesThemGoodFit: Array.isArray(parsed.jobFitAnalysis?.whatMakesThemGoodFit)
          ? parsed.jobFitAnalysis.whatMakesThemGoodFit : [],
        whatMakesThemRisky: Array.isArray(parsed.jobFitAnalysis?.whatMakesThemRisky)
          ? parsed.jobFitAnalysis.whatMakesThemRisky : [],
        overqualifiedRisk: parsed.jobFitAnalysis?.overqualifiedRisk || 'none',
        underqualifiedRisk: parsed.jobFitAnalysis?.underqualifiedRisk || 'none',
        cultureFitGuess: parsed.jobFitAnalysis?.cultureFitGuess || '',
        longevityPrediction: parsed.jobFitAnalysis?.longevityPrediction || '',
        questionsToAsk: Array.isArray(parsed.jobFitAnalysis?.questionsToAsk)
          ? parsed.jobFitAnalysis.questionsToAsk : [],
        dealBreakers: Array.isArray(parsed.jobFitAnalysis?.dealBreakers)
          ? parsed.jobFitAnalysis.dealBreakers : [],
        uniqueValue: parsed.jobFitAnalysis?.uniqueValue || ''
      },
      humanSummary: parsed.humanSummary || 'לא ניתן לסכם',
      recruiterRecommendation: parsed.recruiterRecommendation || 'נדרש מידע נוסף',
      confidenceLevel: parsed.confidenceLevel || 'uncertain',
      confidenceExplanation: parsed.confidenceExplanation || ''
    }
    
  } catch (error) {
    console.error("Error in ULTRA human reading:", error)
    return getDefaultHumanReading()
  }
}

/**
 * חישוב ציון קריאה אנושית ULTRA (0-15)
 * מבוסס על ניתוח מעמיק של כל המדדים
 */
function calculateHumanReadingScore(humanReading: HumanReadingResult): number {
  let score = 7 // ציון בסיס
  
  // === ציון התאמה מובנה (אם קיים) ===
  if (humanReading.jobFitAnalysis.fitScore) {
    // fitScore הוא 1-10, נמיר ל-3 נקודות מקסימום
    score += (humanReading.jobFitAnalysis.fitScore - 5) * 0.6
  }
  
  // === בונוס לדגלים ירוקים ===
  score += Math.min(4, humanReading.flags.greenFlags.length * 0.8)
  
  // === הפחתה לדגלים אדומים ===
  score -= Math.min(6, humanReading.flags.redFlags.length * 2.5)
  
  // === הפחתה לדגלים צהובים ===
  score -= Math.min(2, humanReading.flags.yellowFlags.length * 0.5)
  
  // === ניתוח סימנים מוסתרים ===
  if (humanReading.flags.hiddenSignals && humanReading.flags.hiddenSignals.length > 0) {
    // סימנים מוסתרים יכולים להיות חיוביים או שליליים - הפחתה קלה לזהירות
    score -= humanReading.flags.hiddenSignals.length * 0.3
  }
  
  // === רמת ביטחון ===
  if (humanReading.confidenceLevel === 'very_confident') score += 2
  else if (humanReading.confidenceLevel === 'confident') score += 1
  else if (humanReading.confidenceLevel === 'uncertain') score -= 0.5
  else if (humanReading.confidenceLevel === 'need_more_info') score -= 1.5
  
  // === Deal Breakers - קריטי! ===
  if (humanReading.jobFitAnalysis.dealBreakers.length > 0) {
    score -= humanReading.jobFitAnalysis.dealBreakers.length * 3
  }
  
  // === ניתוח פערים בקריירה ===
  if (humanReading.currentStatus.hasCareerGaps) {
    if (humanReading.currentStatus.gapExplanation && 
        humanReading.currentStatus.gapExplanation.length > 10) {
      score -= 0.5 // פערים מוסברים - הפחתה קלה
    } else {
      score -= 2.5 // פערים לא מוסברים - מדאיג
    }
  }
  
  // === סטטוס לימודים ===
  if (humanReading.currentStatus.studyStatus === 'dropped_out') {
    score -= 2
  } else if (humanReading.currentStatus.studyStatus === 'in_progress') {
    score += 0.5 // בונוס - לומד ומתפתח
  } else if (humanReading.currentStatus.studyStatus === 'completed') {
    score += 1 // סיים לימודים
  }
  
  // === סיכון Job Hopping ===
  if (humanReading.currentStatus.jobHoppingRisk === 'high') {
    score -= 2
  } else if (humanReading.currentStatus.jobHoppingRisk === 'medium') {
    score -= 1
  } else if (humanReading.currentStatus.jobHoppingRisk === 'low') {
    score += 0.5
  }
  
  // === סיכוני Over/Under Qualification ===
  if (humanReading.jobFitAnalysis.overqualifiedRisk === 'high') {
    score -= 1.5 // עלול להשתעמם
  } else if (humanReading.jobFitAnalysis.overqualifiedRisk === 'medium') {
    score -= 0.5
  }
  
  if (humanReading.jobFitAnalysis.underqualifiedRisk === 'high') {
    score -= 2 // עלול לא להצליח
  } else if (humanReading.jobFitAnalysis.underqualifiedRisk === 'medium') {
    score -= 1
  }
  
  // === בונוס לערך ייחודי ===
  if (humanReading.jobFitAnalysis.uniqueValue && 
      humanReading.jobFitAnalysis.uniqueValue.length > 20) {
    score += 1 // יש משהו מיוחד במועמד
  }
  
  // === חוזקות מרובות ===
  if (humanReading.candidateUnderstanding.strengthsFromReading.length >= 4) {
    score += 0.5
  }
  
  return Math.max(0, Math.min(15, Math.round(score)))
}

/**
 * ברירת מחדל לקריאה אנושית ULTRA
 */
function getDefaultHumanReading(): HumanReadingResult {
  return {
    candidateUnderstanding: {
      whoIsThisPerson: 'לא ניתן לקבוע - נדרשים קורות חיים לניתוח',
      careerPath: 'לא ברור',
      motivationGuess: 'לא ברור',
      psychologicalProfile: '',
      strengthsFromReading: [],
      concernsFromReading: []
    },
    currentStatus: {
      isCurrentlyEmployed: true,
      employmentAnalysis: '',
      isStudying: false,
      studyStatus: 'unknown',
      studyDetails: 'לא ידוע',
      hasCareerGaps: false,
      gapExplanation: '',
      isInTransition: false,
      transitionDetails: '',
      jobHoppingRisk: 'unknown'
    },
    flags: {
      greenFlags: [],
      yellowFlags: ['לא ניתן לנתח את קורות החיים בצורה מספקת'],
      redFlags: [],
      hiddenSignals: []
    },
    jobFitAnalysis: {
      fitScore: 5,
      fitExplanation: 'נדרש מידע נוסף לניתוח',
      whatMakesThemGoodFit: [],
      whatMakesThemRisky: [],
      overqualifiedRisk: 'none',
      underqualifiedRisk: 'none',
      cultureFitGuess: '',
      longevityPrediction: '',
      questionsToAsk: ['מה הניסיון הרלוונטי שלך למשרה זו?', 'ספר על האתגרים המשמעותיים שהתמודדת איתם'],
      dealBreakers: [],
      uniqueValue: ''
    },
    humanSummary: 'לא ניתן לסכם - נדרש מידע נוסף מקורות החיים',
    recruiterRecommendation: '❓ נדרש מידע נוסף לפני קבלת החלטה',
    confidenceLevel: 'need_more_info',
    confidenceExplanation: 'לא התקבל מספיק מידע לניתוח מעמיק'
  }
}

// ================== פונקציות עזר לחישוב ================== //

function calculateSkillsMatch(resume: DeepResumeAnalysis, position: DeepPositionAnalysis) {
  const candidateSkills = [
    ...resume.skills.technical,
    ...resume.skills.professional,
    ...resume.skills.certifications,
    ...resume.hotKeywords
  ].map(s => s.toLowerCase())
  
  const requiredSkills = [
    ...position.skills.technical,
    ...position.skills.professional,
    ...position.requirements.mustHave,
    ...position.keyRequirements
  ].map(s => s.toLowerCase())
  
  const niceToHave = [
    ...position.requirements.niceToHave,
    ...position.skills.soft
  ].map(s => s.toLowerCase())
  
  let matched: string[] = []
  let missing: string[] = []
  let matchedRequirements: string[] = []
  let missingRequirements: string[] = []
  
  // בדיקת כישורים חובה
  for (const skill of requiredSkills) {
    const found = candidateSkills.some(cs => 
      cs.includes(skill) || skill.includes(cs) || 
      levenshteinSimilarity(cs, skill) > 0.7
    )
    if (found) {
      matched.push(skill)
      matchedRequirements.push(skill)
    } else {
      missing.push(skill)
      missingRequirements.push(skill)
    }
  }
  
  // בדיקת יתרונות
  let bonusPoints = 0
  for (const nice of niceToHave) {
    if (candidateSkills.some(cs => cs.includes(nice) || nice.includes(cs))) {
      bonusPoints += 2
    }
  }
  
  // חישוב ציון
  const matchRatio = requiredSkills.length > 0 
    ? matched.length / requiredSkills.length 
    : 0.5
  
  let score = Math.round(matchRatio * 25) + Math.min(5, bonusPoints)
  score = Math.min(30, Math.max(0, score))
  
  return { score, matched, missing, matchedRequirements, missingRequirements }
}

function calculateExperienceMatch(resume: DeepResumeAnalysis, position: DeepPositionAnalysis) {
  const candidateYears = resume.workExperience.totalYears
  const minimumRequired = position.requirements.experience.minimum
  const preferredYears = position.requirements.experience.preferred
  
  let score = 0
  
  if (candidateYears >= preferredYears && preferredYears > 0) {
    score = 20
  } else if (candidateYears >= minimumRequired) {
    const range = preferredYears - minimumRequired
    const candidateRange = candidateYears - minimumRequired
    score = range > 0 ? Math.round(15 + (candidateRange / range) * 5) : 18
  } else if (candidateYears >= minimumRequired - 1) {
    score = 10 // קרוב לדרישה
  } else {
    score = Math.max(0, 5 - (minimumRequired - candidateYears))
  }
  
  // בונוס לרמת בכירות תואמת
  if (resume.seniorityLevel === position.seniorityRequired) {
    score = Math.min(20, score + 3)
  }
  
  return { 
    score: Math.min(20, Math.max(0, score)),
    candidateYears,
    requiredYears: minimumRequired
  }
}

function calculateIndustryMatch(resume: DeepResumeAnalysis, position: DeepPositionAnalysis) {
  const candidateIndustries = [
    ...resume.industries.primary,
    ...resume.industries.secondary,
    ...resume.industries.detected
  ].map(i => i.toLowerCase())
  
  const positionIndustries = position.industry.map(i => i.toLowerCase())
  
  const matchedIndustries: string[] = []
  const missingIndustries: string[] = []
  
  for (const ind of positionIndustries) {
    if (candidateIndustries.some(ci => ci.includes(ind) || ind.includes(ci))) {
      matchedIndustries.push(ind)
    } else {
      missingIndustries.push(ind)
    }
  }
  
  // בדיקת התאמה גם לפי תגיות
  const tagOverlap = resume.matchedTags.filter(tag => 
    position.matchedTags.some(pt => 
      pt.toLowerCase().includes(tag.toLowerCase()) || 
      tag.toLowerCase().includes(pt.toLowerCase())
    )
  )
  
  let score = 0
  if (positionIndustries.length > 0) {
    score = Math.round((matchedIndustries.length / positionIndustries.length) * 15)
  } else {
    score = 10 // לא צוינו תעשיות - נותנים ציון בינוני
  }
  
  // בונוס לתגיות
  score += Math.min(5, tagOverlap.length * 2)
  
  return { 
    score: Math.min(20, Math.max(0, score)),
    matchedIndustries,
    missingIndustries,
    tagOverlap
  }
}

function calculateLocationMatch(resume: DeepResumeAnalysis, position: DeepPositionAnalysis) {
  const candidateCity = resume.personalInfo.city?.toLowerCase() || ''
  const positionLocation = position.basicInfo.location?.toLowerCase() || ''
  
  if (!candidateCity || candidateCity === 'לא צוין') {
    return { score: 5 } // לא ידוע - נקודות בינוניות
  }
  
  if (!positionLocation || positionLocation === 'לא צוין') {
    return { score: 10 } // לא צוין מיקום - נותנים מלא
  }
  
  // התאמה מדויקת
  if (positionLocation.includes(candidateCity) || candidateCity.includes(positionLocation)) {
    return { score: 10 }
  }
  
  // ערים קרובות (אזור גוש דן)
  const gushDan = ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'פתח תקווה', 'ראשון לציון', 'הרצליה', 'רעננה']
  const isGushDan = (city: string) => gushDan.some(g => city.includes(g))
  
  if (isGushDan(candidateCity) && isGushDan(positionLocation)) {
    return { score: 8 }
  }
  
  // אזור המרכז
  const merkaz = [...gushDan, 'נתניה', 'כפר סבא', 'הוד השרון', 'רחובות', 'נס ציונה', 'לוד', 'רמלה']
  const isMerkaz = (city: string) => merkaz.some(m => city.includes(m))
  
  if (isMerkaz(candidateCity) && isMerkaz(positionLocation)) {
    return { score: 6 }
  }
  
  return { score: 3 } // מרחק גדול
}

function calculateEducationMatch(resume: DeepResumeAnalysis, position: DeepPositionAnalysis) {
  const candidateLevel = resume.education.level
  const requiredEducation = position.requirements.education
  
  if (!requiredEducation || requiredEducation.length === 0) {
    return { score: 10 } // לא נדרשת השכלה ספציפית
  }
  
  // מיפוי רמות
  const levels: { [key: string]: number } = {
    'תיכונית': 1,
    'על תיכונית': 2,
    'תואר ראשון': 3,
    'תואר שני': 4,
    'דוקטורט': 5,
    'אחר': 2
  }
  
  const candidateLevelNum = levels[candidateLevel] || 2
  
  // בדיקה אם יש דרישת תואר
  const needsDegree = requiredEducation.some(r => 
    r.includes('תואר') || r.includes('הנדסאי') || r.includes('אקדמי')
  )
  
  if (needsDegree && candidateLevelNum >= 3) {
    return { score: 10 }
  }
  
  if (needsDegree && candidateLevelNum < 3) {
    return { score: 4 }
  }
  
  // בדיקת הסמכות
  const requiredCerts = position.requirements.certifications
  const candidateCerts = resume.skills.certifications
  
  if (requiredCerts.length > 0) {
    const matchedCerts = requiredCerts.filter(rc => 
      candidateCerts.some(cc => cc.toLowerCase().includes(rc.toLowerCase()))
    )
    return { score: Math.round(5 + (matchedCerts.length / requiredCerts.length) * 5) }
  }
  
  return { score: 7 }
}

async function calculateAILogicScore(
  resume: DeepResumeAnalysis, 
  position: DeepPositionAnalysis
): Promise<{ score: number; reasoning: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
    
    const prompt = `האם המועמד הזה מתאים למשרה? תן ציון 0-10 בלבד.

מועמד:
- תפקיד נוכחי: ${resume.workExperience.currentTitle}
- שנות ניסיון: ${resume.workExperience.totalYears}
- תחומים: ${resume.industries.primary.join(', ')}
- כישורים: ${resume.skills.technical.slice(0, 5).join(', ')}

משרה:
- כותרת: ${position.basicInfo.title}
- דרישות עיקריות: ${position.requirements.mustHave.slice(0, 5).join(', ')}
- תחום: ${position.industry.join(', ')}

תן רק מספר בין 0-10 וסיבה קצרה בפורמט:
SCORE: X
REASON: הסיבה`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
    const reasonMatch = text.match(/REASON:\s*(.+)/i)
    
    const score = scoreMatch ? Math.min(10, parseInt(scoreMatch[1])) : 5
    const reasoning = reasonMatch ? reasonMatch[1] : 'לא צוין'
    
    return { score, reasoning }
  } catch {
    return { score: 5, reasoning: 'לא ניתן לחשב' }
  }
}

// ================== פונקציות עזר ================== //

function getAllSystemKeywords(): string[] {
  const keywords: string[] = []
  for (const category of Object.values(RECRUITMENT_TAGS)) {
    keywords.push(...category.positive)
  }
  return [...new Set(keywords)]
}

function getDefaultResumeAnalysis(): DeepResumeAnalysis {
  return {
    personalInfo: { fullName: 'לא צוין', phone: 'לא צוין', email: 'לא צוין', city: 'לא צוין', age: null, address: null },
    workExperience: { totalYears: 0, positions: [], currentTitle: 'לא צוין', lastEmployer: 'לא צוין' },
    education: { level: 'אחר', degrees: [], institutions: [], specializations: [] },
    skills: { technical: [], professional: [], soft: [], languages: [], certifications: [] },
    industries: { primary: [], secondary: [], detected: [] },
    hotKeywords: [],
    summary: '',
    seniorityLevel: 'mid',
    matchedTags: []
  }
}

function getDefaultPositionAnalysis(title: string, employer: string, location: string): DeepPositionAnalysis {
  return {
    basicInfo: { title, employer, location, department: null },
    requirements: { mustHave: [], niceToHave: [], experience: { minimum: 0, preferred: 0 }, education: [], certifications: [] },
    skills: { technical: [], professional: [], soft: [], languages: [] },
    industry: [],
    seniorityRequired: 'mid',
    keyRequirements: [],
    matchedTags: []
  }
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a || !b) return 0
  
  const matrix: number[][] = []
  for (let i = 0; i <= a.length; i++) matrix[i] = [i]
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,
        matrix[i][j-1] + 1,
        matrix[i-1][j-1] + cost
      )
    }
  }
  
  const distance = matrix[a.length][b.length]
  const maxLength = Math.max(a.length, b.length)
  return 1 - (distance / maxLength)
}

function generateExplanation(
  totalScore: number,
  skillsScore: any,
  experienceScore: any,
  industryScore: any,
  resume: DeepResumeAnalysis,
  position: DeepPositionAnalysis
): string {
  let parts: string[] = []
  
  if (skillsScore.score >= 20) {
    parts.push(`רוב הכישורים הנדרשים נמצאו: ${skillsScore.matched.slice(0, 3).join(', ')}`)
  } else if (skillsScore.missing.length > 0) {
    parts.push(`חסרים כישורים: ${skillsScore.missing.slice(0, 3).join(', ')}`)
  }
  
  if (experienceScore.candidateYears >= experienceScore.requiredYears) {
    parts.push(`ניסיון מספק (${experienceScore.candidateYears} שנים)`)
  } else {
    parts.push(`ניסיון חלקי (${experienceScore.candidateYears}/${experienceScore.requiredYears} שנים)`)
  }
  
  if (industryScore.matchedIndustries.length > 0) {
    parts.push(`התאמה בתחום: ${industryScore.matchedIndustries[0]}`)
  }
  
  return parts.join(' | ')
}

function generateStrengths(
  resume: DeepResumeAnalysis,
  position: DeepPositionAnalysis,
  score: number
): string[] {
  const strengths: string[] = []
  
  if (resume.workExperience.totalYears >= 3) {
    strengths.push(`${resume.workExperience.totalYears} שנות ניסיון בתחום`)
  }
  
  if (resume.skills.certifications.length > 0) {
    strengths.push(`בעל הסמכות: ${resume.skills.certifications[0]}`)
  }
  
  if (resume.skills.technical.length >= 3) {
    strengths.push(`מגוון כישורים טכניים`)
  }
  
  if (resume.seniorityLevel === 'senior' || resume.seniorityLevel === 'management') {
    strengths.push(`ניסיון ניהולי/בכיר`)
  }
  
  if (resume.skills.languages.length >= 2) {
    strengths.push(`רב-לשוני`)
  }
  
  return strengths.slice(0, 5)
}

function generateRisks(
  resume: DeepResumeAnalysis,
  position: DeepPositionAnalysis
): string[] {
  const risks: string[] = []
  
  if (resume.workExperience.totalYears < position.requirements.experience.minimum) {
    risks.push(`ניסיון מתחת לדרישה (${resume.workExperience.totalYears}/${position.requirements.experience.minimum})`)
  }
  
  if (resume.personalInfo.city === 'לא צוין') {
    risks.push('מיקום מגורים לא ידוע')
  }
  
  if (resume.skills.technical.length < 2) {
    risks.push('מעט כישורים טכניים מפורטים')
  }
  
  if (position.requirements.certifications.length > 0) {
    const hasCert = position.requirements.certifications.some(c => 
      resume.skills.certifications.some(rc => rc.toLowerCase().includes(c.toLowerCase()))
    )
    if (!hasCert) {
      risks.push('חסרות הסמכות נדרשות')
    }
  }
  
  return risks.slice(0, 5)
}

function generateEmployerSummary(
  resume: DeepResumeAnalysis,
  position: DeepPositionAnalysis,
  score: number
): string {
  if (score >= 80) {
    return `מועמד מצוין עם ${resume.workExperience.totalYears} שנות ניסיון כ-${resume.workExperience.currentTitle}. בעל רקע מתאים מאוד לתפקיד.`
  }
  if (score >= 60) {
    return `מועמד מתאים עם רקע ב-${resume.industries.primary[0] || 'התחום'}. ${resume.workExperience.totalYears} שנות ניסיון.`
  }
  return `מועמד עם פוטנציאל. יש לבחון התאמה לדרישות ספציפיות.`
}

function generateRecruiterSummary(
  resume: DeepResumeAnalysis,
  position: DeepPositionAnalysis,
  score: number
): string {
  const matched = resume.skills.technical.filter(s => 
    position.skills.technical.some(ps => s.toLowerCase().includes(ps.toLowerCase()))
  )
  
  return `ציון: ${score}% | תואם: ${matched.slice(0, 3).join(', ') || 'ללא'} | ניסיון: ${resume.workExperience.totalYears}ש'`
}


