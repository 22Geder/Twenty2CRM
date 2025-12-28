# 🎯 TWENTY2CRM - מערכת ניהול גיוס מתקדמת

<div dir="rtl">

## 📋 סקירה מהירה

TWENTY2CRM היא מערכת ניהול גיוס (ATS - Applicant Tracking System) מלאה ומתקדמת המיועדת לחברות ישראליות.

### ✨ תכונות עיקריות:

- 👥 **ניהול מועמדים** - מעקב מלא אחר מועמדים, קורות חיים, ופרטי קשר
- 💼 **ניהול משרות** - יצירה וניהול של משרות פתוחות
- 🎯 **התאמה אוטומטית** - מציאת מועמדים מתאימים לפי תגיות
- 📱 **שליחת הודעות המונית** - SMS ומיילים אוטומטיים דרך Twilio
- 🏷️ **41 תגיות מקצועיות** - כישורים, תפקידים, שפות ועוד
- 📊 **דאשבורד מתקדם** - סטטיסטיקות וניתוח נתונים
- 🔐 **ניהול משתמשים** - הרשאות ותפקידים
- 💾 **גיבוי אוטומטי** - שמירה מלאה של כל הנתונים

---

## 🚀 התחלה מהירה (5 דקות)

### 1. התקנה

```bash
# התקן Node.js אם אין לך (https://nodejs.org/)

# התקן dependencies
cd crm-app
npm install

# הכן בסיס נתונים
npm run db:push

# טען נתונים ראשוניים
node prisma/seed-production.js

# הפעל את המערכת
npm run dev
```

### 2. התחבר למערכת

פתח דפדפן: **http://localhost:3000**

**פרטי כניסה:**
- אימייל: `admin@twenty2crm.com`
- סיסמה: `Admin123!`

⚠️ **חשוב:** שנה סיסמה מיד אחרי התחברות ראשונה!

---

## 📚 מדריכים מפורטים

### למשתמשים:
📖 **[מדריך התחלה מהיר](GETTING_STARTED.md)** - הכל שצריך כדי להתחיל לעבוד

### למנהלי מערכת:
📧 **[הגדרת SMS ומיילים](SMS_EMAIL_SETUP.md)** - Twilio ו-SMTP

---

## 🏗️ מבנה המערכת

```
TWENTY2CRM/
├── crm-app/                    # אפליקציית Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/     # ממשק ראשי
│   │   │   ├── api/           # API endpoints
│   │   │   └── login/         # התחברות
│   │   ├── components/        # קומפוננטות UI
│   │   └── lib/               # עזרים
│   ├── prisma/
│   │   ├── schema.prisma      # מבנה DB
│   │   ├── dev.db            # בסיס נתונים ⚠️ גבה!
│   │   └── seed-production.js # טעינת נתונים
│   └── .env                   # הגדרות
├── backup-crm.ps1             # גיבוי Windows
├── backup-crm.sh              # גיבוי Mac/Linux
└── GETTING_STARTED.md         # מדריך מלא
```

---

## 💾 גיבוי - **חשוב מאוד!**

### גיבוי ידני (מהיר):

**Windows:**
```powershell
Copy-Item "crm-app\prisma\dev.db" "C:\Backups\CRM-$(Get-Date -Format 'yyyy-MM-dd').db"
```

**Mac/Linux:**
```bash
cp crm-app/prisma/dev.db ~/Backups/CRM-$(date +%Y-%m-%d).db
```

### גיבוי אוטומטי (מומלץ!):

**Windows:**
```powershell
# הרץ פעם אחת לבדיקה
.\backup-crm.ps1

# להגדרת גיבוי אוטומטי יומי - ראה GETTING_STARTED.md
```

**Mac/Linux:**
```bash
# הרץ פעם אחת לבדיקה
chmod +x backup-crm.sh
./backup-crm.sh

# להגדרת גיבוי אוטומטי יומי - ראה GETTING_STARTED.md
```

