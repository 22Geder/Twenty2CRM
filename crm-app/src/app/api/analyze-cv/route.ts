import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ========================================================================
// מילות מפתח מורחבות - 50+ לכל קטגוריה
// ========================================================================
const EXTENDED_KEYWORDS: Record<string, string[]> = {
  // מכירות - 50+ מילים
  sales: [
    'מכירות', 'סוכן', 'מוכר', 'מכירה', 'איש מכירות', 'נציג מכירות', 'יועץ מכירות',
    'מנהל מכירות', 'סוכן מכירות', 'מכירות טלפוניות', 'טלמרקטינג', 'טלסייל',
    'יועץ עסקי', 'פיתוח עסקי', 'business development', 'sales', 'seller',
    'אנשי מכירות', 'צוות מכירות', 'מכירות שטח', 'מכירות בחנות', 'קמעונאות',
    'retail', 'מכירה ישירה', 'מכירות B2B', 'מכירות B2C', 'סוכן שטח',
    'נציג שטח', 'סוכן ביטוח', 'יועץ פנסיוני', 'מתווך', 'תיווך',
    'עמידה ביעדים', 'יעדי מכירות', 'עמלות', 'בונוסים', 'מכירה אקטיבית',
    'מכירה פרואקטיבית', 'שיווק', 'marketing', 'פרסום', 'קידום מכירות',
    'הדגמות', 'תערוכות', 'אירועים', 'קשרי לקוחות', 'גיוס לקוחות',
    'ניהול תיק לקוחות', 'אפסייל', 'upsale', 'cross sale', 'מכירות נלוות'
  ],

  // שירות לקוחות - 50+ מילים
  service: [
    'שירות', 'לקוחות', 'מוקד', 'תמיכה', 'נציג שירות', 'call center', 'קול סנטר',
    'מוקדן', 'מוקדנית', 'שירות לקוחות', 'תמיכה טכנית', 'support', 'customer service',
    'מענה טלפוני', 'מענה לפניות', 'טיפול בתלונות', 'שימור לקוחות', 'retention',
    'שירות טלפוני', 'שירות פרונטלי', 'קבלת קהל', 'front office', 'back office',
    'מרכז שירות', 'מוקד שירות', 'מוקד תמיכה', 'help desk', 'helpdesk',
    'שירותיות', 'יחסי לקוחות', 'customer relations', 'CRM', 'ניהול לקוחות',
    'פניות לקוחות', 'תלונות', 'בקשות', 'שאילתות', 'מענה מהיר',
    'שביעות רצון', 'חווית לקוח', 'customer experience', 'NPS', 'סקרי שביעות רצון',
    'שיחות נכנסות', 'שיחות יוצאות', 'inbound', 'outbound', 'מוקד מכירות',
    'וואטסאפ', 'צאט', 'chat', 'מייל', 'email support', 'תמיכה במייל'
  ],

  // בנקאות ופיננסים - 50+ מילים
  banking: [
    'בנק', 'בנקאי', 'טלר', 'משכנתא', 'פיננסי', 'בנקאות', 'משכנתאות',
    'בנקאי לקוחות', 'בנקאי עסקי', 'בנקאי משכנתאות', 'בנקאי דיגיטלי',
    'סניף בנק', 'מרכז עסקים', 'ייעוץ בנקאי', 'שירות בנקאי', 'פיקדונות',
    'הלוואות', 'אשראי', 'credit', 'אשראי צרכני', 'אשראי עסקי',
    'ניהול סיכונים', 'risk management', 'ציות', 'compliance', 'רגולציה',
    'AML', 'הלבנת הון', 'בדיקת אשראי', 'דירוג אשראי', 'ערבויות',
    'חיתום', 'underwriting', 'מט"ח', 'foreign exchange', 'forex',
    'השקעות', 'ניהול תיקים', 'portfolio', 'ניירות ערך', 'securities',
    'פנסיה', 'גמל', 'קופות גמל', 'ביטוח', 'insurance', 'חיסכון',
    'מזרחי', 'לאומי', 'דיסקונט', 'הפועלים', 'בינלאומי', 'יהב'
  ],

  // לוגיסטיקה ומחסנים - 50+ מילים
  logistics: [
    'לוגיסטיקה', 'מחסן', 'מלגזה', 'מחסנאי', 'מלגזן', 'ליקוט', 'מלקט',
    'עובד מחסן', 'הפצה', 'נהג', 'משלוחים', 'שינוע', 'אספקה', 'supply chain',
    'מרלוג', 'מרכז לוגיסטי', 'מרכז הפצה', 'distribution center', 'warehouse',
    'קליטת סחורה', 'קבלת סחורה', 'בקרת מלאי', 'inventory', 'ניהול מלאי',
    'WMS', 'מערכת ניהול מחסן', 'סידור סחורה', 'אריזה', 'פריקה', 'העמסה',
    'משטחים', 'פלטות', 'סחורה', 'מוצרים', 'מלאי', 'stock',
    'תעודת משלוח', 'הזמנות', 'orders', 'picking', 'packing', 'shipping',
    'נקודות חלוקה', 'קווי הפצה', 'delivery', 'last mile', 'חבילות',
    'אחסנה', 'storage', 'cold storage', 'קירור', 'הקפאה', 'מזון',
    'סדרן', 'בקר סחורה', 'רפרנט', 'תפעול', 'operations', 'תפעול מחסן'
  ],

  // מלגזה (ספציפי) - 50+ מילים
  forklift: [
    'מלגזה', 'מלגזן', 'מלגזנית', 'היגש', 'עגלה', 'רישיון מלגזה',
    'מלגזת היגש', 'reach truck', 'forklift', 'מלגזה חשמלית', 'מלגזה דיזל',
    'מלקט גובה', 'order picker', 'ג\'ק חשמלי', 'ג\'ק ידני', 'טרנספלט',
    'עגלה חשמלית', 'רכב תפעולי', 'עגלת משטחים', 'pallet jack',
    'הרמה', 'הנמכה', 'הובלת משטחים', 'עבודה בגובה', 'מדפים',
    'rack', 'מדפים גבוהים', 'narrow aisle', 'מעברים צרים',
    'בטיחות מלגזה', 'הסמכת מלגזה', 'קורס מלגזה', 'רישיון היגש',
    'עבודה עם מלגזה', 'ניסיון במלגזה', 'מפעיל מלגזה', 'נהג מלגזה',
    'מלגזן מנוסה', 'מלגזן מתחיל', 'עבודת מלגזה', 'הפעלת מלגזה',
    'VNA', 'very narrow aisle', 'עגלת ליקוט', 'מלקטת', 'stacker'
  ],

  // נהגים - 50+ מילים
  driver: [
    'נהג', 'רישיון נהיגה', 'נהיגה', 'משאית', 'רכב', 'נהג משאית',
    'נהג חלוקה', 'נהג הפצה', 'נהג משלוחים', 'delivery driver', 'driver',
    'רישיון B', 'רישיון C', 'רישיון C1', 'רישיון D', 'רכב כבד',
    '3.5 טון', '4 טון', '12 טון', '15 טון', 'משאית קטנה', 'משאית גדולה',
    'טרנזיט', 'דוקאטו', 'מרצדס', 'איווקו', 'וולוו', 'סקניה',
    'הובלות', 'הובלה', 'שינוע', 'פריקה וטעינה', 'חלוקת סחורה',
    'נהג צמוד', 'רכב צמוד', 'נהג קו', 'נהג עירוני', 'נהג בינעירוני',
    'נהג לילה', 'נהג יום', 'משמרות נהיגה', 'קילומטרז\'', 'דלק',
    'בטיחות בדרכים', 'נהיגה מונעת', 'נהיגה בטוחה', 'טכוגרף', 'GPS',
    'ניווט', 'Waze', 'מסלולים', 'כבישים', 'אזורי חלוקה', 'קווים'
  ],

  // קבלה ואדמיניסטרציה - 50+ מילים
  admin: [
    'מזכיר', 'אדמיניסטרציה', 'קבלה', 'פקיד', 'מזכירה', 'קבלת קהל',
    'דייל', 'דיילת', 'דייל קבלה', 'דיילת קבלה', 'receptionist', 'admin',
    'פקידות', 'עבודה משרדית', 'office', 'מנהל משרד', 'office manager',
    'עוזר אישי', 'PA', 'personal assistant', 'executive assistant',
    'תיאום פגישות', 'ניהול יומן', 'calendar', 'scheduling', 'לוז',
    'הקלדה', 'typing', 'עיבוד תמלילים', 'וורד', 'Word', 'אקסל', 'Excel',
    'מענה טלפוני', 'ניתוב שיחות', 'switch', 'מרכזיה', 'PBX',
    'קבלת אורחים', 'אירוח', 'hospitality', 'ייצוגיות', 'presentation',
    'סידור חדרי ישיבות', 'הזמנת ציוד', 'רכש', 'procurement',
    'תיוק', 'ארכיון', 'filing', 'סריקה', 'scan', 'מסמכים', 'documents'
  ],

  // ניהול - 50+ מילים
  management: [
    'מנהל', 'ניהול', 'ראש צוות', 'אחראי', 'מנהלת', 'team leader',
    'סופרוויזר', 'supervisor', 'מנהל משמרת', 'shift manager', 'אחמ"ש',
    'מנהל אזור', 'מנהל מחלקה', 'department manager', 'מנהל סניף',
    'ניהול צוות', 'ניהול עובדים', 'people management', 'HR management',
    'ניהול פרויקטים', 'project manager', 'PM', 'ניהול תפעול', 'operations manager',
    'ניהול מחסן', 'warehouse manager', 'ניהול לוגיסטיקה', 'logistics manager',
    'קבלת החלטות', 'אחריות ניהולית', 'דיווח', 'reporting', 'KPIs',
    'הנעת עובדים', 'מוטיבציה', 'motivation', 'הכשרה', 'training',
    'גיוס', 'recruiting', 'ראיונות', 'interviews', 'הערכת עובדים',
    'משמעת', 'נוכחות', 'סידור עבודה', 'שיבוץ', 'scheduling', 'planning'
  ],

  // יבוא ויצוא - 50+ מילים
  import_export: [
    'יבוא', 'יצוא', 'שילוח', 'מכס', 'סחר חוץ', 'import', 'export',
    'תיאום יבוא', 'תיאום יצוא', 'רכז יבוא', 'רכזת יצוא', 'shipping',
    'freight', 'freight forwarder', 'סוכן מכס', 'עמיל מכס', 'customs',
    'customs broker', 'שחרור מכס', 'clearance', 'documentation',
    'מסמכי יבוא', 'מסמכי יצוא', 'B/L', 'bill of lading', 'שטר מטען',
    'LC', 'letter of credit', 'מכתב אשראי', 'incoterms', 'FOB', 'CIF',
    'ספנות', 'shipping lines', 'אניות', 'מכולות', 'containers',
    'נמל', 'port', 'אשדוד', 'חיפה', 'נמל תעופה', 'airport', 'cargo',
    'מטען אווירי', 'air freight', 'מטען ימי', 'sea freight', 'LCL', 'FCL',
    'פוקוס', 'focus', 'תוכנת שילוח', 'logistics software', 'ERP'
  ],

  // תואר והשכלה - 50+ מילים
  degree: [
    'תואר', 'B.A', 'M.A', 'MBA', 'BA', 'MA', 'תואר ראשון', 'תואר שני',
    'תואר שלישי', 'דוקטורט', 'PhD', 'אוניברסיטה', 'מכללה', 'university',
    'college', 'לימודים', 'השכלה', 'education', 'בוגר', 'graduate',
    'מוסמך', 'הנדסאי', 'מהנדס', 'engineer', 'חשבונאות', 'accounting',
    'כלכלה', 'economics', 'מנהל עסקים', 'business administration',
    'משפטים', 'law', 'פסיכולוגיה', 'psychology', 'סוציולוגיה', 'sociology',
    'מדעי המחשב', 'computer science', 'מערכות מידע', 'information systems',
    'שיווק', 'marketing', 'מימון', 'finance', 'משאבי אנוש', 'HR',
    'תעודה', 'certificate', 'הסמכה', 'certification', 'קורס', 'course',
    'הכשרה מקצועית', 'professional training', 'דיפלומה', 'diploma'
  ],

  // סטודנטים - 50+ מילים
  student: [
    'סטודנט', 'אוניברסיטה', 'מכללה', 'סטודנטית', 'לומד', 'לומדת',
    'student', 'לימודים', 'תארים', 'שנה א', 'שנה ב', 'שנה ג',
    'משרה חלקית', 'part time', 'עבודה גמישה', 'flexible', 'שעות גמישות',
    'עבודה לסטודנטים', 'משרת סטודנט', 'student job', 'בין הלימודים',
    'חופשת סמסטר', 'חופשת קיץ', 'summer job', 'עבודת קיץ',
    'מלגה', 'scholarship', 'התמחות', 'internship', 'סטאז\'',
    'פרויקט גמר', 'תזה', 'thesis', 'עבודה סמינריונית', 'מחקר',
    'קמפוס', 'campus', 'אוניברסיטת תל אביב', 'אוניברסיטה העברית',
    'טכניון', 'בן גוריון', 'בר אילן', 'חיפה', 'אריאל', 'רייכמן',
    'מכללת ספיר', 'מכללת רופין', 'שנקר', 'בצלאל', 'המכללה למנהל'
  ],

  // רכב/אוטומוטיב - 50+ מילים (חדש!)
  automotive: [
    'רכב', 'רכבים', 'אוטו', 'מכירת רכב', 'מכירות רכב', 'נציג מכירות רכב',
    'מכירת רכבים', 'מכר רכב', 'סוכן רכב', 'יועץ מכירות', 'יועץ רכב', 'יועץ שירות',
    'אולם תצוגה', 'showroom', 'טרייד אין', 'trade in', 'יד 2', 'יד שניה',
    'לקסוס', 'lexus', 'טויוטה', 'toyota', 'geely', 'ג\'ילי', 'יונדאי', 'hyundai',
    'קיא', 'kia', 'ניסאן', 'nissan', 'מזדה', 'mazda', 'סובארו', 'subaru',
    'מרצדס', 'mercedes', 'BMW', 'אודי', 'audi', 'פולקסווגן', 'volkswagen',
    'סקודה', 'skoda', 'פיאט', 'fiat', 'פיג\'ו', 'peugeot', 'סיטרואן', 'citroen',
    'מגרש', 'מגרש רכבים', 'מגרש משומשים', 'car dealership', 'auto', 'automotive',
    'מימון', 'finance', 'משכנתא', 'ליסינג', 'leasing', 'השכרה',
    'חדשים', 'משומשים', 'רכב חדש', 'רכב משומש', 'רכבים חדשים', 'רכבים משומשים',
    'טסט דרייב', 'test drive', 'נסיעת מבחן', 'הנעת רכב', 'העברת בעלות',
    'קבלת רכב', 'מסירת רכב', 'מוסך', 'garage', 'אולם רכב', 'car showroom',
    'זיקר', 'קינרט', 'דלק', 'דרייב', 'delek motors', 'לובינסקי', 'lubinski',
    'UNION', 'יוניון', 'קבוצת union', 'סלקט', 'select', 'אולם סלקט',
    'עמידה ביעדים', 'יעדי מכירות', 'סגירת עסקאות', 'עסקאות רכב'
  ],

  // קמעונאות - 50+ מילים (חדש!)
  retail: [
    'קמעונאות', 'חנות', 'רשת', 'רשתות', 'retail', 'מכירה בחנות',
    'מכירה פרונטלית', 'מכירות בחנות', 'מכירות קמעונאות',
    'זארה', 'ZARA', 'H&M', 'אדידס', 'adidas', 'נייקי', 'nike',
    'קסטרו', 'castro', 'פוקס', 'fox', 'אמריקן איגל', 'american eagle',
    'טרמינל קס', 'terminal x', 'אייס', 'ace', 'הום סנטר', 'home center',
    'סופר פארם', 'super pharm', 'ספור', 'אופנה', 'הלבשה', 'fashion', 'clothing',
    'מוצרי צריכה', 'מוצרי חשמל', 'מרלוג', 'הזמנות',
    'חווית קנייה', 'שירות לקוחות', 'מכירות בשטח', 'מכירה ישירה',
    'נראות החנות', 'ויזואל', 'visual', 'סידור סחורה', 'תצוגה'
  ],

  // אחזקה וטכנאות - 50+ מילים
  maintenance: [
    'אחזקה', 'טכנאי', 'חשמלאי', 'מכונאי', 'תחזוקה', 'maintenance',
    'technician', 'איש אחזקה', 'עובד אחזקה', 'אחזקה שוטפת', 'אחזקה מונעת',
    'preventive maintenance', 'תיקונים', 'repairs', 'שיפוצים', 'renovations',
    'חשמל', 'electricity', 'אינסטלציה', 'plumbing', 'צנרת', 'pipes',
    'מיזוג אוויר', 'HVAC', 'air conditioning', 'קירור', 'חימום',
    'גנרטור', 'generator', 'UPS', 'לוח חשמל', 'electrical panel',
    'ריתוך', 'welding', 'מסגרות', 'נגרות', 'carpentry', 'צבע', 'painting',
    'בניין', 'building', 'facility', 'מתקנים', 'facilities management',
    'בטיחות', 'safety', 'בדיקות תקינות', 'קריאות שירות', 'service calls',
    'חלקי חילוף', 'spare parts', 'כלי עבודה', 'tools', 'ציוד', 'equipment'
  ],

  // הייטק - 50+ מילים
  tech: [
    'תכנות', 'פיתוח', 'הייטק', 'QA', 'מתכנת', 'תוכנה', 'software',
    'developer', 'programmer', 'מפתח', 'בדיקות', 'testing', 'אוטומציה',
    'automation', 'DevOps', 'cloud', 'ענן', 'AWS', 'Azure', 'GCP',
    'fullstack', 'frontend', 'backend', 'web', 'mobile', 'אפליקציה', 'app',
    'JavaScript', 'Python', 'Java', 'C#', 'React', 'Node.js', 'Angular',
    'database', 'SQL', 'MongoDB', 'API', 'REST', 'microservices',
    'agile', 'scrum', 'sprint', 'jira', 'git', 'github', 'CI/CD',
    'machine learning', 'AI', 'data science', 'big data', 'analytics',
    'cyber', 'סייבר', 'אבטחת מידע', 'security', 'network', 'רשתות',
    'IT', 'support', 'תמיכה טכנית', 'helpdesk', 'system admin', 'sysadmin'
  ],

  // פיננסים וחשבונאות - 50+ מילים
  finance: [
    'חשבונאות', 'כלכלה', 'ביטוח', 'חשב', 'רואה חשבון', 'הנהלת חשבונות',
    'bookkeeper', 'accountant', 'CPA', 'עוזר חשב', 'מנהל חשבונות',
    'finance', 'financial', 'פיננסי', 'כספים', 'תקציב', 'budget',
    'דוחות כספיים', 'financial reports', 'מאזן', 'balance sheet',
    'דוח רווח והפסד', 'P&L', 'תזרים מזומנים', 'cash flow',
    'חשבוניות', 'invoices', 'billing', 'חיוב', 'גבייה', 'collection',
    'תשלומים', 'payments', 'ספקים', 'suppliers', 'לקוחות', 'customers',
    'מע"מ', 'VAT', 'מס הכנסה', 'tax', 'דיווחים', 'reporting',
    'IFRS', 'GAAP', 'תקנים חשבונאיים', 'audit', 'ביקורת',
    'priority', 'SAP', 'Excel', 'אקסל מתקדם', 'pivot', 'VLOOKUP'
  ]
};

