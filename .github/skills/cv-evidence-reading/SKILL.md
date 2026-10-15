---
name: cv-evidence-reading
description: "Read Hebrew/English CV evidence for TWENTY2CRM without inventing qualifications. Use when: קריאה עמוקה, קורות חיים שטחיים, ציטוט מהמקור, ניסיון מול שאיפה, ג׳יבריש, CV evidence, source offsets, resume quality, timeline."
---

# קריאת ראיות מקורות חיים

פעולה ממוקדת: להפריד עובדה מקצועית, metadata וחוסר מידע לפני התאמה. זהו נוהל לסוכן פיתוח, לא רכיב חילוץ שרץ אוטומטית ב־Gemini. [מפה וגבולות משותפים](../cv-job-matching-precision/SKILL.md#L1).

## קלט
טקסט `resume` מלא שכבר חולץ, `currentTitle`, `skills`, תגיות בנפרד, ותיאור התסמין. השתמש בדוגמה סינתטית כברירת מחדל; אין צורך בפרטי קשר או גישה ל־DB. מקור הקוד: [matching-engine.ts](../../../crm-app/src/lib/matching-engine.ts#L1), במיוחד `prepareMatchingCandidate` ו־`candidateEvidence`.

## פעולות
1. קרא את [מדריך הקריאה העברית](../cv-job-matching-precision/references/hebrew-cv-reading.md#L1). בדוק איכות חילוץ לפני הסקת מסקנות; פגם PDF/OCR מופנה ל־[cv-upload](../cv-upload/SKILL.md#L1), בלי להפעיל מסלול העלאה כחלק מהערכה.
2. בדוק `coverage.resumeQuality`. `limited` אינו failed; `unreadable` מונע שימוש בראיות resume אך אינו מוחק מידע מקצועי מובנה. הטקסט המקורי נשמר לציטוטים.
3. אינדקס את כל הטקסט שסופק, לא תחילתו בלבד. לכל ראיה אמת מקור, quote ו־`start/end` מול טקסט המקור המתאים, כולל אופן פריסת `skills` לרשימה.
4. הפרד `positive`, `negated`, `aspiration`, `in_progress`, `uncertain`; שמור הופעות סותרות. tags לבדם אינם ניסיון או הסמכה.
5. בדוק אחריות ותאריכים רלוונטיים, לא ״מספר השנים הראשון״. סידור ציר זמן ידני הוא כלי בדיקה, לא יכולת runtime מלאה או שדה שנשמר אוטומטית. היעדר תאריך סיום אינו הוכחת תפקיד נוכחי.
6. הפנה שקילות מונחים ל־[matching-concepts-he-en](../matching-concepts-he-en/SKILL.md#L1), ניסיון/הסמכות ל־[matching-requirements](../matching-requirements/SKILL.md#L1) ועיר מגורים ל־[matching-geography](../matching-geography/SKILL.md#L1). אל תשלים פערים בניחוש.

## פלט
סיכום מקצועי קצר עם `SourcedEvidence` ממוקם, איכות המקור, סתירות ושאלות לבירור. ציין איזה מידע הגיע מטקסט, משדה מובנה או מתגית; אל תציג היעדר מידע כחוסר יכולת. אין כתיבת פרופיל התאמה/`aiProfile`, שינוי תגיות או פעולה אוטומטית, ואין ניקוד דמוגרפי או הסקת אישיות.

## מקרי קצה ובדיקה
- קו״ח ללא tags, ללא resume, באנגלית בלבד, עם RTL/ניקוד או עם עדות רק בזנב מסמך ארוך ועתיר מופעים.
- עיר מעסיק מול מגורים, תאריכים חופפים, מעבר תחום, לימודים בתהליך, שם הדומה למקצוע וראיה חיובית לצד שלילה.
- שאיפה בתפקיד entry-level עשויה לאפשר review מקומי בתנאים שבמנוע; היא לעולם אינה שנות ניסיון או רישיון.
- בדיקות רלוונטיות: [matching-text.test.ts](../../../crm-app/src/lib/__tests__/matching-text.test.ts#L1), [matching-engine.test.ts](../../../crm-app/src/lib/__tests__/matching-engine.test.ts#L1). הרצה רק בהיקף מורשה לפי [matching-regression-eval](../matching-regression-eval/SKILL.md#L1); תיעוד בלבד אינו הרצת tests.