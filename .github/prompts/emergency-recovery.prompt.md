---
mode: agent
description: "🚨 Emergency Recovery - משהו נשבר? מדריך שיקום שלב אחר שלב"
---

# 🚨 Emergency Recovery - TWENTY2CRM

משהו נשבר במערכת? אני אעזור לך לשחזר בצורה שיטתית ובטוחה.

## שלב 1: אבחון מהיר

שאל את המשתמש (אחד מהם):
1. **מה נשבר?** (DB / Deploy / Gmail scanner / Build / Login / אחר)
2. **מתי זה התחיל?** (אחרי commit / deploy / שינוי env)
3. **מה השגיאה?** (error message / log)

## שלב 2: בהתאם לבעיה

### 🗄️ DB נפגע / Data נמחק
```
1. עצור מיידית את האפליקציה (אל תכתוב data חדש!)
2. בדוק גיבויים:
   - restore-backup/ (local)
   - exported-data.json (crm-app/prisma/)
   - GitHub Actions artifacts
3. הצעות שחזור:
   a. `node crm-app/prisma/restore-all-data.js`
   b. API `/api/restore` (admin only)
   c. Prisma: `prisma migrate resolve`
4. אחרי שחזור - אמת שלמות:
   - `node crm-app/prisma/count-positions.js`
   - בדוק מספרי candidates/employers
```

### 🚀 Deploy נכשל
```
1. Railway:
   - UI → Deployments → Rollback לגרסה קודמת
   - או: `railway rollback`
2. Vercel:
   - UI → Deployments → Promote קודם
3. בדוק logs:
   - Railway CLI: `railway logs`
   - או UI של הפלטפורמה
4. גורמים נפוצים:
   - Missing env variable
   - Prisma migration נכשל
   - Build error (TS/import)
   - npm dependency conflict
```

### 📧 Gmail Scanner לא עובד
```
1. בדוק service-account-key.json קיים
2. בדוק לוגים ב-`/api/gmail-test`
3. וודא scopes נכונים (gmail.readonly, gmail.modify)
4. בדוק quota ב-Google Cloud Console
5. אם Token פג - הפעל מחדש OAuth flow
```

### 🔨 Build נכשל
```
1. בדוק שגיאה ספציפית
2. נפוץ:
   - `npm install` - dependencies עדכניות?
   - `prisma generate` - Prisma client?
   - TypeScript errors - `npx tsc --noEmit`
   - Missing env vars
3. נסה:
   - `rm -rf node_modules .next`
   - `npm install`
   - `npx prisma generate`
   - `npm run build`
```

### 🔐 Login שבור
```
1. בדוק NEXTAUTH_SECRET מוגדר
2. בדוק DATABASE_URL פעיל
3. בדוק middleware.ts תקין
4. בדוק /api/auth/* routes
5. emergency: `node crm-app/prisma/reset-users-password.js`
```

### 🔑 Credentials דלפו
```
1. IMMEDIATELY rotate:
   - Google: Cloud Console → recreate service account
   - Gemini: AI Studio → new API key
   - DB: change password
   - JWT: regenerate secret
2. עדכן בכל המקומות:
   - .env (local)
   - Railway variables
   - Vercel variables
3. בדוק logs לשימוש חשוד
4. הסר credentials מ-git history:
   - git filter-branch / BFG Repo-Cleaner
   - force push (אחרי אישור!)
```

## שלב 3: Post-mortem

אחרי שהמערכת שבה לעבוד:
1. תיעד מה קרה
2. זהה root cause
3. הוסף prevention:
   - instructions/prompts נוספים
   - בדיקות אוטומטיות
   - monitoring

## 🛡️ עקרונות שיקום

### ✅ תעשה
- עבוד **שיטתית** - שלב אחר שלב
- תעד **כל פעולה** שאתה מבצע
- **גיבוי לפני שחזור** - גם מה שלכאורה מקולקל
- **בדוק שלמות** אחרי כל צעד

### ❌ אל תעשה
- אל תמהר - ייתכן שתגרום נזק נוסף
- אל תשתמש ב-`--force` במצב חירום
- אל תמחק קבצים שנראים "ישנים" - ייתכן שהם גיבוי
- אל תשנה credentials בלי לעדכן כל המערכות

## 📞 עוגנים חשובים

קבצים/מקומות לאיתור מהיר:
- `BACKUP_SYSTEM_GUIDE.md` - איך עובדים הגיבויים
- `DEPLOYMENT_GUIDE.md` - תהליך deployment
- `RAILWAY_VARIABLES.txt` - רשימת env vars
- `restore-backup/` - גיבויים מקומיים
- `.github/workflows/daily-backup.yml` - auto backup

## 💬 תבנית תגובה

```markdown
# 🚨 Emergency Response Active

## 📊 מצב נוכחי
[תיאור הבעיה]

## 🔍 אבחון ראשוני
[מה שזיהיתי]

## 🩹 תוכנית שיקום (שלב אחר שלב)
1. [צעד + אישור לפני ביצוע]
2. [צעד]
3. [צעד]

## ⚠️ הערות בטיחות
- [מה לא לעשות עכשיו]

**ממתין לאישורך לצעד הראשון.**
```
