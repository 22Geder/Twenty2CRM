// ========================================================================
// פונקציות AI מתקדמות לניתוח קורות חיים והתאמת משרות
// Twenty2CRM - גרסה משופרת
// ========================================================================

import { Job } from './jobs-data';

export interface CVAnalysisResult {
  candidateDetails: CandidateDetails;
  matchedJobs: JobMatch[];
  unmatchedReasons: UnmatchedReason[];
  aiSummary: string;
  goodPoints: string[];
  concernPoints: string[];
}

export interface CandidateDetails {
  name: string;
  phone: string;
  email: string;
  city: string;
  age: string;
  idNumber: string;
  experience: string[];
  education: string[];
  skills: string[];
  languages: string[];
  currentTitle: string;
  yearsOfExperience: number;
  rawText: string;
}

export interface JobMatch {
  job: Job;
  score: number;
  matchingPoints: string[];  // 5 נקודות למה מתאים
  concerns: string[];        // 5 נקודות למה לא מתאים
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
}

export interface UnmatchedReason {
  jobTitle: string;
  reason: string;
}

// ========================================================================
// פונקציה ראשית לניתוח קורות חיים
// ========================================================================
export function analyzeCV(cvText: string, allJobs: Job[]): CVAnalysisResult {
  // חילוץ פרטי המועמד
  const candidateDetails = extractCandidateDetails(cvText);
  
  // ניתוח והתאמת משרות
  const allMatches = allJobs.map(job => analyzeJobMatch(job, candidateDetails, cvText));
  
  // מיון לפי ציון
  allMatches.sort((a, b) => b.score - a.score);
  
  // 5 משרות מתאימות ביותר
  const matchedJobs = allMatches.filter(m => m.score >= 30).slice(0, 5);
  
  // 5 משרות עם סיבות לאי התאמה
  const unmatchedReasons = allMatches
    .filter(m => m.score < 30)
    .slice(0, 5)
    .map(m => ({
      jobTitle: m.job.title,
      reason: m.concerns[0] || 'לא נמצאה התאמה מספקת'
    }));
  
  // יצירת סיכום AI
  const aiSummary = generateAISummary(candidateDetails, matchedJobs);
  
  // 5 נקודות טובות כלליות על המועמד
  const goodPoints = extractGoodPoints(candidateDetails);
  
  // 5 נקודות לשיפור
  const concernPoints = extractConcernPoints(candidateDetails);
  
  return {
    candidateDetails,
    matchedJobs,
    unmatchedReasons,
    aiSummary,
    goodPoints,
    concernPoints
  };
}

