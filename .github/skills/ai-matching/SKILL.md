---
name: ai-matching
description: "Debug TWENTY2CRM matching routes and distinguish the shared evidence engine from legacy flows. Use when: התאמה לא עובדת, אין תוצאות, שגיאת Gemini, 429, 500, timeout, ai-match-v3, ai-analysis, best-matches, smart-matching, advanced-matching, dual matching, matching diagnostics."
---

# דיאגנוסטיקה של matching

סקיל לסוכן פיתוח, לא prompt ש־Gemini טוען. מקור המפה והניקוד העדכניים הוא [cv-job-matching-precision](../cv-job-matching-precision/SKILL.md#L1); אל תשחזר כאן מנוע חלופי או את חוקי הניקוד הישנים.

## קלט וגבולות
קבל מסלול + method, צרכן UI, קוד שגיאה/מצב כיסוי ודוגמה סינתטית. פעל לפי [כללי ההגנה](../../instructions/00-safety-master.instructions.md#L1) והיקף הבקשה: תיעוד אינו אישור להפעיל API, DB, טרמינל או ספק. אין לקרוא סודות, להדפיס payload או לכתוב פרופיל התאמה לצורך ״תיקון״.

## פעולות דיאגנוסטיות
1. **זהה את המסלול בפועל.** המנוע המשותף נמצא ב־[matching-api.ts](../../../crm-app/src/lib/matching-api.ts#L1) וב־[matching-engine.ts](../../../crm-app/src/lib/matching-engine.ts#L1), לא בכל קובץ ששמו matching. קרא קובץ מלא וצרכנים לפני שינוי מורשה.
2. **בדוק הרשאה ו־validation תחילה.** `matchingIdSchema` מקבל מזהה ASCII לא ריק, עד 128 תווים, לאחר trim. במסלולי paging: `offset` שלם 0–100000 ו־`limit` שלם 1–100. auth קודם לקריאת נתונים ולקריאת ספק.
3. **הפרד כשל בקשה מחוסר ראיות.** היעזר בטבלה; ציון 0 או רשימה ריקה אינם הוכחה ל־aiProfile חסר או ל־cache שגוי.
4. **בדוק את מצב הבקשה הסמנטית.** ברירת API של `ai-match-v3` היא false; הרשימה הראשית מבצעת false→true. `ai-analysis` של מועמד מבקש enrichment במפורש. הפרטים והתקציבים ב־[matching-semantic-safety](../matching-semantic-safety/SKILL.md#L1).
5. **עקוב אחר הכיסוי.** כל עמודי המועמדים נקראים בקבוצות של 50; חלון תגובה עד 100 אינו scan cap. הפרד `totalScanned`, מסנני סטטוס, `matchStatus`, `isBlocked` וכיסוי ספק.
6. **שחזר בבידוד.** השתמש ב־[matching-regression-eval](../matching-regression-eval/SKILL.md#L1) רק אם הותר להריץ בדיקות. אל תוסיף retries, cache של PII, מינימום ציון או שינוי timeout כטיפול עיוור.

| תסמין | בדיקה ממוקדת |
|---|---|
| 400 | JSON, מזהים וגבולות paging מול סכמת המסלול; לא לעקוף validation |
| 401/403 | שרשרת `authorizeMatchingRequest`/`requireApiUser`; לא לזייף user id או לחשוף session |
| 404 | מזהה חסר או משרה שאינה פתוחה בסריקה קדימה; במסלול ההפוך משרה קיימת שאינה פתוחה יכולה להחזיר אפס המלצות, לא 404 |
| 429 | limiter בקשות משותף או תגובת auth. במימוש הנוכחי מגבלת הבקשות היא 30 לדקה למשתמש בתהליך; זו אינה מגבלה משותפת בין replicas |
| semantic unavailable | `no_key`, `busy` או `partial_or_failed`; מצב חסר מפתח אינו שגיאת matching מקומי. אין צורך לקרוא credential כדי לפרש את המצב |
| 500 / timeout | שגיאה כללית ושכבת הכשל; בדיקת provider עם mock. אין להדפיס exception/prompt/פרטי מועמד או להפעיל ספק לצורך אבחון ללא הרשאה |
| מעט/אפס המלצות | איכות resume, פער מילון, דרישות unknown, מרחק, משרה סגורה או מסנן עסקי; פנה לסקיל הממוקד דרך הנתב |

## הקשר legacy — לא חלק מחמשת המסלולים
הנתיבים הבאים נשמרים כמפת חקירה בלבד. **אין לקרוא להם בהערכה read-only**; השם ״ניתוח״ אינו מבטיח היעדר כתיבות.

| זרימה | מקורות והבחנה |
|---|---|
| Advanced | [מסלול](../../../crm-app/src/app/api/advanced-matching/route.ts#L1), [מנוע legacy](../../../crm-app/src/lib/advanced-matching.ts#L1), [תצוגה](../../../crm-app/src/components/advanced-matching-view.tsx#L1). המסלול עשוי לשמור `aiProfile` של מועמד ומשרה. |
| Smart | [smart-matching](../../../crm-app/src/app/api/smart-matching/route.ts#L1) כולל כתיבות פרופילים. אין לבלבל אותו עם [smart-ai-matching.tsx](../../../crm-app/src/components/smart-ai-matching.tsx#L1), שקורא ל־ai-match-v3 ללא semantic. |
| Dual | [מסלול](../../../crm-app/src/app/api/dual-matching/route.ts#L1), [gemini-ai.ts](../../../crm-app/src/lib/gemini-ai.ts#L1), [תצוגה](../../../crm-app/src/components/dual-matching-view.tsx#L1). המסלול כולל ניסיון כתיבה ל־activityLog. |
| Avigdor | [avigdor-chat](../../../crm-app/src/app/api/avigdor-chat/route.ts#L1), [avigdor-chat-helpers.ts](../../../crm-app/src/lib/avigdor-chat-helpers.ts#L1), [avigdor-fast-match.ts](../../../crm-app/src/lib/avigdor-fast-match.ts#L1). כיסוי וחוזים נפרדים, לא סריקה מלאה לפי החוזה המשותף. |
| Recruitment board | [המסך](../../../crm-app/src/app/dashboard/recruitment-board/page.tsx#L1) כולל ניקוד מקומי וקריאה ל־[analyze-cv-dual](../../../crm-app/src/app/api/analyze-cv-dual/route.ts#L1); אינו מאוחד. |
| ניתוחים נוספים | [ai-analyze](../../../crm-app/src/app/api/ai-analyze/route.ts#L1) ו־[ultra-analyze](../../../crm-app/src/app/api/ultra-analyze/route.ts#L1) דורשים בדיקת חוזה ותופעות לוואי נפרדת; אינם ה־ai-analysis המשותף של מועמד. |

## פלט וסיום
דווח: המסלול והסיבה הנתמכת בראיות, איזה חלק מקומי/סמנטי נבדק, מה לא אומת, והבדיקה המבודדת הבאה. שמור טיפוסי תגובה וחסימות; אין auto-commit של פרופיל, מועמדות או פעולה. בדוק diagnostics לכל קובץ ששונה ודווח על בדיקות שלא הורצו. הרשאות מיוחדות לשינוי מנועי legacy, schema ותלויות נשארות לפי כללי ההגנה.
