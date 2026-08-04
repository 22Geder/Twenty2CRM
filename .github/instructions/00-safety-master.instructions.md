---
applyTo: "**"
description: "כללי הגנה מרכזיים לכל עבודה על TWENTY2CRM - חובה לעמוד בהם תמיד"
---

# 🛡️ TWENTY2CRM - הגנה ראשית

**קרא והפנם לפני כל פעולה.** כללים אלו חלים על **כל** קובץ, **כל** בקשה, **כל** זמן.

## 🔴 פעולות אסורות לחלוטין (ללא אישור מפורש מהמשתמש)

### DB - מסד נתונים
- ❌ `prisma migrate reset` / `db push --force-reset`
- ❌ `DROP TABLE`, `DELETE FROM` ללא `WHERE`
- ❌ הרצת scripts בשם `delete-*`, `reset-*`, `drop-*` מ-`crm-app/prisma/`
- ❌ שינוי `schema.prisma` שמוחק שדות/טבלאות קיימות
- ❌ גישה ל-production DB מסביבת פיתוח

### Git & Files
- ❌ `git push --force` / `git reset --hard` ללא אישור
- ❌ `git clean -fd` שמוחק קבצים לא-committed
- ❌ מחיקת קבצים בתיקיות: `prisma/`, `src/lib/`, `service-account-key.json`, `.env*`
- ❌ `rm -rf` על תיקיות גם אם נראות "לא רלוונטיות"

### Credentials & Secrets
- ❌ הדפסת תוכן של: `.env`, `.env.local`, `service-account-key.json`, `RAILWAY_VARIABLES.txt`
- ❌ commit של קבצי credentials (גם לא "בטעות")
- ❌ הדפסת API keys, tokens, passwords ללוגים גם בקוד
- ❌ שליחת credentials כ-query params (רק בגוף הבקשה / headers)

### Deployment
- ❌ deploy ל-Railway/Vercel ללא בדיקת build מקומי
- ❌ שינוי `railway.json` / `vercel.json` ללא אישור
- ❌ מחיקת environment variables בפרודקשן

## 🟡 פעולות שדורשות אישור מפורש

לפני ביצוע - **שאל את המשתמש**:
1. שינוי schema.prisma (גם הוספה של שדה)
2. מחיקה של endpoint קיים
3. שינוי לוגיקה של `gmail-poll`, `backup`, `restore`
4. שינוי `advanced-matching.ts` / `gemini-ai.ts`
5. הרצת `npm install` של package חדש
6. שינוי `package.json` dependencies
7. עריכת קבצי `.ps1` / `.bat` / GitHub workflows

## 🟢 כללי זהב לעריכת קוד

### לפני עריכה
1. **קרא את הקובץ המלא** - לא רק חלקים
2. **חפש usages** של פונקציות שאתה משנה - איפה הן נקראות?
3. **בדוק אם יש tests** - `*.test.ts` / `*.spec.ts`
4. **שמור על backward compatibility** של APIs קיימים

### בעת עריכה
1. **שנה מינימלית** - רק מה שנדרש
2. **אל תמחק קוד** שאתה לא מבין למה הוא שם
3. **שמור על הפורמט** (טאבים/רווחים/גרשיים) של הקובץ
4. **הערות בעברית** אם הקובץ מכיל כבר הערות בעברית

### אחרי עריכה
1. **הרץ `get_errors`** על כל קובץ שערכת
2. **וודא שה-TypeScript types** עדיין תקינים
3. **בדוק שאין imports שבורים**
4. **סכם מה השתנה** בסוף התשובה

## 🛡️ Defense-in-Depth

### Input Validation
- כל input מהמשתמש → sanitize (HTML, SQL, shell)
- Phone: `/^(05\d{8}|\+972-?5\d{8})$/`
- Email: `/^[\w.-]+@[\w.-]+\.\w+$/`
- File uploads: בדוק mimetype + גודל (< 10MB)

### Error Handling
- כל `async` function → try/catch
- לוג השגיאה (בלי PII/credentials)
- return error structure: `{ error: string, code?: string }`
- אל תחשוף stack traces ללקוח

### Rate Limiting
- APIs ציבוריים → rate limit per IP
- Gmail polling → לא יותר מפעם ב-10 דקות
- Bulk operations → batches של 10-50

## 📋 Checklist לפני הגשת שינוי

- [ ] לא שיניתי credentials / .env
- [ ] לא מחקתי קבצים בלי אישור
- [ ] הרצתי `get_errors` - ללא שגיאות חדשות
- [ ] שמרתי backward compatibility
- [ ] הערות/UI בעברית (אם רלוונטי)
- [ ] כל input validated
- [ ] שגיאות נתפסות ב-try/catch

## 🚨 במקרה של ספק

**אל תבצע - שאל.** עדיף לעצור ולשאול מאשר לשבור מערכת פרודקשן.

אם ביקשו ממך פעולה שמרגישה מסוכנת:
1. עצור
2. הסבר בעברית מה הסיכון
3. הצע חלופה בטוחה
4. חכה לאישור מפורש
