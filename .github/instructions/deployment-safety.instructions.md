---
applyTo: "**/railway.json,**/vercel.json,**/nixpacks.toml,**/package.json,**/next.config.ts,**/.github/workflows/**,**/*.ps1,**/*.bat"
description: "הגנה על תהליך ה-deployment - Railway, Vercel, GitHub Actions, build scripts"
---

# 🚀 הגנה על Deployment

המערכת deployed ל-**Railway** (ראשי) + יש גם **Vercel** config.

## 🔴 אסור בהחלט

### Production Deploys
- ❌ deploy ללא `npm run build` מוצלח מקומי
- ❌ deploy ללא `prisma generate` ב-build
- ❌ push ל-`main` ללא בדיקה (אם יש auto-deploy)
- ❌ שינוי environment variables בפרודקשן ללא תיאום
- ❌ מחיקת `railway.json` / `vercel.json` / `nixpacks.toml`

### Package.json
- ❌ שינוי `"scripts"` קיימים (build, start, migrate)
- ❌ הוספת `postinstall` scripts שעושים הרבה
- ❌ עדכון major versions של dependencies קיימים
- ❌ הוספת dependencies לא-מאומתות (בדוק npm/github לפני)

### GitHub Workflows
- ❌ חשיפת secrets ב-logs (`echo ${{ secrets.X }}`)
- ❌ `pull_request_target` על code לא מהימן
- ❌ שימוש ב-actions לא-מאומתות (תמיד `@vX.Y.Z` pinned)

## 🟢 תהליך Deploy בטוח

### לפני deploy
```bash
# 1. Build מקומי
cd crm-app
npm run build

# 2. בדיקת types
npx tsc --noEmit

# 3. בדיקת lint
npm run lint

# 4. אם יש migrations חדשות
npx prisma migrate deploy --dry-run  # preview
```

### Railway specific
- `railway.json` - מגדיר את ה-build/start commands
- `nixpacks.toml` - מגדיר את ה-runtime environment
- שינויים כאן יכולים לשבור את ה-deployment!

### GitHub Actions
יש workflow `.github/workflows/daily-backup.yml`:
- ❌ אל תמחק אותו
- ❌ אל תשנה את ה-schedule ללא אישור
- ✅ תוכל להוסיף workflows חדשים

## 🛡️ Build-time Safety

### Next.js config
```typescript
// next.config.ts - שמור על:
{
  output: 'standalone', // Railway compatibility
  experimental: { /* existing */ },
  // אל תוסיף ignoreBuildErrors בלי אישור!
}
```

### TypeScript
```json
// tsconfig.json - שמור strict mode
{
  "compilerOptions": {
    "strict": true,  // אל תכבה!
    "noEmit": true
  }
}
```

## 📋 Pre-deploy Checklist

- [ ] `npm run build` הצליח מקומי
- [ ] `npx tsc --noEmit` ללא שגיאות
- [ ] `.env.example` מעודכן עם משתנים חדשים
- [ ] migrations נבדקו
- [ ] אין `console.log` של credentials
- [ ] backup של DB עדכני (פחות מ-24h)
- [ ] commit message תיאורי
- [ ] PR review (אם יש עוד מפתחים)

## 🚨 Rollback Plan

אם deploy נכשל או שבר משהו:
1. Railway: `railway rollback` או UI
2. Vercel: UI → Deployments → Promote previous
3. DB migrations: `prisma migrate resolve --rolled-back <name>`
4. Emergency: `git revert <commit>` ו-push מחדש

## 💻 Windows Scripts (.ps1 / .bat)

המערכת מכילה scripts להפעלה:
- `הפעל-מערכת.bat` - הפעלה מקומית
- `auto-backup.ps1` - גיבויים
- `auto-sync-website.ps1` - סנכרון אתר
- `התקן-סנכרון-אוטומטי.bat` - התקנת scheduled task

**לפני עריכה:**
- קרא את הקובץ המלא
- בדוק אם רץ כ-scheduled task (Task Scheduler)
- אל תשנה paths בלי בדיקה
- שמור שמות קבצים בעברית אם קיימים
