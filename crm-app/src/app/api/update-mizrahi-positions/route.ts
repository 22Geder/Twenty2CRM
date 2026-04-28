import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// ========== שכר עדכני - אפריל 2026 ==========
const TELLER_SALARY_CONTINUOUS = { monthly: 8200, yearly: 9500, details: 'כולל 10 שעות נוספות בחודש ונסיעות. משרה מלאה בבנק = 169 שעות חודשיות' };
const TELLER_SALARY_SPLIT = { monthly: 9300, yearly: 10700, details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות. משרה מלאה בבנק = 169 שעות חודשיות' };
const BANKER_SALARY_CONTINUOUS = { monthly: 8400, yearly: 9800, details: 'כולל 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון' };
const BANKER_SALARY_SPLIT = { monthly: 9600, yearly: 10900, details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון' };
const LIVE_SALARY = { monthly: 9700, yearly: 11100, details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות' };

const TELLER_BONUS_REGULAR = `• 3,500 ₪ לאחר חצי שנה\n• 3,500 ₪ לאחר שנה\n• סה"כ: 7,000 ₪`;
const TELLER_BONUS_TLV = `• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n• סה"כ: 13,000 ₪ (מענק מוגדל לסניפי ת"א)`;

const TELLER_KEYWORDS = JSON.stringify(['טלר','טלרית','קופאי','קופאית','בנק','בנקאות','שירות לקוחות','קופה','מזומן','עבודה מול קהל','שירות','פקיד בנק','פקידה','תפעול בנקאי','דלפק','עמידה בלחץ','מספרים','דיוק','אחריות','עבודה בצוות','תקשורת בינאישית','סבלנות','שירותיות','מזרחי טפחות']);
const BANKER_KEYWORDS = JSON.stringify(['בנקאי','בנקאית','יועץ פיננסי','שירות לקוחות','בנק','בנקאות','מכירות','שיווק','ניהול לקוחות','פיננסים','כלכלה','מנהל עסקים','יעוץ','תואר אקדמי','תואר בכלכלה','מו"מ','משא ומתן','שימור לקוחות','תקשורת','יכולת מכירה','יכולות אנליטיות','מזרחי טפחות']);
const MORTGAGE_KEYWORDS = JSON.stringify(['משכנתא','משכנתאות','הלוואות','נדל"ן','מימון','בנקאי משכנתאות','יועץ משכנתאות','פיננסים','כלכלה','מו"מ','משא ומתן','אנליטי','סדר וארגון','ניהול תיקים','ליווי לקוחות','תואר פיננסי','תואר בכלכלה','מכירות','שירות','מחזור משכנתא','מזרחי טפחות']);
const BUSINESS_BANKER_KEYWORDS = JSON.stringify(['בנקאי עסקי','עסקים','SMB','עסקים קטנים ובינוניים','אשראי עסקי','ניתוח פיננסי','דוחות כספיים','מימון עסקי','ליווי עסקים','יעוץ עסקי','תזרים מזומנים','הלוואות עסקיות','ניהול סיכונים','יחסי לקוחות','B2B','מכירות','שירות לקוחות עסקיים','מזרחי טפחות']);
const LIVE_KEYWORDS = JSON.stringify(['בנקאי','בנקאית','שירות טלפוני','מוקד','דיגיטל','שירות לקוחות','מכירות','שיווק','עבודה במשמרות','בנקאות דיגיטלית','LIVE','תקשורת','שירותיות','יכולת מכירה','טכנולוגיה','מזרחי טפחות']);
const INTERNATIONAL_KEYWORDS = JSON.stringify(['בנקאי','בנקאית','צרפתית','אנגלית','בינלאומי','international','שירות לקוחות','בנק','בנקאות','שפות','פיננסים','כלכלה','תקשורת','יכולת מכירה','מזרחי טפחות']);

interface PositionData {
  title: string; location: string; region: string; regionCode: string;
  branchType: string; employmentType: string; additionalInfo: string | null;
  salary: { monthly: number; yearly: number; details: string };
  bonus: string | null; keywords: string; salaryRange: string;
  employmentTypeField: string; isUrgent?: boolean; extraRequirements?: string;
  openings?: number;
}

function buildDescription(pos: PositionData): string {
  let desc = `📍 ${pos.title}\n\n`;
  const employmentLabel: Record<string, string> = {
    'קבוע': '✅ תקן קבוע',
    'חל"ד': '🔄 החלפת חל"ד (ברוב המקרים ייקלטו בתקן קבוע)',
    'זמני': '⏳ תקן זמני'
  };
  desc += `${employmentLabel[pos.employmentType] || pos.employmentType}\n`;
  const branchLabels: Record<string, string> = {
    'רצוף': '🏢 סניף רצוף (ללא פיצולים)',
    'מפוצל': '🏢 סניף מפוצל',
    'מפוצל ב\'-ו\'': '🏢 סניף מפוצל ב\'-ו\'',
    'רצוף + תורנות שישי': '🏢 סניף רצוף + תורנות בימי שישי',
    'מפוצל + תורנות שישי': '🏢 סניף מפוצל + תורנות בימי שישי',
    'מעורב': '🏢 סניפים רצופים או מפוצלים לפי הצורך',
    'דיגיטלי': '💻 סניף וירטואלי/דיגיטלי'
  };
  if (branchLabels[pos.branchType]) desc += `${branchLabels[pos.branchType]}\n`;
  desc += `📌 מרחב: ${pos.region} (${pos.regionCode})\n📍 מיקום: ${pos.location}\n\n`;
  if (pos.isUrgent) desc += `🚨 דחוף! ${pos.additionalInfo || ''}\n\n`;
  else if (pos.additionalInfo) desc += `ℹ️ ${pos.additionalInfo}\n\n`;
  desc += `💰 שכר:\n• שכר חודשי: ${pos.salary.monthly.toLocaleString()} ₪\n• ממוצע שנתי: ${pos.salary.yearly.toLocaleString()} ₪\n• ${pos.salary.details}\n\n`;
  if (pos.bonus) desc += `🎁 מענק התמדה:\n${pos.bonus}\n\n`;
  desc += `📋 דרישות:\n• עדיפות לבוגרי תואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n• ניסיון בשירות ו/או מכירות - יתרון משמעותי\n• זמינות לעבודה באזור הגיאוגרפי\n• יכולת עבודה בצוות ותקשורת בינאישית\n`;
  if (pos.extraRequirements) desc += `${pos.extraRequirements}\n`;
  desc += `\n📧 שליחת מועמדים:\n• יש לשלוח קו"ח לסמדר מפילת: orpazsm@gmail.com\n• העתק למערכת הגיוס: umtb-hr@cvwebmail.com\n• לציין בכותרת: שם מלא + ת.ז + מספר משרה (${pos.regionCode})\n• חשוב! השם בכותרת חייב להיות זהה לשם בקו"ח\n• לציין אילוצים אם יש (חופשות, לימודים, ימים ושעות)\n• לשלוח מועמדים מאזור גיאוגרפי קרוב בלבד\n`;
  return desc;
}

const ALL_POSITIONS: PositionData[] = [
  // ==================== מרחב מרכז JB-107 ====================
  { title: 'טלר בסניף חצרות יפו - בנק מזרחי', location: 'תל אביב - יפו', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_TLV, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף קרית עתידים רמת החייל - בנק מזרחי (דחוף!)', location: 'תל אביב - רמת החייל', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'קבוע', isUrgent: true, additionalInfo: 'טלר יחיד בסניף! נדרש מועמד זמין לעבודה ללא אילוצים עם יכולות גבוהות', salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_TLV, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר במרכז עסקים תל אביב - בנק מזרחי', location: 'תל אביב', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף + תורנות שישי', employmentType: 'קבוע', additionalInfo: 'סניף רצוף + תורנות בימי שישי', salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_TLV, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי', location: 'תל אביב - סקיי טאוור', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_TLV, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף כיכר המדינה תל אביב - בנק מזרחי', location: 'תל אביב - כיכר המדינה', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מפוצל', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_TLV, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף מידטאון תל אביב - בנק מזרחי', location: 'תל אביב - מידטאון', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מפוצל', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_TLV, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר במרכז עסקים יהלומים בבורסה רמת גן - בנק מזרחי (דחוף!)', location: 'רמת גן - הבורסה', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'קבוע', isUrgent: true, additionalInfo: 'טלר יחיד בסניף! נדרש מועמד שזמין לעבודה ללא אילוצים, יכולות גבוהות', salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף פארק הים בת ים - בנק מזרחי', location: 'בת ים - פארק הים', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מפוצל ב\'-ו\'', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד מרחב מרכז - בנק מזרחי', location: 'תל אביב, רמת גן, בת ים', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שלא זמינים למשרה מלאה ויכולים לעבוד לפחות 3 ימים מלאים בשבוע', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  // בנקאים מרחב מרכז
  { title: 'בנקאי מתנייד מרחב מרכז - בנק מזרחי', location: 'תל אביב, רמת גן, בת ים', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין הסניפים בת"א, ר"ג, בת ים', salary: BANKER_SALARY_SPLIT, bonus: null, keywords: BANKER_KEYWORDS, salaryRange: '9,600-10,900 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי', location: 'רמת גן - הבורסה', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: BANKER_SALARY_CONTINUOUS, bonus: null, keywords: BUSINESS_BANKER_KEYWORDS, salaryRange: '8,400-9,800 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי משכנתאות בסניף חשמונאים תל אביב - בנק מזרחי', location: 'תל אביב - חשמונאים', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מפוצל', employmentType: 'קבוע', additionalInfo: null, salary: BANKER_SALARY_SPLIT, bonus: null, keywords: MORTGAGE_KEYWORDS, salaryRange: '9,600-10,900 ₪', employmentTypeField: 'משרה מלאה', extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית' },
  { title: 'בנקאי משכנתאות בסניף בת ים - בנק מזרחי', location: 'בת ים', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: BANKER_SALARY_SPLIT, bonus: null, keywords: MORTGAGE_KEYWORDS, salaryRange: '9,600-10,900 ₪', employmentTypeField: 'משרה מלאה', extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית' },
  { title: 'בנקאי משכנתאות בסניף חצרות יפו - בנק מזרחי', location: 'תל אביב - יפו', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: BANKER_SALARY_CONTINUOUS, bonus: null, keywords: MORTGAGE_KEYWORDS, salaryRange: '8,400-9,800 ₪', employmentTypeField: 'משרה מלאה', extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית' },
  { title: 'בנקאי עסקי במרכז עסקים ת"א - בנק מזרחי', location: 'תל אביב', region: 'מרחב מרכז', regionCode: 'JB-107', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: BANKER_SALARY_CONTINUOUS, bonus: null, keywords: BUSINESS_BANKER_KEYWORDS, salaryRange: '8,400-9,800 ₪', employmentTypeField: 'משרה מלאה' },

  // ==================== מרחב דן JB-110 ====================
  { title: 'טלר בסניף גבעתיים - בנק מזרחי', location: 'גבעתיים', region: 'מרחב דן', regionCode: 'JB-110', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד מרחב דן - בנק מזרחי', location: 'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין', region: 'מרחב דן', regionCode: 'JB-110', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה. עבודה בסניפים רצופים או מפוצלים לפי הצורך', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי עסקי בפארק עסקים חולון - בנק מזרחי', location: 'חולון - פארק עסקים', region: 'מרחב דן', regionCode: 'JB-110', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: BANKER_SALARY_CONTINUOUS, bonus: null, keywords: BUSINESS_BANKER_KEYWORDS, salaryRange: '8,400-9,800 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי לקוחות בסניף קרית אילון חולון - בנק מזרחי', location: 'חולון - קרית אילון', region: 'מרחב דן', regionCode: 'JB-110', branchType: 'מפוצל ב\'-ו\'', employmentType: 'קבוע', additionalInfo: null, salary: BANKER_SALARY_SPLIT, bonus: null, keywords: BANKER_KEYWORDS, salaryRange: '9,600-10,900 ₪', employmentTypeField: 'משרה מלאה' },

  // ==================== מרחב יהודה JB-109 – ירושלים ====================
  { title: 'טלר מתנייד מרחב ירושלים - בנק מזרחי', location: 'ירושלים והסביבה', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות בין כל הסניפים באזור ירושלים - נדרשת גמישות לעבודה בסניפים רצופים ומפוצלים. חשוב להבהיר למועמדים שבהמשך ישתבצו בסניף קבוע, בד"כ תוך מקסימום שנה', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי משכנתאות מרחבי ירושלים - בנק מזרחי', location: 'ירושלים - התניידות', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'עבודה בעיקר בסניפים מפוצלים, החלפת חל"ד', salary: BANKER_SALARY_SPLIT, bonus: null, keywords: MORTGAGE_KEYWORDS, salaryRange: '9,600-10,900 ₪', employmentTypeField: 'משרה מלאה', extraRequirements: '• נדרש תואר פיננסי (כלכלה/מנה"ס)\n• ניסיון מכירתי ושירותי - חשוב מאוד\n• יכולת ניהול מו"מ גבוהה\n• סדר וארגון\n• יכולת אנליטית + ורבלית' },
  { title: 'טלר בסניף שמאי ירושלים - בנק מזרחי', location: 'ירושלים - שמאי', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מפוצל + תורנות שישי', employmentType: 'חל"ד', additionalInfo: 'סניף מפוצל + תורנות בימי שישי, החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף אפרת - בנק מזרחי', location: 'אפרת', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מפוצל', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  // שפלת יהודה
  { title: 'טלר מתנייד שפלת יהודה - בנק מזרחי', location: 'לוד, רמלה, מודיעין, יהוד, אור יהודה, בית שמש', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות בין הסניפים בשפלת יהודה: לוד, רמלה, מודיעין, יהוד, אור יהודה, בית שמש', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי עסקי בסניף קש"ת אירפורט סיטי - בנק מזרחי', location: 'אירפורט סיטי - קרית שדה התעופה', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: BANKER_SALARY_CONTINUOUS, bonus: null, keywords: BUSINESS_BANKER_KEYWORDS, salaryRange: '8,400-9,800 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'בנקאי לקוחות בסניף קש"ת אירפורט סיטי - בנק מזרחי', location: 'אירפורט סיטי - קרית שדה התעופה', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'רצוף', employmentType: 'קבוע', additionalInfo: null, salary: BANKER_SALARY_CONTINUOUS, bonus: null, keywords: BANKER_KEYWORDS, salaryRange: '8,400-9,800 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר 75% בסניף מט"ל לוד - בנק מזרחי', location: 'לוד - אזור התעשיה הצפוני', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד, 75% משרה - 4 ימים בשבוע: חובה ביום שלישי, עדיפות לשני ורביעי ויום נוסף', salary: { monthly: 6975, yearly: 8025, details: '75% משרה, כולל פיצולים ונסיעות' }, bonus: null, keywords: TELLER_KEYWORDS, salaryRange: '6,975-8,025 ₪', employmentTypeField: 'חלקית - 75%' },
  { title: 'טלר בסניף יהוד - בנק מזרחי', location: 'יהוד', region: 'מרחב יהודה', regionCode: 'JB-109', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },

  // ==================== מרחב LIVE JB-4100 ====================
  { title: 'בנקאי לקוחות LIVE - בנק מזרחי (מספר תקנים)', location: 'לוד - אזור התעשיה הצפוני (מט"ל)', region: 'מרחב LIVE', regionCode: 'JB-4100', branchType: 'דיגיטלי', employmentType: 'חל"ד', additionalInfo: `כל המשרות הן להחלפת חל"ד אבל ייקלטו בתקן קבוע לבנק.\n\nעבודה בסניפים הוירטואליים - מענה ללקוחות באמצעים דיגיטליים.\nמיקום: בניין הבנק במט"ל (אזור התעשיה הצפוני בלוד) - בניין עם חדר אוכל וחדר כושר.\nמתאים למועמדים מאזור: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד והסביבה.\n\nשעות עבודה:\n• משמרות 8 שעות בין 07:00-20:00\n• משמרת בוקר: 7-15\n• משמרת ביניים: 8-16 / 9-17 / 10-18\n• משמרת ערב: 11-20\n• 2 משמרות ערב בשבוע\n• שישי אחת ל-3 שבועות\n\nמהות התפקיד: כמו בנקאי לקוחות בסניף פרונטלי - רק טלפוני ודיגיטלי.\nשימוש במעטפת דיגיטלית ובכלים מתקדמים לקשר שוטף עם הלקוחות.\nדגש על מועמדים עם ניסיון בשירות ו/או מכירות!`, salary: LIVE_SALARY, bonus: null, keywords: LIVE_KEYWORDS, salaryRange: '9,700-11,100 ₪', employmentTypeField: 'משרה מלאה', openings: 5 },

  // ==================== מרחב דרום JB-111 ====================
  { title: 'טלר בסניף א.ת ראשון לציון - בנק מזרחי', location: 'ראשון לציון - אזור תעשיה', region: 'מרחב דרום', regionCode: 'JB-111', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף פארק המדע רחובות - בנק מזרחי', location: 'רחובות - פארק המדע', region: 'מרחב דרום', regionCode: 'JB-111', branchType: 'רצוף', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף באר שבע - בנק מזרחי', location: 'באר שבע', region: 'מרחב דרום', regionCode: 'JB-111', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד שפלה - בנק מזרחי', location: 'ראשון לציון, רחובות, נס ציונה, יבנה', region: 'מרחב דרום', regionCode: 'JB-111', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה - רובם סניפים מפוצלים', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד נגב - בנק מזרחי', location: 'באר שבע, ערד, דימונה, אופקים, נתיבות', region: 'מרחב דרום', regionCode: 'JB-111', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות בין הסניפים בבאר שבע, ערד ודימונה. צריכה להיות נכונות במידת הצורך להגיע גם לאופקים ונתיבות. רובם סניפים מפוצלים', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד אשדוד/קרית מלאכי/קרית גת/אשקלון - בנק מזרחי', location: 'אשדוד, קרית מלאכי, קרית גת, אשקלון', region: 'מרחב דרום', regionCode: 'JB-111', branchType: 'מעורב', employmentType: 'חל"ד', additionalInfo: 'התניידות בין הסניפים באשדוד, קרית מלאכי, קרית גת ואשקלון - רובם סניפים מפוצלים. החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },

  // ==================== מרחב צפון JB-113 ====================
  { title: 'טלר 50% בסניף הדר חיפה - בנק מזרחי (לסטודנטים)', location: 'חיפה - הדר', region: 'מרחב צפון', regionCode: 'JB-113', branchType: 'מפוצל', employmentType: 'קבוע', additionalInfo: 'משרה 50% - לימי שני כולל פיצול. מתאים מאוד לסטודנטים/יות', salary: { monthly: 4650, yearly: 5350, details: '50% משרה כולל פיצולים ונסיעות' }, bonus: null, keywords: TELLER_KEYWORDS, salaryRange: '4,650-5,350 ₪', employmentTypeField: 'חלקית - 50%' },
  { title: 'טלר בסניף נשר - בנק מזרחי', location: 'נשר', region: 'מרחב צפון', regionCode: 'JB-113', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף קרית ים - בנק מזרחי', location: 'קרית ים', region: 'מרחב צפון', regionCode: 'JB-113', branchType: 'מפוצל ב\'-ו\'', employmentType: 'זמני', additionalInfo: 'תקן זמני', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף חיפה - בנק מזרחי', location: 'חיפה - כרמל', region: 'מרחב צפון', regionCode: 'JB-113', branchType: 'מפוצל', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד קריות וחיפה - בנק מזרחי', location: 'קריות, חיפה והסביבה', region: 'מרחב צפון', regionCode: 'JB-113', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות לסניפים במרחק של עד 40 ק"מ מהבית. עדיפות למועמדים ניידים עם רכב', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר מתנייד קריות ויקנעם - בנק מזרחי', location: 'הקריות ויקנעם', region: 'מרחב צפון', regionCode: 'JB-113', branchType: 'מעורב', employmentType: 'קבוע', additionalInfo: 'התניידות לסניפים במרחק של עד 40 ק"מ מהבית. עדיפות למועמדים ניידים עם רכב', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },

  // ==================== מרחב שרון JB-108 ====================
  { title: 'טלר בסניף א.ת כפר סבא - בנק מזרחי', location: 'כפר סבא - אזור תעשיה', region: 'מרחב שרון', regionCode: 'JB-108', branchType: 'רצוף', employmentType: 'חל"ד', additionalInfo: 'החלפת חל"ד', salary: TELLER_SALARY_CONTINUOUS, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '8,200-9,500 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף כיכר המושבה הוד השרון - בנק מזרחי', location: 'הוד השרון - כיכר המושבה', region: 'מרחב שרון', regionCode: 'JB-108', branchType: 'מפוצל', employmentType: 'זמני', additionalInfo: 'תקן זמני', salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
  { title: 'טלר בסניף ויצמן כפר סבא - בנק מזרחי', location: 'כפר סבא - ויצמן', region: 'מרחב שרון', regionCode: 'JB-108', branchType: 'מפוצל', employmentType: 'קבוע', additionalInfo: null, salary: TELLER_SALARY_SPLIT, bonus: TELLER_BONUS_REGULAR, keywords: TELLER_KEYWORDS, salaryRange: '9,300-10,700 ₪', employmentTypeField: 'משרה מלאה' },
];

async function runSync() {
  try {
    console.log('🏦 מעדכן משרות בנק מזרחי טפחות - אפריל 2026')

    let employer = await prisma.employer.findFirst({
      where: { name: { contains: 'מזרחי' } }
    })

    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'בנק מזרחי טפחות',
          email: 'orpazsm@gmail.com',
          phone: '',
          description: 'בנק מזרחי טפחות - מרחבים: מרכז, דן, יהודה, LIVE, דרום, צפון, שרון'
        }
      })
    }

    const existingPositions = await prisma.position.findMany({
      where: { employerId: employer.id }
    })

    let created = 0, updated = 0, deactivated = 0
    const results: { title: string; action: string }[] = []

    for (const pos of ALL_POSITIONS) {
      const description = buildDescription(pos)

      const existingPosition = existingPositions.find(p =>
        p.title === pos.title ||
        (p.title.includes(pos.location.split(' - ')[0]) && p.title.includes(pos.title.split(' ')[0]))
      )

      const posData = {
        title: pos.title,
        location: pos.location,
        description,
        salaryRange: pos.salaryRange,
        employmentType: pos.employmentTypeField,
        keywords: pos.keywords,
        active: true,
        openings: pos.openings || 1,
        contactEmail: 'orpazsm@gmail.com',
        contactName: 'סמדר מפילת',
        contactEmails: JSON.stringify(['orpazsm@gmail.com', 'umtb-hr@cvwebmail.com'])
      }

      if (existingPosition) {
        await prisma.position.update({ where: { id: existingPosition.id }, data: posData })
        updated++
        results.push({ title: pos.title, action: '🔄 עודכן' })
      } else {
        await prisma.position.create({ data: { ...posData, employerId: employer.id } })
        created++
        results.push({ title: pos.title, action: '✨ נוצר' })
      }
    }

    // Deactivate positions not in current list
    for (const existingPos of existingPositions) {
      const stillExists = ALL_POSITIONS.some(p =>
        p.title === existingPos.title ||
        (existingPos.title.includes(p.location.split(' - ')[0]) && existingPos.title.includes(p.title.split(' ')[0]))
      )
      if (!stillExists && existingPos.active) {
        await prisma.position.update({ where: { id: existingPos.id }, data: { active: false } })
        deactivated++
        results.push({ title: existingPos.title, action: '❌ הושבת' })
      }
    }

    const totalActive = await prisma.position.count({
      where: { employerId: employer.id, active: true }
    })

    return NextResponse.json({
      success: true,
      message: '✅ משרות בנק מזרחי טפחות עודכנו בהצלחה - אפריל 2026!',
      employer: employer.name,
      stats: { created, updated, deactivated, totalActive, totalInList: ALL_POSITIONS.length },
      results
    })
  } catch (error) {
    console.error('❌ שגיאה:', error)
    return NextResponse.json({ error: 'שגיאה בעדכון משרות מזרחי', details: String(error) }, { status: 500 })
  }
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}

// GET handler for one-time sync trigger
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (key !== 'mizrahi2026apr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSync()
}
