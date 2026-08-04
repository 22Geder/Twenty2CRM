# SKILL: Gmail Integration — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- Gmail לא מחובר / OAuth נפל
- Polling נעצר / מיילים לא נקלטים
- כפילויות של מועמדים מאימייל
- "Gmail not connected" למרות שהחיבור הוגדר
- `/api/gmail-poll` מחזיר שגיאה
- Scanner לא מזהה מיילים עם קורות חיים

## קבצים רלוונטיים
```
crm-app/src/app/api/gmail-poll/route.ts        ← polling ראשי
crm-app/src/app/api/gmail-callback/route.ts    ← OAuth callback
crm-app/src/app/api/gmail-webhook/route.ts     ← webhook מגוגל
crm-app/src/app/api/gmail-scan-history/route.ts
crm-app/src/app/api/gmail-test/route.ts        ← בדיקת חיבור
crm-app/src/app/api/email-auto/route.ts        ← auto scanner
crm-app/src/app/api/email-webhook/route.ts
crm-app/src/lib/resume-keywords.ts             ← מזהה מיילים עם CVs
crm-app/src/app/dashboard/email-auto-scanner/  ← ממשק scanner
crm-app/src/app/dashboard/gmail-auto/          ← ממשק Gmail
```

## משתני סביבה נדרשים
```
GMAIL_CLIENT_ID       ← Google OAuth Client ID
GMAIL_CLIENT_SECRET   ← Google OAuth Client Secret
GMAIL_REDIRECT_URI    ← https://...app.railway.app/api/gmail-callback
NEXTAUTH_URL          ← URL הבסיס של האפליקציה
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: בדוק חיבור Gmail
```
GET /api/gmail-test
← צריך להחזיר { connected: true, email: "..." }
← אם מחזיר { connected: false } → צריך reconnect
```

### שלב 2: בדיקת OAuth tokens
- Tokens מתפוגים כל שעה → access_token מתחדש אוטומטי ע"י refresh_token
- אם refresh_token אבד → המשתמש צריך לאשר שוב דרך `/dashboard/gmail-auto`

### שלב 3: בדוק polling אחרון
```
GET /api/gmail-scan-history
← בדוק מתי היה הסריקה האחרונה
← אם > 15 דקות → polling נעצר
```

### שלב 4: בדוק resume-keywords
```typescript
// resume-keywords.ts - רשימת מילות מפתח לזיהוי CV
// אם מיילים לא מזוהים → הוסף מילות מפתח רלוונטיות
```

## בעיות שכיחות ופתרונות

### 1. "invalid_grant" error
- refresh_token פג תוקף / בוטל
- פתרון: המשתמש חוזר ל-`/dashboard/gmail-auto` ומאשר מחדש

### 2. כפילויות מועמדים
- בדוק לוגיקת dedup ב-`email-auto/route.ts`
- כפילות מבוססת על: email + phone + name
- אל תשנה את סדר הבדיקה!

### 3. Scanner מפספס קורות חיים
- הוסף מילת מפתח חדשה ל-`resume-keywords.ts`
- מילות מפתח נבדקות ב: subject + body + attachments

### 4. Gmail Webhook לא מגיע
- בדוק שה-GMAIL_REDIRECT_URI ב-Google Console תואם בדיוק לסביבה

## כללים חשובים
- ❌ לא לשנות לוגיקת dedup מבלי להבין את כל הבדיקות
- ❌ polling לא יותר מפעם ב-10 דקות (rate limit גוגל)
- ❌ לא לאחסן Gmail tokens ב-localStorage - רק ב-DB / session
- ✅ תמיד לוג את מספר המיילים שנסרקו
- ✅ כל סריקה כותבת ל-`gmail_scan_history`
