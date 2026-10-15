---
name: matching-geography
description: "Audit TWENTY2CRM matching geography without guessing residence or commute. Use when: עיר מגורים, מרחק, משרה ארצית, כל הארץ, עבודה מרחוק, הסעות, nationwide, remote, radius, shuttle origin, location unknown."
---

# גאוגרפיה בהתאמת משרות

פעולה ממוקדת: להבחין בין התאמה גאוגרפית, חריגת מרחק וחוסר מידע. [נתב וגבולות](../cv-job-matching-precision/SKILL.md#L1). המימוש המקומי ב־[matching-location.ts](../../../crm-app/src/lib/matching-location.ts#L1) משתמש ב־[מאגר היישובים](../../../crm-app/src/lib/israel-locations-complete.ts#L1) וב־[מרחקים](../../../crm-app/src/lib/israel-distance.ts#L1); אין צורך ב־geocoding או רשת.

## קלט
`MatchingLocationInput`: עיר/טקסט מועמד, מיקום/כותרת/תיאור משרה, `transportation`, `workHours`, ורדיוס אופציונלי. עקוב אחר קריאת המנוע: הוא מצרף גם דרישות ל־`positionDescription`. אין להמציא רכב, רילוקיישן או זמינות לנסיעות.

## פעולות
1. עיר מובנית תקינה וחד־משמעית קודמת ל־`extractCandidateCity`. חילוץ מטקסט נשען על מגורים/פרטי קשר או כותרת ברורה, לא עיר מעסיק/אוניברסיטה; סתירות נשארות null.
2. בדוק שמות מלאים ו־aliases: שם ארוך קודם לשם הכלול בו. יבנה אינה גן יבנה, מודיעין אינה מודיעין עילית, ״קריות״ הוא אזור ולא עיר שרירותית.
3. בדוק היקף תפקיד **ארצי מפורש** לפני מרחק: מיקום ארצי או אחריות עבודה ארצית, לא חברה עם סניפים ולא ״הסעות מכל הארץ״. שלילה או אתר ״בלבד״ מונעים חריגה. משרה ארצית יכולה להתאים גאוגרפית גם ללא עיר מועמד, אך אינה עוקפת מקצוע, רישיון או דרישה.
4. עבודה מלאה מרחוק דורשת ניסוח מתאים ללא היברידיות/הגעה סותרת. ״תמיכה מרחוק״, אפשרות ליום מהבית או חלק מהשבוע אינם פטור מרחק.
5. בהיעדר חריגה: בדוק עיר זהה ואז האתר הקרוב הנמדד. ברירת הרדיוס היא 30 ק״מ; הגבול כולל, 0 חוקי וערך לא תקין חוזר לברירת המחדל. זה מרחק **אווירי**, לא קילומטרי כביש או דקות נסיעה.
6. הסעה צריכה מקור מפורש מעיר המועמד, לא יעד, אזור, תנאי או אפשרות; יעד שצוין צריך להתאים לאתר. שלילה גוברת. אחר כך בדוק אזור משותף, ולבסוף far רק אם כל חלופות האתר ידועות ונמדדות; חלופה לא פתורה משאירה unknown.

## פלט
שמור `MatchingLocationResult`: `eligible:true/false/null`, `matchType`, `distanceKm`, `candidateCity`, `matchedCity`, `isExactCity`, `isNationwide`, `reason` ונקודות. אל תהפוך null לשלילה או true להחלטת גיוס.

| סוג | נקודות מקומיות | משמעות |
|---|---|---|
| exact / nationwide / remote | 15 | התאמה גאוגרפית לפי הכללים, לא התאמה מקצועית |
| nearby | 8–14 | מרחק נמדד בתוך הרדיוס |
| transport | 12 | הסעה מפורשת, ללא חישוב זמן נסיעה |
| region | 6 | `eligible:null`; אזור אינו אתר מדויק |
| far / unknown | 0 | far הוא false; unknown הוא null |

## מקרי קצה ובדיקה
- יישוב מוכר ללא קואורדינטות: זהות עיר עדיין אפשרית, אך אין להמציא מרחק לעיר אחרת.
- כמה אתרים, עיר לא מוכרת, קיצור הדומה למילה/שם אדם, `ק״מ` בטקסט וערים סותרות בכותרת.
- הסעות בוקר בלבד או לפי ביקוש אינן אישור אוטומטי. גם transport גאוגרפי תקין עשוי להשאיר סעיף `transportation`/`workHours` כ־unknown ב־[matching-requirements](../matching-requirements/SKILL.md#L1); אין כאן אישור זמינות.
- בדוק שהחלפת עיר אינה הופכת מקצוע לא קשור למומלץ ושארצי אינו עוקף הסמכה. עוגנים: [matching-location.test.ts](../../../crm-app/src/lib/__tests__/matching-location.test.ts#L1), [matching-engine.test.ts](../../../crm-app/src/lib/__tests__/matching-engine.test.ts#L1), לפי [כללי ההערכה](../matching-regression-eval/SKILL.md#L1).