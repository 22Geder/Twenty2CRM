# 🚀 TWENTY2CRM - מדריך הפעלה לעובדים

## 📋 תוכן עניינים
1. [התקנה והפעלה ראשונית](#התקנה-והפעלה-ראשונית)
2. [התחברות ראשונה](#התחברות-ראשונה)
3. [מדריך שימוש מהיר](#מדריך-שימוש-מהיר)
4. [גיבוי ושחזור](#גיבוי-ושחזור)
5. [תחזוקה שוטפת](#תחזוקה-שוטפת)
6. [פתרון בעיות](#פתרון-בעיות)

---

## 🎯 התקנה והפעלה ראשונית

### דרישות מערכת
- Windows 10/11 או Mac/Linux
- Node.js גרסה 18 ומעלה ([הורד כאן](https://nodejs.org/))
- דפדפן מודרני (Chrome/Firefox/Edge מומלץ)

### שלב 1: הפעלה ראשונית

```bash
# 1. פתח PowerShell/Terminal בתיקיית הפרויקט
cd crm-app

# 2. התקן dependencies (רק בפעם הראשונה)
npm install

# 3. הכן את בסיס הנתונים
npm run db:push

# 4. טען נתונים ראשוניים (תגיות, משתמשים)
node prisma/seed-production.js

# 5. הפעל את השרת
npm run dev
```

### שלב 2: גש למערכת
פתח דפדפן וגש ל: **http://localhost:3000**

---

## 🔐 התחברות ראשונה

### פרטי כניסה ראשוניים:
```
אימייל:    admin@twenty2crm.com
סיסמה:     Admin123!
```

⚠️ **חשוב מאוד:** שנה את הסיסמה מיד אחרי ההתחברות הראשונה!

### שינוי סיסמה:
1. התחבר עם הפרטים למעלה
2. לחץ על שם המשתמש בפינה הימנית העליונה
3. בחר "הגדרות" → "שנה סיסמה"
4. הזן סיסמה חזקה חדשה

---

## 📘 מדריך שימוש מהיר

### 1️⃣ הוספת מועמד
1. **דאשבורד** → **מועמדים** → **הוסף מועמד חדש**
2. מלא פרטים:
   - שם מלא ✅
   - טלפון ✅
   - אימייל ✅
   - תגיות (כישורים, ניסיון) ✅
3. שמור

### 2️⃣ הוספת משרה
1. **דאשבורד** → **משרות** → **הוסף משרה חדשה**
2. מלא פרטים:
   - כותרת משרה ✅
   - תיאור ✅
   - דרישות ✅
   - תגיות (כישורים נדרשים) ✅
3. **הפעל משרה** כדי להתחיל לקבל מועמדות

### 3️⃣ חיפוש מועמדים אוטומטי
כשתפתח משרה, המערכת **אוטומטית** תציג בצד:
- ✅ מועמדים עם תגיות תואמות
- ✅ מועמדים מה-21 ימים האחרונים
- ✅ ציון התאמה (%)
- ✅ פרטי קשר מלאים

### 4️⃣ שליחת הודעות המונית
מתוך דף משרה:
1. **לחץ "שלח SMS לכולם"** - שליחת הודעות SMS אוטומטית
2. **לחץ "שלח מייל לכולם"** - שליחת מיילים אוטומטית
3. אשר ו... זהו! המערכת שולחת הכל אוטומטית 🚀

---

## 💾 גיבוי ושחזור

### ⚡ גיבוי מהיר (יומי מומלץ)

#### Windows:
```powershell
# גיבוי
Copy-Item "crm-app\prisma\dev.db" "C:\Backups\CRM-$(Get-Date -Format 'yyyy-MM-dd').db"

# שחזור
Copy-Item "C:\Backups\CRM-2025-12-28.db" "crm-app\prisma\dev.db"
```

#### Mac/Linux:
```bash
# גיבוי
cp crm-app/prisma/dev.db ~/Backups/CRM-$(date +%Y-%m-%d).db

# שחזור
cp ~/Backups/CRM-2025-12-28.db crm-app/prisma/dev.db
```

### 🔄 גיבוי אוטומטי (מומלץ!)

#### יצירת סקריפט גיבוי אוטומטי:
צור קובץ `backup-crm.ps1` (Windows) או `backup-crm.sh` (Mac/Linux):

**Windows (`backup-crm.ps1`):**
```powershell
$backupDir = "C:\CRM-Backups"
$sourceDb = ".\crm-app\prisma\dev.db"
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupFile = "$backupDir\CRM-Backup_$date.db"

# צור תיקייה אם לא קיימת
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# העתק DB
Copy-Item $sourceDb $backupFile

# שמור רק 30 גיבויים אחרונים
Get-ChildItem $backupDir -Filter "*.db" | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip 30 | 
    Remove-Item

Write-Host "✅ Backup completed: $backupFile" -ForegroundColor Green
```

**Mac/Linux (`backup-crm.sh`):**
```bash
#!/bin/bash
BACKUP_DIR=~/CRM-Backups
SOURCE_DB=./crm-app/prisma/dev.db
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="$BACKUP_DIR/CRM-Backup_$DATE.db"

# צור תיקייה
mkdir -p $BACKUP_DIR

# העתק DB
cp $SOURCE_DB $BACKUP_FILE

# שמור רק 30 גיבויים אחרונים
ls -t $BACKUP_DIR/*.db | tail -n +31 | xargs rm -f

echo "✅ Backup completed: $BACKUP_FILE"
```

#### הגדרת גיבוי אוטומטי יומי:

**Windows (Task Scheduler):**
1. פתח **Task Scheduler**
2. Create Basic Task → "CRM Daily Backup"
3. Trigger: Daily, 23:00
4. Action: `powershell.exe -File C:\path\to\backup-crm.ps1`

**Mac (crontab):**
```bash
crontab -e
# הוסף שורה: כל יום בחצות
0 0 * * * ~/backup-crm.sh
```

**Linux (cron):**
```bash
sudo crontab -e
# הוסף שורה: כל יום בחצות
0 0 * * * /home/user/backup-crm.sh
```

---

## 🔧 תחזוקה שוטפת

### יומי:
- ✅ בדוק שהמערכת רצה (`http://localhost:3000`)
- ✅ ודא שהגיבוי האוטומטי רץ

### שבועי:
- ✅ בדוק שיש מספיק מקום לגיבויים (מחק ישנים)
- ✅ עדכן תגיות חדשות לפי צורך

### חודשי:
- ✅ גבה את התיקייה `/crm-app/prisma/dev.db` לכונן חיצוני
- ✅ בדוק שכל העובדים יודעים להשתמש במערכת

---

## 🆘 פתרון בעיות

### המערכת לא עולה?

```bash
# 1. בדוק שאין תהליך אחר על port 3000
# Windows:
netstat -ano | findstr :3000
# הרוג תהליך: taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# 2. הפעל מחדש
cd crm-app
npm run dev
```

### שכחתי את הסיסמה?
```bash
# אפס את סיסמת ה-Admin
cd crm-app
node prisma/seed-production.js
# סיסמה חדשה: Admin123!
```

### בסיס הנתונים התקלקל?
```bash
# שחזר מגיבוי (השתמש בגיבוי אחרון)
# Windows:
Copy-Item "C:\CRM-Backups\CRM-Backup_YYYY-MM-DD.db" "crm-app\prisma\dev.db" -Force

# Mac/Linux:
cp ~/CRM-Backups/CRM-Backup_YYYY-MM-DD.db crm-app/prisma/dev.db
```

### SMS/מיילים לא נשלחים?
ראה [SMS_EMAIL_SETUP.md](SMS_EMAIL_SETUP.md) להגדרות Twilio ו-SMTP.

---

## 📞 צור קשר ותמיכה

### בעיות טכניות?
1. בדוק [פתרון בעיות](#פתרון-בעיות) למעלה
2. צור גיבוי לפני כל פעולת תיקון
3. אם צריך עזרה - פנה למנהל המערכת

### רוצה תכונה חדשה?
פנה למנהל המערכת עם בקשה מפורטת.

---

## ✅ רשימת בדיקה להפעלה

לפני מסירה לעובדים, וודא:

- [ ] המערכת רצה על `http://localhost:3000`
- [ ] התחברות עם admin@twenty2crm.com עובדת
- [ ] יש 40+ תגיות במערכת
- [ ] יש מחלקות (פיתוח, מכירות, וכו')
- [ ] גיבוי אוטומטי מוגדר
- [ ] Twilio ו-SMTP מוגדרים (אם רוצים שליחת הודעות)
- [ ] העובדים קיבלו הדרכה

---

## 🎓 הדרכה מהירה לעובדים (5 דקות)

### 1. התחברות
- פתח: http://localhost:3000
- התחבר עם הפרטים שקיבלת

### 2. הוסף מועמד
- **מועמדים** → **+הוסף**
- מלא שם, טלפון, אימייל
- **בחר תגיות!** (חשוב!)

### 3. הוסף משרה
- **משרות** → **+הוסף**
- מלא פרטים + **בחר תגיות!**
- לחץ "פעילה" כדי להפעיל

### 4. שלח הודעות
- פתח משרה → ראה מועמדים מתאימים בצד
- לחץ "שלח SMS/מייל לכולם"
- זהו! 🎉

---

**🎉 מוכן לעבודה! בהצלחה! 🚀**
