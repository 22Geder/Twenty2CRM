---
mode: agent
description: "בודק ומתקן את מערכת סריקת המיילים - מריץ diagnostics ומדווח"
---

# Email Scanner Health Check

בצע בדיקת תקינות מלאה של מערכת סריקת המיילים של TWENTY2CRM והפק דוח.

## שלבי הבדיקה

### 1. בדיקת תצורה
- בדוק שקיים `crm-app/service-account-key.json` (בלי לחשוף תוכן)
- בדוק ש-`.env` מכיל את המשתנים הנדרשים ל-Gmail API
- בדוק שה-scopes נכונים: `gmail.readonly`, `gmail.modify`

### 2. בדיקת קוד
- וודא שכל `gmail-*` routes מטפלים בשגיאות (try/catch)
- וודא שאין credentials שזולגים ללוגים
- בדוק duplicate detection ב-candidate creation
- בדוק שה-regex לטלפון/אימייל תקינים

### 3. בדיקת Keywords
- קרא את `crm-app/src/lib/resume-keywords.ts`
- בדוק false positives פוטנציאליים (מילים גנריות מדי)
- הצע keywords חסרים לפי טרנדים של גיוס (AI, Remote, Hybrid וכו')

### 4. בדיקת DB
- בדוק ב-`prisma/schema.prisma` שקיים unique constraint על `Candidate.email`
- בדוק אם יש טבלת `ScanLog` / `EmailLog` לתיעוד סריקות

### 5. בדיקת Integration
- Smart Matching מופעל אחרי יצירת candidate?
- קיים cron/scheduler לסריקה אוטומטית כל 10 דקות?

## פורמט הדוח

החזר את הממצאים במבנה:

```markdown
## 🟢 תקין
- [מה עובד טוב]

## 🟡 אזהרות
- [בעיות שכדאי לטפל בהן]

## 🔴 בעיות קריטיות
- [דברים שחייבים תיקון מיידי]

## 💡 המלצות לשיפור
- [keywords חדשים, אופטימיזציות, פיצ'רים]
```

## אחרי הדוח
שאל את המשתמש אילו בעיות הוא רוצה לתקן, ותקן אותן לפי ההנחיות ב-`.github/instructions/email-scanner.instructions.md`.
