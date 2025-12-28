# 📧📱 הגדרת שליחה אוטומטית - SMS ומיילים

## ✅ מה הוספתי:

### 1. שליחת SMS אוטומטית דרך Twilio
- API: `/api/send-bulk-sms`
- שליחה לכל המועמדים בבת אחת
- הודעה מותאמת אישית לכל מועמד
- טיפול בשגיאות ודיווח על הצלחות/כשלונות

### 2. שליחת מיילים אוטומטית דרך SMTP
- API: `/api/send-bulk-email`
- עיצוב HTML מקצועי
- שליחה לכל המועמדים בבת אחת
- הודעה מותאמת אישית לכל מועמד

---

## 🔧 הגדרת Twilio (SMS)

### שלב 1: קבל פרטי חשבון Twilio
1. היכנס ל-[Twilio Console](https://console.twilio.com/)
2. העתק את:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (המספר שרכשת)

### שלב 2: עדכן את קובץ `.env`
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+972501234567
```

---

## 📧 הגדרת SMTP (מיילים)

### אפשרות 1: Gmail

#### שלב 1: הפעל App Password
1. היכנס ל-[Google Account Settings](https://myaccount.google.com/security)
2. הפעל **2-Step Verification**
3. לך ל-**App passwords**
4. צור **App password** חדש

#### שלב 2: עדכן את קובץ `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_digit_app_password
SMTP_FROM_NAME=צוות הגיוס - TWENTY2CRM
```

### אפשרות 2: Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_password
SMTP_FROM_NAME=צוות הגיוס - TWENTY2CRM
```

### אפשרות 3: SendGrid (מומלץ לייצור)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM_NAME=צוות הגיוס - TWENTY2CRM
```

---

## 🧪 בדיקת התקנה

### בדיקה 1: Twilio SMS
```bash
curl -X POST http://localhost:3000/api/send-bulk-sms \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [{"name": "טסט", "phone": "0501234567"}],
    "message": "הודעת בדיקה",
    "positionTitle": "משרה לדוגמה"
  }'
```

### בדיקה 2: Email
```bash
curl -X POST http://localhost:3000/api/send-bulk-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [{"name": "טסט", "email": "test@example.com"}],
    "subject": "בדיקה",
    "message": "הודעת בדיקה",
    "positionTitle": "משרה לדוגמה"
  }'
```

---

## 💡 איך להשתמש במערכת:

1. **פתח משרה** בדאשבורד
2. **ראה מועמדים מתאימים** בצד ימין (לפי תגיות)
3. **לחץ על:**
   - 🟢 **"שלח SMS לכולם"** - שליחת SMS אוטומטית
   - 🔵 **"שלח מייל לכולם"** - שליחת מיילים אוטומטית
4. **אשר את השליחה**
5. **קבל דיווח** על הודעות שנשלחו בהצלחה

---

## ⚠️ טיפים חשובים:

### Twilio:
- ✅ וודא שיש לך מספר Twilio מאושר
- ✅ בדוק שיש לך קרדיט בחשבון
- ✅ מספרי טלפון צריכים להיות בפורמט בינלאומי: `+972501234567`
- 💰 עלות: ~$0.08 להודעה (תלוי במדינה)

### SMTP / Email:
- ✅ אם משתמש ב-Gmail, **חובה** להשתמש ב-App Password
- ✅ בדוק שה-SMTP port פתוח (587 או 465)
- ✅ אם יש firewall, אשר תנועה ל-SMTP
- 🔒 אל תשתף את ה-App Password עם אף אחד

---

## 🚨 פתרון בעיות:

### SMS לא נשלחים?
```
❌ שגיאה: "Twilio credentials not configured"
✅ פתרון: בדוק שמילאת TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
```

```
❌ שגיאה: "Invalid phone number"
✅ פתרון: וודא שמספרי הטלפון בפורמט בינלאומי: +972501234567
```

### מיילים לא נשלחים?
```
❌ שגיאה: "SMTP credentials not configured"
✅ פתרון: בדוק שמילאת SMTP_USER, SMTP_PASSWORD
```

```
❌ שגיאה: "Invalid login"
✅ פתרון: אם משתמש ב-Gmail, צור App Password חדש
```

---

## 📊 מבנה ההודעות:

### SMS:
```
שלום {name},

מצאנו משרה שעשויה להתאים לך: "{position}".

נשמח לשמוע ממך!

צוות הגיוס
```

### Email:
- **נושא:** הזדמנות תעסוקה: {position}
- **תוכן:** HTML מעוצב עם לוגו וכפתורים
- **פורמט:** RTL (מימין לשמאל) בעברית

---

## 🎯 מוכן לשימוש!

הכל מוגדר ומוכן. פשוט:
1. מלא את הפרטים ב-`.env`
2. הפעל מחדש את השרת: `npm run dev`
3. פתח משרה ושלח הודעות!

**יש שאלות?** אני כאן לעזור! 🚀