// ========================================================================
// חילוץ פרטי מועמד
// ========================================================================
export function extractCandidateDetails(text: string): CandidateDetails {
  const lines = text.split('\n').filter(l => l.trim());
  
  // חילוץ שם
  let name = '';
  for (const line of lines.slice(0, 5)) {
    const cleanLine = line.trim();
    if (cleanLine.length > 3 && cleanLine.length < 50 && 
        !cleanLine.includes('@') && !/\d{9,}/.test(cleanLine) &&
        !/^[\d\s\-\/\.]+$/.test(cleanLine)) {
      name = cleanLine;
      break;
    }
  }

  // חילוץ טלפון
  const phoneMatch = text.match(/(?:טלפון|נייד|פלאפון|טל|phone|mobile)?[:\s]*(\+?972|0)?[-\s]?([5][0-9])[-\s]?(\d{3})[-\s]?(\d{4})/i);
  let phone = '';
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[^\d+]/g, '').replace(/^972/, '0').replace(/^\+972/, '0');
    if (!phone.startsWith('0')) phone = '0' + phone;
  }

  // חילוץ אימייל
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // חילוץ תעודת זהות
  let idNumber = '';
  const idMatch = text.match(/(?:ת\.?ז\.?|תעודת זהות|מספר זהות|ID)[:\s]*(\d{9})/i);
  if (idMatch) {
    idNumber = idMatch[1];
  } else {
    const standaloneId = text.match(/\b(\d{9})\b/);
    if (standaloneId && !phone.includes(standaloneId[1])) {
      idNumber = standaloneId[1];
    }
  }

  // חילוץ עיר מגורים
  const cities = [
    'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'אשדוד', 'אשקלון', 'רמת גן', 'בני ברק',
    'פתח תקווה', 'חולון', 'בת ים', 'נתניה', 'הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון',
    'רמת השרון', 'ראשון לציון', 'רחובות', 'נס ציונה', 'לוד', 'רמלה', 'מודיעין',
    'גבעתיים', 'קרית אונו', 'דימונה', 'ערד', 'אילת', 'נצרת', 'עכו', 'קריית שמונה',
    'טבריה', 'צפת', 'נשר', 'קריית אתא', 'קריית גת', 'שדרות', 'אופקים', 'נתיבות',
    'יבנה', 'גדרה', 'שוהם', 'יהוד', 'אור יהודה', 'בית שמש'
  ];
  
  let city = '';
  const cityMatch = text.match(new RegExp(`(?:מגורים|כתובת|עיר|גר ב|מתגורר ב)[:\\s]*(${cities.join('|')})`, 'i'));
  if (cityMatch) {
    city = cityMatch[1];
  } else {
    for (const c of cities) {
      if (text.includes(c)) {
        city = c;
        break;
      }
    }
  }

  // חילוץ גיל
  let age = '';
  const birthMatch = text.match(/(?:תאריך לידה|נולד|יליד|גיל)[:\s]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i);
  if (birthMatch) {
    const year = birthMatch[3].length === 2 ? 
      (parseInt(birthMatch[3]) > 50 ? '19' + birthMatch[3] : '20' + birthMatch[3]) : 
      birthMatch[3];
    const birthYear = parseInt(year);
    const currentYear = new Date().getFullYear();
    age = (currentYear - birthYear).toString();
  } else {
    const ageMatch = text.match(/(?:גיל|בן|בת)[:\s]*(\d{2})/);
    if (ageMatch) age = ageMatch[1];
  }

  // חילוץ ניסיון
  const experience: string[] = [];
  const experienceKeywords = ['ניסיון', 'עבדתי', 'תפקיד', 'עובד', 'חברת', 'בתפקיד', 'שנים', 'עבודה'];
  lines.forEach(line => {
    if (experienceKeywords.some(kw => line.includes(kw)) && line.length > 10) {
      experience.push(line.trim().substring(0, 100));
    }
  });

  // חילוץ השכלה
  const education: string[] = [];
  const educationKeywords = ['תואר', 'לימודים', 'אוניברסיטה', 'מכללה', 'תיכון', 'בגרות', 'קורס', 'הכשרה', 'תעודה'];
  lines.forEach(line => {
    if (educationKeywords.some(kw => line.includes(kw)) && line.length > 10) {
      education.push(line.trim().substring(0, 100));
    }
  });

  // חילוץ מיומנויות
  const skills: string[] = [];
  const skillsKeywords = ['אנגלית', 'אקסל', 'וורד', 'מחשב', 'רישיון', 'מלגזה', 'נהיגה', 'שפות', 'CRM', 'מכירות'];
  lines.forEach(line => {
    if (skillsKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
      skills.push(line.trim().substring(0, 80));
    }
  });

  // חילוץ שפות
  const languages: string[] = [];
  if (text.includes('אנגלית')) languages.push('אנגלית');
  if (text.includes('עברית')) languages.push('עברית');
  if (text.includes('רוסית')) languages.push('רוסית');
  if (text.includes('ערבית')) languages.push('ערבית');
  if (text.includes('צרפתית')) languages.push('צרפתית');
  if (text.includes('ספרדית')) languages.push('ספרדית');

  // חילוץ תפקיד נוכחי
  let currentTitle = '';
  const titleKeywords = ['מפתח', 'מנהל', 'טלר', 'בנקאי', 'מוכר', 'נציג', 'מלגזן', 'מחסנאי', 'נהג', 'מזכיר'];
  for (const kw of titleKeywords) {
    if (text.includes(kw)) {
      currentTitle = kw;
      break;
    }
  }

  // שנות ניסיון
  let yearsOfExperience = 0;
  const yearsMatch = text.match(/(\d+)\s*(?:שנ(?:ות|ים)?|years?)\s*(?:ניסיון|experience)/i);
  if (yearsMatch) {
    yearsOfExperience = parseInt(yearsMatch[1]);
  }

  return {
    name,
    phone,
    email,
    city,
    age,
    idNumber,
    experience: experience.slice(0, 5),
    education: education.slice(0, 3),
    skills: skills.slice(0, 8),
    languages,
    currentTitle,
    yearsOfExperience,
    rawText: text
  };
}

