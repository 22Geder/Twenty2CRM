---
applyTo: "crm-app/src/lib/matching-*.ts,crm-app/src/lib/israel-distance.ts,crm-app/src/app/api/positions/**,crm-app/src/app/api/candidates/**,crm-app/src/app/api/upload/**,crm-app/src/app/api/ai-match-v3/**,crm-app/src/app/api/ai-candidate-search/**,crm-app/src/app/api/best-matches/**,crm-app/src/app/api/job-imports/**,crm-app/src/components/matching-*.tsx,crm-app/src/components/ai-candidate-search.tsx,crm-app/src/app/dashboard/positions/**,crm-app/src/app/dashboard/candidates/**,crm-app/prisma/add-*.js,crm-app/prisma/seed-*.js,crm-app/prisma/update-*.js,crm-app/prisma/fix-*.js,crm-app/src/lib/job-position-save.ts,crm-app/src/lib/job-import-parser.ts"
description: "חוזה סנכרון קבוע בין משרות לקורות חיים ב-TWENTY2CRM: מנוע ראיות אחד, רדיוס אחד, מוכנות משרה בעת שמירה, עיר מועמד בעת העלאה. חל אוטומטית על כל עבודה במשרות, מועמדים, העלאות והתאמה."
---

# סנכרון משרות ↔ קורות חיים — חוזה קבוע

מטרת המסמך: שכל סוכן, בכל שיחה, יעבוד באותה דרך בשתי הכניסות למערכת — **משרה שנכנסת** ו**קו״ח שנכנסים** — בלי שהמשתמש יצטרך להסביר מחדש. אומת מול הקוד ב-2026-10-18.

## מנוע אחד, לא חמישה
- כל התאמה (מועמד→משרות, משרה→מועמדים, best-matches, חיפוש מועמדים, ניתוח AI למועמד) עוברת דרך [matching-engine.ts](../../crm-app/src/lib/matching-engine.ts) ו-[matching-api.ts](../../crm-app/src/lib/matching-api.ts). **אין** לכתוב ניקוד חדש, רשימת מילים חדשה, או קריאה ישירה ל-Gemini שנותנת ציון.
- משקלים: תפקיד 35 / כישורים 25 / דרישות 25 / מיקום 15. אין לשנות בלי אישור מפורש של המשתמש.
- רדיוס גאוגרפי אחיד לכל המשרות: `DEFAULT_RADIUS_KM` ב-[matching-location.ts](../../crm-app/src/lib/matching-location.ts) (כיום 12 ק״מ אווירי). שינוי = שינוי הקבוע הזה בלבד; ארצי/מרחוק/הסעה מפורשת עוקפים אותו, לא כישורים ולא דרישות.
- Gemini משמש רק לקישורים סמנטיים עם ציטוטים מאומתים ([matching-semantic.ts](../../crm-app/src/lib/matching-semantic.ts)); תוצאה מקודמת לכל היותר ל"לבדיקה", לעולם לא ל"מתאים" ולא לאישור רישיון/תואר.
- מסלולי legacy (`smart-matching`, `advanced-matching`, `dual-matching`, Avigdor, recruitment-board) אינם המנוע. אין להרחיב אותם; תיקון = הפניה למנוע המשותף.

## כשמשרה נכנסת (יצירה, bulk-upload, ייבוא ממייל, עריכה)
**פרוטוקול חובה:** כשהמשתמש מבקש להוסיף/לעדכן משרות או לקוח חדש עם משרות — אם לא הפעיל במפורש את [`/add-jobs`](../prompts/add-jobs.prompt.md), שאל שאלה אחת לפני כל פעולה: *"להפעיל את פרוטוקול המשרות (מקצוע/עיר 12 ק״מ/חובה-יתרון/כישורים + דוח מוכנות)?"*. אישור = עבוד לפי הפרוטוקול במלואו. הוספת משרות ומעסיקים **מותרת** במסגרתו; מחיקה לא.

