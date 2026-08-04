# SKILL: Positions & Employers — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- משרה לא מופיעה ברשימה
- מעסיק לא מקושר למשרה
- סינכרון לאתר Twenty2Jobs נכשל
- קוד משרה שגוי / כפול
- Active/Inactive לא מתחלף
- Export positions לא עובד
- Sync updates לא עוברים לאתר

## קבצים רלוונטיים
```
crm-app/src/app/api/positions/route.ts         ← CRUD משרות
crm-app/src/app/api/positions/[id]/route.ts    ← משרה בודדת
crm-app/src/app/api/employers/route.ts         ← CRUD מעסיקים
crm-app/src/app/api/employers/[id]/route.ts    ← מעסיק בודד
crm-app/src/app/api/sync-to-website/route.ts   ← סינכרון לאתר
crm-app/src/app/api/export-positions/route.ts  ← ייצוא Excel/CSV
crm-app/src/lib/twenty2jobs-sync.ts            ← לוגיקת סינכרון
crm-app/src/app/dashboard/positions/           ← ממשק משרות
crm-app/src/app/dashboard/employers/           ← ממשק מעסיקים
crm-app/src/components/position-actions.tsx
crm-app/src/components/matching-positions-list.tsx
crm-app/prisma/schema.prisma (Position, Employer models)
```

## משתני סביבה נדרשים
```
WEBSITE_SYNC_SECRET    ← secret לאימות סינכרון לאתר
WEBSITE_API_URL        ← URL של Twenty2Jobs API
```

## מודל Position - שדות חשובים
```typescript
id              // UUID
title           // שם המשרה
location        // מיקום
keywords        // JSON array (עד 30 מילות מפתח)
active          // true = פעיל ומוצג
employerId      // חובה - קישור למעסיק
recruiterId     // אופציונלי - מגייס אחראי
contactEmail    // מייל לשליחת מועמדים
contactEmails   // JSON array מיילים נוספים
openings        // מספר משרות פתוחות
priority        // עדיפות תצוגה (0 = רגיל)
aiProfile       // JSON מ-Gemini (ניתוח AI)
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: משרה לא מופיעה
```
GET /api/positions?active=true
← בדוק שהמשרה יש active: true
← בדוק שהמשרה מקושרת למעסיק תקין
```

### שלב 2: סינכרון לאתר
```
POST /api/sync-to-website
← בדוק WEBSITE_SYNC_SECRET ב-env
← בדוק WEBSITE_API_URL ב-env
← בדוק לוגים ב-twenty2jobs-sync.ts
```

### שלב 3: בדוק keywords
- `keywords` חייב להיות JSON array תקין
- מקסימום 30 מילות מפתח
- משפיע ישירות על AI matching

### שלב 4: export
```
GET /api/export-positions
← מחזיר CSV / Excel
← בדוק שאין filter שמגביל
```

## בעיות שכיחות ופתרונות

### 1. "No Employer found with email"
- מעסיק חייב קיים לפני יצירת משרה
- צור מעסיק תחילה: `POST /api/employers`

### 2. Sync לאתר מחזיר 401
- בדוק ש-WEBSITE_SYNC_SECRET זהה בשני הצדדים
- בדוק שה-WEBSITE_API_URL עדכני

### 3. משרה נעלמת לאחר עדכון
- בדוק שה-`active` לא שונה ל-false בטעות
- בדוק שה-PUT request לא מאפס שדות שלא נשלחו

### 4. keywords לא עובדות ב-matching
- keywords חייבות להיות array, לא string
- בדוק: `JSON.parse(position.keywords)` לא זורק שגיאה

## משרות מיוחדות בפרויקט
```
crm-app/prisma/seed-mizrahi-positions.js    ← Mizrahi Tefahot
crm-app/prisma/seed-union-positions.js      ← Union Cars
crm-app/prisma/seed-yes-positions.js        ← Yes TV
crm-app/prisma/seed-boutik-hapita.js        ← Boutik Hapita
← כל אלה SEED scripts - לא להריץ בפרודקשן ללא אישור
```

## כללים חשובים
- ❌ לא למחוק Position שיש לה Applications
- ❌ לא לשנות employerId של משרה קיימת
- ❌ לא להריץ seed scripts בפרודקשן בלי אישור
- ✅ תמיד לסנכרן לאתר אחרי שינוי `active` status
- ✅ לוג כל sync עם מספר המשרות שעברו
