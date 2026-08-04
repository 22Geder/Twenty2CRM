---
mode: agent
description: "✈️ Pre-flight Check - בדיקה מלאה לפני deploy/commit/merge"
---

# ✈️ Pre-Flight Safety Check

בצע בדיקת בטיחות מלאה **לפני deploy / commit / merge** של TWENTY2CRM.

## שלבי הבדיקה

### 1. 🔐 Secrets Scan
חפש בכל הקבצים ששונו:
- API key prefixes: `sk-`, `AIza`, `ghp_`, `xoxb-`
- `-----BEGIN PRIVATE KEY-----`
- `password=`, `secret=`, `token=` עם ערכים ממשיים
- Hardcoded emails/phones אישיים

### 2. 🗄️ Database Safety
- האם `schema.prisma` השתנה? בדוק migrations
- האם יש `deleteMany` / `updateMany` ללא `where`?
- האם יש unique constraints חדשים על שדות עם data?

### 3. 🌐 API Safety
עבור כל `route.ts` שהשתנה:
- יש auth check?
- יש input validation?
- יש try/catch?
- Error messages לא חושפות פרטים?

### 4. 🎨 UI/UX
- טקסטים בעברית?
- RTL תקין?
- אין `console.log` שנשכחו?
- אין TODO/FIXME קריטיים?

### 5. 📦 Build
הרץ בדיקות:
```bash
cd crm-app
npm run build         # חייב לעבור
npx tsc --noEmit      # חייב לעבור
npm run lint          # אזהרות לבדוק
```

### 6. 🧪 Tests (אם קיימים)
```bash
npm test
```

### 7. 💾 Backup Status
בדוק מתי הגיבוי האחרון:
- `restore-backup/` - האם יש גיבוי מה-24 שעות האחרונות?
- GitHub Actions: `.github/workflows/daily-backup.yml` רץ?

### 8. 🔄 Integration Points
האם השינוי משפיע על:
- [ ] Gmail scanner (`gmail-*` endpoints)
- [ ] Smart matching (`advanced-matching.ts`, `gemini-ai.ts`)
- [ ] WhatsApp integration
- [ ] Backup system
- [ ] Cron jobs
- [ ] Twenty2Jobs sync

## 📊 פורמט הדוח

```markdown
# ✈️ Pre-Flight Report

## סטטוס כללי
🟢 Ready to ship / 🟡 Proceed with caution / 🔴 DO NOT SHIP

---

## ✅ עבר
- [X] Secrets scan - נקי
- [X] Build - מוצלח
- [X] Types - תקינים

## ⚠️ לבדיקה
- [ ] [נושא]

## 🔴 חובה לתקן
- [ ] [בעיה קריטית]

---

## 📋 פעולות מומלצות לפני deploy
1. [פעולה]
2. [פעולה]

## 🔄 Rollback Plan
אם משהו נשבר אחרי deploy:
1. [צעד 1]
2. [צעד 2]
```

## ⚠️ אם מצאת בעיה קריטית

**אל תאשר deploy.** הודע למשתמש בבירור:
> "🔴 מצאתי בעיה קריטית שחייבת תיקון לפני deploy. פרטים למעלה."

## ✅ אם הכל תקין

אשר deploy והציע:
> "🟢 המערכת מוכנה. רוצה שאעזור לך עם commit message / deploy command?"
