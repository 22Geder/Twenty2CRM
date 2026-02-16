import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// חילוץ פרטים מטקסט קורות חיים - מהיר ויעיל
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();
    
    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Text too short' }, { status: 400 });
    }

    const extracted = extractFromCVText(text);
    
    return NextResponse.json({
      success: true,
      data: extracted
    });
    
  } catch (error) {
    console.error('Error extracting CV:', error);
    return NextResponse.json({ error: 'Failed to extract' }, { status: 500 });
  }
}

function extractFromCVText(text: string): {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  city: string;
  address: string;
  country: string;
  currentTitle: string;
  currentCompany: string;
  skills: string;
  yearsOfExperience: string;
  expectedSalary: string;
  tags: string[];
} {
  const lines = text.split('\n').filter(line => line.trim());
  
  // חילוץ אימייל
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : '';

  // חילוץ טלפונים (פורמט ישראלי) - תומך במספר טלפונים
  const phoneRegex = /0(?:5[0-9]|[2-4]|[7-9])[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g;
  const phoneMatches = text.match(phoneRegex);
  const phone = phoneMatches && phoneMatches[0] ? phoneMatches[0].replace(/[\-\s]/g, '') : '';
  const alternatePhone = phoneMatches && phoneMatches[1] ? phoneMatches[1].replace(/[\-\s]/g, '') : '';

  // חילוץ שם משופר - מזהה שמות בעברית ואנגלית
  let name = '';
  
  // מילים שלא יכולות להיות שמות
  const notNames = [
    'קורות חיים', 'resume', 'cv', 'curriculum', 'vitae', 'פרטים אישיים',
    'personal', 'details', 'info', 'information', 'contact', 'about',
    'ניסיון תעסוקתי', 'השכלה', 'education', 'experience', 'work', 'מיומנויות',
    'skills', 'summary', 'objective', 'תקציר', 'מטרה', 'פרופיל', 'profile'
  ];
  
  // חיפוש שם לפי תבניות נפוצות
  const namePatterns = [
    /(?:שם[:\s]+|name[:\s]+)([א-ת\s]{2,30}|[A-Za-z\s]{2,40})/i,
    /^([א-ת]{2,15}\s+[א-ת]{2,15})$/m,  // שם פרטי + משפחה בעברית
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/m,   // First Last in English
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const possibleName = match[1].trim();
      const isNotName = notNames.some(n => possibleName.toLowerCase().includes(n.toLowerCase()));
      if (!isNotName && possibleName.length > 3) {
        name = possibleName;
        break;
      }
    }
  }
  
  // אם לא נמצא, נסה בשורות הראשונות
  if (!name) {
    for (const line of lines.slice(0, 8)) {
      const cleanLine = line.trim();
      // דלג על שורות קצרות מדי או ארוכות מדי
      if (cleanLine.length < 3 || cleanLine.length > 50) continue;
      // דלג על שורות עם אימייל או מספרים רבים
      if (cleanLine.includes('@') || /\d{5,}/.test(cleanLine)) continue;
      // דלג על מילים שלא יכולות להיות שמות
      if (notNames.some(n => cleanLine.toLowerCase().includes(n.toLowerCase()))) continue;
      
      const words = cleanLine.split(/\s+/);
      // שם טיפוסי הוא 2-4 מילים
      if (words.length >= 2 && words.length <= 4) {
        // בדיקה שזה לא מספר טלפון
        if (!/^0\d/.test(cleanLine) && !/^\d/.test(cleanLine)) {
          // וודא שכל המילים מתחילות באות גדולה או בעברית
          const looksLikeName = words.every(w => 
            /^[א-ת]/.test(w) || /^[A-Z]/.test(w)
          );
          if (looksLikeName) {
            name = cleanLine;
            break;
          }
        }
      }
    }
  }

  // חילוץ עיר (ערים ישראליות - רשימה מורחבת)
  const israeliCities = [
    'תל אביב', 'תל-אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה',
    'אשדוד', 'נתניה', 'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'רעננה',
    'אשקלון', 'רחובות', 'הרצליה', 'כפר סבא', 'חדרה', 'מודיעין', 'נצרת',
    'לוד', 'רמלה', 'נהריה', 'טבריה', 'קריית אתא', 'קריית גת', 'קריית מוצקין',
    'ראש העין', 'בת ים', 'הוד השרון', 'גבעתיים', 'קריית ים', 'אילת',
    'עכו', 'כרמיאל', 'צפת', 'נס ציונה', 'יבנה', 'אור יהודה', 'זכרון יעקב',
    'קיסריה', 'עפולה', 'טירת כרמל', 'דימונה', 'ערד', 'אופקים', 'שדרות',
    'בית שמש', 'גדרה', 'יהוד', 'רמת השרון', 'כפר יונה', 'פרדס חנה',
    'קריית שמונה', 'קריית ביאליק', 'קריית אונו', 'פתח תקוה', 'גני תקווה',
    'אלעד', 'ביתר עילית', 'נתיבות', 'מעלה אדומים', 'גבעת שמואל',
    'יקנעם', 'מגדל העמק', 'עראבה', 'סכנין', 'טמרה', 'אום אל-פחם',
    'רהט', 'שפרעם', 'באקה אל-גרבייה', 'טייבה', 'קלנסווה'
  ];
  
  let city = '';
  for (const cityName of israeliCities) {
    if (text.includes(cityName)) {
      city = cityName;
      break;
    }
  }

  // חילוץ כתובת מלאה (חיפוש רחוב)
  let address = '';
  const streetRegex = /(?:רחוב|רח'|רח\.|ש[דר]רות|שדרת)\s*[א-ת]+(?:\s+[א-ת]+)?(?:\s+\d+)?/;
  const streetMatch = text.match(streetRegex);
  if (streetMatch) {
    address = streetMatch[0];
  }

  // מדינה (ברוב המקרים ישראל)
  let country = '';
  if (text.includes('ישראל') || text.includes('Israel')) {
    country = 'ישראל';
  }

  // חילוץ תפקיד/מקצוע
  const jobTitles = [
    // הייטק
    'מפתח Full Stack', 'מפתח Frontend', 'מפתח Backend', 'מפתח', 'מתכנת', 'תוכניתן', 
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
    'מהנדס תוכנה', 'ארכיטקט תוכנה', 'QA Engineer', 'בודק תוכנה', 'Data Scientist', 
    'אנליסט נתונים', 'Product Manager', 'מנהל מוצר', 'UI/UX Designer', 'מעצב', 'גרפיקאי',
    // ניהול
    'מנכ"ל', 'סמנכ"ל', 'מנהל', 'ראש צוות', 'Team Lead',
    // מכירות ושיווק
    'איש מכירות', 'נציג מכירות', 'מנהל מכירות', 'שיווק דיגיטלי', 'מנהל שיווק',
    // שירות לקוחות
    'נציג שירות', 'שירות לקוחות', 'מוקדן', 'תמיכה טכנית', 'Help Desk',
    // מחסן ולוגיסטיקה
    'מחסנאי', 'מלגזן', 'עובד מחסן', 'מנהל לוגיסטיקה', 'נהג משאית', 'נהג', 'שליח',
    // מינהל
    'מזכיר', 'מזכירה', 'מנהל משרד', 'אדמיניסטרציה', 'רכז', 'רכזת', 'מתאם', 'מתאמת',
    // כספים
    'חשב', 'רואה חשבון', 'הנהלת חשבונות', 'מנהל כספים', 'בקר', 'בקרת תקציב',
    // משאבי אנוש
    'משאבי אנוש', 'HR Manager', 'מגייס', 'מגייסת', 'רכז גיוס',
    // הנדסה
    'מהנדס', 'הנדסאי', 'טכנאי', 'חשמלאי', 'מכונאי', 'מהנדס מכונות', 'מהנדס חשמל',
    // רפואה
    'אח', 'אחות', 'רופא', 'פיזיותרפיסט', 'רוקח', 'אופטומטריסט',
    // חינוך
    'מורה', 'מחנך', 'גננת', 'מדריך', 'מרצה'
  ];

  let currentTitle = '';
  for (const title of jobTitles) {
    if (text.includes(title)) {
      currentTitle = title;
      break;
    }
  }

  // חילוץ חברה נוכחית
  let currentCompany = '';
  const companyPatterns = [
    /(?:עובד ב|עבדתי ב|מועסק ב|חברת|בחברת)\s*([א-ת\w\s]+?)(?:\.|,|$)/,
    /(?:חברה נוכחית|מקום עבודה)[:\s]*([א-ת\w\s]+?)(?:\.|,|$)/i
  ];
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      currentCompany = match[1].trim();
      break;
    }
  }

  // חילוץ מיומנויות
  const skillKeywords = [
    // תכנות
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Firebase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Linux', 'CI/CD',
    'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'Material UI',
    // כלים משרדיים
    'Excel', 'Word', 'PowerPoint', 'Office', 'SAP', 'Priority', 'CRM', 'Salesforce',
    // שפות
    'אנגלית', 'עברית', 'רוסית', 'ערבית', 'צרפתית', 'ספרדית', 'גרמנית',
    // מיומנויות רכות
    'ניהול פרויקטים', 'ניהול צוות', 'מנהיגות', 'תקשורת בינאישית', 'עבודת צוות', 'פתרון בעיות',
    // רישיונות
    'רישיון נהיגה', 'מלגזה', 'רישיון B', 'תעודת הוראה', 'רישיון עסק'
  ];

  const foundSkills: string[] = [];
  for (const skill of skillKeywords) {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  // חילוץ שנות ניסיון
  const expRegex = /(\d+)\s*(שנ[יה]|years?|שנות|שנים)/gi;
  const expMatch = text.match(expRegex);
  let yearsOfExperience = '';
  if (expMatch) {
    const numMatch = expMatch[0].match(/\d+/);
    if (numMatch) {
      yearsOfExperience = numMatch[0];
    }
  }

  // חילוץ ציפיות שכר
  let expectedSalary = '';
  const salaryRegex = /(?:שכר|משכורת|ציפיות שכר)[:\s]*(?:₪|ש"ח|NIS)?\s*([\d,\.]+)(?:\s*-\s*([\d,\.]+))?/gi;
  const salaryMatch = text.match(salaryRegex);
  if (salaryMatch) {
    expectedSalary = salaryMatch[0];
  } else {
    // חיפוש מספרים שנראים כמו שכר
    const numSalaryRegex = /(?:₪|ש"ח)\s*([\d,]+)/;
    const numMatch = text.match(numSalaryRegex);
    if (numMatch) {
      expectedSalary = numMatch[0];
    }
  }

  // יצירת תגיות
  const tags: string[] = [];
  
  // הוסף עיר כתגית
  if (city) tags.push(city);
  
  // הוסף תפקיד כתגית
  if (currentTitle) tags.push(currentTitle);
  
  // הוסף מיומנויות עיקריות (עד 10)
  foundSkills.slice(0, 10).forEach(skill => {
    if (!tags.includes(skill)) tags.push(skill);
  });

  // הוסף רמת ניסיון
  if (yearsOfExperience) {
    const years = parseInt(yearsOfExperience);
    if (years <= 2) tags.push('מתחיל');
    else if (years <= 5) tags.push('בעל ניסיון');
    else tags.push('ותיק');
  }

  return {
    name,
    email,
    phone,
    alternatePhone,
    city,
    address,
    country,
    currentTitle,
    currentCompany,
    skills: foundSkills.join(', '),
    yearsOfExperience,
    expectedSalary,
    tags
  };
}
