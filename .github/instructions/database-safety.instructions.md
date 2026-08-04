---
applyTo: "crm-app/prisma/**,**/*.prisma,**/prisma/**"
description: "הגנה על מסד הנתונים - Prisma, schema, migrations, seed scripts"
---

# 🗄️ הגנה על DB - Prisma

## 🔴 אסור בהחלט

### Schema Changes
- ❌ מחיקת `model` קיים (Candidate, Application, Position, Employer וכו')
- ❌ מחיקת field שיש לו data בפרודקשן
- ❌ שינוי `@unique` / `@id` על שדה שכבר יש בו data
- ❌ שינוי type של field (String → Int) ללא migration plan
- ❌ הוספת `required` field חדש ללא default value

### Migrations
- ❌ `prisma migrate reset` - מוחק הכל!
- ❌ `prisma db push --accept-data-loss`
- ❌ מחיקת קבצי migration קיימים ב-`prisma/migrations/`
- ❌ עריכה ידנית של migration שכבר רץ בפרודקשן

### Seed Scripts
המערכת מכילה **עשרות** scripts ב-`crm-app/prisma/`. לפני הרצה:
- ❌ `delete-all-*.js` - בדוק אם זה מה שהמשתמש רוצה
- ❌ `reset-*.js` - דורש אישור כפול
- ❌ `seed-*.js` - וודא שלא דורס data קיים
- ❌ `fix-*.js` / `update-*.js` - קרא את הקוד לפני

## 🟢 עבודה נכונה

### הוספת שדה חדש
```prisma
model Candidate {
  // שדה חדש תמיד עם ? (optional) או @default
  newField String?
  anotherField Int @default(0)
}
```

### לפני migrate
1. בדוק איזה DB פעיל (`DATABASE_URL` ב-`.env`)
2. וודא שיש גיבוי עדכני (ראה `backup-crm.ps1`)
3. הרץ `prisma migrate dev --name describing_change` רק בפיתוח
4. בפרודקשן - `prisma migrate deploy` בלבד

### Queries בטוחות
```typescript
// ✅ טוב
const candidate = await prisma.candidate.findUnique({ where: { email } })
if (candidate) { /* update only specific fields */ }

// ❌ רע
await prisma.candidate.deleteMany({}) // מוחק הכל!
await prisma.$executeRawUnsafe(userInput) // SQL injection
```

### Transactions לפעולות מורכבות
```typescript
await prisma.$transaction(async (tx) => {
  const candidate = await tx.candidate.create({ data })
  await tx.application.create({ data: { candidateId: candidate.id, ... } })
})
```

## 🛡️ Duplicate Prevention

לפני יצירת רשומה - תמיד בדוק:
- `Candidate` → unique על `email`
- `Position` → בדוק שילוב `title + employerId`
- `Application` → בדוק שילוב `candidateId + positionId`

## 📋 Checklist לפני שינוי DB

- [ ] יש גיבוי עדכני (פחות מ-24 שעות)
- [ ] השינוי backward-compatible
- [ ] אין data loss אפשרי
- [ ] השינוי נבדק בפיתוח לפני פרודקשן
- [ ] יש rollback plan

## 🚨 במקרה חירום

אם DB נפגע:
1. **אל תכתוב data חדש** - לעצור את האפליקציה
2. בדוק `restore-backup/` לגיבויים
3. השתמש ב-`restore-all-data.js` / API `/api/restore`
4. הודע למשתמש לפני restore (dataloss אפשרי!)
