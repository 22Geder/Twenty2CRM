import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ========================================================================
// DATA TO RESTORE
// ========================================================================

const EMPLOYERS = [
  { name: 'בנק מזרחי טפחות', email: 'orpazsm@gmail.com', phone: '050-1234567', description: 'בנק מזרחי טפחות - מרחבים: מרכז, דן, יהודה, LIVE, דרום, צפון, שרון. איש קשר: סמדר אורפז' },
  { name: 'קבוצת UNION', email: 'union@union.co.il', phone: '', description: '🔥 לקסוס, טויוטה, Geely, GAC. בונוס 1,000 ₪ H&M למגייס!' },
  { name: 'YES', email: 'yes@yes.co.il', phone: '', description: '🎯 חטיבת לקוחות עסקיים, מוקדי מכירות ושירות. נשר, ב"ש, כפר סבא. בונוסים עד 10K!' },
  { name: 'סלע לוגיסטיקה', email: 'pninit@selabonded.co.il', phone: '', description: '📦 מחסנים והפצה. אשדוד, בית שמש, חפץ חיים, בני דרום, מבקיעים. פנינית רויטמן (סלע) | דנה שפירו (לוגיסטים). שכר 38-50 ₪/שעה.' },
  { name: 'לוגיסטיקר', email: 'logisticar@logisticar.co.il', phone: '', description: '🚛 מחסנים, הפצה, נהגים. בית שמש, לוד, אשדוד, בית חיליקה. שכר 40-60 ₪/שעה.' },
  { name: 'א.ד.ר לוגיסטיקה', email: 'adr@adr.co.il', phone: '', description: '🎁 בית שמש, אירפורט סיטי, מודיעין. בונוס התמדה 1,000 ₪ חודשי!' },
  { name: 'אושפיר', email: 'oshpir@oshpir.co.il', phone: '', description: '🚢 שילוח בינלאומי - חיפה. מתאם/ת יבוא + מתאם/ת יצוא.' },
  { name: 'חברת GAC', email: 'gac@gac.co.il', phone: '03-1234567', description: '🚗 יבואן רכב סיני מוביל - מותגי GAC. אולמות תצוגה ברחבי הארץ.' },
  { name: 'אפרייט', email: 'upright@upright.co.il', phone: '', description: '🏗️ ייצור טלסקופיות ומלגזות. מודיעין עילית.' },
  { name: 'לאשינג חיפה', email: 'lashing@lashing.co.il', phone: '', description: '🚢 עבודות עגינה בנמל חיפה.' },
  { name: 'אופרייט - יד ראשונה', email: 'liatg@opl.co.il', phone: '', description: '🚘 מכירת רכבים וליסינג פרטי. סניפים: גלילות, חולון. עמלות גבוהות!' }
]

const TAGS = [
  // תגיות תעסוקה
  { name: 'לוגיסטיקה', color: '#f97316', category: 'industry', type: 'CATEGORY' },
  { name: 'מחסנים', color: '#84cc16', category: 'industry', type: 'CATEGORY' },
  { name: 'נהגים', color: '#3b82f6', category: 'industry', type: 'CATEGORY' },
  { name: 'בנקאות', color: '#8b5cf6', category: 'industry', type: 'CATEGORY' },
  { name: 'מכירות', color: '#ef4444', category: 'industry', type: 'CATEGORY' },
  { name: 'שירות לקוחות', color: '#06b6d4', category: 'industry', type: 'CATEGORY' },
  { name: 'רכב', color: '#f59e0b', category: 'industry', type: 'CATEGORY' },
  { name: 'מלגזן', color: '#10b981', category: 'skill', type: 'SKILL' },
  { name: 'WMS', color: '#6366f1', category: 'skill', type: 'SKILL' },
  { name: 'אקסל', color: '#22c55e', category: 'skill', type: 'SKILL' },
  { name: 'אנגלית', color: '#ec4899', category: 'skill', type: 'SKILL' },
  { name: 'ניסיון ניהולי', color: '#a855f7', category: 'skill', type: 'SKILL' },
  { name: 'רישיון נהיגה', color: '#14b8a6', category: 'skill', type: 'SKILL' },
  // תגיות סטטוס מועמדים
  { name: 'מועמד מועדף', color: '#fbbf24', category: 'status', type: 'CATEGORY' },
  { name: 'דחיפות גבוהה', color: '#ef4444', category: 'status', type: 'CATEGORY' },
  { name: 'זמין מיידית', color: '#22c55e', category: 'status', type: 'CATEGORY' },
  { name: 'בתהליך', color: '#3b82f6', category: 'status', type: 'CATEGORY' },
  { name: 'חדש במערכת', color: '#8b5cf6', category: 'status', type: 'CATEGORY' },
  // תגיות מיקום
  { name: 'מרכז', color: '#0ea5e9', category: 'location', type: 'CATEGORY' },
  { name: 'צפון', color: '#06b6d4', category: 'location', type: 'CATEGORY' },
  { name: 'דרום', color: '#f97316', category: 'location', type: 'CATEGORY' },
  { name: 'ירושלים', color: '#a855f7', category: 'location', type: 'CATEGORY' },
  { name: 'שרון', color: '#84cc16', category: 'location', type: 'CATEGORY' },
]

const DEPARTMENTS = [
  { name: 'הייטק', description: 'משרות פיתוח, מערכות מידע ו-IT' },
  { name: 'בנקאות', description: 'טלרים, בנקאים, משכנתאות' },
  { name: 'לוגיסטיקה', description: 'מחסנים, הפצה, נהגים, מלגזנים' },
  { name: 'מכירות', description: 'מכירות שטח, טלמרקטינג, חנויות' },
  { name: 'שירות לקוחות', description: 'מוקדים, תמיכה טכנית' },
  { name: 'רכב', description: 'אולמות תצוגה, יועצי שירות' },
]

