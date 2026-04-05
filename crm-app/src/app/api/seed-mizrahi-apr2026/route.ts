import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/seed-mizrahi-apr2026?secret=mizrahi2026update
 * עדכון כל משרות בנק מזרחי טפחות לאפריל 2026
 */

// ==================== שכר ====================
const TELLER_SALARY_CONTINUOUS = { monthly: 8200, yearly: 9500, details: 'כולל 10 שעות נוספות בחודש ונסיעות' };
const TELLER_SALARY_SPLIT      = { monthly: 9300, yearly: 10700, details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות' };
const BANKER_SALARY_CONTINUOUS = { monthly: 8400, yearly: 9800, details: 'כולל 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון' };
const BANKER_SALARY_SPLIT      = { monthly: 9600, yearly: 10900, details: 'כולל 8 פיצולים, 10 שעות נוספות בחודש ונסיעות + קרן השתלמות מיום ראשון' };
const LIVE_SALARY              = { monthly: 9700, yearly: 11100, details: 'עבודה במשמרות 07:00-20:00, 2 משמרות ערב בשבוע, שישי אחת ל-3 שבועות' };

const BONUS_TA      = '• 3,000 ₪ אחרי 3 חודשים\n• 5,000 ₪ אחרי 6 חודשים\n• 5,000 ₪ אחרי שנה\n(סה"כ 13,000 ₪ – מענק מוגדל לסניפי ת"א)';
const BONUS_REGULAR = '• 3,500 ₪ אחרי 6 חודשים\n• 3,500 ₪ אחרי שנה\n(סה"כ 7,000 ₪)';

// ==================== תגיות ====================
const T = ['טלר','טלרית','קופאי','בנק','בנקאות','שירות לקוחות','קופה','עבודה מול קהל','תפעול בנקאי','דיוק','אחריות','עבודה בצוות','תקשורת בינאישית','שירותיות'];
const B = ['בנקאי','יועץ פיננסי','שירות לקוחות','בנק','בנקאות','מכירות','ניהול לקוחות','פיננסים','כלכלה','מנהל עסקים','תואר אקדמי','תואר בכלכלה','מו"מ','שימור לקוחות','יכולת מכירה'];
const M = ['משכנתא','משכנתאות','הלוואות','נדל"ן','מימון','בנקאי','יועץ משכנתאות','פיננסים','כלכלה','מו"מ','אנליטי','סדר וארגון','ניהול תיקים','ליווי לקוחות','תואר פיננסי','מכירות'];
const BIZ = ['בנקאי עסקי','עסקים','SMB','אשראי עסקי','ניתוח פיננסי','דוחות כספיים','מימון עסקי','ליווי עסקים','יעוץ עסקי','B2B','מכירות','שירות לקוחות עסקיים','כלכלה'];

function buildDesc(p: any) {
  const empLabel: Record<string,string> = { 'קבוע':'✅ תקן קבוע', 'חל"ד':'🔄 החלפת חל"ד (ניתן לקליטה בתקן קבוע)', 'זמני':'⏳ תקן זמני' };
  let d = `📍 ${p.title}\n\n${empLabel[p.employment] || p.employment}\n`;
  if (p.branch === 'רצוף') d += `🏢 סניף רצוף\n`;
  else if (p.branch === 'מפוצל') d += `🏢 סניף מפוצל\n`;
  else if (p.branch === "מפוצל ב'-ו'") d += `🏢 סניף מפוצל ב'-ו'\n`;
  else if (p.branch === 'משמרות') d += `🏢 עבודה במשמרות 07:00-20:00\n`;
  d += `📌 מרחב: ${p.region} (${p.code})\n📍 מיקום: ${p.location}\n\n`;
  if (p.info) d += `ℹ️ ${p.info}\n\n`;
  d += `💰 שכר:\n• חודשי: ${p.salary.monthly.toLocaleString()} ₪\n• ממוצע שנתי: ${p.salary.yearly.toLocaleString()} ₪\n• ${p.salary.details}\n\n`;
  if (p.bonus && p.role === 'teller') d += `🎁 מענק התמדה:\n${p.bonus}\n\n`;
  if (p.role !== 'teller' && p.role !== 'live') d += `📈 קרן השתלמות מהיום הראשון! (אין מענק התמדה לבנקאים)\n\n`;
  d += `📧 קו"ח לסמדר: orpazsm@gmail.com | העתק: umtb-hr@cvwebmail.com\nכותרת: שם מלא + ת.ז + ${p.code}`;
  return d;
}

function buildReq(p: any) {
  if (p.role === 'mortgage') return `• תואר פיננסי (כלכלה/מנה"ס/חשבונאות) – חובה\n• ניסיון מכירתי ויכולת ניהול מו"מ – חשוב מאוד\n• סדר וארגון גבוה\n• יכולת אנליטית ורבלית\n• ניסיון בשירות לקוחות${p.extraReq ? '\n' + p.extraReq : ''}`;
  if (p.role === 'business') return `• תואר בכלכלה/מנה"ס – עדיפות\n• ניסיון בתפקיד עסקי/אשראי – יתרון\n• יכולת ניתוח דוחות כספיים וניהול מו"מ\n• ניסיון בשירות/מכירות${p.extraReq ? '\n' + p.extraReq : ''}`;
  if (p.role === 'live') return `• ניסיון בשירות ו/או מכירות – חובה!\n• זמינות לעבודה במשמרות כולל ערב ושישי\n• יכולת תקשורת טלפונית מצוינת\n• שליטה בכלים דיגיטליים${p.extraReq ? '\n' + p.extraReq : ''}`;
  if (p.role === 'banker') return `• עדיפות לתואר בכלכלה/מנה"ס/ניהול\n• ניסיון בשירות ו/או מכירות – חשוב\n• זמינות לאזור הגיאוגרפי\n• יכולת ניהול לקוחות ומו"מ${p.extraReq ? '\n' + p.extraReq : ''}`;
  return `• עדיפות לתואר בכלכלה/מנה"ס/ניהול/מדעי החברה\n• ניסיון בשירות/מכירות – יתרון\n• זמינות לאזור הגיאוגרפי\n• יכולת עבודה בצוות ועמידה בלחץ${p.extraReq ? '\n' + p.extraReq : ''}`;
}

const POSITIONS = [
  // ===== מרחב מרכז JB-107 – טלרים =====
  { title:'טלר בסניף חצרות יפו - בנק מזרחי', location:'תל אביב - יפו', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_TA, tags:T },
  { title:'טלר בסניף קרית עתידים רמת החייל - בנק מזרחי ⚡ דחוף!', location:'תל אביב - רמת החייל', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', isUrgent:true, info:'⚠️ דחוף! טלר יחיד בסניף. נדרש מועמד זמין ללא אילוצים, יכולות גבוהות.', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_TA, tags:[...T,'עצמאי','אחריות מלאה','זמינות מלאה'], extraReq:'• זמינות מלאה – ללא אילוצים\n• יכולות גבוהות ועצמאות בעבודה' },
  { title:"טלר במרכז עסקים תל אביב (כולל תורנות ו') - בנק מזרחי", location:'תל אביב', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', info:"סניף רצוף + תורנות בימי שישי.", salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_TA, tags:[...T,'תורנות','שישי'] },
  { title:'טלר 50% במרכז עסקים תל אביב - בנק מזרחי (לסטודנטים)', location:'תל אביב', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', info:'משרה חלקית 50% – 2.5-3 ימים בשבוע. מתאים לסטודנטים.', salary:{monthly:4100,yearly:4750,details:'50% משרה – כולל נסיעות'}, bonus:'מענק התמדה יחסי', tags:[...T,'סטודנט','משרה חלקית','גמישות'], empType:'משרה חלקית' },
  { title:'טלר בסניף סקיי טאוור תל אביב - בנק מזרחי', location:'תל אביב - סקיי טאוור', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_TA, tags:T },
  { title:'טלר במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי', location:'רמת גן - בורסת היהלומים', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_REGULAR, tags:[...T,'בורסה','מגדל'] },
  { title:'טלר בסניף כיכר המדינה תל אביב - בנק מזרחי', location:'תל אביב - כיכר המדינה', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_TA, tags:T },
  { title:'טלר בסניף לב דיזנגוף תל אביב - בנק מזרחי', location:'תל אביב - דיזנגוף', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_TA, tags:T },
  { title:'טלר במרכז עסקים יהלומים בבורסה רמת גן - בנק מזרחי', location:'רמת גן - בורסת היהלומים', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_REGULAR, tags:[...T,'יהלומים','בורסה'] },
  { title:'טלר מתנייד מרחב מרכז (ת"א, ר"ג, בת ים) - בנק מזרחי', location:'תל אביב, רמת גן, בת ים', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'קבוע', role:'teller', info:'התניידות בין הסניפים בת"א, ר"ג ובת ים. ניתן להפנות גם מועמדים שיכולים לעבוד לפחות 3 ימים מלאים בשבוע.', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'מתנייד','התניידות','גמישות','רכב'] },
  // בנקאים מרכז
  { title:'בנקאי מתנייד במשרה מלאה מרחב מרכז - בנק מזרחי', location:'תל אביב, רמת גן, בת ים', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'קבוע', role:'banker', info:'עבודה כבנקאי בסניפים רצופים או מפוצלים לפי הצורך. התניידות בין ת"א, ר"ג, בת ים.', salary:BANKER_SALARY_SPLIT, tags:[...B,'מתנייד','גמישות'] },
  { title:'בנקאי עסקי במרכז עסקים המגדל בבורסה רמת גן - בנק מזרחי', location:'רמת גן - בורסת היהלומים', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'חל"ד', role:'business', salary:BANKER_SALARY_CONTINUOUS, tags:[...BIZ,'בורסה','מגדל'] },
  { title:'בנקאי עסקי בסניף גן העיר תל אביב - בנק מזרחי', location:'תל אביב - גן העיר', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'חל"ד', role:'business', salary:BANKER_SALARY_CONTINUOUS, tags:BIZ },
  { title:'בנקאי משכנתאות מתנייד במשרה מלאה מרחב מרכז - בנק מזרחי', location:'תל אביב, רמת גן, בת ים', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'קבוע', role:'mortgage', info:'התניידות בין הסניפים בת"א, ר"ג, בת ים לפי הצורך.', salary:BANKER_SALARY_SPLIT, tags:[...M,'מתנייד'] },
  { title:'בנקאי משכנתאות בסניף חשמונאים תל אביב - בנק מזרחי', location:'תל אביב - חשמונאים', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'קבוע', role:'mortgage', salary:BANKER_SALARY_SPLIT, tags:M },
  { title:'בנקאי משכנתאות בסניף בת ים - בנק מזרחי', location:'בת ים', region:'מרחב מרכז', code:'JB-107', branch:'מפוצל', employment:'חל"ד', role:'mortgage', salary:BANKER_SALARY_SPLIT, tags:M },
  { title:'בנקאי לקוחות במרכז עסקים תל אביב - בנק מזרחי', location:'תל אביב', region:'מרחב מרכז', code:'JB-107', branch:'רצוף', employment:'קבוע', role:'banker', salary:BANKER_SALARY_CONTINUOUS, tags:B },
  { title:'בנקאי לפעילות הבינלאומית תל אביב - בנק מזרחי (צרפתית!)', location:'תל אביב - פעילות בינלאומית', region:'מרחב מרכז', code:'JB-107', branch:"מפוצל ב'-ו'", employment:'קבוע', role:'banker', info:'נדרש/ת שליטה מלאה בצרפתית, אנגלית ועברית!', salary:BANKER_SALARY_SPLIT, tags:[...B,'צרפתית','אנגלית','פעילות בינלאומית','שפות'], extraReq:'• שליטה מלאה בצרפתית – חובה!\n• אנגלית ועברית ברמה גבוהה' },

  // ===== מרחב דן JB-110 =====
  { title:'טלר בסניף פארק עסקים חולון - בנק מזרחי', location:'חולון - פארק עסקים', region:'מרחב דן', code:'JB-110', branch:'רצוף', employment:'זמני', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף כפר קאסם - בנק מזרחי', location:'כפר קאסם', region:'מרחב דן', code:'JB-110', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף גבעתיים - בנק מזרחי', location:'גבעתיים', region:'מרחב דן', code:'JB-110', branch:'מפוצל', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף רימונים בני ברק - בנק מזרחי', location:'בני ברק - רימונים', region:'מרחב דן', code:'JB-110', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר מתנייד מרחב דן - בנק מזרחי', location:'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין', region:'מרחב דן', code:'JB-110', branch:'מפוצל', employment:'קבוע', role:'teller', info:'התניידות בין הסניפים בחולון, גבעתיים, בני ברק, פ"ת, בר אילן, קרית אונו, ראש העין והסביבה.', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'מתנייד','גמישות','רכב'] },
  { title:'בנקאי לקוחות בסניף קרית אילון חולון - בנק מזרחי', location:'חולון - קרית אילון', region:'מרחב דן', code:'JB-110', branch:"מפוצל ב'-ו'", employment:'קבוע', role:'banker', salary:BANKER_SALARY_SPLIT, tags:B },

  // ===== מרחב יהודה JB-109 – ירושלים =====
  { title:'טלר מתנייד ירושלים - בנק מזרחי', location:'ירושלים והסביבה', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'קבוע', role:'teller', info:'התניידות בין כל הסניפים באזור ירושלים. נדרשת גמישות לסניפים רצופים ומפוצלים. בהמשך ישתבצו בסניף קבוע (בד"כ תוך שנה).', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'מתנייד','גמישות','ירושלים'] },
  { title:'בנקאי משכנתאות מרחבי ירושלים - בנק מזרחי', location:'ירושלים והסביבה', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'חל"ד', role:'mortgage', info:'התניידות בין סניפי ירושלים, עיקר העבודה בסניפים מפוצלים.', salary:BANKER_SALARY_SPLIT, tags:[...M,'מתנייד','ירושלים'] },
  { title:'טלר בסניף קרית עסקים ירושלים - בנק מזרחי', location:'ירושלים - קרית עסקים', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:"טלר בסניף שמאי ירושלים (כולל תורנות ו') - בנק מזרחי", location:'ירושלים - שמאי', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'חל"ד', role:'teller', info:'סניף מפוצל + תורנות בימי שישי.', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'תורנות','שישי'] },
  { title:'טלר בסניף אפרת - בנק מזרחי', location:'אפרת', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'בנקאי לקוחות בסניף מלכי ישראל ירושלים - בנק מזרחי', location:'ירושלים - מלכי ישראל', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'חל"ד', role:'banker', salary:BANKER_SALARY_SPLIT, tags:B },
  // יהודה – שפלה
  { title:'בנקאי עסקי בסניף קש"ת אירפורט סיטי - בנק מזרחי', location:'קרית שדה התעופה (אירפורט סיטי)', region:'מרחב יהודה', code:'JB-109', branch:'רצוף', employment:'קבוע', role:'business', salary:BANKER_SALARY_CONTINUOUS, tags:BIZ },
  { title:"בנקאי משכנתאות בסניף מודיעין - בנק מזרחי", location:'מודיעין', region:'מרחב יהודה', code:'JB-109', branch:"מפוצל ב'-ו'", employment:'חל"ד', role:'mortgage', salary:BANKER_SALARY_SPLIT, tags:M },
  { title:'טלר בסניף מט"ל לוד (אזור תעשיה צפוני) - בנק מזרחי', location:'לוד - אזור התעשיה הצפוני', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף בית שמש - בנק מזרחי', location:'בית שמש', region:'מרחב יהודה', code:'JB-109', branch:'מפוצל', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },

  // ===== מרחב LIVE JB-4100 =====
  { title:'בנקאי דיגיטלי סניף LIVE - בנק מזרחי (מספר תקנים)', location:'לוד - מט"ל (אזור התעשיה הצפוני)', region:'מרחב LIVE', code:'JB-4100', branch:'משמרות', employment:'חל"ד', role:'live', info:`סניפים וירטואליים – מענה ללקוחות דיגיטלי. הסניף בבניין הבנק במט"ל (חדר אוכל + חדר כושר!).\n\nמתאים למועמדים מ: רמלה, לוד, מודיעין, שוהם, ראשל"צ, רחובות, נס ציונה, אשדוד.\n\nמשמרות: בוקר 7-15 | ביניים 8-16/9-17/10-18 | ערב 11-20\nנדרש: 2 משמרות ערב בשבוע + שישי אחת ל-3 שבועות.\n\n⚠️ דגש על ניסיון בשירות ו/או מכירות!`, salary:LIVE_SALARY, tags:[...B,'דיגיטלי','וירטואלי','טלפוני','משמרות','מוקד','שירות טלפוני','לוד'] },

  // ===== מרחב דרום JB-111 =====
  { title:'טלר בסניף דימונה - בנק מזרחי', location:'דימונה', region:'מרחב דרום', code:'JB-111', branch:'מפוצל', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף א.ת ראשון לציון - בנק מזרחי', location:'ראשון לציון - אזור תעשיה', region:'מרחב דרום', code:'JB-111', branch:'רצוף', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר מתנייד ראשל"צ, רחובות, נס ציונה, יבנה - בנק מזרחי', location:'ראשון לציון, רחובות, נס ציונה, יבנה', region:'מרחב דרום', code:'JB-111', branch:'מפוצל', employment:'זמני', role:'teller', info:'התניידות בין הסניפים בראשל"צ, רחובות, נס ציונה ויבנה. רובם סניפים מפוצלים.', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'מתנייד','גמישות','רכב'] },
  { title:'טלר מתנייד באר שבע, ערד, דימונה - בנק מזרחי', location:'באר שבע, ערד, דימונה', region:'מרחב דרום', code:'JB-111', branch:'מפוצל', employment:'קבוע', role:'teller', info:'התניידות בין הסניפים בבאר שבע, ערד ודימונה. נכונות להגיע גם לאופקים ונתיבות במידת הצורך.', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'מתנייד','גמישות','רכב','דרום'] },

  // ===== מרחב צפון JB-113 =====
  { title:'טלר 50% בסניף הדר חיפה (ימי שני) - בנק מזרחי (לסטודנטים)', location:'חיפה - הדר', region:'מרחב צפון', code:'JB-113', branch:'מפוצל', employment:'קבוע', role:'teller', info:'עבודה בימי שני כולל פיצול (50% משרה). מתאים מאוד לסטודנטים/יות.', salary:{monthly:4650,yearly:5350,details:'50% משרה (ימי שני) – כולל פיצולים ונסיעות'}, bonus:'מענק התמדה יחסי', tags:[...T,'סטודנט','משרה חלקית','גמישות','חיפה'], empType:'משרה חלקית' },
  { title:'טלר בסניף שלומי - בנק מזרחי', location:'שלומי', region:'מרחב צפון', code:'JB-113', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר מתנייד אזור כרמיאל - בנק מזרחי', location:'כרמיאל והסביבה (עד 40 ק"מ)', region:'מרחב צפון', code:'JB-113', branch:'מפוצל', employment:'חל"ד', role:'teller', info:'התניידות לסניפים עד 40 ק"מ מהבית. עדיפות למועמדים עם רכב.', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:[...T,'מתנייד','כרמיאל','רכב','גמישות'], extraReq:'• רכב פרטי – עדיפות\n• נכונות לנסיעה עד 40 ק"מ' },
  { title:'בנקאי משכנתאות מתנייד נוף הגליל/נצרת/עפולה - בנק מזרחי', location:'נוף הגליל, נצרת, עפולה, יוקנעם, מגדל העמק, שפרעם, סכנין', region:'מרחב צפון', code:'JB-113', branch:'מפוצל', employment:'קבוע', role:'mortgage', info:'עדיפות למועמדים מאזור נוף הגליל או נצרת. נדרש מועמד מתנייד עם רכב.', salary:BANKER_SALARY_SPLIT, tags:[...M,'מתנייד','רכב','גליל','נצרת','עפולה'], extraReq:'• תואר בכלכלה/מנה"ס – עדיפות\n• רכב פרטי – חובה' },

  // ===== מרחב שרון JB-108 =====
  { title:'טלר בסניף א.ת כפר סבא - בנק מזרחי', location:'כפר סבא - אזור תעשיה', region:'מרחב שרון', code:'JB-108', branch:'רצוף', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_CONTINUOUS, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף כיכר המושבה הוד השרון - בנק מזרחי', location:'הוד השרון - כיכר המושבה', region:'מרחב שרון', code:'JB-108', branch:'מפוצל', employment:'זמני', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף באקה אל גרביה - בנק מזרחי', location:'באקה אל גרביה', region:'מרחב שרון', code:'JB-108', branch:'מפוצל', employment:'חל"ד', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
  { title:'טלר בסניף הרצליה - בנק מזרחי', location:'הרצליה', region:'מרחב שרון', code:'JB-108', branch:'מפוצל', employment:'קבוע', role:'teller', salary:TELLER_SALARY_SPLIT, bonus:BONUS_REGULAR, tags:T },
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== 'mizrahi2026update') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log: string[] = [];

    // מצא / צור מעסיק
    let employer = await prisma.employer.findFirst({
      where: { OR: [{ name: { contains: 'מזרחי' } }, { name: { contains: 'Mizrahi' } }] }
    });

    if (!employer) {
      employer = await prisma.employer.create({
        data: {
          name: 'בנק מזרחי טפחות', industry: 'בנקאות',
          contactName: 'סמדר מפילת', contactEmail: 'orpazsm@gmail.com',
          phone: '', address: 'ישראל',
          notes: 'מייל גיוס: umtb-hr@cvwebmail.com\nשם + ת.ז + מספר משרה בכותרת',
          status: 'active',
        }
      });
      log.push(`✅ נוצר מעסיק: ${employer.name}`);
    } else {
      log.push(`📌 מעסיק קיים: ${employer.name} (${employer.id})`);
    }

    // מחק משרות קיימות
    const deleted = await prisma.position.deleteMany({ where: { employerId: employer.id } });
    log.push(`🗑️ נמחקו ${deleted.count} משרות קיימות`);

    let created = 0;
    const byRegion: Record<string, number> = {};

    for (const p of POSITIONS as any[]) {
      const desc = buildDesc(p);
      const req  = buildReq(p);
      const salaryLabel = `${p.salary.monthly.toLocaleString()} ₪ חודשי | ${p.salary.yearly.toLocaleString()} ₪ ממוצע שנתי`;
      const empType = p.empType || (p.info && /50%|18%|חלקית/.test(p.info) ? 'משרה חלקית' : 'משרה מלאה');
      const tagsStr = [...new Set(p.tags as string[])].join(', ');

      await prisma.position.create({
        data: {
          title: p.title, description: desc, requirements: req,
          location: p.location, salaryRange: salaryLabel,
          employmentType: empType, active: true,
          employerId: employer.id,
          keywords: tagsStr,
          contactEmail: 'orpazsm@gmail.com',
          contactName: 'סמדר מפילת',
        }
      });

      byRegion[p.region] = (byRegion[p.region] || 0) + 1;
      created++;
    }

    log.push(`✅ נוצרו ${created} משרות חדשות`);
    log.push('');
    log.push('📊 לפי מרחב:');
    for (const [r, c] of Object.entries(byRegion)) log.push(`  ${r}: ${c}`);

    return NextResponse.json({ success: true, created, log });
  } catch (error: any) {
    console.error('seed-mizrahi error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
