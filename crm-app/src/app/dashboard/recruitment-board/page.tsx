'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { allJobs, Job, BANKING_GENERAL_REQUIREMENTS, IMPORTANT_NOTES } from './jobs-data';

// ==================== TYPES ====================
interface CandidateTag {
  id: string;
  label: string;
  color: string;
}

interface CandidateDetails {
  name: string;
  phone: string;
  email: string;
  city: string;
  yearsOfExperience: number;
  tags: CandidateTag[];
  notes?: string;
}

interface JobMatch {
  job: Job;
  score: number;
  reasons: string[];
}

interface DashboardStats {
  totalCandidates: number;
  totalPositions: number;
  activePositions: number;
  totalApplications: number;
}

interface Employer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes?: string;
}

interface CustomJob {
  id: string;
  title: string;
  location: string;
  employer: Employer;
  salary?: string;
  requirements?: string;
  notes?: string;
  createdAt: Date;
}

// ==================== EMPLOYERS ====================
const DEFAULT_EMPLOYERS: Employer[] = [
  { id: 'mizrahi', name: 'סמדר אורפז', email: 'orpazsm@gmail.com', phone: '050-1234567', company: 'בנק מזרחי טפחות' },
  { id: 'union', name: 'קבוצת UNION', email: '', phone: '', company: 'UNION - לקסוס, טויוטה, Geely', notes: '🔥 משרות דחופות! בונוס 1,000 ₪ H&M למגייס!' },
  { id: 'yes', name: 'YES', email: '', phone: '', company: 'YES - חטיבת לקוחות עסקיים, מוקדי מכירות ושירות', notes: '🎯 7 משרות! נשר, ב"ש, כפר סבא. בונוסים עד 10K!' },
  { id: 'sela', name: 'סלע לוגיסטיקה', email: '', phone: '', company: 'סלע לוגיסטיקה - מחסנים והפצה', notes: '📦 15 משרות! אשדוד, בית שמש, חפץ חיים. שכר 38-55 ₪/שעה. אנשי קשר: Pninit Roitman, Dana Shapiro' },
  { id: 'logisticar', name: 'לוגיסטיקר', email: '', phone: '', company: 'לוגיסטיקר - מחסנים, הפצה, נהגים', notes: '🚛 18 משרות דחופות! בית שמש, לוד, אשדוד, בית חיליקה. שכר 40-60 ₪/שעה. נהגים עד 12,400 ₪!' },
  { id: 'adr', name: 'א.ד.ר לוגיסטיקה', email: '', phone: '', company: 'א.ד.ר לוגיסטיקה - ירין יחזקאל', notes: '🎁 5 משרות! בית שמש, אירפורט סיטי, מודיעין. בונוס התמדה 1,000 ₪ חודשי! שכר 43-52 ₪/שעה' },
  { id: 'oshpir', name: 'אושפיר', email: '', phone: '', company: 'אושפיר - שילוח בינלאומי', notes: '🚢 2 משרות בחיפה! מתאם/ת יבוא + מתאם/ת יצוא. נדרש ניסיון + אנגלית. איש קשר: ריקי כהן' },
];

// ==================== TAGS ====================
const TAGS: CandidateTag[] = [
  { id: 'sales', label: 'מכירות', color: '#8B5CF6' },
  { id: 'service', label: 'שירות לקוחות', color: '#3B82F6' },
  { id: 'banking', label: 'בנקאות', color: '#059669' },
  { id: 'management', label: 'ניהול', color: '#F59E0B' },
  { id: 'maintenance', label: 'אחזקה', color: '#EA580C' },
  { id: 'logistics', label: 'לוגיסטיקה', color: '#0891B2' },
  { id: 'admin', label: 'מנהלה', color: '#EC4899' },
  { id: 'tech', label: 'הייטק', color: '#6366F1' },
  { id: 'finance', label: 'פיננסים', color: '#10B981' },
  { id: 'student', label: 'סטודנט', color: '#0EA5E9' },
  { id: 'degree', label: 'בעל תואר', color: '#14B8A6' },
  { id: 'experienced', label: 'מנוסה', color: '#EAB308' },
  { id: 'driver', label: 'נהג', color: '#7C3AED' },
  { id: 'driver_b', label: 'רישיון B', color: '#4ADE80' },
  { id: 'driver_c1', label: 'רישיון C1', color: '#FACC15' },
  { id: 'driver_c', label: 'רישיון C', color: '#FB923C' },
  { id: 'forklift', label: 'מלגזה', color: '#DC2626' },
  { id: 'import_export', label: 'יבוא/יצוא', color: '#0369A1' },
  { id: 'automotive', label: 'רכב/אוטו', color: '#B91C1C' },
  { id: 'retail', label: 'קמעונאות', color: '#7C3AED' },
];

