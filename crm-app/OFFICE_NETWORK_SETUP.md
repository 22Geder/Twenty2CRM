# 🏢 הגדרת המערכת לרשת המשרדית - Twenty2CRM

## 📋 סקירה כללית
מדריך זה יעזור לך להגדיר את מערכת ה-CRM כך שתרוץ ברשת המשרדית שלך, עם שמירה קבועה של כל הקבצים.

---

## 🔧 שלב 1: הגדרת משתני סביבה

ערוך את קובץ `.env` והחלף את הערכים הבאים:

```env
# כתובת המערכת - החלף ל-IP המחשב שלך ברשת
NEXTAUTH_URL="http://192.168.1.XXX:3000"

# בסיס נתונים - נתיב קבוע בדיסק
DATABASE_URL="file:C:/Twenty2CRM-Data/database.db"

# תיקיית קבצים קבועה (חדש)
UPLOADS_PATH="C:/Twenty2CRM-Data/uploads"
```

---

## 📁 שלב 2: יצירת תיקיות אחסון קבועות

הרץ את הפקודות הבאות ב-PowerShell כמנהל:

```powershell
# יצירת תיקיית נתונים ראשית
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data"

# יצירת תיקיות משנה
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data\database"
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data\uploads"
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data\uploads\resumes"
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data\uploads\candidates"
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data\uploads\images"
New-Item -ItemType Directory -Force -Path "C:\Twenty2CRM-Data\backups"

# הגדרת הרשאות לכל משתמשי הרשת
icacls "C:\Twenty2CRM-Data" /grant:r "Everyone:(OI)(CI)F" /T
```

---

## 🌐 שלב 3: פתיחת פורט בחומת האש

```powershell
# פתיחת פורט 3000 לרשת
New-NetFirewallRule -DisplayName "Twenty2CRM" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## 🚀 שלב 4: הרצת המערכת

### אפשרות 1: הרצה רגילה (development)
```powershell
cd "C:\One Drive 22GETHER\OneDrive\Desktop\TWENTY2CRM\crm-app"
npm run dev -- -H 0.0.0.0
```

### אפשרות 2: הרצה כשירות (production - מומלץ)
```powershell
# בניית הגרסה
npm run build

# הרצה
npm run start -- -H 0.0.0.0 -p 3000
```

---

## 💻 שלב 5: גישה מהמחשבים במשרד

אחרי ההפעלה, כל מחשב ברשת יכול לגשת בכתובת:
```
http://[IP-של-השרת]:3000
```

לדוגמה: `http://192.168.1.100:3000`

### איך למצוא את ה-IP שלך:
```powershell
ipconfig | Select-String "IPv4"
```

---

## 🔄 שלב 6: גיבוי אוטומטי (מומלץ)

צור Task Scheduler לגיבוי יומי:

```powershell
# שמור כ backup-script.ps1
$date = Get-Date -Format "yyyy-MM-dd"
$backupPath = "C:\Twenty2CRM-Data\backups\backup-$date"

# יצירת גיבוי
New-Item -ItemType Directory -Force -Path $backupPath

# העתקת בסיס הנתונים
Copy-Item "C:\Twenty2CRM-Data\database.db" "$backupPath\database.db"

# העתקת הקבצים
Copy-Item "C:\Twenty2CRM-Data\uploads" "$backupPath\uploads" -Recurse

# מחיקת גיבויים ישנים (יותר מ-30 יום)
Get-ChildItem "C:\Twenty2CRM-Data\backups" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse
```

---

## 📊 מבנה התיקיות הסופי

```
C:\Twenty2CRM-Data\
├── database.db          # בסיס הנתונים
├── uploads\
│   ├── resumes\         # קורות חיים
│   ├── candidates\      # מסמכים של מועמדים
│   └── images\          # תמונות
└── backups\             # גיבויים יומיים
    ├── backup-2026-02-08\
    └── backup-2026-02-07\
```

---

## ⚠️ חשוב לדעת

1. **הקבצים נשמרים לצמיתות** בתיקייה `C:\Twenty2CRM-Data`
2. **גם אם תעדכן את הקוד** - הנתונים לא יימחקו
3. **גבה את התיקייה** באופן קבוע לכונן חיצוני או ענן
4. **אל תמחק** את תיקיית `C:\Twenty2CRM-Data`

---

## 🆘 פתרון בעיות

### המערכת לא עולה
```powershell
# בדוק שהפורט פנוי
netstat -ano | findstr :3000
```

### אין גישה מהרשת
```powershell
# בדוק את החומת אש
Get-NetFirewallRule -DisplayName "Twenty2CRM"
```

### בעיית הרשאות
```powershell
# הרץ שוב את הגדרת ההרשאות
icacls "C:\Twenty2CRM-Data" /grant:r "Everyone:(OI)(CI)F" /T
```