// פונקציה לזיהוי תגיות מטקסט
function detectTags(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedTags: string[] = [];

  for (const [tagId, keywords] of Object.entries(EXTENDED_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length;
    
    // אם נמצאו לפחות 2 מילות מפתח - התגית רלוונטית
    if (matchCount >= 2) {
      detectedTags.push(tagId);
    }
  }

  return detectedTags;
}

// ניתוח עם Gemini AI
async function analyzeWithGemini(cvText: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `אתה מומחה HR ישראלי. נתח את קורות החיים הבאים וחלץ מידע מדויק.

קורות חיים:
${cvText}

החזר JSON בפורמט הבא בלבד (בעברית):
{
  "name": "שם מלא",
  "phone": "מספר טלפון (פורמט: 05X-XXX-XXXX)",
  "email": "אימייל",
  "city": "עיר מגורים",
  "yearsOfExperience": מספר שנות ניסיון,
  "skills": ["כישורים ומיומנויות"],
  "professions": ["מקצועות/תפקידים שהמועמד יודע לעשות"],
  "industries": ["תעשיות/תחומים רלוונטיים"],
  "summary": "תקציר קצר של הפרופיל המקצועי"
}

חשוב: 
- זהה את העיר המדויקת
- זהה את כל המקצועות שהאדם יכול לעבוד בהם
- אם האדם עבד בלוגיסטיקה/מחסן - הוסף "לוגיסטיקה", "מחסנאי"
- אם האדם עבד במכירות - הוסף "מכירות", "נציג מכירות"
- אם האדם עבד בשירות לקוחות - הוסף "שירות לקוחות", "מוקדן"
- החזר רק JSON, ללא טקסט נוסף!`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Gemini error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cvText } = await request.json();

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json({ error: 'טקסט קורות חיים קצר מדי' }, { status: 400 });
    }

    // נסה עם Gemini אם יש API key
    let geminiResult = null;
    if (process.env.GEMINI_API_KEY) {
      geminiResult = await analyzeWithGemini(cvText);
    }

    // זיהוי תגיות מהטקסט
    const detectedTags = detectTags(cvText);

    // ניתוח בסיסי (fallback)
    const basicAnalysis = {
      name: '',
      phone: '',
      email: '',
      city: '',
      yearsOfExperience: 0,
      skills: [] as string[],
      professions: [] as string[],
      tags: detectedTags
    };

    // חילוץ שם
    const lines = cvText.split('\n').filter((l: string) => l.trim());
    for (const line of lines.slice(0, 8)) {
      const t = line.trim();
      if (t.length >= 3 && t.length <= 35 && /[\u0590-\u05FF]/.test(t) && 
          !t.includes('@') && !/\d{5,}/.test(t) && 
          !['קורות','חיים','טלפון','כתובת','ניסיון','השכלה','תקציר','פרופיל'].some(w => t.includes(w))) {
        basicAnalysis.name = t;
        break;
      }
    }

    // חילוץ טלפון
    const phoneMatch = cvText.match(/0[5][0-9][-\s]?\d{3}[-\s]?\d{4}/);
    if (phoneMatch) {
      const p = phoneMatch[0].replace(/[-\s]/g, '');
      basicAnalysis.phone = `${p.slice(0,3)}-${p.slice(3,6)}-${p.slice(6)}`;
    }

    // חילוץ אימייל
    const emailMatch = cvText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    if (emailMatch) basicAnalysis.email = emailMatch[0].toLowerCase();

    // חילוץ עיר
    const cities = [
      'תל אביב', 'רמת גן', 'בני ברק', 'גבעתיים', 'חולון', 'בת ים', 'פתח תקווה',
      'ראשון לציון', 'רחובות', 'נס ציונה', 'לוד', 'רמלה', 'יהוד', 'אור יהודה',
      'הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'נתניה', 'חדרה',
      'ירושלים', 'בית שמש', 'מודיעין', 'באר שבע', 'אשדוד', 'אשקלון',
      'חיפה', 'עכו', 'נהריה', 'כרמיאל', 'צפת', 'טבריה', 'נצרת', 'עפולה',
      'קרית אונו', 'אילת', 'דימונה', 'ערד', 'נשר', 'קרית ים', 'קרית מוצקין',
      'קרית ביאליק', 'קרית אתא', 'יבנה', 'אופקים', 'נתיבות', 'שדרות',
    ];
    for (const city of cities) {
      if (cvText.includes(city)) { basicAnalysis.city = city; break; }
    }

    // שנות ניסיון
    const expMatch = cvText.match(/(\d+)\s*שנ/);
    if (expMatch) {
      basicAnalysis.yearsOfExperience = parseInt(expMatch[1]);
    }

    // מיזוג תוצאות Gemini עם ניתוח בסיסי
    const finalResult = {
      name: geminiResult?.name || basicAnalysis.name,
      phone: geminiResult?.phone || basicAnalysis.phone,
      email: geminiResult?.email || basicAnalysis.email,
      city: geminiResult?.city || basicAnalysis.city,
      yearsOfExperience: geminiResult?.yearsOfExperience || basicAnalysis.yearsOfExperience,
      skills: geminiResult?.skills || [],
      professions: geminiResult?.professions || [],
      industries: geminiResult?.industries || [],
      summary: geminiResult?.summary || '',
      tags: detectedTags,
      aiPowered: !!geminiResult
    };

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('CV Analysis error:', error);
    return NextResponse.json({ error: 'שגיאה בניתוח קורות החיים' }, { status: 500 });
  }
}


