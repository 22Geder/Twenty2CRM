---
name: matching-concepts-he-en
description: "Audit Hebrew-English matching concepts, token boundaries and assertions in TWENTY2CRM. Use when: מילים נרדפות, מקצוע קרוב, שלילה, עברית אנגלית, מילון התאמה, HE/EN aliases, role adjacency, Java vs JavaScript, SQL vs NoSQL, license mismatch."
---

# מושגים מקצועיים בעברית ובאנגלית

פעולה ממוקדת: לברר שקילות או קרבה בלי להפוך דמיון טקסטואלי להסמכה. [נתב וגבולות](../cv-job-matching-precision/SKILL.md#L1); מקור האמת הוא [matching-text.ts](../../../crm-app/src/lib/matching-text.ts#L1), לא מילון חיפוש legacy.

## קלט
מונח מועמד ומונח משרה, ההקשר המלא מכל צד, מקור השדה והתוצאה הצפויה. בדוק את `MATCHING_CONCEPTS`, `kind`, `family` ו־`aliases` הקיימים; אין להניח שהמילון מכסה כל מקצוע או שפה.

## פעולות
1. השתמש ב־`createMatchingTextIndex` וב־`findIndexedTermEvidence` לשמירת כל ההופעות והאופסטים. `findTermEvidence` עשוי לבחור הופעה חיובית אחת ואינו תחליף לבדיקה של ראיות סותרות.
2. בדוק `normalizeMatchingText`: נרמול Unicode/case/ניקוד/RTL וגרשיים, תוך שמירת סימנים מקצועיים כמו `C#`, `C++`, `.NET`, `Node.js`. אין התאמות מתוך email/URL או ביטוי שנוצר מחיבור שורות נפרדות.
3. בדוק גבולות טוקנים וביטוי ארוך לפני ביטוי גנרי. הקידומות המקומיות מוגבלות ל־`וב/ול/וכ/וה/ב/ל/כ/ו/ה` כשהשורש הנותר ארוך מספיק; אין הסרה שרירותית של מ׳ או ש׳. ״מנהג״ אינו ״נהג״.
4. `matchingTermsEquivalent` בודק זהות מנורמלת או aliases מפורשים של אותו מושג, לא Levenshtein. family משותף מציין קרבה בלבד: בנקאי/טלר ומנהל חשבונות/רו״ח אינם aliases זה של זה.
5. בדוק `assertion` והקשר בשני המקורות: שלילה, רשימה שלילית, שאיפה או לימודים בתהליך אינם אישור כישור. כללי הדרישות והסתירות מפורטים ב־[matching-requirements](../matching-requirements/SKILL.md#L1).
6. מושג חסר אינו ״לא מתאים״. חיפוש ביטוי מילולי עשוי למצוא ראיה גם מחוץ למילון, אך אינו פותר דרישה לא נתמכת. הצעת alias חדש צריכה מקור מקצועי ודוגמאות חיוביות/שליליות; הוספה לקוד רק במסגרת שינוי runtime מורשה.

## פלט
החזר מושג קיים או פער כיסוי, מקור וציטוט ממוקם, assertion, והבחנה בין **זהה / alias / תפקיד קרוב / אין די מידע**. זו מסקנת הסוכן, לא הרחבה אוטומטית של סכמת API. אין לאחד credentials שונים, לשמור תגיות או לאשר מועמד בעקבות שם מושג.

## מקרי קצה ובדיקה
- `Java` ≠ `JavaScript`, `SQL` ≠ `NoSQL`, `C#` ≠ `C++`, רישיון B ≠ C ≠ C1; הפעלת מלגזה אינה רישיון מלגזה.
- ״מהנדס חשמל״ ≠ ״הנדסאי חשמל״; ״מנהל״ לבדו אינו ראיה למקצוע. בדוק התנגשות alias ושם כללי הכלול בתפקיד ספציפי.
- בדוק זכר/נקבה ורבים כניסוח תפקיד בלבד, לא מגדר מועמד; תרגום מדויק עם ציטוט מקורי, לא ציטוט מתורגם מומצא.
- אינדוקס מלא גם מעבר לאלפי מופעים; אין cutoff של 2,000 ראיות או תווים. בדוק מקור ואופסט אחרי נרמול וסימני RTL.
- עוגן בדיקות: [matching-text.test.ts](../../../crm-app/src/lib/__tests__/matching-text.test.ts#L1), ומבחני השפעה ב־[matching-engine.test.ts](../../../crm-app/src/lib/__tests__/matching-engine.test.ts#L1). היקף הרצה לפי [matching-regression-eval](../matching-regression-eval/SKILL.md#L1).