// ========================================================================
// ניתוח התאמה למשרה
// ========================================================================
function analyzeJobMatch(job: Job, candidate: CandidateDetails, cvText: string): JobMatch {
  let score = 0;
  const matchingPoints: string[] = [];
  const concerns: string[] = [];
  
  const jobText = `${job.title} ${job.location} ${job.requirements.join(' ')} ${job.conditions}`.toLowerCase();
  const cvLower = cvText.toLowerCase();

  // התאמת מיקום (25 נקודות)
  if (candidate.city && job.location.includes(candidate.city)) {
    score += 25;
    matchingPoints.push(`✓ מתגורר ב${candidate.city} - קרוב למקום העבודה`);
  } else if (candidate.city) {
    const nearbyRegions: { [key: string]: string[] } = {
      'מרכז': ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'פתח תקווה', 'חולון', 'בת ים', 'יהוד', 'אור יהודה'],
      'שרון': ['נתניה', 'רעננה', 'כפר סבא', 'הוד השרון', 'רמת השרון', 'הרצליה'],
      'דרום': ['אשדוד', 'אשקלון', 'באר שבע', 'דימונה', 'ראשון לציון', 'רחובות', 'יבנה'],
      'צפון': ['חיפה', 'נשר', 'קריית אתא', 'עכו', 'נהריה']
    };
    
    for (const [region, cities] of Object.entries(nearbyRegions)) {
      if (cities.includes(candidate.city) && job.region === region) {
        score += 15;
        matchingPoints.push(`✓ מתגורר באזור ${region} - נגיש למקום העבודה`);
        break;
      }
    }
  }
  
  // התאמת מיומנויות (עד 30 נקודות)
  const skillMatches = {
    'מכירות': ['מכירות', 'sales', 'שיווק', 'לקוחות'],
    'טכני': ['טכני', 'תמיכה', 'מחשבים', 'IT'],
    'מלגזה': ['מלגזה', 'מלגזן', 'היגש'],
    'נהיגה': ['רישיון', 'נהיגה', 'נהג'],
    'בנקאות': ['בנק', 'פיננסי', 'כלכלה', 'חשבונאות'],
    'אנגלית': ['אנגלית', 'english'],
    'מחסן': ['מחסן', 'לוגיסטיקה', 'ליקוט']
  };

  for (const [skill, keywords] of Object.entries(skillMatches)) {
    const jobHasSkill = keywords.some(kw => jobText.includes(kw));
    const cvHasSkill = keywords.some(kw => cvLower.includes(kw));
    
    if (jobHasSkill && cvHasSkill) {
      score += 10;
      matchingPoints.push(`✓ ניסיון מוכח ב${skill}`);
    } else if (jobHasSkill && !cvHasSkill) {
      concerns.push(`✗ לא נמצא ניסיון ב${skill} הנדרש למשרה`);
    }
  }

  // התאמת ניסיון (15 נקודות)
  if (candidate.yearsOfExperience >= 2) {
    score += 15;
    matchingPoints.push(`✓ ${candidate.yearsOfExperience} שנות ניסיון מקצועי`);
  } else if (candidate.experience.length > 0) {
    score += 8;
    matchingPoints.push('✓ בעל ניסיון תעסוקתי קודם');
  } else {
    concerns.push('✗ חסר ניסיון תעסוקתי מתועד');
  }

  // התאמת השכלה (10 נקודות)
  if (candidate.education.length > 0) {
    score += 10;
    matchingPoints.push('✓ בעל רקע אקדמי/מקצועי');
  }

  // התאמת גיל לתפקיד (5 נקודות)
  const ageNum = parseInt(candidate.age);
  if (ageNum && ageNum >= 21 && ageNum <= 55) {
    score += 5;
    matchingPoints.push(`✓ גיל ${candidate.age} - מתאים לסוג התפקיד`);
  } else if (ageNum && ageNum < 21) {
    concerns.push('✗ גיל צעיר - ייתכן שנדרש ניסיון נוסף');
  }

  // מילוי עד 5 נקודות בכל קטגוריה
  while (matchingPoints.length < 5) {
    if (candidate.languages.length > 1) {
      matchingPoints.push(`✓ דובר ${candidate.languages.join(' ו')}`);
    } else if (candidate.phone) {
      matchingPoints.push('✓ פרטי קשר מלאים וזמינים');
    } else if (candidate.email) {
      matchingPoints.push('✓ זמין לתקשורת במייל');
    } else {
      matchingPoints.push('✓ קורות חיים מסודרים ומקצועיים');
    }
    if (matchingPoints.length >= 5) break;
  }

  while (concerns.length < 5) {
    if (!candidate.city) {
      concerns.push('✗ לא צוין מקום מגורים');
    } else if (!candidate.age) {
      concerns.push('✗ לא צוין גיל');
    } else if (candidate.skills.length === 0) {
      concerns.push('✗ לא פורטו מיומנויות ספציפיות');
    } else {
      concerns.push('✗ יש לבדוק התאמה בראיון אישי');
    }
    if (concerns.length >= 5) break;
  }

  // יצירת תוכן מייל
  const emailSubject = `מועמד/ת ל${job.title} - ${candidate.name || 'מועמד חדש'} | ${job.client}`;
  
  const emailBody = `שלום רב,

מצורפים פרטי מועמד/ת חדש/ה למשרת ${job.title} ב${job.client}:

📋 פרטי המועמד:
• שם: ${candidate.name || 'לא צוין'}
• טלפון: ${candidate.phone || 'לא צוין'}
• אימייל: ${candidate.email || 'לא צוין'}
• עיר מגורים: ${candidate.city || 'לא צוין'}
• גיל: ${candidate.age || 'לא צוין'}

✅ למה מתאים/ה למשרה:
${matchingPoints.slice(0, 5).map((p, i) => `${i + 1}. ${p}`).join('\n')}

📝 הערות:
${candidate.experience.slice(0, 2).join('\n') || 'ראה/י קורות חיים מצורפים'}

---
נשלח ממערכת Twenty2CRM
טל: ${candidate.phone || ''}`;

  // הודעת וואטסאפ
  const whatsappMessage = `היי ${candidate.name || ''}! 👋
ראיתי את קורות החיים שלך ויש לי הצעה למשרת *${job.title}* ב${job.client}.
מיקום: ${job.location}
${job.conditions.substring(0, 100)}...
מעוניין/ת לשמוע פרטים? 📞`;

  return {
    job,
    score: Math.min(score, 100),
    matchingPoints: matchingPoints.slice(0, 5),
    concerns: concerns.slice(0, 5),
    emailSubject,
    emailBody,
    whatsappMessage
  };
}

