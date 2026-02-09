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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
