---
name: cv-job-matching-precision
description: "Route TWENTY2CRM CV/job matching work to focused evidence, Hebrew-English concepts, geography, requirements, semantic safety and evaluation skills. Use when: דיוק התאמה, קריאת קורות חיים, משרה לא קשורה, ציון התאמה, matching-positions, matching-candidates, ai-match-v3, ai-analysis, best-matches, precision, recall, golden set."
---

# התאמת קורות חיים למשרות — נתב סקילים

מפת קוד ותהליך עבודה לסוכני פיתוח, מאומתת בקריאת המקורות ב־2026-10-14; יש לאמת שוב לפני שינוי. **הסקילים אינם נטענים אוטומטית ל־Gemini ואינם משנים את ה־runtime.** הם אינם מעניקים הרשאת הפעלה, גישה לנתונים או כתיבה.

## קלט וגבולות
- קבל תסמין, מסלול וצרכן UI, התנהגות צפויה, ודוגמה סינתטית או מידע שהותר במפורש לבדיקה.
- פעל לפי [כללי ההגנה הראשיים](../../instructions/00-safety-master.instructions.md#L1). בבקשת תיעוד בלבד: קריאת מקורות ועריכת המסמכים המותרים בלבד; בלי טרמינל, DB, רשת, credentials או שינויי runtime.
- אין לכתוב פרופיל התאמה, `aiProfile`, תגיות או סטטוסים כחלק מהערכה; אין לבצע הפניה, יצירת מועמדות או תקשורת אוטומטית בעקבות ציון.
- אין ניקוד לפי גיל, מין, מגדר, מצב משפחתי, דת, מוצא, הריון או מאפיינים אישיים. אין להדפיס קו״ח או פרטי קשר ללוגים.

## בחירת פעולה
טען רק את הסקיל הדרוש; כשיש כמה תסמינים, התקדם לפי שרשרת הראיות ולא לפי גובה הציון.

| פעולה | סקיל ממוקד |
|---|---|
| איכות טקסט, מקור העובדה, ציטוטים, ניסיון מול שאיפה | [cv-evidence-reading](../cv-evidence-reading/SKILL.md#L1) |
| מילון HE/EN, גבולות מילים, שלילה, קרבת תפקידים | [matching-concepts-he-en](../matching-concepts-he-en/SKILL.md#L1) |
| עיר מגורים, מרחק, ארצי, מרחוק והסעות | [matching-geography](../matching-geography/SKILL.md#L1) |
| חובה/יתרון, רישיון, תואר, ניסיון וחוסר מידע | [matching-requirements](../matching-requirements/SKILL.md#L1) |
| Gemini, כיסוי מלא/חלקי, PII, provenance וקידום לבדיקה | [matching-semantic-safety](../matching-semantic-safety/SKILL.md#L1) |
| רגרסיות מבודדות, תיוג עברי ו־golden set | [matching-regression-eval](../matching-regression-eval/SKILL.md#L1) |
| 400/401/403/404/429/500, timeout או נתיב legacy | [ai-matching](../ai-matching/SKILL.md#L1) |
| חילוץ PDF/DOCX/OCR לפני matching | [cv-upload](../cv-upload/SKILL.md#L1) |

## מפת המנוע המשותף
| מקור | אחריות |
|---|---|
| [matching-text.ts](../../../crm-app/src/lib/matching-text.ts#L1) | `MATCHING_CONCEPTS`, אינדוקס מלא, aliases מפורשים, `MatchingEvidence` ואופסטים |
| [matching-engine.ts](../../../crm-app/src/lib/matching-engine.ts#L1) | `prepareMatchingCandidate`, `prepareMatchingPosition`, `evaluatePreparedMatch`, שערים, ניקוד ומיון |
| [matching-location.ts](../../../crm-app/src/lib/matching-location.ts#L1) | `extractCandidateCity`, `evaluateMatchingLocation`; נעזר במאגר היישובים וב־`getDistanceKm` |
| [matching-semantic.ts](../../../crm-app/src/lib/matching-semantic.ts#L1) | `reviewMatchingSemantics`, אימות קישורי מקור ו־`applySemanticReview` |
| [matching-api.ts](../../../crm-app/src/lib/matching-api.ts#L1) | הרשאה, validation, בחירת שדות, סריקה, חסימות, enrichment ומתאמי תגובה |

### חמישה מסלולים משותפים בלבד
| מסלול | חוזה וכיסוי |
|---|---|
| `POST /api/ai-match-v3` — [מקור](../../../crm-app/src/app/api/ai-match-v3/route.ts#L1) | `candidateId`, אופציונלי `positionId`, ו־`semantic` שבברירת מחדל **false**. סריקה מקומית של כל המשרות הפתוחות או המשרה המבוקשת; true מבקש enrichment, לא ניקוד מהמודל. |
| `GET /api/candidates/[id]/matching-positions` — [מקור](../../../crm-app/src/app/api/candidates/[id]/matching-positions/route.ts#L1) | קורא גם `resume` ו־`skills`. סורק את כל המשרות הפתוחות; `offset=0`, `limit=20`, מקסימום 100 לתגובה. ללא סמנטיקה. |
| `GET /api/positions/[id]/matching-candidates` — [מקור](../../../crm-app/src/app/api/positions/[id]/matching-candidates/route.ts#L1) | כל המועמדים בעמודי cursor של 50; `offset=0`, `limit=100`, מקסימום 100 לתגובה. מצב המשרה נבדק במנוע; ללא סמנטיקה. |
| `GET /api/best-matches` — [מקור](../../../crm-app/src/app/api/best-matches/route.ts#L1) | כל המשרות הפתוחות וכל עמודי המועמדים, 50 בכל קריאה; מסנן מועמדים במצב hired/in-process לפני דירוג. מחזיר עד 20 לכל משרה; ללא סמנטיקה. |
| `POST /api/candidates/[id]/ai-analysis` — [מקור](../../../crm-app/src/app/api/candidates/[id]/ai-analysis/route.ts#L1) | `positionId` חובה בגוף. בקשה מפורשת לסריקה ו־enrichment של הזוג דרך אותו שירות. אין opt-out סמנטי בגוף; שערים או אי־זמינות עדיין עשויים למנוע קריאת ספק. |

- סריקות המשרות קדימה ו־best-matches משתמשות ב־`active:true, closedAt:null`. המנוע אינו ממליץ על משרה לא פתוחה גם במסלול ההפוך.
- מגבלות 100/20 הן **חלונות פלט, לא גבולות סריקה**. אין תקרת 500 מועמדים, ואין סינון top-25 לפני הסריקה המקומית. בדוק `totalScanned`, `totalCount`, `hasMore` ו־`scanComplete` בנפרד מכיסוי סמנטי.
- [matching-positions-list.tsx](../../../crm-app/src/components/matching-positions-list.tsx#L1) מציג כעת `scan(false)` ואחריו `scan(true)`; כשל בשלב השני משאיר תוצאות מקומיות. לעומתו [smart-ai-matching.tsx](../../../crm-app/src/components/smart-ai-matching.tsx#L1) משמיט `semantic`, ולכן אינו מפעיל enrichment כברירת מחדל.
- `smart-matching`, `advanced-matching`, `dual-matching`, Avigdor ו־recruitment-board **אינם מאוחדים** במפה זו. לחלקם כתיבות DB; אין לקרוא להם לצורך הערכה read-only. הקשרים מדויקים ב־[ai-matching](../ai-matching/SKILL.md#L1).

## חוזים שאין לפרש מחדש
1. **כיסוי טקסט:** האינדקס קורא את מלוא הטקסט שסופק, כולל הזנב, ללא cutoff של 2,000 או קיטום רשימת הראיות. זה אינו מוכיח שכל עמוד בקובץ המקורי חולץ או שכל מקצוע מוכר למילון.
2. **ניקוד:** תפקיד 35 / כישורים 25 / דרישות 25 / מיקום 15 — נקודות עזר, לא הסתברות ולא precision נמדד. אין מינימום מלאכותי ואין נרמול מחדש לפי applicability: רכיב ריק אינו מחלק את משקלו לאחרים.
3. **דירוג:** `matched` לפני `review`, אחריהם `insufficient_evidence` ו־`ineligible`; בתוך מצב: ציון, תפקיד, מיקום, ואז מזהה במתאם. אין קדימות עצמאית ל״אותה עיר״.
4. **חוסר מידע:** דרישה שלא הוכחה או אינה נתמכת נשארת `unknown`, לא שלילה. חסר בסיס מקצועי אינו הוכחה לחוסר יכולת. המילון המקומי אינו אוניברסלי.
5. **גאוגרפיה:** היקף משרה ארצי מפורש עוקף מגבלת מרחק מגורים בלבד, לא התאמה מקצועית, דרישות או הסמכות. `workHours` ו־`transportation` עלולים להישאר unknown בבדיקות הדרישות גם כשנמצא קשר מקצועי.
6. **סמנטיקה:** שדות מקצועיים מלאים לאחר masking מיטבי או `unavailable`; לא prefix. המודל מציע קישורי role/skill בלבד. קידום אפשרי הוא לבדיקה אנושית, לא לאישור דרישות או להפניה.
7. **פעולות:** `isSuggestedMatch` כולל גם `review`. במסלולי מועמד→משרות, `positionMatchResponse` משמר `isBlocked` ומבטל `shouldProceed` כשחסום; אין להניח שחסימות מעסיק זהות בכל המתאמים. גם `shouldProceed:true` אינו הרשאת ביצוע.

## תהליך ופלט לסוכן
1. אתר את המסלול והצרכן בפועל; קרא את הקבצים הרלוונטיים במלואם וחפש usages לפני שינוי מורשה.
2. שחזר בדוגמה סינתטית את שרשרת המקור → assertions → דרישות/מיקום → מצב → ניקוד → מתאם. אל תשנה משקלים כדי להסתיר פער כיסוי.
3. הפרד תיעוד מצב נוכחי מהצעת שיפור. שינוי runtime דורש היקף ואישורים מתאימים; הערכת ספק חי או DB אינה שלב אוטומטי.
4. בפלט ציין מסלול/שכבה, ראיות וחוסר מידע, מצב וחסימות, פירוט נקודות וכיסוי מקומי מול סמנטי, ומה נבדק בפועל. בעדכון מסמכים בלבד בצע בדיקת diagnostics למסמכים, לא הרצת matching.
5. לשינוי אלגוריתמי מורשה: היעזר ב־[תוכנית ההערכה](./references/golden-set-eval.md#L1). רגרסיות סינתטיות אינן הוכחת איכות פרודקשן, אפס שגיאות או ״הטוב בעולם״.

## מחקר חיצוני שתועד קודם — תחום המסקנה
במשאבים שנבדקו ותועדו להלן לא זוהה סקיל מוכן המכסה את הדרישות המקומיות. זו **אינה** טענה שאין סקיל כזה בכל מקור אפשרי; לא נערך כאן מחקר חיצוני חדש.

| מקור קיים | שימוש רעיוני והחלטה |
|---|---|
| `anthropics/skills` — `pdf`, `docx` | חילוץ טקסט ומבנה; התחום מופנה ל־cv-upload, לא התקנה במסגרת matching. |
| `career-ops` (career-ops-hq) | evidence over keywords, מקור חשיבות הדרישה, hard-blockers ו־golden-set evaluation; השראה, לא חוזה runtime. |
| `anthropics/knowledge-work-plugins` — `recruiting-pipeline` | שלבי צינור ומדדים; שימוש רעיוני בלבד. |
| `genpark-crustdata-recruiter-screening-skill` | סיווג באנגלית התלוי בשירות חיצוני; לא אומץ לפתרון המקומי. |
| `paramchoudhary/resumeskills` | כתיבת קו״ח ואופטימיזציית ATS למועמד, לא מנוע בחירת משרות ב־CRM. |