1. השמירה נשארת דרך `saveParsedJob` / `PUT /api/positions/[id]` / סקריפט Prisma ייעודי. אין לקצר טקסט, אין לסכם דרישות, אין למחוק שדות.
2. `GET /api/positions/[id]` מחזיר `matchingReadiness` מ-`assessMatchingReadiness` — חישוב טהור, ללא כתיבה. דף המשרה מציג אותו. שלושת המדדים:
   - **מקצוע בכותרת** מזוהה במילון (`MATCHING_CONCEPTS`, kind `role`). אם לא — המועמד לא יקבל "תפקיד תואם". הפתרון הנכון: להוסיף מושג/כינוי למילון עם בדיקה, לא לשנות את הכותרת של הלקוח.
   - **עיר מדידה** (יש קואורדינטות ב-[israel-distance.ts](../../crm-app/src/lib/israel-distance.ts) ושם ב-`LOCALITIES`). יישוב חדש = להוסיף קואורדינטות + שם + בדיקה ב-`matching-location.test.ts`.
   - **דרישות עם חובה/יתרון** — שורה לכל דרישה. בלי סימון הכל `unknown`.
3. מילות מפתח/תגיות שהמגייס תייג נכנסות אוטומטית לציון הכישורים דרך `curatedSkillTerms` (עד 8, אחרי סינון תנאים/מעסיק/עיר/מזהים). כדי שמילת מפתח תיספר היא חייבת להיות כישור שמופיע מילה במילה בקו״ח; תנאים והטבות לא נספרים גם אם יתווספו.
4. המועמדים המתאימים זמינים מיד ב-`GET /api/positions/[id]/matching-candidates` (סיידבר דף המשרה) — סריקה של **כל** המועמדים, לא top-N.
5. אימות אחרי שמירה (קריאה בלבד): `READINESS_EMPLOYER="שם"` או `READINESS_IDS="id,id"` ואז `npx vitest run src/lib/__tests__/position-readiness.report.test.ts --reporter=verbose`. כל משרה חייבת `READY`; `FIX:` מתקנים בשדות המשרה, לא במנוע.

## כשקו״ח נכנסים (upload, Gmail, WhatsApp, share-target)
1. הטקסט המלא נשמר ב-`resume`; המנוע קורא אותו במלואו. אין קיצוץ ל-2,000 תווים ואין "תקציר" במקום המקור.
2. אם ה-AI/regex לא זיהו עיר, [upload/route.ts](../../crm-app/src/app/api/upload/route.ts) משלים אותה מ-`extractCandidateCity` (עדות מגורים/קשר בלבד, לעולם לא עיר מעסיק). אין להמציא עיר.
3. `currentTitle` הוא עזר בלבד; ההתאמה מבוססת על קו״ח מלאים, ולכן אין להסיק תפקיד נוכחי "כדי שיהיה".
4. המשרות המתאימות זמינות מיד ב-`GET /api/candidates/[id]/matching-positions` ו-`POST /api/ai-match-v3`; הסמנטיקה היא שלב שני אופציונלי.

## כשמשפרים דיוק
- קודם נתונים: הריצו ספירה קריאה-בלבד (כמה כותרות בלי מקצוע מזוהה, כמה מיקומים לא מדידים, כמה דרישות בלי סימון). רק אז מרחיבים מילון/גאוגרפיה.
- כל הרחבה = כינויים מפורשים (לא תת-מחרוזת, לא stemming), בדיקת "לא ממציא": מילה דו-משמעית (`אורז`, `בוחן`, `מאבחן`, `רכש`, `מסגרת`, `מרכיבים`) חייבת בדיקה שלילית ב-`matching-text.test.ts`.
- תווית (`label`) של מושג נרשמת גם ככינוי — לעולם לא מילה כללית אחת.
- מדדי קבלה לשינוי: `npx vitest run` על שבעת קובצי `matching-*`/`israel-distance` ירוקים; `get_errors` נקי; build אחד; פריסה אחת. לא מריצים Gemini בבדיקות.

## אסור
- `git add .`; שינוי schema; מחיקת/עדכון מועמדים או משרות ב-DB כחלק משיפור התאמה; הדפסת קו״ח או פרטי קשר ללוג; ניקוד לפי גיל/מין/דת/מצב משפחתי.
