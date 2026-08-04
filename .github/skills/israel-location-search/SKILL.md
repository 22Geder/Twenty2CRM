# SKILL: Israel Location Search — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- חיפוש מועמדים לפי מיקום לא עובד
- מרחק מחושב שגוי
- עיר לא מזוהה / לא נמצאת
- Commute radius filter לא מסנן נכון
- "אין מועמדים בסביבה" למרות שיש
- הצעות locations לא מוצגות

## קבצים רלוונטיים
```
crm-app/src/lib/israel-locations.ts           ← רשימת ערים בסיסית
crm-app/src/lib/israel-locations-complete.ts  ← רשימה מלאה (600+ ישובים)
crm-app/src/lib/israel-distance.ts            ← חישוב מרחקים
crm-app/src/app/api/positions/route.ts        ← פילטר location
crm-app/src/app/api/candidates/route.ts       ← פילטר city
crm-app/src/app/api/advanced-matching/route.ts ← distance matching
```

## נתונים גיאוגרפיים - מבנה
```typescript
// israel-locations-complete.ts
interface IsraelLocation {
  name: string          // שם העיר בעברית
  nameEn: string        // שם באנגלית
  lat: number           // קו רוחב
  lon: number           // קו אורך
  district: string      // מחוז (צפון, מרכז, דרום, ירושלים, חיפה)
  population?: number   // אוכלוסייה
}
```

## חישוב מרחקים
```typescript
// israel-distance.ts - Haversine formula
// מחשב מרחק בין שתי נקודות בק"מ
// שימוש: findCandidatesNearCity(city, radiusKm)
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: עיר לא מזוהה
```typescript
// בדוק ב-israel-locations-complete.ts
// חפש בשם מדויק + וריאציות:
// "תל אביב" / "תל-אביב" / "Tel Aviv"
// אם חסרה → הוסף לקובץ
```

### שלב 2: מרחק שגוי
```typescript
// בדוק ב-israel-distance.ts:
// - קו רוחב / אורך נכונים לעיר?
// - formula: Haversine (לא Euclidean!)
// - תוצאה ב-KM (לא Miles)
```

### שלב 3: Filter לא עובד
```typescript
// ב-candidates/route.ts - בדוק:
// WHERE city ILIKE '%{city}%'    ← חיפוש חלקי
// vs. exact match               ← חיפוש מדויק
// ILIKE טוב יותר לעברית
```

### שלב 4: Radius matching
```
// בדוק ב-advanced-matching.ts:
// DEFAULT_RADIUS = 30  ← ק"מ
// MAX_RADIUS = 100
// אם מועמד ללא עיר → לא מחושב מרחק
```

## בעיות שכיחות ופתרונות

### 1. עיר חסרה מהרשימה
```typescript
// הוסף ל-israel-locations-complete.ts:
{ name: "שם העיר", nameEn: "City Name", lat: XX.XXXX, lon: XX.XXXX, district: "מחוז" }
```

### 2. מרחק 0 לכולם
- lat/lon ריקים ב-location → lookup לא מצא את העיר
- בדוק exact match + fuzzy match

### 3. חיפוש "קרוב ל-X" לא מחזיר כלום
- בדוק שיש מועמדים עם `city` מלא (לא null)
- בדוק שה-radius parameter מגיע נכון לפונקציה

### 4. כפילויות ישובים
- "פתח תקווה" / "פ"ת" / "פתח-תקווה" - שלוש אפשרויות
- normalize שמות לפני השוואה

## ערים חשובות - מרכזי תעסוקה
```
תל אביב-יפו  (32.0853, 34.7818)
ירושלים      (31.7683, 35.2137)
חיפה         (32.7940, 34.9896)
ראשון לציון  (31.9730, 34.7925)
פתח תקווה   (32.0841, 34.8878)
אשדוד        (31.8040, 34.6550)
נתניה        (32.3215, 34.8532)
באר שבע      (31.2518, 34.7913)
```

## כללים חשובים
- ❌ לא לשנות את מבנה ה-data (lat/lon) - תשבור את כל ה-matching
- ❌ לא למחוק ערים מהרשימה - רק להוסיף
- ✅ שמות בעברית (primary) + אנגלית (secondary)
- ✅ תמיד ILIKE (case insensitive) בחיפוש עברי
- ✅ Haversine formula בלבד לחישוב מרחק
