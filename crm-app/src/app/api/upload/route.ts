import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { findMatchingTags, getUniqueCategories, RECRUITMENT_TAGS, type MatchedTag } from '@/lib/recruitment-tags';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 🆕 קריאת PDF עם Gemini Vision (לקבצים סרוקים!) - with timeout
async function extractTextFromPDFWithGemini(buffer: Buffer): Promise<string> {
  // Timeout helper
  const timeout = (ms: number) => new Promise<string>((_, reject) => 
    setTimeout(() => reject(new Error('PDF OCR timeout')), ms)
  );
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Convert buffer to base64
    const base64Data = buffer.toString('base64');
    
    const prompt = `אתה מומחה ב-OCR לקורות חיים בעברית ואנגלית.
    
נתח את קובץ ה-PDF הזה שהוא קורות חיים ותחלץ את כל הטקסט.

התמקד במיוחד ב:
1. שם מלא של המועמד
2. מספר טלפון (בפורמט ישראלי 05X-XXX-XXXX)
3. כתובת אימייל
4. עיר מגורים
5. ניסיון תעסוקתי - תפקידים, חברות, שנים
6. השכלה - תארים, מוסדות
7. כישורים ומיומנויות
8. רישיונות (נהיגה, מלגזה וכו')
9. שפות

החזר את הטקסט המלא כפי שהוא מופיע בקורות החיים.
אל תדלג על מידע - חלץ הכל!
אם יש טבלאות, המר אותן לטקסט קריא.`;

    // Race between API call and 30 second timeout
    const result = await Promise.race([
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        }
      ]),
      timeout(30000)
    ]) as any;
    
    const response = result.response;
    const text = response.text();
    
    console.log('📄 Gemini PDF OCR extracted text length:', text.length);
    return text;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.error('⚠️ Gemini PDF OCR quota exceeded - falling back to text extraction');
    } else if (error?.message?.includes('timeout')) {
      console.error('⚠️ PDF OCR timeout - falling back to text extraction');
    } else {
      console.error('Error extracting text from PDF with Gemini:', error?.message || error);
    }
    return '';
  }
}

// Helper to extract text from PDF - נסה כמה שיטות
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let pdfParseText = '';
  
  // 1. נסה קודם pdf-parse לPDF רגיל עם טקסט
  try {
    const pdfParse = require('pdf-parse/lib/pdf-parse');
    const data = await pdfParse(buffer);
    pdfParseText = data.text || '';
    console.log('📄 pdf-parse extracted:', pdfParseText.length, 'chars');
    
    // אם יש טקסט מספיק - תחזיר אותו
    if (pdfParseText.trim().length >= 100) {
      return pdfParseText;
    }
  } catch (error: any) {
    console.log('⚠️ pdf-parse failed:', error.message);
  }
  
  // 2. אם pdf-parse נכשל או הטקסט קצר - נסה Gemini Vision
  try {
    console.log('📄 Trying Gemini Vision OCR for PDF...');
    const geminiText = await extractTextFromPDFWithGemini(buffer);
    if (geminiText.length > pdfParseText.length && geminiText.length > 50) {
      console.log('✅ Gemini Vision extracted:', geminiText.length, 'chars');
      return geminiText;
    }
  } catch (error: any) {
    console.log('⚠️ Gemini Vision failed:', error.message);
  }
  
  // 3. אם הכל נכשל - החזר מה שיש מ-pdf-parse או טקסט ריק
  return pdfParseText || '';
}

// Helper to extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return '';
  }
}

// 🆕 OCR - Extract text from image using Gemini Vision (with timeout)
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  // Timeout helper
  const timeout = (ms: number) => new Promise<string>((_, reject) => 
    setTimeout(() => reject(new Error('OCR timeout')), ms)
  );
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Convert buffer to base64
    const base64Data = buffer.toString('base64');
    
    const prompt = `אתה מומחה ב-OCR לקורות חיים בעברית ואנגלית.
    
נתח את התמונה הזו שהיא קורות חיים ותחלץ את כל הטקסט.

התמקד במיוחד ב:
1. שם מלא
2. מספר טלפון (בפורמט ישראלי 05X-XXX-XXXX)
3. כתובת אימייל
4. עיר מגורים
5. ניסיון תעסוקתי
6. השכלה
7. כישורים ומיומנויות
8. רישיונות (נהיגה, מלגזה וכו')

החזר את הטקסט המלא כפי שהוא מופיע בקורות החיים.
אל תדלג על מידע - חלץ הכל!`;

    // Race between API call and 30 second timeout (images take longer)
    const result = await Promise.race([
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]),
      timeout(30000)
    ]) as any;
    
    const response = result.response;
    const text = response.text();
    
    console.log('🖼️ OCR extracted text length:', text.length);
    return text;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.error('⚠️ Gemini Vision API quota exceeded - cannot process image OCR');
    } else if (error?.message?.includes('timeout')) {
      console.error('⚠️ OCR timeout - image too complex or API slow');
    } else {
      console.error('Error extracting text from image with Gemini Vision:', error?.message || error);
    }
    return '';
  }
}

