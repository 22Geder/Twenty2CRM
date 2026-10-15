---
name: matching-regression-eval
description: "Plan and validate isolated matching regressions and Hebrew golden-set evaluation for TWENTY2CRM. Use when: בדיקות התאמה, רגרסיה, סט זהב, תיוג מגייס, כיסוי סריקה, precision, recall, golden set, abstention, human review, matching route parity."
---

# רגרסיות והערכת התאמה

פעולה ממוקדת: לבדוק חוזים ושינויי איכות בלי לבלבל tests סינתטיים עם דיוק בעולם האמיתי. [נתב וגבולות](../cv-job-matching-precision/SKILL.md#L1); [תוכנית golden set ותוויות עבריות](../cv-job-matching-precision/references/golden-set-eval.md#L1).

## קלט
שינוי/תסמין, היקף מורשה, גרסת מנוע/נתונים, `asOf` קבוע, fixtures סינתטיים או snapshot שאושר בנפרד, וציפיות מקצועיות מתויגות. הצהרת ״הבדיקות עברו״ דורשת פלט ריצה מסוים; אין לצרף ריצות ישנות או ריצות סוכנים לסך מאומת.

## פעולות
1. **בדוק הרשאה לפני ביצוע.** תיעוד בלבד → קריאת מקורות, קישורים, frontmatter ו־diagnostics בלבד; ללא טרמינל/tests/runtime. משימת בדיקות מורשית → בידוד לפי הסעיפים הבאים, לא קריאה למסד או API חי.
2. **קבע baseline ותיוג עצמאי.** דגום שכבות עבריות/HE-EN, הפרד התאמה מקצועית, דרישות וגאוגרפיה. אל תשתמש בפלט המנוע כתווית אמת; ״דורש בירור״ אינו חיובי אוטומטי. שמור holdout נפרד לפי מועמד/מסמך.
3. **בחר קבצי בדיקה לפי המפה להלן.** בדוק mocks לפני import של routes/SDK/Prisma, חסימת `fetch` וכל פעולת DB לא מפורשת. גם ניסיון כתיבה שנתפס ב־catch חייב להכשיל בדיקה. אין לטעון קובצי סביבה או מפתחות אמיתיים.
4. **בדוק אינווריאנטים ולא רק מספר תוצאות.** quote/offset/assertion, aliases מול adjacency, requirements unknown, סכום breakdown, סדר מצב→ציון ותאימות תגובה. אין מינימום ציון או נרמול רכיבים ריקים כדי לגרום לבדיקה לעבור.
5. **בדוק כיסוי ואבטחה של חמשת המתאמים.** auth לפני parse/data/provider, מזהים ו־paging, שגיאות כלליות, `private, no-store`, scan מקומי מלא, cursor של 50 בכל עמוד, ומועמד מתאים מעבר ל־500. תקרת תגובה 100 או top-20 של best-matches אינה סוף scan. הפרד חסימות/מסנני סטטוס בין מסלולים.
6. **בדוק סמנטיקה בנפרד.** default false ב־ai-match-v3 מול UI false→true ו־ai-analysis מפורש; טקסט מלא או unavailable; קישורים מאומתים בלבד, כיסוי חלקי ו־review ללא הרשאת פעולה. ספק ממוקק אינו הוכחה להבנת Gemini חי.
7. **דווח לפי ראיות הבדיקה.** בדוק TypeScript מעבר לטרנספילציה של Vitest כשיש הרשאה, ו־diagnostics לכל קובץ שנערך. דווח מה לא הורץ; אל תיצור דוח כללי או תשנה זיכרון פרויקט בלי בקשה.

## מפת בדיקות קיימות
| קובץ | תחום |
|---|---|
| [matching-text.test.ts](../../../crm-app/src/lib/__tests__/matching-text.test.ts#L1) | aliases, טוקנים, assertions ואופסטים בזנב |
| [matching-engine.test.ts](../../../crm-app/src/lib/__tests__/matching-engine.test.ts#L1) | ראיות מקצועיות, דרישות, דירוג ו־unknown |
| [matching-location.test.ts](../../../crm-app/src/lib/__tests__/matching-location.test.ts#L1) | מגורים, ארצי/מרחוק, רדיוס והסעות |
| [matching-semantic.test.ts](../../../crm-app/src/lib/__tests__/matching-semantic.test.ts#L1) | masking, גודל מלא, provenance, היתרים, timeout וקידום לבדיקה |
| [matching-api-routes.test.ts](../../../crm-app/src/lib/__tests__/matching-api-routes.test.ts#L1) | ai-match-v3, שני מסלולי GET של matching ו־best-matches; סריקה ו־API isolation |
| [matching-ai-analysis-route.test.ts](../../../crm-app/src/lib/__tests__/matching-ai-analysis-route.test.ts#L1) | המתאם החמישי, POST candidate ai-analysis, עם השירות המשותף וספק ממוקק |

מסלולי smart/advanced/dual/Avigdor/recruitment-board הם legacy מחוץ לאיחוד; חלקם כותבים למסד. אין להפעילם כבדיקת read-only או לייחס את תוצאות בדיקותיהם למנוע המשותף.

## מקרי קצה מחייבים
- משרה ארצית מול עיר רחוקה/חסרה אך גם מול מקצוע לא קשור או הסמכה שנשללה; חברה ארצית אינה תפקיד ארצי.
- adjacency, שלילה, הכשרה בתהליך, qualification unknown, תנאי לא נתמך, ושעות/הסעות שנשארות unknown.
- סוף קו״ח/דרישות לאחר אלפי מופעים, רשומות בעמודים מאוחרים, PII סינתטי, prompt injection וציטוטים מזויפים או עמומים.
- abstention, partial/unavailable, אפס קישורים, review אנושי ללא `shouldProceed`, ובלי כתיבות פרופיל או פעולות אוטומטיות.
- Vitest `it.each` מפרק שורת מערך לארגומנטים; העבר מערך בדיקה כערך בתוך אובייקט. לרגרסיית regex סינכרונית השתמש בבידוד עם מגבלת זמן שניתן לאכוף, כגון `node:vm`; timeout אסינכרוני אינו מפסיק regex שחוסם את הלולאה.

## פלט
סיכום קצר של קבצים/תרחישים שנבדקו, סוג הנתונים, בדיקות שבוצעו/לא בוצעו, מדדים עם מכנה וכיסוי לפי שכבה, וכשלים הדורשים מגייס. אין הבטחת ״אפס שגיאות״, ״הטוב בעולם״ או precision בפרודקשן על בסיס fixtures. אין לשמור ספירת tests מצטברת במסמך הסקיל.