// ==================== WHATSAPP & EMAIL HELPERS ====================
function getWhatsAppLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[-\s]/g, '');
  const israelPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.slice(1) : cleanPhone;
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${israelPhone}${encodedMessage}`;
}

function getEmailLink(email: string, subject?: string, body?: string): string {
  let link = `mailto:${email}`;
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) link += '?' + params.join('&');
  return link;
}

// ==================== CITIES ====================
const CITIES = [
  'תל אביב', 'רמת גן', 'בני ברק', 'גבעתיים', 'חולון', 'בת ים', 'פתח תקווה',
  'ראשון לציון', 'רחובות', 'נס ציונה', 'לוד', 'רמלה', 'יהוד', 'אור יהודה',
  'הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'נתניה', 'חדרה',
  'ירושלים', 'בית שמש', 'מודיעין', 'באר שבע', 'אשדוד', 'אשקלון',
  'חיפה', 'עכו', 'נהריה', 'כרמיאל', 'צפת', 'טבריה', 'נצרת', 'עפולה',
  'קרית אונו', 'אילת', 'דימונה', 'ערד', 'נשר', 'קרית ים', 'קרית מוצקין',
  'קרית ביאליק', 'קרית אתא', 'יבנה', 'אופקים', 'נתיבות', 'שדרות',
  // ואדי ערה והמשולש
  'בסמ"ה', 'בסמה', 'כפר קרע', 'אום אל פחם', 'עארה', 'ערערה', 'באקה אל גרביה',
  'טייבה', 'טירה', 'קלנסווה', 'ג\'לג\'וליה', 'כפר ברא', 'כפר קאסם',
  // גליל ועמקים
  'סח\'נין', 'עראבה', 'דיר חנא', 'מג\'ד אל כרום', 'שפרעם', 'טמרה',
  'יפיע', 'כפר כנא', 'עילבון', 'דבוריה', 'נוף הגליל',
];

// ==================== NEARBY CITIES (לאזורים קרובים) ====================
const NEARBY_CITIES: Record<string, string[]> = {
  'תל אביב': ['רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'יפו', 'הרצליה'],
  'רמת גן': ['תל אביב', 'גבעתיים', 'בני ברק', 'פתח תקווה', 'קרית אונו'],
  'פתח תקווה': ['רמת גן', 'בני ברק', 'קרית אונו', 'יהוד', 'ראש העין'],
  'ירושלים': ['בית שמש', 'מודיעין', 'מעלה אדומים', 'גבעת זאב'],
  'בית שמש': ['ירושלים', 'מודיעין', 'רמלה', 'לוד'],
  'מודיעין': ['בית שמש', 'ירושלים', 'לוד', 'רמלה'],
  'אשדוד': ['אשקלון', 'יבנה', 'באר שבע', 'קרית גת'],
  'באר שבע': ['אשדוד', 'אשקלון', 'דימונה', 'ערד', 'אופקים'],
  'חיפה': ['נשר', 'קרית ים', 'קרית מוצקין', 'קרית ביאליק', 'קרית אתא', 'עכו', 'טירת הכרמל'],
  'נשר': ['חיפה', 'קרית אתא', 'קרית ביאליק'],
  'כפר סבא': ['רעננה', 'הוד השרון', 'נתניה', 'רמת השרון', 'הרצליה'],
  'רעננה': ['כפר סבא', 'הרצליה', 'הוד השרון', 'רמת השרון'],
  'ראשון לציון': ['חולון', 'בת ים', 'נס ציונה', 'רחובות', 'יבנה'],
  'רחובות': ['ראשון לציון', 'נס ציונה', 'יבנה', 'לוד'],
  'לוד': ['רמלה', 'רחובות', 'מודיעין', 'יהוד'],
  'רמלה': ['לוד', 'רחובות', 'מודיעין', 'בית שמש'],
  // ואדי ערה והמשולש - כולם קרובים לחדרה, נתניה, עפולה, חיפה
  'בסמ"ה': ['כפר קרע', 'אום אל פחם', 'עארה', 'ערערה', 'חדרה', 'נתניה', 'עפולה', 'חיפה', 'פרדס חנה'],
  'בסמה': ['כפר קרע', 'אום אל פחם', 'עארה', 'ערערה', 'חדרה', 'נתניה', 'עפולה', 'חיפה', 'פרדס חנה'],
  'כפר קרע': ['בסמ"ה', 'בסמה', 'אום אל פחם', 'עארה', 'ערערה', 'חדרה', 'נתניה', 'עפולה', 'חיפה'],
  'אום אל פחם': ['בסמ"ה', 'כפר קרע', 'עארה', 'ערערה', 'עפולה', 'חדרה', 'חיפה'],
  'עארה': ['בסמ"ה', 'כפר קרע', 'ערערה', 'חדרה', 'נתניה', 'עפולה'],
  'ערערה': ['עארה', 'בסמ"ה', 'כפר קרע', 'חדרה', 'נתניה', 'עפולה'],
  'באקה אל גרביה': ['טייבה', 'חדרה', 'נתניה', 'כפר סבא', 'עפולה'],
  'טייבה': ['טירה', 'קלנסווה', 'נתניה', 'כפר סבא', 'הוד השרון', 'רעננה'],
  'טירה': ['טייבה', 'קלנסווה', 'כפר סבא', 'נתניה', 'רעננה', 'הרצליה'],
  'קלנסווה': ['טייבה', 'טירה', 'נתניה', 'כפר סבא', 'הוד השרון'],
  'ג\'לג\'וליה': ['כפר ברא', 'כפר קאסם', 'פתח תקווה', 'ראש העין', 'כפר סבא'],
  'כפר ברא': ['ג\'לג\'וליה', 'כפר קאסם', 'פתח תקווה', 'ראש העין', 'רמת גן'],
  'כפר קאסם': ['ג\'לג\'וליה', 'כפר ברא', 'פתח תקווה', 'ראש העין', 'רמת גן'],
  // גליל ועמקים
  'נצרת': ['נוף הגליל', 'עפולה', 'טבריה', 'כפר כנא', 'יפיע', 'שפרעם'],
  'נוף הגליל': ['נצרת', 'עפולה', 'טבריה', 'כפר כנא', 'שפרעם'],
  'עפולה': ['נצרת', 'נוף הגליל', 'בית שאן', 'עין חרוד', 'יזרעאל'],
  'שפרעם': ['נצרת', 'נוף הגליל', 'חיפה', 'טמרה', 'עכו'],
  'טמרה': ['שפרעם', 'חיפה', 'עכו', 'כרמיאל'],
  'סח\'נין': ['עראבה', 'כרמיאל', 'עכו', 'דיר חנא', 'מג\'ד אל כרום'],
  'עראבה': ['סח\'נין', 'כרמיאל', 'דיר חנא', 'מג\'ד אל כרום'],
  'חדרה': ['נתניה', 'פרדס חנה', 'כפר סבא', 'בסמ"ה', 'כפר קרע', 'עארה'],
  'נתניה': ['חדרה', 'כפר סבא', 'הרצליה', 'רעננה', 'טייבה', 'קלנסווה'],
};

// ==================== CV ANALYZER - גרסה חכמה פי 3! ====================
function analyzeCV(text: string): CandidateDetails {
  const lines = text.split('\n').filter(l => l.trim());
  const textLower = text.toLowerCase();
  
  const result: CandidateDetails = {
    name: '', phone: '', email: '', city: '',
    yearsOfExperience: 0, tags: []
  };

  // ========== 1. NAME - זיהוי שם חכם ==========
  // חיפוש שם לפי מילות מפתח קודם
  const namePatterns = [
    /שם[:\s]*([א-ת\s]{3,30})/,
    /שם מלא[:\s]*([א-ת\s]{3,30})/,
    /^([א-ת]+\s+[א-ת]+)$/m,  // שם + שם משפחה בשורה נפרדת
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim().length >= 3) {
      result.name = match[1].trim();
      break;
    }
  }
  // Fallback - שורה ראשונה שנראית כמו שם
  if (!result.name) {
    for (const line of lines.slice(0, 8)) {
      const t = line.trim();
      if (t.length >= 3 && t.length <= 35 && /[\u0590-\u05FF]/.test(t) && 
          !t.includes('@') && !/\d{5,}/.test(t) && 
          !['קורות','חיים','טלפון','כתובת','ניסיון','השכלה','תאריך','מגורים','נייד'].some(w => t.includes(w))) {
        result.name = t;
        break;
      }
    }
  }

  // ========== 2. PHONE - זיהוי טלפון חכם ==========
  const phonePatterns = [
    /(?:טלפון|נייד|פלאפון|טל|סלולר|נייד)[:\s]*([0][5][0-9][-\s]?\d{3}[-\s]?\d{4})/i,
    /(?:\+972|972)[- ]?([5][0-9])[-\s]?(\d{3})[-\s]?(\d{4})/,
    /([0][5][0-9])[-\s]?(\d{3})[-\s]?(\d{4})/,
  ];
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      const p = match[0].replace(/[^\d]/g, '').replace(/^972/, '0');
      if (p.length >= 10) {
        result.phone = `${p.slice(0,3)}-${p.slice(3,6)}-${p.slice(6,10)}`;
        break;
      }
    }
  }

  // ========== 3. EMAIL - זיהוי אימייל ==========
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (emailMatch) result.email = emailMatch[0].toLowerCase();

  // ========== 4. CITY - זיהוי עיר חכם ==========
  // חיפוש עם הקשר קודם
  const cityPatterns = [
    /(?:מגורים|כתובת|עיר|גר ב|מתגורר ב|גרה ב|מתגוררת ב)[:\s]*([א-ת\s"']+)/i,
    /(?:תושב|תושבת)[:\s]*([א-ת\s"']+)/i,
  ];
  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match) {
      const cityPart = match[1].trim();
      for (const city of CITIES) {
        if (cityPart.includes(city)) { result.city = city; break; }
      }
      if (result.city) break;
    }
  }
  // Fallback
  if (!result.city) {
    for (const city of CITIES) {
      if (text.includes(city)) { result.city = city; break; }
    }
  }

  // Tags - 50+ מילות מפתח לכל קטגוריה!
  const keywords: Record<string, string[]> = {
    // מכירות - 50+ מילים
    'sales': [
      'מכירות', 'סוכן', 'מוכר', 'מכירה', 'איש מכירות', 'נציג מכירות', 'יועץ מכירות',
      'מנהל מכירות', 'סוכן מכירות', 'מכירות טלפוניות', 'טלמרקטינג', 'טלסייל',
      'יועץ עסקי', 'פיתוח עסקי', 'business development', 'sales', 'seller',
      'אנשי מכירות', 'צוות מכירות', 'מכירות שטח', 'מכירות בחנות', 'קמעונאות',
      'retail', 'מכירה ישירה', 'מכירות B2B', 'מכירות B2C', 'סוכן שטח',
      'נציג שטח', 'סוכן ביטוח', 'יועץ פנסיוני', 'מתווך', 'תיווך',
      'עמידה ביעדים', 'יעדי מכירות', 'עמלות', 'בונוסים', 'מכירה אקטיבית',
      'שיווק', 'marketing', 'פרסום', 'קידום מכירות', 'הדגמות', 'סגירת עסקאות',
    ],
    // שירות לקוחות - 50+ מילים
    'service': [
      'שירות', 'לקוחות', 'מוקד', 'תמיכה', 'נציג שירות', 'call center', 'קול סנטר',
      'מוקדן', 'מוקדנית', 'שירות לקוחות', 'תמיכה טכנית', 'support', 'customer service',
      'מענה טלפוני', 'מענה לפניות', 'טיפול בתלונות', 'שימור לקוחות', 'retention',
      'שירות טלפוני', 'שירות פרונטלי', 'קבלת קהל', 'front office', 'back office',
      'מרכז שירות', 'מוקד שירות', 'מוקד תמיכה', 'help desk', 'helpdesk',
      'שירותיות', 'יחסי לקוחות', 'customer relations', 'CRM', 'ניהול לקוחות',
      'שיחות נכנסות', 'שיחות יוצאות', 'inbound', 'outbound', 'מוקד מכירות',
      'שביעות רצון', 'טיפול בפניות', 'תודעת שירות',
    ],
    // בנקאות - 50+ מילים
    'banking': [
      'בנק', 'בנקאי', 'טלר', 'משכנתא', 'פיננסי', 'בנקאות', 'משכנתאות',
      'בנקאי לקוחות', 'בנקאי עסקי', 'בנקאי משכנתאות', 'בנקאי דיגיטלי',
      'סניף בנק', 'מרכז עסקים', 'ייעוץ בנקאי', 'שירות בנקאי', 'פיקדונות',
      'הלוואות', 'אשראי', 'credit', 'אשראי צרכני', 'אשראי עסקי',
      'מזרחי', 'לאומי', 'דיסקונט', 'הפועלים', 'בינלאומי', 'יהב',
      'ניהול סיכונים', 'ציות', 'compliance', 'AML', 'חיתום', 'מט"ח',
    ],
    // ניהול - 50+ מילים
    'management': [
      'מנהל', 'ניהול', 'ראש צוות', 'אחראי', 'מנהלת', 'team leader',
      'סופרוויזר', 'supervisor', 'מנהל משמרת', 'shift manager', 'אחמ"ש',
      'מנהל אזור', 'מנהל מחלקה', 'department manager', 'מנהל סניף',
      'ניהול צוות', 'ניהול עובדים', 'people management', 'HR management',
      'מנהל מחסן', 'warehouse manager', 'ניהול לוגיסטיקה', 'logistics manager',
      'הנעת עובדים', 'מוטיבציה', 'הכשרה', 'training', 'גיוס', 'recruiting',
      'מנהל אולם', 'מנהל חנות', 'ניהול אולם תצוגה',
    ],
    // לוגיסטיקה - 50+ מילים
    'logistics': [
      'לוגיסטיקה', 'מחסן', 'מלגזה', 'מחסנאי', 'מלגזן', 'ליקוט', 'מלקט',
      'עובד מחסן', 'הפצה', 'נהג', 'משלוחים', 'שינוע', 'אספקה', 'supply chain',
      'מרלוג', 'מרכז לוגיסטי', 'מרכז הפצה', 'distribution center', 'warehouse',
      'קליטת סחורה', 'קבלת סחורה', 'בקרת מלאי', 'inventory', 'ניהול מלאי',
      'WMS', 'מערכת ניהול מחסן', 'סידור סחורה', 'אריזה', 'פריקה', 'העמסה',
      'משטחים', 'פלטות', 'סחורה', 'מוצרים', 'מלאי', 'stock',
      'picking', 'packing', 'shipping', 'delivery', 'last mile', 'חבילות',
      'סדרן', 'בקר סחורה', 'רפרנט', 'תפעול', 'operations', 'תפעול מחסן',
      'עובד לוגיסטיקה', 'לוגיסטיקאי', 'איש מחסן', 'בן מחסן',
      'סלע', 'לוגיסטיקר', 'א.ד.ר', 'מרלו"ג',
    ],
    // מלגזה - 50+ מילים
    'forklift': [
      'מלגזה', 'מלגזן', 'מלגזנית', 'היגש', 'עגלה', 'רישיון מלגזה',
      'מלגזת היגש', 'reach truck', 'forklift', 'מלגזה חשמלית', 'מלגזה דיזל',
      'מלקט גובה', 'order picker', 'ג\'ק חשמלי', 'ג\'ק ידני', 'טרנספלט',
      'עגלה חשמלית', 'רכב תפעולי', 'עגלת משטחים', 'pallet jack',
      'הרמה', 'הנמכה', 'הובלת משטחים', 'עבודה בגובה', 'מדפים',
      'rack', 'מדפים גבוהים', 'narrow aisle', 'מעברים צרים',
      'בטיחות מלגזה', 'הסמכת מלגזה', 'קורס מלגזה', 'רישיון היגש',
      'עבודה עם מלגזה', 'ניסיון במלגזה', 'מפעיל מלגזה', 'נהג מלגזה',
    ],
    // נהגים (כללי) - 50+ מילים
    'driver': [
      'נהג', 'רישיון נהיגה', 'נהיגה', 'משאית', 'רכב', 'נהג משאית',
      'נהג חלוקה', 'נהג הפצה', 'נהג משלוחים', 'delivery driver', 'driver',
      'הובלות', 'הובלה', 'שינוע', 'פריקה וטעינה', 'חלוקת סחורה',
      'נהג צמוד', 'רכב צמוד', 'נהג קו', 'נהג עירוני', 'נהג בינעירוני',
      'טרנזיט', 'דוקאטו', 'איווקו', 'וולוו', 'סקניה',
    ],
    // נהג רישיון B (עד 3.5 טון)
    'driver_b': [
      'רישיון B', 'רישיון ב', 'רכב פרטי', '3.5 טון', 'טרנזיט', 'דוקאטו',
      'רכב מסחרי קטן', 'אוטו', 'רכב עבודה', 'נהיגה רגילה',
    ],
    // נהג רישיון C1 (עד 12 טון)
    'driver_c1': [
      'רישיון C1', 'רישיון ג1', 'C1', 'ג1', '4 טון', '7.5 טון', '10 טון', '12 טון',
      'משאית קטנה', 'משאית בינונית', 'רכב כבד', 'מעל 3.5 טון',
    ],
    // נהג רישיון C (מעל 12 טון)
    'driver_c': [
      'רישיון C', 'רישיון ג', '15 טון', '18 טון', '22 טון', 'משאית גדולה',
      'טריילר', 'ראש קטר', 'נגרר', 'משאית כבדה', 'רכב כבד מאוד',
    ],
    // קבלה ואדמיניסטרציה - 50+ מילים
    'admin': [
      'מזכיר', 'אדמיניסטרציה', 'קבלה', 'פקיד', 'מזכירה', 'קבלת קהל',
      'דייל', 'דיילת', 'דייל קבלה', 'דיילת קבלה', 'receptionist', 'admin',
      'פקידות', 'עבודה משרדית', 'office', 'מנהל משרד', 'office manager',
      'עוזר אישי', 'PA', 'personal assistant', 'executive assistant',
      'תיאום פגישות', 'ניהול יומן', 'calendar', 'scheduling', 'לוז',
      'הקלדה', 'typing', 'עיבוד תמלילים', 'וורד', 'Word', 'אקסל', 'Excel',
      'מענה טלפוני', 'ניתוב שיחות', 'switch', 'מרכזיה', 'PBX',
      'נציג קבלה', 'נציגת קבלה', 'ייצוגיות',
    ],
    // יבוא ויצוא - 50+ מילים
    'import_export': [
      'יבוא', 'יצוא', 'שילוח', 'מכס', 'סחר חוץ', 'import', 'export',
      'תיאום יבוא', 'תיאום יצוא', 'רכז יבוא', 'רכזת יצוא', 'shipping',
      'freight', 'freight forwarder', 'סוכן מכס', 'עמיל מכס', 'customs',
      'customs broker', 'שחרור מכס', 'clearance', 'documentation',
      'מסמכי יבוא', 'מסמכי יצוא', 'B/L', 'bill of lading', 'שטר מטען',
      'ספנות', 'shipping lines', 'אניות', 'מכולות', 'containers',
      'נמל', 'port', 'נמל תעופה', 'airport', 'cargo',
      'פוקוס', 'focus', 'תוכנת שילוח', 'logistics software', 'ERP',
      'אושפיר', 'שילוח בינלאומי',
    ],
    // אחזקה - 50+ מילים
    'maintenance': [
      'אחזקה', 'טכנאי', 'חשמלאי', 'מכונאי', 'תחזוקה', 'maintenance',
      'technician', 'איש אחזקה', 'עובד אחזקה', 'אחזקה שוטפת', 'אחזקה מונעת',
      'תיקונים', 'repairs', 'שיפוצים', 'renovations',
      'חשמל', 'electricity', 'אינסטלציה', 'plumbing', 'צנרת', 'pipes',
      'מיזוג אוויר', 'HVAC', 'air conditioning', 'קירור', 'חימום',
      'ריתוך', 'welding', 'מסגרות', 'נגרות', 'carpentry', 'צבע', 'painting',
    ],
    // הייטק - 50+ מילים
    'tech': [
      'תכנות', 'פיתוח', 'הייטק', 'QA', 'מתכנת', 'תוכנה', 'software',
      'developer', 'programmer', 'מפתח', 'בדיקות', 'testing', 'אוטומציה',
      'automation', 'DevOps', 'cloud', 'ענן', 'AWS', 'Azure', 'GCP',
      'fullstack', 'frontend', 'backend', 'web', 'mobile', 'אפליקציה', 'app',
      'JavaScript', 'Python', 'Java', 'C#', 'React', 'Node.js', 'Angular',
      'IT', 'support', 'תמיכה טכנית', 'helpdesk', 'system admin', 'sysadmin',
      'ANDROID', 'IOS', 'פיתוח אפליקציות',
    ],
    // פיננסים - 50+ מילים
    'finance': [
      'חשבונאות', 'כלכלה', 'ביטוח', 'חשב', 'רואה חשבון', 'הנהלת חשבונות',
      'bookkeeper', 'accountant', 'CPA', 'עוזר חשב', 'מנהל חשבונות',
      'finance', 'financial', 'פיננסי', 'כספים', 'תקציב', 'budget',
      'דוחות כספיים', 'financial reports', 'מאזן', 'balance sheet',
      'חשבוניות', 'invoices', 'billing', 'חיוב', 'גבייה', 'collection',
      'מע"מ', 'VAT', 'מס הכנסה', 'tax', 'דיווחים', 'reporting',
      'priority', 'SAP', 'Excel', 'אקסל מתקדם', 'pivot', 'VLOOKUP',
    ],
    // סטודנטים - 50+ מילים
    'student': [
      'סטודנט', 'אוניברסיטה', 'מכללה', 'סטודנטית', 'לומד', 'לומדת',
      'student', 'לימודים', 'תארים', 'שנה א', 'שנה ב', 'שנה ג',
      'משרה חלקית', 'part time', 'עבודה גמישה', 'flexible', 'שעות גמישות',
      'עבודה לסטודנטים', 'משרת סטודנט', 'student job', 'בין הלימודים',
      'מלגה', 'scholarship', 'התמחות', 'internship', 'סטאז\'',
      'קמפוס', 'campus', 'אוניברסיטת תל אביב', 'בר אילן', 'טכניון',
    ],
    // תואר - 50+ מילים
    'degree': [
      'תואר', 'B.A', 'M.A', 'MBA', 'BA', 'MA', 'תואר ראשון', 'תואר שני',
      'תואר שלישי', 'דוקטורט', 'PhD', 'אוניברסיטה', 'מכללה', 'university',
      'college', 'לימודים', 'השכלה', 'education', 'בוגר', 'graduate',
      'מוסמך', 'הנדסאי', 'מהנדס', 'engineer', 'חשבונאות', 'accounting',
      'כלכלה', 'economics', 'מנהל עסקים', 'business administration',
      'תעודה', 'certificate', 'הסמכה', 'certification', 'קורס', 'course',
    ],
    // רכב/אוטומוטיב - 50+ מילים
    'automotive': [
      'רכב', 'רכבים', 'אוטו', 'מכירת רכב', 'מכירות רכב', 'נציג מכירות רכב',
      'מכירת רכבים', 'מכר רכב', 'סוכן רכב', 'יועץ רכב', 'יועץ שירות',
      'אולם תצוגה', 'showroom', 'טרייד אין', 'trade in', 'יד 2', 'יד שניה',
      'לקסוס', 'lexus', 'טויוטה', 'toyota', 'geely', 'ג\'ילי', 'יונדאי', 'hyundai',
      'קיא', 'kia', 'ניסאן', 'nissan', 'מזדה', 'mazda', 'סובארו', 'subaru',
      'מרצדס', 'mercedes', 'BMW', 'אודי', 'audi', 'פולקסווגן', 'volkswagen',
      'מגרש', 'מגרש רכבים', 'מגרש משומשים', 'car dealership', 'automotive',
      'מימון', 'משכנתא רכב', 'ליסינג', 'leasing', 'השכרה',
      'חדשים', 'משומשים', 'רכב חדש', 'רכב משומש', 'טסט דרייב', 'test drive',
      'זיקר', 'קינרט', 'דלק', 'דרייב', 'delek motors', 'לובינסקי',
      'UNION', 'יוניון', 'קבוצת union', 'סלקט', 'select', 'אולם סלקט',
    ],
    // קמעונאות - 50+ מילים
    'retail': [
      'קמעונאות', 'חנות', 'רשת', 'רשתות', 'retail', 'מכירה בחנות',
      'מכירה פרונטלית', 'מכירות בחנות', 'מכירות קמעונאות',
      'זארה', 'ZARA', 'H&M', 'אדידס', 'adidas', 'נייקי', 'nike',
      'קסטרו', 'castro', 'פוקס', 'fox', 'אמריקן איגל', 'american eagle',
      'סופר פארם', 'super pharm', 'אופנה', 'הלבשה', 'fashion', 'clothing',
      'מרלוג', 'הזמנות', 'חווית קנייה', 'נראות החנות',
    ],
  };

  // ========== 5. TAGS - זיהוי תגיות חכם ==========
  for (const [id, words] of Object.entries(keywords)) {
    // בדיקה חכמה יותר - תלוי במילים, לא בכל מילה
    const matchCount = words.filter(w => text.includes(w)).length;
    // אם יש לפחות 2 התאמות - תגית חזקה, או אם יש התאמה אחת ספציפית
    if (matchCount >= 1) {
      const tag = TAGS.find(t => t.id === id);
      if (tag && !result.tags.find(t => t.id === id)) result.tags.push(tag);
    }
  }

  // ========== 6. YEARS OF EXPERIENCE - זיהוי ניסיון חכם ==========
  // חיפוש לפי דפוסים שונים
  const expPatterns = [
    /(\d+)\+?\s*(?:שנות|שנים|שנה)\s*(?:ניסיון|של ניסיון|וותק)/,
    /(?:ניסיון|וותק)\s*(?:של|:)?\s*(\d+)\s*(?:שנות|שנים|שנה)/,
    /(?:over|more than|מעל)\s*(\d+)\s*(?:years|שנים)/i,
    /עבדתי\s*(?:כ|במשך)?\s*(\d+)\s*שנ/,
    /(\d+)\s*שנות עבודה/,
  ];
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      if (years > 0 && years < 50) {
        result.yearsOfExperience = years;
        break;
      }
    }
  }
  // Fallback - חיפוש כללי
  if (!result.yearsOfExperience) {
    const generalMatch = text.match(/(\d+)\s*שנ/);
    if (generalMatch) {
      const years = parseInt(generalMatch[1]);
      if (years >= 1 && years <= 40) result.yearsOfExperience = years;
    }
  }
  // הוספת תגית מנוסה
  if (result.yearsOfExperience >= 5 && !result.tags.find(t => t.id === 'experienced')) {
    const expTag = TAGS.find(t => t.id === 'experienced');
    if (expTag) result.tags.push(expTag);
  }

  // ========== 7. SMART DETECTION - זיהוי חכם נוסף ==========
  // זיהוי שפות
  const languages: string[] = [];
  if (text.includes('אנגלית') || textLower.includes('english')) languages.push('אנגלית');
  if (text.includes('ערבית') || textLower.includes('arabic')) languages.push('ערבית');
  if (text.includes('רוסית') || textLower.includes('russian')) languages.push('רוסית');
  if (text.includes('צרפתית') || textLower.includes('french')) languages.push('צרפתית');
  if (text.includes('אמהרית') || textLower.includes('amharic')) languages.push('אמהרית');
  
  // זיהוי מיומנויות טכניות
  const techSkills: string[] = [];
  if (textLower.includes('excel') || text.includes('אקסל')) techSkills.push('Excel');
  if (textLower.includes('word') || text.includes('וורד')) techSkills.push('Word');
  if (textLower.includes('powerpoint') || text.includes('פאוורפוינט')) techSkills.push('PowerPoint');
  if (textLower.includes('crm') || text.includes('CRM')) techSkills.push('CRM');
  if (textLower.includes('sap') || text.includes('SAP')) techSkills.push('SAP');
  if (textLower.includes('priority') || text.includes('פריוריטי')) techSkills.push('Priority');

  return result;
}

// ==================== JOB MATCHING - אלגוריתם חכם ====================
function matchJobs(candidate: CandidateDetails, jobs: Job[]): JobMatch[] {
  const tagIds = candidate.tags.map(t => t.id);
  const candidateCity = candidate.city?.trim();
  const nearbyOfCandidate = candidateCity ? (NEARBY_CITIES[candidateCity] || []) : [];
  
  return jobs
    .map(job => {
      let score = 0;
      const reasons: string[] = [];
      const jobLocation = job.location || '';
      const jobTitle = (job.title || '').toLowerCase();
      const jobDesc = (job.description || '').toLowerCase();
      
      // ===== 1. התאמת מיקום (עדיפות עליונה) =====
      // עיר מדויקת - 50 נקודות
      if (candidateCity && jobLocation.includes(candidateCity)) {
        score += 50;
        reasons.push(`📍 עיר מגורים: ${candidateCity}`);
      }
      // עיר קרובה - 25 נקודות
      else if (candidateCity && nearbyOfCandidate.some(city => jobLocation.includes(city))) {
        score += 25;
        const nearCity = nearbyOfCandidate.find(city => jobLocation.includes(city));
        reasons.push(`📍 עיר קרובה: ${nearCity}`);
      }
      
      // ===== 2. התאמת מקצוע (עדיפות גבוהה) =====
      // רכב/אוטומוטיב - עדיפות עליונה! 60 נקודות
      if (tagIds.includes('automotive') && (
        jobTitle.includes('רכב') || jobTitle.includes('לקסוס') || jobTitle.includes('lexus') ||
        jobTitle.includes('טויוטה') || jobTitle.includes('toyota') || jobTitle.includes('geely') || jobTitle.includes('ג\'ילי') ||
        jobTitle.includes('סלקט') || jobTitle.includes('יד 2') || jobTitle.includes('יד שניה') || jobTitle.includes('אולם') ||
        jobTitle.includes('showroom') || jobTitle.includes('טרייד') || jobTitle.includes('מגרש') ||
        jobDesc.includes('רכב') || jobDesc.includes('לקסוס') || jobDesc.includes('טויוטה') ||
        job.category?.includes('UNION') || job.category?.includes('union')
      )) {
        score += 60;
        reasons.push('🚗 ניסיון מכירת רכב!');
      }
      // בנקאות
      if (tagIds.includes('banking') && (job.category === 'בנק מזרחי' || jobTitle.includes('בנק') || jobTitle.includes('טלר') || jobTitle.includes('בנקאי'))) {
        score += 50;
        reasons.push('🏦 ניסיון בנקאי');
      }
      // YES - מוקדים ושירות
      if (tagIds.includes('service') && job.category === 'YES') {
        score += 45;
        reasons.push('📺 מתאים ל-YES');
      }
      // לוגיסטיקה/מחסן - התאמה לכל חברות הלוגיסטיקה
      if (tagIds.includes('logistics') && (
        jobTitle.includes('מחסן') || jobTitle.includes('מלקט') || jobTitle.includes('לוגיסטי') ||
        jobTitle.includes('הפצה') || jobTitle.includes('קליטה') || jobTitle.includes('בקר') ||
        job.category?.includes('לוגיסטי') || job.category?.includes('סלע') || job.category?.includes('א.ד.ר')
      )) {
        score += 45;
        reasons.push('📦 ניסיון לוגיסטיקה');
      }
      // מלגזה
      if (tagIds.includes('forklift') && (jobTitle.includes('מלגז') || jobTitle.includes('היגש'))) {
        score += 55;
        reasons.push('🚜 רישיון מלגזה');
      }
      // נהגים - לפי סוג רישיון
      // נהג C - 15 טון ומעלה
      if (tagIds.includes('driver_c') && (
        jobTitle.includes('15 טון') || jobTitle.includes('נהג ג\'') || jobTitle.includes('משאית גדולה')
      )) {
        score += 55;
        reasons.push('🚛 רישיון C - משאית גדולה');
      }
      // נהג C1 - עד 12 טון
      if (tagIds.includes('driver_c1') && (
        jobTitle.includes('12 טון') || jobTitle.includes('נהג ג1') || jobTitle.includes('C1') ||
        jobTitle.includes('4 טון') || jobTitle.includes('משאית קטנה')
      )) {
        score += 50;
        reasons.push('🚚 רישיון C1 - משאית בינונית');
      }
      // נהג B - רגיל
      if ((tagIds.includes('driver_b') || tagIds.includes('driver')) && (
        jobTitle.includes('נהג ב\'') || jobTitle.includes('נהג חלוקה') || jobTitle.includes('רישיון B') ||
        jobTitle.includes('3.5 טון') || jobTitle.includes('טרנזיט') || jobTitle.includes('דוקאטו')
      )) {
        score += 45;
        reasons.push('🚗 רישיון B - נהג חלוקה');
      }
      // נהג כללי
      if (tagIds.includes('driver') && jobTitle.includes('נהג') && !reasons.some(r => r.includes('רישיון'))) {
        score += 40;
        reasons.push('🚗 רישיון נהיגה');
      }
      // שירות לקוחות
      if (tagIds.includes('service') && (jobTitle.includes('שירות') || jobTitle.includes('מוקד') || jobTitle.includes('נציג'))) {
        score += 40;
        reasons.push('📞 ניסיון שירות');
      }
      // מכירות (כללי - לא רכב)
      if (tagIds.includes('sales') && !tagIds.includes('automotive') && (
        jobTitle.includes('מכיר') || jobTitle.includes('סוכן') || jobTitle.includes('טלסל')
      )) {
        score += 35;
        reasons.push('💰 ניסיון מכירות');
      }
      // קבלה/אדמיניסטרציה - גם ל-UNION
      if (tagIds.includes('admin') && (
        jobTitle.includes('קבלה') || jobTitle.includes('דייל') || jobTitle.includes('פקיד') ||
        jobTitle.includes('נציג קבלה') || jobTitle.includes('נציגת קבלה')
      )) {
        score += 40;
        reasons.push('🎀 ניסיון קבלה');
      }
      // יבוא/יצוא - אושפיר
      if (tagIds.includes('import_export') && (
        jobTitle.includes('יבוא') || jobTitle.includes('יצוא') || jobTitle.includes('שילוח') ||
        job.category?.includes('שילוח בינלאומי')
      )) {
        score += 50;
        reasons.push('🚢 ניסיון יבוא/יצוא');
      }
      // ניהול
      if (tagIds.includes('management') && (
        jobTitle.includes('מנהל') || jobTitle.includes('אחראי') || jobTitle.includes('ראש צוות') ||
        jobTitle.includes('אחמ"ש') || jobTitle.includes('סופרוויזר')
      )) {
        score += 35;
        reasons.push('👔 ניסיון ניהולי');
      }
      // אחזקה
      if (tagIds.includes('maintenance') && (
        jobTitle.includes('אחזקה') || jobTitle.includes('תחזוקה') || jobTitle.includes('טכנאי')
      )) {
        score += 45;
        reasons.push('🔧 ניסיון אחזקה');
      }
      // קמעונאות
      if (tagIds.includes('retail') && (
        jobTitle.includes('חנות') || jobTitle.includes('קמעונ') || jobTitle.includes('מכירה פרונטלית')
      )) {
        score += 35;
        reasons.push('🛒 ניסיון קמעונאות');
      }
      // הייטק / WMS
      if (tagIds.includes('tech') && (
        jobTitle.includes('WMS') || jobTitle.includes('מפעיל מערכת') || jobTitle.includes('מערכות')
      )) {
        score += 40;
        reasons.push('💻 ניסיון טכני');
      }
      
      // ===== 3. בונוסים על ניסיון ותואר =====
      if (tagIds.includes('degree')) { 
        score += 15; 
        reasons.push('🎓 תואר אקדמי'); 
      }
      if (candidate.yearsOfExperience >= 5) { 
        score += 20; 
        reasons.push(`⭐ ${candidate.yearsOfExperience} שנות ניסיון - מנוסה מאוד!`); 
      } else if (candidate.yearsOfExperience >= 3) { 
        score += 12; 
        reasons.push(`⏰ ${candidate.yearsOfExperience} שנות ניסיון`); 
      } else if (candidate.yearsOfExperience >= 1) {
        score += 5;
        reasons.push(`⏰ ${candidate.yearsOfExperience} שנות ניסיון`);
      }
      if (tagIds.includes('student') && (jobTitle.includes('סטודנט') || jobDesc.includes('סטודנט') || job.salary?.includes('50%'))) {
        score += 15; 
        reasons.push('📚 מתאים לסטודנטים');
      }
      
      // ===== 4. בונוס על התאמה מרובה =====
      // אם יש יותר מ-2 תגיות שמתאימות למשרה
      const matchingTagCount = reasons.filter(r => !r.includes('📍') && !r.includes('⏰') && !r.includes('🎓')).length;
      if (matchingTagCount >= 2) {
        score += 10;
        reasons.push('🔥 התאמה מרובה!');
      }
      
      // ===== 5. דחיפות =====
      if (job.status === 'urgent') {
        score += 5;
        reasons.push('🚨 משרה דחופה!');
      }
      
      return { job, score: Math.min(score, 100), reasons };
    })
    // סינון: רק משרות עם התאמה של לפחות 35 נקודות
    .filter(m => m.score >= 35)
    .sort((a, b) => b.score - a.score);
}

// ==================== MAIN COMPONENT ====================
export default function RecruitmentBoard() {
  const [tab, setTab] = useState<'ai' | 'jobs' | 'employers' | 'info'>('ai');
  const [region, setRegion] = useState('all');
  const [search, setSearch] = useState('');
  const [cvText, setCvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState<DashboardStats>({ totalCandidates: 0, totalPositions: 0, activePositions: 0, totalApplications: 0 });
  
  // Employers & Custom Jobs
  const [employers, setEmployers] = useState<Employer[]>(DEFAULT_EMPLOYERS);
  const [customJobs, setCustomJobs] = useState<CustomJob[]>([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddEmployer, setShowAddEmployer] = useState(false);
  
  // New Job Form
  const [newJob, setNewJob] = useState({ title: '', location: '', employerId: '', salary: '', requirements: '', notes: '' });
  // New Employer Form
  const [newEmployer, setNewEmployer] = useState({ name: '', email: '', phone: '', company: '', notes: '' });

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalCandidates: data.totalCandidates || 0,
          totalPositions: data.totalPositions || 0,
          activePositions: data.activePositions || 0,
          totalApplications: data.totalApplications || 0,
        });
      }
    } catch (e) {
      console.log('Could not fetch stats');
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const regions = [
    { id: 'all', name: 'הכל' },
    { id: 'JB-107', name: 'מרכז' },
    { id: 'JB-110', name: 'דן' },
    { id: 'JB-108', name: 'שרון' },
    { id: 'JB-109', name: 'יהודה' },
    { id: 'JB-111', name: 'דרום' },
    { id: 'JB-113', name: 'צפון' },
  ];

  const filteredJobs = useMemo(() => {
    let jobs = allJobs;
    if (region !== 'all') jobs = jobs.filter(j => j.jobCode === region);
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));
    }
    return jobs;
  }, [region, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveToCRM = async (c: CandidateDetails) => {
    if (!c.name) return;
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: c.name, email: c.email || null, phone: c.phone || null,
          city: c.city || null, skills: c.tags.map(t => t.label).join(', '),
          notes: `תגיות: ${c.tags.map(t => t.label).join(', ')}`, source: 'AI-Agent',
        }),
      });
      if (res.ok) { 
        setSaved(true); 
        showToast(`✓ ${c.name} נשמר במערכת`);
        // Refresh stats after saving
        await fetchStats();
      }
    } catch { showToast('שגיאה בשמירה'); }
  };

  const analyze = async () => {
    if (!cvText.trim()) { showToast('יש להדביק קורות חיים'); return; }
    setLoading(true);
    setSaved(false);
    
    try {
      // נסה עם API החדש (כולל Gemini אם מוגדר)
      const apiRes = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText }),
      });
      
      let c: CandidateDetails;
      
      if (apiRes.ok) {
        const aiData = await apiRes.json();
        // בנה אובייקט מועמד מהתוצאות
        c = {
          name: aiData.name || '',
          phone: aiData.phone || '',
          email: aiData.email || '',
          city: aiData.city || '',
          yearsOfExperience: aiData.yearsOfExperience || 0,
          tags: (aiData.tags || []).map((tagId: string) => TAGS.find(t => t.id === tagId)).filter(Boolean) as CandidateTag[],
        };
        
        // אם ה-AI מצא מקצועות נוספים - הוסף תגיות
        if (aiData.professions) {
          for (const prof of aiData.professions) {
            const profLower = prof.toLowerCase();
            if (profLower.includes('מחסן') || profLower.includes('לוגיסטיקה')) {
              const logTag = TAGS.find(t => t.id === 'logistics');
              if (logTag && !c.tags.find(t => t.id === 'logistics')) c.tags.push(logTag);
            }
            if (profLower.includes('מכירות') || profLower.includes('מוכר')) {
              const salesTag = TAGS.find(t => t.id === 'sales');
              if (salesTag && !c.tags.find(t => t.id === 'sales')) c.tags.push(salesTag);
            }
            if (profLower.includes('שירות')) {
              const serviceTag = TAGS.find(t => t.id === 'service');
              if (serviceTag && !c.tags.find(t => t.id === 'service')) c.tags.push(serviceTag);
            }
          }
        }
        
        if (aiData.aiPowered) {
          showToast('✨ ניתוח AI הושלם בהצלחה!');
        }
      } else {
        // Fallback - ניתוח מקומי
        c = analyzeCV(cvText);
      }
      
      setCandidate(c);
      setMatches(matchJobs(c, allJobs));
      
      if (c.name) await saveToCRM(c);
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback - ניתוח מקומי
      const c = analyzeCV(cvText);
      setCandidate(c);
      setMatches(matchJobs(c, allJobs));
      if (c.name) await saveToCRM(c);
    }
    
    setLoading(false);
  };

  const clear = () => {
    setCvText('');
    setCandidate(null);
    setMatches([]);
    setSaved(false);
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl text-lg font-medium">
          {toast}
        </div>
      )}

      {/* Header - Full Width */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="w-full px-10 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white text-4xl font-black">22</span>
              </div>
              <div>
                <h1 className="text-5xl font-black text-slate-900">Twenty2Jobs</h1>
                <p className="text-slate-500 text-xl mt-1">מערכת גיוס חכמה</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-8">
              <div className="bg-blue-50 px-10 py-5 rounded-2xl text-center min-w-[160px]">
                <div className="text-5xl font-black text-blue-600">{stats.totalCandidates}</div>
                <div className="text-slate-600 text-lg font-medium">מועמדים</div>
              </div>
              <div className="bg-green-50 px-10 py-5 rounded-2xl text-center min-w-[160px]">
                <div className="text-5xl font-black text-green-600">{allJobs.length}</div>
                <div className="text-slate-600 text-lg font-medium">משרות פעילות</div>
              </div>
              <div className="bg-purple-50 px-10 py-5 rounded-2xl text-center min-w-[160px]">
                <div className="text-5xl font-black text-purple-600">{stats.totalApplications}</div>
                <div className="text-slate-600 text-lg font-medium">מועמדויות</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-5">
            {[
              { id: 'ai', label: '🤖 סוכן AI' },
              { id: 'jobs', label: '💼 משרות' },
              { id: 'employers', label: '🏢 מעסיקים' },
              { id: 'info', label: '📋 דרישות ושכר' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-12 py-6 rounded-2xl font-bold text-2xl transition-all ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Full Width */}
      <div className="w-full px-10 py-12">
        
        {/* ========== AI TAB ========== */}
        {tab === 'ai' && (
          <div className="flex gap-12">
            
            {/* Input Panel - Fixed Width */}
            <div className="w-[600px] flex-shrink-0">
              <div className="bg-white rounded-3xl shadow-xl p-10 sticky top-[220px]">
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 mb-3">📄 הדבק קורות חיים</h2>
                  <p className="text-slate-500 text-xl">העתק את תוכן קורות החיים והדבק בתיבה למטה</p>
                </div>

                <textarea
                  value={cvText}
                  onChange={e => setCvText(e.target.value)}
                  placeholder={`הדבק כאן את קורות החיים...