// 🆕 AI-powered structured CV extraction using Gemini (with timeout)
// שדרוג: AI חכם כמו מגייס אנושי
async function extractCVWithAI(text: string): Promise<any> {
  // Timeout helper to prevent hanging on API issues
  const timeout = (ms: number) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error('AI extraction timeout')), ms)
  );
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `אתה מגייס מקצועי עם 15 שנות ניסיון. קרא את קורות החיים האלו ונתח אותם כמו שמגייס אנושי היה עושה.

חשוב מאוד: אל תסתכל רק על כותרות - הבן את ההקשר המקצועי האמיתי של המועמד!

דוגמאות להבנה נכונה:
- אם כתוב "סגן מנהל סניף" בסוכנות רכב = התפקיד קשור למכירות רכב
- אם כתוב "יועץ" בסלון רכב = איש מכירות רכב
- אם כתוב "מנהל" עם ניסיון בלוגיסטיקה = מנהל לוגיסטיקה
- אם יש ניסיון במספר תחומים = רשום את כולם!

טקסט קורות החיים:
${text.substring(0, 6000)}

החזר JSON בפורמט הבא בלבד:
{
  "name": "שם מלא",
  "email": "אימייל או null",
  "phone": "טלפון בפורמט 05XXXXXXXX או null",
  "city": "עיר/יישוב/קיבוץ/מושב - כולל מקומות קטנים כמו גליל ים, קיבוצים, מושבים",
  "currentTitle": "תפקיד מדויק עם הקשר - לדוגמה: 'איש מכירות רכב', 'מנהל מחסן', 'סגן מנהל סניף רכב'",
  "professionalBackground": "תיאור קצר של הרקע המקצועי - מה באמת עשה המועמד",
  "mainIndustries": ["תחומים מקצועיים ראשיים - רכב/מכירות/לוגיסטיקה/שירות/היי-טק וכו'"],
  "yearsOfExperience": מספר שנות ניסיון כללי,
  "skills": ["כישורים ספציפיים - כולל עבודה עם לקוחות, משא ומתן, ניהול צוות וכו'"],
  "education": "השכלה או null",
  "licenses": ["רישיונות - נהיגה, מלגזה, משאית וכו'"],
  "languages": ["שפות"],
  "workHistory": [
    {
      "title": "תפקיד מדויק",
      "company": "שם חברה",
      "industry": "תחום - רכב/בנקאות/שירות וכו'",
      "years": "תקופה"
    }
  ],
  "relevantFor": ["סוגי משרות שהמועמד מתאים להן - מכירות רכב, שירות לקוחות, ניהול וכו'"],
  "confidence": {
    "name": 0-100,
    "phone": 0-100,
    "email": 0-100,
    "city": 0-100
  }
}

חשוב ביותר:
- הבן את ההקשר! אם מישהו עבד בסוכנות רכב - הוא קשור לתחום הרכב
- אם יש ניסיון במכירות - רשום "מכירות" בskills ובmainIndustries
- רשום את כל התפקידים הרלוונטיים, לא רק האחרון
- קיבוצים ומושבים הם ערים תקינות - רשום אותם!
- החזר JSON תקין בלבד`;

    // Race between API call and 15 second timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      timeout(15000)
    ]) as any;
    
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('⚠️ AI did not return valid JSON, falling back to regex');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ AI extracted candidate data:', parsed.name);
    return parsed;
  } catch (error: any) {
    // Check for quota exceeded error (429)
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn('⚠️ Gemini API quota exceeded - falling back to regex extraction');
    } else if (error?.message?.includes('timeout')) {
      console.warn('⚠️ AI extraction timeout - falling back to regex extraction');
    } else {
      console.error('AI extraction error:', error?.message || error);
    }
    return null;
  }
}