---

## 🎓 איך להשתמש?

### 1️⃣ הוסף מועמד
```
דאשבורד → מועמדים → +הוסף חדש
↓
מלא: שם, טלפון, אימייל
↓
בחר תגיות (חשוב!) → שמור
```

### 2️⃣ הוסף משרה
```
דאשבורד → משרות → +הוסף חדשה
↓
מלא: כותרת, תיאור, דרישות
↓
בחר תגיות (חשוב!) → הפעל משרה
```

### 3️⃣ מצא מועמדים מתאימים
```
פתח משרה → בצד ימין רואים אוטומטית:
✅ מועמדים עם תגיות תואמות (21 ימים אחרונים)
✅ ציון התאמה באחוזים
✅ פרטי קשר מלאים
```

### 4️⃣ שלח הודעות
```
בדף המשרה:
↓
לחץ "שלח SMS לכולם" או "שלח מייל לכולם"
↓
אשר → המערכת שולחת אוטומטית! 🚀
```

---

## 🏷️ תגיות במערכת (41 תגיות)

### כישורי טכנולוגיה:
- JavaScript, TypeScript, React, Node.js
- Python, Java, C#, SQL
- MongoDB, AWS, Azure, Docker, Kubernetes

### תפקידים:
- Full Stack, Frontend, Backend
- DevOps, QA, UI/UX, Product Manager

### רמות ניסיון:
- Junior (0-2 שנים)
- Mid-Level (2-5 שנים)
- Senior (5+ שנים)
- Team Lead

### תחומי עניין:
- Fintech, Healthcare, E-commerce
- Gaming, Cybersecurity

### כישורים רכים:
- עבודת צוות, הובלה, תקשורת

### שפות:
- עברית, אנגלית, רוסית, ערבית

---

## 🔧 טכנולוגיות

- **Frontend:** Next.js 16, React, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** SQLite (Prisma ORM)
- **Auth:** NextAuth.js
- **SMS:** Twilio
- **Email:** Nodemailer (SMTP)

---

## 📊 מה כלול?

✅ **41 תגיות מקצועיות** מוכנות לשימוש
✅ **5 מחלקות** (פיתוח, מכירות, שירות, HR, ניהול)
✅ **משתמש Admin** מוגדר מראש
✅ **מעסיק לדוגמה** להתחלה מהירה
✅ **API מלא** לשליחת SMS ומיילים
✅ **סקריפטים לגיבוי** Windows + Mac/Linux
✅ **מדריכים מפורטים** לכל השימושים

---

## 🆘 צריך עזרה?

### בעיות נפוצות:

**המערכת לא עולה?**
```bash
# נקה port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# הפעל מחדש
npm run dev
```

**שכחתי סיסמה?**
```bash
node prisma/seed-production.js
# סיסמה חדשה: Admin123!
```

**נתונים נמחקו?**
```bash
# שחזר מגיבוי
Copy-Item "C:\Backups\CRM-YYYY-MM-DD.db" "crm-app\prisma\dev.db"
```

---

## ⚠️ חשוב לזכור!

1. **גבה כל יום!** קובץ `dev.db` מכיל את כל הנתונים
2. **שנה סיסמת Admin** מיד בהתחברות ראשונה
3. **השתמש בתגיות** - זה הבסיס להתאמה אוטומטית
4. **הגדר Twilio ו-SMTP** לשליחת הודעות אוטומטית
5. **תן הרשאות נכונות** לעובדים

---

## 🎉 מוכן לעבודה!

המערכת מוכנה ל-100% לשימוש יומיומי!

**שאלות?** ראה [GETTING_STARTED.md](GETTING_STARTED.md) למדריך מפורט.

**בהצלחה! 🚀**

---

<div align="center">

**TWENTY2CRM** © 2025 | Made with ❤️ in Israel

</div>

</div>
