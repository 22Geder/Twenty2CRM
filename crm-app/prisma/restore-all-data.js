const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ========================================================================
// כל המעסיקים
// ========================================================================
const EMPLOYERS = [
  {
    name: 'בנק מזרחי טפחות',
    email: 'orpazsm@gmail.com',
    phone: '050-1234567',
    description: 'בנק מזרחי טפחות - מרחבים: מרכז, דן, יהודה, LIVE, דרום, צפון, שרון. איש קשר: סמדר אורפז'
  },
  {
    name: 'קבוצת UNION',
    email: 'union@union.co.il',
    phone: '',
    description: '🔥 לקסוס, טויוטה, Geely. בונוס 1,000 ₪ H&M למגייס!'
  },
  {
    name: 'YES',
    email: 'yes@yes.co.il',
    phone: '',
    description: '🎯 חטיבת לקוחות עסקיים, מוקדי מכירות ושירות. נשר, ב"ש, כפר סבא. בונוסים עד 10K!'
  },
  {
    name: 'סלע לוגיסטיקה',
    email: 'sela@sela.co.il',
    phone: '',
    description: '📦 מחסנים והפצה. אשדוד, בית שמש, חפץ חיים. שכר 38-55 ₪/שעה. אנשי קשר: Pninit Roitman, Dana Shapiro'
  },
  {
    name: 'לוגיסטיקר',
    email: 'logisticar@logisticar.co.il',
    phone: '',
    description: '🚛 מחסנים, הפצה, נהגים. בית שמש, לוד, אשדוד, בית חיליקה. שכר 40-60 ₪/שעה. נהגים עד 12,400 ₪!'
  },
  {
    name: 'א.ד.ר לוגיסטיקה',
    email: 'adr@adr.co.il',
    phone: '',
    description: '🎁 בית שמש, אירפורט סיטי, מודיעין. בונוס התמדה 1,000 ₪ חודשי! שכר 43-52 ₪/שעה. איש קשר: ירין יחזקאל'
  },
  {
    name: 'אושפיר',
    email: 'oshpir@oshpir.co.il',
    phone: '',
    description: '🚢 שילוח בינלאומי - חיפה. מתאם/ת יבוא + מתאם/ת יצוא. נדרש ניסיון + אנגלית. איש קשר: ריקי כהן'
  },
  {
    name: 'חברת GAC',
    email: 'gac@gac.co.il',
    phone: '03-1234567',
    description: '🚗 יבואן רכב סיני מוביל - מותגי GAC. מכירות רכב, שירות לקוחות, נציגי קבלה.'
  },
  {
    name: 'אפרייט',
    email: 'upright@upright.co.il',
    phone: '',
    description: '🏗️ ייצור טלסקופיות ומלגזות. עבודות משרדיות (רכש, קבלת ספקים) + עובדי ייצור. מודיעין עילית.'
  },
  {
    name: 'לאשינג חיפה',
    email: 'lashing@lashing.co.il',
    phone: '',
    description: '🚢 עבודות עגינה בנמל חיפה.'
  }
];

// ========================================================================
// כל התגיות
// ========================================================================
const TAGS = [
  // כישורי טכנולוגיה
  { name: 'JavaScript', color: '#f7df1e', category: 'skill', type: 'SKILL' },
  { name: 'TypeScript', color: '#3178c6', category: 'skill', type: 'SKILL' },
  { name: 'React', color: '#61dafb', category: 'skill', type: 'SKILL' },
  { name: 'Node.js', color: '#339933', category: 'skill', type: 'SKILL' },
  { name: 'Python', color: '#3776ab', category: 'skill', type: 'SKILL' },
  { name: 'Java', color: '#007396', category: 'skill', type: 'SKILL' },
  { name: 'C#', color: '#239120', category: 'skill', type: 'SKILL' },
  { name: 'SQL', color: '#cc2927', category: 'skill', type: 'SKILL' },
  { name: 'MongoDB', color: '#47a248', category: 'skill', type: 'SKILL' },
  { name: 'AWS', color: '#ff9900', category: 'skill', type: 'SKILL' },
  { name: 'Azure', color: '#0089d6', category: 'skill', type: 'SKILL' },
  { name: 'Docker', color: '#2496ed', category: 'skill', type: 'SKILL' },
  { name: 'Kubernetes', color: '#326ce5', category: 'skill', type: 'SKILL' },
  
  // ניסיון תפקידי
  { name: 'מפתח Full Stack', color: '#8b5cf6', category: 'role', type: 'CATEGORY' },
  { name: 'מפתח Frontend', color: '#3b82f6', category: 'role', type: 'CATEGORY' },
  { name: 'מפתח Backend', color: '#10b981', category: 'role', type: 'CATEGORY' },
  { name: 'DevOps', color: '#f59e0b', category: 'role', type: 'CATEGORY' },
  { name: 'QA Engineer', color: '#ef4444', category: 'role', type: 'CATEGORY' },
  { name: 'UI/UX Designer', color: '#ec4899', category: 'role', type: 'CATEGORY' },
  { name: 'Product Manager', color: '#6366f1', category: 'role', type: 'CATEGORY' },
  { name: 'Data Analyst', color: '#14b8a6', category: 'role', type: 'CATEGORY' },
  
  // רמות ניסיון
  { name: 'Junior (0-2 שנים)', color: '#84cc16', category: 'experience', type: 'CATEGORY' },
  { name: 'Mid-Level (2-5 שנים)', color: '#eab308', category: 'experience', type: 'CATEGORY' },
  { name: 'Senior (5+ שנים)', color: '#f97316', category: 'experience', type: 'CATEGORY' },
  { name: 'Team Lead', color: '#dc2626', category: 'experience', type: 'CATEGORY' },
  
  // תחומי עניין
  { name: 'Fintech', color: '#059669', category: 'industry', type: 'CATEGORY' },
  { name: 'Healthcare', color: '#dc2626', category: 'industry', type: 'CATEGORY' },
  { name: 'E-commerce', color: '#ea580c', category: 'industry', type: 'CATEGORY' },
  { name: 'Gaming', color: '#8b5cf6', category: 'industry', type: 'CATEGORY' },
  { name: 'Cybersecurity', color: '#0f172a', category: 'industry', type: 'CATEGORY' },
  
  // כישורים רכים
  { name: 'עבודת צוות', color: '#06b6d4', category: 'soft-skill', type: 'SKILL' },
  { name: 'הובלה', color: '#a855f7', category: 'soft-skill', type: 'SKILL' },
  { name: 'תקשורת', color: '#22c55e', category: 'soft-skill', type: 'SKILL' },
  { name: 'יזמות', color: '#f59e0b', category: 'soft-skill', type: 'SKILL' },
  
  // שפות
  { name: 'עברית - שפת אם', color: '#3b82f6', category: 'language', type: 'SKILL' },
  { name: 'אנגלית - שפת אם', color: '#dc2626', category: 'language', type: 'SKILL' },
  { name: 'רוסית', color: '#0369a1', category: 'language', type: 'SKILL' },
  { name: 'ערבית', color: '#16a34a', category: 'language', type: 'SKILL' },
  
  // סטטוס מיוחד
  { name: 'מועמד מועדף', color: '#fbbf24', category: 'status', type: 'CATEGORY' },
  { name: 'דחיפות גבוהה', color: '#ef4444', category: 'status', type: 'CATEGORY' },
  { name: 'מומלץ על ידי עובד', color: '#10b981', category: 'status', type: 'CATEGORY' },
  
  // תגיות גיוס
  { name: 'לוגיסטיקה', color: '#f97316', category: 'industry', type: 'CATEGORY' },
  { name: 'מחסנים', color: '#84cc16', category: 'industry', type: 'CATEGORY' },
  { name: 'נהגים', color: '#3b82f6', category: 'industry', type: 'CATEGORY' },
  { name: 'בנקאות', color: '#8b5cf6', category: 'industry', type: 'CATEGORY' },
  { name: 'מכירות', color: '#ef4444', category: 'industry', type: 'CATEGORY' },
  { name: 'שירות לקוחות', color: '#06b6d4', category: 'industry', type: 'CATEGORY' },
  { name: 'רכב', color: '#f59e0b', category: 'industry', type: 'CATEGORY' },
];