// AI-powered text analysis to extract candidate info
function analyzeCVText(text: string): any {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract email
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : '';

  // Extract phone (Israeli format)
  const phoneRegex = /0(?:5[0-9]|[2-4]|[7-9])[0-9]{7,8}/g;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Extract name (usually first line or after certain keywords)
  let name = '';
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 50 && !line.includes('@') && !line.match(/\d{5,}/)) {
      const words = line.trim().split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        name = line.trim();
        break;
      }
    }
  }

  // Extract city (Israeli cities, kibbutzim, moshavim - comprehensive list)
  const israeliCities = [
    // ערים גדולות
    'תל אביב', 'תל-אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה',
    'אשדוד', 'נתניה', 'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'רעננה',
    'אשקלון', 'רחובות', 'הרצליה', 'כפר סבא', 'חדרה', 'מודיעין', 'נצרת',
    'לוד', 'רמלה', 'נהריה', 'טבריה', 'קריית אתא', 'קריית גת', 'קריית מוצקין',
    'קריית ים', 'קריית ביאליק', 'קריית שמונה', 'עכו', 'כרמיאל', 'עפולה',
    'בת ים', 'גבעתיים', 'הוד השרון', 'רמת השרון', 'יבנה', 'גדרה', 'קרית עקרון',
    'נס ציונה', 'אור יהודה', 'יהוד', 'גני תקווה', 'רעות', 'שוהם', 'מזכרת בתיה',
    'גן יבנה', 'אריאל', 'מעלה אדומים', 'ביתר עילית', 'בית שמש', 'אלעד',
    'דימונה', 'ערד', 'אילת', 'מצפה רמון', 'ירוחם', 'עומר', 'כפר יונה',
    'פרדס חנה-כרכור', 'זכרון יעקב', 'בנימינה', 'אור עקיבא', 'קיסריה',
    'יקנעם', 'נוף הגליל', 'מגדל העמק', 'בית שאן', 'צפת', 'שדרות', 'נתיבות',
    'אופקים', 'מיתר', 'להבים', 'עומר', 'גבעת שמואל', 'קדימה-צורן',
    // קיבוצים ומושבים - חשוב!
    'גליל ים', 'קיבוץ גליל ים', 'שפיים', 'קיבוץ שפיים', 'גבעת ברנר',
    'קיבוץ גבעת ברנר', 'יגור', 'קיבוץ יגור', 'גבע', 'משמר העמק', 'עין השופט',
    'געש', 'קיבוץ געש', 'שדות ים', 'קיבוץ שדות ים', 'מעגן מיכאל', 'נחשולים',
    'חניתה', 'כברי', 'לוחמי הגטאות', 'עברון', 'אפק', 'יסעור', 'כפר מסריק',
    'רגבה', 'בית העמק', 'הזורעים', 'שריד', 'יפעת', 'גבת', 'מזרע', 'רמת ישי',
    'אלונים', 'רמת דוד', 'כפר יהושע', 'נהלל', 'מרחביה', 'עין חרוד',
    'בית אלפא', 'חפציבה', 'עין הנציב', 'שדה אליהו', 'טירת צבי', 'רשפים',
    'מסדה', 'רביבים', 'שדה בוקר', 'קטורה', 'לוטן', 'יטבתה', 'גרופית',
    'אשבול', 'חצרים', 'שובל', 'להב', 'גבולות', 'ברור חיל', 'מפלסים',
    'כרמיה', 'יד מרדכי', 'ניר עם', 'נתיב הלה', 'ארז', 'כפר עזה',
    'נחל עוז', 'סעד', 'אור הנר', 'עלומים', 'תקומה', 'גבים', 'דורות',
    'גת', 'כפר אהרון', 'גן שורק', 'עזריקם', 'יד בנימין', 'כפר הנגיד',
    'בית עובד', 'כפר מרדכי', 'גאליה', 'פלמחים', 'גן שלמה', 'בית חנן',
    'נטעים', 'עשרת', 'חולדה', 'משמר דוד', 'כפר שמואל', 'מחסיה', 'תעוז',
    'נווה מיכאל', 'צרעה', 'אשתאול', 'הראל', 'ישעי', 'גבעת יערים',
    'נחשון', 'קריית ענבים', 'מעלה החמישה', 'מבשרת ציון', 'בית מאיר',
    'שורש', 'בית נקופה', 'נטף', 'נווה שלום', 'צובה', 'רמת רזיאל',
    'רמות', 'טלמון', 'דולב', 'בית אריה', 'עפרה', 'כוכב השחר', 'אלון שבות',
    'אפרת', 'נווה דניאל', 'קרני שומרון', 'עלי', 'אריאל', 'בית אל',
    // עוד מקומות
    'גלילות', 'רמת אביב', 'נווה צדק', 'פלורנטין', 'יפו', 'שכונת התקווה',
    'כפר שלם', 'רמת החייל', 'נווה שרת', 'אזור התעשייה', 'צומת רעננה'
  ];
  
  let city = '';
  const textLower = text.toLowerCase();
  for (const cityName of israeliCities) {
    if (textLower.includes(cityName.toLowerCase())) {
      city = cityName;
      break;
    }
  }

  // Extract current title and all matching job titles (comprehensive)
  const jobTitles = [
    // Management
    'מנהל', 'מנכ"ל', 'סמנכ"ל', 'רכז', 'רכזת', 'מנהל צוות', 'מנהל פרויקטים',
    'מנהל מוצר', 'מנהל מכירות', 'מנהל שיווק', 'מנהל משאבי אנוש',
    // Tech & IT
    'מפתח', 'תוכניתן', 'מתכנת', 'Full Stack', 'Front End', 'Back End',
    'DevOps', 'מהנדס תוכנה', 'ארכיטקט תוכנה', 'QA', 'בודק תוכנה',
    'מנהל מערכות', 'אנליסט', 'Data Scientist', 'מדען נתונים',
    // Sales & Marketing
    'איש מכירות', 'אשת מכירות', 'נציג מכירות', 'סוכן', 'משווק',
    'מנהל לקוחות', 'Account Manager', 'איש שיווק דיגיטלי',
    // Customer Service
    'נציג שירות', 'נציגת שירות', 'שירות לקוחות', 'טלמרקטר',
    'מוקדן', 'מוקדנית', 'תמיכה טכנית', 'Help Desk',
    // Warehouse & Logistics
    'מלגזן', 'מלגזנית', 'מחסנאי', 'מחסנאית', 'מפעיל מלגזה',
    'עובד מחסן', 'עובדת מחסן', 'איש לוגיסטיקה', 'מתכנן משלוחים', 'נהג',
    // Medical & Healthcare
    'אח', 'אחות', 'אחות מוסמכת', 'מטפל', 'מטפלת', 'רופא', 'רופאה',
    'פיזיותרפיסט', 'ריפוי בעיסוק', 'רוקח', 'רוקחת', 'מיילדת',
    // Education
    'מורה', 'מחנך', 'מחנכת', 'גננת', 'מדריך', 'מדריכה', 'מרצה',
    // Finance & Accounting
    'חשב', 'חשבת', 'רואה חשבון', 'כלכלן', 'כלכלנית', 'מנהל כספים',
    'בקר', 'בקרת', 'אנליסט כספי',
    // HR & Recruitment
    'גייס', 'גייסת', 'מגייס', 'מגייסת', 'איש משאבי אנוש', 'HR',
    'מנהל גיוס', 'שותף עסקי', 'Business Partner', 'כוח אדם',
    // Engineering
    'מהנדס', 'מהנדסת', 'הנדסאי', 'הנדסאית', 'טכנאי', 'טכנאית',
    'מהנדס מכונות', 'מהנדס אלקטרוניקה', 'מהנדס חשמל', 'מהנדס בניין',
    // Design & Creative
    'מעצב', 'מעצבת', 'גרפיקאי', 'גרפיקאית', 'מעצב UI/UX', 'עורך וידאו',
    // Legal
    'עורך דין', 'עורכת דין', 'יועץ משפטי', 'יועצת משפטית', 'פקיד',
    // Construction
    'קבלן', 'קבלנית', 'אדריכל', 'אדריכלית', 'בנאי', 'חשמלאי', 'שרברב',
    'צבע', 'גבסן', 'רצפן', 'פועל בניין',
    // Security
    'מאבטח', 'מאבטחת', 'קצין ביטחון', 'שומר', 'שומרת',
    // Hospitality
    'מלצר', 'מלצרית', 'ברמן', 'ברמנית', 'שף', 'טבח', 'טבחית',
    // General
    'עוזר', 'עוזרת', 'מזכיר', 'מזכירה', 'רכז מינהלי', 'פקיד', 'פקידה', 'יועץ', 'מנתח', 'מפעיל'
  ];

  // Extract all matching job titles
  const foundTitles: string[] = [];
  let currentTitle = '';
  for (const title of jobTitles) {
    if (text.includes(title)) {
      foundTitles.push(title);
      if (!currentTitle) currentTitle = title; // Set first as primary
    }
  }

  // Extract skills - comprehensive list
  const skills: string[] = [];
  const skillKeywords = [
    // Office & Tools
    'Excel', 'Word', 'PowerPoint', 'Outlook', 'SAP', 'Priority', 'מחשוב',
    // Languages
    'אנגלית', 'עברית', 'רוסית', 'ערבית', 'צרפתית', 'ספרדית',
    // Management
    'ניהול', 'מנהיגות', 'ניהול פרויקטים', 'ניהול צוותים', 'ניהול זמן',
    // Customer Service & Sales
    'שירות לקוחות', 'מכירות', 'טלמרקטינג', 'שיווק', 'פרזנטציה',
    // Technical
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby',
    'React', 'Angular', 'Vue', 'Node.js', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Linux', 'Windows',
    // Warehouse & Logistics
    'מלגזן', 'ניהול מלאי', 'לוגיסטיקה', 'תחזוקה', 'בטיחות', 'מחסנאות',
    'הובלה', 'אריזה', 'משלוחים', 'ספקים',
    // Engineering & Technical
    'הנדסה', 'אלקטרוניקה', 'מכניקה', 'חשמל', 'אוטומציה', 'בקרה',
    'תיקון', 'אחזקה', 'תכנון', 'עיצוב',
    // Medical & Healthcare
    'רפואה', 'סיעוד', 'פיזיותרפיה', 'ריפוי בעיסוק', 'רוקחות', 'אח/ות',
    // Education
    'הוראה', 'חינוך', 'הדרכה', 'הכשרה', 'הנחיה',
    // Finance & Accounting
    'חשבונאות', 'הנהלת חשבונות', 'כספים', 'בנקאות', 'ביטוח', 'משכורות',
    // HR & Recruitment
    'משאבי אנוש', 'גיוס', 'ניהול כוח אדם', 'העסקה',
    // Design & Creative
    'עיצוב גרפי', 'Photoshop', 'Illustrator', 'InDesign', 'Figma', 'Adobe',
    'UI/UX', 'אנימציה', 'וידאו', 'מולטימדיה',
    // Legal
    'משפטים', 'עורך דין', 'יועץ משפטי', 'חוזים', 'ייצוג',
    // Construction
    'בניין', 'קבלן', 'אדריכל', 'הנדסאי בניין', 'פיקוח', 'תכנון בניין'
  ];

  for (const skill of skillKeywords) {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  // Extract years of experience
  const experienceRegex = /(\d+)\s*(שנ[יה]|years?)/gi;
  const expMatch = text.match(experienceRegex);
  const experience = expMatch ? expMatch[0] : '';

  // Auto-match positions based on title and city
  const matchedPositions: string[] = [];
  if (currentTitle && city) {
    if (currentTitle.includes('מחסנאי')) {
      matchedPositions.push(`משרת מחסנאי - ${city}`);
    }
    if (currentTitle.includes('נהג')) {
      matchedPositions.push(`משרת נהג - ${city}`);
    }
    if (currentTitle.includes('טכנאי')) {
      matchedPositions.push(`משרת טכנאי - ${city}`);
    }
  }

  // Collect all tags: skills + job titles + city + experience level
  const allTags: string[] = [];
  
  // Add all skills found
  allTags.push(...skills);
  
  // Add all job titles found
  allTags.push(...foundTitles);
  
  // Add city if found
  if (city) allTags.push(city);
  
  // Add experience level based on years
  if (experience) {
    const yearsMatch = experience.match(/\d+/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[0]);
      if (years >= 0 && years <= 2) allTags.push('מתחיל');
      else if (years >= 3 && years <= 5) allTags.push('בעל ניסיון');
      else if (years >= 6) allTags.push('ותיק');
    }
  }

  // 🆕 Find professional recruitment tags using the new system
  const recruitmentTags = findMatchingTags(text);
  const professionalCategories = getUniqueCategories(recruitmentTags);
  
  // Add matched keywords to allTags
  for (const tag of recruitmentTags) {
    if (!allTags.includes(tag.keyword)) {
      allTags.push(tag.keyword);
    }
  }

  return {
    name: name || 'לא זוהה',
    email: email || 'לא זוהה',
    phone: phone || 'לא זוהה',
    city: city || 'לא זוהה',
    currentTitle: currentTitle || 'לא זוהה',
    skills: skills.length > 0 ? skills : ['לא זוהו'],
    experience: experience || 'לא זוהה',
    matchedPositions: matchedPositions.length > 0 ? matchedPositions : ['ללא התאמה אוטומטית'],
    tags: allTags.filter(Boolean),
    // 🆕 New recruitment tags data
    recruitmentTags: recruitmentTags,
    professionalCategories: professionalCategories
  };
}

function isLikelyEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@') && value.includes('.') && value.length <= 254;
}

function parseYearsOfExperience(experienceText: unknown): number | null {
  if (typeof experienceText !== 'string') return null;
  const match = experienceText.match(/(\d{1,2})/);
  if (!match) return null;
  const years = parseInt(match[1], 10);
  return Number.isFinite(years) ? years : null;
}

function normalizeMaybeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'לא זוהה' || trimmed === 'לא זוהו') return null;
  return trimmed;
}

function extractKeywordTags(text: string, maxTags: number): string[] {
  const stopwords = new Set([
    // Hebrew
    'של', 'עם', 'על', 'אל', 'את', 'אני', 'אנחנו', 'הוא', 'היא', 'הם', 'הן',
    'זה', 'זו', 'אלה', 'כמו', 'גם', 'או', 'אם', 'כי', 'אבל', 'יותר', 'פחות',
    'ניסיון', 'שנים', 'שנה', 'תפקיד', 'תפקידים', 'עבודה', 'עובד', 'עובדת',
    'אחריות', 'אחראי', 'אחראית', 'ידע', 'יכולת', 'משרה', 'משרות', 'פרטים',
    'טלפון', 'מייל', 'דוא"ל', 'כתובת', 'לינקדאין', 'linkedin',
    // English
    'and', 'or', 'the', 'a', 'an', 'to', 'in', 'for', 'with', 'on', 'of', 'as',
    'experience', 'years', 'year', 'skills', 'skill', 'work', 'role', 'roles',
  ]);

  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stopwords.has(t));

  const counts = new Map<string, number>();
  for (const tok of tokens) {
    counts.set(tok, (counts.get(tok) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([word]) => word);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 🆕 קבלת מזהה של המשתמש שמעלה
    const uploadedById = (session.user as any)?.id || null;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const confirmOnly = formData.get('confirmOnly') === 'true'; // 🆕 מצב אישור בלבד

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text based on file type
    let text = '';
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    if (fileExtension === 'pdf') {
      console.log('📄 Processing PDF:', file.name, 'Size:', buffer.length);
      text = await extractTextFromPDF(buffer);
      console.log('📄 PDF extraction result length:', text?.length || 0);
      
      if (!text || text.length < 20) {
        console.error('❌ PDF text extraction failed or returned too little text');
        return NextResponse.json(
          { error: 'לא הצלחנו לקרוא את קובץ ה-PDF. ייתכן שהקובץ מוגן או שהוא קובץ סרוק באיכות נמוכה. נסה להעלות קובץ PDF אחר או תמונה.' },
          { status: 400 }
        );
      }
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      text = await extractTextFromDOCX(buffer);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(fileExtension || '')) {
      // 🆕 OCR for images using Gemini Vision
      console.log('🖼️ Processing image with OCR:', file.name, 'MIME:', mimeType, 'Size:', buffer.length);
      
      // נסה לזהות MIME type נכון לתמונות מ-WhatsApp
      let actualMimeType = mimeType || 'image/jpeg';
      if (fileExtension === 'heic' || fileExtension === 'heif') {
        actualMimeType = 'image/heic';
      } else if (!actualMimeType.startsWith('image/')) {
        actualMimeType = `image/${fileExtension}`;
      }
      
      text = await extractTextFromImage(buffer, actualMimeType);
      console.log('🖼️ OCR result length:', text?.length || 0);
      
      if (!text || text.length < 20) {
        console.error('❌ OCR failed or returned too little text');
        return NextResponse.json(
          { error: 'לא הצלחנו לקרוא את התמונה. נסה תמונה באיכות גבוהה יותר, וודא שהטקסט קריא, או העלה קובץ PDF' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'סוג קובץ לא נתמך. השתמש ב-PDF, DOCX או תמונה (JPG, PNG)' },
        { status: 400 }
      );
    }

    // 🆕 נסה קודם AI extraction, ואז fallback to regex
    let candidateData: any = null;
    let aiExtracted = false;
    let confidence: any = { name: 0, phone: 0, email: 0, city: 0 };
    
    // Try AI extraction first
    if (text.length > 50) {
      const aiData = await extractCVWithAI(text);
      if (aiData && aiData.name && aiData.name !== 'null') {
        // 🆕 שדרוג: שימוש בשדות החדשים מה-AI החכם
        const mainIndustries = aiData.mainIndustries || [];
        const relevantFor = aiData.relevantFor || [];
        const professionalBackground = aiData.professionalBackground || '';
        
        // יצירת תגיות חכמות מכל המידע
        const smartTags = [
          ...(aiData.skills || []),
          ...(aiData.licenses || []),
          ...(aiData.languages || []),
          ...mainIndustries,
          ...relevantFor
        ].filter(Boolean);
        
        candidateData = {
          name: aiData.name || 'לא זוהה',
          email: aiData.email || 'לא זוהה',
          phone: aiData.phone || 'לא זוהה',
          city: aiData.city || 'לא זוהה',
          currentTitle: aiData.currentTitle || 'לא זוהה',
          skills: aiData.skills || [],
          experience: aiData.yearsOfExperience ? `${aiData.yearsOfExperience} שנים` : 'לא זוהה',
          education: aiData.education,
          licenses: aiData.licenses || [],
          languages: aiData.languages || [],
          workHistory: aiData.workHistory || [],
          tags: smartTags,
          // 🆕 שדות חדשים לזיהוי מקצועי חכם
          mainIndustries: mainIndustries,
          relevantFor: relevantFor,
          professionalBackground: professionalBackground,
          recruitmentTags: [],
          professionalCategories: mainIndustries
        };
        confidence = aiData.confidence || { name: 80, phone: 80, email: 80, city: 80 };
        aiExtracted = true;
        console.log('✅ Using AI extraction for:', candidateData.name);
        console.log('📊 Industries:', mainIndustries.join(', '));
        console.log('🎯 Relevant for:', relevantFor.join(', '));
      }
    }
    
    // Fallback to regex if AI failed
    if (!candidateData) {
      candidateData = analyzeCVText(text);
      console.log('📝 Using regex extraction for:', candidateData.name);
    }

    // 🆕 חישוב איכות הנתונים שחולצו
    const dataQuality = {
      hasName: candidateData.name && candidateData.name !== 'לא זוהה',
      hasPhone: candidateData.phone && candidateData.phone !== 'לא זוהה',
      hasEmail: candidateData.email && candidateData.email !== 'לא זוהה',
      hasCity: candidateData.city && candidateData.city !== 'לא זוהה',
      hasTitle: candidateData.currentTitle && candidateData.currentTitle !== 'לא זוהה',
      hasSkills: Array.isArray(candidateData.skills) && candidateData.skills.length > 0 && 
                 !candidateData.skills.includes('לא זוהו'),
      confidence
    };
    
    const qualityScore = [
      dataQuality.hasName ? 25 : 0,
      dataQuality.hasPhone ? 25 : 0,
      dataQuality.hasEmail ? 20 : 0,
      dataQuality.hasCity ? 15 : 0,
      dataQuality.hasTitle ? 10 : 0,
      dataQuality.hasSkills ? 5 : 0
    ].reduce((a, b) => a + b, 0);

    // 🆕 אם זה רק בדיקה (confirmOnly), החזר את הנתונים בלי לשמור
    if (confirmOnly) {
      return NextResponse.json({
        success: true,
        needsConfirmation: qualityScore < 70 || !dataQuality.hasName,
        qualityScore,
        dataQuality,
        candidate: candidateData,
        extractedText: text.substring(0, 1000),
        aiExtracted,
        fileName: file.name
      });
    }

    // 🆕 בדיקה - האם יש מספיק מידע ליצירת מועמד?
    const hasMinimalData = dataQuality.hasName || dataQuality.hasPhone || dataQuality.hasEmail;
    
    if (!hasMinimalData && qualityScore < 25) {
      console.error('❌ Not enough data extracted from CV');
      return NextResponse.json({
        error: 'לא הצלחנו לחלץ מספיק פרטים מקורות החיים. ודא שהקובץ קריא ומכיל שם, טלפון או אימייל.',
        extractedText: text.substring(0, 500),
        qualityScore,
        dataQuality
      }, { status: 400 });
    }

    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true });
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Persist candidate into DB (so it appears in the general Candidates list)
    const resumeUrl = `/uploads/resumes/${fileName}`;
    let createdCandidate = false;
    let candidateId: string | null = null;

    const normalizedEmail = isLikelyEmail(candidateData?.email) ? (candidateData.email as string) : null;
    const phone = normalizeMaybeValue(candidateData?.phone);
    const name = normalizeMaybeValue(candidateData?.name) || 'מועמד מהעלאה';
    const city = normalizeMaybeValue(candidateData?.city);
    const currentTitle = normalizeMaybeValue(candidateData?.currentTitle);
    const yearsOfExperience = parseYearsOfExperience(candidateData?.experience);
    const skills = Array.isArray(candidateData?.skills)
      ? candidateData.skills.filter((s: unknown) => typeof s === 'string' && s !== 'לא זוהו')
      : [];

    // 🆕 יצירת פרופיל AI משופר לשמירה
    const aiProfileData = {
      skills: candidateData?.skills || [],
      mainIndustries: candidateData?.mainIndustries || [],
      relevantFor: candidateData?.relevantFor || [],
      professionalBackground: candidateData?.professionalBackground || '',
      workHistory: candidateData?.workHistory || [],
      licenses: candidateData?.licenses || [],
      languages: candidateData?.languages || [],
      education: candidateData?.education || null,
      extractedAt: new Date().toISOString(),
      aiExtracted: aiExtracted
    };
    const aiProfileJson = JSON.stringify(aiProfileData);

    let candidateRecord: { id: string } | null = null;

    if (normalizedEmail) {
      const existing = await prisma.candidate.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      createdCandidate = !existing;

      candidateRecord = await prisma.candidate.upsert({
        where: { email: normalizedEmail },
        create: {
          name,
          email: normalizedEmail,
          phone,
          city,
          currentTitle,
          yearsOfExperience,
          skills: skills.length ? skills.join(', ') : null,
          resumeUrl,
          resume: text,  // 🆕 שמירת טקסט קורות חיים המקורי
          aiProfile: aiProfileJson,  // 🆕 שמירת פרופיל AI משופר
          source: 'UPLOAD',
          notes: `נוצר אוטומטית מהעלאת קובץ: ${file.name}`,
          uploadedById,  // 🆕 מי העלה את המועמד
        },
        update: {
          name,
          phone: phone ?? undefined,
          city: city ?? undefined,
          currentTitle: currentTitle ?? undefined,
          yearsOfExperience: yearsOfExperience ?? undefined,
          skills: skills.length ? skills.join(', ') : undefined,
          resumeUrl,
          resume: text,  // 🆕 עדכון טקסט קורות חיים
          aiProfile: aiProfileJson,  // 🆕 עדכון פרופיל AI משופר
        },
        select: { id: true },
      });
    } else {
      // No email: best-effort dedupe by phone
      const existingByPhone = phone
        ? await prisma.candidate.findFirst({ where: { phone }, select: { id: true }, orderBy: { updatedAt: 'desc' } })
        : null;

      if (existingByPhone) {
        createdCandidate = false;
        candidateRecord = await prisma.candidate.update({
          where: { id: existingByPhone.id },
          data: {
            name,
            phone,
            city,
            currentTitle,
            yearsOfExperience,
            skills: skills.length ? skills.join(', ') : undefined,
            resumeUrl,
            resume: text,  // 🆕 עדכון טקסט קורות חיים
            aiProfile: aiProfileJson,  // 🆕 עדכון פרופיל AI משופר
          },
          select: { id: true },
        });
      } else {
        createdCandidate = true;
        
        // Generate unique email placeholder if no email found
        const placeholderEmail = `no-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@twenty2jobs.local`;
        
        candidateRecord = await prisma.candidate.create({
          data: {
            name,
            email: placeholderEmail,
            phone,
            city,
            currentTitle,
            yearsOfExperience,
            skills: skills.length ? skills.join(', ') : null,
            resumeUrl,
            resume: text,  // 🆕 שמירת טקסט קורות חיים המקורי
            aiProfile: aiProfileJson,  // 🆕 שמירת פרופיל AI משופר
            source: 'UPLOAD',
            notes: `נוצר אוטומטית מהעלאת קובץ: ${file.name} (ללא אימייל)`,
            uploadedById,  // 🆕 מי העלה את המועמד
          },
          select: { id: true },
        });
      }
    }

    candidateId = candidateRecord?.id ?? null;

    // Create + attach tags derived from the CV text (all extracted tags)
    if (candidateId && Array.isArray(candidateData?.tags)) {
      const tagMap = new Map<string, string>();

      // 🆕 First, process recruitment tags with their professional categories
      if (Array.isArray(candidateData.recruitmentTags)) {
        for (const rtag of candidateData.recruitmentTags as MatchedTag[]) {
          if (rtag.keyword && rtag.category) {
            tagMap.set(rtag.keyword, rtag.category);
          }
        }
      }

      // Process all extracted tags from analyzeCVText
      for (const tag of candidateData.tags) {
        if (typeof tag === 'string' && tag.trim() && tag !== 'לא זוהה') {
          const tagName = tag.trim();
          
          // Skip if already categorized by recruitment tags
          if (tagMap.has(tagName)) continue;
          
          // Categorize tags intelligently
          let category = 'general';
          
          // Check if it's a skill
          if (skills.includes(tagName)) {
            category = 'skill';
          }
          // Check if it's a city
          else if (city && tagName === city) {
            category = 'city';
          }
          // Check if it's a job title
          else if (currentTitle && tagName === currentTitle) {
            category = 'title';
          }
          // Check for experience level indicators
          else if (['מתחיל', 'בעל ניסיון', 'ותיק', 'Junior', 'Senior', 'Lead'].some(exp => tagName.includes(exp))) {
            category = 'experience';
          }
          // Check for technology keywords
          else if (['JavaScript', 'Python', 'Java', 'SQL', 'React', 'Node', 'AWS', 'Azure', 'Docker'].some(tech => tagName.includes(tech))) {
            category = 'technology';
          }
          
          tagMap.set(tagName, category);
        }
      }

      // Add top keywords from the CV (limited to avoid too many tags)
      const keywordTags = extractKeywordTags(text, 10);
      for (const kw of keywordTags) {
        if (!tagMap.has(kw)) tagMap.set(kw, 'keyword');
      }

      const tagNames = [...tagMap.keys()].slice(0, 50); // Increased limit to capture more tags
      if (tagNames.length) {
        // Get existing tags
        const existingTags = await prisma.tag.findMany({
          where: { name: { in: tagNames } },
          select: { id: true, name: true },
        });

        const existingTagNames = new Set(existingTags.map(t => t.name));
        const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

        // Create only new tags
        if (newTagNames.length > 0) {
          await prisma.tag.createMany({
            data: newTagNames.map((t) => ({ name: t, category: tagMap.get(t) || 'general' })),
          });
        }

        // Get all tag IDs (existing + newly created)
        const allTags = await prisma.tag.findMany({
          where: { name: { in: tagNames } },
          select: { id: true },
        });

        // Connect tags to candidate
        await prisma.candidate.update({
          where: { id: candidateId },
          data: {
            tags: {
              connect: allTags.map((t) => ({ id: t.id })),
            },
          },
        });
      }
    }

    // 🆕 AUTO-MATCHING: חיפוש משרות מתאימות אוטומטית
    let matchingPositions: any[] = [];
    let aiAnalysis: any = null;
    
    if (candidateId && text.length > 100) {
      try {
        console.log('🔍 Starting auto-matching for candidate:', candidateId);
        
        // קריאת כל המשרות הפתוחות
        const activePositions = await prisma.position.findMany({
          where: { active: true },
          include: {
            employer: true,
            tags: true
          }
        });

        // תחומים מילות מפתח
        const INDUSTRY_KEYWORDS: Record<string, string[]> = {
          'לוגיסטיקה': ['מחסן', 'לוגיסטיקה', 'ליקוט', 'הפצה', 'שינוע', 'מלגזן', 'נהג'],
          'אוטומוטיב': ['רכב', 'מכונאי', 'מוסך', 'צמיגים', 'מכירות רכב'],
          'מכירות': ['מכירות', 'נציג מכירות', 'sales', 'B2B', 'שטח'],
          'שירות לקוחות': ['שירות', 'מוקד', 'תמיכה', 'call center'],
          'בנקאות': ['בנק', 'בנקאות', 'פיננסי', 'אשראי', 'טלר'],
          'הייטק': ['תכנות', 'פיתוח', 'software', 'QA', 'DevOps'],
          'מזון': ['מזון', 'מסעדה', 'מטבח', 'שף', 'טבח'],
          'ייצור': ['ייצור', 'מפעל', 'תעשייה', 'אריזה'],
          'ניהול': ['מנהל', 'ניהול', 'team leader', 'ראש צוות'],
          'משרדי': ['אדמיניסטרציה', 'מזכירות', 'office', 'קבלה']
        };

        // זיהוי תחומים של המועמד
        const lowText = text.toLowerCase();
        const detectedIndustries: string[] = [];
        
        for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
          let count = 0;
          for (const kw of keywords) {
            if (lowText.includes(kw.toLowerCase())) count++;
          }
          if (count > 0) detectedIndustries.push(industry);
        }

        // חישוב ציון התאמה לכל משרה
        const scoredPositions = activePositions.map(pos => {
          let score = 0;
          const positionText = `${pos.title} ${pos.description || ''} ${pos.requirements || ''}`.toLowerCase();
          
          // התאמת תחום
          for (const industry of detectedIndustries) {
            const keywords = INDUSTRY_KEYWORDS[industry] || [];
            const matchCount = keywords.filter(kw => positionText.includes(kw.toLowerCase())).length;
            if (matchCount > 0) score += matchCount * 15;
          }

          // התאמת תגיות
          const positionTags = pos.tags.map(t => t.name.toLowerCase());
          for (const tag of positionTags) {
            if (lowText.includes(tag)) score += 10;
          }

          // התאמת עיר
          const cities = ['תל אביב', 'חיפה', 'ירושלים', 'באר שבע', 'אשדוד', 'נתניה'];
          for (const city of cities) {
            if (lowText.includes(city) && positionText.includes(city)) score += 15;
          }

          return {
            id: pos.id,
            title: pos.title,
            employer: pos.employer?.name || 'חברה',
            location: pos.location,
            score
          };
        })
        .filter(p => p.score > 20) // רק משרות עם ציון מינימלי
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // עד 5 משרות מובילות

        matchingPositions = scoredPositions;
        
        // שמירת הניתוח ב-aiProfile של המועמד
        if (scoredPositions.length > 0) {
          aiAnalysis = {
            detectedIndustries,
            topMatches: scoredPositions,
            analyzedAt: new Date().toISOString()
          };

          await prisma.candidate.update({
            where: { id: candidateId },
            data: {
              aiProfile: JSON.stringify(aiAnalysis)
            }
          });
        }

        console.log(`✅ Auto-matching complete: ${scoredPositions.length} positions found for ${name}`);
      } catch (matchError) {
        console.error('Auto-matching error:', matchError);
        // Don't fail the upload if matching fails
      }
    }

    // Return extracted data
    return NextResponse.json({
      success: true,
      fileName: fileName,
      resumeUrl,
      candidate: candidateData,
      candidateId,
      createdCandidate,
      extractedText: text.substring(0, 500), // First 500 chars for preview
      // 🆕 Add recruitment tags info
      recruitmentTags: candidateData.recruitmentTags || [],
      professionalCategories: candidateData.professionalCategories || [],
      // 🆕 Add auto-matching results
      matchingPositions,
      aiAnalysis
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}


