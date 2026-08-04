# SKILL: Candidates Management — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- מועמד לא נשמר לאחר העלאה
- חיפוש מועמדים לא מוצא תוצאות
- סטטוס מועמד לא מתעדכן (kanban / status)
- Tags לא נשמרים / נעלמים
- פרטי מועמד לא מסונכרנים
- כרטיס מועמד לא נטען
- ציון/rating לא מתעדכן

## קבצים רלוונטיים
```
crm-app/src/app/api/candidates/route.ts      ← CRUD ראשי
crm-app/src/app/api/candidates/[id]/route.ts ← פרטי מועמד בודד
crm-app/src/app/api/tags/route.ts            ← ניהול tags
crm-app/src/app/api/notes/route.ts           ← הערות מועמד
crm-app/src/app/api/applications/route.ts    ← ניהול מועמדויות
crm-app/src/app/dashboard/candidates/        ← רשימת מועמדים
crm-app/src/app/dashboard/kanban/            ← לוח קנבן
crm-app/src/app/dashboard/hired/             ← מועמדים שהתקבלו
crm-app/src/components/kanban-board.tsx
crm-app/src/components/tags-manager.tsx
crm-app/src/components/candidate-notes.tsx
crm-app/src/components/candidate-score.tsx
crm-app/src/components/candidate-manual-summary.tsx
crm-app/src/lib/recruitment-tags.ts          ← לוגיקת tags
```

## מודל Candidate - שדות חשובים
```typescript
id            // UUID ייחודי
name          // שם מלא
email         // ייחודי (unique constraint!)
phone         // טלפון ראשי
alternatePhone // טלפון נוסף
city          // עיר מגורים
skills        // JSON / string של מיומנויות
resume        // טקסט מלא של קו"ח
aiProfile     // JSON מ-Gemini (נוצר בהעלאה)
rating        // 1-5 כוכבים
score         // 0-100 ניקוד כולל
status        // ACTIVE, HIRED, etc.
unsubscribed  // האם ביקש הסרה
hiredAt       // תאריך קבלה לעבודה
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: בדוק שמירת מועמד
```typescript
// בדוק unique constraints:
// email חייב להיות ייחודי!
// אם שתי פנייות עם אותו מייל → שגיאת unique violation
```

### שלב 2: בדוק חיפוש
```
GET /api/candidates?search=שם
← בדוק שה-query מחפש ב: name, email, phone, skills, city
```

### שלב 3: בדוק Tags
- Tags מחוברים Many-to-Many בין Candidate ↔ Tag
- לשנות tags: `PUT /api/candidates/{id}` עם `tagIds: [...]`
- לא למחוק Tag שיש לו מועמדים (FK constraint)

### שלב 4: בדוק Kanban status
- status ב-Application (לא ב-Candidate!)
- Kanban עובד על `Application.stage`
- מועמד יכול להיות בכמה משרות בו זמנית

## בעיות שכיחות ופתרונות

### 1. "Unique constraint failed on email"
- מועמד עם האימייל כבר קיים
- פתרון: מצא את המועמד הקיים ועדכן במקום ליצור

### 2. Tags נעלמים אחרי שמירה
- בדוק שה-tagIds נשלחים כ-array ב-body
- בדוק שהפעולה היא connect ולא set (Prisma relation)

### 3. Kanban לא מעדכן
- בדוק שה-applicationId (לא candidateId) נשלח
- Stage מעודכן ב-Application, לא ב-Candidate

### 4. Score 0 לכולם
- `score` מחושב ע"י AI בזמן העלאה
- מועמדים ישנים (לפני AI) יש להם score=null

## כללים חשובים
- ❌ לא למחוק מועמד ישירות - רק `archive`
- ❌ לא לשנות email של מועמד קיים (unique constraint)
- ❌ לא לנגוע ב-`unsubscribed: true` מועמדים בשליחות
- ✅ תמיד `include: { tags: true }` כשטוענים מועמד
- ✅ לוג את ה-activityLog כל פעולה משמעותית
