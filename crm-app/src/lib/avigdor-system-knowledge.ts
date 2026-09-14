export type CrmHowToSnippet = { topic: string; answer: string }

const SCREENS_OVERVIEW: CrmHowToSnippet = {
  topic: "מסכי המערכת",
  answer: [
    "מסכי TWENTY2CRM לפי התפריט הימני:",
    "לוח בקרה (/dashboard) — סיכום פעילות וביצועי מגייסים (אדמין רואה את כולם; מגייס רואה רק את עצמו).",
    "מועמדים (/dashboard/candidates) — מאגר וכרטיס מועמד עם מאצ'ינג; סימון התקבל בכרטיס.",
    "משרות (/dashboard/positions) — מאגר משרות; משרה חדשה נשמרת לא פעילה עד שמפעילים אותה.",
    "מעסיקים (/dashboard/employers), ראיונות (/dashboard/interviews).",
    "הכנסת מועמד (/dashboard/recruitment-board), העלאה המונית (/dashboard/upload), משרות המוניות (/dashboard/positions/bulk-upload).",
    "סטטוס חודשי/שנתי (/dashboard/monthly-status) — בחירת חודש או שנה מלאה ותאריכי עלה/תהליך/התקבל. Share Agent (/dashboard/share-agent). שעון נוכחות (/dashboard/attendance), פנקס רישום (/dashboard/system-registry), הגדרות (/dashboard/settings).",
    "בצד שמאל: פאנל אביגדור — צ'אט + גרירת קו\"ח (PDF/Word/תמונה) ושאלות מאצ'ינג.",
    "אל תמציא סיסמאות, מיילים או טלפונים.",
  ].join(" "),
}

