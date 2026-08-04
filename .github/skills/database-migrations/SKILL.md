---
name: database-migrations
description: "Safely manage Prisma schema changes and migrations in TWENTY2CRM. Use when: schema.prisma needs changes, adding new model fields, creating new tables, migration fails, prisma generate errors, type mismatches after schema change, seed scripts need updating. Triggers: 'שינוי schema', 'migration failed', 'prisma error', 'הוספת שדה', 'מודל חדש', 'type error after schema'."
argument-hint: "Describe the schema change you need to make"
---

# Database Migrations Skill — TWENTY2CRM

## ⚠️ כללי ברזל לפני הכל

1. **שמור backup לפני כל שינוי schema**: `POST /api/backup` → שמור ב-Drive
2. **אל תמחק שדות / טבלאות קיימים** - רק הוסף
3. **אל תרוץ `prisma migrate reset`** - מוחק את כל הנתונים!
4. **כל שינוי schema דורש אישור מפורש מהמשתמש**

## When to Use
- הוספת שדה חדש למודל קיים
- יצירת מודל חדש עם relations
- שגיאת type אחרי שינוי schema
- `prisma generate` נכשל
- Migration conflicts

## Files Map
```
crm-app/prisma/schema.prisma          ← schema ראשי
crm-app/prisma/migrations/            ← היסטוריית migrations (לא לגעת!)
crm-app/src/lib/prisma.ts            ← Prisma client singleton
```

## Safe Migration Procedure

### שלב 1: גיבוי (חובה!)
```
POST /api/backup → שמור ב-Drive לפני כל שינוי
```

### שלב 2: קרא את כל schema.prisma
```
view crm-app/prisma/schema.prisma  (קובץ מלא!)
```

### שלב 3: הוסף שינוי minimal
```prisma
model Candidate {
  // ✅ הוסף שדה עם DEFAULT / nullable
  newField    String?   @default("")
  // ❌ לא למחוק שדות קיימים!
}
```

### שלב 4: generate + migrate
```bash
cd crm-app
npx prisma generate
npx prisma migrate dev --name "add_new_field"
# Railway מריץ migrate deploy אוטומטי ב-deploy
```

### שלב 5: בדוק TypeScript
```bash
npx tsc --noEmit
```

## בעיות נפוצות

### 1. "The column does not exist" בפרודקשן
- Migration לא רצה ב-Railway
- פתרון: בדוק logs, הרץ `npx prisma migrate deploy`

### 2. "P2002 Unique constraint"
- ניסיון להוסיף @unique לשדה עם כפילויות
- פתרון: נקה כפילויות לפני הוספת constraint

### 3. Migration conflict
- `npx prisma migrate resolve --applied <migration-name>`

### 4. TypeScript errors אחרי שינוי
- הרץ `npx prisma generate` שוב
- `get_errors` על כל קובץ שמשתמש במודל ששונה

## מודלים ב-schema (2026)
```
Candidate, Position, Employer, Application
Interview, Note, Tag, ActivityLog
GmailCredential, BackupRecord, User, Attendance
```

## כללים חשובים
- ❌ לא לשנות @id / @unique על שדות קיימים
- ❌ לא להפוך optional ל-required ללא default
- ❌ לא להריץ migrations ידנית בפרודקשן
- ✅ שדות חדשים = תמיד nullable (String?) בהתחלה
- ✅ לאחר generate: get_errors על כל קובץ מושפע
