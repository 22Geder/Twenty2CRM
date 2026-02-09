# 📧 הגדרת קבלת קורות חיים אוטומטית ממייל ווואטסאפ

## ✅ מה כבר עובד:

1. **✅ Gemini AI מחובר** - הבוט מוכן לעבוד!
2. **✅ זיהוי קורות חיים** - המערכת יודעת לזהות 30+ מילות מפתח בעברית ואנגלית
3. **✅ התאמה חכמה** - לחיצה על כפתור הבוט 🤖 ליד מועמד עושה התאמה אוטומטית
4. **✅ יצירת תגיות אוטומטית** - הבוט מזהה כישורים ויוצר תגיות

---

## 📧 איך לחבר Gmail (קבלת קורות חיים מאימייל)

### שיטה 1: עם Zapier/Make.com (הכי פשוט! מומלץ)

#### A. באמצעות Zapier:

1. **צור חשבון ב-[Zapier](https://zapier.com)** (יש גרסה חינמית)

2. **צור Zap חדש**:
   - **Trigger**: Gmail → "New Email"
   - **Email**: 22geder@gmail.com
   - **Filter**: Subject or Body contains ("קורות חיים" OR "קוח" OR "CV" OR "Resume")

3. **Action**: Webhooks by Zapier → POST
   - **URL**: `http://10.0.0.2:3000/api/email-webhook`
   - **Payload Type**: JSON
   - **Data**:
     ```json
     {
       "from": "{{Email From}}",
       "subject": "{{Email Subject}}",
       "body": "{{Email Body Plain}}",
       "attachments": "{{Email Attachments}}"
     }
     ```

4. **שמור והפעל את ה-Zap**

#### B. באמצעות Make.com:

1. **צור חשבון ב-[Make.com](https://make.com)** (תומך בעברית טוב יותר!)

2. **צור Scenario חדש**:
   - **Module 1**: Gmail → Watch Emails
   - **Email**: 22geder@gmail.com
   - **Search Criteria**: קורות חיים OR קוח OR CV

3. **Module 2**: HTTP → Make a Request
   - **URL**: `http://10.0.0.2:3000/api/email-webhook`
   - **Method**: POST
   - **Body**: JSON
   - **Map הנתונים**:
     ```json
     {
       "from": "{{Email.from}}",
       "subject": "{{Email.subject}}",
       "body": "{{Email.text}}",
       "attachments": "{{Email.attachments}}"
     }
     ```

4. **הפעל את ה-Scenario**

---

### שיטה 2: עם Gmail API (מתקדם)

אם אתה רוצה שהמערכת תתחבר ישירות ל-Gmail:

1. **צור פרויקט ב-[Google Cloud Console](https://console.cloud.google.com)**

2. **הפעל את Gmail API**:
   - לך ל-"APIs & Services" → "Library"
   - חפש "Gmail API" והפעל

3. **צור Credentials**:
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Authorized redirect URIs: `http://10.0.0.2:3000/api/gmail-callback`

4. **הוסף ל-.env**:
   ```env
   GMAIL_CLIENT_ID=your_client_id_here
   GMAIL_CLIENT_SECRET=your_client_secret_here
   GMAIL_REFRESH_TOKEN=your_refresh_token_here
   ```

5. **הפעל את הסורק האוטומטי**:
   - המערכת תסרוק מיילים כל 5 דקות
   - Endpoint: `/api/gmail-poll`

---

## 📱 איך לחבר WhatsApp (קבלת קורות חיים מוואטסאפ)

### שיטה 1: עם Zapier (הכי פשוט!)

1. **צור Zap חדש**:
   - **Trigger**: WhatsApp Business by Zapier → "New Message"
   - **חבר את חשבון WhatsApp Business שלך**

2. **Action**: Webhooks → POST
   - **URL**: `http://10.0.0.2:3000/api/email-webhook`
   - **Data**:
     ```json
     {
       "from": "{{From}}",
       "subject": "קורות חיים מוואטסאפ",
       "body": "{{Body}}",
       "attachments": "{{Media URL}}"
     }
     ```

---

### שיטה 2: עם WhatsApp Business API (מתקדם)

אם יש לך WhatsApp Business API:

1. **הגדר Webhook**:
   - URL: `http://10.0.0.2:3000/api/whatsapp-webhook`
   - Verify Token: `TWENTY2JOBS_WEBHOOK_SECRET`

2. **קוד הסבר לשרת**:
   ```javascript
   // הקוד כבר מוכן ב-/api/email-webhook
   // המערכת תזהה אוטומטית קורות חיים
   ```

---

## 🤖 איך זה עובד אחרי ההגדרה:

### תהליך אוטומטי מלא:

1. **📧 מייל/וואטסאפ מגיע** → 22geder@gmail.com
2. **🔍 Zapier/Make בודק** → יש מילות מפתח של קורות חיים?
3. **➡️ שולח ל-CRM** → POST ל-`/api/email-webhook`
4. **🤖 Gemini מנתח** → מחלץ כישורים, ניסיון, תגיות
5. **✨ יוצר מועמד** → מוסיף למערכת עם תגיות
6. **🎯 התאמה אוטומטית** → מחפש משרות מתאימות
7. **📊 מועמדויות נוצרות** → למשרות עם 75%+ התאמה
8. **🔔 התראה** → "נוספו X קורות חיים מאז ההתחברות האחרונה"

---

## 🎯 כפתור הבוט 🤖

**איפה לראות אותו?**
- בדף מועמדים - ליד כל מועמד יש כפתור בוט כחול
- לוחצים עליו → הבוט עושה התאמה חכמה לכל המשרות
- מקבל התראה עם התוצאות
- נוצרות מועמדויות אוטומטיות למשרות הכי טובות

**מה הבוט עושה?**
1. ✅ מנתח קורות חיים עם Gemini AI
2. ✅ מזהה כישורים וניסיון
3. ✅ יוצר תגיות אוטומטיות
4. ✅ מחפש בכל המשרות (ללא הגבלה!)
5. ✅ מחשב ניקוד התאמה 0-100
6. ✅ יוצר מועמדויות למשרות עם 75%+ התאמה
7. ✅ זוכר ולומד מכל גיוס (שיפור מתמשך)

---

## 📝 מה צריך להגדיר:

### אם אתה רוצה קבלה אוטומטית (ממליץ בחום!):

✅ **Zapier/Make.com** - הכי פשוט! 10 דקות הגדרה
   - Zapier: גרסה חינמית עד 100 tasks לחודש
   - Make.com: גרסה חינמית עד 1000 operations לחודש (יותר טוב!)

או

✅ **Gmail API** - אם אתה רוצה מלא אוטומציה ללא הגבלה
   - צריך פרויקט ב-Google Cloud
   - יותר מורכב אבל חזק יותר

---

## ⚡ בינתיים (בלי הגדרות):

אפשר להשתמש ב:
1. **כפתור הבוט 🤖** - העלה מועמד ידנית ואז לחץ על הבוט
2. **העלאת קבצים** - `/dashboard/upload` - גרור קבצי קורות חיים
3. **הוספה ידנית** - צור מועמד חדש וה-AI יעזור בתגיות

---

## 💡 טיפים:

1. **Make.com מומלץ יותר מ-Zapier** - תומך בעברית טוב יותר
2. **תבדוק את הפילטר** - ודא שהוא תופס "קורות חיים" בעברית
3. **בדוק logs** - ב-Zapier/Make תוכל לראות מה נשלח
4. **התחל עם Zapier** - הכי קל להתחיל

---

## 🆘 צריך עזרה?

אם אתה רוצה עזרה בהגדרה:
1. פתח Zapier/Make
2. תעשה screenshot של הבעיה
3. אספר לך בדיוק מה לעשות

**המערכת מוכנה לקבל קורות חיים! רק צריך לחבר את הזרם 🚀**