const PLAYBOOK: { topic: string; keywords: string[]; answer: string }[] = [
  {
    topic: "העלאת קורות חיים",
    keywords: ["העלאה", "העלאת", "מעלים", "מעלה", "קוח", 'קו"ח', "קורות", "קורות חיים", "גרור", "גרירה", "קובץ", "pdf", "word", "תמונה"],
    answer:
      'העלאת קו"ח: בתפריט הימני "העלאה המונית" (/dashboard/upload), או גרור PDF/Word/תמונה לפאנל אביגדור בצד שמאל. אביגדור מנתח, שומר במערכת (או מעדכן כרטיס קיים בלי כפילות) ומציע משרות מתאימות. אל תמציא פרטי קשר.',
  },
  {
    topic: "מאצ'ינג מועמד",
    keywords: ["מאצ'ינג", "מאצינג", "התאמה", "תתאים", "מותאם", "מועמד", "כרטיס מועמד"],
    answer:
      'מאצ\'ינג למועמד: פתח כרטיס מועמד (/dashboard/candidates) וראה משרות מתאימות, או שאל את אביגדור "תתאים אותו" כשאתה על הכרטיס. אביגדור משתמש בהקשר המסך — אין צורך להעתיק id.',
  },
  {
    topic: "מאצ'ינג משרה",
    keywords: ["מי מתאים", "משרה", "משרות", "כרטיס משרה"],
    answer:
      'מאצ\'ינג למשרה: פתח כרטיס משרה (/dashboard/positions) לרשימת מועמדים מתאימים, או שאל את אביגדור "מי מתאים". משרה חדשה נוצרת לא פעילה — צריך להפעיל אותה כדי שתופיע בחיפוש ובמאצ\'ינג החי.',
  },
  {
    topic: "הפעלת משרה",
    keywords: ["הפעלה", "פעילה", "לא פעילה", "טיוטה", "משרה חדשה"],
    answer:
      "משרה חדשה נשמרת כלא פעילה עד שמפעילים אותה במסך המשרות. בלי הפעלה היא לא נחשבת משרה פתוחה לחיפוש/מאצ'ינג חי.",
  },
  {
    topic: "אביגדור",
    keywords: ["אביגדור", "avigdor", "צ'אט", "בוט", "עוזר"],
    answer:
      'אביגדור הוא פאנל קבוע בצד שמאל: צ\'אט בעברית + גרירת קו"ח. אפשר לבקש חיפוש משרות/מועמדים, סטטיסטיקות, ראיונות, ומאצ\'ינג לפי הכרטיס הפתוח. הוא קריאה בלבד על נתונים חיים — לא ממציא סיסמאות/מיילים/טלפונים.',
  },
  {
    topic: "דשבורד ומסכים",
    keywords: ["דשבורד", "לוח בקרה", "תפריט", "איפה", "מסך", "הגדרות"],
    answer:
      'לוח בקרה: /dashboard — כולל ביצועי מגייסים (אדמין רואה את כולם). מועמדים, משרות, מעסיקים וראיונות בקבוצת ניהול. כלים: הכנסת מועמד, העלאה המונית, משרות המוניות, סטטוס חודשי/שנתי, שעון נוכחות, פנקס רישום. הגדרות: /dashboard/settings.',
  },
  {
    topic: "ראיונות",
    keywords: ["ראיון", "ראיונות", "תזמון"],
    answer: "ראיונות מנוהלים ב-/dashboard/interviews. אפשר גם לשאול את אביגדור על ראיונות קרובים — הוא שולף רשימה חיה, בלי ליצור או לשנות ראיון.",
  },
  {
    topic: "נוכחות",
    keywords: ["נוכחות", "שעון", "שעון נוכחות", "כניסה", "יציאה"],
    answer: "שעון נוכחות נמצא ב-/dashboard/attendance בתפריט הכלים. זה מסך תפעול פנימי — לא קשור למאצ'ינג מועמדים.",
  },
  {
    topic: "תגיות",
    keywords: ["תגיות", "תגית", "תגים"],
    answer:
      "תגיות על מועמד ומשרה משמשות למאצ'ינג מהיר (יחד עם עיר, כותרת תפקיד וכישורים). עריכת תגיות נעשית בכרטיס עצמו, לא דרך אביגדור.",
  },
  {
    topic: "הכנסת מועמד",
    keywords: ["הכנסת מועמד", "לוח גיוס", "recruitment"],
    answer: 'יצירה ידנית של מועמד: תפריט "הכנסת מועמד" (/dashboard/recruitment-board). להעלאת קובץ קו"ח עדיף העלאה המונית או גרירה לאביגדור.',
  },
  {
    topic: "מעסיקים",
    keywords: ["מעסיק", "מעסיקים", "לקוח", "לקוחות"],
    answer: "מעסיקים/לקוחות ב-/dashboard/employers. משרות משויכות למעסיק במסך המשרות.",
  },
  {
    topic: "סטטוס חודשי ופנקס",
    keywords: ["סטטוס חודשי", "סטטוס שנתי", "שנתי", "חודשי", "פנקס", "רישום", "עלה", "התקבל"],
    answer:
      "סטטוס חודשי/שנתי: /dashboard/monthly-status — בחירת חודש או שנה, עם תאריכי עלה/התקבל. פנקס רישום: /dashboard/system-registry. הגדרות מערכת: /dashboard/settings.",
  },
  {
    topic: "סימון התקבל",
    keywords: ["מסמנים", "מסמן", "סימון", "התקבל", "סימון התקבל"],
    answer:
      "סימון התקבל: כרטיס מועמד /dashboard/candidates/[id] — כפתור התקבל. תאריך הקבלה נשמר בפעם הראשונה ולא נדרס בלחיצה חוזרת.",
  },
  {
    topic: "ביצועי מגייס",
    keywords: ["מגייסים", "מגייס", "ביצועים", "הביצועים שלי"],
    answer:
      'לוח בקרה / מגייסים: /dashboard — וידג\'ט ביצועי מגייסים. אדמין/office רואים את כל המגייסים; מגייס רגיל רואה רק את עצמו.',
  },
]

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/["״]/g, "")
    .replace(/קו["\u05f4]?ח/g, "קוח")
}

export function lookupCrmHowTo(question: string): CrmHowToSnippet[] {
  const q = normalizeQuestion(question || "")
  if (!q.trim()) return [SCREENS_OVERVIEW]

  const scored = PLAYBOOK.map((item) => {
    const hits = item.keywords.filter((kw) => q.includes(kw.toLowerCase())).length
    return { item, hits }
  })
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits)

  if (!scored.length) return [SCREENS_OVERVIEW]

  const unique: CrmHowToSnippet[] = []
  for (const row of scored) {
    if (unique.some((s) => s.topic === row.item.topic)) continue
    unique.push({ topic: row.item.topic, answer: row.item.answer })
    if (unique.length >= 3) break
  }
  return unique
}