// ========================================================================
// יצירת סיכום AI
// ========================================================================
function generateAISummary(candidate: CandidateDetails, matchedJobs: JobMatch[]): string {
  const name = candidate.name || 'המועמד/ת';
  const city = candidate.city ? `מ${candidate.city}` : '';
  const experience = candidate.yearsOfExperience > 0 ? 
    `עם ${candidate.yearsOfExperience} שנות ניסיון` : 
    'ללא ניסיון מפורט';
  
  let summary = `🤖 סיכום AI:\n\n${name} ${city} ${experience}.\n\n`;
  
  if (matchedJobs.length > 0) {
    summary += `נמצאו ${matchedJobs.length} משרות מתאימות:\n`;
    matchedJobs.forEach((m, i) => {
      summary += `${i + 1}. ${m.job.title} (${m.job.client}) - ${m.score}% התאמה\n`;
    });
  } else {
    summary += 'לא נמצאו משרות מתאימות כרגע.';
  }
  
  return summary;
}

// ========================================================================
// חילוץ נקודות חיוביות
// ========================================================================
function extractGoodPoints(candidate: CandidateDetails): string[] {
  const points: string[] = [];
  
  if (candidate.name) points.push(`שם מלא: ${candidate.name}`);
  if (candidate.phone) points.push(`ניתן ליצור קשר: ${candidate.phone}`);
  if (candidate.email) points.push(`אימייל זמין: ${candidate.email}`);
  if (candidate.city) points.push(`מתגורר ב${candidate.city}`);
  if (candidate.yearsOfExperience > 0) points.push(`${candidate.yearsOfExperience} שנות ניסיון`);
  if (candidate.education.length > 0) points.push('בעל השכלה מתועדת');
  if (candidate.skills.length > 0) points.push(`${candidate.skills.length} מיומנויות זוהו`);
  if (candidate.languages.length > 1) points.push(`דובר ${candidate.languages.length} שפות`);
  
  while (points.length < 5) {
    points.push('קורות חיים מלאים');
    if (points.length >= 5) break;
  }
  
  return points.slice(0, 5);
}

// ========================================================================
// חילוץ נקודות לשיפור
// ========================================================================
function extractConcernPoints(candidate: CandidateDetails): string[] {
  const points: string[] = [];
  
  if (!candidate.name) points.push('לא צוין שם מלא');
  if (!candidate.phone) points.push('לא צוין מספר טלפון');
  if (!candidate.email) points.push('לא צוין אימייל');
  if (!candidate.city) points.push('לא צוין מקום מגורים');
  if (!candidate.age) points.push('לא צוין גיל');
  if (candidate.experience.length === 0) points.push('לא פורט ניסיון תעסוקתי');
  if (candidate.education.length === 0) points.push('לא פורטה השכלה');
  if (candidate.skills.length === 0) points.push('לא זוהו מיומנויות ספציפיות');
  
  while (points.length < 5) {
    points.push('יש להשלים פרטים בראיון');
    if (points.length >= 5) break;
  }
  
  return points.slice(0, 5);
}

// ========================================================================
// יצירת לינק וואטסאפ
// ========================================================================
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const israelPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.substring(1) : cleanPhone;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${israelPhone}?text=${encodedMessage}`;
}

// ========================================================================
// יצירת לינק מייל
// ========================================================================
export function generateEmailLink(to: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}

export default {
  analyzeCV,
  extractCandidateDetails,
  generateWhatsAppLink,
  generateEmailLink
};