דוגמה:

יוסי כהן
054-1234567
yossi@email.com
תל אביב

ניסיון:
- נציג שירות לקוחות בחברת ביטוח - 3 שנים
- איש מכירות - שנה

השכלה:
- תואר ראשון בכלכלה`}
                  className="w-full h-[450px] p-8 border-2 border-slate-200 rounded-2xl text-xl leading-relaxed resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />

                <div className="flex gap-5 mt-8">
                  <button
                    onClick={analyze}
                    disabled={loading || !cvText.trim()}
                    className="flex-1 py-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 transition-all"
                  >
                    {loading ? '⏳ מנתח...' : '🔍 נתח ומצא משרות'}
                  </button>
                  {cvText && (
                    <button onClick={clear} className="px-10 py-7 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xl hover:bg-slate-200 transition-all">
                      נקה
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Panel - Flexible Width */}
            <div className="flex-1 space-y-10 min-w-0">
              
              {/* Candidate Info */}
              {candidate ? (
                <div className="bg-white rounded-3xl shadow-xl p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-slate-900">👤 פרטי המועמד</h2>
                    <div className="flex items-center gap-4">
                      {saved && (
                        <span className="bg-green-100 text-green-700 px-6 py-3 rounded-xl font-bold text-lg">
                          ✓ נשמר ב-CRM
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10">
                    {[
                      { label: 'שם מלא', value: candidate.name, icon: '👤' },
                      { label: 'טלפון', value: candidate.phone, icon: '📱' },
                      { label: 'אימייל', value: candidate.email, icon: '📧' },
                      { label: 'עיר מגורים', value: candidate.city, icon: '📍' },
                    ].map(f => (
                      <div key={f.label} className="bg-slate-50 rounded-2xl p-8">
                        <div className="text-slate-500 text-lg mb-2">{f.icon} {f.label}</div>
                        <div className="text-3xl font-bold text-slate-900">{f.value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions - WhatsApp & Email */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-10">
                    <h3 className="text-xl font-bold text-slate-700 mb-5">📲 פעולות מהירות</h3>
                    <div className="flex flex-wrap gap-4">
                      {candidate.phone && (
                        <a
                          href={getWhatsAppLink(candidate.phone, `שלום ${candidate.name}, קיבלתי את קורות החיים שלך ואשמח לדבר איתך על משרות מתאימות.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
                        >
                          <span className="text-2xl">💬</span> וואטסאפ למועמד
                        </a>
                      )}
                      {candidate.email && (
                        <a
                          href={getEmailLink(candidate.email, `בנוגע לקורות החיים שלך`, `שלום ${candidate.name},\n\nקיבלתי את קורות החיים שלך ואשמח לדבר איתך על הזדמנויות תעסוקה.\n\nבברכה,\nטוונטי טו ג'ובס`)}
                          className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
                        >
                          <span className="text-2xl">📧</span> שלח מייל למועמד
                        </a>
                      )}
                      {employers.length > 0 && candidate.email && (
                        <a
                          href={getEmailLink(employers[0].email, `מועמד חדש: ${candidate.name}`, `שלום ${employers[0].name},\n\nרציתי להציג בפניך מועמד מתאים:\n\nשם: ${candidate.name}\nטלפון: ${candidate.phone || 'לא צוין'}\nאימייל: ${candidate.email || 'לא צוין'}\nעיר: ${candidate.city || 'לא צוינה'}\nתגיות: ${candidate.tags.map(t => t.label).join(', ')}\n\nבברכה,\nטוונטי טו ג'ובס`)}
                          className="flex items-center gap-3 bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
                        >
                          <span className="text-2xl">📤</span> שלח למעסיק
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">📝 הערות</h3>
                    <textarea
                      value={candidateNotes}
                      onChange={e => setCandidateNotes(e.target.value)}
                      placeholder="הוסף הערות על המועמד..."
                      className="w-full h-32 p-5 border-2 border-slate-200 rounded-xl text-lg resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {candidate.tags.length > 0 && (
                    <div>
                      <div className="text-slate-500 mb-5 text-lg font-medium">תגיות מקצועיות:</div>
                      <div className="flex flex-wrap gap-4">
                        {candidate.tags.map(tag => (
                          <span
                            key={tag.id}
                            style={{ backgroundColor: tag.color }}
                            className="text-white px-7 py-4 rounded-full font-bold text-xl shadow-lg"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl p-20 text-center">
                  <div className="text-9xl mb-10">📋</div>
                  <h3 className="text-4xl font-black text-slate-900 mb-5">הדבק קורות חיים לניתוח</h3>
                  <p className="text-slate-500 text-2xl">המערכת תזהה אוטומטית את הפרטים ותמצא משרות מתאימות</p>
                </div>
              )}

              {/* BIG WhatsApp Button - After Scanning */}
              {candidate && candidate.phone && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-2xl p-8">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <h3 className="text-3xl font-black mb-2">📱 צור קשר עם {candidate.name}</h3>
                      <p className="text-green-100 text-xl">{candidate.phone}</p>
                    </div>
                    <a
                      href={getWhatsAppLink(candidate.phone, `שלום ${candidate.name}! 👋\n\nקיבלתי את קורות החיים שלך ויש לי כמה משרות שיכולות להתאים לך${candidate.city ? ` באזור ${candidate.city}` : ''}.\n\nאשמח לדבר איתך ולספר עוד.\n\nטוונטי טו ג'ובס 🎯`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 bg-white hover:bg-green-50 text-green-600 px-12 py-6 rounded-2xl font-black text-2xl transition-all shadow-xl hover:scale-105"
                    >
                      <span className="text-4xl">💬</span>
                      פתח וואטסאפ
                    </a>
                  </div>
                </div>
              )}

              {/* AI SMART SUMMARY - סיכום חכם */}
              {candidate && matches.length > 0 && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl shadow-2xl p-8 text-white">
                  <h3 className="text-2xl font-black mb-4">🧠 סיכום AI חכם</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white/10 rounded-2xl p-5 text-center">
                      <div className="text-4xl font-black">{candidate.tags.length}</div>
                      <div className="text-purple-200">תגיות מקצועיות</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-5 text-center">
                      <div className="text-4xl font-black">{matches.length}</div>
                      <div className="text-purple-200">משרות מתאימות</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-5 text-center">
                      <div className="text-4xl font-black">{matches[0]?.score || 0}%</div>
                      <div className="text-purple-200">התאמה מקסימלית</div>
                    </div>
                  </div>
                  <div className="mt-6 text-purple-100 text-lg">
                    {candidate.tags.some(t => t.id === 'automotive') && '🚗 המועמד מתאים במיוחד לתחום הרכב! '}
                    {candidate.tags.some(t => t.id === 'banking') && '🏦 רקע בנקאי מזוהה! '}
                    {candidate.tags.some(t => t.id === 'logistics') && '📦 ניסיון לוגיסטי מזוהה! '}
                    {candidate.tags.some(t => t.id === 'service') && '📞 רקע בשירות לקוחות! '}
                    {candidate.yearsOfExperience >= 5 && `⭐ ${candidate.yearsOfExperience} שנות ניסיון - מועמד בכיר! `}
                  </div>
                </div>
              )}

              {/* Matches - עד 15 משרות */}
              {matches.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-slate-900">
                      🎯 {matches.length >= 15 ? '15 המשרות המתאימות ביותר' : `משרות מתאימות (${matches.length})`}
                    </h2>
                    {candidate?.city && (
                      <span className="bg-blue-100 text-blue-700 px-6 py-3 rounded-xl font-bold text-lg">
                        📍 לפי מגורים: {candidate.city}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {matches.slice(0, 15).map((m, i) => (
                      <div
                        key={m.job.id}
                        className={`p-8 rounded-2xl border-3 transition-all hover:shadow-lg ${
                          i === 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 ring-4 ring-green-100' :
                          i < 3 && m.score >= 70 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400' :
                          m.score >= 60 ? 'bg-green-50 border-green-300' :
                          m.score >= 50 ? 'bg-blue-50 border-blue-300' :
                          'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              {i === 0 && (
                                <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg px-6 py-2 rounded-full font-bold shadow-lg animate-pulse">
                                  🏆 הכי מתאים!
                                </span>
                              )}
                              {i === 1 && m.score >= 60 && (
                                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg px-5 py-2 rounded-full font-bold">
                                  🥈 מקום שני
                                </span>
                              )}
                              {i === 2 && m.score >= 50 && (
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg px-5 py-2 rounded-full font-bold">
                                  🥉 מקום שלישי
                                </span>
                              )}
                              {i > 2 && i < 5 && m.score >= 50 && (
                                <span className="bg-blue-600 text-white text-lg px-5 py-2 rounded-full font-bold">
                                  ⭐ מומלץ
                                </span>
                              )}
                              <h3 className="text-2xl font-bold text-slate-900">{m.job.title}</h3>
                            </div>
                            <div className="text-slate-600 mb-4 text-xl">
                              📍 {m.job.location} 
                              {m.job.salary && <span className="text-green-600 mr-3">• {m.job.salary}</span>}
                            </div>
                            {m.job.description && (
                              <p className="text-slate-500 mb-4 text-lg">{m.job.description.slice(0, 150)}...</p>
                            )}
                            <div className="flex flex-wrap gap-3">
                              {m.reasons.map((r, j) => (
                                <span key={j} className="bg-white border-2 border-green-200 px-5 py-3 rounded-xl text-lg text-green-700 font-medium">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={`text-center px-8 py-6 rounded-2xl text-white min-w-[130px] shadow-xl ${
                            i === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                            m.score >= 60 ? 'bg-green-600' : m.score >= 40 ? 'bg-blue-600' : 'bg-slate-500'
                          }`}>
                            <div className="text-5xl font-black">{m.score}%</div>
                            <div className="text-lg opacity-80">התאמה</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {matches.length > 15 && (
                    <div className="mt-8 text-center bg-blue-50 rounded-2xl p-6">
                      <p className="text-blue-700 text-xl font-bold">📋 יש עוד {matches.length - 15} משרות מתאימות במערכת!</p>
                      <p className="text-blue-500 text-lg mt-2">עבור ללשונית "משרות" לראות את כל המשרות</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== JOBS TAB ========== */}
        {tab === 'jobs' && (
          <div className="space-y-10">
            {/* Add Job Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">💼 ניהול משרות</h2>
              <button
                onClick={() => setShowAddJob(!showAddJob)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg"
              >
                ➕ הוסף משרה חדשה
              </button>
            </div>

            {/* Add Job Form */}
            {showAddJob && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-xl p-10 border-2 border-green-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">➕ משרה חדשה</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">שם המשרה *</label>
                    <input
                      type="text"
                      value={newJob.title}
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                      placeholder="לדוגמה: טלרן/ית"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">מיקום *</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={e => setNewJob({...newJob, location: e.target.value})}
                      placeholder="לדוגמה: תל אביב"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">מעסיק *</label>
                    <select
                      value={newJob.employerId}
                      onChange={e => setNewJob({...newJob, employerId: e.target.value})}
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-green-500"
                    >
                      <option value="">בחר מעסיק</option>
                      {employers.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} - {emp.company}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">שכר</label>
                    <input
                      type="text"
                      value={newJob.salary}
                      onChange={e => setNewJob({...newJob, salary: e.target.value})}
                      placeholder="לדוגמה: 8,000-10,000 ₪"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-slate-700 font-medium mb-2">דרישות</label>
                  <textarea
                    value={newJob.requirements}
                    onChange={e => setNewJob({...newJob, requirements: e.target.value})}
                    placeholder="פרט את דרישות המשרה..."
                    className="w-full h-24 px-5 py-4 border-2 border-slate-200 rounded-xl text-lg resize-none focus:border-green-500"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-slate-700 font-medium mb-2">הערות</label>
                  <textarea
                    value={newJob.notes}
                    onChange={e => setNewJob({...newJob, notes: e.target.value})}
                    placeholder="הערות נוספות..."
                    className="w-full h-20 px-5 py-4 border-2 border-slate-200 rounded-xl text-lg resize-none focus:border-green-500"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (!newJob.title || !newJob.location || !newJob.employerId) {
                        showToast('נא למלא את כל השדות הנדרשים');
                        return;
                      }
                      const employer = employers.find(e => e.id === newJob.employerId);
                      if (!employer) return;
                      const job: CustomJob = {
                        id: Date.now().toString(),
                        title: newJob.title,
                        location: newJob.location,
                        employer,
                        salary: newJob.salary,
                        requirements: newJob.requirements,
                        notes: newJob.notes,
                        createdAt: new Date()
                      };
                      setCustomJobs([job, ...customJobs]);
                      setNewJob({ title: '', location: '', employerId: '', salary: '', requirements: '', notes: '' });
                      setShowAddJob(false);
                      showToast(`✓ המשרה "${job.title}" נוספה בהצלחה`);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl font-bold text-lg"
                  >
                    💾 שמור משרה
                  </button>
                  <button
                    onClick={() => setShowAddJob(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Custom Jobs */}
            {customJobs.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-slate-700 mb-6">📌 משרות שהוספת ({customJobs.length})</h3>
                <div className="grid grid-cols-3 gap-8 mb-10">
                  {customJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200 hover:shadow-2xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-full font-bold">חדש</span>
                        <button
                          onClick={() => setCustomJobs(customJobs.filter(j => j.id !== job.id))}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          🗑️
                        </button>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">{job.title}</h3>
                      <p className="text-slate-600 mb-2">🏢 {job.employer.company}</p>
                      <p className="text-slate-500 mb-4">👤 {job.employer.name}</p>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="bg-slate-100 px-4 py-2 rounded-lg text-slate-700">📍 {job.location}</span>
                        {job.salary && <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">💰 {job.salary}</span>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <a
                          href={getWhatsAppLink(job.employer.phone, `שלום ${job.employer.name}, בקשר למשרה "${job.title}"`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-500 text-white text-center py-3 rounded-lg font-bold hover:bg-green-600"
                        >
                          💬 וואטסאפ
                        </a>
                        <a
                          href={getEmailLink(job.employer.email, `בנוגע למשרה: ${job.title}`)}
                          className="flex-1 bg-blue-500 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-600"
                        >
                          📧 מייל
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Filter */}
            <div className="bg-white rounded-3xl shadow-xl p-10">
              <div className="flex items-center gap-8">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 חיפוש לפי תפקיד או מיקום..."
                  className="flex-1 px-8 py-6 border-2 border-slate-200 rounded-2xl text-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <div className="flex gap-3">
                  {regions.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRegion(r.id)}
                      className={`px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                        region === r.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-slate-600 font-bold text-xl">נמצאו {filteredJobs.length} משרות קיימות</div>

            <div className="grid grid-cols-3 gap-8">
              {filteredJobs.map(job => (
                <div key={job.id} className={`bg-white rounded-2xl shadow-xl p-8 border-2 transition-all hover:shadow-2xl ${
                  job.status === 'urgent' ? 'border-red-300 bg-red-50' : 'border-transparent'
                }`}>
                  {job.status === 'urgent' && (
                    <span className="inline-block bg-red-600 text-white text-lg px-5 py-2 rounded-full font-bold mb-4">
                      🔥 דחוף
                    </span>
                  )}
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{job.title}</h3>
                  <p className="text-slate-500 text-lg mb-4">{job.client}</p>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <span className="bg-slate-100 px-5 py-3 rounded-xl text-slate-700 text-lg">📍 {job.location}</span>
                    {job.jobCode && <span className="bg-blue-100 text-blue-700 px-5 py-3 rounded-xl text-lg">{job.jobCode}</span>}
                    {job.branchType && (
                      <span className={`px-5 py-3 rounded-xl text-lg ${job.branchType === 'continuous' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {job.branchType === 'continuous' ? 'רצוף' : 'מפוצל'}
                      </span>
                    )}
                  </div>
                  {job.salaryDetails?.monthly && (
                    <div className="bg-green-50 border-2 border-green-200 p-5 rounded-xl">
                      <span className="font-bold text-green-700 text-xl">💰 {job.salaryDetails.monthly}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== EMPLOYERS TAB ========== */}
        {tab === 'employers' && (
          <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">🏢 ניהול מעסיקים</h2>
              <button
                onClick={() => setShowAddEmployer(!showAddEmployer)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg"
              >
                ➕ הוסף מעסיק חדש
              </button>
            </div>

            {/* Add Employer Form */}
            {showAddEmployer && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl shadow-xl p-10 border-2 border-purple-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">➕ מעסיק חדש</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">שם איש קשר *</label>
                    <input
                      type="text"
                      value={newEmployer.name}
                      onChange={e => setNewEmployer({...newEmployer, name: e.target.value})}
                      placeholder="לדוגמה: ישראל ישראלי"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">שם החברה *</label>
                    <input
                      type="text"
                      value={newEmployer.company}
                      onChange={e => setNewEmployer({...newEmployer, company: e.target.value})}
                      placeholder="לדוגמה: חברת ABC"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">אימייל *</label>
                    <input
                      type="email"
                      value={newEmployer.email}
                      onChange={e => setNewEmployer({...newEmployer, email: e.target.value})}
                      placeholder="example@company.com"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">טלפון *</label>
                    <input
                      type="tel"
                      value={newEmployer.phone}
                      onChange={e => setNewEmployer({...newEmployer, phone: e.target.value})}
                      placeholder="050-1234567"
                      className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-slate-700 font-medium mb-2">הערות</label>
                  <textarea
                    value={newEmployer.notes}
                    onChange={e => setNewEmployer({...newEmployer, notes: e.target.value})}
                    placeholder="הערות על המעסיק..."
                    className="w-full h-20 px-5 py-4 border-2 border-slate-200 rounded-xl text-lg resize-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (!newEmployer.name || !newEmployer.company || !newEmployer.email || !newEmployer.phone) {
                        showToast('נא למלא את כל השדות הנדרשים');
                        return;
                      }
                      const employer: Employer = {
                        id: Date.now().toString(),
                        ...newEmployer
                      };
                      setEmployers([employer, ...employers]);
                      setNewEmployer({ name: '', email: '', phone: '', company: '', notes: '' });
                      setShowAddEmployer(false);
                      showToast(`✓ המעסיק "${employer.company}" נוסף בהצלחה`);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-xl font-bold text-lg"
                  >
                    💾 שמור מעסיק
                  </button>
                  <button
                    onClick={() => setShowAddEmployer(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Employers List */}
            <div className="grid grid-cols-3 gap-8">
              {employers.map(emp => (
                <div key={emp.id} className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-purple-200 transition-all hover:shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {emp.company.charAt(0)}
                    </div>
                    {emp.id !== 'mizrahi' && (
                      <button
                        onClick={() => setEmployers(employers.filter(e => e.id !== emp.id))}
                        className="text-red-500 hover:text-red-700 text-xl"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{emp.company}</h3>
                  <p className="text-slate-600 text-lg mb-4">👤 {emp.name}</p>
                  <div className="space-y-2 mb-6">
                    <p className="text-slate-500">📧 {emp.email}</p>
                    <p className="text-slate-500">📱 {emp.phone}</p>
                  </div>
                  {emp.notes && (
                    <p className="text-slate-400 text-sm mb-4 bg-slate-50 p-3 rounded-lg">{emp.notes}</p>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={getWhatsAppLink(emp.phone, `שלום ${emp.name}, `)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-green-500 text-white text-center py-3 rounded-xl font-bold hover:bg-green-600 transition-all"
                    >
                      💬 וואטסאפ
                    </a>
                    <a
                      href={getEmailLink(emp.email)}
                      className="flex-1 bg-blue-500 text-white text-center py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
                    >
                      📧 מייל
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {employers.length === 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-20 text-center">
                <div className="text-9xl mb-10">🏢</div>
                <h3 className="text-4xl font-black text-slate-900 mb-5">אין מעסיקים עדיין</h3>
                <p className="text-slate-500 text-2xl">הוסף מעסיק חדש כדי להתחיל</p>
              </div>
            )}
          </div>
        )}

        {/* ========== INFO TAB ========== */}
        {tab === 'info' && (
          <div className="space-y-10">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-10">
              <h2 className="text-3xl font-black text-amber-800 mb-8">⚠️ דגשים חשובים</h2>
              <div className="grid grid-cols-2 gap-6">
                {IMPORTANT_NOTES.map((note, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl flex items-start gap-4">
                    <span className="text-amber-600 text-2xl">✓</span>
                    <span className="text-slate-700 text-lg">{note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-10">
              <h2 className="text-3xl font-black text-slate-900 mb-8">{BANKING_GENERAL_REQUIREMENTS.teller.title}</h2>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h3 className="font-bold text-slate-700 mb-6 text-xl">דרישות:</h3>
                  <div className="space-y-4">
                    {BANKING_GENERAL_REQUIREMENTS.teller.requirements.map((r, i) => (
                      <div key={i} className="bg-slate-50 p-5 rounded-xl flex items-center gap-4">
                        <span className="text-blue-600 text-xl">✓</span> <span className="text-lg">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 mb-6 text-xl">שכר:</h3>
                  <div className="space-y-6">
                    <div className="bg-green-50 border-2 border-green-200 p-8 rounded-2xl">
                      <div className="text-slate-600 mb-2 text-lg">סניף רצוף</div>
                      <div className="text-4xl font-black text-green-700">{BANKING_GENERAL_REQUIREMENTS.teller.salary.continuous.monthly}</div>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-200 p-8 rounded-2xl">
                      <div className="text-slate-600 mb-2 text-lg">סניף מפוצל</div>
                      <div className="text-4xl font-black text-purple-700">{BANKING_GENERAL_REQUIREMENTS.teller.salary.split.monthly}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-10">
              <h2 className="text-3xl font-black text-slate-900 mb-8">{BANKING_GENERAL_REQUIREMENTS.banker.title}</h2>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h3 className="font-bold text-slate-700 mb-6 text-xl">דרישות:</h3>
                  <div className="space-y-4">
                    {BANKING_GENERAL_REQUIREMENTS.banker.requirements.map((r, i) => (
                      <div key={i} className="bg-slate-50 p-5 rounded-xl flex items-center gap-4">
                        <span className="text-blue-600 text-xl">✓</span> <span className="text-lg">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 mb-6 text-xl">שכר:</h3>
                  <div className="space-y-6">
                    <div className="bg-green-50 border-2 border-green-200 p-8 rounded-2xl">
                      <div className="text-slate-600 mb-2 text-lg">סניף רצוף</div>
                      <div className="text-4xl font-black text-green-700">{BANKING_GENERAL_REQUIREMENTS.banker.salary.continuous.monthly}</div>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-200 p-8 rounded-2xl">
                      <div className="text-slate-600 mb-2 text-lg">סניף מפוצל</div>
                      <div className="text-4xl font-black text-purple-700">{BANKING_GENERAL_REQUIREMENTS.banker.salary.split.monthly}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-10 text-white">
              <h2 className="text-3xl font-black mb-8">📧 פרטי שליחה</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white/10 p-8 rounded-2xl">
                  <div className="text-slate-400 mb-3 text-lg">קו"ח לסמדר:</div>
                  <div className="text-2xl font-mono text-blue-400">orpazsm@gmail.com</div>
                </div>
                <div className="bg-white/10 p-8 rounded-2xl">
                  <div className="text-slate-400 mb-3 text-lg">מערכת הגיוס:</div>
                  <div className="text-2xl font-mono text-blue-400">umtb-hr@cvwebmail.com</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
