import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * API לסנכרון משרות AVIS ו-UMI - פברואר 2026
 * GET /api/admin/sync-avis-umi-positions
 */

// כל המשרות מהמייל
const AVIS_UMI_POSITIONS = [
  // ========== משרות במטה - לוד ==========
  {
    title: 'אחראי/ת תפעול ושירות בתחום הרכב (משנע/ת)',
    location: 'לוד',
    openPositions: 8,
    salaryRange: '9,500-10,000 ₪ + בונוסים עד 2,500 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `אחריות על תפעול הקריאות הנמצאות באיזורו.
ניתוב הקריאות תוך עמידה בזמנים לנציגי השירות תחת אחריותו.
עבודה משרדית, שיח שוטף עם מוסכים ולקוחות החברה.
6 ימים בשבוע.`,
    requirements: `שירותיות, יחסי אנוש טובים
אוריינטציה מחשובית ועבודה מול תוכנות מרובות בו זמנית
ניסיון בניהול צוות בסביבה מרובת משימות - יתרון משמעותי
עמידה בלחץ וריבוי משימות
אסרטיביות
נכונות לשעות נוספות
רישיון נהיגה מעל שנה`,
    benefits: `ימי שישי: עבודה מהבית או מהמטה (+500 ₪ חודשי)
מענקי התמדה: 12,000 ₪ בשנה הראשונה (4,000 ₪ כל רבעון)
בונוס 10,000 ₪ בתום השנה השנייה
הגנת שכר: 1,500 ₪ ל-3 חודשים ראשונים
לימודים: עובדים מצטיינים - 10,000 ₪
קרן השתלמות לאחר שנה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות חדשים - ליסינג',
    location: 'לוד',
    openPositions: 2,
    salaryRange: '7,000 ₪ בסיס + עמלות (ממוצע 13,000-16,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו לפי צרכי המערכת',
    description: `טיפול בלידים חמים, שיחות נכנסות
ניהול מו"מ וסגירת עסקאות ליסינג
קליטה כעובד/ת חברה מהיום הראשון
ארוחות מסובסדות, סביבת עבודה צעירה ואנרגטית
תחרויות ופרסים, אירועי רווחה`,
    requirements: `ניסיון במכירות טלפוניות / פרונטליות - חובה
כושר שכנוע וניהול מו"מ`,
    benefits: `הגנת שכר 12,000 ₪ כולל הכל
עמלות גבוהות מאוד - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'מתאם/ת מכירות UMI',
    location: 'לוד',
    openPositions: 5,
    salaryRange: '6,600 ₪ בסיס + עמלות (ממוצע 12,000-14,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 09:00-18:00, ו לסירוגין 08:00-13:00',
    description: `ביצוע שיחות נכנסות ויוצאות מרובות (כ-100 שיחות ביום)
תיאום פגישות עם סוכני המכירות באולמות התצוגה בפריסה ארצית
עמלות מכירה גבוהות על הגעת הלקוח לפגישה`,
    requirements: `ניסיון במכירות - יתרון
שירותיות ברמה גבוהה
וורבליות וטיפול בהתנגדויות
יכולת עבודה תחת לחץ ועמידה ביעדים`,
    benefits: `הגנת שכר 8,700 ₪ ל-3 חודשים`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },
  {
    title: 'ראש צוות מוקד שירות ארצי',
    location: 'לוד',
    openPositions: 1,
    salaryRange: '9,000 ₪ בסיס + בונוסים עד 2,200 ₪',
    employmentType: 'משרה מלאה',
    workHours: '07:00-17:00 או 08:00-18:00',
    description: `אחריות על מוקדי השירות הטלפוני
מתן מענה מקצועי
אחריות על מהלך המשמרת (יציאה להפסקות, זמני שיחה וכו')
מתן שירות ללקוחות
6 ימים בשבוע - חובה`,
    requirements: `ניסיון בניהול צוות
יכולת עבודה בלחץ`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'מוקדני שירות טלפוני - מוקד ארצי',
    location: 'לוד',
    openPositions: 7,
    salaryRange: '40 ₪/שעה + בונוסים',
    employmentType: 'משרה מלאה',
    workHours: 'משמרות: 07:00-17:00, 08:00-18:00, ערב 16:45-24:00, שישי 13:00-24:00, שבת 07:00-16:00/16:00-24:00',
    description: `מענה טלפוני ודיגיטלי (ללא מכירה) ללקוחות החברה
תיאום טיפולים, טסטים ותקלות
6 משמרות בשבוע כולל סופי שבוע - חובה (שישי או שבת)
יש משמרות לילה`,
    requirements: `יחסי אנוש טובים, שירותיות, סבלנות
אוריינטציה מחשובית ועבודה מול תוכנות מרובות
עמידה בלחץ וריבוי משימות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תגמול עבור שעות נוספות בסופי שבוע`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציגת רכש חלפים',
    location: 'לוד',
    openPositions: 1,
    salaryRange: '9,000 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה, ו לסירוגין',
    description: `עבודת אדמיניסטרציה
הזמנות חלקים, בדיקת הזמנות מול חשבוניות
תקשורת יומיומית עם ממשקים שונים בקבוצה
מתן מענה ופתרונות לכלל הממשקים`,
    requirements: `ניסיון בעבודת רכש - יתרון
שליטה במחשב`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'דייל/ת קאר קונטרול',
    location: 'לוד',
    openPositions: 1,
    salaryRange: '7,500 ₪ בסיס (ממוצע 9,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `אחריות על ניהול צי
עבודה מול מוביליות ונציגי הקאר קונטרול
ניהול קשר עם סניפי ההשכרה
עבודת בק אופיס שוטפת (סריקות, מיילים, דו"חות)`,
    requirements: `שליטה במחשב ובתוכנות השונות
נכונות לשעות נוספות`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'בקר השבחה וקליטה',
    location: 'לוד',
    openPositions: 4,
    salaryRange: '8,000 ₪ בסיס + רכב',
    employmentType: 'משרה מלאה',
    workHours: '6 ימים בשבוע',
    description: `בדיקה והשבחה של רכבים שנמצאים במוסכים חיצוניים
בדיקה פיזית של הרכב וביצוע השבחות נוספות (תיקונים, ניקיון וכו')`,
    requirements: `ידע וניסיון מעולם הרכב - יתרון
רישיון נהיגה`,
    benefits: `רכב צמוד`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות חדשים - ביטוח',
    location: 'לוד',
    openPositions: 2,
    salaryRange: '9,000 ₪ בסיס + עמלות עד 4,000 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו אחת לחודש 08:00-13:00',
    description: `טיפול בלקוחות לחידוש פוליסה קיימת
ניהול תיקי לקוחות פעילים
גביה, מתן הצעות מחיר, בקרה על פוליסות
טיפול בתוספות ושינויים בפוליסות
קשר מול כלל חברות הביטוח
מכירת ביטוחי אקסטרא (שמשות, דירה, גרירה)`,
    requirements: `ניסיון בעולם הביטוח בתחום האלמנטרי - יתרון מובהק
תודעת מכירה ושירות גבוהה
יחסי אנוש מצוינים
ידע במערכות ביטוח`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== מחסנאי / מלקט - ראשון לציון ==========
  {
    title: 'מחסנאי / מלקט',
    location: 'ראשון לציון',
    openPositions: 2,
    salaryRange: '10,500 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00 ללא ימי שישי',
    description: `ליקוט הזמנות, פיזור סחורה
פריקה וקליטת סחורה
סידור פריטים`,
    requirements: `רישיון מלגזה - חובה
ניסיון עבודה עם מלגזה
ניסיון בעבודה במחסן בצוות
ידע בסיסי במערכת מחשב ואופיס
ידע ב-ERP - יתרון`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },

  // ========== נציג/ת שירות ליסינג - מספר מיקומים ==========
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'לוד',
    openPositions: 6,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'פתח תקווה',
    openPositions: 2,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'אשדוד',
    openPositions: 3,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'כפר סבא',
    openPositions: 3,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'נתניה',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'ירושלים',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג/ת שירות ליסינג',
    location: 'עפולה',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ + תמריצים עד 1,100 ₪',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע רכבים מלקוחות החברה לטיפולים, טסטים ומוסכים
סיוע בהחלפת צמיג (פנצ'ר) ללקוחות
המתנה לגרר וכו'
הגעה במדים מלאים (מסופקים ע"י החברה)`,
    requirements: `רישיון נהיגה מעל שנה (ידני - יתרון משמעותי)
נכונות למשרה מלאה + שעות נוספות
יחסי אנוש טובים
נראות מכובדת וייצוגית
שירותיות`,
    benefits: `מענק לאחר שנה ולאחר שנתיים
תוספת אי היעדרות 300 ₪`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== נתב"ג ==========
  {
    title: 'דייל/ת השכרה - נתב"ג',
    location: 'נתב"ג, לוד, רמלה, ראשון לציון, פתח תקווה, רמת גן',
    openPositions: 4,
    salaryRange: '6,700 ₪ בסיס + עמלות (ממוצע 10,000-12,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'משמרות: 06:00-14:00, 14:00-22:00, 22:00-06:00 (כולל סופ"ש)',
    description: `מתן שירות פרונטלי וטלפוני ללקוחות הסניף
סגירת חוזי השכרה
בק אופיס ואדמיניסטרציה שוטפת`,
    requirements: `שירותיות ברמה גבוהה
אנגלית טובה - חובה
אוריינטציה מיחשובית
נכונות לשעות נוספות`,
    benefits: `מענק התמדה 3,000 ₪ אחרי חצי שנה
עוד 3,000 ₪ אחרי שנה
הסעות לנתב"ג מרמלה, לוד, ראשל"צ, פתח תקווה
בסופ"ש הסעות גם מרמת גן
עמלות גבוהות מאוד - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },
  {
    title: 'נציג שירות השכרה - נתב"ג',
    location: 'נתב"ג',
    openPositions: 9,
    salaryRange: '6,700-7,000 ₪ (ממוצע 9,500 ₪+)',
    employmentType: 'משרה מלאה',
    workHours: 'משמרות: 06:00-14:00, 14:00-22:00, 22:00-06:00 (כולל סופ"ש)',
    description: `הכנת רכבי השכרה
קבלת הרכבים מלקוחות בתום תקופת השכרה
הכנתם לטובת הלקוחות הבאים (שטיפה במכונה ותדלוקים)
סידור המגרש ומתן שירות ללקוח`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון מעל שנה`,
    benefits: `בונוס 300 ₪ מענק התמדה והגעה לעבודה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },

  // ========== נציג שירות השכרה - סניפים ==========
  {
    title: 'נציג שירות השכרה',
    location: 'תל אביב',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ (ממוצע 8,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע והכנת רכבי השכרה
מסירה וקבלת הרכבים מלקוחות
הכנתם לטובת הלקוחות הבאים (שטיפה במכונה ותדלוקים)
סידור המגרש ומתן שירות ללקוח`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון ידני מעל שנה`,
    benefits: `בונוס 300 ₪ מענק התמדה והגעה לעבודה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג שירות השכרה',
    location: 'פתח תקווה',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ (ממוצע 8,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע והכנת רכבי השכרה
מסירה וקבלת הרכבים מלקוחות
הכנתם לטובת הלקוחות הבאים (שטיפה במכונה ותדלוקים)
סידור המגרש ומתן שירות ללקוח`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון ידני מעל שנה`,
    benefits: `בונוס 300 ₪ מענק התמדה והגעה לעבודה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג שירות השכרה',
    location: 'לוד',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ (ממוצע 8,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע והכנת רכבי השכרה
מסירה וקבלת הרכבים מלקוחות
הכנתם לטובת הלקוחות הבאים (שטיפה במכונה ותדלוקים)
סידור המגרש ומתן שירות ללקוח`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון ידני מעל שנה`,
    benefits: `בונוס 300 ₪ מענק התמדה והגעה לעבודה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'נציג שירות השכרה',
    location: 'ירושלים',
    openPositions: 1,
    salaryRange: '6,700-7,000 ₪ (ממוצע 8,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00',
    description: `שינוע והכנת רכבי השכרה
מסירה וקבלת הרכבים מלקוחות
הכנתם לטובת הלקוחות הבאים (שטיפה במכונה ותדלוקים)
סידור המגרש ומתן שירות ללקוח`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון ידני מעל שנה`,
    benefits: `בונוס 300 ₪ מענק התמדה והגעה לעבודה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== שוהם - מרלו"ג ==========
  {
    title: 'עובד/ת מרלו"ג',
    location: 'שוהם',
    openPositions: 12,
    salaryRange: '8,000 ₪ בסיס + בונוסים (ממוצע 11,500-12,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו אחת לחודש',
    description: `עבודה במרכז הלוגיסטי (חלקי חילוף)
עבודות מחסן, ליקוט, אימות סחורה
תפ"י, קליטת סחורה
נכונות לשעות נוספות במידת הצורך`,
    requirements: `רישיון נהיגה בתוקף
יכולת הגעה עצמאית לשוהם
רישיון למלגזה - יתרון
ניסיון כמחסנאי - יתרון`,
    benefits: `בונוסים על תפוקת עבודה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== נציגי בית לקוח ==========
  {
    title: 'נציג בית לקוח - חטיבת השירות והתפעול',
    location: 'יקנעם, חיפה, עפולה',
    openPositions: 2,
    salaryRange: 'שכר + נסיעות + תן ביס',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00',
    description: `נציג שירות היושב בחברות במשק עם ציי רכב של AVIS
שינוע רכבים ללקוחות לטיפולים, טסטים
החלפת צמיגים, הזמנת גרר, תדלוק רכבים
עובדי חברה מהיום הראשון`,
    requirements: `רישיון נהיגה
יכולת עבודה בסיסית מול מחשב
שירותיות וסובלנות
זמינות למשרה מלאה`,
    benefits: `בונוס התמדה 6,000 ₪ בשנה (מחולק)
נסיעות
כרטיס תן ביס
אירועי חברה`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== נציג/ת שירות קאר קונטרול ==========
  {
    title: 'נציג/ת שירות קאר קונטרול',
    location: 'פריסה ארצית',
    openPositions: 4,
    salaryRange: '7,000 ₪ בסיס (ממוצע 8,500 ₪)',
    employmentType: 'משרה מלאה / חלקית',
    workHours: 'א-ה 08:00-18:00, ו 08:00-14:00 (ניתן 3-4 ימים בשבוע)',
    description: `שינוע רכבים בכל הארץ על פי דרישה
נסיעות ארוכות
ניתן גם לעבוד בחלקיות משרה
ניתן לעבוד ימי שישי לסירוגין`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון ידני מעל שנה - חובה
עדיפות לגיל השלישי`,
    benefits: `מענק לאחר שנה ולאחר שנתיים`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },

  // ========== תומך/ת מכירה UMI ==========
  {
    title: 'תומך/ת מכירה UMI',
    location: 'פתח תקווה, אשדוד, תל אביב',
    openPositions: 3,
    salaryRange: '6,700 ₪ בסיס (ממוצע 7,500-8,000 ₪) + עמלות',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00',
    description: `ביצוע נסיעות מבחן עם לקוחות
אחריות על נראות אולם התצוגה
שינוע רכבים בפריסה ארצית
משרה עם אופציות קידום!`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון מעל שנה`,
    benefits: `עמלות ובונוסים על כל מסירת רכב`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },

  // ========== תומך מכירה AVIS ==========
  {
    title: 'תומך מכירה AVIS',
    location: 'לוד, גלילות, כפר סבא, מודיעין',
    openPositions: 4,
    salaryRange: '6,700 ₪ בסיס (ממוצע 7,500-8,000 ₪) + עמלות',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00 (ניתן חצי יום חופש בשבוע)',
    description: `ביצוע נסיעות מבחן עם לקוחות
אחריות על נראות אולם התצוגה
שינוע רכבים בפריסה ארצית
משרה עם אופציות קידום!`,
    requirements: `יכולת הגעה עצמאית
נכונות לשעות נוספות
רישיון מעל שנה`,
    benefits: `עמלות ובונוסים על כל מסירת רכב`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== אנשי מכירות פרונטליים AVIS ==========
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'ירושלים',
    openPositions: 2,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'חיפה',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'כפר סבא',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'פתח תקווה',
    openPositions: 3,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'קריית גת',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'טבריה',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'נתניה',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - AVIS',
    location: 'ראשון לציון',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 10K ל-3 חודשים (ממוצע 12,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: '08:30-18:00, ו 08:30-13:00 (חצי יום חופש בשבוע)',
    description: `זיהוי צרכי לקוח, יכולת עמידה ביעדים
מתן שירות איכותי ומקצועי
טיפול בהתנגדויות
עובדי חברה מהיום הראשון`,
    requirements: `ידע קודם בעולם המכירות - חובה
זמינות למשרה מלאה
תודעת שירות גבוהה`,
    benefits: `נסיעות, ארוחות מסובסדות
תחרויות ופרסים
עמלות - ללא תקרת שכר!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },

  // ========== אנשי מכירות פרונטליים UMI ==========
  {
    title: 'איש/אשת מכירות פרונטלי/ת - UMI',
    location: 'ראשון לציון',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 3,000 ₪ ל-3 חודשים (ממוצע 11,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00',
    description: `מתן שירות מעולה
מומחה בניהול מו"מ וטיפול בהתנגדויות
קליטה כעובד/ת חברה מהיום הראשון`,
    requirements: `ניסיון במכירות פרונטליות - חובה
עדיפות לניסיון בתחום הרכב
יכולת עבודה תחת לחץ והשגת יעדים
מגיל 24 (הביטוח על הרכב)`,
    benefits: `ארוחות מסובסדות
תנאים סוציאליים מעולים
אופציות קידום נרחבות
עמלות - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - UMI',
    location: 'פתח תקווה',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 3,000 ₪ ל-3 חודשים (ממוצע 11,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00',
    description: `מתן שירות מעולה
מומחה בניהול מו"מ וטיפול בהתנגדויות
קליטה כעובד/ת חברה מהיום הראשון`,
    requirements: `ניסיון במכירות פרונטליות - חובה
עדיפות לניסיון בתחום הרכב
יכולת עבודה תחת לחץ והשגת יעדים
מגיל 24 (הביטוח על הרכב)`,
    benefits: `ארוחות מסובסדות
תנאים סוציאליים מעולים
אופציות קידום נרחבות
עמלות - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - UMI',
    location: 'מודיעין',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 3,000 ₪ ל-3 חודשים (ממוצע 11,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00',
    description: `מתן שירות מעולה
מומחה בניהול מו"מ וטיפול בהתנגדויות
קליטה כעובד/ת חברה מהיום הראשון`,
    requirements: `ניסיון במכירות פרונטליות - חובה
עדיפות לניסיון בתחום הרכב
יכולת עבודה תחת לחץ והשגת יעדים
מגיל 24 (הביטוח על הרכב)`,
    benefits: `ארוחות מסובסדות
תנאים סוציאליים מעולים
אופציות קידום נרחבות
עמלות - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - UMI',
    location: 'רעננה',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 3,000 ₪ ל-3 חודשים (ממוצע 11,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00',
    description: `מתן שירות מעולה
מומחה בניהול מו"מ וטיפול בהתנגדויות
קליטה כעובד/ת חברה מהיום הראשון`,
    requirements: `ניסיון במכירות פרונטליות - חובה
עדיפות לניסיון בתחום הרכב
יכולת עבודה תחת לחץ והשגת יעדים
מגיל 24 (הביטוח על הרכב)`,
    benefits: `ארוחות מסובסדות
תנאים סוציאליים מעולים
אופציות קידום נרחבות
עמלות - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },
  {
    title: 'איש/אשת מכירות פרונטלי/ת - UMI',
    location: 'חדרה',
    openPositions: 1,
    salaryRange: '6,248 ₪ בסיס + הגנת שכר 3,000 ₪ ל-3 חודשים (ממוצע 11,000-13,000 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:30-18:00, ו 08:30-13:00',
    description: `מתן שירות מעולה
מומחה בניהול מו"מ וטיפול בהתנגדויות
קליטה כעובד/ת חברה מהיום הראשון`,
    requirements: `ניסיון במכירות פרונטליות - חובה
עדיפות לניסיון בתחום הרכב
יכולת עבודה תחת לחץ והשגת יעדים
מגיל 24 (הביטוח על הרכב)`,
    benefits: `ארוחות מסובסדות
תנאים סוציאליים מעולים
אופציות קידום נרחבות
עמלות - אין תקרה!`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'UMI'
  },

  // ========== דייל/ת השכרה - סניפים (לא נתב"ג) ==========
  {
    title: 'דייל/ת השכרה',
    location: 'פתח תקווה, רמת גן',
    openPositions: 2,
    salaryRange: '7,500 ₪ בסיס + עמלות (ממוצע +1,500 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00 (6 ימים - חובה)',
    description: `מתן שירות פרונטלי וטלפוני ללקוחות הסניף
סגירת חוזי השכרה
בק אופיס ואדמיניסטרציה שוטפת`,
    requirements: `שירותיות ברמה גבוהה
אוריינטציה מיחשובית
אנגלית ברמת שיחה
נכונות לשעות נוספות
רישיון נהיגה מעל שנה`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },
  {
    title: 'דייל/ת השכרה',
    location: 'אשדוד',
    openPositions: 1,
    salaryRange: '7,500 ₪ בסיס + עמלות (ממוצע +1,500 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00 (6 ימים - חובה)',
    description: `מתן שירות פרונטלי וטלפוני ללקוחות הסניף
סגירת חוזי השכרה
בק אופיס ואדמיניסטרציה שוטפת`,
    requirements: `שירותיות ברמה גבוהה
אוריינטציה מיחשובית
אנגלית ברמת שיחה
נכונות לשעות נוספות
רישיון נהיגה מעל שנה`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },
  {
    title: 'דייל/ת השכרה',
    location: 'ירושלים',
    openPositions: 1,
    salaryRange: '7,500 ₪ בסיס + עמלות (ממוצע +1,500 ₪)',
    employmentType: 'משרה מלאה',
    workHours: 'א-ה 08:00-17:00, ו 08:00-13:00 (6 ימים - חובה)',
    description: `מתן שירות פרונטלי וטלפוני ללקוחות הסניף
סגירת חוזי השכרה
בק אופיס ואדמיניסטרציה שוטפת`,
    requirements: `שירותיות ברמה גבוהה
אוריינטציה מיחשובית
אנגלית ברמת שיחה
נכונות לשעות נוספות
רישיון נהיגה מעל שנה`,
    benefits: ``,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: true,
    company: 'AVIS'
  },

  // ========== עתודה ניהולית ==========
  {
    title: 'עתודה ניהולית - מכירת רכב AVIS',
    location: 'צפון, שרון, חיפה, נתניה, כפר סבא',
    openPositions: 2,
    salaryRange: '7,000 ₪ בסיס + עמלות + רכב + קרן השתלמות',
    employmentType: 'משרה מלאה',
    workHours: '6 ימים בשבוע',
    description: `קידום פעילויות המכירה באולם ועמידה ביעדי החברה והסניף
אחריות על הכשרה, הטמעה, ליווי סוכני המכירות באולם
ניהול והנעת צוות האולם - נציגי מכירה ותפעול
שמירה על רמת שירות גבוהה לקהל הלקוחות
ניהול בקרה ודוחות
עבודה מול ממשקים בארגון`,
    requirements: `ניסיון בתפקידי מכירות רכב - יתרון
ניסיון בניהול מכירות - חובה
ניסיון בניהול מרכזי מכירה פרונטליים
מוטיבציה להצלחה
יחסי אנוש טובים
יכולת תקשורת בין אישית ועבודה בצוות
תודעת שירות גבוהה
אסרטיביות`,
    benefits: `הגנת שכר 7,000 ₪ ל-3 חודשים ראשונים
רכב צמוד
קרן השתלמות
אפשרי שכר גבוה יותר למועמד איכותי`,
    contactEmail: 'moran.vashler@avis.co.il',
    urgent: false,
    company: 'AVIS'
  },
]

export async function GET() {
  try {
    console.log('🚗 מסנכרן משרות AVIS ו-UMI...')

    // מצא או צור מעסיק AVIS
    let avisEmployer = await prisma.employer.findFirst({
      where: { 
        OR: [
          { name: { contains: 'AVIS', mode: 'insensitive' } },
          { name: { contains: 'אויס', mode: 'insensitive' } }
        ]
      }
    })

    if (!avisEmployer) {
      avisEmployer = await prisma.employer.create({
        data: {
          name: 'AVIS ישראל',
          email: 'avis@avis.co.il',
          phone: '',
        }
      })
      console.log('✅ נוצר מעסיק: AVIS ישראל')
    }

    // מצא או צור מעסיק UMI
    let umiEmployer = await prisma.employer.findFirst({
      where: { 
        OR: [
          { name: { contains: 'UMI', mode: 'insensitive' } },
          { name: { contains: 'יומי', mode: 'insensitive' } }
        ]
      }
    })

    if (!umiEmployer) {
      umiEmployer = await prisma.employer.create({
        data: {
          name: 'UMI',
          email: 'umi@umi.co.il',
          phone: '',
        }
      })
      console.log('✅ נוצר מעסיק: UMI')
    }

    // מחק משרות ישנות של AVIS ו-UMI
    const deletedAvis = await prisma.position.deleteMany({
      where: { employerId: avisEmployer.id }
    })
    const deletedUmi = await prisma.position.deleteMany({
      where: { employerId: umiEmployer.id }
    })
    console.log(`🗑️ נמחקו ${deletedAvis.count + deletedUmi.count} משרות ישנות`)

    // צור משרות חדשות
    const createdPositions: string[] = []
    let totalOpenPositions = 0

    for (const pos of AVIS_UMI_POSITIONS) {
      const employer = pos.company === 'UMI' ? umiEmployer : avisEmployer
      
      await prisma.position.create({
        data: {
          title: pos.title,
          description: pos.description,
          requirements: pos.requirements,
          location: pos.location,
          salaryRange: pos.salaryRange,
          employmentType: pos.employmentType,
          benefits: pos.benefits,
          workHours: pos.workHours,
          contactEmail: pos.contactEmail,
          keywords: `${pos.title}, ${pos.location}, AVIS, UMI, רכב, ליסינג, השכרה, מכירות, שירות`,
          active: true,
          openings: pos.openPositions,
          employerId: employer.id,
        }
      })
      
      createdPositions.push(`${pos.title} - ${pos.location} (${pos.openPositions} תקנים)${pos.urgent ? ' 🔥' : ''}`)
      totalOpenPositions += pos.openPositions
    }

    return NextResponse.json({
      success: true,
      message: `סונכרנו ${createdPositions.length} משרות AVIS/UMI`,
      stats: {
        deletedOld: deletedAvis.count + deletedUmi.count,
        created: createdPositions.length,
        totalOpenPositions: totalOpenPositions,
        urgentPositions: AVIS_UMI_POSITIONS.filter(p => p.urgent).length
      },
      positions: createdPositions
    })

  } catch (error) {
    console.error('Error syncing AVIS/UMI positions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to sync AVIS/UMI positions', details: errorMessage },
      { status: 500 }
    )
  }
}