// ========================================================================
// כל המשרות
// ========================================================================
const POSITIONS = {
  'בנק מזרחי טפחות': [
    // מרחב מרכז
    { title: 'טלר בסניף חצרות יפו', location: 'תל אביב - יפו', description: 'סניף רצוף, תקן קבוע. מענק התמדה מוגדל 13,000 ₪.', requirements: 'תודעת שירות גבוהה, עדיפות לתואר בכלכלה/מנה"ס, ניסיון בשירות/מכירה - יתרון', salaryRange: '8,200 ₪ חודשי, 9,500 ₪ שנתי', priority: 1 },
    { title: 'טלר בסניף קרית עתידים - דחוף!!!', location: 'תל אביב - רמת החייל', description: 'דחוף!!! טלר יחיד בסניף. סניף רצוף, תקן קבוע.', requirements: 'זמינות מיידית לעבודה - ללא אילוצים! יכולות גבוהות נדרשות.', salaryRange: '8,200 ₪ + מענק 13,000 ₪', priority: 3 },
    { title: 'טלר במרכז עסקים ת"א', location: 'תל אביב', description: 'סניף רצוף + תורנות בימי ו\'. תקן קבוע.', requirements: 'מקצועיות ודייקנות, תודעת שירות', salaryRange: '8,200 ₪ + מענק 13,000 ₪', priority: 1 },
    { title: 'טלר 50% במרכז עסקים ת"א - לסטודנטים', location: 'תל אביב', description: 'סניף רצוף, זמינות ליומיים וחצי - שלושה ימים בשבוע. מתאים לסטודנטים.', requirements: 'לציין ימי ושעות לימודים!', salaryRange: 'יחסי + מענק התמדה', priority: 1 },
    { title: 'טלר בסניף סקיי טאוור', location: 'תל אביב', description: 'סניף רצוף, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪ + מענק 13,000 ₪', priority: 1 },
    { title: 'טלר במרכז עסקים המגדל בבורסה', location: 'רמת גן', description: 'סניף רצוף, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪, שנתי 9,500 ₪, מענק 7,000 ₪', priority: 1 },
    { title: 'טלר מתנייד - ת"א, ר"ג, בת ים', location: 'מרכז - התניידות', description: 'תקן קבוע. התניידות בין הסניפים. ניתן להפנות גם מועמדים שלא זמינים למשרה מלאה - מינימום 3 ימים מלאים בשבוע.', requirements: 'גמישות, תודעת שירות', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'בנקאי מתנייד במשרה מלאה', location: 'מרכז - ת"א, ר"ג, בת ים', description: 'תקן קבוע. עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך.', requirements: 'ניסיון בבנקאות/שירות', salaryRange: '8,400-9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי במרכז עסקים המגדל בבורסה', location: 'רמת גן', description: 'סניף רצוף, החלפת חל"ד - קליטה בתקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '8,400 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי בסניף סקיי טאוור', location: 'תל אביב', description: 'סניף רצוף, החלפת חל"ד - קליטה בתקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: 'עד 10,000 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי משכנתאות בסניף חשמונאים', location: 'תל אביב', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תואר פיננסי - חובה! ניסיון במכירות ושירות, יכולת מכירתית גבוהה וניהול מו"מ, סדר וארגון', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 2 },
    { title: 'בנקאי משכנתאות בסניף בת ים', location: 'בת ים', description: 'סניף מפוצל, החלפת חל"ד - קליטה בתקן קבוע.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות במרכז עסקים ת"א', location: 'תל אביב', description: 'סניף רצוף, תקן קבוע.', requirements: 'ניסיון בשירות לקוחות', salaryRange: 'עד 10,000 ₪ + קרן השתלמות', priority: 1 },
    // מרחב דן
    { title: 'טלר בסניף לב העיר פ"ת', location: 'פתח תקווה', description: 'סניף מפוצל, החלפת חל"ד - קליטה בתקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪, שנתי 10,700 ₪', priority: 1 },
    { title: 'טלר בסניף כפר קאסם', location: 'כפר קאסם', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר מתנייד במרחב דן', location: 'חולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין', description: 'תקן קבוע. עבודה בסניפים רצופים או מפוצלים לפי הצורך.', requirements: 'גמישות, התניידות רחבה', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'בנקאי לקוחות בסניף קרית אילון', location: 'חולון', description: 'סניף מפוצל ב\'-ו\', תקן קבוע.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף לב העיר פ"ת', location: 'פתח תקווה', description: 'סניף מפוצל, החלפת חל"ד.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף קרית אונו', location: 'קרית אונו', description: 'סניף מפוצל ב\'-ו\', תקן זמני.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף גלובל טאוורס', location: 'פתח תקווה', description: 'סניף מפוצל, תקן קבוע.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי לקוחות בסניף בני ברק', location: 'בני ברק', description: 'סניף מפוצל, תקן זמני. רח\' ירושלים.', requirements: 'ניסיון בשירות לקוחות', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי בסניף בר אילן', location: 'רמת גן', description: 'סניף מפוצל, תקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    // מרחב יהודה
    { title: 'טלר מתנייד באזור ירושלים', location: 'ירושלים - כל הסניפים', description: 'כרגע פתוחה משרה ב-40-50%. מתאים לסטודנטים. בהמשך ישתבצו בסניף קבוע (בד"כ תוך שנה).', requirements: 'גמישות לעבודה בסניפים רצופים ומפוצלים', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'בנקאי משכנתאות מרחבי - ירושלים', location: 'ירושלים - התניידות', description: 'עבודה בעיקר בסניפים מפוצלים, החלפת חל"ד.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי משכנתאות במ"ע ירושלים', location: 'ירושלים', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי עסקי בסניף קש"ת (אירפורט סיטי)', location: 'קרית שדה התעופה', description: 'סניף רצוף, תקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '8,400 ₪, שנתי 9,800 ₪ + קרן השתלמות', priority: 1 },
    { title: 'בנקאי משכנתאות בסניף מודיעין', location: 'מודיעין', description: 'סניף מפוצל ב\'-ו\', החלפת חל"ד.', requirements: 'תואר פיננסי - חובה!', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    // מרחב LIVE
    { title: 'בנקאי דיגיטלי - סניפי LIVE', location: 'לוד - אזור התעשיה הצפוני (מט"ל)', description: 'כל המשרות להחלפת חל"ד אבל קליטה בתקן קבוע. סניפי הלייב פועלים 07:00-20:00. משמרת = 8 שעות. 5 פעמים בשבוע. חדר אוכל וחדר כושר.', requirements: 'ניסיון בשירות ו/או מכירות - חובה! חובה 2 משמרות ערב בשבוע. מתאים לתושבי: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד', salaryRange: '9,700 ₪ חודשי, 11,100 ₪ שנתי', priority: 2 },
    // מרחב דרום
    { title: 'טלר בסניף ערד', location: 'ערד', description: 'סניף מפוצל, תקן קבוע.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪ + מענק 7,000 ₪', priority: 1 },
    { title: 'טלר בסניף א.ת ראשל"צ', location: 'ראשון לציון', description: 'סניף רצוף, החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪', priority: 1 },
    { title: 'טלר בסניף רחובות', location: 'רחובות', description: 'סניף מפוצל, החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר בסניף דימונה', location: 'דימונה', description: 'סניף מפוצל, החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר מתנייד - שפלה', location: 'ראשל"צ, רחובות, נס ציונה, יבנה', description: 'תקן זמני, רובם סניפים מפוצלים.', requirements: 'גמישות, התניידות', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
    { title: 'טלר מתנייד - נגב', location: 'באר שבע, ערד, דימונה (+ אופקים, נתיבות במידת הצורך)', description: 'תקן קבוע, רובם סניפים מפוצלים.', requirements: 'נכונות להגיע גם לאופקים ונתיבות במידת הצורך', salaryRange: '9,300 ₪', priority: 1 },
    // מרחב צפון
    { title: 'טלר 50% בסניף הדר חיפה - לסטודנטים', location: 'חיפה - הדר', description: 'ימי שני כולל פיצול (50% משרה). סניף מפוצל, תקן קבוע. מתאים מאוד לסטודנטים/יות.', requirements: 'זמינות לימי שני', salaryRange: 'יחסי', priority: 1 },
    // מרחב שרון
    { title: 'טלר בסניף ערים כפ"ס', location: 'כפר סבא', description: 'סניף מפוצל ב\'-ו\', החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר בסניף א.ת כפ"ס', location: 'כפר סבא', description: 'סניף רצוף, החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '8,200 ₪', priority: 1 },
    { title: 'טלר בסניף ויצמן כפ"ס', location: 'כפר סבא', description: 'סניף מפוצל, החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'בנקאי עסקי באחוזה מערב רעננה', location: 'רעננה', description: 'סניף מפוצל ב\'-ו\', תקן קבוע.', requirements: 'ניסיון בבנקאות עסקית', salaryRange: '9,600 ₪ + קרן השתלמות', priority: 1 },
    { title: 'טלר בסניף כיכר המושבה', location: 'הוד השרון', description: 'סניף מפוצל, תקן זמני.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר בסניף רמת השרון', location: 'רמת השרון', description: 'סניף מפוצל, החלפת חל"ד.', requirements: 'תודעת שירות גבוהה', salaryRange: '9,300 ₪', priority: 1 },
    { title: 'טלר מתנייד במרחב שרון דרומי', location: 'נתניה, רעננה, הרצליה, כפ"ס, רמת השרון, הוד השרון', description: 'תקן קבוע, התניידות רחבה בין הסניפים.', requirements: 'גמישות, התניידות', salaryRange: 'מותאם לסוג הסניף', priority: 1 },
  ],
  'קבוצת UNION': [
    { title: 'נציג/ת קבלה - לקסוס פתח תקווה', location: 'פתח תקווה', description: 'דיסקרטי! סיבוס 37 ₪ ליום, קה"ש מהיום הראשון 2.5%.', requirements: 'ייצוגיות גבוהה מאוד, תודעת שירות מצוינת, אנגלית ברמה טובה - יתרון', salaryRange: '6,500 ₪ + בונוסים', priority: 2 },
    { title: 'דייל/ת קבלה - לקסוס פתח תקווה', location: 'פתח תקווה', description: 'השכר עלה! סיבוס 37 ₪ ליום, קה"ש מהיום הראשון 2.5%. דיסקרטי.', requirements: 'ייצוגיות גבוהה מאוד, תודעת שירות מצוינת, ניסיון בקבלה/אירוח - יתרון', salaryRange: '9,000 ₪!', priority: 3 },
    { title: 'יועצ/ת שירות - לקסוס פתח תקווה', location: 'פתח תקווה', description: 'סיבוס 37 ₪ ליום, קה"ש מהיום הראשון 2.5%.', requirements: 'ניסיון בשירות לקוחות - חובה, יכולת מכירתית, ייצוגיות גבוהה, אוריינטציה טכנית - יתרון', salaryRange: '8,000-12,000 ₪', priority: 2 },
    { title: 'מנהל/ת אולם תצוגה - GEELY', location: 'תל אביב - יגאל אלון', description: 'מגדלי טויוטה. ניהול צוות: קבלה, נציגי מכירות, תפעול, סגנים. הובלת האולם לעמידה ביעדים.', requirements: 'ניסיון קודם בניהול מכירות - חובה (לא חובה עולם הרכב), שליטה ביישומי Office, רישיון נהיגה, ורבליים וסופר ייצוגיים', salaryRange: '13,000 ₪+ עמלות', priority: 3 },
    { title: 'מנהל/ת אולם סלקט - יד 2 לקסוס', location: 'פתח תקווה', description: 'ניהול יחידת רווח והפסד. עמידה ביעדים עסקיים ותפעוליים.', requirements: 'ניסיון מעל שנתיים בניהול אולם תצוגה בענף הרכב - חובה! יתרון לתחום יוקרה, ניסיון מסחרי, הבנה במימון', salaryRange: '13,000 ₪+ עמלות', priority: 3 },
    { title: 'יועץ/ת מכירות - טויוטה נתניה', location: 'נתניה', description: 'מכירת רכבים חדשים. בונוס 1,000 ₪ H&M למגייס!', requirements: 'ייצוגיות גבוהה, תודעת שירות, ניסיון במכירות - יתרון', salaryRange: '7,000-15,000 ₪ + עמלות', priority: 2 },
    { title: 'יועץ/ת מכירות - טויוטה ירושלים', location: 'ירושלים', description: 'מכירת רכבים חדשים. בונוס 1,000 ₪ H&M למגייס!', requirements: 'ייצוגיות גבוהה, תודעת שירות, ניסיון במכירות - יתרון', salaryRange: '7,000-15,000 ₪ + עמלות', priority: 2 },
  ],
  'YES': [
    { title: 'אחראי/ת תיק לקוח עסקי (פרואקטיב)', location: 'כפר סבא', description: 'מוקד קטן ואיכותי. עבודה עם לקוחות גדולים (מלונות, חדרי כושר). הכשרה פרטנית.', requirements: 'ניסיון של שנה לפחות בתפקידי שירות ומכירה - יתרון משמעותי, ניסיון בעבודה עם מערכות ממוחשבות - חובה, אוריינטציה מכירתית', salaryRange: '6,500 ₪ + בונוס עד 2,500 ₪ + מכירות ללא תקרה. ממוצע 8.5K', priority: 2 },
    { title: 'נציג/ת מכירות טלסל (לידים חמים)', location: 'נשר', description: 'התעשיה 8. שיחות מלקוחות שהתעניינו באתר/פייסבוק. לידים חמים!', requirements: 'אוריינטציה מכירתית - חובה, ניסיון במוקדי שירות/שימור/מכירה - יתרון משמעותי, יכולת עבודה בסביבה ממוחשבת - חובה', salaryRange: '34.30 ₪/שעה + בונוס ממוצע 2,700 ₪ ללא תקרות', priority: 2 },
    { title: 'נציג/ת מוקד מכירות (טלסל)', location: 'נשר', description: 'התעשיה 8. מכירת YES, סטינג, אינטרנט, נטפליקס, דיסני+. תחרויות עם פרסים שווים!', requirements: 'אוריינטציה מכירתית - חובה, הישגיות ותחרותיות, כושר ביטוי ויכולת שכנוע', salaryRange: '34.30 ₪/שעה + בונוס 8,000-10,000 ₪!! ללא תקרה', priority: 3 },
    { title: 'נציג/ת שירות לקוחות', location: 'נשר / באר שבע', description: 'נשר: התעשיה 8 | ב"ש: יהודה הנחתום 7. אופציה לעבודה היברידית לאחר הסמכה! תן ביס 41 ₪.', requirements: 'תודעת שירות גבוהה, יכולת עבודה בסביבה ממוחשבת, יכולת התמודדות עם לקוחות לא מרוצים', salaryRange: '34.30 ₪/שעה + בונוס עד 3,000 ₪. טווח 8-9K', priority: 1 },
    { title: 'נציג/ת תמיכה טכנית', location: 'נשר', description: 'התעשיה 8. עבודה גם בוואטסאפ! תשלום כפול על לילות/שבתות/חגים!', requirements: 'אוריינטציה טכנית, יכולת ניסוח טובה בכתב - חובה!, יכולת פתרון בעיות, זמינות למשמרות מגוונות', salaryRange: '34.30 ₪/שעה + בונוס עד 3,000 ₪. טווח 8-9K + תוספות', priority: 1 },
    { title: 'סוכן/ת מכירות שטח למגזר העסקי', location: 'אזור הצפון', description: 'רכב צמוד! סלולרי + טבלט + מחשב נייד. 10ביס. עובד חברה מיום ראשון.', requirements: 'ניסיון במכירות - חובה, הכרות עם המגזר העסקי - יתרון משמעותי, דרייב מטורף למכירות!, פרואקטיביות, נחישות, תעוזה, תחרותיות', salaryRange: '8,000 ₪ + בונוס ללא תקרה + רכב צמוד!', priority: 3 },
    { title: 'אחראי/ת תיק לקוח עסקי', location: 'כפר סבא', description: 'מוקד קטן ואיכותי (7 תקנים). סביבה צעירה ודינמית, ניהול בגובה העיניים. 40-50 שיחות ביום.', requirements: 'ניסיון של שנה לפחות בתפקידי שירות ו/או מכירה - יתרון משמעותי, ניסיון בעבודה עם מערכות ממוחשבות - חובה', salaryRange: '6,500 ₪ + בונוס עד 2,500 ₪. ממוצע 8.5K', priority: 1 },
  ],
  'סלע לוגיסטיקה': [
    { title: 'מלגזן היגש - בני דרום', location: 'בני דרום', description: 'עבודה על היגש וליקוטים. ארוחות. הסעה מאשדוד ואשקלון.', requirements: 'רישיון על מלגזה - חובה, ניסיון על מלגזת היגש - חובה, רצון לעבוד', salaryRange: '47 ₪/שעה', priority: 1 },
    { title: 'פקיד/ה מחסן - בני דרום', location: 'בני דרום', description: 'ניהול מערך אדמיניסטרטיבי של המחסן - עבודה משרדית + שטח. ארוחות.', requirements: 'יכולת ניהול שיחה ברוסית - חובה!, ניסיון קודם בתפקיד דומה - חובה, ניסיון במערכת WMS - יתרון, אקסל - חובה, ניידות - חובה', salaryRange: '42 ₪/שעה', priority: 1 },
    { title: 'פקיד/ה מלאי - חפץ חיים', location: 'חפץ חיים', description: 'הכנסת סחורה למערכות, פקידת מלאי, הדבקת מדבקות, סיווג משטחים. ארוחות חמות.', requirements: 'שליטה ביישומי מחשב - חובה, ידע במסופון - יתרון, שליטה באקסל - חובה', salaryRange: '45 ₪/שעה', priority: 1 },
    { title: 'מלקט/ת - אשדוד', location: 'אשדוד', description: 'המדע 2. ליקוט סחורה והכנת הזמנות. ארוחות.', requirements: 'נכונות למשרה מלאה, ראש גדול, ניסיון בליקוט - יתרון, עבודה עם מסופון', salaryRange: '38 ₪/שעה', priority: 1 },
    { title: 'מלגזן לילה - אשדוד', location: 'אשדוד', description: 'המדע 2. עבודות מלגזה כלליות, יש ירידה מהמלגזה.', requirements: 'רישיון למלגזה - חובה, נכונות לעבודה פיזית', salaryRange: '48 ₪/שעה', priority: 1 },
    { title: 'מלגזן היגש - אשדוד', location: 'אשדוד', description: 'המדע 2. ארוחות.', requirements: 'רישיון למלגזה - חובה, ניסיון על מלגזת היגש / נכונות ללמוד, נכונות לירידה מהמלגזה וביצוע משימות נוספות', salaryRange: '47 ₪/שעה', priority: 1 },
    { title: 'בקר/ית סחורה - אשדוד', location: 'אשדוד', description: 'המתכת 5, סלע ישן. בדיקת סחורה מול תעודות יציאה וסריקת מוצרים. משמרת בוקר קצרה. ארוחות.', requirements: 'אחריות ורצינות, עבודה עם מסופון', salaryRange: '40 ₪/שעה', priority: 1 },
    { title: 'בקר/ית הזמנות - בית שמש', location: 'בית שמש', description: 'בדיקת הזמנות לפני הפצה, בדיקת פריטים לפני העמסה. ארוחות.', requirements: 'אחריות ורצינות, עבודה עם מסופון - חובה, דיוק ותשומת לב לפרטים קטנים, יכולת עבודה תחת לחץ', salaryRange: '42 ₪/שעה', priority: 1 },
    { title: 'נציג/ת שירות לקוחות - אשדוד', location: 'אשדוד', description: 'המדע 2. תיאום מועדי אספקה, מענה לפניות בטלפון ובכתב. ארוחות.', requirements: 'ניסיון במוקד שירות - יתרון, ידע והכרה בעבודה על מחשב - חובה, תודעת שירות', salaryRange: '38 ₪/שעה', priority: 1 },
    { title: 'רפרנט/ית שטח - בית שמש', location: 'בית שמש', description: 'אזור תעשייה הר טוב. ניהול מערך נהגים, טיפול בתעודות, פתרון תקלות. תפקיד ניהולי, שכר גבוה.', requirements: 'ניסיון בתפעול מערך הפצה - חובה, יכולת רתימת עובדים, סדר וארגון, אסרטיביות - חובה, ניידות - חובה', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'סדרן/ית הפצה - אשדוד', location: 'אשדוד', description: 'המדע 2. ניהול קבלנים, הכנת קווי הפצה, מעקב הובלות. ארוחות. שכר גלובלי גבוה.', requirements: 'ניסיון מוכח בתכנון קווי הפצה רבים - חובה, חשיבה לוגית ופתרון בעיות, תפקוד מעולה תחת לחץ, ניידות - חובה', salaryRange: '13,000 ₪', priority: 3 },
    { title: 'רפרנט/ית שטח - אשדוד', location: 'אשדוד', description: 'המדע 2. ניהול מערך נהגים, טיפול בתעודות חתומות. תפקיד במטה.', requirements: 'ניסיון עבודה במערך הפצה - חובה, ניסיון בק אופיס לוגיסטי - חובה, סדר וארגון - חובה, נכונות לשעות נוספות', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'רפרנט/ית שטח - מבקיעים', location: 'מבקיעים', description: 'ניהול מערך נהגים, פתרון תקלות בהעמסה. משמרת בוקר.', requirements: 'ניסיון עבודה במערך הפצה - חובה, ניסיון בק אופיס לוגיסטי - חובה, סדר וארגון - חובה, נכונות לשעות נוספות', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'נציג/ת לקוח - אשדוד', location: 'אשדוד', description: 'המדע 2. טיפול בהזמנות, סריקת תעודות, טיפול במלאים. ארוחות.', requirements: 'ניסיון בתחום הלוגיסטיקה - חובה, שליטה ביישומי Office - חובה', salaryRange: '42 ₪/שעה', priority: 1 },
    { title: 'אחמ"ש/ית מוקד - אשדוד', location: 'אשדוד', description: 'המדע 2. ניהול משמרת, חלוקת עבודה, בקרת איכות שירות. תפקיד ניהולי, שכר גבוה מאוד.', requirements: 'ניסיון קודם כאחמ"ש ממוקד שירות לקוחות - חובה, יכולת הובלת צוות, אסרטיביות לצד שירותיות גבוהה, יכולת הנעת עובדים - חובה!', salaryRange: '55 ₪/שעה', priority: 3 },
  ],
  'לוגיסטיקר': [
    { title: 'מלקטים למחסן - בית שמש - דחוף!', location: 'בית שמש', description: 'חובה ניידות - דחוף! גישה למחשב (אופציה להיות גם אחראי).', requirements: 'ניסיון בלוגיסטיקה - יתרון משמעותי, רישיון וניסיון על מלגזה - יתרון', salaryRange: '40 ₪/שעה', priority: 3 },
    { title: 'מחסנאי - מרלו"ג משטרה - בית שמש', location: 'בית שמש', description: '⚠️ אישור משטרת ישראל נדרש - תהליך מספר ימים.', requirements: 'ניסיון קודם בעבודת מחסן - חובה, ראש גדול, ידע בעבודה עם מחשב, יחסי אנוש טובים', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'סדרן מחלקת הפצה - בית שמש', location: 'בית שמש', description: 'הבאת משטחים מהבקרה, בדיקת תקינות, צילום וסריקת משטחים, העמסת משאיות.', requirements: 'חובה רישיון נהיגה + ניידות', salaryRange: '45 ₪/שעה + חופשי', priority: 1 },
    { title: 'מנהל/ת קליטה - עבודה בשטח - בית שמש', location: 'בית שמש', description: '⚠️ זה תפקיד שטח, לא משרדי! נמדד על דיוק, קצב ומשמעת עבודה. תפקיד ניהולי, שכר גבוה.', requirements: 'ניסיון קודם בקליטה/לוגיסטיקה - חובה, ניסיון בניהול עובדים בשטח - חובה, שליטה במחשב / WMS, זמינות לעבודה פיזית, אסרטיביות', salaryRange: '55-60 ₪/שעה', priority: 3 },
    { title: 'מפעיל/ת מערכת WMS - בית שמש', location: 'בית שמש', description: 'תפעול WMS, פתיחת תהליכי ליקוט/קליטה/הפצה.', requirements: 'עבודה במחסנים לוגיסטיים, ניסיון בעבודה עם מערכת WMS - חובה, חובה ניסיון בתפקיד מפעיל מערכת, שליטה באקסל', salaryRange: '12,000 ₪ גלובלי', priority: 2 },
    { title: 'מלגזן - בית חיליקה', location: 'בית חיליקה', description: 'יש הסעות מאשדוד (יוצאת 5:15). מועמד אחראי עם ראש גדול.', requirements: 'ניסיון חצי שנה לפחות בעבודה עם מלגזה, גישה לעולם הלוגיסטיקה', salaryRange: '45 ₪/שעה', priority: 1 },
    { title: 'מלגזן היגש - בית חיליקה', location: 'בית חיליקה', description: 'יש הסעות מאשדוד (יוצאת 5:15).', requirements: 'ניסיון חצי שנה לפחות בעבודה עם מלגזה, ניסיון על מלגזת היגש', salaryRange: '50 ₪/שעה', priority: 1 },
    { title: 'מפעילת מערכת WMS - לוד - דחוף!!!', location: 'לוד', description: 'פסח לב 5, אזור התעשיה הצפונית. ⚠️ מועמד ללא תעודה מזהה מקורית לא יכנס לראיון!', requirements: 'הכרת מערכת WMS - חובה (לא רק כמחסנאי!), הפקת דוחות בקרה, קליטות נתונים', salaryRange: '43 ₪/שעה', priority: 3 },
    { title: 'מחסנאי - לוד - דחוף!!!', location: 'לוד', description: 'פסח לב 5, אזור התעשיה הצפונית.', requirements: 'יכולת עבודה עצמאית, ניסיון בעבודת מחסן, ידע במחשב, רישיון נהיגה - חובה', salaryRange: '40 ₪/שעה', priority: 3 },
    { title: 'נהג ב\' - חלוקת סחורה - לוד', location: 'לוד', description: 'פסח לב 5. פריקה ידנית, רכב לא צמוד.', requirements: 'חובה רישיון 4 טון (לא 3.5!), ניסיון בחלוקה, ניסיון בנהיגה ברכבים מסחריים (טרנזיט, דוקאטו)', salaryRange: '10,000 ₪ גלובלי', priority: 1 },
    { title: 'נהג ג\' - 12 טון - לוד', location: 'לוד', description: 'פסח לב 5. בחלק מנקודות הפריקה ידנית. משאית לא צמודה. קרן השתלמות לאחר שנה.', requirements: 'רישיון נהיגה ג\' - 12 טון, ניסיון בעבודת חלוקה עם משאית', salaryRange: '11,000-12,000 ₪ גלובלי', priority: 1 },
    { title: 'נהג ג\' - 15 טון - לוד', location: 'לוד', description: 'פסח לב 5. עבודה גם פיזית. קרן השתלמות לאחר שנה.', requirements: 'רישיון נהיגה ג\' - 15 טון, ניסיון בעבודת חלוקה עם משאית', salaryRange: '12,000-12,400 ₪ גלובלי', priority: 1 },
    { title: 'רכז הפצה - לוד', location: 'לוד', description: 'פסח לב 5. הכנת סחורה לפי קווי הפצה, קבלת החזרות. אין גמישות - חייב להתחיל בשעה 6:00!', requirements: 'ראש גדול, אחראי, ידע בעבודה עם מחשב, רישיון נהיגה', salaryRange: '45-50 ₪/שעה', priority: 1 },
    { title: 'מלגזן - לוד', location: 'לוד', description: 'פסח לב 5.', requirements: 'רישיון מלגזה, ניסיון בעבודת מלגזה, נכונות לשעות נוספות', salaryRange: '40-45 ₪/שעה', priority: 1 },
    { title: 'עובד מחסן - לוד', location: 'לוד', description: 'פסח לב 5. עבודה פיזית, ליקוט, קבלת סחורה, סידור.', requirements: 'ראש גדול, אחראי, ניסיון בעבודה עם מסופון, ניסיון בעבודת מחסן, חובה רישיון נהיגה', salaryRange: '42 ₪/שעה', priority: 1 },
    { title: 'פקידת הפצה - לוד', location: 'לוד', description: 'פסח לב 5. עבודה מול נהגים/לקוחות.', requirements: 'ראש גדול, יכולת עבודה בלחץ, חובה ידע בעבודה עם מחשב, יחסי אנוש', salaryRange: '40 ₪/שעה', priority: 1 },
    { title: 'ראש צוות - לוד', location: 'לוד', description: 'פסח לב 5. כפוף למנהל המיזם. תפקיד ניהולי.', requirements: 'יכולת ניהול להנעת עובדים, יחסי אנוש טובים, ידע וניסיון בעבודת מחסן, ידע במחשב, רישיון נהיגה - חובה', salaryRange: '50 ₪/שעה', priority: 2 },
    { title: 'מפעיל חדר בקרה - ממגורות אשדוד - דחוף!!!!', location: 'אשדוד - ממגורות', description: '⚠️ עבודה בסביבת אבק - לוודא שאינו רגיש לאבק או פחד גבהים. ארוחות חמות! קרן השתלמות לאחר חצי שנה. המפעל לא עובד בשבתות/חגים.', requirements: 'ניסיון מוכח של שנתיים לפחות כמכונאי/איש תחזוקה במפעל תעשייתי, ידע במחשבים ומערכות מידע, חוש טכני, ניידות - חובה', salaryRange: '45-50 ₪/שעה', priority: 3 },
    { title: 'עובד/ת תחזוקה - ממגורות אשדוד', location: 'אשדוד - עורף הנמל', description: 'עבודה קבועה לטווח ארוך. קרן פנסיה מיום ראשון, רווחה, הנחות אופנה, מתנות חגים, נופש שנתי.', requirements: 'ניסיון של לפחות שנתיים בעבודת אחזקה במפעל תעשייתי - חובה, ניסיון באחזקה מונעת ושבר, ניסיון במסגרות/ריתוך, רישיון נהיגה - חובה, עברית - חובה', salaryRange: '50-55 ₪/שעה', priority: 2 },
  ],
  'א.ד.ר לוגיסטיקה': [
    { title: 'מחסנאים - בית שמש (5 תקנים)', location: 'בית שמש', description: '5 תקנים פתוחים!', requirements: 'חובה תעודת זהות, רישיון נהיגה - חובה, נכונות לעבודת מחסן', salaryRange: '43 ₪/שעה', priority: 2 },
    { title: 'מחסנאים - אירפורט סיטי (3 תקנים)', location: 'אירפורט סיטי', description: '3 תקנים פתוחים!', requirements: 'רישיון נהיגה - יתרון (לא חובה), רישיון מלגזה - יתרון גדול, נכונות לעבודת מחסן', salaryRange: '43 ₪/שעה', priority: 2 },
    { title: 'מלקט גובה (כמה תקנים) - מודיעין', location: 'מודיעין', description: 'מחסן לוגיסטיקה - צעצועים, ביגוד, חלקי חילוף לרכבים. הסעות מרמלה, לוד, קרית מלאכי, אשדוד. חדר אוכל מסובסד 10 ₪.', requirements: 'רישיון מלגזה - חובה, עבודה על מלקטת גובה חשמלית, עבודה עם מסופון הזמנות', salaryRange: '50 ₪/שעה', priority: 1 },
    { title: 'מלקט עם מסופון (ג\'ק אדם רוכב) - מודיעין', location: 'מודיעין', description: 'מחסן חשמל תעשייתי/סיטונאי. 🎁 בונוס התמדה 1,000 ₪ חודשי! הסעות מרמלה, לוד. חדר אוכל מסובסד 15 ₪.', requirements: 'רישיון נהיגה - חובה, עבודה על ג\'ק אדם רוכב (מלקטת רגילה), עבודה עם מסופון הזמנות', salaryRange: '47 ₪/שעה + בונוס 1,000 ₪ חודשי', priority: 2 },
    { title: 'מלגזן היגש צד (נדרש ניסיון) - מודיעין', location: 'מודיעין', description: 'מחסן חשמל תעשייתי/סיטונאי. 🎁 בונוס התמדה 1,000 ₪ חודשי! הסעות מרמלה, לוד. חדר אוכל מסובסד 15 ₪.', requirements: 'ניסיון על מלגזת היגש - חובה!, עבודה על מלגזת היגש צד, הורדת סחורה מהגובה', salaryRange: '52 ₪/שעה + בונוס 1,000 ₪ חודשי', priority: 2 },
  ],
  'אושפיר': [
    { title: 'מתאם/ת יבוא בשילוח', location: 'חיפה', description: 'תיאום תהליכי יבוא, עבודה מול סוכני מכס וחברות ספנות.', requirements: 'ניסיון של מעל שנה בתחום השילוח - חובה, אנגלית ברמה טובה - קריאה, כתיבה, ניסוח ודיבור, שליטה בתוכנת פוקוס - יתרון משמעותי', salaryRange: 'לפי ניסיון', priority: 1 },
    { title: 'מתאם/ת יצוא בשילוח', location: 'חיפה', description: 'תיאום תהליכי יצוא, עבודה מול סוכני מכס וחברות ספנות.', requirements: 'ניסיון של מעל שנה בתחום השילוח - חובה, אנגלית ברמה טובה - קריאה, כתיבה, ניסוח ודיבור, שליטה בתוכנת פוקוס - יתרון משמעותי', salaryRange: 'לפי ניסיון', priority: 1 },
  ],
  'חברת GAC': [
    { title: 'נציג/ת מכירות רכב - GAC ראשון לציון', location: 'ראשון לציון', description: 'אולם תצוגה מודרני של יבואן רכב סיני מוביל. עמלות גבוהות, סביבה צעירה ודינמית.', requirements: 'ייצוגיות גבוהה, תודעת שירות מצוינת, ניסיון במכירות - יתרון (לא חובה), רישיון נהיגה - חובה, אוריינטציה טכנית - יתרון', salaryRange: '8,000-18,000 ₪ כולל עמלות', priority: 2 },
    { title: 'נציג/ת קבלה - GAC ראשון לציון', location: 'ראשון לציון', description: 'אולם תצוגה מודרני. קבלת לקוחות, תיאום פגישות, עבודה מול יועצי השירות.', requirements: 'ייצוגיות גבוהה מאוד, תודעת שירות מצוינת, אנגלית - יתרון, ניסיון בקבלה/אירוח - יתרון משמעותי', salaryRange: '7,000-9,000 ₪', priority: 1 },
    { title: 'יועץ/ת שירות - GAC ראשון לציון', location: 'ראשון לציון', description: 'אולם תצוגה מודרני. ליווי לקוחות, טיפולים ושירות. הכשרה מלאה.', requirements: 'ניסיון בשירות לקוחות - חובה, יכולת מכירתית, ייצוגיות גבוהה, אוריינטציה טכנית - יתרון משמעותי', salaryRange: '8,000-12,000 ₪', priority: 2 },
  ],
  'אפרייט': [
    { title: 'פקיד/ת רכש - מודיעין עילית', location: 'מודיעין עילית', description: 'עבודה מול ספקים, הזמנת חומרים, מעקב אספקות. תנאים מצוינים.', requirements: 'ניסיון ברכש - יתרון, שליטה באקסל - חובה, אנגלית בסיסית, כושר ביטוי טוב', salaryRange: '9,000-11,000 ₪', priority: 1 },
    { title: 'קבלת ספקים - מודיעין עילית', location: 'מודיעין עילית', description: 'בדיקת סחורה נכנסת, תיעוד במערכת, עבודה מול מחלקת איכות.', requirements: 'ניסיון בתפקיד דומה - יתרון, שליטה במחשב - חובה, סדר וארגון, יכולת עבודה עצמאית', salaryRange: '8,500-10,000 ₪', priority: 1 },
    { title: 'עובד/ת ייצור - מודיעין עילית', location: 'מודיעין עילית', description: 'מפעל ייצור טלסקופיות ומלגזות. עבודה בקו ייצור, הרכבה.', requirements: 'נכונות לעבודה פיזית, ראש גדול וידיים טובות, ניסיון בייצור - יתרון', salaryRange: '42-48 ₪/שעה', priority: 1 },
    { title: 'מפעיל/ת מכונות CNC - מודיעין עילית', location: 'מודיעין עילית', description: 'הפעלת מכונות CNC, קריאת שרטוטים טכניים.', requirements: 'ניסיון בהפעלת מכונות CNC - חובה, קריאת שרטוטים - חובה, דיוק ותשומת לב לפרטים', salaryRange: '50-60 ₪/שעה', priority: 2 },
  ],
  'לאשינג חיפה': [
    { title: 'עובד/ת עגינה - נמל חיפה', location: 'חיפה - נמל', description: 'עבודות עגינה בנמל חיפה. עבודה לפי קריאה מהנמל.', requirements: 'כושר גופני טוב - חובה!, נכונות לעבודה פיזית מאומצת, זמינות לעבודה במשמרות', salaryRange: '50-70 ₪/שעה + תוספות', priority: 1 },
  ]
};

// ========================================================================
// מחלקות
// ========================================================================
const DEPARTMENTS = [
  { name: 'הייטק', code: 'TECH', description: 'משרות פיתוח, מערכות מידע ו-IT' },
  { name: 'בנקאות', code: 'BANK', description: 'טלרים, בנקאים, משכנתאות' },
  { name: 'לוגיסטיקה', code: 'LOG', description: 'מחסנים, הפצה, נהגים, מלגזנים' },
  { name: 'מכירות', code: 'SALES', description: 'מכירות שטח, טלמרקטינג, חנויות' },
  { name: 'שירות לקוחות', code: 'CS', description: 'מוקדים, תמיכה טכנית, אחמ"שים' },
  { name: 'רכב', code: 'AUTO', description: 'אולמות תצוגה, יועצי שירות, קבלה' },
  { name: 'מנהלה', code: 'ADMIN', description: 'מזכירות, רכש, קבלת ספקים' },
  { name: 'ייצור', code: 'PROD', description: 'עובדי ייצור, מפעילי מכונות' },
];

async function main() {
  console.log('🔧 שחזור נתונים - מתחיל...\n');

  // 1. יצירת משתמש Admin
  console.log('👤 יוצר משתמש Admin...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  
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
  });
  console.log('✅ משתמש Admin נוצר: admin@twenty2.co.il / Admin123!');

  // 2. יצירת תגיות
  console.log('\n📌 יוצר תגיות...');
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    });
  }
  console.log(`✅ נוצרו ${TAGS.length} תגיות`);

  // 3. יצירת מחלקות
  console.log('\n🏢 יוצר מחלקות...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }
  console.log(`✅ נוצרו ${DEPARTMENTS.length} מחלקות`);

  // 4. יצירת מעסיקים
  console.log('\n🏭 יוצר מעסיקים...');
  for (const employer of EMPLOYERS) {
    await prisma.employer.upsert({
      where: { email: employer.email },
      update: employer,
      create: employer,
    });
  }
  console.log(`✅ נוצרו ${EMPLOYERS.length} מעסיקים`);

  // 5. יצירת משרות
  console.log('\n📋 יוצר משרות...');
  let totalPositions = 0;
  
  for (const [employerName, positions] of Object.entries(POSITIONS)) {
    const employer = await prisma.employer.findFirst({
      where: { name: employerName }
    });
    
    if (!employer) {
      console.log(`  ⚠️ מעסיק לא נמצא: ${employerName}`);
      continue;
    }

    for (const position of positions) {
      try {
        await prisma.position.upsert({
          where: { 
            title_employerId: { 
              title: position.title, 
              employerId: employer.id 
            }
          },
          update: position,
          create: {
            ...position,
            employerId: employer.id,
            status: 'ACTIVE'
          },
        });
        totalPositions++;
      } catch (e) {
        // אם אין unique constraint, ננסה create
        try {
          await prisma.position.create({
            data: {
              ...position,
              employerId: employer.id,
              status: 'ACTIVE'
            },
          });
          totalPositions++;
        } catch (e2) {
          console.log(`  ⚠️ לא יכולתי ליצור משרה: ${position.title}`);
        }
      }
    }
    console.log(`  ✓ ${employerName}: ${positions.length} משרות`);
  }

  console.log(`\n✅ נוצרו ${totalPositions} משרות בסך הכל`);

  // סיכום
  const stats = {
    users: await prisma.user.count(),
    employers: await prisma.employer.count(),
    positions: await prisma.position.count(),
    tags: await prisma.tag.count(),
    departments: await prisma.department.count(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 סיכום השחזור:');
  console.log('='.repeat(50));
  console.log(`👤 משתמשים: ${stats.users}`);
  console.log(`🏭 מעסיקים: ${stats.employers}`);
  console.log(`📋 משרות: ${stats.positions}`);
  console.log(`📌 תגיות: ${stats.tags}`);
  console.log(`🏢 מחלקות: ${stats.departments}`);
  console.log('='.repeat(50));
  console.log('✅ השחזור הושלם בהצלחה!');
}

main()
  .catch((e) => {
    console.error('❌ שגיאה:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