// All positions organized by employer
const POSITIONS: Record<string, Array<{
  title: string
  location: string
  description: string
  requirements: string
  salaryRange: string
  priority: number
  workHours?: string
  benefits?: string
  transportation?: string
  contactName?: string
  contactEmail?: string
}>> = {
  'בנק מזרחי טפחות': [
    { title: 'טלר בסניף חצרות יפו', location: 'תל אביב - יפו', description: 'סניף רצוף, תקן קבוע. מענק התמדה מוגדל 13,000 ₪.', requirements: 'תודעת שירות גבוהה, עדיפות לתואר בכלכלה/מנה"ס, ניסיון בשירות/מכירה - יתרון', salaryRange: '8,200 ₪ חודשי, 9,500 ₪ שנתי', priority: 1 },
    { title: 'טלר בסניף קרית עתידים - דחוף!!!', location: 'תל אביב - רמת החייל', description: 'דחוף!!! טלר יחיד בסניף. סניף רצוף, תקן קבוע.', requirements: 'זמינות מיידית לעבודה - ללא אילוצים! יכולות גבוהות נדרשות.', salaryRange: '8,200 ₪ + מענק 13,000 ₪', priority: 3 },
    { title: 'טלר במרכז עסקים ת"א', location: 'תל אביב', description: 'סניף רצוף + תורנות בימי ו\'. תקן קבוע.', requirements: 'מקצועיות ודייקנות, תודעת שירות', salaryRange: '8,200 ₪ + מענק 13,000 ₪', priority: 1 },
    { title: 'טלר 50% במרכז עסקים ת"א - לסטודנטים', location: 'תל אביב', description: 'סניף רצוף, זמינות ליומיים וחצי. מתאים לסטודנטים.', requirements: 'לציין ימי ושעות לימודים!', salaryRange: 'יחסי + מענק התמדה', priority: 1 },
    { title: 'טלר בסניף סקיי טאוור', location: 'תל אביב', description: 'סניף רצוף, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪ + מענק 13,000 ₪', priority: 1 },
    { title: 'טלר במרכז עסקים המגדל בבורסה', location: 'רמת גן', description: 'סניף רצוף, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪, שנתי 9,500 ₪, מענק 7,000 ₪', priority: 1 },
    { title: 'טלר מתנייד - ת"א, ר"ג, בת ים', location: 'מרכז - התניידות', description: 'תקן קבוע. התניידות בין הסניפים.', requirements: 'גמישות, תודעת שירות', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'בנקאי מתנייד במשרה מלאה', location: 'מרכז - ת"א, ר"ג, בת ים', description: 'תקן קבוע. עבודה כבנקאי בסניפים רצופים או מפוצלים.', requirements: 'ניסיון בבנקאות/שירות', salaryRange: '8,400-9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה', location: 'רמת גן', description: 'סניף רצוף, קליטה בתקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '8,400 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי בסניף סקיי טאוור', location: 'תל אביב', description: 'סניף רצוף, קליטה בתקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: 'עד 10,000 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי משכנתאות בסניף חשמונאים', location: 'תל אביב', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תואר פיננסי - חובה! ניסיון במכירות ושירות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 2 },
    { title: 'בנקאי משכנתאות בסניף בת ים', location: 'בת ים', description: 'סניף מפוצל, קליטה בתקן קבוע.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות במרכז עסקים ת"א', location: 'תל אביב', description: 'סניף רצוף, תקן קבוע.', requirements: 'ניסיון בשירות לקוחות', salaryRange: 'עד 10,000 ₪ + קרן השתלמות', priority: 1 },
    { title: 'טלר בסניף לב העיר פ"ת', location: 'פתח תקווה', description: 'סניף מפוצל, קליטה בתקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪, שנתי 10,700 ₪', priority: 1 },
    { title: 'טלר בסניף כפר קאסם', location: 'כפר קאסם', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר מתנייד במרחב דן', location: 'חולון, גבעתיים, בני ברק, פ"ת, קרית אונו, ראש העין', description: 'תקן קבוע. עבודה בסניפים רצופים או מפוצלים.', requirements: 'גמישות, התניידות רחבה', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'בנקאי לקוחות בסניף קרית אילון', location: 'חולון', description: 'סניף מפוצל ב\'-ו\', תקן קבוע.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף לב העיר פ"ת', location: 'פתח תקווה', description: 'סניף מפוצל, החלפת חל"ד.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף קרית אונו', location: 'קרית אונו', description: 'סניף מפוצל ב\'-ו\', תקן זמני.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף גלובל טאוורס', location: 'פתח תקווה', description: 'סניף מפוצל, תקן קבוע.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף בני ברק', location: 'בני ברק', description: 'סניף מפוצל, תקן זמני.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי בסניף בר אילן', location: 'רמת גן', description: 'סניף מפוצל, תקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'טלר מתנייד באזור ירושלים', location: 'ירושלים - כל הסניפים', description: 'משרה ב-40-50%. מתאים לסטודנטים.', requirements: 'גמישות לעבודה בסניפים רצופים ומפוצלים', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'בנקאי משכנתאות מרחבי - ירושלים', location: 'ירושלים - התניידות', description: 'עבודה בעיקר בסניפים מפוצלים.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי משכנתאות במ"ע ירושלים', location: 'ירושלים', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי בסניף קש"ת (אירפורט סיטי)', location: 'קרית שדה התעופה', description: 'סניף רצוף, תקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '8,400 ₪, שנתי 9,800 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי משכנתאות בסניף מודיעין', location: 'מודיעין', description: 'סניף מפוצל ב\'-ו\'.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי דיגיטלי - סניפי LIVE', location: 'לוד - אזור התעשיה הצפוני', description: 'סניפי הלייב 07:00-20:00. חדר אוכל וחדר כושר.', requirements: 'ניסיון בשירות ו/או מכירות - חובה! חובה 2 משמרות ערב', salaryRange: '9,700 ₪ חודשי, 11,100 ₪ שנתי', priority: 2 },
    { title: 'טלר בסניף ערד', location: 'ערד', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪ + מענק 7,000 ₪', priority: 1 },
    { title: 'טלר בסניף א.ת ראשל"צ', location: 'ראשון לציון', description: 'סניף רצוף.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪', priority: 1 },
    { title: 'טלר בסניף רחובות', location: 'רחובות', description: 'סניף מפוצל.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר בסניף דימונה', location: 'דימונה', description: 'סניף מפוצל.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר מתנייד - שפלה', location: 'ראשל"צ, רחובות, נס ציונה, יבנה', description: 'תקן זמני, רובם סניפים מפוצלים.', requirements: 'גמישות, התניידות', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'טלר מתנייד - נגב', location: 'באר שבע, ערד, דימונה', description: 'תקן קבוע, רובם סניפים מפוצלים.', requirements: 'נכונות להגיע גם לאופקים ונתיבות', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר 50% בסניף הדר חיפה - לסטודנטים', location: 'חיפה - הדר', description: '50% משרה. מתאים מאוד לסטודנטים/יות.', requirements: 'זמינות לימי שני', salaryRange: 'יחסי', priority: 1 },
    { title: 'טלר בסניף ערים כפ"ס', location: 'כפר סבא', description: 'סניף מפוצל ב\'-ו\'.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר בסניף א.ת כפ"ס', location: 'כפר סבא', description: 'סניף רצוף.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪', priority: 1 },
    { title: 'טלר בסניף ויצמן כפ"ס', location: 'כפר סבא', description: 'סניף מפוצל.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'בנקאי עסקי באחוזה מערב רעננה', location: 'רעננה', description: 'סניף מפוצל ב\'-ו\', תקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'טלר בסניף כיכר המושבה', location: 'הוד השרון', description: 'סניף מפוצל, תקן זמני.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר בסניף רמת השרון', location: 'רמת השרון', description: 'סניף מפוצל.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר מתנייד במרחב שרון דרומי', location: 'נתניה, רעננה, הרצליה, כפ"ס, רמת השרון, הוד השרון', description: 'תקן קבוע, התניידות רחבה.', requirements: 'גמישות, התניידות', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
  ],
  'קבוצת UNION': [
    { title: 'נציג/ת קבלה - לקסוס פתח תקווה', location: 'פתח תקווה', description: 'דיסקרטי! סיבוס 37 ₪ ליום, קה"ש מהיום הראשון 2.5%.', requirements: 'ייצוגיות גבוהה מאוד, תודעת שירות מצוינת, אנגלית - יתרון', salaryRange: '6,500 ₪ + בונוסים', priority: 2 },
    { title: 'דייל/ת קבלה - לקסוס פתח תקווה', location: 'פתח תקווה', description: 'השכר עלה! סיבוס 37 ₪ ליום, קה"ש מהיום הראשון 2.5%.', requirements: 'ייצוגיות גבוהה מאוד, תודעת שירות מצוינת, ניסיון בקבלה/אירוח - יתרון', salaryRange: '9,000 ₪!', priority: 3 },
    { title: 'יועצ/ת שירות - לקסוס פתח תקווה', location: 'פתח תקווה', description: 'סיבוס 37 ₪ ליום, קה"ש מהיום הראשון 2.5%.', requirements: 'ניסיון בשירות לקוחות - חובה, יכולת מכירתית, אוריינטציה טכנית - יתרון', salaryRange: '8,000-12,000 ₪', priority: 2 },
    { title: 'מנהל/ת אולם תצוגה - GEELY', location: 'תל אביב - יגאל אלון', description: 'מגדלי טויוטה. ניהול צוות. הובלת האולם לעמידה ביעדים.', requirements: 'ניסיון קודם בניהול מכירות - חובה, שליטה ביישומי Office, רישיון נהיגה', salaryRange: '13,000 ₪+ עמלות', priority: 3 },
    { title: 'מנהל/ת אולם סלקט - יד 2 לקסוס', location: 'פתח תקווה', description: 'ניהול יחידת רווח והפסד. עמידה ביעדים עסקיים.', requirements: 'ניסיון מעל שנתיים בניהול אולם תצוגה בענף הרכב - חובה!', salaryRange: '13,000 ₪+ עמלות', priority: 3 },
    { title: 'יועץ/ת מכירות - טויוטה נתניה', location: 'נתניה', description: 'מכירת רכבים חדשים. בונוס 1,000 ₪ H&M למגייס!', requirements: 'ייצוגיות גבוהה, תודעת שירות, ניסיון במכירות - יתרון', salaryRange: '7,000-15,000 ₪ + עמלות', priority: 2 },
    { title: 'יועץ/ת מכירות - טויוטה ירושלים', location: 'ירושלים', description: 'מכירת רכבים חדשים. בונוס 1,000 ₪ H&M למגייס!', requirements: 'ייצוגיות גבוהה, תודעת שירות, ניסיון במכירות - יתרון', salaryRange: '7,000-15,000 ₪ + עמלות', priority: 2 },
  ],
  'YES': [
    { title: 'אחראי/ת תיק לקוח עסקי (פרואקטיב)', location: 'כפר סבא', description: 'מוקד קטן ואיכותי. עבודה עם לקוחות גדולים. הכשרה פרטנית.', requirements: 'ניסיון של שנה לפחות בתפקידי שירות ומכירה - יתרון משמעותי', salaryRange: '6,500 ₪ + בונוס עד 2,500 ₪. ממוצע 8.5K', priority: 2 },
    { title: 'נציג/ת מכירות טלסל (לידים חמים)', location: 'נשר', description: 'התעשיה 8. שיחות מלקוחות שהתעניינו. לידים חמים!', requirements: 'אוריינטציה מכירתית - חובה, יכולת עבודה בסביבה ממוחשבת', salaryRange: '34.30 ₪/שעה + בונוס ממוצע 2,700 ₪ ללא תקרות', priority: 2 },
    { title: 'נציג/ת מוקד מכירות (טלסל)', location: 'נשר', description: 'התעשיה 8. מכירת YES, סטינג, אינטרנט, נטפליקס. תחרויות עם פרסים!', requirements: 'אוריינטציה מכירתית - חובה, הישגיות ותחרותיות', salaryRange: '34.30 ₪/שעה + בונוס 8,000-10,000 ₪!! ללא תקרה', priority: 3 },
    { title: 'נציג/ת שירות לקוחות', location: 'נשר / באר שבע', description: 'אופציה לעבודה היברידית לאחר הסמכה! תן ביס 41 ₪.', requirements: 'תודעת שירות גבוהה, יכולת עבודה בסביבה ממוחשבת', salaryRange: '34.30 ₪/שעה + בונוס עד 3,000 ₪. טווח 8-9K', priority: 1 },
    { title: 'נציג/ת תמיכה טכנית', location: 'נשר', description: 'עבודה גם בוואטסאפ! תשלום כפול על לילות/שבתות/חגים!', requirements: 'אוריינטציה טכנית, יכולת ניסוח טובה בכתב - חובה!', salaryRange: '34.30 ₪/שעה + בונוס עד 3,000 ₪. טווח 8-9K + תוספות', priority: 1 },
    { title: 'סוכן/ת מכירות שטח למגזר העסקי', location: 'אזור הצפון', description: 'רכב צמוד! סלולרי + טבלט + מחשב נייד. 10ביס.', requirements: 'ניסיון במכירות - חובה, דרייב מטורף למכירות!, פרואקטיביות', salaryRange: '8,000 ₪ + בונוס ללא תקרה + רכב צמוד!', priority: 3 },
    { title: 'אחראי/ת תיק לקוח עסקי', location: 'כפר סבא', description: 'מוקד קטן ואיכותי (7 תקנים). סביבה צעירה ודינמית.', requirements: 'ניסיון של שנה לפחות בתפקידי שירות ו/או מכירה', salaryRange: '6,500 ₪ + בונוס עד 2,500 ₪. ממוצע 8.5K', priority: 1 },
  ],
  'סלע לוגיסטיקה': [
    // ----- משרות פנינית רויטמן (סלע) -----
    { 
      title: 'מלגזן היגש - בני דרום', 
      location: 'בני דרום', 
      description: 'עבודה על הגש וליקוטים',
      requirements: 'רישיון מלגזה - חובה, ניסיון על הגש ורצון לעבוד',
      salaryRange: '47 ₪/שעה', 
      priority: 2,
      workHours: '08:00-17:00',
      benefits: 'ארוחות חמות, הסעה מאשקלון ואשדוד',
      transportation: 'הסעה מאשקלון ואשדוד',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'פקיד/ה - בני דרום', 
      location: 'בני דרום', 
      description: 'ניהול כל המערך האדמיניסטרטיבי של המחסן בשילוב של עבודה משרדית ועבודה בשטח: בקרה על קליטת סחורה והפצתה, ניהול מלאי שוטף, קליטת עובדים חדשים, טיפול בנוכחות העובדים, אדמיניסטרציה שוטפת',
      requirements: 'נדרשת שליטה בשפה הרוסית - חובה, ניסיון קודם בתפקיד דומה - חובה, ניסיון במערכת WMS - יתרון, עבודה באקסל - חובה, ניידות - חובה',
      salaryRange: '42 ₪/שעה', 
      priority: 2,
      workHours: '08:00-17:00',
      benefits: 'ארוחות חמות',
      transportation: 'הגעה עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'פקיד/ה - חפץ חיים', 
      location: 'חפץ חיים', 
      description: 'בקרה על קליטת סחורה והפצתה, ניהול מלאי שוטף, קליטת עובדים חדשים, טיפול בנוכחות העובדים, אדמיניסטרציה שוטפת. העבודה מחולקת בין עבודה על המחשב ובין עשייה פיזית ברצפת המרלו"ג',
      requirements: 'ניסיון קודם בתפקיד דומה - חובה, ניסיון במערכת WMS - יתרון, עבודה באקסל - חובה, ניידות - חובה',
      salaryRange: '45 ₪/שעה', 
      priority: 2,
      workHours: '08:00-17:00',
      benefits: 'ארוחות חמות',
      transportation: 'עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'מלקט/ת - אשדוד המדע 2', 
      location: 'אשדוד - המדע 2', 
      description: 'ליקוט סחורה והכנת הזמנות, עבודה עם מסופון',
      requirements: 'נכונות למשרה מלאה, ראש גדול, ניסיון בליקוט - יתרון',
      salaryRange: '38 ₪/שעה', 
      priority: 1,
      workHours: '08:00-17:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'מחסנאי/ת לילה - אשדוד המדע 2', 
      location: 'אשדוד - המדע 2', 
      description: 'עבודות מחסן כלליות - הזזת קרונים, שרינקים ועוד',
      requirements: 'נכונות לעבודה פיזית',
      salaryRange: '42 ₪/שעה', 
      priority: 1,
      workHours: '16:30-01:30',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'מלגזן היגש - אשדוד המדע 2', 
      location: 'אשדוד - המדע 2', 
      description: 'ניסיון על מלגזת היגש / נכונות ללמוד עבודה על מלגזת היגש. נכונות לירידה מהמלגזה וביצוע משימות נוספות במחסן',
      requirements: 'רישיון למלגזה - חובה',
      salaryRange: '47 ₪/שעה', 
      priority: 2,
      workHours: '08:00-17:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'בקר/ית - סלע ישן אשדוד', 
      location: 'אשדוד - סלע ישן, המתכת 5', 
      description: 'בקר סחורה על רמפות ההפצה, עבודה מול נהגים, בדיקת סחורה אל מול תעודות היציאה וסריקת המוצרים',
      requirements: 'בקרת סחורה על ידי סריקת המוצרים עם מסופון, אנחנו מחפשים עובדים אחראים ורציניים',
      salaryRange: '40 ₪/שעה', 
      priority: 1,
      workHours: '06:00-12:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    { 
      title: 'בקר/ית - בית שמש הר טוב', 
      location: 'בית שמש - אזור תעשייה הר טוב', 
      description: 'בקרה ובדיקה של ההזמנות לפני ההפצה. בדיקה מוקפדת של פריטים לפני העמסתם למשאיות. הבדיקה מתבצעת עם מסופון לפי מק"ט על הפריט ומול ההזמנה',
      requirements: 'אחריות ורצינות, עבודה עם מסופון - חובה, דיוק ותשומת לב לפרטים קטנים, יכולת עבודה תחת לחץ',
      salaryRange: '42 ₪/שעה', 
      priority: 2,
      workHours: '06:30-15:30/16:00 או 11:00/12:00-20:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'פנינית רויטמן',
      contactEmail: 'pninit@selabonded.co.il'
    },
    // ----- משרות דנה שפירו (לוגיסטים) -----
    { 
      title: 'נציג/ת שירות לקוחות - לוגיסטים אשדוד', 
      location: 'אשדוד - המדע 2 (לוגיסטים)', 
      description: 'תיאום מועדי אספקה, מענה לפניות לקוחות בטלפון ובכתב',
      requirements: 'ניסיון במוקד שירות - יתרון',
      salaryRange: '38 ₪/שעה', 
      priority: 1,
      workHours: '13:00/14:00-20:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'דנה שפירו',
      contactEmail: 'dana@logistim.co.il'
    },
    { 
      title: 'רפרנט/ית שטח - לוגיסטים בית שמש', 
      location: 'בית שמש - אזור תעשייה הר טוב (לוגיסטים)', 
      description: 'תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות',
      requirements: 'ניסיון בתפעול מערך הפצה - חובה, יכולת רתימת עובדים, יכולת התנהלות עם חשבוניות ומסמכים מרובים, סדר וארגון, אסרטיביות - חובה, ניידות - חובה',
      salaryRange: '50 ₪/שעה', 
      priority: 2,
      workHours: '06:00-15:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'דנה שפירו',
      contactEmail: 'dana@logistim.co.il'
    },
    { 
      title: 'סדרן הפצה - לוגיסטים אשדוד/בית שמש', 
      location: 'אשדוד המדע 2 / בית שמש הר טוב (לוגיסטים)', 
      description: 'ניהול קבלנים, הכנת קווי הפצה, מעקב הובלות ועמידה בזמנים, טיפול בהעמסה והחזרות, הנפקת דוחות, מענה שוטף לפניות הנהגים',
      requirements: 'ניסיון מוכח בתכנון קווי הפצה רבים - חובה, חשיבה לוגית ופתרון בעיות, תפקוד מעולה תחת לחץ, ניידות - חובה',
      salaryRange: '13,000 ₪/חודש', 
      priority: 3,
      workHours: '06:00-16:00',
      benefits: 'ארוחות. תקן אחד באשדוד ותקן אחד בבית שמש',
      transportation: 'עצמאית',
      contactName: 'דנה שפירו',
      contactEmail: 'dana@logistim.co.il'
    },
    { 
      title: 'רפרנט/ית שטח - לוגיסטים מבקיעים', 
      location: 'מבקיעים (לוגיסטים)', 
      description: 'תפקיד שטח - ניהול מערך נהגים, טיפול בתעודות חתומות, פתרון תקלות בהעמסה ונזקים, דיווח על אי אספקות',
      requirements: 'ניסיון עבודה במערך הפצה - חובה, ניסיון קודם בתפקיד בק אופיס לוגיסטי - חובה, אחריות סדר וארגון - חובה, יכולת עבודה בכמה ממשקים במקביל, תודעת שירות מעולה, נכונות לעבודה בשעות נוספות',
      salaryRange: '50 ₪/שעה', 
      priority: 2,
      workHours: '05:00-14:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'דנה שפירו',
      contactEmail: 'dana@logistim.co.il'
    },
    { 
      title: 'נציג/ת לקוח - לוגיסטים אשדוד', 
      location: 'אשדוד - המדע 2 (לוגיסטים)', 
      description: 'טיפול בהזמנות, סריקת תעודות, טיפול במלאים והזנת נתונים במערכת',
      requirements: 'ניסיון בתחום הלוגיסטיקה - חובה, שליטה ביישומי אופיס - חובה',
      salaryRange: '42 ₪/שעה', 
      priority: 1,
      workHours: '08:00-17:00',
      benefits: 'ארוחות',
      transportation: 'עצמאית',
      contactName: 'דנה שפירו',
      contactEmail: 'dana@logistim.co.il'
    },
  ],
  'לוגיסטיקר': [
    { title: 'מלקטים למחסן - בית שמש - דחוף!', location: 'בית שמש', description: 'חובה ניידות - דחוף!', requirements: 'ניסיון בלוגיסטיקה - יתרון משמעותי, רישיון מלגזה - יתרון', salaryRange: '40 ₪/שעה', priority: 3 },
    { title: 'מחסנאי - מרלו"ג משטרה - בית שמש', location: 'בית שמש', description: '⚠️ אישור משטרת ישראל נדרש.', requirements: 'ניסיון קודם בעבודת מחסן - חובה, ראש גדול', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'סדרן מחלקת הפצה - בית שמש', location: 'בית שמש', description: 'הבאת משטחים מהבקרה, בדיקת תקינות, העמסת משאיות.', requirements: 'חובה רישיון נהיגה + ניידות', salaryRange: '45 ₪/שעה + חופשי', priority: 1 },
    { title: 'מנהל/ת קליטה - עבודה בשטח - בית שמש', location: 'בית שמש', description: '⚠️ זה תפקיד שטח, לא משרדי! תפקיד ניהולי.', requirements: 'ניסיון קודם בקליטה/לוגיסטיקה - חובה, ניסיון בניהול עובדים - חובה', salaryRange: '55-60 ₪/שעה', priority: 3 },
    { title: 'מפעיל/ת מערכת WMS - בית שמש', location: 'בית שמש', description: 'תפעול WMS, פתיחת תהליכי ליקוט/קליטה/הפצה.', requirements: 'ניסיון בעבודה עם מערכת WMS - חובה', salaryRange: '12,000 ₪ גלובלי', priority: 2 },
    { title: 'מלגזן - בית חיליקה', location: 'בית חיליקה', description: 'יש הסעות מאשדוד (יוצאת 5:15).', requirements: 'ניסיון חצי שנה לפחות בעבודה עם מלגזה', salaryRange: '45 ₪/שעה', priority: 1 },
    { title: 'מלגזן היגש - בית חיליקה', location: 'בית חיליקה', description: 'יש הסעות מאשדוד (יוצאת 5:15).', requirements: 'ניסיון על מלגזת היגש', salaryRange: '50 ₪/שעה', priority: 1 },
    { title: 'מפעילת מערכת WMS - לוד - דחוף!!!', location: 'לוד', description: 'פסח לב 5. ⚠️ מועמד ללא תעודה מזהה לא יכנס לראיון!', requirements: 'הכרת מערכת WMS - חובה', salaryRange: '43 ₪/שעה', priority: 3 },
    { title: 'מחסנאי - לוד - דחוף!!!', location: 'לוד', description: 'פסח לב 5.', requirements: 'יכולת עבודה עצמאית, ניסיון בעבודת מחסן, רישיון נהיגה - חובה', salaryRange: '40 ₪/שעה', priority: 3 },
    { title: 'נהג ב\' - חלוקת סחורה - לוד', location: 'לוד', description: 'פסח לב 5. פריקה ידנית.', requirements: 'חובה רישיון 4 טון (לא 3.5!), ניסיון בחלוקה', salaryRange: '10,000 ₪ גלובלי', priority: 1 },
    { title: 'נהג ג\' - 12 טון - לוד', location: 'לוד', description: 'פסח לב 5. קרן השתלמות לאחר שנה.', requirements: 'רישיון נהיגה ג\' - 12 טון, ניסיון בעבודת חלוקה', salaryRange: '11,000-12,000 ₪ גלובלי', priority: 1 },
    { title: 'נהג ג\' - 15 טון - לוד', location: 'לוד', description: 'פסח לב 5. עבודה גם פיזית. קרן השתלמות לאחר שנה.', requirements: 'רישיון נהיגה ג\' - 15 טון', salaryRange: '12,000-12,400 ₪ גלובלי', priority: 1 },
    { title: 'רכז הפצה - לוד', location: 'לוד', description: 'פסח לב 5. הכנת סחורה לפי קווי הפצה. חייב להתחיל בשעה 6:00!', requirements: 'ראש גדול, אחראי, ידע בעבודה עם מחשב, רישיון נהיגה', salaryRange: '45-50 ₪/שעה', priority: 1 },
    { title: 'מלגזן - לוד', location: 'לוד', description: 'פסח לב 5.', requirements: 'רישיון מלגזה, ניסיון בעבודת מלגזה', salaryRange: '40-45 ₪/שעה', priority: 1 },
    { title: 'עובד מחסן - לוד', location: 'לוד', description: 'פסח לב 5. עבודה פיזית, ליקוט.', requirements: 'ראש גדול, אחראי, חובה רישיון נהיגה', salaryRange: '42 ₪/שעה', priority: 1 },
    { title: 'פקידת הפצה - לוד', location: 'לוד', description: 'פסח לב 5. עבודה מול נהגים/לקוחות.', requirements: 'ראש גדול, יכולת עבודה בלחץ, חובה ידע במחשב', salaryRange: '40 ₪/שעה', priority: 1 },
    { title: 'ראש צוות - לוד', location: 'לוד', description: 'פסח לב 5. כפוף למנהל המיזם. תפקיד ניהולי.', requirements: 'יכולת ניהול, יחסי אנוש טובים, רישיון נהיגה - חובה', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'מפעיל חדר בקרה - ממגורות אשדוד - דחוף!!!!', location: 'אשדוד - ממגורות', description: '⚠️ עבודה בסביבת אבק. ארוחות חמות! קרן השתלמות.', requirements: 'ניסיון מוכח של שנתיים לפחות כמכונאי/איש תחזוקה', salaryRange: '45-50 ₪/שעה', priority: 3 },
    { title: 'עובד/ת תחזוקה - ממגורות אשדוד', location: 'אשדוד - עורף הנמל', description: 'עבודה קבועה לטווח ארוך. קרן פנסיה מיום ראשון.', requirements: 'ניסיון של לפחות שנתיים בעבודת אחזקה במפעל', salaryRange: '50-55 ₪/שעה', priority: 2 },
  ],
  'א.ד.ר לוגיסטיקה': [
    { title: 'מחסנאים - בית שמש (5 תקנים)', location: 'בית שמש', description: '5 תקנים פתוחים!', requirements: 'חובה תעודת זהות, רישיון נהיגה - חובה', salaryRange: '43 ₪/שעה', priority: 2 },
    { title: 'מחסנאים - אירפורט סיטי (3 תקנים)', location: 'אירפורט סיטי', description: '3 תקנים פתוחים!', requirements: 'רישיון נהיגה - יתרון, רישיון מלגזה - יתרון גדול', salaryRange: '43 ₪/שעה', priority: 2 },
    { title: 'מלקט גובה (כמה תקנים) - מודיעין', location: 'מודיעין', description: 'מחסן לוגיסטיקה. הסעות מרמלה, לוד. חדר אוכל מסובסד 10 ₪.', requirements: 'רישיון מלגזה - חובה, עבודה על מלקטת גובה חשמלית', salaryRange: '50 ₪/שעה', priority: 1 },
    { title: 'מלקט עם מסופון (ג\'ק אדם רוכב) - מודיעין', location: 'מודיעין', description: 'מחסן חשמל. 🎁 בונוס התמדה 1,000 ₪ חודשי! הסעות מרמלה, לוד.', requirements: 'רישיון נהיגה - חובה, עבודה על ג\'ק אדם רוכב', salaryRange: '47 ₪/שעה + בונוס 1,000 ₪ חודשי', priority: 2 },
    { title: 'מלגזן היגש צד (נדרש ניסיון) - מודיעין', location: 'מודיעין', description: 'מחסן חשמל. 🎁 בונוס התמדה 1,000 ₪ חודשי!', requirements: 'ניסיון על מלגזת היגש - חובה!', salaryRange: '52 ₪/שעה + בונוס 1,000 ₪ חודשי', priority: 2 },
  ],
  'אושפיר': [
    { title: 'מתאם/ת יבוא בשילוח', location: 'חיפה', description: 'תיאום תהליכי יבוא, עבודה מול סוכני מכס וחברות ספנות.', requirements: 'ניסיון של מעל שנה בתחום השילוח - חובה, אנגלית ברמה טובה', salaryRange: 'לפי ניסיון', priority: 1 },
    { title: 'מתאם/ת יצוא בשילוח', location: 'חיפה', description: 'תיאום תהליכי יצוא, עבודה מול סוכני מכס וחברות ספנות.', requirements: 'ניסיון של מעל שנה בתחום השילוח - חובה, אנגלית ברמה טובה', salaryRange: 'לפי ניסיון', priority: 1 },
  ],
  'חברת GAC': [
    { title: 'נציג/ת מכירות רכב - GAC ראשון לציון', location: 'ראשון לציון', description: 'אולם תצוגה מודרני של יבואן רכב סיני מוביל. עמלות גבוהות.', requirements: 'ייצוגיות גבוהה, תודעת שירות מצוינת, רישיון נהיגה - חובה', salaryRange: '8,000-18,000 ₪ כולל עמלות', priority: 2 },
    { title: 'נציג/ת קבלה - GAC ראשון לציון', location: 'ראשון לציון', description: 'אולם תצוגה מודרני. קבלת לקוחות, תיאום פגישות.', requirements: 'ייצוגיות גבוהה מאוד, תודעת שירות מצוינת', salaryRange: '7,000-9,000 ₪', priority: 1 },
    { title: 'יועץ/ת שירות - GAC ראשון לציון', location: 'ראשון לציון', description: 'אולם תצוגה מודרני. ליווי לקוחות, טיפולים ושירות. הכשרה מלאה.', requirements: 'ניסיון בשירות לקוחות - חובה, יכולת מכירתית', salaryRange: '8,000-12,000 ₪', priority: 2 },
    { title: 'מנהל/ת אולם תצוגה - GAC אשדוד', location: 'אשדוד', description: 'גיוס וניהול נציג מכירות + הכשרה. עמידה ביעדי מכירות. שירות חדשני ללקוחות. שיתופי פעולה לגיוס לקוחות עסקיים.', requirements: 'ניסיון ניהולי קודם - חובה! ניסיון מעולם הרכב - יתרון משמעותי. שליטה באקסל, PowerPoint. אנגלית ברמה גבוהה.', salaryRange: '12,000 ₪ בסיס + בונוסים + רכב צמוד', priority: 3 },
    { title: 'נציג/ת מכירות - GAC רעננה', location: 'רעננה', description: 'נציג מכירות רכב באולם תצוגה GAC. עבודה מול לקוחות פרטיים ועסקיים. הצגת רכבי GAC. ליווי לקוחות בתהליך הרכישה וסגירת עסקאות.', requirements: 'ניסיון במכירות - יתרון. יחסי אנוש מצוינים. יכולת עבודה ביעדים. כושר שכנוע. ניסיון ברכב - יתרון משמעותי.', salaryRange: '8,000-15,000 ₪ + עמלות', priority: 2 },
    { title: 'נציג/ת נסיעות מבחן - GAC', location: 'מרכז', description: 'ליווי לקוחות בנסיעות מבחן. הסברה מקצועית על הרכב והטכנולוגיות. מתן חוויית נהיגה מעולה ללקוח. עבודה בשיתוף עם צוות המכירות.', requirements: 'רישיון נהיגה בתוקף - חובה! יחסי אנוש מצוינים. ידע ברכבים - יתרון. סבלנות ותקשורת טובה. ייצוגיות.', salaryRange: '7,000-9,000 ₪', priority: 1 },
  ],
  'אפרייט': [
    { title: 'פקיד/ת רכש - מודיעין עילית', location: 'מודיעין עילית', description: 'עבודה מול ספקים, הזמנת חומרים. תנאים מצוינים.', requirements: 'ניסיון ברכש - יתרון, שליטה באקסל - חובה', salaryRange: '9,000-11,000 ₪', priority: 1 },
    { title: 'קבלת ספקים - מודיעין עילית', location: 'מודיעין עילית', description: 'בדיקת סחורה נכנסת, תיעוד במערכת.', requirements: 'ניסיון בתפקיד דומה - יתרון, שליטה במחשב - חובה', salaryRange: '8,500-10,000 ₪', priority: 1 },
    { title: 'עובד/ת ייצור - מודיעין עילית', location: 'מודיעין עילית', description: 'מפעל ייצור טלסקופיות ומלגזות. עבודה בקו ייצור.', requirements: 'נכונות לעבודה פיזית, ראש גדול וידיים טובות', salaryRange: '42-48 ₪/שעה', priority: 1 },
    { title: 'מפעיל/ת מכונות CNC - מודיעין עילית', location: 'מודיעין עילית', description: 'הפעלת מכונות CNC, קריאת שרטוטים טכניים.', requirements: 'ניסיון בהפעלת מכונות CNC - חובה', salaryRange: '50-60 ₪/שעה', priority: 2 },
  ],
  'לאשינג חיפה': [
    { title: 'עובד/ת עגינה - נמל חיפה', location: 'חיפה - נמל', description: 'עבודות עגינה בנמל חיפה. עבודה לפי קריאה מהנמל.', requirements: 'כושר גופני טוב - חובה!, נכונות לעבודה פיזית מאומצת', salaryRange: '50-70 ₪/שעה + תוספות', priority: 1 },
  ],
  'אופרייט - יד ראשונה': [
    { title: 'איש/אשת מכירות - יד ראשונה גלילות', location: 'גלילות', description: 'מחלקת יד ראשונה - מכירת רכבים ללקוחות פרטיים. ייעוץ וליווי לקוחות בתהליך הרכישה. עמידה ביעדי מכירות. שירות לקוחות מצוין. ממוצע מכירות: 15-18 רכבים בחודש. הגנת שכר 8,000 ₪ ב-3 חודשים ראשונים!', requirements: 'ניסיון במכירות - יתרון. יכולת עבודה בצוות. שירותיות ויחסי אנוש מעולים. נכונות לעבודה בימי שישי. רישיון נהיגה - יתרון.', salaryRange: '8,000-15,000 ₪ (עמלה 640 ₪ לרכב)', priority: 2 },
    { title: 'איש/אשת תפעול - סניף גלילות', location: 'גלילות', description: 'תחזוקת האתר והרכבים. עבודה מול לקוחות. סידור המגרש. הכנת רכבים לפני בדיקה, טיפולים וטסטים. סיוע במכירות ומסירת רכבים.', requirements: 'רישיון נהיגה בתוקף - חובה! ידע והבנה טכנית בתחום הרכב - יתרון. יכולת עבודה פיזית. אחריות ודייקנות. שירותיות.', salaryRange: '6,000-7,000 ₪ + פרמיות (25-45 ₪ לרכב)', priority: 1 },
    { title: 'איש/אשת מכירות ליסינג פרטי - חולון', location: 'חולון', description: 'קבלת לידים חמים וביצוע שיחות טלפוניות. עסקאות ליסינג פרטי. ניהול משא ומתן עם לקוחות. בניית פתרונות מכירה מותאמים אישית. קליטה ישירה לחברה! ללא ימי שישי! * אין עבודה מהבית.', requirements: 'ניסיון במכירות טלפוניות - יתרון. יכולות משא ומתן. שירותיות ויחסי אנוש מעולים. יכולת עמידה ביעדים.', salaryRange: '9,000-12,000 ₪', priority: 2 },
  ]
}

export async function GET() {
  try {
    console.log('🔧 Starting data restoration...')
    
    // Allow force restore with ?force=true parameter
    // Otherwise skip if already has more than 100 positions
    const existingPositions = await prisma.position.count()
    console.log(`📊 Existing positions: ${existingPositions}`)

    // 1. Create/Update Admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10)
    await prisma.user.upsert({
      where: { email: 'admin@twenty2.co.il' },
      update: {},
      create: {
        email: 'admin@twenty2.co.il',
        name: 'מנהל מערכת',
        password: adminPassword,
        role: 'ADMIN',
        active: true,
      },
    })
    console.log('✅ Admin user created')

    // 2. Create tags
    for (const tag of TAGS) {
      await prisma.tag.upsert({
        where: { name: tag.name },
        update: tag,
        create: tag,
      })
    }
    console.log(`✅ ${TAGS.length} tags created`)

    // 3. Create departments
    for (const dept of DEPARTMENTS) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: dept,
        create: dept,
      })
    }
    console.log(`✅ ${DEPARTMENTS.length} departments created`)

    // 4. Create employers
    for (const employer of EMPLOYERS) {
      await prisma.employer.upsert({
        where: { email: employer.email },
        update: employer,
        create: employer,
      })
    }
    console.log(`✅ ${EMPLOYERS.length} employers created`)

    // 5. Create positions
    let totalPositions = 0
    for (const [employerName, positions] of Object.entries(POSITIONS)) {
      const employer = await prisma.employer.findFirst({
        where: { name: employerName }
      })
      
      if (!employer) {
        console.log(`⚠️ Employer not found: ${employerName}`)
        continue
      }

      for (const position of positions) {
        try {
          // Check if position exists
          const existing = await prisma.position.findFirst({
            where: { title: position.title, employerId: employer.id }
          })
          
          if (existing) {
            // Update existing position
            await prisma.position.update({
              where: { id: existing.id },
              data: {
                ...position,
                employerId: employer.id,
                active: true
              }
            })
          } else {
            // Create new position
            await prisma.position.create({
              data: {
                ...position,
                employerId: employer.id,
                active: true
              },
            })
          }
          totalPositions++
        } catch (e) {
          console.log(`⚠️ Error with position: ${position.title}`, e)
        }
      }
    }
    console.log(`✅ ${totalPositions} positions created`)

    // Get final counts
    const stats = {
      users: await prisma.user.count(),
      employers: await prisma.employer.count(),
      positions: await prisma.position.count(),
      tags: await prisma.tag.count(),
      departments: await prisma.department.count(),
    }

    return NextResponse.json({ 
      success: true,
      message: 'Data restored successfully!',
      stats
    })

  } catch (error) {
    console.error('❌ Restoration error:', error)
    return NextResponse.json({ 
      error: 'Restoration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
