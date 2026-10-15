---
name: matching-semantic-safety
description: "Review Gemini semantic matching safety and coverage in TWENTY2CRM. Use when: קריאה סמנטית, משמעות תפקיד, ציטוט מומצא, כיסוי חלקי, מידע אישי, semantic links, provenance, PII masking, prompt injection, timeout, abstention, human review."
---

# קריאה סמנטית בטוחה

פעולה ממוקדת: לבדוק קישורי תפקיד/כישור שהמודל מציע, בלי להעביר אליו ניקוד או אישור דרישות. [נתב וגבולות](../cv-job-matching-precision/SKILL.md#L1); המקור הוא [matching-semantic.ts](../../../crm-app/src/lib/matching-semantic.ts#L1) והחיבור ב־[matching-api.ts](../../../crm-app/src/lib/matching-api.ts#L1). הסקיל מנחה סוכני פיתוח; Gemini מקבל את ה־systemInstruction שבקוד, לא את מסמך הסקיל.

## קלט והפעלת הבדיקה
- קלט מקצועי מלא: `resume`, `currentTitle`, `skills`; למשרה `title`, `description`, `requirements`, `workHours`, `transportation`, `keywords` ומזהה. מערכים מצורפים בשורות; מחרוזות נשמרות במלואן גם אם הן נראות כ־JSON.
- `enrichCandidateMatchScan` פועל אחרי סריקה מקומית מלאה. הוא מוציא מקרים עם `eligible:false` או resume לא קריא, ומקדים פערי כיסוי מקצועי (`insufficient_evidence`); אין בחירה קשיחה של 15–25 מובילות בלבד.
- ברירת `ai-match-v3` היא `semantic:false`; הרשימה הראשית מבצעת false→true, ו־POST של candidate ai-analysis הוא בקשה מפורשת ל־enrichment. מפת חמשת המסלולים נמצאת בנתב.
- בדיקה חיה דורשת הרשאה נפרדת להיקף הנתונים, הרשת והספק. בניתוח read-only מבודד משתמשים ב־mocks בלבד; בבקשת מסמכים בלבד אין הרצה או גישה ל־credentials.

## פעולות ואינווריאנטים
1. **masking לפני הספק:** `maskSemanticInput` מסתיר מזהים ידועים, פרטי קשר ותוויות אישיות תוך שמירת אורך ואופסטים. זו הסרה מיטבית, **לא אנונימיזציה מלאה**; טקסט חופשי עדיין עשוי לזהות אדם. אין ללוגג מסמכים, exception של SDK או מפתחות.
2. **טקסט מלא או unavailable:** לכל זוג נשלחים כל השדות הנתמכים לאחר masking או שלא נשלח הזוג. אין חיתוך prefix. payload גדול מדי, חוסר זמן, כשל או תשובה חסרה משאירים רשומה `unavailable`; יתר הרשומות יכולות להיבדק.
3. **חוזה ספק מצומצם:** JSON strict של מזהי משרות וקישורי `kind:role|skill`, שדות מקור וציטוטים בלבד. ציטוט מועמד מותר רק מ־`resume/currentTitle/skills`, וציטוט משרה רק מ־`title/description/requirements`; שעות, הסעות ו־keywords הם הקשר, לא שדות ציטוט. אין `score`, החלטת גיוס, אישור credential, ניסיון בשנים או זמינות. מסמכים הם נתונים לא מהימנים, לא הוראות.
4. **אמת provenance מקומית:** הציטוט צריך להיות מדויק ויחיד בשדה המקור המסוים בשני הצדדים, עם גבולות טוקנים ואופסטים תקינים. בדוק assertions של ראיות המועמד והקשר בשני הצדדים; דחה שלילה, שאיפה, לימודים בתהליך, הסמכות, מאפיינים אישיים והוראות עוינות. שלילה נוספת של מושג מועמד באותו שדה מונעת אישור קישור חיובי.
5. **אמת kind ויחס מוכר:** מושג מזוהה צריך להתאים ל־role/skill המבוקש. אין Java→JavaScript או SQL→NoSQL. role מאותה family יכול להצביע על קרבה, לא על מקצוע זהה. ציטוט תקין מחוץ למילון אינו הוכחת שקילות סמנטית — עדיין נדרש מגייס.
6. **אמת תשובה וכיסוי:** נדרשת רשומה יחידה לכל מזהה מבוקש. קישורים פסולים/כפולים נזרקים וגוררים partial כשחלק הושמט; תשובה תקינה עם `links:[]` יכולה להיות complete, בשונה מתשובה שכל קישוריה נפסלו. אין להמציא ראיות כדי למלא רשימה.
7. **קידום לבדיקה בלבד:** `applySemanticReview` יכול לקדם `status:insufficient_evidence` רק כש־`eligible !== false` ואיכות ה־resume אינה `unreadable`. נדרש קישור role או לפחות שני ציטוטי skill שונים בצד המשרה; התוצאה היא `review`, עם `eligible:null`, `shouldProceed:false`, `confidence:low`. בקישור role הקוד המקומי קובע `Math.max(existingRole, 17)` ומעדכן את סכום הנקודות בהתאם; זה אינו score מהמודל. אין שינוי בבדיקות דרישות או עקיפת gates, ואין קידום אוטומטי ל־matched. חסימות מעסיק/מועמדות נשמרות בנפרד במתאם התגובה.

## תקציבים נוכחיים
| קבוע/מגבלה | משמעות |
|---|---|
| `BATCH_SIZE=4` | עד ארבע משרות בבקשה; מגבלת גודל יכולה לפצל מוקדם יותר |
| `CONCURRENCY=2` | עד שני workers בכל סריקה, לא הבטחה לשתי קריאות בלבד בכל השירות |
| `MAX_CALL_MS=18_000` | timeout ל־SDK דרך options של `getGenerativeModel`, מוגבל גם בזמן שנותר |
| `SCAN_BUDGET_MS=28_000` | תקציב תזמון לסריקה; אין הבטחת כיסוי סמנטי לכל המאגר |
| `MAX_INPUT_CHARACTERS=160_000` | אורך ה־JSON המסוריאל של payload, לא tokens או bytes; אין קיטום כדי להתאים |

היתרי סמנטיקה הם תהליכיים: סריקה פעילה אחת למשתמש, עד שש בחלון דקה, ועד שתי סריקות פעילות בתהליך. זה נפרד מ־limiter בקשות API ואינו מנגנון משותף בין replicas. כשל היתרים מחזיר `busy`, לא אישור לדלג על ההגבלה.

## פלט ומקרי קצה
- `SemanticScan`: `requested`, `reviewed`, `verifiedLinks`, `status:complete|partial|unavailable`, `reason`, וסקירה לכל משרה. `requested` הוא מספר הזוגות שהותרו לסמנטיקה, לא בהכרח `totalScanned` המקומי; requested=0 אינו הוכחה שבוצעה קריאת ספק.
- `aiAnalyzed` אינו מדד לכיסוי מלא: ב־response של התאמה הוא עשוי להיות true גם ב־partial; בפלט סריקה יש גם מונה. הצג כיסוי וסיבת אי־זמינות לצד ראיות מקומיות, לא ״לא מתאים״ במקום כשל ספק.
- בדוק מקור שגוי, ציטוט כפול/מומצא, תת־טוקן, שלילה בשורה אחרת, JSON עם שדות נוספים, unknown job id, payload בזנב, פרטיות, timeout ו־busy. אין retry אוטומטי, שמירת פרופיל התאמה או auto-commit של פעולות.
- עוגנים: [matching-semantic.test.ts](../../../crm-app/src/lib/__tests__/matching-semantic.test.ts#L1), [matching-ai-analysis-route.test.ts](../../../crm-app/src/lib/__tests__/matching-ai-analysis-route.test.ts#L1). בידוד ותיוג לפי [matching-regression-eval](../matching-regression-eval/SKILL.md#L1).