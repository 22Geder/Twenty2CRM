---
name: deployment-troubleshoot
description: "Debug and fix Railway deployment issues in TWENTY2CRM. Use when: Railway deploy fails, build errors in production, environment variables missing, Prisma migration fails on deploy, app crashes on startup, Next.js build error, nixpacks build fails. Triggers: 'deploy נכשל', 'Railway error', 'build failed', 'crash on startup', 'env var missing', 'production down', 'TypeScript build error', 'Out of Memory'."
argument-hint: "Paste the Railway build/deploy error logs"
---

# Deployment Troubleshoot Skill — TWENTY2CRM

## ⚠️ כלל ברזל
**לא לשנות `railway.json` / `nixpacks.toml` ללא אישור מהמשתמש**

## When to Use
- Build נכשל ב-Railway
- App קורסת מיד אחרי deploy
- Prisma migration נכשלת בפרודקשן
- env vars חסרים
- Next.js build error

## Files Map
```
crm-app/railway.json        ← הגדרות Railway (לא לגעת!)
crm-app/nixpacks.toml       ← build config (לא לגעת!)
crm-app/next.config.ts      ← Next.js config
crm-app/package.json        ← dependencies
crm-app/prisma/schema.prisma ← migrations רצות ב-deploy
```

## Environment Variables (Railway) — רשימה מלאה
```
DATABASE_URL                 ← PostgreSQL (Railway מספק)
NEXTAUTH_SECRET              ← random string
NEXTAUTH_URL                 ← https://xxx.railway.app
GEMINI_API_KEY
GMAIL_CLIENT_ID / SECRET / REDIRECT_URI
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_SERVICE_ACCOUNT_KEY   ← JSON כ-string אחד
INFORU_USERNAME / TOKEN
BREVO_API_KEY
WEBSITE_SYNC_SECRET / API_URL
```

## Diagnostic Procedure

### שלב 1: זהה את שלב הכשל
```
Railway Build Logs:
❌ "npm run build" failed    → TypeScript / Next.js error
❌ "prisma migrate deploy"   → DB migration error
❌ "Cannot find module"       → dependency חסר
❌ "ECONNREFUSED"             → DB לא נגיש
❌ exit code 137             → Out of Memory
```

### שלב 2: Build error — הרץ locally
```bash
cd crm-app
npm run build        # חייב להצליח לפני push
npx tsc --noEmit     # 0 TypeScript errors
```

### שלב 3: Migration error
```bash
# אם migration stuck בפרודקשן:
npx prisma migrate resolve --applied "migration_name"
# בדוק DATABASE_URL נכון
```

### שלב 4: Startup crash
```
Logs:
"Error: Cannot connect to database" → DATABASE_URL שגוי
"NEXTAUTH_SECRET missing"           → env var חסר
"Module not found"                  → npm install לא רץ
```

## בעיות נפוצות

### 1. TypeScript Build Error
```bash
cd crm-app && npx tsc --noEmit 2>&1
# תקן את כל השגיאות — אחת שוברת הכל!
```

### 2. "Table doesn't exist" בפרודקשן
```bash
npx prisma migrate deploy
```

### 3. Out of Memory (exit 137)
- הגדל RAM ב-Railway settings
- הוסף `connection_limit=5` ל-DATABASE_URL

### 4. env var חסר
- בדוק Railway Variables tab
- לא לgit! רק Railway Variables
- Redeploy נדרש אחרי הוספה

## Pre-Deploy Checklist
```bash
cd crm-app
npm run build         # ✅ חייב לעבור
npx tsc --noEmit      # ✅ 0 errors
npx prisma generate   # ✅ generate עדכני
```

## Railway Deploy Flow
```
git push → nixpacks build → npm install →
prisma generate → npm run build →
prisma migrate deploy → npm start → health check
```

## כללים חשובים
- ❌ לא לשנות nixpacks.toml ללא אישור
- ❌ לא להוסיף secrets לgit
- ✅ תמיד `npm run build` מקומי לפני push
- ✅ גבה DB לפני כל schema migration
