---
applyTo: "crm-app/src/app/api/gmail-*/**,crm-app/src/app/dashboard/email-auto-scanner/**,crm-app/src/lib/resume-keywords.ts"
description: "הנחיות עבודה על מערכת סריקת המיילים האוטומטית של TWENTY2CRM"
---

# הנחיות: מערכת סריקת מיילים - TWENTY2CRM

כל עבודה על קבצים הקשורים לסריקת מיילים (Gmail API, resume parsing, auto-scanner) חייבת לעמוד בהנחיות הבאות.

## ארכיטקטורה קיימת
- **Gmail API** דרך Service Account (`service-account-key.json`) - לא OAuth ידני
- **Endpoints קיימים**: `gmail-poll` (חדשים), `gmail-scan-history` (היסטוריה), `gmail-webhook` (push), `gmail-callback`, `gmail-test`
- **מילון keywords**: `crm-app/src/lib/resume-keywords.ts` - 100+ מילים עברית+אנגלית
- **DB**: Prisma - מודל `Candidate` (unique על `email`)
- **AI Matching**: `crm-app/src/lib/gemini-ai.ts` + `advanced-matching.ts` - התאמה אוטומטית למשרות 75%+
- **מיקומים**: `israel-locations*.ts` - לזיהוי ערים בישראל

## כללי פיתוח מחייבים

### עברית ו-RTL
- כל טקסט למשתמש בעברית (הודעות, לוגים ב-UI, toast messages)
- regex לטלפון ישראלי: `/05\d-?\d{7}|\+972-?5\d-?\d{7}/`
- regex לאימייל: `/[\w.-]+@[\w.-]+\.\w+/`
- שמירת שם מועמד בפורמט `firstName lastName` (פיצול לפי רווח)

### אבטחה
- **לעולם לא** להדפיס את תוכן `service-account-key.json` ללוגים
- **לעולם לא** לחשוף refresh tokens או credentials ב-API responses
- סניטיזציה של HTML מגוף המייל לפני שמירה ב-DB (הסרת scripts, iframes)
- הגבלת גודל attachment ל-10MB לפני ניסיון חילוץ
- Rate limiting: לא יותר מסריקה אחת כל 10 דקות (התאמה ל-polling הקיים)

### Duplicate Detection
- לפני יצירת `Candidate` חדש - תמיד `findUnique({ where: { email } })`
- אם קיים - לעדכן את השדות החסרים בלבד (לא להחליף נתונים קיימים)
- יצירת `Application` חדש גם אם המועמד קיים - אם יש משרה חדשה מתאימה

### טיפול בשגיאות
- כל קריאה ל-Gmail API חייבת try/catch עם לוג מפורט
- אם נכשל עיבוד של מייל אחד - להמשיך לשאר (לא לקרוס את הסריקה כולה)
- להחזיר `{ success, emailsChecked, candidatesCreated, errors[] }` בכל response

### ביצועים
- עיבוד מיילים ב-batches של 10 (לא לטעון 500 במקביל)
- לסמן מיילים שעובדו עם Gmail label `Processed-CRM` (למנוע עיבוד כפול)
- שימוש ב-`format: 'metadata'` לסינון ראשוני, `'full'` רק למיילים שעברו את הפילטר

### Logging
- לוג כל סריקה ל-DB (טבלה `ScanLog` אם קיימת, אחרת ליצור)
- פורמט: `timestamp, emailsChecked, candidatesCreated, duration, status`
- אין להדפיס PII (טלפונים מלאים, תוכן קורות חיים) ללוגים

## לפני הוספת keyword חדש
1. להוסיף ל-`resume-keywords.ts` בקטגוריה הנכונה
2. לבדוק false positives - שהמילה לא תתפוס מיילי ספאם/שיווק
3. להוסיף בדיקה גם בעברית וגם באנגלית אם רלוונטי

## אינטגרציה עם מערכות אחרות
- WhatsApp: אחרי יצירת מועמד → `lib/whatsapp` לשליחת אישור (אם קיים מספר)
- Smart Matching: אחרי יצירת candidate → קריאה ל-`advanced-matching.ts`
- Backup: מועמדים חדשים נכנסים לגיבוי היומי (`.github/workflows/daily-backup.yml`)

## מה לא לעשות
- ❌ לא להחליף את Service Account ב-OAuth ידני (שבור את הסריקה האוטומטית)
- ❌ לא לשמור תוכן מייל גולמי ב-DB (רק את המידע המחולץ)
- ❌ לא להריץ את הסורק על מיילים ישנים מ-90 יום (עלול ליצור מועמדים לא רלוונטיים)
- ❌ לא להתעלם מ-`resumeKeywords` - זה הפילטר היחיד בפני ספאם
