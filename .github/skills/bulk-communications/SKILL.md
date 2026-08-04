# SKILL: Bulk Communications — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- SMS לא נשלח / מגיע שגיאה מ-Inforu
- מייל לא מגיע (SMTP / Brevo)
- שליחה המונית נעצרת באמצע
- WhatsApp לא מתועד ב-לוג
- מועמד לא מקבל הזמנה לראיון
- "Unsubscribe" לא עובד
- `/api/send-bulk-sms` / `/api/send-bulk-email` מחזירים שגיאה

## קבצים רלוונטיים
```
crm-app/src/app/api/send-bulk-sms/route.ts          ← SMS המוני
crm-app/src/app/api/send-bulk-email/route.ts         ← מייל המוני
crm-app/src/app/api/send-candidate-to-employer/route.ts ← שליחה למעסיק
crm-app/src/app/api/whatsapp-log/route.ts            ← לוג וואטסאפ
crm-app/src/app/api/sms-webhook/route.ts             ← webhook מ-Inforu
crm-app/src/app/api/email-webhook/route.ts           ← webhook ממייל
crm-app/src/app/api/unsubscribe/route.ts             ← הסרה מרשימות
crm-app/src/app/api/test-smtp/route.ts               ← בדיקת SMTP
crm-app/src/app/dashboard/bulk-broadcast/            ← ממשק שליחה המונית
crm-app/src/app/dashboard/messages/                  ← ממשק הודעות
crm-app/src/app/dashboard/templates/                 ← תבניות הודעות
```

## משתני סביבה נדרשים
```
# SMS (Inforu)
INFORU_USERNAME       ← שם משתמש Inforu
INFORU_TOKEN          ← טוקן API

# Email (Brevo / SMTP)
BREVO_API_KEY         ← או SMTP_HOST/USER/PASS

# מיילים
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
FROM_EMAIL
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: בדוק SMTP
```
GET /api/test-smtp
← מחזיר { success: true } אם SMTP עובד
← אם נכשל → בדוק env vars
```

### שלב 2: בדוק SMS
- בדוק ב-Inforu panel שהחשבון פעיל
- בדוק שה-balance לא אפס
- SMS test: שלח ל-מספר בודד לפני bulk

### שלב 3: בדוק Unsubscribe
- מועמדים עם `unsubscribed: true` → לא לשלוח
- לוגיקת bulk תמיד בודקת `WHERE unsubscribed = false`

### שלב 4: בדוק WhatsApp logs
```
GET /api/whatsapp-log
← מציג היסטוריית וואטסאפ לפי מועמד
```

## בעיות שכיחות ופתרונות

### 1. SMS נכשל ל-כולם
- בדוק את INFORU credentials
- בדוק שמספרי הטלפון פורמט נכון: `05X-XXXXXXX` או `05XXXXXXXXX`

### 2. מייל נכנס ל-Spam
- בדוק SPF/DKIM/DMARC לדומיין
- הפחת את תדירות השליחה
- אל תשלח לכולם בבת אחת - batch של 50

### 3. Bulk עוצר אחרי 10
- Rate limit מוגדר ב-route.ts - batch של 10-50
- הוסף `await sleep(500)` בין batches

### 4. מועמד מקבל כפול
- בדוק שאין כפילויות ב-array שנשלח
- בדוק שה-candidateId unique בבקשה

## כללים חשובים
- ❌ לא לשלוח ל-`unsubscribed: true` מועמדים
- ❌ לא לשלוח batch > 100 בפעם אחת
- ❌ לא לאחסן credentials ב-קוד / git
- ✅ לוג כל שליחה עם timestamp ו-status
- ✅ תמיד לכלול קישור unsubscribe במיילים
- ✅ rate limit: SMS לא יותר מ-100 ל-דקה
